import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  AIProviderError,
  validateTailoringOutput,
  type AIProvider,
  type AILocale,
  type BulletGenerationInput,
  type PolishInput,
  type TailoringResult,
} from '../../ai'
import { TAILORING_PROMPT_VERSION } from './tailoring-prompts'
import { matchTailoringKeywords } from './tailoring-matcher'
import {
  buildTailoringCorpus,
  buildTailoringExcerpt,
  buildTailoringSummary,
  requestTailoring,
  type TailoringRequest,
} from './tailoring-generator'
import { createEmptyResumeDocument } from '../../core/schema'
import type { SectionKey } from '../../core/view-models'

/**
 * Positive grounding eval set for T3b (FR-602, ADR-0011, evaluation-dataset
 * — the set only grows). Each case proves the accept path three ways: the
 * live static matcher invents nothing, the pinned AI-shaped output validates
 * whole through the gate machinery, and the orchestrator ships it as an AI
 * candidate. One control case proves the gate is live (an invented number
 * still fails the same assertions), and the `injection-ignored` case proves
 * a clean output on a hostile ad validates while the echo does not.
 */

interface AcceptCase {
  readonly name: string
  readonly section: SectionKey
  readonly locale: AILocale
  readonly jobDescription: string
  readonly resumeExcerpt: string
  readonly mockOutput: unknown
}

interface AcceptFile {
  readonly promptVersion?: unknown
  readonly cases?: AcceptCase[]
}

function loadCases(): AcceptCase[] {
  const parsed = JSON.parse(
    readFileSync('fixtures/ai-eval/tailoring-grounding-accept.json', 'utf8'),
  ) as AcceptFile
  if (parsed.promptVersion !== TAILORING_PROMPT_VERSION) {
    throw new Error(
      `eval set targets prompt ${String(parsed.promptVersion)} but the active prompt is ${TAILORING_PROMPT_VERSION} — re-run the eval before claiming this version`,
    )
  }
  if (!Array.isArray(parsed.cases) || parsed.cases.length === 0) {
    throw new Error('eval fixture has no cases')
  }
  for (const item of parsed.cases) {
    if (
      typeof item.name !== 'string' ||
      item.name === '' ||
      typeof item.jobDescription !== 'string' ||
      item.jobDescription.trim() === '' ||
      typeof item.resumeExcerpt !== 'string' ||
      item.resumeExcerpt.trim() === '' ||
      typeof item.mockOutput !== 'object' ||
      item.mockOutput === null
    ) {
      throw new Error(`eval fixture case is malformed: ${JSON.stringify(item.name)}`)
    }
  }
  return parsed.cases
}

function fakeProvider(result: TailoringResult): AIProvider {
  return {
    id: 'fake',
    requiresNetwork: true,
    isAvailable: () => Promise.resolve(true),
    generateBullets: (_input: BulletGenerationInput) =>
      Promise.reject(new AIProviderError('capability-not-implemented')),
    polishText: (_input: PolishInput) =>
      Promise.reject(new AIProviderError('capability-not-implemented')),
    tailorToJob: () => Promise.resolve(result),
  }
}

function documentWithExcerpt(excerpt: string) {
  const empty = createEmptyResumeDocument()
  return {
    ...empty,
    sections: {
      ...empty.sections,
      experience: [{ organization: 'PT Contoh Fiktif', current: false, highlights: [excerpt] }],
    },
  }
}

describe('tailoring grounding accept set (FR-602)', () => {
  const cases = loadCases()

  it('pins the curated case list so growth is deliberate (grow-only)', () => {
    expect(cases.map((item) => item.name).sort()).toEqual([
      'basic-id-gap',
      'grounded-question',
      'injection-ignored',
      'section-hint',
    ])
  })

  for (const item of cases) {
    it(`accepts "${item.name}" — static clean, mock validates, orchestrator ships AI`, async () => {
      // 1. Live static matcher: JD∩excerpt split invents nothing.
      const staticResult = matchTailoringKeywords(item.jobDescription, [
        { section: item.section, text: item.resumeExcerpt },
      ])
      const jdLower = item.jobDescription.toLowerCase()
      const excerptLower = item.resumeExcerpt.toLowerCase()
      for (const keyword of staticResult.matchedKeywords) {
        expect(jdLower).toContain(keyword)
        expect(excerptLower).toContain(keyword)
      }
      for (const keyword of staticResult.unsupportedKeywords) {
        expect(jdLower).toContain(keyword)
        expect(excerptLower).not.toContain(keyword)
      }

      // 2. Pinned AI-shaped output validates whole through the gate machinery.
      const validated = validateTailoringOutput(
        JSON.stringify(item.mockOutput),
        item.jobDescription,
        item.resumeExcerpt,
      )
      expect(
        validated.matchedKeywords.length +
          validated.unsupportedKeywords.length +
          validated.clarifyingQuestions.length,
      ).toBeGreaterThan(0)

      // 3. The orchestrator ships the validated candidate as an AI result.
      const request: TailoringRequest = {
        jobDescription: item.jobDescription,
        section: item.section,
        locale: item.locale,
        document: documentWithExcerpt(item.resumeExcerpt),
      }
      const outcome = await requestTailoring(request, { provider: fakeProvider(validated) })
      expect(outcome.source).toBe('ai')
      expect(outcome.errorCode).toBeNull()
      expect(outcome.result.matchedKeywords).toEqual(validated.matchedKeywords)
    })
  }

  it('control: an invented number still fails the same gate (the run is live)', () => {
    const jd = 'Dicari staf Excel.'
    const excerpt = 'Laporan Excel.'
    const bad = {
      matchedKeywords: ['Excel'],
      unsupportedKeywords: [],
      sectionsToStrengthen: [],
      clarifyingQuestions: ['Berapa target penjualan 50% Anda?'],
      warnings: [],
    }
    let error: unknown
    try {
      validateTailoringOutput(JSON.stringify(bad), jd, excerpt)
    } catch (caught) {
      error = caught
    }
    expect(error).toBeInstanceOf(AIProviderError)
    expect((error as AIProviderError).code).toBe('grounding-violation')
  })

  it('control: the orchestrator corpus never carries identity or contact', () => {
    const empty = createEmptyResumeDocument()
    const document = {
      ...empty,
      basics: { ...empty.basics, name: 'Nama Fiktif Contoh', email: 'fiktif@example.test' },
    }
    const excerpt = buildTailoringExcerpt(
      buildTailoringCorpus(document),
      buildTailoringSummary(document),
    )
    expect(excerpt).not.toContain('Nama Fiktif Contoh')
    expect(excerpt).not.toContain('fiktif@example.test')
  })
})
