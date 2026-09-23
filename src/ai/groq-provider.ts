import { BaseChatProvider } from './chat-provider'
import type { ChatProviderOptions } from './chat-provider'

/**
 * Groq provider (Task 18, ai-provider-strategy.md §2).
 * OpenAI-compatible Chat Completions; Bearer auth; JSON mode enforced.
 * Rate limits are the user's quota — never assumed, only handled (strategy §6).
 */

export const GROQ_BASE_URL = 'https://api.groq.com/openai/v1'

/** Maintainer-approved default (Task 18 Q6): stable GPT OSS 120B line. */
export const GROQ_DEFAULT_MODEL = 'openai/gpt-oss-120b'

export type GroqProviderOptions = Omit<ChatProviderOptions, 'model'> & {
  readonly model?: string
}

export class GroqProvider extends BaseChatProvider {
  readonly id = 'groq'

  constructor(options: GroqProviderOptions) {
    super(`${GROQ_BASE_URL}/chat/completions`, {
      ...options,
      model: options.model ?? GROQ_DEFAULT_MODEL,
    })
  }
}
