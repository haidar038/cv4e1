import { describe, expect, it } from 'vitest'
import { AIProviderError, NoopProvider } from '../../ai'
import type { AIProvider, BulletGenerationInput } from '../../ai'
import { getVerbsForSection } from '../../content/action-verbs'
import { StaticSuggestionProvider } from './static-provider'

const input: BulletGenerationInput = {
  rawTask: 'Membantu menyusun laporan penjualan mingguan.',
  section: 'experience',
  locale: 'id',
  allowedFacts: 'Membantu menyusun laporan penjualan mingguan.',
}

function digitSequences(text: string): string[] {
  return text.match(/\d+/g) ?? []
}

describe('provider contract conformance', () => {
  const providers: AIProvider[] = [new StaticSuggestionProvider(), new NoopProvider()]

  it('every provider has a unique non-empty id and a network flag', () => {
    const ids = providers.map((provider) => provider.id)
    expect(ids).toEqual(['static', 'noop'])
    for (const provider of providers) {
      expect(typeof provider.requiresNetwork).toBe('boolean')
      expect(typeof provider.isAvailable).toBe('function')
      expect(typeof provider.generateBullets).toBe('function')
      expect(typeof provider.polishText).toBe('function')
      expect(typeof provider.tailorToJob).toBe('function')
    }
  })

  it('static is always available offline; noop never is', async () => {
    const [staticProvider, noop] = providers as [AIProvider, AIProvider]
    expect(staticProvider.requiresNetwork).toBe(false)
    await expect(staticProvider.isAvailable()).resolves.toBe(true)
    await expect(noop.isAvailable()).resolves.toBe(false)
  })
})

describe('StaticSuggestionProvider.generateBullets', () => {
  it('is deterministic: repeated calls are identical', async () => {
    const provider = new StaticSuggestionProvider()
    const first = await provider.generateBullets(input)
    const second = await provider.generateBullets(input)
    expect(second).toEqual(first)
    expect(first.length).toBeGreaterThan(0)
    expect(first.length).toBeLessThanOrEqual(3)
  })

  it('builds verb-led suggestions that reuse the raw task verbatim', async () => {
    const provider = new StaticSuggestionProvider()
    const suggestions = await provider.generateBullets(input)
    const catalogVerbs = getVerbsForSection('experience').map((entry) => entry.verb)

    for (const suggestion of suggestions) {
      expect(catalogVerbs).toContain(suggestion.actionVerb)
      expect(suggestion.text).toContain(input.rawTask)
      expect(suggestion.text).toContain(suggestion.actionVerb)
      expect(suggestion.usesPlaceholder).toBe(true)
      expect(suggestion.text).toContain('[dampak yang dapat diukur]')
      expect(suggestion.rationale).toContain(suggestion.actionVerb)
      expect(suggestion.warnings).toEqual([])
    }
  })

  it('never starts a suggestion with an excluded verb', async () => {
    const provider = new StaticSuggestionProvider()
    const suggestions = await provider.generateBullets(input)

    for (const suggestion of suggestions) {
      expect(suggestion.actionVerb).not.toBe('Memimpin')
    }
    // Eligible catalog verbs fill the freed slot, so the count is unchanged.
    expect(suggestions).toHaveLength(3)
    expect(suggestions[0]?.actionVerb).toBe('Mengelola')
  })

  it('returns a verb-less generic suggestion for sections without verbs', async () => {
    expect(getVerbsForSection('education')).toEqual([])
    const provider = new StaticSuggestionProvider()
    const suggestions = await provider.generateBullets({ ...input, section: 'education' })

    expect(suggestions).toHaveLength(1)
    const [suggestion] = suggestions
    expect(suggestion?.actionVerb).toBe('')
    expect(suggestion?.text).toContain(input.rawTask)
    expect(suggestion?.usesPlaceholder).toBe(true)
  })

  it('returns no suggestions for empty input', async () => {
    const provider = new StaticSuggestionProvider()
    await expect(provider.generateBullets({ ...input, rawTask: '' })).resolves.toEqual([])
    await expect(provider.generateBullets({ ...input, rawTask: '   ' })).resolves.toEqual([])
  })

  it('grounding invariant: no digits in the output that are absent from the input', async () => {
    const provider = new StaticSuggestionProvider()
    const suggestions = await provider.generateBullets(input)
    for (const suggestion of suggestions) {
      for (const digits of digitSequences(suggestion.text)) {
        expect(digitSequences(input.rawTask)).toContain(digits)
      }
    }
  })

  it('grounding invariant: digits present in the input survive accurately', async () => {
    const provider = new StaticSuggestionProvider()
    const withNumbers = await provider.generateBullets({
      ...input,
      rawTask: 'Mengelola tim beranggotakan 5 orang selama 2 tahun.',
      allowedFacts: 'Mengelola tim beranggotakan 5 orang selama 2 tahun.',
    })
    expect(withNumbers.length).toBeGreaterThan(0)
    for (const suggestion of withNumbers) {
      expect(suggestion.text).toContain('5')
      expect(suggestion.text).toContain('2')
    }
  })

  it('never prefixes a verb the raw task already opens with', async () => {
    const provider = new StaticSuggestionProvider()
    const raw = 'Mengelola tim kecil dan menyusun jadwal'
    const suggestions = await provider.generateBullets({ ...input, rawTask: raw })
    expect(suggestions).toHaveLength(3)
    for (const suggestion of suggestions) {
      expect(suggestion.text.toLowerCase()).not.toMatch(/^mengelola mengelola\b/)
      expect(suggestion.actionVerb.toLowerCase()).not.toBe('mengelola')
      expect(suggestion.text).toContain(raw)
    }
  })

  it('never doubles a placeholder the raw task already carries', async () => {
    const provider = new StaticSuggestionProvider()
    const raw = 'Membantu acara kampus [dampak yang dapat diukur]'
    const suggestions = await provider.generateBullets({ ...input, rawTask: raw })
    expect(suggestions.length).toBeGreaterThan(0)
    for (const suggestion of suggestions) {
      expect(suggestion.text.match(/\[dampak yang dapat diukur\]/g)).toHaveLength(1)
      expect(suggestion.usesPlaceholder).toBe(true)
    }
  })

  it('appends exactly one placeholder when the raw task has none', async () => {
    const provider = new StaticSuggestionProvider()
    const suggestions = await provider.generateBullets({
      ...input,
      rawTask: 'Membantu acara kampus',
    })
    for (const suggestion of suggestions) {
      expect(suggestion.text.match(/\[dampak yang dapat diukur\]/g)).toHaveLength(1)
    }
  })

  it('honesty contract: targetRole never steers the static output', async () => {
    const provider = new StaticSuggestionProvider()
    const without = await provider.generateBullets(input)
    const withRole = await provider.generateBullets({ ...input, targetRole: 'Staff Administrasi' })
    expect(withRole).toEqual(without)
  })
})

