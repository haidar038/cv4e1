import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  AIProviderError,
  checkGrounding,
  validateBulletOutput,
  type AIProvider,
  type AILocale,
  type BulletSuggestion,
  type JobTailoringInput,
  type PolishInput,
} from '../../ai'
import { BULLET_MAX_INPUT_CHARS, BULLET_PROMPT_VERSION } from './bullet-prompts'
import {
  buildBulletInput,
  requestBulletSuggestions,
  type BulletRequest,
  type BulletSectionKey,
} from './bullet-generator'
import { StaticSuggestionProvider } from './static-provider'

/**
 * Positive grounding eval set (Task 22, FR-405, evaluation-dataset.md §1/§4 —
 * the set only grows). Each case proves the accept path three ways: the live
 * static fallback carries no new facts, the pinned AI-shaped output validates
 * whole through the gate machinery, and the orchestrator ships it as an AI
 * candidate. One control case proves the gate is live (an invented number
 * still fails the same assertions).
 *
 * Curated-slot boundary: the static output cannot survive strict
 * `validateBulletOutput` — the catalog verb prefix and the rationale
 * template are curated additions, not model output. The verb is allowlisted
 * because suggesting verbs IS the FR-403 fallback purpose (the dataset
 * itself requires action verbs in bullets); the rationale is curated
 * microcopy guarded by the forbidden-phrase sweep. Numbers, dates,
 * companies, and skills can never be allowlisted — any of those fails here.
 */

interface AcceptCase {
  readonly name: string
  readonly section: BulletSectionKey
  readonly locale: AILocale
  readonly rawTask: string
  readonly expectPlaceholder?: boolean
  readonly mockOutput: unknown
}

interface AcceptFile {
  readonly promptVersion?: unknown
  readonly cases?: AcceptCase[]
}

function loadCases(): AcceptCase[] {
  const parsed = JSON.parse(
    readFileSync('fixtures/ai-eval/bullet-grounding-accept.json', 'utf8'),
  ) as AcceptFile
  if (parsed.promptVersion !== BULLET_PROMPT_VERSION) {
    throw new Error(
      `eval set targets prompt ${String(parsed.promptVersion)} but the active prompt is ${BULLET_PROMPT_VERSION} — re-run the eval before claiming this version`,
    )
  }
  if (!Array.isArray(parsed.cases) || parsed.cases.length === 0) {
    throw new Error('eval fixture has no cases')
  }
  for (const item of parsed.cases) {
    if (
      typeof item.name !== 'string' ||
      item.name === '' ||
      typeof item.rawTask !== 'string' ||
      item.rawTask.trim() === '' ||
      (item.section !== 'experience' &&
        item.section !== 'organizations' &&
        item.section !== 'projects') ||
      typeof item.mockOutput !== 'object' ||
      item.mockOutput === null
    ) {
      throw new Error(`eval fixture case is malformed: ${JSON.stringify(item.name)}`)
    }
  }
  return parsed.cases
}

/** Grounding violations in live static text minus the allowlisted verb slot. */
function staticTextViolations(suggestion: BulletSuggestion, allowedFacts: string): string[] {
  const verb = suggestion.actionVerb.toLowerCase()
  return checkGrounding([suggestion.text], allowedFacts).filter((violation) => {
    if (verb === '') return true
    const entity = /^entitas "(.+)" tidak ada pada input$/.exec(violation)?.[1]
    return entity?.toLowerCase() !== verb
  })
}

function fakeProvider(suggestions: readonly BulletSuggestion[]): AIProvider {
  return {
    id: 'fake',
    requiresNetwork: true,
    isAvailable: () => Promise.resolve(true),
    generateBullets: () => Promise.resolve(suggestions),
    polishText: (_input: PolishInput) =>
      Promise.reject(new AIProviderError('capability-not-implemented')),
    tailorToJob: (_input: JobTailoringInput) =>
      Promise.reject(new AIProviderError('capability-not-implemented')),
  }
}

describe('bullet grounding accept set (Task 22, FR-405)', () => {
  const cases = loadCases()

  it('pins the curated case list so growth is deliberate (grow-only)', () => {
    expect(cases.map((item) => item.name).sort()).toEqual([
      'input-entity-survives',
      'long-input-truncated',
      'numbers-absent-placeholder',
      'numbers-present',
      'organizations-context',
      'short-input',
      'special-chars',
      'verb-leading-dedup',
    ])
  })

  for (const item of cases) {
    it(`accepts "${item.name}" — static clean, mock validates, orchestrator ships AI`, async () => {
      const request: BulletRequest = {
        rawTask: item.rawTask,
        section: item.section,
        locale: item.locale,
      }
      const input = buildBulletInput(request)
      if (item.rawTask.length > BULLET_MAX_INPUT_CHARS) {
        expect(input.rawTask.length).toBeLessThan(item.rawTask.length)
        expect(input.rawTask).toContain('[dipotong]')
      }

      // 1. Live static fallback: user-derived content carries no new facts.
      const staticSuggestions = await new StaticSuggestionProvider().generateBullets(input)
      expect(staticSuggestions.length).toBeGreaterThan(0)
      for (const suggestion of staticSuggestions) {
        expect(staticTextViolations(suggestion, input.allowedFacts)).toEqual([])
        expect(suggestion.actionVerb.length).toBeGreaterThan(0)
        expect(suggestion.rationale.length).toBeGreaterThan(0)
      }
      if (item.expectPlaceholder === true) {
        for (const suggestion of staticSuggestions) {
          expect(suggestion.usesPlaceholder).toBe(true)
          expect(suggestion.text).toContain('[dampak yang dapat diukur]')
        }
      }

      // 2. Pinned AI-shaped output validates whole through the gate machinery.
      const validated = validateBulletOutput(JSON.stringify(item.mockOutput), input)
      expect(validated.length).toBeGreaterThan(0)

      // 3. The orchestrator ships the validated candidate as an AI result.
      const result = await requestBulletSuggestions(request, {
        provider: fakeProvider(validated),
      })
      expect(result.source).toBe('ai')
      expect(result.errorCode).toBeNull()
      expect(result.suggestions.length).toBeGreaterThan(0)
    })
  }

  it('control: an invented number still fails the same gate (the run is live)', () => {
    const input = buildBulletInput({
      rawTask: 'membantu acara kampus',
      section: 'experience',
      locale: 'id',
    })
    const bad = {
      suggestions: [
        {
          text: 'Meningkatkan penjualan sebesar 50%.',
          actionVerb: 'Meningkatkan',
          usesPlaceholder: false,
          rationale: 'Membantu acara kampus.',
          warnings: [],
        },
      ],
    }
    let error: unknown
    try {
      validateBulletOutput(JSON.stringify(bad), input)
    } catch (caught) {
      error = caught
    }
    expect(error).toBeInstanceOf(AIProviderError)
    expect((error as AIProviderError).code).toBe('grounding-violation')
  })
})
