/**
 * Public surface of `src/ai/` — the provider contract, failure taxonomy, and
 * offline test double. `StaticSuggestionProvider` intentionally lives in
 * `src/features/ai/`: it composes the Action Verbs Catalog (`content/`), which
 * this module may not import (architecture-overview.md §5).
 */
export type {
  AILocale,
  AiCapability,
  AIProvider,
  BulletGenerationInput,
  BulletSuggestion,
  JobTailoringInput,
  PolishInput,
  PolishMode,
  PolishSuggestion,
  TailoringResult,
} from './types'
export { AI_ERROR_CODES, AIProviderError, isRetryableErrorCode } from './errors'
export type { AIErrorCode } from './errors'
export { NoopProvider } from './noop-provider'
export { AI_REQUEST_TIMEOUT_MS, postJson } from './http'
export type { ChatMessage, FetchImpl, PostJsonOptions } from './http'
export {
  BaseChatProvider,
  buildBulletPayload,
  buildPolishPayload,
  extractAssistantContent,
} from './chat-provider'
export type { ChatProviderOptions } from './chat-provider'
export { GROQ_BASE_URL, GROQ_DEFAULT_MODEL, GroqProvider } from './groq-provider'
export type { GroqProviderOptions } from './groq-provider'
export { normalizeProviderBaseUrl, OpenAICompatibleProvider } from './openai-compatible-provider'
export type {
  BaseUrlValidation,
  BaseUrlValidationReason,
  OpenAICompatibleProviderOptions,
} from './openai-compatible-provider'
export {
  checkGrounding,
  extractJsonFromText,
  validateBulletOutput,
  validatePolishOutput,
} from './validation'
