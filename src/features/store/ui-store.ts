import { createStore } from 'zustand/vanilla'
import type { ResumeMeta } from '../../core/schema'
import type { StorageStatus } from '../../storage'

export type ResumeMode = ResumeMeta['mode']

export interface UiState {
  /**
   * Mirror of the open document's `meta.mode` — the truth lives per draft in
   * the document, never here. `setMode()` updates both in one action.
   */
  mode: ResumeMode
  locale: 'id' | 'en'
  /** Identifier of the currently open side panel/drawer, if any. */
  openPanel: string | null
  /** Direct passthrough of `AutoSaveManager` status callbacks. */
  autosaveStatus: StorageStatus
  /** Human-facing storage message in Bahasa Indonesia (D21 tone); null = nothing to say. */
  storageMessage: string | null
  /**
   * Task 12: the ATS photo notice was dismissed. In-memory only — "once per
   * session" means the lifetime of this tab (a reload may show it again,
   * which is harmless for guidance). Never persisted, never part of the draft.
   */
  photoNoticeDismissed: boolean
}

export const uiStore = createStore<UiState>()(() => ({
  mode: 'ats',
  locale: 'id',
  openPanel: null,
  autosaveStatus: 'idle',
  storageMessage: null,
  photoNoticeDismissed: false,
}))
