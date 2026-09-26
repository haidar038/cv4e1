import type { ValidatedResumeDocument } from './schema'
import type { SectionKey } from './view-models'

/**
 * Section-completeness progress: ResumeDocument → filled/total/percent.
 *
 * PURE FUNCTIONS. No side effects, no DOM access. The form's progress
 * indicator reads this (never the open accordion panel), so collapsing a
 * section cannot move the number — only editing data can.
 *
 * A section counts as filled when at least one field the user typed carries
 * a non-blank value. This is a *completeness* count, never a quality score
 * (glossary.md §6 forbids CV scores).
 */

export type ProgressSectionKey = 'basics' | SectionKey

export const PROGRESS_SECTIONS: readonly ProgressSectionKey[] = [
  'basics',
  'education',
  'experience',
  'organizations',
  'projects',
  'skills',
  'certifications',
]

export interface SectionProgress {
  filled: number
  total: number
  /** Rounded 0–100. */
  percent: number
  filledKeys: ProgressSectionKey[]
}

function hasText(value: string | undefined): boolean {
  return value !== undefined && value.trim() !== ''
}

function isBasicsFilled(doc: ValidatedResumeDocument): boolean {
  const basics = doc.basics
  if (hasText(basics.name)) return true
  if (hasText(basics.headline)) return true
  if (hasText(basics.email)) return true
  if (hasText(basics.phone)) return true
  if (hasText(basics.location)) return true
  if (hasText(basics.summary)) return true
  if ((basics.links ?? []).some((link) => hasText(link.url))) return true
  if (hasText(basics.photo?.assetRef)) return true
  return false
}

function isSectionFilled(doc: ValidatedResumeDocument, key: ProgressSectionKey): boolean {
  if (key === 'basics') return isBasicsFilled(doc)
  switch (key) {
    case 'education':
      return (doc.sections.education ?? []).some((item) => hasText(item.institution))
    case 'experience':
    case 'organizations':
      return (doc.sections[key] ?? []).some((item) => hasText(item.organization))
    case 'projects':
      return (doc.sections.projects ?? []).some((item) => hasText(item.name))
    case 'skills':
      return (doc.sections.skills ?? []).some(
        (group) => hasText(group.category) || (group.items ?? []).some((item) => hasText(item)),
      )
    case 'certifications':
      return (doc.sections.certifications ?? []).some((item) => hasText(item.name))
  }
}

export function getSectionProgress(doc: ValidatedResumeDocument): SectionProgress {
  const filledKeys = PROGRESS_SECTIONS.filter((key) => isSectionFilled(doc, key))
  const total = PROGRESS_SECTIONS.length
  const filled = filledKeys.length
  return { filled, total, percent: Math.round((filled / total) * 100), filledKeys }
}
