import { describe, expect, it } from 'vitest'
import { AI_ERROR_CODES, AIProviderError, isRetryableErrorCode } from './errors'
import type { AIErrorCode } from './errors'

describe('AI_ERROR_CODES', () => {
  it('lists every documented failure without duplicates', () => {
    expect(new Set(AI_ERROR_CODES).size).toBe(AI_ERROR_CODES.length)
    expect(AI_ERROR_CODES).toContain('provider-unavailable')
    expect(AI_ERROR_CODES).toContain('malformed-output')
    expect(AI_ERROR_CODES).toContain('grounding-violation')
  })
})

describe('isRetryableErrorCode', () => {
  it.each([
    ['timeout', true],
    ['network-error', true],
    ['rate-limited', true],
    ['provider-unavailable', false],
    ['capability-not-implemented', false],
    ['consent-declined', false],
    ['offline', false],
    ['auth-failed', false],
    ['malformed-output', false],
    ['grounding-violation', false],
  ] as const)('%s → retryable %s', (code: AIErrorCode, retryable: boolean) => {
    expect(isRetryableErrorCode(code)).toBe(retryable)
  })

  it('covers every code so new failures get an explicit policy', () => {
    for (const code of AI_ERROR_CODES) {
      expect(typeof isRetryableErrorCode(code)).toBe('boolean')
    }
  })
})

describe('AIProviderError', () => {
  it('carries its code and derives retryability', () => {
    const error = new AIProviderError('timeout')
    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('AIProviderError')
    expect(error.code).toBe('timeout')
    expect(error.retryable).toBe(true)
    expect(error.message).toBe('timeout')
  })

  it('accepts an explicit message without changing the code', () => {
    const error = new AIProviderError('auth-failed', 'custom detail')
    expect(error.code).toBe('auth-failed')
    expect(error.message).toBe('custom detail')
    expect(error.retryable).toBe(false)
    expect(error.details).toEqual([])
  })

  it('carries machine-readable details without touching the message', () => {
    const error = new AIProviderError('grounding-violation', undefined, [
      'angka "30%" tidak ada pada input',
    ])
    expect(error.code).toBe('grounding-violation')
    expect(error.message).toBe('grounding-violation')
    expect(error.details).toEqual(['angka "30%" tidak ada pada input'])
  })
})
