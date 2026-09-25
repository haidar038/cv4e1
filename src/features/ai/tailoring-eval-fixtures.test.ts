import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { AIProviderError, validateTailoringOutput } from '../../ai'

/**
 * Permanent grounding regression set for T3b (FR-602, ADR-0011,
 * evaluation-dataset — the set only grows). Each fixture case is an output
 * that MUST be rejected whole: no repair, only rejection plus the static
 * fallback (handled by the orchestrator, proven in
 * tailoring-generator.test.ts). Includes the AB-3 injection echo: quoting
 * an injected instruction back is not grounding, even when the words sit
 * inside the pasted ad.
 */

interface EvalCase {
  readonly name: string
  readonly jobDescription: string
  readonly resumeExcerpt: string
  readonly output: unknown
}

function loadCases(): EvalCase[] {
  const parsed = JSON.parse(
    readFileSync('fixtures/ai-eval/tailoring-grounding-violations.json', 'utf8'),
  ) as { cases?: EvalCase[] }
  if (!Array.isArray(parsed.cases) || parsed.cases.length === 0) {
    throw new Error('eval fixture has no cases')
  }
  return parsed.cases
}

describe('tailoring grounding eval fixtures (FR-602)', () => {
  const cases = loadCases()

  it('ships at least one violation per known class, including injection echo', () => {
    expect(cases.map((item) => item.name).sort()).toEqual([
      'gap-actually-supported',
      'injection-echo',
      'invented-skill-match',
      'match-missing-from-jd',
      'question-asserts-facts',
    ])
  })

  for (const item of cases) {
    it(`rejects "${item.name}" without touching the input`, () => {
      let error: unknown
      try {
        validateTailoringOutput(
          JSON.stringify(item.output),
          item.jobDescription,
          item.resumeExcerpt,
        )
      } catch (caught) {
        error = caught
      }
      expect(error).toBeInstanceOf(AIProviderError)
      expect((error as AIProviderError).code).toBe('grounding-violation')
      expect((error as AIProviderError).details.length).toBeGreaterThan(0)
    })
  }
})
