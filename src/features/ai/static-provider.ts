import { AIProviderError } from '../../ai'
import type {
  AIProvider,
  BulletGenerationInput,
  BulletSuggestion,
  JobTailoringInput,
  PolishInput,
  PolishSuggestion,
  TailoringResult,
} from '../../ai'
import { getVerbsForSection } from '../../content/action-verbs'
import { microcopyId } from '../../content/microcopy/id'

/**
 * Built-in AIProvider implementation (glossary: Static provider, ADR-0005).
 *
 * Lives in features/ rather than ai/ on purpose: it composes the Action Verbs
 * Catalog from content/, which ai/ may not import (architecture-overview.md
 * §5). Suggestion wording comes from the microcopy pack, so the forbidden-
 * phrase sweep and the FR-204 structural blanking apply automatically.
 *
 * Grounding by construction: the user's raw task is reused verbatim, the only
 * addition is a catalog verb prefix and a metric placeholder — never a number,
 * company, title, or skill the user did not provide (P5). `targetRole`,
 * `locale`, and `allowedFacts` are accepted for interface conformance but do
 * not steer the static output; there is no model to steer.
 */

const MAX_STATIC_SUGGESTIONS = 3

/** Placeholder for unmeasured impact (glossary: Metric placeholder). */
const IMPACT_PLACEHOLDER = '[dampak yang dapat diukur]'

/**
 * Catalog verbs never used as bullet starters (maintainer decision, Task 16
 * follow-up). Leadership verbs read unnaturally when prefixed to a raw task
 * ("Memimpin Membantu ...") and can contradict assisting-type tasks. Skipped,
 * never reworded — the catalog stays the curated source of truth and the next
 * eligible verbs fill the slots.
 */
const EXCLUDED_STARTER_VERBS: readonly string[] = ['Memimpin']

export class StaticSuggestionProvider implements AIProvider {
  readonly id = 'static'
  readonly requiresNetwork = false

  async isAvailable(): Promise<boolean> {
    return true
  }

  async generateBullets(input: BulletGenerationInput): Promise<readonly BulletSuggestion[]> {
    const raw = input.rawTask.trim()
    if (raw === '') return []

    const verbs = getVerbsForSection(input.section)
      .filter((entry) => !EXCLUDED_STARTER_VERBS.includes(entry.verb))
      .slice(0, MAX_STATIC_SUGGESTIONS)
    if (verbs.length === 0) {
      return [
        {
          text: `${raw} ${IMPACT_PLACEHOLDER}`,
          actionVerb: '',
          usesPlaceholder: true,
          rationale: microcopyId.aiStatic.genericRationale,
          warnings: [],
        },
      ]
    }

    return verbs.map((entry) => ({
      text: `${entry.verb} ${raw} ${IMPACT_PLACEHOLDER}`,
      actionVerb: entry.verb,
      usesPlaceholder: true,
      rationale: microcopyId.aiStatic.rationaleTemplate.replace('{verb}', entry.verb),
      warnings: [],
    }))
  }

  /**
   * Static polish guidance (Task 20, FR-403, ai-product-spec.md §C2).
   *
   * No model is available offline, so there is no automatic rewrite: the
   * returned `text` is the input verbatim (grounded by construction — Apply
   * is a harmless no-op), while `changes` carries a per-mode checklist the
   * user applies by hand and `warnings` carries example phrases to avoid.
   * Empty input yields empty text with the empty-input note as the warning,
   * so the panel can show guidance instead of an Apply button.
   */
  async polishText(input: PolishInput): Promise<PolishSuggestion> {
    const text = input.text.trim()
    if (text === '') {
      return { text: '', changes: [], warnings: [microcopyId.aiPolish.emptyInputNote] }
    }
    const pack = microcopyId.aiPolish
    const checklist =
      input.mode === 'en'
        ? pack.checklistEn
        : input.mode === 'translate-en'
          ? pack.checklistTranslate
          : pack.checklistId
    const avoided =
      input.mode === 'en'
        ? pack.avoidedEn
        : input.mode === 'translate-en'
          ? pack.avoidedTranslate
          : pack.avoidedId
    return { text, changes: [...checklist], warnings: [...avoided] }
  }

  /** Job tailoring is Fase 3 (C3). */
  async tailorToJob(_input: JobTailoringInput): Promise<TailoringResult> {
    throw new AIProviderError('capability-not-implemented')
  }
}
