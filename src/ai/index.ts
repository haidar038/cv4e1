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
export {
  checkGrounding,
  extractJsonFromText,
  validateBulletOutput,
  validatePolishOutput,
} from './validation'
