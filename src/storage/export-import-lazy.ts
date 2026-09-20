/**
 * Lazy access to the import/export pipeline (FR-104..FR-107).
 *
 * The pipeline — envelope parsing, migration chaining, full Zod validation —
 * is only needed on an explicit user action (export/import click), not while
 * typing. Splitting it moves the migration chain and one Zod schema copy out
 * of the initial JS chunk; the main Zod schema copy stays there because
 * autosave and draft loading validate on every keystroke (see
 * performance-budget.md §4 for the honest breakdown).
 *
 * Callers (store actions, DraftPanel) import from this module instead of
 * `export-import.ts` directly; the boundary checker's `import('…')` pattern
 * keeps the dynamic edge visible to `bun run check:boundaries`.
 */

import type { ValidatedResumeDocument } from '../core/schema'
import { FORMAT_VERSION, type ExportKind } from './export-import-types'

export type { ExportKind } from './export-import-types'

/**
 * Serializes a validated ResumeDocument into the portable .cv4e.json envelope
 * string. Loads the pipeline chunk on first use.
 */
export async function exportResumeLazy(
  doc: ValidatedResumeDocument,
  kind: ExportKind = 'resume',
): Promise<string> {
  const { exportResume } = await import('./export-import')
  return exportResume(doc, kind)
}

/**
 * Deserializes and validates a .cv4e.json string into a ValidatedResumeDocument.
 * Throws ImportError subclasses on failure (same contract as the sync module).
 */
export async function importResumeLazy(jsonString: string): Promise<ValidatedResumeDocument> {
  const { importResume } = await import('./export-import')
  return importResume(jsonString)
}

/** Current portable-format version, needed by callers before loading the chunk. */
export const FORMAT_VERSION_LAZY = FORMAT_VERSION
