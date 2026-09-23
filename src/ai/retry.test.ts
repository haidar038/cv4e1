import { describe, expect, it } from 'vitest'
import { AIProviderError } from './errors'
import {
  computeRetryDelayMs,
  RETRY_AFTER_MAX_MS,
  RETRY_BASE_DELAY_MS,
  RETRY_MAX_ATTEMPTS,
  withRetry,
} from './retry'
import type { RetryPolicy } from './retry'

/** No-op sleep that records requested waits — keeps the suite fast. */
function recordingSleep(sleeps: number[]): (ms: number) => Promise<void> {
  return async (ms: number) => {
    sleeps.push(ms)
  }
}

function basePolicy(sleeps: number[], extra?: Partial<RetryPolicy>): RetryPolicy {
  return {
    sleep: recordingSleep(sleeps),
    random: () => 0,
    ...extra,
  }
}

async function catchError(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise
  } catch (error) {
    return error
  }
  throw new Error('expected a throw, nothing was thrown')
}

describe('computeRetryDelayMs', () => {
  it('backs off exponentially with pinned entropy (0.5s, 1s, 2s)', () => {
    const timeout = new AIProviderError('timeout')
    expect(computeRetryDelayMs(0, timeout, { random: () => 0 })).toBe(RETRY_BASE_DELAY_MS / 2)
    expect(computeRetryDelayMs(1, timeout, { random: () => 0 })).toBe(RETRY_BASE_DELAY_MS)
    expect(computeRetryDelayMs(2, timeout, { random: () => 0 })).toBe(RETRY_BASE_DELAY_MS * 2)
  })

  it('stays inside the jitter band for any entropy', () => {
    const error = new AIProviderError('network-error')
    for (const random of [() => 0, () => 0.5, () => 0.9999]) {
      const delay = computeRetryDelayMs(1, error, { random })
      expect(delay).toBeGreaterThanOrEqual(RETRY_BASE_DELAY_MS)
      expect(delay).toBeLessThanOrEqual(RETRY_BASE_DELAY_MS * 2)
    }
  })

  it('honors a parsed Retry-After hint on rate-limited, capped', () => {
    const hinted = new AIProviderError('rate-limited', undefined, [], { retryAfterMs: 5_000 })
    expect(computeRetryDelayMs(0, hinted, { random: () => 0 })).toBe(5_000)
    const greedy = new AIProviderError('rate-limited', undefined, [], { retryAfterMs: 120_000 })
    expect(computeRetryDelayMs(0, greedy, { random: () => 0 })).toBe(RETRY_AFTER_MAX_MS)
  })

  it('falls back to backoff when rate-limited carries no hint', () => {
    const bare = new AIProviderError('rate-limited')
    expect(computeRetryDelayMs(0, bare, { random: () => 0 })).toBe(RETRY_BASE_DELAY_MS / 2)
  })

  it('clamps negative attempt indexes and bases instead of trusting them', () => {
    const error = new AIProviderError('timeout')
    expect(computeRetryDelayMs(-3, error, { random: () => 0 })).toBe(RETRY_BASE_DELAY_MS / 2)
    expect(computeRetryDelayMs(0, error, { baseDelayMs: -500, random: () => 0 })).toBe(0)
  })
})

