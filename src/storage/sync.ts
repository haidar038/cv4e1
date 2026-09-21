/**
 * Multi-tab synchronization using BroadcastChannel API.
 *
 * Design Decisions Applied:
 * - D4: BroadcastChannel + last-write-wins with warning.
 *
 * This module handles communication between tabs of the same origin.
 * It does NOT persist data; it only notifies other tabs that data has changed.
 */

export interface SyncMessageBase {
  timestamp: number
}

export type SyncMessage =
  | (SyncMessageBase & {
      type: 'draft_updated' | 'draft_deleted'
      draftId: string
    })
  | (SyncMessageBase & {
      /** Task 15: every local trace is gone — tabs reset to the empty condition. */
      type: 'data_wiped'
    })

type SyncCallback = (message: SyncMessage) => void

const CHANNEL_NAME = 'cv4every1-sync'

let channel: BroadcastChannel | null = null
const listeners = new Set<SyncCallback>()

/**
 * Initializes the BroadcastChannel. Safe to call multiple times.
 * Falls back gracefully if BroadcastChannel is not supported (very old browsers).
 */
export function initSync() {
  if (channel) return // Already initialized

  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(CHANNEL_NAME)
    channel.onmessage = (event: MessageEvent<SyncMessage>) => {
      const message = event.data
      // Notify all registered listeners in this tab
      listeners.forEach((cb) => cb(message))
    }
  } else {
    console.warn('BroadcastChannel not supported. Multi-tab sync disabled.')
  }
}

/**
 * Sends a sync notification to other tabs.
 * Should be called AFTER a successful save/delete operation in IndexedDB.
 */
export function notifyTabs(type: 'draft_updated' | 'draft_deleted', draftId: string) {
  if (!channel) return

  const message: SyncMessage = {
    type,
    draftId,
    timestamp: Date.now(),
  }

  try {
    channel.postMessage(message)
  } catch (error) {
    // PostMessage can fail if payload is too large or non-serializable,
    // but our message is simple JSON. Log and ignore for resilience.
    console.error('Failed to broadcast sync message:', error)
  }
}

/**
 * Broadcasts a completed full wipe (Task 15). Receiving tabs reset to the
 * empty condition instead of reloading. Uses the same allowlisted diagnostic
 * literal as `notifyTabs` (NFR-011 — no new console message).
 */
export function notifyDataWiped() {
  if (!channel) return

  const message: SyncMessage = {
    type: 'data_wiped',
    timestamp: Date.now(),
  }

  try {
    channel.postMessage(message)
  } catch (error) {
    console.error('Failed to broadcast sync message:', error)
  }
}

/**
 * Registers a callback to listen for changes from other tabs.
 * Returns an unsubscribe function.
 */
export function onExternalUpdate(callback: SyncCallback): () => void {
  listeners.add(callback)

  // Ensure channel is initialized when first listener attaches
  initSync()

  return () => {
    listeners.delete(callback)
  }
}

/**
 * Cleans up resources. Call on app teardown.
 */
export function destroySync() {
  if (channel) {
    channel.close()
    channel = null
  }
  listeners.clear()
}
