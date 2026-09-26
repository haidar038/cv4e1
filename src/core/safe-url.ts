/**
 * Safe hyperlink target (F4c, security-requirements.md §2).
 *
 * Renderers interpolate user-supplied URLs into `<a href>`. `z.string().url()`
 * accepts any scheme — including `javascript:` — so the scheme must be
 * re-checked at render time. Only `http:` and `https:` produce a link;
 * anything else returns `null` and the caller renders plain text, keeping the
 * user's data visible without making it clickable.
 *
 * Pure function, no DOM: unit-tested here, reused by both renderers.
 */
export function safeHref(raw: string): string | null {
  // Browsers strip ASCII whitespace/control characters before parsing a URL,
  // so `java\tscript:` would otherwise slip past a naive prefix check.
  const compacted = raw.replace(/[\u0000-\u0020]+/g, '')
  let protocol: string
  try {
    protocol = new URL(compacted).protocol.toLowerCase()
  } catch {
    return null
  }
  if (protocol !== 'http:' && protocol !== 'https:') return null
  return raw
}
