import { AIProviderError, isRetryableErrorCode } from './errors'

/**
 * Bounded retry policy for transient provider failures (Task 21, FR-406).
 *
 * Only `timeout`, `network-error`, and `rate-limited` are ever retried
 * (`isRetryableErrorCode`); auth, validation, grounding, consent, and
 * programming errors rethrow immediately so the caller falls back to the
 * static provider without burning the user's quota. Attempts are bounded
 * (default 1 initial + 2 retries) with equal-jitter exponential backoff, so
 * the worst added wait stays around three seconds. A server `Retry-After`
 * hint is honored but capped, so no response can park the UI.
 *
 * Pure and injectable: `sleep`, `random`, and `shouldStop` are seams for
 * tests. Production passes nothing and gets real timers.
 */

/** Total attempts including the first call (default 1 + 2 retries). */
export const RETRY_MAX_ATTEMPTS = 3
/** Backoff base: waits are ~1s then ~2s (equal jitter halves each step). */
export const RETRY_BASE_DELAY_MS = 1_000
/** A server `Retry-After` hint is never honored beyond this. */
export const RETRY_AFTER_MAX_MS = 10_000

export interface RetryPolicy {
  /** Total attempts including the first call. Clamped to >= 1. */
  readonly maxAttempts?: number | undefined
  readonly baseDelayMs?: number | undefined
  readonly retryAfterMaxMs?: number | undefined
  /** Injectable wait — production uses a real `setTimeout`. */
  readonly sleep?: ((ms: number) => Promise<void>) | undefined
  /** Injectable entropy for the jitter — tests pin this for determinism. */
  readonly random?: (() => number) | undefined
  /**
   * Polled before each retry; when true the wait is skipped and an
   * `offline` error is thrown instead (e.g. the device lost connectivity
   * mid-retry — retrying a dead radio only burns quota and time).
   */
  readonly shouldStop?: (() => boolean) | undefined
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * How long to wait after `failedAttemptIndex` (0-based) failed with `error`.
 * Rate-limited honors a parsed `Retry-After` hint up to the cap; everything
 * else uses equal-jitter exponential backoff (`backoff/2 + random *
 * backoff/2`), so with `random() === 0` the waits are exactly 0.5s, 1s, …
 */
export function computeRetryDelayMs(
  failedAttemptIndex: number,
  error: AIProviderError,
  options?: {
    readonly baseDelayMs?: number | undefined
    readonly retryAfterMaxMs?: number | undefined
    readonly random?: (() => number) | undefined
  },
): number {
  const base = Math.max(0, options?.baseDelayMs ?? RETRY_BASE_DELAY_MS)
  const cap = Math.max(0, options?.retryAfterMaxMs ?? RETRY_AFTER_MAX_MS)
  if (error.code === 'rate-limited' && error.retryAfterMs !== undefined) {
    return Math.min(Math.max(0, error.retryAfterMs), cap)
  }
  const backoff = base * 2 ** Math.max(0, failedAttemptIndex)
  const random = options?.random ?? Math.random
  return backoff / 2 + random() * (backoff / 2)
}

/**
 * Runs `call`, retrying transient `AIProviderError`s per the policy.
 * Resolves with the first success; otherwise rethrows the last error (or an
 * `offline` error when `shouldStop` fires). Never swallows, never logs.
 */
export async function withRetry<T>(call: () => Promise<T>, policy?: RetryPolicy): Promise<T> {
  const maxAttempts = Math.max(1, Math.floor(policy?.maxAttempts ?? RETRY_MAX_ATTEMPTS))
  const sleep = policy?.sleep ?? defaultSleep
  let lastError: unknown
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await call()
    } catch (error) {
      if (!(error instanceof AIProviderError) || !isRetryableErrorCode(error.code)) throw error
      lastError = error
      if (policy?.shouldStop?.()) throw new AIProviderError('offline')
      if (attempt + 1 < maxAttempts) await sleep(computeRetryDelayMs(attempt, error, policy))
    }
  }
  throw lastError
}
