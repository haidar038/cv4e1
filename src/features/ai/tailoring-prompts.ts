import tailoringPromptV1 from '../../../prompts/id/tailoring.v1.md?raw'
import groundingRulesV1 from '../../../prompts/shared/grounding-rules.v1.md?raw'

/**
 * Versioned T3b prompts (job tailoring, FR-601/602, ADR-0011,
 * prompt-specification.md).
 *
 * Same contract as the C1/C1b/C2 prompts: prompt *wording* lives in
 * `prompts/` (append-only `v1`, `v2`, …) and is never inlined in
 * components. This module is the single import point, and the provider
 * receives the composed text as an injected `systemPrompt` string. The job
 * description travels as a separate `user` message (chat-provider.ts), so
 * the pasted ad is never interpolated into the prompt itself
 * (prompt-specification.md §5, AB-3 — the JD is data, not instructions).
 */

/** Active tailoring prompt version. Bump only with a new prompt file. */
export const TAILORING_PROMPT_VERSION = 'v1' as const

/**
 * Input budget (prompt §8, provisional ADR-0011). The orchestrator truncates
 * beyond this so a pasted page cannot blow the request or the user's quota.
 * The marker sits inside a `[...]` span, which the grounding check strips
 * before the entity pass — truncation never counts as an invented entity.
 */
export const TAILORING_MAX_INPUT_CHARS = 10_000

/** Output budget (prompt §8): room for keyword lists plus questions. */
export const TAILORING_MAX_COMPLETION_TOKENS = 800

/** Hard cap per output list (prompt §8) — more is never sent to the user. */
export const TAILORING_MAX_LIST_ITEMS = 20

/** Canonical grounding rules text (shared/grounding-rules.v1.md). */
export function getTailoringGroundingRules(): string {
  return groundingRulesV1
}

/** Raw T3b prompt body (id/tailoring.v1.md). */
export function getTailoringPromptBody(): string {
  return tailoringPromptV1
}

/**
 * Full system prompt: canonical grounding rules first, then the capability
 * prompt. One string in, one string out — pure and DOM-free.
 */
export function getTailoringSystemPrompt(): string {
  return `${groundingRulesV1}\n\n---\n\n${tailoringPromptV1}`
}

/** Trims and truncates pasted text to a character budget, marking the cut. */
export function truncateTailoringText(text: string, maxChars: number): string {
  const trimmed = text.trim()
  if (trimmed.length <= maxChars) return trimmed
  return `${trimmed.slice(0, maxChars).trimEnd()}… [dipotong]`
}
