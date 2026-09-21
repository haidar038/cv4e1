/**
 * Structural gate for the Creative renderer output (Task 11, FR-303, ADR-0004).
 *
 * Pure string inspection so both the node unit tests and the e2e print spec
 * enforce the same rules. The Creative mode rules differ from the ATS ones
 * (render/ats/structural.ts): an <img> IS allowed — exactly one, the profile
 * photo, and only with an alt attribute (the owner's name; a nameless
 * in-progress draft renders it decorative via alt="") — while anything that
 * would carry text
 * outside the text layer or fake the two-column layout is forbidden:
 * rasterization primitives (canvas), inline vectors (svg), and table/iframe/
 * object/embed layout. Colors and decoration live in the stylesheet, whose
 * gates are asserted in CreativeRenderer.test.tsx (no background-image text,
 * token-only colors).
 */
const FORBIDDEN_ELEMENTS = ['<canvas', '<svg', '<table', '<iframe', '<object', '<embed'] as const

export function findStructuralViolations(html: string): string[] {
  const lowered = html.toLowerCase()
  const violations: string[] = FORBIDDEN_ELEMENTS.filter((element) => lowered.includes(element))

  const images = lowered.match(/<img\b[^>]*>/g) ?? []
  if (images.length > 1) violations.push(`<img ×${images.length} (maksimum satu)`)
  for (const image of images) {
    if (!/\balt="/.test(image)) violations.push('<img tanpa alt')
  }
  return violations
}
