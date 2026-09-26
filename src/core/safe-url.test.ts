import { describe, expect, it } from 'vitest'
import { safeHref } from './safe-url'

/**
 * F4c hyperlink-scheme gate (security-requirements.md §2).
 * `z.string().url()` accepts `javascript:` (valid URL syntax), so renderers
 * must not trust the schema here — only http(s) may become clickable.
 */
describe('safeHref', () => {
  it('passes http and https URLs through untouched', () => {
    expect(safeHref('https://contoh.id/cv')).toBe('https://contoh.id/cv')
    expect(safeHref('http://contoh.id')).toBe('http://contoh.id')
    expect(safeHref('HTTPS://CONTOH.ID/Path')).toBe('HTTPS://CONTOH.ID/Path')
  })

  it('rejects executable and exotic schemes', () => {
    expect(safeHref('javascript:alert(1)')).toBeNull()
    expect(safeHref('JaVaScRiPt:alert(1)')).toBeNull()
    expect(safeHref('data:text/html,<script>alert(1)</script>')).toBeNull()
    expect(safeHref('vbscript:msgbox(1)')).toBeNull()
    expect(safeHref('file:///etc/passwd')).toBeNull()
    expect(safeHref('mailto:contoh@contoh.id')).toBeNull()
  })

  it('rejects control-character-smuggled schemes', () => {
    // Browsers strip these before parsing — the check must too.
    expect(safeHref('java\tscript:alert(1)')).toBeNull()
    expect(safeHref('java\nscript:alert(1)')).toBeNull()
    expect(safeHref('  javascript:alert(1)')).toBeNull()
  })

  it('rejects non-URLs without throwing', () => {
    expect(safeHref('')).toBeNull()
    expect(safeHref('bukan url')).toBeNull()
    expect(safeHref('://nokolon')).toBeNull()
  })
})
