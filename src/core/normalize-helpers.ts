/**
 * Helper functions for normalization: date formatting, GPA display, section building.
 * Separated from normalize.ts to stay within editor size limits.
 */

import type { ValidatedResumeDocument } from './schema'
import type {
  ContactDisplay,
  EducationDisplay,
  ExperienceDisplay,
  ProjectDisplay,
  SkillGroupDisplay,
  CertificationDisplay,
  OrderedSection,
  SectionKey,
  GpaDisplay,
  DateRangeDisplay,
} from './view-models'

const MONTHS_ID = [
  '',
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

const STATUS_LABELS_ID: Record<string, string> = {
  graduated: 'Lulus',
  'awaiting-ceremony': 'Lulus (menunggu wisuda)',
  'in-progress': 'Sedang menempuh',
  discontinued: 'Berhenti',
}

export const SECTION_HEADINGS_ID: Record<SectionKey, string> = {
  education: 'PENDIDIKAN',
  experience: 'PENGALAMAN KERJA',
  organizations: 'ORGANISASI',
  projects: 'PROYEK',
  skills: 'KEAHLIAN',
  certifications: 'SERTIFIKASI',
}

export function formatDate(
  partialDate: string | undefined,
  locale: 'id' | 'en',
): string | undefined {
  if (!partialDate) return undefined
  const parts = partialDate.split('-')
  const year = parts[0]
  const monthPart = parts.length >= 2 ? parts[1] : undefined
  const monthNum = monthPart ? parseInt(monthPart, 10) : undefined
  const day = parts.length >= 3 ? parts[2] : undefined

  if (locale === 'id') {
    if (monthNum && MONTHS_ID[monthNum]) {
      return day ? `${day} ${MONTHS_ID[monthNum]} ${year}` : `${MONTHS_ID[monthNum]} ${year}`
    }
    return year
  }
  const enMonths = [
    '',
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]
  if (monthNum && enMonths[monthNum]) {
    return day ? `${enMonths[monthNum]} ${day}, ${year}` : `${enMonths[monthNum]} ${year}`
  }
  return year
}

export function buildDateRange(
  startDate: string | undefined,
  endDate: string | undefined,
  current: boolean | undefined,
  locale: 'id' | 'en',
): DateRangeDisplay {
  const display: DateRangeDisplay = {}
  if (startDate) {
    display.rawStart = startDate
    const formattedStart = formatDate(startDate, locale)
    // Optional display fields stay ABSENT rather than `undefined` (exactOptionalPropertyTypes).
    if (formattedStart !== undefined) display.start = formattedStart
  }
  if (current) {
    display.end = locale === 'id' ? 'Sekarang' : 'Present'
  } else if (endDate) {
    display.rawEnd = endDate
    const formattedEnd = formatDate(endDate, locale)
    if (formattedEnd !== undefined) display.end = formattedEnd
  }
  return display
}

export function formatGpa(gpa: { value: string; scale: string; label: string }): GpaDisplay {
  return {
    formatted: `${gpa.value} / ${gpa.scale}`,
    value: gpa.value,
    scale: gpa.scale,
    label: gpa.label,
  }
}

export function buildContactDisplay(doc: ValidatedResumeDocument): ContactDisplay {
  const contacts: ContactDisplay = {}
  if (doc.basics.email !== undefined) contacts.email = doc.basics.email
  if (doc.basics.phone !== undefined) contacts.phone = doc.basics.phone
  if (doc.basics.location !== undefined) contacts.location = doc.basics.location
  return contacts
}

export function buildEducationDisplays(
  items: ValidatedResumeDocument['sections']['education'],
  locale: 'id' | 'en',
): EducationDisplay[] {
  if (!items) return []
  return items.map((item) => {
    const display: EducationDisplay = {
      institution: item.institution,
      dates: buildDateRange(item.startDate, item.endDate, false, locale),
      highlights: item.highlights ?? [],
    }
    if (item.degree !== undefined) display.degree = item.degree
    if (item.field !== undefined) display.field = item.field
    if (item.location !== undefined) display.location = item.location
    const status = item.status ? (STATUS_LABELS_ID[item.status] ?? item.status) : undefined
    if (status !== undefined) display.status = status
    if (item.gpa) display.gpa = formatGpa(item.gpa)
    return display
  })
}

export function buildExperienceDisplays(
  items:
    | ValidatedResumeDocument['sections']['experience']
    | ValidatedResumeDocument['sections']['organizations'],
  locale: 'id' | 'en',
): ExperienceDisplay[] {
  if (!items) return []
  return items.map((item) => {
    const display: ExperienceDisplay = {
      organization: item.organization,
      dates: buildDateRange(item.startDate, item.endDate, item.current, locale),
      highlights: item.highlights ?? [],
    }
    if (item.role !== undefined) display.role = item.role
    if (item.employmentType !== undefined) display.employmentType = item.employmentType
    if (item.location !== undefined) display.location = item.location
    return display
  })
}

export function buildProjectDisplays(
  items: ValidatedResumeDocument['sections']['projects'],
  locale: 'id' | 'en',
): ProjectDisplay[] {
  if (!items) return []
  return items.map((item) => {
    const display: ProjectDisplay = {
      name: item.name,
      dates: buildDateRange(item.startDate, item.endDate, false, locale),
      highlights: item.highlights ?? [],
    }
    if (item.role !== undefined) display.role = item.role
    if (item.context !== undefined) display.context = item.context
    if (item.url !== undefined) display.url = item.url
    return display
  })
}

export function buildSkillDisplays(
  items: ValidatedResumeDocument['sections']['skills'],
): SkillGroupDisplay[] {
  if (!items) return []
  return items.map((group) => {
    const display: SkillGroupDisplay = { items: group.items }
    if (group.category !== undefined) display.category = group.category
    return display
  })
}

export function buildCertificationDisplays(
  items: ValidatedResumeDocument['sections']['certifications'],
  locale: 'id' | 'en',
): CertificationDisplay[] {
  if (!items) return []
  return items.map((item) => {
    const display: CertificationDisplay = { name: item.name }
    if (item.issuer !== undefined) display.issuer = item.issuer
    if (item.url !== undefined) display.url = item.url
    const issueDate = item.issueDate ? formatDate(item.issueDate, locale) : undefined
    if (issueDate !== undefined) display.issueDate = issueDate
    return display
  })
}

type AnySectionItem =
  EducationDisplay | ExperienceDisplay | ProjectDisplay | SkillGroupDisplay | CertificationDisplay

export function buildOrderedSections(
  doc: ValidatedResumeDocument,
  locale: 'id' | 'en',
): OrderedSection<AnySectionItem>[] {
  const sections = doc.sections
  const order = doc.sectionOrder ?? [
    'education',
    'experience',
    'organizations',
    'projects',
    'skills',
    'certifications',
  ]
  const builders: Record<SectionKey, () => AnySectionItem[]> = {
    education: () => buildEducationDisplays(sections.education, locale),
    experience: () => buildExperienceDisplays(sections.experience, locale),
    organizations: () => buildExperienceDisplays(sections.organizations, locale),
    projects: () => buildProjectDisplays(sections.projects, locale),
    skills: () => buildSkillDisplays(sections.skills),
    certifications: () => buildCertificationDisplays(sections.certifications, locale),
  }
  const result: OrderedSection<AnySectionItem>[] = []
  for (const key of order) {
    const builder = builders[key as SectionKey]
    if (!builder) continue
    const items = builder()
    if (items.length === 0) continue
    result.push({ key: key as SectionKey, heading: SECTION_HEADINGS_ID[key as SectionKey], items })
  }
  return result
}
