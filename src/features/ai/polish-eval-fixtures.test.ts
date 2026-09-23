import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { AIProviderError, validatePolishOutput } from '../../ai'
import type { PolishMode } from '../../ai'

/**
 * Permanent C2 grounding regression set (Task 20, FR-405,
 * evaluation-dataset.md §4 — the set only grows). Polish rewrites existing
 * text rather than creating it, so "facts unchanged" is stricter than for
 * bullets: each fixture case is an output that MUST be rejected whole.
 *
 * Note the enforcement boundary: the code rejects *added* numbers/entities
 * (containment against the source text). Silently *dropped* facts are a
 * prompt-level rule (polish.v1.md §7, `warnings` contract) and stay in the
 * manual-eval protocol — the invariant check cannot see what is missing.
 */

interface EvalCase {
  readonly name: string
  readonly mode: PolishMode
  readonly text: string
  readonly output: unknown
}

function loadCases(): EvalCase[] {
  const parsed = JSON.parse(
    readFileSync('fixtures/ai-eval/polish-grounding-violations.json', 'utf8'),
  ) as { cases?: EvalCase[] }
  if (!Array.isArray(parsed.cases) || parsed.cases.length === 0) {
    throw new Error('eval fixture has no cases')
  }
  return parsed.cases
}

describe('polish grounding eval fixtures (FR-405)', () => {
  const cases = loadCases()

  it('ships at least one violation per known class', () => {
    expect(cases.map((item) => item.name).sort()).toEqual([
      'added-company',
      'added-entity-en',
      'added-number',
      'changed-date',
    ])
  })

  for (const item of cases) {
    it(`rejects "${item.name}" without touching the input`, () => {
      const input = { text: item.text, mode: item.mode }
      let error: unknown
      try {
        validatePolishOutput(JSON.stringify(item.output), input)
      } catch (caught) {
        error = caught
      }
      expect(error).toBeInstanceOf(AIProviderError)
      expect((error as AIProviderError).code).toBe('grounding-violation')
      expect((error as AIProviderError).details.length).toBeGreaterThan(0)
    })
  }
})