describe('withRetry', () => {
  it('passes a first-try success through with no waiting', async () => {
    const sleeps: number[] = []
    let calls = 0
    const result = await withRetry(() => {
      calls += 1
      return Promise.resolve('ok')
    }, basePolicy(sleeps))
    expect(result).toBe('ok')
    expect(calls).toBe(1)
    expect(sleeps).toEqual([])
  })

  it('recovers when a transient failure clears on retry', async () => {
    const sleeps: number[] = []
    let calls = 0
    const result = await withRetry(() => {
      calls += 1
      return calls === 1
        ? Promise.reject(new AIProviderError('timeout'))
        : Promise.resolve('recovered')
    }, basePolicy(sleeps))
    expect(result).toBe('recovered')
    expect(calls).toBe(2)
    expect(sleeps).toEqual([RETRY_BASE_DELAY_MS / 2])
  })

  it('gives up after the bounded attempts and rethrows the last error', async () => {
    const sleeps: number[] = []
    let calls = 0
    const thrown = await catchError(
      withRetry(() => {
        calls += 1
        return Promise.reject(new AIProviderError('network-error'))
      }, basePolicy(sleeps)),
    )
    expect(calls).toBe(RETRY_MAX_ATTEMPTS)
    expect(thrown).toBeInstanceOf(AIProviderError)
    expect((thrown as AIProviderError).code).toBe('network-error')
    // Default policy: 3 attempts, 2 waits of ~0.5s and ~1s.
    expect(RETRY_MAX_ATTEMPTS).toBe(3)
    expect(sleeps).toEqual([RETRY_BASE_DELAY_MS / 2, RETRY_BASE_DELAY_MS])
  })

  it.each([
    'provider-unavailable',
    'capability-not-implemented',
    'consent-declined',
    'offline',
    'auth-failed',
    'malformed-output',
    'grounding-violation',
  ] as const)('never retries %s — one call, immediate rethrow', async (code) => {
    const sleeps: number[] = []
    let calls = 0
    const thrown = await catchError(
      withRetry(() => {
        calls += 1
        return Promise.reject(new AIProviderError(code))
      }, basePolicy(sleeps)),
    )
    expect(calls).toBe(1)
    expect(sleeps).toEqual([])
    expect((thrown as AIProviderError).code).toBe(code)
  })

  it('rethrows programming errors untouched — they are not transport failures', async () => {
    const sleeps: number[] = []
    let calls = 0
    const boom = new Error('boom')
    const thrown = await catchError(
      withRetry(() => {
        calls += 1
        return Promise.reject(boom)
      }, basePolicy(sleeps)),
    )
    expect(calls).toBe(1)
    expect(sleeps).toEqual([])
    expect(thrown).toBe(boom)
  })

  it('waits out a server Retry-After hint instead of the backoff', async () => {
    const sleeps: number[] = []
    let calls = 0
    const result = await withRetry(() => {
      calls += 1
      return calls === 1
        ? Promise.reject(new AIProviderError('rate-limited', undefined, [], { retryAfterMs: 250 }))
        : Promise.resolve('after-quota')
    }, basePolicy(sleeps))
    expect(result).toBe('after-quota')
    expect(calls).toBe(2)
    expect(sleeps).toEqual([250])
  })

  it('stops retrying when shouldStop fires and reports offline', async () => {
    const sleeps: number[] = []
    let calls = 0
    const thrown = await catchError(
      withRetry(
        () => {
          calls += 1
          return Promise.reject(new AIProviderError('timeout'))
        },
        basePolicy(sleeps, { shouldStop: () => true }),
      ),
    )
    // Fail fast: the first failure already sees the dead radio.
    expect(calls).toBe(1)
    expect(sleeps).toEqual([])
    expect(thrown).toBeInstanceOf(AIProviderError)
    expect((thrown as AIProviderError).code).toBe('offline')
  })

  it('keeps retrying while shouldStop stays false', async () => {
    const sleeps: number[] = []
    let calls = 0
    const thrown = await catchError(
      withRetry(
        () => {
          calls += 1
          return Promise.reject(new AIProviderError('timeout'))
        },
        basePolicy(sleeps, { shouldStop: () => false }),
      ),
    )
    expect(calls).toBe(RETRY_MAX_ATTEMPTS)
    expect((thrown as AIProviderError).code).toBe('timeout')
  })

  it('honors a custom attempt budget, clamped to at least one call', async () => {
    const single: number[] = []
    let singleCalls = 0
    await catchError(
      withRetry(
        () => {
          singleCalls += 1
          return Promise.reject(new AIProviderError('timeout'))
        },
        basePolicy(single, { maxAttempts: 1 }),
      ),
    )
    expect(singleCalls).toBe(1)
    expect(single).toEqual([])

    const zero: number[] = []
    let zeroCalls = 0
    await catchError(
      withRetry(
        () => {
          zeroCalls += 1
          return Promise.reject(new AIProviderError('timeout'))
        },
        basePolicy(zero, { maxAttempts: 0 }),
      ),
    )
    expect(zeroCalls).toBe(1)
    expect(zero).toEqual([])
  })
})
