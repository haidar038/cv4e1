/// <reference types="node" />
// Node-project test (no DOM): renders both renderers to static markup with a
// hostile document and proves user text can never become executable.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { toATSViewModel, toCreativeViewModel } from '../core/normalize'
import { validateResumeDocument, type ValidatedResumeDocument } from '../core/schema'
import { ATSRenderer } from './ats/ATSRenderer'
import { CreativeRenderer } from './creative/CreativeRenderer'

/**
 * F4c injection gates (security-requirements.md §2, threat-model trust
 * boundary "imported files"): text fields are React-escaped by construction,
 * but link URLs reach `<a href>` verbatim — `z.string().url()` accepts
 * `javascript:` — so `SafeLink` must neutralize non-http(s) schemes there.
 * Both renderers share the gate; both are proven here.
 */

const SCRIPT = "<script>alert('name')</script>"
const IMG_ONERROR = '<img src=x onerror=alert(1)>'
const JS_URL = 'javascript:alert(1)'
const JS_URL_SMEAR = 'JaVa\tScRiPt:alert(1)'
const DATA_URL = 'data:text/html,<script>alert(1)</script>'

function loadMaliciousDocument(): ValidatedResumeDocument {
  const raw: unknown = JSON.parse(
    readFileSync(
      fileURLToPath(new URL('../../fixtures/full-document.json', import.meta.url)),
      'utf8',
    ),
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = raw as any
  doc.basics.name = SCRIPT
  doc.basics.headline = IMG_ONERROR
  doc.basics.summary = `${SCRIPT} ${IMG_ONERROR}`
  doc.basics.links = [
    { label: 'Situs', url: JS_URL },
    { label: 'Situs samar', url: JS_URL_SMEAR },
    { label: 'Data', url: DATA_URL },
  ]
  doc.sections.projects[0].url = JS_URL
  doc.sections.certifications[0].url = DATA_URL
  doc.sections.experience[0].highlights = [IMG_ONERROR, SCRIPT]
  const result = validateResumeDocument(doc)
  if (!result.success) throw result.error
  return result.data
}

const hostileDoc = loadMaliciousDocument()
const atsHtml = renderToStaticMarkup(<ATSRenderer vm={toATSViewModel(hostileDoc)} />)
const creativeHtml = renderToStaticMarkup(
  <CreativeRenderer
    vm={toCreativeViewModel(hostileDoc)}
    resolvePhotoUrl={(ref) => (ref === '' ? undefined : `blob:test-${ref}`)}
  />,
)

describe.each([
  ['ATS', atsHtml],
  ['Creative', creativeHtml],
])('%s renderer neutralizes injected markup', (_mode, html) => {
  it('emits no script element', () => {
    expect(html).not.toContain('<script')
  })

  it('emits no event-handler attributes (payload text itself may name them)', () => {
    // `<`/`>` are escaped by React, so the payload survives only as inert
    // text. An actual handler would sit *inside* a tag — that must not exist.
    expect(html).not.toMatch(/<[^<>]*\son\w+\s*=/i)
  })

  it('emits no executable href', () => {
    expect(html.toLowerCase()).not.toContain('href="javascript:')
    expect(html.toLowerCase()).not.toContain('href="data:')
    expect(html.toLowerCase()).not.toContain('href="vbscript:')
  })

  it('keeps the payload visible as inert text (no silent data loss)', () => {
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('&lt;img')
    expect(html).toContain('javascript:alert(1)')
  })
})
