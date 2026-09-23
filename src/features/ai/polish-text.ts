import {
  AIProviderError,
  GROQ_DEFAULT_MODEL,
  GroqProvider,
  OpenAICompatibleProvider,
} from '../../ai'
import type { AIErrorCode, AIProvider, FetchImpl, PolishInput, PolishSuggestion } from '../../ai'
import type { PolishMode } from '../../ai'
import {
  POLISH_MAX_COMPLETION_TOKENS,
  POLISH_MAX_INPUT_CHARS,
  getPolishSystemPrompt,
  truncatePolishText,
} from './polish-prompts'
import { type AiProviderId, needsConsent } from './consent-store'
import { getSessionCredentials } from './session-keys'
import { StaticSuggestionProvider } from './static-provider'

/**
 * C2 polish orchestrator (Task 20, FR-403/404/405/406).
 *
 * Same contract as the C1 bullet orchestrator (Task 19): build the DF-6
 * minimal input → pick the configured network provider (or none) → call
 * it → return the validated candidate. Every failure lands on the offline
 * static provider (guidance, not a rewrite); the draft is never touched
 * here (the polished text reaches the DocumentStore only through an
 * explicit Apply in the panel — FR-401).
 *
 * Consent is fail-closed: a network provider without a session grant sends
 * nothing and reports `consent-declined` (the panel shows the dialog and
 * retries after the grant). No key is ever read except from the
 * tab-local vault (FR-407).
 */

export interface PolishRequest {
  /** Source text exactly as typed (snapshot when the panel opened). */
  readonly text: string
  /** Polish (ID), Polish (EN), or translate-to-English. */
  readonly mode: PolishMode
}

export type PolishSource = 'ai' | 'static'

export interface PolishResult {
  readonly suggestion: PolishSuggestion
  readonly source: PolishSource
  /** Null on success and on empty input; otherwise the failure that caused fallback. */
  readonly errorCode: AIErrorCode | null
}

export interface PolishRequestOptions {
  /** Injectable transport for tests — production passes the platform fetch. */
  readonly fetchImpl?: FetchImpl
  /**
   * Test seam: bypasses vault selection and the consent backstop. Unit tests
   * for the contract/malformed/timeout paths use this; production never does.
   */
  readonly provider?: AIProvider
}

/** Which network provider (if any) has session credentials. Groq wins ties. */
export function selectPolishProviderId(): AiProviderId | null {
  const groq = getSessionCredentials('groq')
  if (groq !== null && groq.apiKey.trim() !== '') return 'groq'
  const compatible = getSessionCredentials('openai-compatible')
  if (compatible !== null && compatible.apiKey.trim() !== '') return 'openai-compatible'
  return null
}

/**
 * Builds the DF-6 minimal input (data-flow.md): the selected text plus the
 * polish mode. Nothing else — no name, contact, photo, or other draft
 * content — can reach this shape, because the request type carries nothing
 * else.
 */
export function buildPolishInput(request: PolishRequest): PolishInput {
  return {
    text: truncatePolishText(request.text, POLISH_MAX_INPUT_CHARS),
    mode: request.mode,
  }
}

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false
}

function staticFallback(input: PolishInput, errorCode: AIErrorCode | null): Promise<PolishResult> {
  const staticProvider = new StaticSuggestionProvider()
  return staticProvider
    .polishText(input)
    .then((suggestion) => ({ suggestion, source: 'static' as const, errorCode }))
}

function buildNetworkProvider(
  providerId: AiProviderId,
  mode: PolishMode,
  fetchImpl?: FetchImpl,
): AIProvider | null {
  const credentials = getSessionCredentials(providerId)
  if (credentials === null || credentials.apiKey.trim() === '') return null
  const systemPrompt = getPolishSystemPrompt(mode)
  if (providerId === 'groq') {
    return new GroqProvider({
      apiKey: credentials.apiKey,
      ...(credentials.model !== undefined && credentials.model.trim() !== ''
        ? { model: credentials.model }
        : { model: GROQ_DEFAULT_MODEL }),
      systemPrompt,
      maxCompletionTokens: POLISH_MAX_COMPLETION_TOKENS,
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
    maxCompletionTokens: POLISH_MAX_COMPLETION_TOKENS,
    ...(fetchImpl !== undefined ? { fetchImpl } : {}),
  })
}

export async function requestPolishSuggestion(
  request: PolishRequest,
  options?: PolishRequestOptions,
): Promise<PolishResult> {
  const input = buildPolishInput(request)
  if (input.text === '') {
    return staticFallback(input, null)
  }

  if (options?.provider !== undefined) {
    try {
      const suggestion = await options.provider.polishText(input)
      return { suggestion, source: 'ai', errorCode: null }
    } catch (error) {
      const code = error instanceof AIProviderError ? error.code : 'network-error'
      return staticFallback(input, code)
    }
  }

  const providerId = selectPolishProviderId()
  if (providerId === null) return staticFallback(input, 'provider-unavailable')
  if (isOffline()) return staticFallback(input, 'offline')
  if (needsConsent(providerId)) return staticFallback(input, 'consent-declined')

  const provider = buildNetworkProvider(providerId, input.mode, options?.fetchImpl)
  if (provider === null) return staticFallback(input, 'provider-unavailable')
  try {
    const suggestion = await provider.polishText(input)
    return { suggestion, source: 'ai', errorCode: null }
  } catch (error) {
    const code = error instanceof AIProviderError ? error.code : 'network-error'
    return staticFallback(input, code)
  }
}
