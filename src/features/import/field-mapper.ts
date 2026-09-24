/**
 * Deterministic text → candidate-document mapper (T3a, ADR-0008).
 *
 * Pure functions, no DOM, no network, no LLM: every value in the output
 * is copied verbatim from the input text. Anything the heuristics cannot
 * place lands in `unmapped` — never in `_unknownFields` (ADR-0009 pagar)
 * and never silently dropped (C-T9).
 *
 * Prompt-injection text inside a CV (AB-4) is inert by construction:
 * there is no instruction-follower here, only pattern matching.
 */
import {
  createEmptyResumeDocument,
  type ResumeSections,
  type ValidatedResumeDocument,
} from '../../core/schema'

export type CandidateSource = 'text-layer' | 'ocr'
export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface FieldCandidate {
  /** Dotted path for the review UI, e.g. `basics.email`, `experience[0].organization`. */
  readonly field: string
  readonly value: string
  readonly source: CandidateSource
  readonly confidence: ConfidenceLevel
  readonly note: string
}

export interface MappedCandidate {
  readonly document: ValidatedResumeDocument
  readonly fields: readonly FieldCandidate[]
  /** Source lines nothing consumed (capped count, full total reported). */
  readonly unmapped: readonly string[]
  readonly unmappedTotal: number
}

type SectionName =
  | 'summary'
  | 'education'
  | 'experience'
  | 'organizations'
  | 'projects'
  | 'skills'
  | 'certifications'

const HEADER_SYNONYMS: Readonly<Record<SectionName, readonly string[]>> = {
  summary: [
    'tentang saya',
    'ringkasan',
    'profil',
    'tentang',
    'profile',
    'summary',
    'about',
    'objective',
    'tujuan karir',
  ],
  education: [
    'pendidikan',
    'education',
    'riwayat pendidikan',
    'educational background',
    'latar pendidikan',
  ],
  experience: [
    'pengalaman kerja',
    'pengalaman',
    'experience',
    'work experience',
    'employment history',
    'riwayat pekerjaan',
  ],
  organizations: [
    'organisasi',
    'pengalaman organisasi',
    'organizations',
    'organisation',
    'community',
    'volunteer experience',
  ],
  projects: ['proyek', 'projects', 'project', 'portofolio', 'portfolio', 'karya'],
  skills: [
    'keahlian',
    'keterampilan',
    'skills',
    'skill',
    'kemampuan',
    'technical skills',
    'kompetensi',
  ],
  certifications: [
    'sertifikasi',
    'sertifikat',
    'certifications',
    'certification',
    'lisensi',
    'licenses',
  ],
}

const MAX_LINES = 500
const MAX_UNMAPPED_STORED = 50
const MAX_BASICS_LINE = 120
const MAX_ITEM_LINE = 200
const MAX_HIGHLIGHT_LINE = 400
const MAX_SUMMARY = 1200
const MAX_SKILL_ITEM = 60
const MAX_SKILL_ITEMS = 40
const MAX_HIGHLIGHTS_EXPERIENCE = 12
const MAX_HIGHLIGHTS_EDUCATION = 10
const MAX_HIGHLIGHTS_PROJECT = 10

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]+/
const URL_RE = /https?:\/\/[^\s)]+/
const PHONE_RE = /\+?\d[\d\s\-().]{5,}\d/
const MONTHS_ID: Record<string, string> = {
  januari: '01',
  februari: '02',
  maret: '03',
  april: '04',
  mei: '05',
  juni: '06',
  juli: '07',
  agustus: '08',
  september: '09',
  oktober: '10',
  november: '11',
  desember: '12',
}
const MONTHS_EN: Record<string, string> = {
  january: '01',
  february: '02',
  march: '03',
  april: '04',
  may: '05',
  june: '06',
  july: '07',
  august: '08',
  september: '09',
  october: '10',
  november: '11',
  december: '12',
}
const CURRENT_WORDS = ['sekarang', 'saat ini', 'present', 'current', 'now', 'ongoing']

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Exact header hit first, then contains-hit; null when the line is content. */
function detectHeader(line: string): { section: SectionName; exact: boolean } | null {
  const norm = normalize(line)
  if (norm === '' || norm.length > 40) return null
  for (const [section, synonyms] of Object.entries(HEADER_SYNONYMS) as [
    SectionName,
    readonly string[],
  ][]) {
    if (synonyms.some((s) => normalize(s) === norm)) return { section, exact: true }
  }
  for (const [section, synonyms] of Object.entries(HEADER_SYNONYMS) as [
    SectionName,
    readonly string[],
  ][]) {
    if (synonyms.some((s) => norm.includes(normalize(s)))) return { section, exact: false }
  }
  return null
}

