/**
 * Structural gate for the ATS renderer output (Task 10, FR-004/FR-005/FR-002).
 *
 * Pure string inspection so both the node unit tests and the e2e print spec
 * enforce the same rules: the ATS document must never contain elements that
 * break text extraction or single-column layout. A template cannot bypass
 * this — the checker runs against the rendered markup, not the source.
 */
const FORBIDDEN_ELEMENTS = ['<img', '<table', '<svg', '<div'] as const

export function findStructuralViolations(html: string): string[] {
  const lowered = html.toLowerCase()
  return FORBIDDEN_ELEMENTS.filter((element) => lowered.includes(element))
}
