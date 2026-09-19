/**
 * Export and Import logic for .cv4e.json portable format.
 *
 * Requirements: FR-104, FR-105, FR-106, FR-107
 * Docs: docs/04-data/import-export-spec.md
 */

import type { ValidatedResumeDocument } from '../core/schema'
import { validateResumeDocument } from '../core/schema'
import { migrateDocument } from '../core/migration'
import {
  FORMAT_ID,
  FORMAT_VERSION,
  ImportError,
  type ExportEnvelope,
  type ExportKind,
} from './export-import-types'

/**
 * Serializes a validated ResumeDocument into the portable .cv4e.json envelope string.
 */
export function exportResume(doc: ValidatedResumeDocument, kind: ExportKind = 'resume'): string {
  const envelope: ExportEnvelope = {
    format: FORMAT_ID,
    kind,
    formatVersion: FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    data: doc,
  }

  return JSON.stringify(envelope, null, 2)
}

/**
 * Deserializes and validates a .cv4e.json string back into a ValidatedResumeDocument.
 * Handles schema migration automatically if the imported version is older than current.
 * Throws specific ImportError subclasses on failure.
 */
export function importResume(jsonString: string): ValidatedResumeDocument {
  // 1. Parse JSON safely
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonString)
  } catch (e) {
    throw new ImportError('NOT_JSON', 'File bukan JSON yang valid.', e)
  }

  // 2. Validate basic envelope structure
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new ImportError(
      'INVALID_ENVELOPE_STRUCTURE',
      'Struktur file tidak dikenali sebagai objek.',
    )
  }

  const obj = parsed as Record<string, unknown>

  if (obj.format !== FORMAT_ID) {
    throw new ImportError(
      'WRONG_FORMAT_ID',
      `Bukan file cv4every1 (ditemukan: ${String(obj.format)}).`,
    )
  }

  if (obj.kind !== 'resume' && obj.kind !== 'backup') {
    throw new ImportError('UNSUPPORTED_KIND', `Jenis ekspor tidak didukung: ${String(obj.kind)}.`)
  }

  if (!obj.data || typeof obj.data !== 'object') {
    throw new ImportError(
      'INVALID_ENVELOPE_STRUCTURE',
      'Field "data" hilang atau tidak valid dalam file.',
    )
  }

  // 3. Extract raw document data
  const rawData = obj.data as Record<string, unknown>

  // 4. Check schema version compatibility BEFORE attempting migration/validation
  const docVersion = String(rawData.schemaVersion ?? '')

  // Simple semver comparison: reject if major.minor.patch > current app version
  if (isNewerThan(docVersion, FORMAT_VERSION)) {
    throw new ImportError(
      'SCHEMA_TOO_NEW',
      `Versi skema (${docVersion}) lebih baru daripada aplikasi ini (${FORMAT_VERSION}). Perbarui aplikasi Anda.`,
    )
  }

  // 5. Migrate to latest version
  let migratedData: Record<string, unknown>
  try {
    migratedData = migrateDocument(rawData)
  } catch (e) {
    throw new ImportError(
      'MIGRATION_FAILED',
      `Gagal memigrasikan dokumen dari versi ${docVersion}.`,
      e,
    )
  }

  // 6. Final validation against current Zod schema
  const result = validateResumeDocument(migratedData)
  if (!result.success) {
    throw new ImportError(
      'VALIDATION_FAILED',
      'Dokumen gagal lolos validasi setelah migrasi.',
      result.error,
    )
  }

  return result.data
}

// --- Helper Utilities ---

function isNewerThan(a: string, b: string): boolean {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] ?? 0
    const nb = pb[i] ?? 0
    if (na > nb) return true
    if (na < nb) return false
  }
  return false
}
