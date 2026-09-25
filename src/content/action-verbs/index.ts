import rawCatalog from './id.json'
import rawCatalogEn from './en.json'

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

/** English categories for the separate EN catalog (ADR-0012, FR-702). */
export type VerbCategoryEn =
  'Managerial' | 'Technical' | 'Analytical' | 'Creative' | 'Communication' | 'Operational'

/**
 * Mirrors `LocaleKey` (src/content/microcopy/id.ts) locally: content/ keeps
 * its zero-dependency boundary, and the union is structurally identical, so
 * features/ consumers can pass the ui-store locale directly.
 */
export type CatalogLocale = 'id' | 'en'

export type CatalogSectionKey =
  'education' | 'experience' | 'organizations' | 'projects' | 'skills' | 'certifications'

export interface ActionVerbEntry {
  verb: string
  category: VerbCategory
  applicableSections: CatalogSectionKey[]
  /** Impact-oriented pattern with [placeholders] the user fills in — never a finished sentence. */
  examplePhrase: string
}

/** English entry: same shape, own verbs, categories, and example phrases (ADR-0012). */
export interface ActionVerbEntryEn {
  verb: string
  category: VerbCategoryEn
  applicableSections: CatalogSectionKey[]
  /** Impact-oriented pattern with [placeholders] the user fills in — never a finished sentence. */
  examplePhrase: string
}

/** Either catalog's entry — the panel renders both through the same shape. */
export type AnyActionVerbEntry = ActionVerbEntry | ActionVerbEntryEn

/**
 * Shape is enforced at runtime by `action-verbs.test.ts` (content/ cannot
 * import zod without breaking its zero-dependency boundary).
 */
export const actionVerbs = rawCatalog as ActionVerbEntry[]

/**
 * Separate English catalog (ADR-0012, FR-702): independently authored verbs
 * and phrases, same section mapping as the Indonesian catalog so the
 * suggestion UI keeps parity across locales. Static JSON bundle like the ID
 * catalog — FR-206 holds for English too.
 */
export const actionVerbsEn = rawCatalogEn as ActionVerbEntryEn[]

export function getAllVerbs(locale: CatalogLocale = 'id'): readonly AnyActionVerbEntry[] {
  return locale === 'en' ? actionVerbsEn : actionVerbs
}

/** Entries with an empty `applicableSections` are naturally excluded here. */
export function getVerbsForSection(
  section: CatalogSectionKey,
  locale: CatalogLocale = 'id',
): readonly AnyActionVerbEntry[] {
  return getAllVerbs(locale).filter((entry) => entry.applicableSections.includes(section))
}

export function getVerbCategories(
  locale: CatalogLocale = 'id',
): readonly (VerbCategory | VerbCategoryEn)[] {
  return [...new Set(getAllVerbs(locale).map((entry) => entry.category))]
}
