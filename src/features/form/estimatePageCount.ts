import type { SectionKey } from '../../core/view-models'

/**
 * Rough page estimate behind the soft two-page warning (F-C6). This is a
 * heuristic over content volume, NOT real print pagination — real pagination
 * only exists once the renderer lands (Task 10/12), at which point this can be
 * refined or replaced. Constants are documented and conservative so the
 * warning errs toward silence: it is help, not a verdict (glossary §6 — no CV
 * scores, ever; this counts pages of content, never quality).
 */

/** Approximate characters of dense body text on one A4 page. */
export const ESTIMATED_CHARS_PER_PAGE = 3000

/** Approximate characters one item heading (name/role/dates line) occupies. */
export const ESTIMATED_CHARS_PER_ITEM_HEADING = 80

/** Above this estimated page count the soft warning appears. */
export const SOFT_WARNING_PAGES = 2

const SECTION_KEYS: SectionKey[] = [
  'education',
  'experience',
  'organizations',
  'projects',
  'skills',
  'certifications',
]

function contentChars(value: unknown): number {
  if (typeof value === 'string') return value.length
  if (Array.isArray(value)) {
    return value.reduce<number>((sum, item) => sum + contentChars(item), 0)
  }
  if (value !== null && typeof value === 'object') {
    return Object.values(value).reduce<number>((sum, item) => sum + contentChars(item), 0)
  }
  return 0
}

export interface PageEstimateDocument {
  basics: { summary?: string | undefined; headline?: string | undefined }
  sections: { [K in SectionKey]?: readonly unknown[] | undefined }
}

/** Estimated page count of the given document, minimum 1. Pure. */
export function estimateCvPages(doc: PageEstimateDocument): number {
  let chars = (doc.basics.summary?.length ?? 0) + (doc.basics.headline?.length ?? 0)
  let headings = 0
  for (const key of SECTION_KEYS) {
    const items = doc.sections[key]
    if (items === undefined) continue
    headings += items.length
    for (const item of items) chars += contentChars(item)
  }
  const total = chars + headings * ESTIMATED_CHARS_PER_ITEM_HEADING
  return Math.max(1, Math.ceil(total / ESTIMATED_CHARS_PER_PAGE))
}
