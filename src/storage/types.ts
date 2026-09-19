/**
 * Types for the storage layer.
 */

import type { ValidatedResumeDocument } from '../core/schema'

export interface DraftRecord extends ValidatedResumeDocument {
  /** Unique identifier for the draft. Generated if not present on creation. */
  id: string
  /** Timestamp of last modification in milliseconds since epoch. */
  updatedAt: number
}

/**
 * Lightweight summary for list views to avoid loading full documents unnecessarily.
 */
export interface DraftSummary {
  id: string
  title: string // Derived from meta.title or basics.name
  updatedAt: number
}

export interface AssetRecord {
  ref: string // Matches basics.photo.assetRef
  blob: Blob
}

export type StorageStatus = 'idle' | 'saving' | 'saved' | 'error' | 'blocked'

export interface AutoSaveCallbacks {
  onSuccess?: (draftId: string) => void
  onError?: (error: Error) => void
  onStatusChange?: (status: StorageStatus) => void
}