describe('StaticSuggestionProvider polish fallback (Task 20, FR-403)', () => {
  it('returns the input verbatim with a per-mode checklist and avoided phrases', async () => {
    const provider = new StaticSuggestionProvider()
    const input = 'membantu menyusun laporan mingguan'
    for (const mode of ['id', 'en', 'translate-en'] as const) {
      const result = await provider.polishText({ text: input, mode })
      // Grounded by construction: no rewrite offline, guidance only.
      expect(result.text).toBe(input)
      expect(result.changes.length).toBeGreaterThan(0)
      expect(result.warnings.length).toBeGreaterThan(0)
    }
  })

  it('serves a distinct checklist per mode', async () => {
    const provider = new StaticSuggestionProvider()
    const text = 'membantu acara kampus'
    const id = await provider.polishText({ text, mode: 'id' })
    const en = await provider.polishText({ text, mode: 'en' })
    const translate = await provider.polishText({ text, mode: 'translate-en' })
    expect(id.changes).not.toEqual(en.changes)
    expect(en.changes).not.toEqual(translate.changes)
    expect(id.changes).not.toEqual(translate.changes)
  })

  it('returns empty text with the empty-input note for empty input', async () => {
    const provider = new StaticSuggestionProvider()
    const result = await provider.polishText({ text: '   ', mode: 'id' })
    expect(result.text).toBe('')
    expect(result.changes).toEqual([])
    expect(result.warnings.length).toBeGreaterThan(0)
  })

  it('grounding invariant: static polish never invents numbers or entities', async () => {
    const provider = new StaticSuggestionProvider()
    const result = await provider.polishText({
      text: 'Mengelola tim 5 orang selama 2 tahun.',
      mode: 'id',
    })
    expect(result.text).toBe('Mengelola tim 5 orang selama 2 tahun.')
  })
})

describe('StaticSuggestionProvider unimplemented capabilities', () => {
  it('rejects tailoring with capability-not-implemented (Fase 3)', async () => {
    const provider = new StaticSuggestionProvider()
    await expect(
      provider.tailorToJob({
        jobDescription: 'Contoh lowongan.',
        section: 'experience',
        locale: 'id',
        allowedFacts: 'Contoh fakta.',
      }),
    ).rejects.toBeInstanceOf(AIProviderError)
  })
})
