import { db } from './db'
import type { DraftRecord, DraftSummary, AssetRecord } from './types'
import { StorageFullError, InvalidDataError } from './errors'
import { validateResumeDocument, type ValidatedResumeDocument } from '../core/schema'

/**
 * Generates a unique ID for a new draft.
 * Uses crypto.randomUUID() if available (modern browsers), falls back to timestamp+random.
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older environments or non-secure contexts
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Saves a ResumeDocument as a draft in IndexedDB.
 * If the document has an existing ID in the record structure, it updates; otherwise creates new.
 *
 * @param doc The validated resume document content.
 * @param existingId Optional existing draft ID. If provided, updates that draft.
 * @returns The saved DraftRecord including generated/updated metadata.
 */
export async function saveDraft(
  doc: ValidatedResumeDocument,
  existingId?: string,
): Promise<DraftRecord> {
  const id = existingId || generateId()

  // Defensive validation before saving to DB
  // Even though input is typed as ValidatedResumeDocument, runtime check ensures integrity
  const validation = validateResumeDocument(doc)
  if (!validation.success) {
    throw new InvalidDataError(JSON.stringify(validation.error))
  }

  const record: DraftRecord = {
    ...validation.data,
    id,
    updatedAt: Date.now(),
  }

  try {
    await db.drafts.put(record)
    return record
  } catch (error: unknown) {
    // Detect QuotaExceededError
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      throw new StorageFullError()
    }
    // Re-throw other errors
    throw error
  }
}

/**
 * Loads a single draft by ID.
 * Validates the loaded data against the current schema to detect corruption or version mismatches early.
 */
export async function loadDraft(id: string): Promise<DraftRecord | null> {
  const record = await db.drafts.get(id)
  if (!record) {
    return null
  }

  // Verify integrity of loaded data
  // We strip storage-specific fields (id, updatedAt) for validation purposes
  const { id: _, updatedAt: __, ...docContent } = record

  const validation = validateResumeDocument(docContent)
  if (!validation.success) {
    // In a real app, this might trigger a recovery flow or warn user.
    // For now, we treat corrupted data as invalid and return null or throw.
    // Throwing is safer to prevent UI from rendering broken state.
    throw new InvalidDataError(`Corrupted draft ${id}: ${JSON.stringify(validation.error)}`)
  }

  return record
}

/**
 * Lists all drafts sorted by most recently updated first.
 * Returns lightweight summaries to avoid loading full documents unnecessarily.
 */
export async function listDrafts(): Promise<DraftSummary[]> {
  const records = await db.drafts.orderBy('updatedAt').reverse().toArray()

  return records.map((r) => ({
    id: r.id,
    title: r.meta?.title || r.basics.name || 'Untitled CV',
    updatedAt: r.updatedAt,
  }))
}

/**
 * Deletes a draft by ID.
 */
export async function deleteDraft(id: string): Promise<void> {
  await db.drafts.delete(id)
}

/**
 * Wipes ALL data from the database (drafts and assets).
 * Used for "Delete All Data" feature (FR-108).
 */
export async function wipeAllData(): Promise<void> {
  await db.transaction('rw', db.drafts, db.assets, async () => {
    await db.drafts.clear()
    await db.assets.clear()
  })
}

// --- Asset Operations ---

/**
 * Saves a photo blob associated with an asset reference.
 */
export async function saveAsset(ref: string, blob: Blob): Promise<void> {
  const record: AssetRecord = { ref, blob }
  try {
    await db.assets.put(record)
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      throw new StorageFullError()
    }
    throw error
  }
}

/**
 * Loads a photo blob by asset reference.
 */
export async function loadAsset(ref: string): Promise<Blob | null> {
  const record = await db.assets.get(ref)
  return record ? record.blob : null
}

/**
 * Deletes an asset by reference.
 */
export async function deleteAsset(ref: string): Promise<void> {
  await db.assets.delete(ref)
}
