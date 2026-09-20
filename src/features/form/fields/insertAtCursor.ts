/**
 * Pure caret insertion for suggestion picks — no DOM, unit-tested in the node
 * project (the seam pattern from photo/compress.ts).
 *
 * The insertion point is always `selectionStart`, so user text is never
 * overwritten or deleted: a non-collapsed selection stays intact after the
 * inserted text (J4 — a click only adds, the user keeps writing).
 *
 * Spacing rules keep words from gluing together without ever leaving a hanging
 * space: a single space is added between the inserted text and an adjacent
 * non-whitespace character only, so an empty field receives the bare verb.
 */

export interface InsertAtCursorInput {
  /** Current field value. */
  value: string
  /** Caret position; out-of-range values are clamped into the value. */
  selectionStart: number
  /** Text to insert; an empty string is a no-op. */
  insert: string
}

export interface InsertAtCursorResult {
  value: string
  /** Caret after the inserted text (and its trailing separator, if any). */
  caret: number
}

export function insertAtCursor({
  value,
  selectionStart,
  insert,
}: InsertAtCursorInput): InsertAtCursorResult {
  const position = Math.max(0, Math.min(selectionStart, value.length))
  if (insert === '') return { value, caret: position }

  const needsPrefix = position > 0 && !isWhitespace(value.charAt(position - 1))
  const needsSuffix = position < value.length && !isWhitespace(value.charAt(position))
  const composed = `${needsPrefix ? ' ' : ''}${insert}${needsSuffix ? ' ' : ''}`

  return {
    value: value.slice(0, position) + composed + value.slice(position),
    caret: position + composed.length,
  }
}

function isWhitespace(char: string): boolean {
  return /\s/.test(char)
}
