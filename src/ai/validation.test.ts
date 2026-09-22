import { describe, expect, it } from 'vitest'
import { AIProviderError } from './errors'
import type { AIErrorCode } from './errors'
import type { BulletGenerationInput, PolishInput } from './types'
import {
  checkGrounding,
  extractJsonFromText,
  validateBulletOutput,
  validatePolishOutput,
} from './validation'

function catchAiError(fn: () => unknown): AIProviderError {
  try {
    fn()
  } catch (error) {
    if (error instanceof AIProviderError) return error
    throw new Error(`expected AIProviderError, got ${String(error)}`)
  }
  throw new Error('expected AIProviderError, nothing was thrown')
}

function expectCode(fn: () => unknown, code: AIErrorCode): AIProviderError {
  const error = catchAiError(fn)
  expect(error.code).toBe(code)
  return error
}

const bulletInput: BulletGenerationInput = {
  rawTask: 'Membantu menyusun laporan penjualan mingguan.',
  section: 'experience',
  locale: 'id',
  allowedFacts: 'Membantu menyusun laporan penjualan mingguan.',
}

function bulletEnvelope(text: string, rationale: string): string {
  return JSON.stringify({
    suggestions: [
      {
        text,
        actionVerb: 'Menyusun',
        usesPlaceholder: true,
        rationale,
        warnings: [],
        inventedFutureField: 'ignored',
      },
    ],
  })
}

describe('extractJsonFromText', () => {
  it('parses plain JSON', () => {
    expect(extractJsonFromText('{"a":1}')).toEqual({ a: 1 })
  })

  it('parses fenced blocks with and without the json tag', () => {
    expect(extractJsonFromText('```json\n{"a":1}\n```')).toEqual({ a: 1 })
    expect(extractJsonFromText('```\n{"a":1}\n```')).toEqual({ a: 1 })
  })

  it('rejects non-JSON, empty text, and prose around JSON', () => {
    expectCode(() => extractJsonFromText('bukan json'), 'malformed-output')
    expectCode(() => extractJsonFromText('   '), 'malformed-output')
    expectCode(
      () => validateBulletOutput('Berikut hasilnya: {"suggestions": []}', bulletInput),
      'malformed-output',
    )
  })

  it('parses JSON primitives at stage 1; the shape stage rejects them', () => {
    expect(extractJsonFromText('"just a string"')).toBe('just a string')
    expectCode(() => validateBulletOutput('"just a string"', bulletInput), 'malformed-output')
  })
})

describe('validateBulletOutput shape', () => {
  const rationale = 'Membantu menyusun laporan penjualan mingguan.'

  it('accepts a valid envelope and ignores unknown fields', () => {
    const suggestions = validateBulletOutput(
      bulletEnvelope(
        'Membantu menyusun laporan penjualan mingguan [dampak yang dapat diukur].',
        rationale,
      ),
      bulletInput,
    )
    expect(suggestions).toHaveLength(1)
    expect(suggestions[0]?.text).toContain('[dampak yang dapat diukur]')
    expect(suggestions[0]?.usesPlaceholder).toBe(true)
  })

  it('rejects missing, non-array, empty, and mistyped envelopes', () => {
    expectCode(() => validateBulletOutput('{}', bulletInput), 'malformed-output')
    expectCode(() => validateBulletOutput('{"suggestions": {}}', bulletInput), 'malformed-output')
    expectCode(() => validateBulletOutput('{"suggestions": []}', bulletInput), 'malformed-output')
    expectCode(() => validateBulletOutput('[]', bulletInput), 'malformed-output')
    expectCode(
      () => validateBulletOutput(JSON.stringify({ suggestions: [{ text: 5 }] }), bulletInput),
      'malformed-output',
    )
    expectCode(
      () =>
        validateBulletOutput(
          JSON.stringify({
            suggestions: [
              {
                text: '   ',
                actionVerb: 'Menyusun',
                usesPlaceholder: true,
                rationale,
                warnings: [],
              },
            ],
          }),
          bulletInput,
        ),
      'malformed-output',
    )
  })

  it('rejects items with missing or mistyped required fields', () => {
    const { suggestions, ...rest } = { suggestions: [{ text: 'Valid.' }] }
    void suggestions
    expectCode(() => validateBulletOutput(JSON.stringify(rest), bulletInput), 'malformed-output')
    expectCode(
      () =>
        validateBulletOutput(
          JSON.stringify({
            suggestions: [
              {
                text: 'Membantu menyusun laporan penjualan mingguan.',
                actionVerb: 'Menyusun',
                rationale,
                warnings: [],
              },
            ],
          }),
          bulletInput,
        ),
      'malformed-output',
    )
  })
})

