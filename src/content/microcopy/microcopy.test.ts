import { describe, expect, it } from 'vitest'
import { microcopyEn, microcopyId, getMicrocopy, type MicrocopyPack } from './id'
import { microcopyEnDraft, withIdFallback } from './en'
import { actionVerbs, actionVerbsEn } from '../action-verbs/index'

/**
 * Collects every user-facing string from the content module so the forbidden
 * phrases check (glossary.md §6) covers all of it, present and future.
 */
function collectStrings(value: unknown, into: string[]): void {
  if (typeof value === 'string') {
    into.push(value)
    return
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, into)
    return
  }
  if (value !== null && typeof value === 'object') {
    for (const item of Object.values(value)) collectStrings(item, into)
  }
}

const FORBIDDEN_PHRASES = [
  'ats-compliant',
  'dijamin lolos ats',
  'ats score',
  'sepenuhnya aman',
  'ai-powered',
  'otomatis meningkatkan',
] as const

/** English counterparts of the glossary §6 ban — the EN pack must pass both lists. */
const FORBIDDEN_PHRASES_EN = [
  'guaranteed to pass',
  'fully secure',
  'completely safe',
  'automatically improve',
  'automatically boost',
] as const

describe('ATS photo notice', () => {
  it('uses the verbatim text and explains the reason, not just the rule', () => {
    expect(microcopyId.photo.atsHiddenNotice).toBe(
      'Versi ATS menyembunyikan foto agar aman dibaca sistem pelacak lamaran. Foto Anda tetap tersimpan dan muncul di versi Creative.',
    )
  })
})

describe('local-storage notice (Task 15, FR-109)', () => {
  it('uses the verbatim strategy text — never paraphrased', () => {
    expect(microcopyId.storageNotice.notice).toBe(
      'Data Anda tersimpan di peramban pada perangkat ini. Membersihkan data peramban, mode penyamaran, atau pembersihan otomatis dapat menghapus draft Anda. Gunakan Ekspor Draft untuk membuat salinan cadangan.',
    )
  })
})

describe('education status copy (localization-guide §3.2)', () => {
  it('provides exactly the four decided labels', () => {
    expect(Object.keys(microcopyId.educationStatus).sort()).toEqual([
      'awaiting-ceremony',
      'discontinued',
      'graduated',
      'in-progress',
    ])
    expect(microcopyId.educationStatus.graduated.label).toBe('Lulus')
    expect(microcopyId.educationStatus['awaiting-ceremony'].label).toBe('Lulus (menunggu wisuda)')
    expect(microcopyId.educationStatus['in-progress'].label).toBe('Sedang menempuh')
    expect(microcopyId.educationStatus.discontinued.label).toBe('Berhenti')
  })

  it('gives a writing example for every status', () => {
    for (const status of Object.values(microcopyId.educationStatus)) {
      expect(status.example.length).toBeGreaterThan(0)
    }
  })
})

describe('locale handling (FR-204, FR-702)', () => {
  it('returns the full pack for id and the English pack for en', () => {
    expect(getMicrocopy('id')).toBe(microcopyId)
    expect(getMicrocopy('en')).toBe(microcopyEn)
  })

  it('gpa hint shows the canonical scale format', () => {
    expect(microcopyId.gpa.hint).toContain('/ 4.00')
  })

  it('carries structural labels in English (never blank, never Indonesian)', () => {
    expect(microcopyEn.sections.education).toBe('Education')
    expect(microcopyEn.sections.experience).toBe('Experience')
    expect(microcopyEn.employmentType.internship).toBe('Internship')
    expect(microcopyEn.actions.addItem).toBe('Add')
    expect(microcopyEn.preview.regionLabel).toBe('CV preview')
    expect(microcopyEn.autosave.saved).toBe('Saved')
  })

  it('keeps the mode-announcement and locale-switcher templates with placeholders', () => {
    expect(microcopyEn.preview.modeStatus).toContain('{mode}')
    expect(microcopyEn.locale.status).toContain('{locale}')
  })

  it('keeps the stored-photo promise in the English ATS notice', () => {
    expect(microcopyEn.photo.atsHiddenNotice).toContain('stays stored')
  })
})

describe('forbidden phrases (glossary.md §6)', () => {
  it('never appear anywhere in the content module', () => {
    const strings: string[] = []
    collectStrings(microcopyId, strings)
    collectStrings(actionVerbs, strings)
    expect(strings.length).toBeGreaterThan(50)

    const haystack = strings.join('\n').toLowerCase()
    for (const phrase of FORBIDDEN_PHRASES) {
      expect(haystack).not.toContain(phrase)
    }
  })

  it('never appear in the English pack or catalog either (FR-704)', () => {
    const strings: string[] = []
    collectStrings(microcopyEnDraft, strings)
    collectStrings(actionVerbsEn, strings)
    expect(strings.length).toBeGreaterThan(50)

    const haystack = strings.join('\n').toLowerCase()
    for (const phrase of [...FORBIDDEN_PHRASES, ...FORBIDDEN_PHRASES_EN]) {
      expect(haystack).not.toContain(phrase)
    }
  })

  it('exposes only MicrocopyPack through the locale getter (typed structure)', () => {
    const pack: MicrocopyPack | null = getMicrocopy('id')
    expect(pack?.organizations.guidance).toContain('pengalaman yang sah')
  })
})

