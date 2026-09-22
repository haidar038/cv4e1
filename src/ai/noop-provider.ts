import { AIProviderError } from './errors'
import type {
  AIProvider,
  BulletGenerationInput,
  BulletSuggestion,
  JobTailoringInput,
  PolishInput,
  PolishSuggestion,
  TailoringResult,
} from './types'

/**
 * Test double for the AIProvider contract (ai-provider-strategy.md §2).
 *
 * Always reports unavailable and rejects every capability with
 * `provider-unavailable`. Contract tests run providers through the same
 * assertions; this one pins the "nothing configured" end of the spectrum.
 * Zero imports beyond the contract itself, so it can never touch network,
 * storage, or the document.
 */
export class NoopProvider implements AIProvider {
  readonly id = 'noop'
  readonly requiresNetwork = false

  async isAvailable(): Promise<boolean> {
    return false
  }

  async generateBullets(_input: BulletGenerationInput): Promise<readonly BulletSuggestion[]> {
    throw new AIProviderError('provider-unavailable')
  }

  async polishText(_input: PolishInput): Promise<PolishSuggestion> {
    throw new AIProviderError('provider-unavailable')
  }

  async tailorToJob(_input: JobTailoringInput): Promise<TailoringResult> {
    throw new AIProviderError('provider-unavailable')
  }
}
