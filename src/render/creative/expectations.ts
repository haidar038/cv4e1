import type {
  CertificationDisplay,
  CreativeViewModel,
  EducationDisplay,
  ExperienceDisplay,
  OrderedSection,
  ProjectDisplay,
  SkillGroupDisplay,
} from '../../core/view-models'
import { dateRangeText } from '../ats/sections/display'
import { firstOutOfOrderText, normalizeExtractedText } from '../ats/expectations'

export { firstOutOfOrderText, normalizeExtractedText }

/**
 * Ordered display strings the Creative renderer must emit for a view model.
 *
 * Companion of render/ats/expectations.ts with the creative reading order:
 * the sidebar (photo → contacts → links → skills) is emitted before the main
 * column (name → headline → summary → remaining sections in view-model
 * order). The photo contributes no text. Reusing the pure ats display
 * compositions (dateRangeText) and the shared helpers keeps both renderers'
 * expectations honest about identical field values (AC-001-a divergence test
 * compares these sets across modes).
 */
export function expectedTexts(vm: CreativeViewModel): string[] {
  const texts: string[] = []

  const contacts = [vm.contacts.email, vm.contacts.phone, vm.contacts.location].filter(
    (contact): contact is string => contact !== undefined,
  )
  const skills = vm.sections.find((section): section is OrderedSection<SkillGroupDisplay> =>
    isSkills(section),
  )

  // Sidebar — rendered only when it has content, so its texts are conditional.
  if (
    vm.photo !== undefined ||
    contacts.length > 0 ||
    vm.links.length > 0 ||
    skills !== undefined
  ) {
    texts.push(...contacts)
    for (const link of vm.links) {
      texts.push(link.label === link.url ? link.url : `${link.label}: ${link.url}`)
    }
    if (skills !== undefined) {
      texts.push(skills.heading)
      for (const item of skills.items) {
        if (item.category !== undefined) texts.push(item.category)
        texts.push(...item.items)
      }
    }
  }

  // Main column.
  if (vm.name !== '') texts.push(vm.name)
  if (vm.headline !== undefined) texts.push(vm.headline)
  if (vm.summary !== undefined) texts.push(vm.summary)
  for (const section of vm.sections) {
    if (isSkills(section)) continue
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

function isSkills(
  section: OrderedSection<
    EducationDisplay | ExperienceDisplay | ProjectDisplay | SkillGroupDisplay | CertificationDisplay
  >,
): boolean {
  return section.key === 'skills'
}
