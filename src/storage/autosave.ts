import type { ValidatedResumeDocument } from '../core/schema'
import { saveDraft, loadDraft } from './repository'
import type { AutoSaveCallbacks, StorageStatus } from './types'
import { StorageBlockedError, StorageFullError } from './errors'

/**
 * Manages automatic saving of the active resume document to IndexedDB.
 *
 * Design Decisions Applied:
 * - D1: Debounce interval is 2000ms after idle.
 * - Immediate flush on tab hide/close (visibilitychange/beforeunload).
 * - Graceful degradation if storage is blocked or full.
 */
export class AutoSaveManager {
  private timerId: ReturnType<typeof setTimeout> | null = null
  private readonly debounceMs = 2000
  private callbacks: AutoSaveCallbacks
  private currentDoc: ValidatedResumeDocument | null = null
  private currentId: string | undefined
  private isStorageAvailable: boolean = true
  private lastSavedSnapshot: string = '' // To avoid redundant writes

  constructor(callbacks: AutoSaveCallbacks = {}) {
    this.callbacks = callbacks

    // Bind lifecycle events for immediate flush
    if (typeof window !== 'undefined') {
      window.addEventListener('visibilitychange', this.handleVisibilityChange)
      window.addEventListener('beforeunload', this.handleBeforeUnload)

      // Initial check for storage availability
      this.checkStorageAvailability()
    }
  }

  /**
   * Checks if IndexedDB is accessible.
   * In private/incognito modes, some browsers block it entirely.
   */
  private async checkStorageAvailability() {
    try {
      // Attempt a dummy read/write cycle or just opening the DB
      await loadDraft('__availability_check__')
      this.isStorageAvailable = true
    } catch (error) {
      // If error is not "not found", it might be blocked
      if (error instanceof Error && !error.message.includes('Corrupted')) {
        // Heuristic: if we can't even access the store, assume blocked
        this.isStorageAvailable = false
        this.emitStatus('blocked')
        this.callbacks.onError?.(new StorageBlockedError())
      } else {
        this.isStorageAvailable = true // Not found is fine
      }
    }
  }

  /**
   * Registers the current document state for potential autosaving.
   * Call this whenever the user makes an edit in the UI layer.
   */
  public registerChange(doc: ValidatedResumeDocument, id?: string) {
    if (!this.isStorageAvailable) return

    this.currentDoc = doc
    this.currentId = id

    const snapshot = JSON.stringify(doc)
    if (snapshot === this.lastSavedSnapshot) {
      return // No actual change
    }

    this.scheduleSave()
  }

  private scheduleSave() {
    if (this.timerId) {
      clearTimeout(this.timerId)
    }

    this.emitStatus('saving')

    this.timerId = setTimeout(() => {
      this.performSave()
    }, this.debounceMs)
  }

  private async performSave() {
    if (!this.currentDoc || !this.isStorageAvailable) return

    try {
      const savedRecord = await saveDraft(this.currentDoc, this.currentId)
      this.currentId = savedRecord.id // Update ID if it was newly generated
      this.lastSavedSnapshot = JSON.stringify(savedRecord) // Store normalized snapshot

      this.emitStatus('saved')
      this.callbacks.onSuccess?.(savedRecord.id)

      // Notify other tabs via BroadcastChannel (implemented in sync.ts)
      // For now, we just log success. Integration with Sync module happens here.
    } catch (error) {
      if (error instanceof StorageFullError) {
        this.emitStatus('error')
        this.callbacks.onError?.(error)
        // Do NOT clear memory state. User must export manually.
      } else if (error instanceof StorageBlockedError) {
        this.isStorageAvailable = false
        this.emitStatus('blocked')
        this.callbacks.onError?.(error)
      } else {
        console.error('Unexpected autosave failure:', error)
        this.emitStatus('error')
        this.callbacks.onError?.(error instanceof Error ? error : new Error(String(error)))
      }
    } finally {
      this.timerId = null
    }
  }

  /**
   * Forces an immediate save, bypassing debounce.
   * Used when closing the app or switching drafts.
   */
  public async flush() {
    if (this.timerId) {
      clearTimeout(this.timerId)
      this.timerId = null
    }
    await this.performSave()
  }

  /**
   * Forgets the held document and drops any pending save without writing.
   * Used after a full wipe (Task 15): the unload handlers below would
   * otherwise resurrect the just-deleted document into the empty database
   * during the reload — the wipe must stay wiped.
   */
  public discardPending() {
    if (this.timerId) {
      clearTimeout(this.timerId)
      this.timerId = null
    }
    this.currentDoc = null
    this.currentId = undefined
  }

  private handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      this.flush()
    }
  }

  private handleBeforeUnload = () => {
    // Note: Async operations in beforeunload are unreliable.
    // We attempt a synchronous-like trigger or rely on visibilitychange which fires earlier.
    // Modern best practice: use visibilitychange for the heavy lifting.
    // This handler acts as a safety net.
    if (this.currentDoc && this.isStorageAvailable) {
      // Fire and forget. The browser might kill us mid-flight, but visibilitychange usually catches it first.
      this.performSave()
    }
  }

  private emitStatus(status: StorageStatus) {
    this.callbacks.onStatusChange?.(status)
  }

  public destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('visibilitychange', this.handleVisibilityChange)
      window.removeEventListener('beforeunload', this.handleBeforeUnload)
    }
    if (this.timerId) {
      clearTimeout(this.timerId)
    }
  }
}
