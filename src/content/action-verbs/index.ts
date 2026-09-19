import rawCatalog from './id.json'

/**
 * Action Verbs Catalog loader (Pilar 3, FR-205/FR-206, decision D16).
 *
 * content/ may import NOTHING (architecture-overview.md §5), so the key
 * unions below mirror canonical types locally. The section union is
 * structurally identical to `SectionKey` in src/core/view-models.ts, so
 * features/ consumers can pass core values directly. Consistency between the
 * two unions is exercised by the features layer in Task 13b.
 *
 * The catalog is a static JSON bundle: zero network requests, zero API keys,
 * and it can never invent facts (vision.md P5) — it only suggests verbs and
 * patterns; the user keeps writing.
 */

export type VerbCategory =
  'Manajerial' | 'Teknis' | 'Analitis' | 'Kreatif' | 'Komunikasi' | 'Operasional'

export type CatalogSectionKey =
  'education' | 'experience' | 'organizations' | 'projects' | 'skills' | 'certifications'

export interface ActionVerbEntry {
  verb: string
  category: VerbCategory
  applicableSections: CatalogSectionKey[]
  /** Impact-oriented pattern with [placeholders] the user fills in — never a finished sentence. */
  examplePhrase: string
}

/**
 * Shape is enforced at runtime by `action-verbs.test.ts` (content/ cannot
 * import zod without breaking its zero-dependency boundary).
 */
export const actionVerbs = rawCatalog as ActionVerbEntry[]

export function getAllVerbs(): readonly ActionVerbEntry[] {
  return actionVerbs
}

/** Entries with an empty `applicableSections` are naturally excluded here. */
export function getVerbsForSection(section: CatalogSectionKey): readonly ActionVerbEntry[] {
  return actionVerbs.filter((entry) => entry.applicableSections.includes(section))
}

export function getVerbCategories(): readonly VerbCategory[] {
  return [...new Set(actionVerbs.map((entry) => entry.category))]
}
