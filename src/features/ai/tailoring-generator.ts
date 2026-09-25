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
  FetchImpl,
  JobTailoringInput,
  RetryPolicy,
  TailoringResult,
} from '../../ai'
import type { AILocale } from '../../ai'
import type { SectionKey } from '../../core/view-models'
import type { ValidatedResumeDocument } from '../../core/schema'
import {
  TAILORING_MAX_COMPLETION_TOKENS,
  TAILORING_MAX_INPUT_CHARS,
  TAILORING_MAX_LIST_ITEMS,
  getTailoringSystemPrompt,
  truncateTailoringText,
} from './tailoring-prompts'
import { matchTailoringKeywords, type TailoringCorpus } from './tailoring-matcher'
import { type AiProviderId, needsConsent } from './consent-store'
import { getSessionCredentials } from './session-keys'
import { microcopyId } from '../../content/microcopy/id'

/**
 * T3b tailoring orchestrator (FR-601/602/603/604, ADR-0011).
 *
 * One narrow path: build the DF-6 minimal input (truncated JD + section +
 * locale + resume excerpt) → pick the configured network provider (or none)
 * → call it with bounded retry → cap every list → return the validated
 * result. Every failure lands on the offline static matcher.
 *
 * There is deliberately no Apply path: a gap analysis never mutates the
 * draft (FR-602 holds structurally — no panel in this flow can write to
 * the DocumentStore). The pasted JD is transient: it lives in the request
 * and the memory-only AIStore scope, never in IndexedDB, localStorage, or
 * logs (FR-603).
 *
 * Consent is fail-closed like C1b: a network provider without a session
 * grant sends nothing and reports `consent-declined` (the panel shows the
 * dialog and retries after the grant). No key is ever read except from the
 * tab-local vault (FR-407).
 */

export interface TailoringRequest {
  /** Pasted job ad (snapshot when the panel opened) — transient, untrusted. */
  readonly jobDescription: string
  readonly section: SectionKey
  readonly locale: AILocale
  readonly document: ValidatedResumeDocument
}

export type TailoringSource = 'ai' | 'static'

export interface TailoringOutcome {
  readonly result: TailoringResult
  readonly source: TailoringSource
  /** Null on success and on empty input; otherwise the failure that caused fallback. */
  readonly errorCode: AIErrorCode | null
}

export interface TailoringRequestOptions {
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
   * passes nothing and gets the default attempts with real timers.
   */
  readonly retry?: RetryPolicy
}

/** Which network provider (if any) has session credentials. Groq wins ties. */
export function selectTailoringProviderId(): AiProviderId | null {
  const groq = getSessionCredentials('groq')
  if (groq !== null && groq.apiKey.trim() !== '') return 'groq'
  const compatible = getSessionCredentials('openai-compatible')
  if (compatible !== null && compatible.apiKey.trim() !== '') return 'openai-compatible'
  return null
}

function nonEmpty(parts: readonly (string | undefined)[]): string[] {
  return parts.filter((part): part is string => part !== undefined && part.trim() !== '')
}

/**
 * DF-6 resume excerpt (data-flow.md): section body text only. Name, contact,
 * location, links, photo, dates, and GPA stay out — the matcher and the
 * model need vocabulary, not identity. Empty sections are omitted so the
 * corpus never carries blank entries.
 */
export function buildTailoringCorpus(document: ValidatedResumeDocument): TailoringCorpus[] {
  const { sections } = document
  const corpus: TailoringCorpus[] = []
  const push = (section: SectionKey, text: string): void => {
    if (text.trim() !== '') corpus.push({ section, text })
  }
  for (const item of sections.education ?? []) {
    push(
      'education',
      nonEmpty([item.institution, item.degree, item.field, ...(item.highlights ?? [])]).join('\n'),
    )
  }
  for (const item of sections.experience ?? []) {
    push(
      'experience',
      nonEmpty([item.organization, item.role, ...(item.highlights ?? [])]).join('\n'),
    )
  }
  for (const item of sections.organizations ?? []) {
    push(
      'organizations',
      nonEmpty([item.organization, item.role, ...(item.highlights ?? [])]).join('\n'),
    )
  }
  for (const item of sections.projects ?? []) {
    push(
      'projects',
      nonEmpty([item.name, item.role, item.context, ...(item.highlights ?? [])]).join('\n'),
    )
  }
  for (const group of sections.skills ?? []) {
    push('skills', nonEmpty([group.category, ...group.items]).join('\n'))
  }
  for (const item of sections.certifications ?? []) {
    push('certifications', nonEmpty([item.name, item.issuer]).join('\n'))
  }
  return corpus
}

/**
 * Headline + summary as unsectioned vocabulary. `summary` is not a
 * SectionKey (it lives in basics), so it joins the flat excerpt without a
 * corpus entry — matchable, but never named as a section to strengthen.
 */
export function buildTailoringSummary(document: ValidatedResumeDocument): string {
  return nonEmpty([document.basics.headline, document.basics.summary]).join('\n')
}

