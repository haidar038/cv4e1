import { describe, expect, it } from 'vitest'
import { slugifyName, suggestedPdfFilename } from './slug'

describe('suggestedPdfFilename (J5)', () => {
  it('builds CV-<slug>-<mode>.pdf from a normal name', () => {
    expect(suggestedPdfFilename('Budi Santoso', 'ats')).toBe('CV-budi-santoso-ats.pdf')
    expect(suggestedPdfFilename('Budi Santoso', 'creative')).toBe('CV-budi-santoso-creative.pdf')
  })

  it('folds diacritics and drops unsafe characters', () => {
    expect(slugifyName('André Müller')).toBe('andre-muller')
    expect(slugifyName('Siti "Acha" Rahma!')).toBe('siti-acha-rahma')
  })

  it('falls back for empty or symbol-only names', () => {
    expect(slugifyName('')).toBe('tanpa-nama')
    expect(slugifyName('   ')).toBe('tanpa-nama')
    expect(suggestedPdfFilename('', 'ats')).toBe('CV-tanpa-nama-ats.pdf')
  })

  it('caps the slug at 40 chars without a trailing dash', () => {
    const long = 'A'.repeat(50)
    const slug = slugifyName(long)
    expect(slug.length).toBeLessThanOrEqual(40)
    expect(slug.endsWith('-')).toBe(false)
  })
})
