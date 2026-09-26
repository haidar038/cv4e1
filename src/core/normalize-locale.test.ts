/// <reference types="node" />
// Node-project test: CV content language follows the document locale.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { validateResumeDocument, type ValidatedResumeDocument } from './schema'
import { buildEducationDisplays } from './normalize-helpers'
import { toATSViewModel, toCreativeViewModel } from './normalize'

/**
 * F4g bilingual CV content (FR-701–704 family, ADR-0012).
 *
 * The interface switcher (T3c) never rewrites documents, so the rendered CV
 * language is a *document* property (`meta.locale`), not the live UI locale:
 * dates already worked this way, and headings/status/employment labels now
 * follow the same parameter. Wording mirrors the EN form labels — curated
 * once, never machine-translated.
 */

function loadFixture(): ValidatedResumeDocument {
  const raw: unknown = JSON.parse(
    readFileSync(
      fileURLToPath(new URL('../../fixtures/full-document.json', import.meta.url)),
      'utf8',
    ),
  )
  const result = validateResumeDocument(raw)
  if (!result.success) throw result.error
  return result.data
}

function withLocale(doc: ValidatedResumeDocument, locale: 'id' | 'en'): ValidatedResumeDocument {
  const result = validateResumeDocument({ ...doc, meta: { locale, mode: 'ats' } })
  if (!result.success) throw result.error
  return result.data
}

function withStatus(doc: ValidatedResumeDocument, status: string): ValidatedResumeDocument {
  const education = (doc.sections.education ?? []).map((item, index) =>
    index === 0 ? { ...item, status } : item,
  )
  const result = validateResumeDocument({ ...doc, sections: { ...doc.sections, education } })
  if (!result.success) throw result.error
  return result.data
}

function withEmploymentType(
  doc: ValidatedResumeDocument,
  employmentType: string,
): ValidatedResumeDocument {
  const experience = (doc.sections.experience ?? []).map((item, index) =>
    index === 0 ? { ...item, employmentType } : item,
  )
  const result = validateResumeDocument({ ...doc, sections: { ...doc.sections, experience } })
  if (!result.success) throw result.error
  return result.data
}

function headingsOf(doc: ValidatedResumeDocument): string[] {
  return toATSViewModel(doc).sections.map((section) => section.heading)
}

describe('CV content language follows the document locale (F4g)', () => {
  it('renders Indonesian headings for id documents (unchanged default)', () => {
    expect(headingsOf(withLocale(loadFixture(), 'id'))).toEqual([
      'PENDIDIKAN',
      'PENGALAMAN KERJA',
      'ORGANISASI',
      'PROYEK',
      'KEAHLIAN',
      'SERTIFIKASI',
    ])
  })

  it('renders standard English ATS headings for en documents', () => {
    expect(headingsOf(withLocale(loadFixture(), 'en'))).toEqual([
      'EDUCATION',
      'WORK EXPERIENCE',
      'ORGANIZATIONS',
      'PROJECTS',
      'SKILLS',
      'CERTIFICATIONS',
    ])
  })

  it('renders the Creative headings in the document language too', () => {
    const enVm = toCreativeViewModel(withLocale(loadFixture(), 'en'))
    expect(enVm.sections.map((section) => section.heading)).toContain('EDUCATION')
    expect(enVm.sections.map((section) => section.heading)).not.toContain('PENDIDIKAN')
  })

  it('renders education status in the document language', () => {
    const idVm = toATSViewModel(withStatus(withLocale(loadFixture(), 'id'), 'awaiting-ceremony'))
    const enVm = toATSViewModel(withStatus(withLocale(loadFixture(), 'en'), 'awaiting-ceremony'))
    const idEdu = idVm.sections.find((section) => section.key === 'education')
    const enEdu = enVm.sections.find((section) => section.key === 'education')
    expect(idEdu?.items[0]).toMatchObject({ status: 'Lulus (menunggu wisuda)' })
    expect(enEdu?.items[0]).toMatchObject({ status: 'Graduated (pending ceremony)' })
  })

  it('renders employment type in the document language', () => {
    const idVm = toATSViewModel(withEmploymentType(withLocale(loadFixture(), 'id'), 'internship'))
    const enVm = toATSViewModel(withEmploymentType(withLocale(loadFixture(), 'en'), 'internship'))
    const idExp = idVm.sections.find((section) => section.key === 'experience')
    const enExp = enVm.sections.find((section) => section.key === 'experience')
    expect(idExp?.items[0]).toMatchObject({ employmentType: 'Magang' })
    expect(enExp?.items[0]).toMatchObject({ employmentType: 'Internship' })
  })

  it('passes unknown label tokens through instead of blanking them', () => {
    // Forward-compatibility (ADR-0009 spirit): an enum value from a newer
    // schema version stays visible instead of vanishing. The schema itself
    // is a strict enum, so this reaches the helper below validation.
    const displays = buildEducationDisplays(
      [{ institution: 'Universitas Contoh', status: 'future-status' } as never],
      'en',
    )
    expect(displays[0]?.status).toBe('future-status')
  })

  it('defaults meta-less documents to Indonesian (no behavior change)', () => {
    const raw: unknown = JSON.parse(
      readFileSync(
        fileURLToPath(new URL('../../fixtures/full-document.json', import.meta.url)),
        'utf8',
      ),
    )
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { meta, ...withoutMeta } = raw as Record<string, unknown>
    const result = validateResumeDocument(withoutMeta)
    if (!result.success) throw result.error
    expect(headingsOf(result.data)[0]).toBe('PENDIDIKAN')
  })
})
