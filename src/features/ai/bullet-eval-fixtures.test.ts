import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { AIProviderError, validateBulletOutput } from '../../ai'

/**
 * Permanent grounding regression set (Task 19, FR-405,
 * evaluation-dataset.md §4 — the set only grows). Each fixture case is an
 * output that MUST be rejected whole: no repair, only rejection plus the
 * static fallback (handled by the orchestrator, proven in
 * bullet-generator.test.ts).
 */

interface EvalCase {
  readonly name: string
  readonly allowedFacts: string
  readonly output: unknown
}

function loadCases(): EvalCase[] {
  const parsed = JSON.parse(
    readFileSync('fixtures/ai-eval/bullet-grounding-violations.json', 'utf8'),
  ) as { cases?: EvalCase[] }
  if (!Array.isArray(parsed.cases) || parsed.cases.length === 0) {
    throw new Error('eval fixture has no cases')
  }
  return parsed.cases
}

describe('bullet grounding eval fixtures (FR-405)', () => {
  const cases = loadCases()

  it('ships at least one violation per known class', () => {
    expect(cases.map((item) => item.name).sort()).toEqual([
      'changed-date',
      'invented-company',
      'invented-percentage',
      'invented-skill',
    ])
  })

  for (const item of cases) {
    it(`rejects "${item.name}" without touching the input`, () => {
      const input = {
        rawTask: item.allowedFacts,
        section: 'experience' as const,
        locale: 'id' as const,
        allowedFacts: item.allowedFacts,
      }
      let error: unknown
      try {
        validateBulletOutput(JSON.stringify(item.output), input)
      } catch (caught) {
        error = caught
      }
      expect(error).toBeInstanceOf(AIProviderError)
      expect((error as AIProviderError).code).toBe('grounding-violation')
      expect((error as AIProviderError).details.length).toBeGreaterThan(0)
    })
  }
})
