import achievementPromptV1 from '../../../prompts/id/achievement-bullets.v1.md?raw'
import groundingRulesV1 from '../../../prompts/shared/grounding-rules.v1.md?raw'

/**
 * Versioned C1b prompts (unified achievement flow, FR-404/FR-405,
 * prompt-specification.md).
 *
 * Same contract as the C1 bullet prompts (Task 19): prompt *wording* lives
 * in `prompts/` (append-only `v1`, `v2`, …) and is never inlined in
 * components. This module is the single import point, and the provider
 * receives the composed text as an injected `systemPrompt` string. The user
 * payload travels as a separate `user` message (chat-provider.ts), so the
 * free-text achievement is never interpolated into the prompt itself
 * (prompt-specification.md §5 — the prompt-injection surface).
 */

/** Active achievement-bullets prompt version. Bump only with a new prompt file. */
export const ACHIEVEMENT_PROMPT_VERSION = 'v1' as const

/**
 * Input budget (prompt §8). The orchestrator truncates beyond this so a
 * pasted page cannot blow the request or the user's quota. The marker sits
 * inside a `[...]` span, which the grounding check strips before the entity
 * pass — truncation never counts as an invented entity.
 */
export const ACHIEVEMENT_MAX_INPUT_CHARS = 2000

/** Output budget (prompt §8): room for 3 polished suggestions plus rationales. */
export const ACHIEVEMENT_MAX_COMPLETION_TOKENS = 800

/** Hard cap on suggestions per generation (maintainer decision, unified flow). */
export const ACHIEVEMENT_MAX_SUGGESTIONS = 3

/** Canonical grounding rules text (shared/grounding-rules.v1.md). */
export function getAchievementGroundingRules(): string {
  return groundingRulesV1
}

/** Raw C1b prompt body (id/achievement-bullets.v1.md). */
export function getAchievementPromptBody(): string {
  return achievementPromptV1
}

/**
 * Full system prompt: canonical grounding rules first, then the capability
 * prompt. One string in, one string out — pure and DOM-free.
 */
export function getAchievementSystemPrompt(): string {
  return `${groundingRulesV1}\n\n---\n\n${achievementPromptV1}`
}

/** Trims and truncates user text to a character budget, marking the cut. */
export function truncateAchievementText(text: string, maxChars: number): string {
  const trimmed = text.trim()
  if (trimmed.length <= maxChars) return trimmed
  return `${trimmed.slice(0, maxChars).trimEnd()}… [dipotong]`
}
