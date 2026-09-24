import {
  AIProviderError,
  GROQ_DEFAULT_MODEL,
  GroqProvider,
  OpenAICompatibleProvider,
  withRetry,
} from '../../ai'
import type {
  AIErrorCode,
  AIProvider,
  BulletGenerationInput,
  BulletSuggestion,
  FetchImpl,
  RetryPolicy,
} from '../../ai'
import type { AILocale } from '../../ai'
import type { SectionKey } from '../../core/view-models'
import {
  ACHIEVEMENT_MAX_COMPLETION_TOKENS,
  ACHIEVEMENT_MAX_INPUT_CHARS,
  ACHIEVEMENT_MAX_SUGGESTIONS,
  getAchievementSystemPrompt,
  truncateAchievementText,
} from './achievement-prompts'
import { type AiProviderId, needsConsent } from './consent-store'
import { getSessionCredentials } from './session-keys'
import { StaticSuggestionProvider } from './static-provider'

/**
 * C1b achievement orchestrator (unified flow, FR-401/402/403/404/405/406/408).
 *
 * One narrow path: build the DF-6 minimal input from the free-text
 * achievement → pick the configured network provider (or none) → call it
 * with bounded retry → cap at 3 suggestions → return validated candidates.
 * Every failure lands on the offline static provider; the draft is never
 * touched here (candidates reach the DocumentStore only through an explicit
 * per-item Apply in the panel — FR-401).
 *
 * The provider contract is shared with C1 (`generateBullets`): the
 * achievement description travels as `rawTask`, so no `AIProvider`
 * interface change was needed. The `targetRole` steer is out of scope for
 * this flow — the description itself carries the role context.
 *
 * Consent is fail-closed: a network provider without a session grant sends
 * nothing and reports `consent-declined` (the panel shows the dialog and
 * retries after the grant). No key is ever read except from the
 * tab-local vault (FR-407).
 */

/** Sections whose bullets the unified flow serves — same as C1. */
export type AchievementSectionKey = Extract<SectionKey, 'experience' | 'organizations' | 'projects'>

export interface AchievementRequest {
  /** Free-text achievement description (snapshot when the panel opened). */
  readonly description: string
  readonly section: AchievementSectionKey
  readonly locale: AILocale
}

export type AchievementSource = 'ai' | 'static'

export interface AchievementResult {
  readonly suggestions: readonly BulletSuggestion[]
  readonly source: AchievementSource
  /** Null on success and on empty input; otherwise the failure that caused fallback. */
  readonly errorCode: AIErrorCode | null
}

export interface AchievementRequestOptions {
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
export function selectAchievementProviderId(): AiProviderId | null {
  const groq = getSessionCredentials('groq')
  if (groq !== null && groq.apiKey.trim() !== '') return 'groq'
  const compatible = getSessionCredentials('openai-compatible')
  if (compatible !== null && compatible.apiKey.trim() !== '') return 'openai-compatible'
  return null
}

/**
 * Builds the DF-6 minimal input (data-flow.md): the achievement description
 * plus section plus locale plus the grounding source. Nothing else — no
 * name, contact, photo, or other draft content — can reach this shape,
 * because the request type carries nothing else.
 */
export function buildAchievementInput(request: AchievementRequest): BulletGenerationInput {
  const rawTask = truncateAchievementText(request.description, ACHIEVEMENT_MAX_INPUT_CHARS)
  return {
    rawTask,
    section: request.section,
    locale: request.locale,
    allowedFacts: rawTask,
  }
}

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false
}

function staticFallback(
  input: BulletGenerationInput,
  errorCode: AIErrorCode | null,
): Promise<AchievementResult> {
  const staticProvider = new StaticSuggestionProvider()
  return staticProvider.generateBullets(input).then((suggestions) => ({
    suggestions: suggestions.slice(0, ACHIEVEMENT_MAX_SUGGESTIONS),
    source: 'static' as const,
    errorCode,
  }))
}

function buildNetworkProvider(providerId: AiProviderId, fetchImpl?: FetchImpl): AIProvider | null {
  const credentials = getSessionCredentials(providerId)
  if (credentials === null || credentials.apiKey.trim() === '') return null
  const systemPrompt = getAchievementSystemPrompt()
  if (providerId === 'groq') {
    return new GroqProvider({
      apiKey: credentials.apiKey,
      ...(credentials.model !== undefined && credentials.model.trim() !== ''
        ? { model: credentials.model }
        : { model: GROQ_DEFAULT_MODEL }),
      systemPrompt,
      maxCompletionTokens: ACHIEVEMENT_MAX_COMPLETION_TOKENS,
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
    maxCompletionTokens: ACHIEVEMENT_MAX_COMPLETION_TOKENS,
    ...(fetchImpl !== undefined ? { fetchImpl } : {}),
  })
}

export async function requestAchievementBullets(
  request: AchievementRequest,
  options?: AchievementRequestOptions,
): Promise<AchievementResult> {
  const input = buildAchievementInput(request)
  if (input.rawTask === '') {
    return staticFallback(input, null)
  }

  if (options?.provider !== undefined) {
    const testProvider = options.provider
    try {
      const suggestions = await withRetry(() => testProvider.generateBullets(input), options.retry)
      return {
        suggestions: suggestions.slice(0, ACHIEVEMENT_MAX_SUGGESTIONS),
        source: 'ai',
        errorCode: null,
      }
    } catch (error) {
      const code = error instanceof AIProviderError ? error.code : 'network-error'
      return staticFallback(input, code)
    }
  }

  const providerId = selectAchievementProviderId()
  if (providerId === null) return staticFallback(input, 'provider-unavailable')
  if (isOffline()) return staticFallback(input, 'offline')
  if (needsConsent(providerId)) return staticFallback(input, 'consent-declined')

  const provider = buildNetworkProvider(providerId, options?.fetchImpl)
  if (provider === null) return staticFallback(input, 'provider-unavailable')
  try {
    // Bounded retry (Task 21, FR-406) shared with C1/C2. Validation and
    // grounding run inside the provider call, so a rejected candidate is
    // never retried.
    const suggestions = await withRetry(() => provider.generateBullets(input), {
      ...options?.retry,
      shouldStop: isOffline,
    })
    return {
      suggestions: suggestions.slice(0, ACHIEVEMENT_MAX_SUGGESTIONS),
      source: 'ai',
      errorCode: null,
    }
  } catch (error) {
    const code = error instanceof AIProviderError ? error.code : 'network-error'
    return staticFallback(input, code)
  }
}
