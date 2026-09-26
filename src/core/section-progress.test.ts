import { describe, expect, it } from 'vitest'
import type { ValidatedResumeDocument } from './schema'
import { getSectionProgress, PROGRESS_SECTIONS } from './section-progress'

function makeDoc(
  basics: ValidatedResumeDocument['basics'],
  sections: ValidatedResumeDocument['sections'] = {},
): ValidatedResumeDocument {
  return { schemaVersion: '1.0.0', basics, sections }
}

const EMPTY = makeDoc({ name: '' })

describe('getSectionProgress', () => {
  it('covers exactly the seven form accordions', () => {
    expect([...PROGRESS_SECTIONS].sort()).toEqual(
      [
        'basics',
        'certifications',
        'education',
        'experience',
        'organizations',
        'projects',
        'skills',
      ].sort(),
    )
  })

  it('reports 0 of 7 for a blank draft', () => {
    expect(getSectionProgress(EMPTY)).toEqual({ filled: 0, total: 7, percent: 0, filledKeys: [] })
  })

  it('counts a section with one filled field, ignoring blank-only input', () => {
    // Whitespace is not content.
    expect(getSectionProgress(makeDoc({ name: '   ' })).filled).toBe(0)
    expect(getSectionProgress(makeDoc({ name: 'Budi Santoso' })).filled).toBe(1)
    expect(getSectionProgress(makeDoc({ name: '', email: 'budi@email.com' })).filled).toBe(1)
  })

  it('ignores section items that carry no typed value', () => {
    const doc = makeDoc({ name: '' }, { education: [{ institution: '   ' }] })
    expect(getSectionProgress(doc).filled).toBe(0)
    const filled = makeDoc({ name: '' }, { education: [{ institution: 'Universitas Contoh' }] })
    const progress = getSectionProgress(filled)
    expect(progress.filled).toBe(1)
    expect(progress.filledKeys).toEqual(['education'])
  })

  it('counts every section once when all carry content', () => {
    const doc = makeDoc(
      { name: 'Budi Santoso' },
      {
        education: [{ institution: 'Universitas Contoh' }],
        experience: [{ organization: 'PT Contoh', current: false }],
        organizations: [{ organization: 'Himpunan Contoh', current: false }],
        projects: [{ name: 'Aplikasi Contoh' }],
        skills: [{ items: ['Menulis'] }],
        certifications: [{ name: 'Sertifikat Contoh' }],
      },
    )
    expect(getSectionProgress(doc)).toEqual({
      filled: 7,
      total: 7,
      percent: 100,
      filledKeys: [...PROGRESS_SECTIONS],
    })
  })

  it('rounds the percent to a whole number', () => {
    // 3 of 7 → 42.857… → 43.
    const doc = makeDoc(
      { name: 'Budi Santoso' },
      {
        education: [{ institution: 'Universitas Contoh' }],
        experience: [{ organization: 'PT Contoh', current: false }],
      },
    )
    const progress = getSectionProgress(doc)
    expect(progress.filled).toBe(3)
    expect(progress.percent).toBe(43)
  })

  it('counts a skill group by category or by item', () => {
    expect(
      getSectionProgress(makeDoc({ name: '' }, { skills: [{ category: 'Bahasa', items: [] }] }))
        .filledKeys,
    ).toEqual(['skills'])
    expect(
      getSectionProgress(makeDoc({ name: '' }, { skills: [{ items: ['  ', 'Menulis'] }] }))
        .filledKeys,
    ).toEqual(['skills'])
  })
})