function validYear(year: number): boolean {
  return year >= 1950 && year <= 2100
}

/** Parses one date endpoint into partial-date string; null when unrecognized. */
export function parsePartialDate(raw: string): string | null {
  const text = raw.trim()
  const yearOnly = /^(\d{4})$/.exec(text)
  if (yearOnly !== null) {
    const year = Number(yearOnly[1])
    return validYear(year) ? String(year) : null
  }
  const yearMonth = /^(\d{4})-(\d{2})$/.exec(text)
  if (yearMonth !== null) {
    const year = Number(yearMonth[1])
    const month = Number(yearMonth[2])
    return validYear(year) && month >= 1 && month <= 12 ? text : null
  }
  const named = /^([a-z]+)\s+(\d{4})$/i.exec(text)
  if (named !== null) {
    const year = Number(named[2])
    const month =
      MONTHS_ID[named[1]?.toLowerCase() ?? ''] ?? MONTHS_EN[named[1]?.toLowerCase() ?? '']
    if (month !== undefined && validYear(year)) return `${year}-${month}`
  }
  return null
}

export interface DateRange {
  readonly start?: string
  readonly current: boolean
  readonly end?: string
}

export interface TrailingRange {
  /** Head with the date range peeled off. */
  readonly head: string
  readonly range: DateRange
}

/**
 * Splits a trailing date range off a line at the RIGHTMOST separator, so
 * earlier dashes (employer — role) are never mistaken for the range dash.
 * A year trailing the head (", 2023") is peeled as the start.
 */
export function splitTrailingRange(line: string): TrailingRange | null {
  const match = /^(.+)\s+[–—-]\s+([^–—-]+)$/.exec(line.trim())
  if (match === null || match[1] === undefined || match[2] === undefined) return null
  let head = match[1].trim()
  const tail = match[2].trim()
  if (head === '' || tail === '') return null
  const tailLower = tail.toLowerCase()
  if (CURRENT_WORDS.some((w) => tailLower.includes(w))) {
    const peeled = peelTrailingYear(head)
    return {
      head: peeled.head,
      range: { ...(peeled.year !== null ? { start: peeled.year } : {}), current: true },
    }
  }
  const end = parsePartialDate(tail)
  if (end === null) return null
  const directStart = parsePartialDate(head)
  if (directStart !== null) return { head: '', range: { start: directStart, current: false, end } }
  const peeled = peelTrailingYear(head)
  return {
    head: peeled.head,
    range: { ...(peeled.year !== null ? { start: peeled.year } : {}), current: false, end },
  }
}

function peelTrailingYear(head: string): { head: string; year: string | null } {
  const direct = parsePartialDate(head)
  // The whole head is a date ("September 2019"): bare date line, nothing left.
  if (direct !== null && !head.includes(',')) return { head: '', year: direct }
  // Comma-bound year ("PT Contoh — Staf, 2023"): peel it, keep the rest —
  // unless the rest is a bare month ("September, 2019": the whole head is the date).
  const match = /^(.+),\s+(\d{4})$/.exec(head)
  if (match !== null && match[1] !== undefined && match[2] !== undefined) {
    const year = Number(match[2])
    if (validYear(year)) {
      const rest = match[1].trim()
      const restMonth = MONTHS_ID[rest.toLowerCase()] ?? MONTHS_EN[rest.toLowerCase()]
      if (restMonth !== undefined) return { head: '', year: `${match[2]}-${restMonth}` }
      return { head: rest, year: match[2] }
    }
  }
  return { head, year: null }
}

