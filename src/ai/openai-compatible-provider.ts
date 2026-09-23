import { AIProviderError } from './errors'
import { BaseChatProvider } from './chat-provider'
import type { ChatProviderOptions } from './chat-provider'

/**
 * OpenAI-compatible provider with a user-configured endpoint (Task 18 Q4).
 *
 * Endpoint validation is a pure function so the settings UI can show a
 * mappable reason *before* anything is saved. Rules: must parse as a URL;
 * https always allowed; plain http only for loopback (local model servers
 * such as Ollama); anything else rejected. A static CSP can never whitelist
 * a runtime-entered host — recorded in the threat-model review (Task 18).
 */

export type BaseUrlValidationReason = 'empty' | 'invalid-url' | 'insecure-protocol'

export type BaseUrlValidation =
  | { readonly ok: true; readonly url: string }
  | { readonly ok: false; readonly reason: BaseUrlValidationReason }

const LOOPBACK_HOSTS: readonly string[] = ['localhost', '127.0.0.1', '::1']

export function normalizeProviderBaseUrl(raw: string): BaseUrlValidation {
  const trimmed = raw.trim()
  if (trimmed === '') return { ok: false, reason: 'empty' }
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return { ok: false, reason: 'invalid-url' }
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { ok: false, reason: 'insecure-protocol' }
  }
  if (parsed.protocol === 'http:' && !LOOPBACK_HOSTS.includes(parsed.hostname)) {
    return { ok: false, reason: 'insecure-protocol' }
  }
  return { ok: true, url: trimmed.replace(/\/+$/, '') }
}

export interface OpenAICompatibleProviderOptions extends ChatProviderOptions {
  /** Normalized base URL (no trailing slash); validated by `normalizeProviderBaseUrl`. */
  readonly baseUrl: string
}

export class OpenAICompatibleProvider extends BaseChatProvider {
  readonly id = 'openai-compatible'

  constructor(options: OpenAICompatibleProviderOptions) {
    const validated = normalizeProviderBaseUrl(options.baseUrl)
    if (!validated.ok) throw new AIProviderError('provider-unavailable')
    super(`${validated.url}/chat/completions`, options)
  }
}
