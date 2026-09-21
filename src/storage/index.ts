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
export {
  initSync,
  notifyTabs,
  notifyDataWiped,
  onExternalUpdate,
  destroySync,
  type SyncMessage,
} from './sync'

// Full local wipe: IndexedDB + localStorage + Cache Storage (Task 15, FR-108).
export {
  wipeLocalData,
  clearIndexedDBStores,
  WIPE_KEY_PREFIX,
  WIPE_PRECACHE_NAME,
  type WipeDeps,
  type WipeReport,
  type WipeStepName,
  type WipeStepResult,
} from './wipe'

// Persistent-storage request (F-G4): best-effort eviction protection.
export { requestPersistentStorage, type PersistNavigator } from './persist'