/** Finds a trailing date range ("X – Y") in a line; null when absent. */
export function parseDateRange(line: string): DateRange | null {
  return splitTrailingRange(line)?.range ?? null
}

/** Splits "Organization — Role" style lines on a dash/pipe separator. */
function splitHeadline(line: string): { head: string; tail: string } | null {
  const match = /^(.+?)\s+[–—\-|:]\s+(.+)$/.exec(line.trim())
  if (match === null || match[1] === undefined || match[2] === undefined) return null
  return { head: match[1].trim(), tail: match[2].trim() }
}

interface ItemDraft {
  head: string
  tail: string
  start?: string
  current: boolean
  end?: string
  highlights: string[]
}

function digitCount(line: string): number {
  return (line.match(/\d/g) ?? []).length
}

/**
 * Maps extracted text to a candidate document. Conservative by design:
 * a line becomes a field only when a pattern fires; otherwise unmapped.
 */
export function mapTextToCandidate(text: string, source: CandidateSource): MappedCandidate {
  const document = createEmptyResumeDocument()
  const fields: FieldCandidate[] = []
  const unmapped: string[] = []
  let unmappedTotal = 0
  const pushUnmapped = (line: string): void => {
    unmappedTotal += 1
    if (unmapped.length < MAX_UNMAPPED_STORED) unmapped.push(line)
  }
  const pushField = (
    field: string,
    value: string,
    confidence: ConfidenceLevel,
    note: string,
  ): void => {
    fields.push({ field, value, source, confidence, note })
  }

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l !== '')
    .slice(0, MAX_LINES)

  // Pass 1 — contacts anywhere (first hit wins; email is the reliable one).
  let emailTaken = false
  let phoneTaken = false
  for (const line of lines) {
    if (!emailTaken) {
      const email = EMAIL_RE.exec(line)?.[0]
      if (email !== undefined && email.length <= MAX_BASICS_LINE) {
        document.basics.email = email
        pushField('basics.email', email, 'high', 'pola email')
        emailTaken = true
      }
    }
    if (!phoneTaken) {
      const phone = PHONE_RE.exec(line)?.[0]
      // Dates are digit-dense; a phone needs enough digits beyond a date —
      // and anything that parses as a bare date range is a date, not a phone.
      if (
        phone !== undefined &&
        digitCount(phone) >= 7 &&
        phone.length <= 40 &&
        splitTrailingRange(phone)?.head !== ''
      ) {
        document.basics.phone = phone.trim()
        pushField('basics.phone', phone.trim(), 'medium', 'pola telepon')
        phoneTaken = true
      }
    }
    const url = URL_RE.exec(line)?.[0]
    if (url !== undefined && url.length <= 500 && (document.basics.links ?? []).length < 10) {
      const links = [...(document.basics.links ?? []), { url }]
      document.basics.links = links
      pushField(`basics.links[${links.length - 1}].url`, url, 'medium', 'pola tautan')
    }
  }

  // Pass 2 — walk sections.
  let section: SectionName | null = null
  let preHeaderLines: string[] = []
  let summaryLines: string[] = []
  // `as` defeats initializer narrowing: every write happens inside the
  // closures below, so the loop body must see the declared (wide) type.
  let currentItem: ItemDraft | null = null as ItemDraft | null
  let currentItemSection:
    'education' | 'experience' | 'organizations' | 'projects' | 'certifications' | null = null as
    'education' | 'experience' | 'organizations' | 'projects' | 'certifications' | null
  const skillLines: string[] = []

  const flushItem = (): void => {
    if (currentItem === null || currentItemSection === null) return
    const draft = currentItem
    currentItem = null
    const sectionKey = currentItemSection
    const head = draft.head
    const tail = draft.tail
    if (sectionKey === 'education') {
      const items = [...(document.sections.education ?? [])]
      items.push({
        institution: head,
        ...(tail !== '' ? { degree: tail } : {}),
        ...(draft.start !== undefined ? { startDate: draft.start } : {}),
        ...(draft.end !== undefined ? { endDate: draft.end } : {}),
        ...(draft.highlights.length > 0
          ? { highlights: draft.highlights.slice(0, MAX_HIGHLIGHTS_EDUCATION) }
          : {}),
      })
      document.sections.education = items
      pushField(
        `education[${items.length - 1}].institution`,
        head,
        draft.start !== undefined ? 'medium' : 'low',
        'baris berheader pendidikan',
      )
    } else if (sectionKey === 'experience' || sectionKey === 'organizations') {
      const key = sectionKey
      // Both sections share the experience item shape; the explicit element
      // type keeps the union slot (`document.sections[key]`) checkable.
      const items: NonNullable<ResumeSections['experience']>[number][] = [
        ...(document.sections[key] ?? []),
      ]
      items.push({
        organization: head,
        ...(tail !== '' ? { role: tail } : {}),
        ...(draft.start !== undefined ? { startDate: draft.start } : {}),
        ...(draft.end !== undefined ? { endDate: draft.end } : {}),
        // Schema requires boolean (default false applies at validation);
        // the review UI only surfaces it when true.
        current: draft.current,
        ...(draft.highlights.length > 0
          ? { highlights: draft.highlights.slice(0, MAX_HIGHLIGHTS_EXPERIENCE) }
          : {}),
      })
      document.sections[key] = items
      pushField(
        `${key}[${items.length - 1}].organization`,
        head,
        draft.start !== undefined ? 'medium' : 'low',
        'baris berheader pengalaman',
      )
    } else if (sectionKey === 'projects') {
      const items = [...(document.sections.projects ?? [])]
      items.push({
        name: head,
        ...(tail !== '' ? { role: tail } : {}),
        ...(draft.start !== undefined ? { startDate: draft.start } : {}),
        ...(draft.end !== undefined ? { endDate: draft.end } : {}),
        ...(draft.highlights.length > 0
          ? { highlights: draft.highlights.slice(0, MAX_HIGHLIGHTS_PROJECT) }
          : {}),
      })
      document.sections.projects = items
      pushField(
        `projects[${items.length - 1}].name`,
        head,
        draft.start !== undefined ? 'medium' : 'low',
        'baris berheader proyek',
      )
    } else {
      const items = [...(document.sections.certifications ?? [])]
      items.push({
        name: head,
        ...(tail !== '' ? { issuer: tail } : {}),
      })
      document.sections.certifications = items
      pushField(
        `certifications[${items.length - 1}].name`,
        head,
        'low',
        'baris berheader sertifikasi',
      )
    }
  }

  const startItem = (
    line: string,
    target: 'education' | 'experience' | 'organizations' | 'projects' | 'certifications',
    trailing: TrailingRange | null,
  ): void => {
    flushItem()
    // Strip a trailing date range from the head line when present.
    let headLine = line
    let start: string | undefined
    let end: string | undefined
    let current = false
    if (trailing !== null && trailing.head !== '') {
      headLine = trailing.head
      start = trailing.range.start
      end = trailing.range.end
      current = trailing.range.current
    }
    const split = splitHeadline(headLine)
    const head = (split?.head ?? headLine).trim()
    const tail = (split?.tail ?? '').trim()
    if (head === '' || head.length > MAX_ITEM_LINE || tail.length > MAX_ITEM_LINE) {
      pushUnmapped(line)
      return
    }
    currentItem = {
      head,
      tail,
      ...(start !== undefined ? { start } : {}),
      current,
      ...(end !== undefined ? { end } : {}),
      highlights: [],
    }
    currentItemSection = target
  }

  for (const line of lines) {
    const header = detectHeader(line)
    if (header !== null) {
      flushItem()
      if (section === 'summary') {
        const summary = summaryLines.join(' ')
        if (summary !== '' && summary.length <= MAX_SUMMARY) {
          document.basics.summary = summary
          pushField('basics.summary', summary, 'medium', 'blok berheader ringkasan')
        } else if (summary !== '') {
          pushUnmapped(summary)
        }
        summaryLines = []
      }
      section = header.section
      continue
    }
    if (section === null) {
      preHeaderLines.push(line)
      continue
    }
    if (section === 'summary') {
      summaryLines.push(line)
      continue
    }
    if (section === 'skills') {
      skillLines.push(line)
      continue
    }
    if (
      section === 'education' ||
      section === 'experience' ||
      section === 'organizations' ||
      section === 'projects' ||
      section === 'certifications'
    ) {
      const trailing = splitTrailingRange(line)
      const split = splitHeadline(line)
      if (trailing !== null || split !== null) {
        if (trailing !== null && trailing.head === '') {
          // Bare date line: complete the open item when there is one,
          // otherwise leave the date out (never an item of its own).
          if (currentItem !== null) {
            if (currentItem.start === undefined && trailing.range.start !== undefined) {
              currentItem.start = trailing.range.start
            }
            if (
              !currentItem.current &&
              currentItem.end === undefined &&
              trailing.range.end !== undefined
            ) {
              currentItem.end = trailing.range.end
            }
            if (trailing.range.current) currentItem.current = true
          } else {
            pushUnmapped(line)
          }
          continue
        }
        startItem(line, section, trailing)
        continue
      }
      if (currentItem !== null && line.length <= MAX_HIGHLIGHT_LINE) {
        currentItem.highlights.push(line.replace(/^[•\-*]\s*/, ''))
        continue
      }
      // Undated, separator-free lines are weak item heads — except pure
      // date/number debris, which belongs nowhere.
      if (currentItem === null && line.length <= MAX_ITEM_LINE && /^[\d\s–—\-/.,()]+$/.test(line)) {
        pushUnmapped(line)
        continue
      }
      if (currentItem === null && line.length <= MAX_ITEM_LINE) {
        // Undated head line: still an item, lowest confidence.
        startItem(line, section, null)
        continue
      }
      pushUnmapped(line)
      continue
    }
  }
  flushItem()
  if (section === 'summary' && summaryLines.length > 0) {
    const summary = summaryLines.join(' ')
    if (summary !== '' && summary.length <= MAX_SUMMARY) {
      document.basics.summary = summary
      pushField('basics.summary', summary, 'medium', 'blok berheader ringkasan')
    } else if (summary !== '') {
      pushUnmapped(summary)
    }
  }

  // Pre-header: first digit-free line is the name, the next is the headline.
  // Contact-looking lines never qualify (an email is not a headline).
  const nameLines = preHeaderLines.filter(
    (l) =>
      digitCount(l) === 0 && !l.includes('@') && !l.includes('://') && l.length <= MAX_BASICS_LINE,
  )
  if (nameLines[0] !== undefined && document.basics.name === '') {
    document.basics.name = nameLines[0]
    pushField('basics.name', nameLines[0], 'low', 'baris pertama tanpa angka')
  }
  if (nameLines[1] !== undefined && document.basics.headline === undefined) {
    document.basics.headline = nameLines[1]
    pushField('basics.headline', nameLines[1], 'low', 'baris kedua tanpa angka')
  }
  for (const line of preHeaderLines) {
    if (line !== nameLines[0] && line !== nameLines[1]) pushUnmapped(line)
  }

  // Skills: split delimited lines into items.
  const skillItems: string[] = []
  for (const line of skillLines) {
    const parts = line
      .split(/[,;•|/]/)
      .map((p) => p.replace(/^[•\-*]\s*/, '').trim())
      .filter((p) => p !== '')
    for (const part of parts) {
      if (part.length <= MAX_SKILL_ITEM && skillItems.length < MAX_SKILL_ITEMS)
        skillItems.push(part)
      else pushUnmapped(part)
    }
  }
  if (skillItems.length > 0) {
    document.sections.skills = [{ items: skillItems }]
    pushField('skills[0].items', `${skillItems.length} item`, 'medium', 'daftar berheader keahlian')
  } else if (skillLines.length > 0) {
    for (const line of skillLines) pushUnmapped(line)
  }

  return { document, fields, unmapped, unmappedTotal }
}