/** Flat excerpt for the `allowedFacts` grounding source. */
export function buildTailoringExcerpt(corpus: readonly TailoringCorpus[], summary: string): string {
  return nonEmpty([summary, ...corpus.map((entry) => entry.text)]).join('\n')
}

export interface TailoringAnalysis {
  readonly input: JobTailoringInput
  readonly corpus: TailoringCorpus[]
  /** True when the pasted ad exceeded the budget and was cut (FR-408 note). */
  readonly truncated: boolean
}

/**
 * Builds the DF-6 minimal input: the (possibly truncated) JD plus section
 * plus locale plus the resume excerpt. Nothing else — no name, contact,
 * photo, or other draft content — can reach this shape, because the request
 * type carries nothing else.
 */
export function buildTailoringAnalysis(request: TailoringRequest): TailoringAnalysis {
  const corpus = buildTailoringCorpus(request.document)
  const jobDescription = truncateTailoringText(request.jobDescription, TAILORING_MAX_INPUT_CHARS)
  return {
    input: {
      jobDescription,
      section: request.section,
      locale: request.locale,
      allowedFacts: buildTailoringExcerpt(corpus, buildTailoringSummary(request.document)),
    },
    corpus,
    truncated: request.jobDescription.trim().length > TAILORING_MAX_INPUT_CHARS,
  }
}

/** Prompt §8: no list sent to the user exceeds the budget. */
function capResultLists(result: TailoringResult): TailoringResult {
  return {
    matchedKeywords: result.matchedKeywords.slice(0, TAILORING_MAX_LIST_ITEMS),
    unsupportedKeywords: result.unsupportedKeywords.slice(0, TAILORING_MAX_LIST_ITEMS),
    sectionsToStrengthen: result.sectionsToStrengthen.slice(0, TAILORING_MAX_LIST_ITEMS),
    clarifyingQuestions: result.clarifyingQuestions.slice(0, TAILORING_MAX_LIST_ITEMS),
    warnings: [...result.warnings],
  }
}

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false
}

function staticFallback(
  analysis: TailoringAnalysis,
  errorCode: AIErrorCode | null,
): Promise<TailoringOutcome> {
  const matched = matchTailoringKeywords(
    analysis.input.jobDescription,
    analysis.corpus,
    analysis.input.allowedFacts,
  )
  const warnings = analysis.truncated
    ? [microcopyId.aiTailoring.truncatedNote]
    : [...matched.warnings]
  return Promise.resolve({
    result: { ...matched, warnings },
    source: 'static' as const,
    errorCode,
  })
}

function buildNetworkProvider(providerId: AiProviderId, fetchImpl?: FetchImpl): AIProvider | null {
  const credentials = getSessionCredentials(providerId)
  if (credentials === null || credentials.apiKey.trim() === '') return null
  const systemPrompt = getTailoringSystemPrompt()
  if (providerId === 'groq') {
    return new GroqProvider({
      apiKey: credentials.apiKey,
      ...(credentials.model !== undefined && credentials.model.trim() !== ''
        ? { model: credentials.model }
        : { model: GROQ_DEFAULT_MODEL }),
      systemPrompt,
      maxCompletionTokens: TAILORING_MAX_COMPLETION_TOKENS,
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
    maxCompletionTokens: TAILORING_MAX_COMPLETION_TOKENS,
    ...(fetchImpl !== undefined ? { fetchImpl } : {}),
  })
}

export async function requestTailoring(
  request: TailoringRequest,
  options?: TailoringRequestOptions,
): Promise<TailoringOutcome> {
  const analysis = buildTailoringAnalysis(request)
  if (analysis.input.jobDescription === '') {
    return staticFallback(analysis, null)
  }

  if (options?.provider !== undefined) {
    const testProvider = options.provider
    try {
      const result = await withRetry(() => testProvider.tailorToJob(analysis.input), options.retry)
      return { result: capResultLists(result), source: 'ai', errorCode: null }
    } catch (error) {
      const code = error instanceof AIProviderError ? error.code : 'network-error'
      return staticFallback(analysis, code)
    }
  }

  const providerId = selectTailoringProviderId()
  if (providerId === null) return staticFallback(analysis, 'provider-unavailable')
  if (isOffline()) return staticFallback(analysis, 'offline')
  if (needsConsent(providerId)) return staticFallback(analysis, 'consent-declined')

  const provider = buildNetworkProvider(providerId, options?.fetchImpl)
  if (provider === null) return staticFallback(analysis, 'provider-unavailable')
  try {
    // Bounded retry shared with C1/C1b/C2. Validation and grounding run
    // inside the provider call, so a rejected candidate is never retried.
    const result = await withRetry(() => provider.tailorToJob(analysis.input), {
      ...options?.retry,
      shouldStop: isOffline,
    })
    return { result: capResultLists(result), source: 'ai', errorCode: null }
  } catch (error) {
    const code = error instanceof AIProviderError ? error.code : 'network-error'
    return staticFallback(analysis, code)
  }
}
