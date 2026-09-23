import bulletPromptV1 from '../../../prompts/id/bullet-generator.v1.md?raw'
import groundingRulesV1 from '../../../prompts/shared/grounding-rules.v1.md?raw'

/**
 * Versioned C1 prompts (Task 19, FR-404/FR-405, prompt-specification.md).
 *
 * Prompt *wording* lives in `prompts/` (append-only `v1`, `v2`, …) and is
 * never inlined in components: this module is the single import point, and
 * the provider receives the composed text as an injected `systemPrompt`
 * string. The user payload travels as a separate `user` message
 * (chat-provider.ts), so raw input is never interpolated into the prompt
 * itself (prompt-specification.md §5 — the prompt-injection surface).
 */

/** Active bullet-generator prompt version. Bump only with a new prompt file. */
export const BULLET_PROMPT_VERSION = 'v1' as const

/**
 * Input budget (prompt §8). The orchestrator truncates beyond these so a
 * pasted page cannot blow the request or the user's quota. The marker sits
 * inside a `[...]` span, which the grounding check strips before the entity
 * pass — truncation never counts as an invented entity.
 */
export const BULLET_MAX_INPUT_CHARS = 2000
export const BULLET_MAX_TARGET_ROLE_CHARS = 200

/** Output budget (prompt §8): room for 3 suggestions plus rationales. */
export const BULLET_MAX_COMPLETION_TOKENS = 800

/** Canonical grounding rules text (shared/grounding-rules.v1.md). */
export function getGroundingRules(): string {
  return groundingRulesV1
}

/** Raw C1 prompt body (id/bullet-generator.v1.md). */
export function getBulletPromptBody(): string {
  return bulletPromptV1
}

/**
 * Full system prompt: canonical grounding rules first, then the capability
 * prompt. One string in, one string out — pure and DOM-free.
 */
export function getBulletSystemPrompt(): string {
  return `${groundingRulesV1}\n\n---\n\n${bulletPromptV1}`
}

/** Trims and truncates user text to a character budget, marking the cut. */
export function truncateBulletText(text: string, maxChars: number): string {
  const trimmed = text.trim()
  if (trimmed.length <= maxChars) return trimmed
  return `${trimmed.slice(0, maxChars).trimEnd()}… [dipotong]`
}
