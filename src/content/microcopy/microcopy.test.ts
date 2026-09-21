import { describe, expect, it } from 'vitest'
import { microcopyId, getMicrocopy, type MicrocopyPack } from './id'
import { actionVerbs } from '../action-verbs/index'

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

describe('locale handling (FR-204)', () => {
  it('returns the Indonesian pack for id and nothing for en until Fase 3', () => {
    expect(getMicrocopy('id')).toBe(microcopyId)
    expect(getMicrocopy('en')).toBeNull()
  })

  it('gpa hint shows the canonical scale format', () => {
    expect(microcopyId.gpa.hint).toContain('/ 4.00')
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

  it('exposes only MicrocopyPack through the locale getter (typed structure)', () => {
    const pack: MicrocopyPack | null = getMicrocopy('id')
    expect(pack?.organizations.guidance).toContain('pengalaman yang sah')
  })
})
