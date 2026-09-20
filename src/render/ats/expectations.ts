import type {
  ATSViewModel,
  CertificationDisplay,
  EducationDisplay,
  ExperienceDisplay,
  ProjectDisplay,
  SkillGroupDisplay,
} from '../../core/view-models'
import { dateRangeText } from './sections/display'

/**
 * Ordered display strings the ATS renderer must emit for a view model.
 *
 * Single source of extraction expectations for the node structural tests and
 * the e2e PDF gate (spike plan: expectations derive from the document itself,
 * never from hardcoded strings). The order mirrors the render order, so the
 * e2e gate can also assert reading order as a subsequence of extracted text.
 */
export function expectedTexts(vm: ATSViewModel): string[] {
  const texts: string[] = [vm.name]
  if (vm.headline !== undefined) texts.push(vm.headline)
  const contacts = [vm.contacts.email, vm.contacts.phone, vm.contacts.location]
  texts.push(...contacts.filter((contact): contact is string => contact !== undefined))
  for (const link of vm.links) {
    texts.push(link.label === link.url ? link.url : `${link.label}: ${link.url}`)
  }
  if (vm.summary !== undefined) texts.push(vm.summary)

  for (const section of vm.sections) {
    texts.push(section.heading)
    for (const item of section.items) {
      // buildOrderedSections guarantees the shape per key; the union is not
      // key-discriminated, so each branch narrows to its key's display type.
      switch (section.key) {
        case 'education': {
          const it = item as EducationDisplay
          texts.push(
            it.institution,
            ...[it.degree, it.field, it.location].filter((v): v is string => v !== undefined),
          )
          const dates = dateRangeText(it.dates)
          if (dates !== undefined) texts.push(dates)
          if (it.status !== undefined) texts.push(it.status)
          if (it.gpa !== undefined) texts.push(`${it.gpa.label}: ${it.gpa.formatted}`)
          texts.push(...it.highlights)
          break
        }
        case 'experience':
        case 'organizations': {
          const it = item as ExperienceDisplay
          texts.push(it.organization)
          if (it.role !== undefined) texts.push(it.role)
          if (it.employmentType !== undefined) texts.push(it.employmentType)
          if (it.location !== undefined) texts.push(it.location)
          const dates = dateRangeText(it.dates)
          if (dates !== undefined) texts.push(dates)
          texts.push(...it.highlights)
          break
        }
        case 'projects': {
          const it = item as ProjectDisplay
          texts.push(it.name)
          if (it.role !== undefined) texts.push(it.role)
          if (it.context !== undefined) texts.push(it.context)
          const dates = dateRangeText(it.dates)
          if (dates !== undefined) texts.push(dates)
          if (it.url !== undefined) texts.push(it.url)
          texts.push(...it.highlights)
          break
        }
        case 'skills': {
          const it = item as SkillGroupDisplay
          if (it.category !== undefined) texts.push(it.category)
          texts.push(...it.items)
          break
        }
        case 'certifications': {
          const it = item as CertificationDisplay
          texts.push(it.name)
          if (it.issuer !== undefined) texts.push(it.issuer)
          if (it.issueDate !== undefined) texts.push(it.issueDate)
          if (it.url !== undefined) texts.push(it.url)
          break
        }
      }
    }
  }
  return texts
}

/** Collapses whitespace for tolerant `includes` checks against extracted text. */
export function normalizeExtractedText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/** True when `expected` appears in `text` as a whole-word-free substring check helper. */
export function containsNormalized(text: string, expected: string): boolean {
  return normalizeExtractedText(text)
    .toLowerCase()
    .includes(normalizeExtractedText(expected).toLowerCase())
}

/**
 * Walks `expected` in order through `text` (spike plan: reading order is
 * verified as a subsequence, not merely as set membership). Returns the
 * first missing/out-of-order string, or null when the whole sequence holds.
 */
export function firstOutOfOrderText(text: string, expected: readonly string[]): string | null {
  let cursor = 0
  const haystack = normalizeExtractedText(text).toLowerCase()
  for (const wanted of expected) {
    const needle = normalizeExtractedText(wanted).toLowerCase()
    const found = haystack.indexOf(needle, cursor)
    if (found < 0) return wanted
    cursor = found + needle.length
  }
  return null
}
