/**
 * Types for the portable .cv4e.json format.
 * See docs/04-data/import-export-spec.md §3.
 */

import type { ValidatedResumeDocument } from '../core/schema'

export const FORMAT_ID = 'cv4every1' as const
export const FORMAT_VERSION = '1.0.0' as const

export type ExportKind = 'resume' | 'backup'

/**
 * The envelope wrapping a single resume document or a full backup.
 */
export interface ExportEnvelope {
  format: typeof FORMAT_ID
  kind: ExportKind
  formatVersion: typeof FORMAT_VERSION
  exportedAt: string // ISO 8601 timestamp
  data: ValidatedResumeDocument
}

/**
 * Discriminated union of possible import errors to allow precise UI messaging.
 */
export type ImportErrorReason =
  | 'NOT_JSON'
  | 'INVALID_ENVELOPE_STRUCTURE'
  | 'WRONG_FORMAT_ID'
  | 'UNSUPPORTED_KIND'
  | 'SCHEMA_TOO_NEW'
  | 'MIGRATION_FAILED'
  | 'VALIDATION_FAILED'

export class ImportError extends Error {
  readonly reason: ImportErrorReason
  readonly details?: unknown

  constructor(reason: ImportErrorReason, message: string, details?: unknown) {
    super(message)
    this.name = 'ImportError'
    this.reason = reason
    this.details = details
  }
}
