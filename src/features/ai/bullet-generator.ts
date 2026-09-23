import {
  AIProviderError,
  GROQ_DEFAULT_MODEL,
  GroqProvider,
  OpenAICompatibleProvider,
  withRetry,
} from '../../ai'
import type { AIErrorCode, AIProvider, BulletSuggestion, FetchImpl, RetryPolicy } from '../../ai'
import type { AILocale } from '../../ai'
import type { BulletGenerationInput } from '../../ai'
import type { SectionKey } from '../../core/view-models'
import {
  BULLET_MAX_COMPLETION_TOKENS,
  BULLET_MAX_INPUT_CHARS,
  BULLET_MAX_TARGET_ROLE_CHARS,
  getBulletSystemPrompt,
  truncateBulletText,
} from './bullet-prompts'
import { type AiProviderId, needsConsent } from './consent-store'
import { getSessionCredentials } from './session-keys'
import { StaticSuggestionProvider } from './static-provider'

/**
 * C1 bullet orchestrator (Task 19, FR-403/404/405/406).
 *
 * One narrow path: build the DF-6 minimal input → pick the configured
 * network provider (or none) → call it (bounded retry on transient
 * failures, Task 21) → return validated candidates.
 * Every failure lands on the offline static provider; the draft is never
 * touched here (suggestions reach the DocumentStore only through an
 * explicit Apply in the panel — FR-401).
 *
 * Consent is fail-closed: a network provider without a session grant sends
 * nothing and reports `consent-declined` (the panel shows the dialog and
 * retries after the grant). No key is ever read except from the
 * tab-local vault (FR-407).
 */

/** Sections whose bullets the generator serves — the catalog's target sections. */
export type BulletSectionKey = Extract<SectionKey, 'experience' | 'organizations' | 'projects'>

export interface BulletRequest {
  /** Raw task text exactly as typed (snapshot when the panel opened). */
  readonly rawTask: string
  readonly section: BulletSectionKey
  /** Optional role the user is applying for — steers wording, never a new claim. */
  readonly targetRole?: string
  readonly locale: AILocale
}

export type BulletSource = 'ai' | 'static'

export interface BulletResult {
  readonly suggestions: readonly BulletSuggestion[]
  readonly source: BulletSource
  /** Null on success and on empty input; otherwise the failure that caused fallback. */
  readonly errorCode: AIErrorCode | null
}

export interface BulletRequestOptions {
  /** Injectable transport for tests — production passes the platform fetch. */
  readonly fetchImpl?: FetchImpl
  /**
   * Test seam: bypasses vault selection and the consent backstop. Unit tests
   * for the contract/malformed/timeout paths use this; production never does.
   */
  readonly provider?: AIProvider
  /**
   * Retry seam: overrides the bounded retry policy (waits, entropy). Unit
   * tests inject a no-op sleep so the backoff costs nothing; production
   * passes nothing and gets the default 1+2 attempts with real timers.
   */
  readonly retry?: RetryPolicy
}

/** Which network provider (if any) has session credentials. Groq wins ties. */
export function selectBulletProviderId(): AiProviderId | null {
  const groq = getSessionCredentials('groq')
  if (groq !== null && groq.apiKey.trim() !== '') return 'groq'
  const compatible = getSessionCredentials('openai-compatible')
  if (compatible !== null && compatible.apiKey.trim() !== '') return 'openai-compatible'
  return null
}

/**
 * Builds the DF-6 minimal input (data-flow.md): raw text + section +
 * optional target role + locale + the grounding source. Nothing else —
 * no name, contact, photo, or other draft content — can reach this shape,
 * because the request type carries nothing else.
 */
export function buildBulletInput(request: BulletRequest): BulletGenerationInput {
  const rawTask = truncateBulletText(request.rawTask, BULLET_MAX_INPUT_CHARS)
  const targetRole = truncateBulletText(request.targetRole ?? '', BULLET_MAX_TARGET_ROLE_CHARS)
  const allowedFacts = targetRole === '' ? rawTask : `${rawTask}\n${targetRole}`
  const input: BulletGenerationInput = {
    rawTask,
    section: request.section,
    locale: request.locale,
    allowedFacts,
  }
  return targetRole === '' ? input : { ...input, targetRole }
}

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false
}

function staticFallback(
  input: BulletGenerationInput,
  errorCode: AIErrorCode | null,
): Promise<BulletResult> {
  const staticProvider = new StaticSuggestionProvider()
  return staticProvider
    .generateBullets(input)
    .then((suggestions) => ({ suggestions, source: 'static' as const, errorCode }))
}

function buildNetworkProvider(providerId: AiProviderId, fetchImpl?: FetchImpl): AIProvider | null {
  const credentials = getSessionCredentials(providerId)
  if (credentials === null || credentials.apiKey.trim() === '') return null
  const systemPrompt = getBulletSystemPrompt()
  if (providerId === 'groq') {
    return new GroqProvider({
      apiKey: credentials.apiKey,
      ...(credentials.model !== undefined && credentials.model.trim() !== ''
        ? { model: credentials.model }
        : { model: GROQ_DEFAULT_MODEL }),
      systemPrompt,
      maxCompletionTokens: BULLET_MAX_COMPLETION_TOKENS,
      ...(fetchImpl !== undefined ? { fetchImpl } : {}),
    })
  }
  if (credentials.model === undefined || credentials.model.trim() === '') return null
  if (credentials.baseUrl === undefined) return null
  return new OpenAICompatibleProvider({
    apiKey: credentials.apiKey,
    model: credentials.model,
    baseUrl: credentials.baseUrl,
    systemPrompt,
    maxCompletionTokens: BULLET_MAX_COMPLETION_TOKENS,
    ...(fetchImpl !== undefined ? { fetchImpl } : {}),
  })
}

export async function requestBulletSuggestions(
  request: BulletRequest,
  options?: BulletRequestOptions,
): Promise<BulletResult> {
  const input = buildBulletInput(request)
  if (input.rawTask === '') {
    return staticFallback(input, null)
  }

  if (options?.provider !== undefined) {
    const testProvider = options.provider
    try {
      const suggestions = await withRetry(() => testProvider.generateBullets(input), options.retry)
      return { suggestions, source: 'ai', errorCode: null }
    } catch (error) {
      const code = error instanceof AIProviderError ? error.code : 'network-error'
      return staticFallback(input, code)
    }
  }

  const providerId = selectBulletProviderId()
  if (providerId === null) return staticFallback(input, 'provider-unavailable')
  if (isOffline()) return staticFallback(input, 'offline')
  if (needsConsent(providerId)) return staticFallback(input, 'consent-declined')

  const provider = buildNetworkProvider(providerId, options?.fetchImpl)
  if (provider === null) return staticFallback(input, 'provider-unavailable')
  try {
    // Bounded retry (Task 21, FR-406): transient failures get up to two more
    // attempts with backoff; anything else — and a radio that dies mid-retry
    // — falls through to the static provider below. Validation and grounding
    // run inside the provider call, so a rejected candidate is never retried.
    const suggestions = await withRetry(() => provider.generateBullets(input), {
      ...options?.retry,
      shouldStop: isOffline,
    })
    return { suggestions, source: 'ai', errorCode: null }
  } catch (error) {
    const code = error instanceof AIProviderError ? error.code : 'network-error'
    return staticFallback(input, code)
  }
}
