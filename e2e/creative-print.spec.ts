/// <reference lib="dom" />
import { readFileSync } from 'node:fs'
import { AxeBuilder } from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import type { Result } from 'axe-core'
import { PDFParse } from 'pdf-parse'

/**
 * Creative print + text-extraction gates (Task 11, FR-001/FR-303/FR-304,
 * ADR-0004/0007). Companion of ats-print.spec.ts with the creative mode
 * rules: the same import flow opens the Task 12 PreviewPane in the stored
 * ATS mode, the spec switches to Creative through the real ModeToggle, and
 * the photo paths are both proven honestly:
 *   - layout/extraction test seeds a tiny PNG straight into the IndexedDB
 *     `assets` store (raw browser API, no product import), so the full
 *     storage → object-URL → <img> → PDF path runs in a real browser;
 *   - the egress test imports without seeding, proving the plan edge case
 *     "photo blob fails to load → neutral placeholder, text unaffected".
 * `page.pdf()` is a Chromium capability — that test runs on the CI e2e job;
 * layout and egress assertions run on both browsers (the Firefox skip is a
 * capability boundary, not a flake).
 */

const ORIGIN = 'http://127.0.0.1:4173'
const FIXTURE_PATH = 'fixtures/full-document.json'
const ASSET_REF = 'asset_test_001'

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

// 1×1 transparent PNG: enough for the resolver → object URL → <img> path;
// pixel fidelity of compression stays a browser concern (Task 9 note).
const PNG_1X1_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

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

/**
 * Scoped to the preview region on purpose: the audit's subject is the
 * creative document surface — the thing that gets printed. The surrounding
 * shell is audited by a11y.spec.ts; scoping keeps the form's narrow-column
 * controls out of this document-surface verdict.
 */
async function expectNoViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    .include('#cv-preview')
    .analyze()
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

/**
 * Whitespace-insensitive form used for PDF matching: the narrow sidebar
 * wraps long URLs across printed lines, and extraction keeps those breaks.
 * Stripping all whitespace proves content completeness and reading order
 * regardless of where the wrap fell, without weakening either.
 */
function despace(text: string): string {
  return normalizeText(text).replace(/\s+/g, '').toLowerCase()
}

/** First expected string that is missing or out of order in `text`, else null. */
function firstOutOfOrder(text: string, expected: readonly string[]): string | null {
  let cursor = 0
  const haystack = despace(text)
  for (const wanted of expected) {
    const needle = despace(wanted)
    const found = haystack.indexOf(needle, cursor)
    if (found < 0) return wanted
    cursor = found + needle.length
  }
  return null
}

/**
 * Forbidden elements in the rendered preview — mirrors
 * src/render/creative/structural.ts (img allowed: exactly one, with alt).
 */
async function previewStructuralViolations(page: Page): Promise<string[]> {
  const html = (await page.locator('#cv-preview').innerHTML()).toLowerCase()
  const violations = ['<canvas', '<svg', '<table', '<iframe', '<object', '<embed'].filter(
    (element) => html.includes(element),
  )
  const images = html.match(/<img\b[^>]*>/g) ?? []
  if (images.length > 1) violations.push('too many <img>')
  for (const image of images) {
    if (!/\balt="/.test(image)) violations.push('<img without alt')
  }
  return violations
}

/**
 * Writes the fixture's photo asset straight into the app's IndexedDB
 * `assets` store — plain browser API, no product import. Bound to the schema
 * constants of src/storage/db.ts on purpose: a schema change breaks this
 * loudly instead of silently skipping the photo path.
 */
async function seedPhotoAsset(page: Page): Promise<void> {
  await page.evaluate(
    async ({ base64, ref }: { base64: string; ref: string }) => {
      const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
      const blob = new Blob([bytes], { type: 'image/png' })
      await new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('cv4every1')
        open.onerror = () => reject(open.error)
        open.onsuccess = () => {
          const db = open.result
          try {
            const tx = db.transaction('assets', 'readwrite')
            tx.objectStore('assets').put({ ref, blob })
            tx.oncomplete = () => {
              db.close()
              resolve()
            }
            tx.onerror = () => {
              db.close()
              reject(tx.error)
            }
            tx.onabort = () => {
              db.close()
              reject(tx.error)
            }
          } catch (error) {
            db.close()
            reject(error)
          }
        }
      })
    },
    { base64: PNG_1X1_BASE64, ref: ASSET_REF },
  )
}

