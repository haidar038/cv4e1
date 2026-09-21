import { readFileSync } from 'node:fs'
import { AxeBuilder } from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import type { Result } from 'axe-core'
import { PDFParse } from 'pdf-parse'

/**
 * ATS print + text-extraction gates (Task 10, FR-302/FR-304, ats-test-plan §2).
 *
 * ADR-0007: preview and PDF share one HTML + Print CSS codepath, so driving
 * the real production page through the Task 12 PreviewPane is the honest
 * surface. The gates split the fidelity proof per layer:
 *   - node suite (ATSRenderer.test.tsx): fixture → markup contains every
 *     display string derived from the view model, in order;
 *   - this spec: rendered preview page → PDF text recovers the page content
 *     completely and in reading order (the extraction promise itself).
 * `page.pdf()` is a Chromium capability — that test runs on the CI e2e job,
 * which is Chromium on Linux exactly as the spike concluded (automated PDF
 * checks belong in Linux CI, not on Windows dev boxes). Layout and egress
 * assertions run on both browsers.
 */

const ORIGIN = 'http://127.0.0.1:4173'
const FIXTURE_PATH = 'fixtures/full-document.json'

// The import flow accepts the exported envelope format (import-export-spec
// §3), not a raw ResumeDocument — so the spec wraps the fixture exactly the
// way the app's own export does. The envelope shape is locked by the
// FR-104/FR-105/FR-106 unit tests.
const ENVELOPE = {
  format: 'cv4every1',
  kind: 'resume',
  formatVersion: '1.0.0',
  exportedAt: new Date().toISOString(),
  data: JSON.parse(readFileSync(FIXTURE_PATH, 'utf8')),
}

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

function violationsReport(violations: Result[]): string {
  return violations
    .map(
      (violation) =>
        `${violation.id} (${violation.impact ?? 'unknown'}): ${violation.help}\n` +
        violation.nodes.map((node) => `    ${node.target.join(' ')}`).join('\n'),
    )
    .join('\n')
}

async function expectNoViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  const report = violationsReport(results.violations)
  expect(report, report).toBe('')
  expect(results.passes.length, 'axe evaluated no rules').toBeGreaterThan(0)
  expect(
    results.passes.some((rule) => rule.id === 'color-contrast'),
    'color-contrast was not evaluated — this audit would prove nothing',
  ).toBe(true)
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/** First expected string that is missing or out of order in `text`, else null. */
function firstOutOfOrder(text: string, expected: readonly string[]): string | null {
  let cursor = 0
  const haystack = normalizeText(text).toLowerCase()
  for (const wanted of expected) {
    const needle = normalizeText(wanted).toLowerCase()
    const found = haystack.indexOf(needle, cursor)
    if (found < 0) return wanted
    cursor = found + needle.length
  }
  return null
}

/** Forbidden elements in the rendered preview (mirrors src/render/ats/structural.ts). */
async function previewStructuralViolations(page: Page): Promise<string[]> {
  const html = (await page.locator('#cv-preview').innerHTML()).toLowerCase()
  return ['<img', '<table', '<svg', '<div'].filter((element) => html.includes(element))
}

/**
 * Imports the fixture through the real DraftPanel flow. The imported draft
 * opens in its stored ATS mode with the PreviewPane mounted directly —
 * no query-param gate since Task 12.
 */
async function openPreviewWithFixture(page: Page): Promise<void> {
  await page.goto('/')
  await page.setInputFiles('input[type="file"]', {
    name: 'full-document.cv4e.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(ENVELOPE), 'utf8'),
  })
  // The imported draft opens automatically in its stored mode; the preview
  // heading proves the pane mounted.
  await expect(page.getByText('Fixture Lengkap').first()).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('#cv-preview .cv-ats-name')).toHaveText('Contoh Nama Fiktif', {
    timeout: 15_000,
  })
}

/** Every visible text line of the preview, in DOM (reading) order. */
async function previewTextLines(page: Page): Promise<string[]> {
  const innerText = await page.locator('#cv-preview').innerText()
  return innerText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

test('print layout: single column, controlled headings, audited surface', async ({ page }) => {
  await openPreviewWithFixture(page)

  expect(await previewStructuralViolations(page)).toEqual([])
  const headings = await page.locator('#cv-preview h2').allTextContents()
  expect(headings).toEqual([
    'PENDIDIKAN',
    'PENGALAMAN KERJA',
    'ORGANISASI',
    'PROYEK',
    'KEAHLIAN',
    'SERTIFIKASI',
  ])

  await expectNoViolations(page)

  // Print isolation: only the document survives `@media print` — the app
  // controls around it are hidden (`.cv-ats` stays visible, its ancestors
  // are intentionally hidden by the print stylesheet).
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.cv-ats')).toBeVisible()
  await expect(page.locator('.cv-ats-name')).toHaveText('Contoh Nama Fiktif')
})

test('PDF text extraction restores the whole preview in reading order', async ({ page }) => {
  test.skip(
    test.info().project.name !== 'chromium',
    'page.pdf() is a Chromium capability; the extraction gate runs on CI Chromium/Linux (ADR-0007)',
  )
  await openPreviewWithFixture(page)

  // The page itself is the expectation source (single codepath): whatever the
  // preview shows must come back from the PDF, completely and in order.
  const lines = await previewTextLines(page)
  expect(lines.length).toBeGreaterThan(10)

  const pdf = await page.pdf({ format: 'A4', printBackground: true })
  const parser = new PDFParse({ data: new Uint8Array(pdf) })
  try {
    const { text } = await parser.getText()
    const normalized = normalizeText(text).toLowerCase()
    const missing = lines.filter((line) => !normalized.includes(normalizeText(line).toLowerCase()))
    expect(missing, `preview lines missing from PDF text: ${missing.join(' | ')}`).toEqual([])
    expect(firstOutOfOrder(text, lines)).toBeNull()

    // Readable sentinels for the parser-critical formats (ats-test-plan §1).
    expect(normalized).toContain('3.52 / 4.00')
    expect(normalized).toContain('+62 812-0000-0000')
    expect(normalized).toContain('pendidikan')
  } finally {
    await parser.destroy()
  }
})

test('the preview flow makes no off-origin request', async ({ page }) => {
  const offOrigin: string[] = []
  page.on('request', (request) => {
    const url = request.url()
    if (url.startsWith('blob:') || url.startsWith('data:')) return
    if (!url.startsWith(ORIGIN)) offOrigin.push(url)
  })

  await openPreviewWithFixture(page)
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.cv-ats')).toBeVisible()

  expect(offOrigin).toEqual([])
})
