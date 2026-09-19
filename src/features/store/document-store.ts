import { createStore } from 'zustand/vanilla'
import type { ValidatedResumeDocument } from '../../core/schema'

/**
 * Why another tab touched the open draft. Never a reason to silently overwrite
 * the local copy (state-management.md §6, D4) — the UI surfaces it, the user decides.
 */
export interface ExternalNotice {
  kind: 'updated' | 'deleted'
  /** Epoch milliseconds of the remote change. */
  at: number
}

export interface DocumentState {
  /** Canonical source of truth for the whole app. Null = no draft open. */
  document: ValidatedResumeDocument | null
  /** Persisted draft id; null while the current document has never been saved. */
  draftId: string | null
  dirty: boolean
  lastSavedAt: number | null
  externalNotice: ExternalNotice | null
}

export function createEmptyDocumentState(): DocumentState {
  return { document: null, draftId: null, dirty: false, lastSavedAt: null, externalNotice: null }
}

export const documentStore = createStore<DocumentState>()(() => createEmptyDocumentState())
