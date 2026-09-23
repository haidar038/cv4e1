import { AIProviderError } from './errors'
import { postJson } from './http'
import type { ChatMessage, FetchImpl } from './http'
import type {
  AIProvider,
  BulletGenerationInput,
  BulletSuggestion,
  JobTailoringInput,
  PolishInput,
  PolishSuggestion,
  TailoringResult,
} from './types'
import { validateBulletOutput, validatePolishOutput } from './validation'

/**
 * Shared OpenAI-compatible chat transport (Task 18).
 *
 * DF-6 data minimization is enforced structurally here: the payload builders
 * pick an explicit field list — never a spread of the input — so a future
 * field added to the input types cannot leak into a request. The consent
 * dialog (features/) displays exactly these keys. Prompt *wording* (how the
 * fields are framed) is Task 19's versioned prompts; the transport sends the
 * payload as JSON.
 *
 * The injected `systemPrompt` MUST request JSON output (the API call sets
 * `response_format: json_object`). Validation in `./validation` enforces the
 * shape regardless, so a non-conforming prompt fails closed.
 */

export function buildBulletPayload(input: BulletGenerationInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    rawTask: input.rawTask,
    section: input.section,
    locale: input.locale,
    allowedFacts: input.allowedFacts,
  }
  if (input.targetRole !== undefined) payload['targetRole'] = input.targetRole
  return payload
}

export function buildPolishPayload(input: PolishInput): Record<string, unknown> {
  return { text: input.text, mode: input.mode }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Extracts the assistant text of an OpenAI-style chat response. */
export function extractAssistantContent(response: unknown): string {
  if (!isRecord(response) || !Array.isArray(response.choices)) {
    throw new AIProviderError('malformed-output')
  }
  const [first] = response.choices
  const content =
    isRecord(first) && isRecord(first['message']) ? first['message']['content'] : undefined
  if (typeof content !== 'string' || content.trim() === '') {
    throw new AIProviderError('malformed-output')
  }
  return content
}

export interface ChatProviderOptions {
  readonly apiKey: string
  readonly model: string
  readonly systemPrompt: string
  readonly timeoutMs?: number
  readonly fetchImpl?: FetchImpl
  /** Token budget belongs to the versioned prompts (Task 19); unset = provider default. */
  readonly maxCompletionTokens?: number
}

/**
 * Shared base for Groq and OpenAI-compatible providers. The key travels
 * only in the Authorization header to the configured endpoint (FR-407);
 * an empty key never reaches the network (FR-402 gate order).
 */
export abstract class BaseChatProvider implements AIProvider {
  abstract readonly id: string
  readonly requiresNetwork = true
  protected readonly endpoint: string
  protected readonly options: ChatProviderOptions

  protected constructor(endpoint: string, options: ChatProviderOptions) {
    this.endpoint = endpoint
    this.options = options
  }

  async isAvailable(): Promise<boolean> {
    return this.options.apiKey.trim() !== ''
  }

  protected async complete(
    systemPrompt: string,
    userPayload: Record<string, unknown>,
  ): Promise<string> {
    if (!(await this.isAvailable())) throw new AIProviderError('provider-unavailable')
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(userPayload) },
    ]
    const body: Record<string, unknown> = {
      model: this.options.model,
      messages,
      temperature: 0.2,
      response_format: { type: 'json_object' },
    }
    if (this.options.maxCompletionTokens !== undefined) {
      body['max_completion_tokens'] = this.options.maxCompletionTokens
    }
    const parsed = await postJson(this.endpoint, {
      headers: { Authorization: `Bearer ${this.options.apiKey}` },
      body,
      timeoutMs: this.options.timeoutMs,
      fetchImpl: this.options.fetchImpl,
    })
    return extractAssistantContent(parsed)
  }

  async generateBullets(input: BulletGenerationInput): Promise<readonly BulletSuggestion[]> {
    const content = await this.complete(this.options.systemPrompt, buildBulletPayload(input))
    return validateBulletOutput(content, input)
  }

  async polishText(input: PolishInput): Promise<PolishSuggestion> {
    const content = await this.complete(this.options.systemPrompt, buildPolishPayload(input))
    return validatePolishOutput(content, input)
  }

  /** Job tailoring is Fase 3 (C3). */
  async tailorToJob(_input: JobTailoringInput): Promise<TailoringResult> {
    throw new AIProviderError('capability-not-implemented')
  }
}