/** Dot-joined leaf paths that are intentionally blank in the English pack. */
const EN_BLANK_ALLOWLIST: readonly string[] = [
  'gpa.hint',
  'gpa.missingScaleWarning',
  'gpa.displayAdvice',
  'educationStatus.graduated.example',
  'educationStatus.awaiting-ceremony.example',
  'educationStatus.in-progress.example',
  'educationStatus.discontinued.example',
  'photo.tips',
  'contact.phoneHint',
  'organizations.guidance',
  'organizations.examples',
  'cvLength.guidance',
  'cvLength.softWarning',
  'fields.phone.hint',
  'fields.gpaValue.hint',
]

function collectLeaves(
  value: unknown,
  prefix: string,
  into: Array<{ path: string; value: string }>,
): void {
  if (typeof value === 'string') {
    into.push({ path: prefix, value })
    return
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectLeaves(item, `${prefix}[${index}]`, into))
    return
  }
  if (value !== null && typeof value === 'object') {
    for (const [key, entry] of Object.entries(value)) {
      collectLeaves(entry, prefix === '' ? key : `${prefix}.${key}`, into)
    }
  }
}

describe('english pack completeness (FR-702, FR-703)', () => {
  it('blanks exactly the Indonesia-specific guidance — everything else is filled', () => {
    const leaves: Array<{ path: string; value: string }> = []
    collectLeaves(microcopyEn, '', leaves)
    expect(leaves.length).toBeGreaterThan(200)

    const blanks = leaves.filter((leaf) => leaf.value === '').map((leaf) => leaf.path)
    expect(blanks.sort()).toEqual([...EN_BLANK_ALLOWLIST].sort())
  })

  it('keeps every checklist populated (no empty guidance lists)', () => {
    for (const list of [
      ...microcopyEn.aiPolish.checklistId,
      ...microcopyEn.aiPolish.avoidedId,
      ...microcopyEn.aiPolish.checklistEn,
      ...microcopyEn.aiPolish.avoidedEn,
      ...microcopyEn.aiPolish.checklistTranslate,
      ...microcopyEn.aiPolish.avoidedTranslate,
    ]) {
      expect(list.length).toBeGreaterThan(0)
    }
  })
})

describe('fallback resolver (FR-703)', () => {
  it('resolves a complete draft unchanged', () => {
    expect(withIdFallback(microcopyId, microcopyEnDraft)).toEqual(microcopyEnDraft)
  })

  it('falls back per-key for a partial pack without crashing', () => {
    const resolved = withIdFallback(microcopyId, {
      preview: { regionLabel: 'CV preview' },
    })
    expect(resolved.preview.regionLabel).toBe('CV preview')
    expect(resolved.preview.modeLabel).toBe(microcopyId.preview.modeLabel)
    expect(resolved.sections.education).toBe('Pendidikan')
  })

  it('keeps an intentional blank blank instead of falling back', () => {
    const resolved = withIdFallback(microcopyId, {
      gpa: { hint: '', missingScaleWarning: '', displayAdvice: '' },
    })
    expect(resolved.gpa.hint).toBe('')
    expect(resolved.gpa.missingScaleWarning).toBe('')
  })
})

describe('placeholder parity across packs (AC-703-b)', () => {
  it('keeps every template placeholder intact in both packs', () => {
    const pairs: Array<[string, string]> = [
      [microcopyId.preview.modeStatus, microcopyEn.preview.modeStatus],
      [microcopyId.locale.status, microcopyEn.locale.status],
      [microcopyId.importPdf.unmappedNote, microcopyEn.importPdf.unmappedNote],
      [microcopyId.print.filenameNote, microcopyEn.print.filenameNote],
      [microcopyId.progress.sectionProgress, microcopyEn.progress.sectionProgress],
      [microcopyId.progress.sectionCompleted, microcopyEn.progress.sectionCompleted],
      [microcopyId.dataSafety.partial, microcopyEn.dataSafety.partial],
      [microcopyId.aiStatic.rationaleTemplate, microcopyEn.aiStatic.rationaleTemplate],
    ]
    const placeholders = [
      '{mode}',
      '{locale}',
      '{count}',
      '{filename}',
      '{current}',
      '{total}',
      '{filled}',
    ]
    for (const [id, en] of pairs) {
      for (const placeholder of placeholders) {
        // A placeholder dropped by either side breaks the rendering component.
        expect(id.includes(placeholder)).toBe(en.includes(placeholder))
      }
    }
    expect(microcopyEn.dataSafety.partial).toContain('{remainder}')
    expect(microcopyEn.aiStatic.rationaleTemplate).toContain('{verb}')
  })
})
