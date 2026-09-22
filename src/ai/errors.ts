/**
 * Provider failure taxonomy (ai-provider-strategy.md §1, FR-406/FR-408).
 *
 * `ai/` owns codes, never wording: user-facing copy for each code lives in
 * `src/content/microcopy` and is mapped in `src/features/ai` (Task 18+), so a
 * boundary-safe module never carries UI strings. Codes are stable identifiers —
 * renaming one is a breaking change for the microcopy mapping.
 */

export const AI_ERROR_CODES = [
  /** No usable provider: no key configured, declined consent, or disabled. */
  'provider-unavailable',
  /** Capability the provider does not implement (e.g. polish on Static). */
  'capability-not-implemented',
  /** User declined the consent dialog — fall back silently, not as a failure. */
  'consent-declined',
  /** Device offline — only meaningful for network providers. */
  'offline',
  /** Provider did not answer in time (FR-406). */
  'timeout',
  /** HTTP 429 — quota is the user's; never burn it with aggressive retries. */
  'rate-limited',
  /** Key rejected or missing at the provider. */
  'auth-failed',
  /** Transport failure that is none of the above. */
  'network-error',
  /** Response was not JSON or did not match the output schema (FR-404). */
  'malformed-output',
  /** Output invented numbers or entities absent from the input (FR-405). */
  'grounding-violation',
] as const

export type AIErrorCode = (typeof AI_ERROR_CODES)[number]

/**
 * Advisory retry flag. Only transient transport failures are retryable;
 * everything else (auth, validation, grounding, consent) must fall back,
 * never spin. Retry policy itself is Task 21.
 */
export function isRetryableErrorCode(code: AIErrorCode): boolean {
  return code === 'timeout' || code === 'network-error' || code === 'rate-limited'
}

export class AIProviderError extends Error {
  readonly code: AIErrorCode
  readonly retryable: boolean
  /**
   * Machine-readable violation detail (e.g. which numbers or entities failed
   * grounding). Never logged (NFR-011) — surfaced only through the explicit
   * preview/fallback UI mapping in features/.
   */
  readonly details: readonly string[]

  constructor(code: AIErrorCode, message?: string, details: readonly string[] = []) {
    super(message ?? code)
    this.name = 'AIProviderError'
    this.code = code
    this.retryable = isRetryableErrorCode(code)
    this.details = details
  }
}
