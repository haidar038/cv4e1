/**
 * Storage Layer Public API.
 *
 * Exposes all necessary functions and types for interacting with local persistence.
 */

export { db } from './db'
export type {
  DraftRecord,
  DraftSummary,
  AssetRecord,
  StorageStatus,
  AutoSaveCallbacks,
} from './types'
export { StorageError, StorageFullError, StorageBlockedError, InvalidDataError } from './errors'

// Repository Operations
export {
  saveDraft,
  loadDraft,
  listDrafts,
  deleteDraft,
  wipeAllData,
  saveAsset,
  loadAsset,
  deleteAsset,
} from './repository'

// Autosave Manager
export { AutoSaveManager } from './autosave'

// Multi-tab Sync
export { initSync, notifyTabs, onExternalUpdate, destroySync, type SyncMessage } from './sync'
