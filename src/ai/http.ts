import { AIProviderError } from './errors'

/**
 * Minimal HTTP transport for OpenAI-compatible chat APIs (Task 18, FR-402/407).
 *
 * `fetch` is a platform global, not a package import, so this module keeps
 * `ai/` dependency-free (architecture-overview.md §5). Timeouts use
 * AbortController; every failure maps to the taxonomy in `./errors` — the
 * transport never throws anything else. No logging here; retries live in
 * `./retry` (bounded, quota-respecting) and callers opt in explicitly.
 */

/** Default per-request timeout (maintainer decision, Task 18 Q2). */
export const AI_REQUEST_TIMEOUT_MS = 30_000

export interface ChatMessage {
  readonly role: 'system' | 'user' | 'assistant'
  readonly content: string
}

/** Injectable for tests — production passes the platform `fetch`. */
export type FetchImpl = (url: string, init: RequestInit) => Promise<Response>

export interface PostJsonOptions {
  readonly headers?: Record<string, string>
  readonly body: unknown
  /** Explicit `undefined` allowed: falls back to AI_REQUEST_TIMEOUT_MS. */
  readonly timeoutMs?: number | undefined
  readonly fetchImpl?: FetchImpl | undefined
}

/**
 * Parses a `Retry-After` header value into milliseconds. Accepts
 * delay-seconds (`"120"`) and HTTP-dates; anything else (missing, negative,
 * garbage) yields `undefined` so the caller falls back to exponential
 * backoff instead of trusting the wire.
 */
function parseRetryAfterMs(value: string | null): number | undefined {
  if (value === null) return undefined
  const trimmed = value.trim()
  if (trimmed === '') return undefined
  if (/^\d+$/.test(trimmed)) return Number(trimmed) * 1000
  // A bare number that is not delay-seconds (negative, decimal, signed) is
  // malformed — and no valid HTTP-date ever starts with a digit or a sign,
  // so it must not fall through to Date.parse (which accepts junk like "-5").
  if (/^[+-]?\d/.test(trimmed)) return undefined
  const timestamp = Date.parse(trimmed)
  if (!Number.isNaN(timestamp)) return Math.max(0, timestamp - Date.now())
  return undefined
}

function httpStatusToError(status: number, headers: Headers): AIProviderError {
  if (status === 401 || status === 403) return new AIProviderError('auth-failed')
  if (status === 429) {
    return new AIProviderError('rate-limited', undefined, [], {
      retryAfterMs: parseRetryAfterMs(headers.get('retry-after')),
    })
  }
  return new AIProviderError('network-error')
}

function fetchFailureToError(error: unknown): AIProviderError {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return new AIProviderError('timeout')
  }
  return new AIProviderError('network-error')
}

/** POSTs JSON and returns the parsed response. Rejects empty/non-JSON bodies. */
export async function postJson(url: string, options: PostJsonOptions): Promise<unknown> {
  const timeoutMs = options.timeoutMs ?? AI_REQUEST_TIMEOUT_MS
  const fetchImpl = options.fetchImpl ?? fetch
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  let response: Response
  try {
    response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      body: JSON.stringify(options.body),
      signal: controller.signal,
    })
  } catch (error) {
    throw fetchFailureToError(error)
  } finally {
    clearTimeout(timer)
  }
  if (!response.ok) throw httpStatusToError(response.status, response.headers)
  try {
    return (await response.json()) as unknown
  } catch {
    throw new AIProviderError('malformed-output')
  }
}