/**
 * Imports the fixture through the real DraftPanel flow, then switches to
 * Creative through the real ModeToggle. The imported draft opens in its
 * stored ATS mode with the PreviewPane mounted directly — no query-param
 * gate since Task 12. When a photo is seeded, the page reloads once so the
 * photo resolver observes the asset through its normal mount path (the
 * reload-restore behaviour of D14), exactly as the Task 11 gate did.
 */
async function openCreativePreview(page: Page, seedPhoto: boolean): Promise<void> {
  await page.goto('/')
  await page.setInputFiles('input[type="file"]', {
    name: 'full-document.cv4e.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(ENVELOPE), 'utf8'),
  })
  // The imported draft opens automatically in its stored mode.
  await expect(page.getByText('Fixture Lengkap').first()).toBeVisible({ timeout: 15_000 })
  if (seedPhoto) {
    await seedPhotoAsset(page)
    await page.reload()
  }
  await expect(page.locator('#cv-preview .cv-ats-name')).toHaveText('Contoh Nama Fiktif', {
    timeout: 15_000,
  })
  await page.getByText('Creative', { exact: true }).click()
  // Wait for the Creative surface itself (not just the h1 text, which both
  // modes render): the lazy chunk suspends the pane to empty in between.
  await expect(page.locator('#cv-preview .cv-creative')).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('#cv-preview h1')).toHaveText('Contoh Nama Fiktif', {
    timeout: 15_000,
  })
}

test('print layout: two columns, controlled headings, photo, audited surface', async ({ page }) => {
  await openCreativePreview(page, true)

  expect(await previewStructuralViolations(page)).toEqual([])
  const img = page.locator('#cv-preview img')
  await expect(img).toHaveCount(1)
  await expect(img).toHaveAttribute('alt', 'Contoh Nama Fiktif')
  const src = await img.getAttribute('src')
  expect(src ?? '').toMatch(/^blob:/)

  // Sidebar (skills) first, then the main-column sections in view-model order.
  const headings = await page.locator('#cv-preview h2').allTextContents()
  expect(headings).toEqual([
    'KEAHLIAN',
    'PENDIDIKAN',
    'PENGALAMAN KERJA',
    'ORGANISASI',
    'PROYEK',
    'SERTIFIKASI',
  ])

  await expectNoViolations(page)

  // Print isolation: only the document survives `@media print`.
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.cv-creative')).toBeVisible()
  await expect(page.locator('#cv-preview h1')).toHaveText('Contoh Nama Fiktif')
})

test('PDF text extraction restores the whole preview in reading order', async ({ page }) => {
  test.skip(
    test.info().project.name !== 'chromium',
    'page.pdf() is a Chromium capability; the extraction gate runs on CI Chromium/Linux (ADR-0007)',
  )
  await openCreativePreview(page, true)

  // The page itself is the expectation source (single codepath): whatever the
  // preview shows must come back from the PDF, completely and in order.
  const innerText = await page.locator('#cv-preview').innerText()
  const lines = innerText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
  expect(lines.length).toBeGreaterThan(10)

  const pdf = await page.pdf({ format: 'A4', printBackground: true })
  const parser = new PDFParse({ data: new Uint8Array(pdf) })
  try {
    const { text } = await parser.getText()
    const despaced = despace(text)
    const missing = lines.filter((line) => !despaced.includes(despace(line)))
    expect(missing, `preview lines missing from PDF text: ${missing.join(' | ')}`).toEqual([])
    expect(firstOutOfOrder(text, lines)).toBeNull()

    // Readable sentinels for the parser-critical formats (ats-test-plan §1).
    expect(despaced).toContain('3.52/4.00')
    expect(despaced).toContain('+62812-0000-0000')
    expect(despaced).toContain('pendidikan')
  } finally {
    await parser.destroy()
  }
})

test('a failed photo blob degrades to the placeholder and makes no off-origin request', async ({
  page,
}) => {
  const offOrigin: string[] = []
  page.on('request', (request) => {
    const url = request.url()
    if (url.startsWith('blob:') || url.startsWith('data:')) return
    if (!url.startsWith(ORIGIN)) offOrigin.push(url)
  })

  // No asset seeded: the photo is enabled with an assetRef that cannot load.
  await openCreativePreview(page, false)

  await expect(page.locator('#cv-preview img')).toHaveCount(0)
  await expect(page.locator('#cv-preview [aria-hidden="true"]')).toHaveCount(1)
  // The text is unaffected by the photo failure.
  await expect(page.locator('#cv-preview h1')).toHaveText('Contoh Nama Fiktif')

  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.cv-creative')).toBeVisible()

  expect(offOrigin).toEqual([])
})
