import { describe, expect, it } from 'vitest'
import {
  extractJdKeywords,
  matchTailoringKeywords,
  splitKeywords,
  suggestSectionsToStrengthen,
  type TailoringCorpus,
} from './tailoring-matcher'

/** 100% fictitious fixture: a junior admin ad vs a thin matching resume. */
const JD =
  'Dicari staf administrasi yang menguasai Microsoft Excel dan komunikasi. ' +
  'Pengalaman organisasi menjadi nilai tambah. Kirim lamaran sebelum Desember.'

const CORPUS: readonly TailoringCorpus[] = [
  { section: 'experience', text: 'Magang administrasi: menyusun laporan Microsoft Excel.' },
  { section: 'organizations', text: 'Bendahara himpunan mahasiswa.' },
  { section: 'projects', text: 'Aplikasi kas kelas bahasa Java.' },
  { section: 'skills', text: 'Microsoft Excel, komunikasi, mengetik cepat.' },
]

describe('extractJdKeywords (static matcher, FR-601/604)', () => {
  it('keeps content tokens, drops stopwords, digits, and single characters', () => {
    expect(extractJdKeywords('Dicari staf S1 dan QA untuk IT di 2024')).toEqual([
      'dicari',
      'staf',
      's1',
      'qa',
      'it',
    ])
  })

  it('dedupes preserving first-appearance order', () => {
    expect(extractJdKeywords('Excel dan excel, Excel!')).toEqual(['excel'])
  })

  it('returns empty for empty or content-free input', () => {
    expect(extractJdKeywords('')).toEqual([])
    expect(extractJdKeywords('dan yang di 2024')).toEqual([])
  })
})

describe('splitKeywords', () => {
  it('splits on word boundaries, not substrings', () => {
    const { matchedKeywords, unsupportedKeywords } = splitKeywords(
      ['java', 'kas'],
      'Aplikasi kas kelas bahasa Java.',
    )
    expect(matchedKeywords).toEqual(['java', 'kas'])
    expect(unsupportedKeywords).toEqual([])
    // 'kas' must not match inside 'bekas'; 'jav' must not match 'Java'.
    const partial = splitKeywords(['jav'], 'Bahasa Java dipakai.')
    expect(partial.matchedKeywords).toEqual([])
    expect(partial.unsupportedKeywords).toEqual(['jav'])
  })

  it('is case-insensitive', () => {
    const { matchedKeywords, unsupportedKeywords } = splitKeywords(
      ['EXCEL'],
      'laporan microsoft excel.',
    )
    expect(matchedKeywords).toEqual(['EXCEL'])
    expect(unsupportedKeywords).toEqual([])
  })
})

describe('suggestSectionsToStrengthen', () => {
  it('lists gap sections with zero hits, skipping education noise', () => {
    const corpus: readonly TailoringCorpus[] = [
      ...CORPUS,
      { section: 'education', text: 'S1 Sistem Informasi, IPK 3.50 / 4.00.' },
    ]
    expect(suggestSectionsToStrengthen(['excel', 'komunikasi'], corpus)).toEqual([
      'organizations',
      'projects',
    ])
  })

  it('ignores sections absent from the corpus', () => {
    expect(suggestSectionsToStrengthen(['excel'], [{ section: 'skills', text: 'Excel.' }])).toEqual(
      [],
    )
  })
})

describe('matchTailoringKeywords (FR-601/604)', () => {
  it('counts unsectioned vocabulary for matching but never as a section', () => {
    const corpus = [{ section: 'experience', text: 'Menyusun laporan.' }] as const
    const result = matchTailoringKeywords(
      'Dicari staf Excel.',
      corpus,
      'Staf administrasi\nMenyusun laporan.',
    )
    // 'staf' only exists in the headline — matchable, yet no section entry.
    expect(result.matchedKeywords).toContain('staf')
    expect(result.unsupportedKeywords).toContain('excel')
    expect(result.sectionsToStrengthen).toEqual(['experience'])
  })
  it('reports matched vs unsupported on the fixture ad', () => {
    const result = matchTailoringKeywords(JD, CORPUS)
    expect(result.matchedKeywords).toContain('excel')
    expect(result.matchedKeywords).toContain('komunikasi')
    expect(result.matchedKeywords).toContain('administrasi')
    expect(result.unsupportedKeywords).toContain('organisasi')
    expect(result.unsupportedKeywords).toContain('desember')
    expect(result.unsupportedKeywords).not.toContain('excel')
    expect(result.clarifyingQuestions).toEqual([])
    expect(result.warnings).toEqual([])
  })

  it('is deterministic and never mutates its inputs', () => {
    const frozen = Object.freeze(CORPUS.map((entry) => Object.freeze({ ...entry })))
    const first = matchTailoringKeywords(JD, frozen)
    const second = matchTailoringKeywords(JD, frozen)
    expect(second).toEqual(first)
  })
})