describe('validateBulletOutput grounding (FR-405 invariants)', () => {
  const rationale = 'Membantu menyusun laporan penjualan mingguan.'

  it('rejects invented percentages with machine-readable details', () => {
    const error = expectCode(
      () =>
        validateBulletOutput(
          bulletEnvelope('Meningkatkan efisiensi pelaporan sebesar 30%.', rationale),
          bulletInput,
        ),
      'grounding-violation',
    )
    expect(error.details.length).toBeGreaterThan(0)
  })

  it('rejects invented companies and years', () => {
    expectCode(
      () =>
        validateBulletOutput(
          bulletEnvelope('Bekerja di PT Maju Jaya sebagai staf.', 'Bekerja sebagai staf.'),
          {
            ...bulletInput,
            rawTask: 'Bekerja sebagai staf administrasi.',
            allowedFacts: 'Bekerja sebagai staf administrasi.',
          },
        ),
      'grounding-violation',
    )
    expectCode(
      () =>
        validateBulletOutput(
          bulletEnvelope('Magang selama 2024 dengan hasil baik.', 'Magang selama 2022.'),
          {
            ...bulletInput,
            rawTask: 'Magang selama 2022.',
            allowedFacts: 'Magang selama 2022.',
          },
        ),
      'grounding-violation',
    )
  })

  it('keeps numbers legitimately present in the input (Q8)', () => {
    const facts = 'Memimpin tim beranggotakan 5 orang selama 2 tahun dengan IPK 3,52.'
    const suggestions = validateBulletOutput(
      bulletEnvelope(
        'Memimpin tim beranggotakan 5 orang selama 2 tahun dengan IPK 3,52 [dampak yang dapat diukur].',
        'Tim beranggotakan 5 orang selama 2 tahun.',
      ),
      { ...bulletInput, rawTask: facts, allowedFacts: facts },
    )
    expect(suggestions).toHaveLength(1)
    expect(suggestions[0]?.text).toContain('3,52')
  })

  it('does not treat bracketed placeholders as entities', () => {
    const suggestions = validateBulletOutput(
      bulletEnvelope('Menyusun [Jumlah Orang] laporan.', 'Menyusun laporan mingguan.'),
      {
        ...bulletInput,
        rawTask: 'Menyusun laporan mingguan.',
        allowedFacts: 'Menyusun laporan mingguan.',
      },
    )
    expect(suggestions).toHaveLength(1)
  })

  it('checks the rationale too, not just the suggestion text', () => {
    expectCode(
      () =>
        validateBulletOutput(
          bulletEnvelope(
            'Membantu menyusun laporan penjualan mingguan.',
            'Meningkatkan efisiensi sebesar 30%.',
          ),
          bulletInput,
        ),
      'grounding-violation',
    )
  })
})

describe('checkGrounding', () => {
  it('returns no violations for grounded output', () => {
    expect(
      checkGrounding(
        ['Membantu menyusun laporan penjualan mingguan.'],
        'Membantu menyusun laporan penjualan mingguan.',
      ),
    ).toEqual([])
  })

  it('dedupes and caps violation details', () => {
    const violations = checkGrounding(['PT A PT B PT C PT D PT E PT F naik 1% 2% 3%.'], 'Bekerja.')
    expect(violations.length).toBeGreaterThan(0)
    expect(violations.length).toBeLessThanOrEqual(5)
    expect(new Set(violations).size).toBe(violations.length)
  })
})

describe('validatePolishOutput', () => {
  const polishInput: PolishInput = {
    text: 'Saya bekerja sebagai staf administrasi sejak 2023.',
    mode: 'id',
  }

  it('accepts grounded polish', () => {
    const result = validatePolishOutput(
      JSON.stringify({
        text: 'Saya bekerja sebagai staf administrasi sejak 2023.',
        changes: ['Perbaikan tanda baca.'],
        warnings: [],
      }),
      polishInput,
    )
    expect(result.text).toContain('2023')
    expect(result.changes).toEqual(['Perbaikan tanda baca.'])
  })

  it('rejects changed dates and empty text', () => {
    expectCode(
      () =>
        validatePolishOutput(
          JSON.stringify({
            text: 'Saya bekerja sebagai staf administrasi sejak 2024.',
            changes: [],
            warnings: [],
          }),
          polishInput,
        ),
      'grounding-violation',
    )
    expectCode(
      () =>
        validatePolishOutput(JSON.stringify({ text: '', changes: [], warnings: [] }), polishInput),
      'malformed-output',
    )
    expectCode(
      () => validatePolishOutput(JSON.stringify({ text: 'Valid.', warnings: [] }), polishInput),
      'malformed-output',
    )
  })
})
