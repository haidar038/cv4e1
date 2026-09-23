import polishPromptEnV1 from '../../../prompts/en/polish.v1.md?raw'
import polishPromptIdV1 from '../../../prompts/id/polish.v1.md?raw'
import groundingRulesV1 from '../../../prompts/shared/grounding-rules.v1.md?raw'
import type { PolishMode } from '../../ai'

/**
 * Versioned C2 prompts (Task 20, FR-404/FR-405, prompt-specification.md).
 *
 * Same contract as `bullet-prompts.ts` (Task 19): prompt *wording* lives in
 * `prompts/` (append-only `v1`, `v2`, …), never inlined in components. This
 * module is the single import point, and the provider receives the composed
 * text as an injected `systemPrompt` string. The user payload travels as a
 * separate `user` message (chat-provider.ts), so raw input is never
 * interpolated into the prompt itself (prompt-specification.md §5).
 */

/** Active polish prompt version. Bump only with new prompt files. */
export const POLISH_PROMPT_VERSION = 'v1' as const

/**
 * Input budget (prompt §8), mirrored from the bullet generator (Task 20
 * kickoff decision): the orchestrator truncates beyond this so a pasted
 * page cannot blow the request or the user's quota. The marker sits inside
 * a `[...]` span, which the grounding check strips before the entity pass
 * — truncation never counts as an invented entity.
 */
export const POLISH_MAX_INPUT_CHARS = 2000

/** Output budget (prompt §8): one polished text plus the change list. */
export const POLISH_MAX_COMPLETION_TOKENS = 800

/** Canonical grounding rules text (shared/grounding-rules.v1.md). */
export function getGroundingRules(): string {
  return groundingRulesV1
}

/** Raw C2 prompt body for Polish (ID). */
export function getPolishPromptBodyId(): string {
  return polishPromptIdV1
}

/** Raw C2 prompt body for Polish (EN) and translate-to-English. */
export function getPolishPromptBodyEn(): string {
  return polishPromptEnV1
}

/**
 * Full system prompt for a polish mode: canonical grounding rules first,
 * then the capability prompt. Polish (ID) uses the Indonesian prompt;
 * Polish (EN) and translate-to-English share the English one — the `mode`
 * in the user payload tells the model which operation to perform.
 */
export function getPolishSystemPrompt(mode: PolishMode): string {
  const body = mode === 'id' ? polishPromptIdV1 : polishPromptEnV1
  return `${groundingRulesV1}\n\n---\n\n${body}`
}

/** Trims and truncates user text to a character budget, marking the cut. */
export function truncatePolishText(text: string, maxChars: number): string {
  const trimmed = text.trim()
  if (trimmed.length <= maxChars) return trimmed
  return `${trimmed.slice(0, maxChars).trimEnd()}… [dipotong]`
}
