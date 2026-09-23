import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  AIProviderError,
  checkGrounding,
  validatePolishOutput,
  type AIProvider,
  type BulletGenerationInput,
  type BulletSuggestion,
  type JobTailoringInput,
  type PolishSuggestion,
} from '../../ai'
import type { PolishMode } from '../../ai'
import { POLISH_PROMPT_VERSION } from './polish-prompts'
import { requestPolishSuggestion, type PolishRequest } from './polish-text'
import { StaticSuggestionProvider } from './static-provider'

/**
 * Positive grounding eval set (Task 22, FR-405, evaluation-dataset.md §1/§4 —
 * the set only grows). Each case proves the accept path three ways: the live
 * static fallback returns the input verbatim with guidance attached, the
 * pinned AI-shaped output validates whole, and the orchestrator ships it as
 * an AI candidate. One control case proves the gate is live.
 *
 * Static polish needs no curated-slot allowlist (unlike bullets): the text
 * IS the input verbatim, and the checklist/warnings are curated microcopy
 * guarded by the forbidden-phrase sweep — only the text is grounded here.
 * translate-en is excluded by design (fixture note): a genuine translation
 * cannot pass containment grounding, so that mode degrades to static
 * guidance — recorded in manual-eval-protocol.md §6, not fixed here.
 */

interface AcceptCase {
  readonly name: string
  readonly mode: PolishMode
  readonly text: string
  readonly mockOutput: unknown
}

interface AcceptFile {
  readonly promptVersion?: unknown
  readonly cases?: AcceptCase[]
}

function loadCases(): AcceptCase[] {
  const parsed = JSON.parse(
    readFileSync('fixtures/ai-eval/polish-grounding-accept.json', 'utf8'),
  ) as AcceptFile
  if (parsed.promptVersion !== POLISH_PROMPT_VERSION) {
    throw new Error(
      `eval set targets prompt ${String(parsed.promptVersion)} but the active prompt is ${POLISH_PROMPT_VERSION} — re-run the eval before claiming this version`,
    )
  }
  if (!Array.isArray(parsed.cases) || parsed.cases.length === 0) {
    throw new Error('eval fixture has no cases')
  }
  for (const item of parsed.cases) {
    if (
      typeof item.name !== 'string' ||
      item.name === '' ||
      typeof item.text !== 'string' ||
      item.text.trim() === '' ||
      (item.mode !== 'id' && item.mode !== 'en' && item.mode !== 'translate-en') ||
      typeof item.mockOutput !== 'object' ||
      item.mockOutput === null
    ) {
      throw new Error(`eval fixture case is malformed: ${JSON.stringify(item.name)}`)
    }
  }
  return parsed.cases
}

function fakeProvider(suggestion: PolishSuggestion): AIProvider {
  return {
    id: 'fake',
    requiresNetwork: true,
    isAvailable: () => Promise.resolve(true),
    generateBullets: (_input: BulletGenerationInput) =>
      Promise.resolve([] as readonly BulletSuggestion[]),
    polishText: () => Promise.resolve(suggestion),
    tailorToJob: (_input: JobTailoringInput) =>
      Promise.reject(new AIProviderError('capability-not-implemented')),
  }
}

describe('polish grounding accept set (Task 22, FR-405)', () => {
  const cases = loadCases()

  it('pins the curated case list so growth is deliberate (grow-only)', () => {
    expect(cases.map((item) => item.name).sort()).toEqual([
      'en-mode',
      'numbers-kept',
      'short-input',
      'special-chars',
    ])
  })

  for (const item of cases) {
    it(`accepts "${item.name}" — static verbatim, mock validates, orchestrator ships AI`, async () => {
      const request: PolishRequest = { text: item.text, mode: item.mode }
      const input = { text: item.text, mode: item.mode } as const

      // 1. Live static fallback: the input verbatim plus real guidance.
      const staticSuggestion = await new StaticSuggestionProvider().polishText(input)
      expect(staticSuggestion.text).toBe(item.text)
      expect(checkGrounding([staticSuggestion.text], item.text)).toEqual([])
      expect(staticSuggestion.changes.length).toBeGreaterThan(0)

      // 2. Pinned AI-shaped output validates whole through the gate machinery.
      const validated = validatePolishOutput(JSON.stringify(item.mockOutput), input)
      expect(validated.text.length).toBeGreaterThan(0)

      // 3. The orchestrator ships the validated candidate as an AI result.
      const result = await requestPolishSuggestion(request, {
        provider: fakeProvider(validated),
      })
      expect(result.source).toBe('ai')
      expect(result.errorCode).toBeNull()
    })
  }

  it('control: an invented number still fails the same gate (the run is live)', () => {
    const bad = {
      text: 'Memimpin 50 panitia acara kampus.',
      changes: ['Menambahkan detail.'],
      warnings: [],
    }
    let error: unknown
    try {
      validatePolishOutput(JSON.stringify(bad), { text: 'membantu acara kampus', mode: 'id' })
    } catch (caught) {
      error = caught
    }
    expect(error).toBeInstanceOf(AIProviderError)
    expect((error as AIProviderError).code).toBe('grounding-violation')
  })
})
