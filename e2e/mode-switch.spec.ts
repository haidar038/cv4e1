import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'

/**
 * Dual-engine UX gates (Task 12, FR-003/FR-002/FR-008, J3).
 *
 * The PreviewPane replaces the `?preview=ats|creative` gate: one click on
 * the ModeToggle swaps the mounted renderer without a reload and without
 * touching source data, and the PhotoNotice explains the ATS photo rule.
 * Spec files keep their names — traceability-matrix.md refers to these paths.
 *
 * Offline honesty (plan decision D-dec-6): the service worker only arrives
 * in Task 14, so the offline test below proves what Task 12 can honestly
 * claim — toggling and previewing with the network cut, zero off-origin
 * requests, everything local. Full offline-after-reload waits for Task 14.
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

const PHOTO_NOTICE =
  'Versi ATS menyembunyikan foto agar aman dibaca sistem pelacak lamaran. Foto Anda tetap tersimpan dan muncul di versi Creative.'

/** Imports the fixture; the draft opens in its stored ATS mode with the pane mounted. */
async function openPaneWithFixture(page: Page): Promise<void> {
  await page.goto('/')
  await page.setInputFiles('input[type="file"]', {
    name: 'full-document.cv4e.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(ENVELOPE), 'utf8'),
  })
  await expect(page.getByText('Fixture Lengkap').first()).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('#cv-preview .cv-ats-name')).toHaveText('Contoh Nama Fiktif', {
    timeout: 15_000,
  })
}

/** Raw IndexedDB read of the drafts store — no product import (e2e rule). */
async function readDraftRecords(page: Page): Promise<string> {
  const records = await page.evaluate(
    () =>
      new Promise<unknown[]>((resolve, reject) => {
        const open = indexedDB.open('cv4every1')
        open.onerror = () => reject(open.error)
        open.onsuccess = () => {
          const db = open.result
          try {
            const request = db.transaction('drafts', 'readonly').objectStore('drafts').getAll()
            request.onsuccess = () => {
              db.close()
              resolve(request.result as unknown[])
            }
            request.onerror = () => {
              db.close()
              reject(request.error)
            }
          } catch (error) {
            db.close()
            reject(error)
          }
        }
      }),
  )
  // The ONLY allowed difference across a mode round-trip is meta.mode.
  // `id`/`updatedAt` are storage metadata rewritten by every autosave, not
  // source data, so they are excluded from the comparison.
  for (const record of records) {
    const entry = record as { meta?: Record<string, unknown>; id?: unknown; updatedAt?: unknown }
    if (entry.meta !== undefined) delete entry.meta.mode
    delete entry.id
    delete entry.updatedAt
  }
  return JSON.stringify(records)
}

test('toggle swaps the renderer without a reload', async ({ page }) => {
  await openPaneWithFixture(page)
  await page.evaluate(() => {
    ;(window as unknown as { __t12marker?: number }).__t12marker = 1
  })

  await expect(page.locator('#cv-preview .cv-ats')).toBeVisible()
  await page.getByText('Creative', { exact: true }).click()
  await expect(page.locator('#cv-preview .cv-creative')).toBeVisible()
  await expect(page.locator('#cv-preview h1')).toHaveText('Contoh Nama Fiktif')
  await page.getByText('ATS', { exact: true }).click()
  await expect(page.locator('#cv-preview .cv-ats')).toBeVisible()

  // The marker survives: no reload, no navigation, no flicker-through-empty.
  expect(
    await page.evaluate(() => (window as unknown as { __t12marker?: number }).__t12marker),
  ).toBe(1)
})

test('a mode round-trip leaves source data identical except meta.mode (AC-003-a)', async ({
  page,
}) => {
  await openPaneWithFixture(page)
  const before = await readDraftRecords(page)

  await page.getByText('Creative', { exact: true }).click()
  await expect(page.locator('#cv-preview .cv-creative')).toBeVisible()
  await page.getByText('ATS', { exact: true }).click()
  await expect(page.locator('#cv-preview .cv-ats')).toBeVisible()

  // Autosave debounce is 2 s (D1); wait past it so both mode writes persist.
  await page.waitForTimeout(3000)
  expect(await readDraftRecords(page)).toBe(before)
})

test('the photo notice explains once per session, then stays dismissed', async ({ page }) => {
  await openPaneWithFixture(page)

  // The fixture carries a photo, the stored mode is ATS: the verbatim
  // explanation shows on load.
  await expect(page.getByText(PHOTO_NOTICE)).toBeVisible()

  await page.getByRole('button', { name: 'Tutup pemberitahuan' }).click()
  await expect(page.getByText(PHOTO_NOTICE)).not.toBeVisible()

  // Same session: a Creative detour and back must not resurface it.
  await page.getByText('Creative', { exact: true }).click()
  await expect(page.locator('#cv-preview .cv-creative')).toBeVisible()
  await page.getByText('ATS', { exact: true }).click()
  await expect(page.locator('#cv-preview .cv-ats')).toBeVisible()
  await expect(page.getByText(PHOTO_NOTICE)).not.toBeVisible()
})

test('the mode change is announced and keyboard-operable without losing focus', async ({
  page,
}) => {
  await openPaneWithFixture(page)

  const ats = page.getByRole('radio', { name: 'ATS' })
  await ats.focus()
  await expect(ats).toBeFocused()
  await page.keyboard.press('ArrowRight')

  const creative = page.getByRole('radio', { name: 'Creative' })
  await expect(creative).toBeChecked()
  await expect(creative).toBeFocused()
  await expect(page.locator('#cv-preview .cv-creative')).toBeVisible()
  // The toggle announcer is the `p[role=status]` inside the preview region
  // (the autosave indicator owns the other page-level status region, and the
  // photo notice is a `div`, so this selector is unambiguous).
  await expect(page.locator('section[aria-label="Pratinjau CV"] p[role="status"]')).toContainText(
    'Mode Creative aktif',
  )
})

test('toggling works with the network cut and makes no off-origin request', async ({
  page,
  context,
}) => {
  const offOrigin: string[] = []
  page.on('request', (request) => {
    const url = request.url()
    if (url.startsWith('blob:') || url.startsWith('data:')) return
    if (!url.startsWith(ORIGIN)) offOrigin.push(url)
  })

  await openPaneWithFixture(page)

  // Warm both lazy renderer chunks first: cutting the network before either
  // chunk is fetched would block its dynamic import (the chunks are network
  // resources until Task 14 precaches them). The honest offline claim is
  // narrower — once loaded, toggling and previewing need no network.
  await page.getByText('Creative', { exact: true }).click()
  await expect(page.locator('#cv-preview .cv-creative')).toBeVisible()
  await page.getByText('ATS', { exact: true }).click()
  await expect(page.locator('#cv-preview .cv-ats')).toBeVisible()

  await context.setOffline(true)

  await page.getByText('Creative', { exact: true }).click()
  await expect(page.locator('#cv-preview .cv-creative')).toBeVisible()
  await page.getByText('ATS', { exact: true }).click()
  await expect(page.locator('#cv-preview .cv-ats')).toBeVisible()

  expect(offOrigin).toEqual([])
})

test('toggling respects prefers-reduced-motion', async ({ page }) => {
  await openPaneWithFixture(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })

  await page.getByText('Creative', { exact: true }).click()
  await expect(page.locator('#cv-preview .cv-creative')).toBeVisible()
  await expect(page.locator('#cv-preview h1')).toHaveText('Contoh Nama Fiktif')
})

test.describe('mobile', () => {
  test.use({ viewport: { width: 360, height: 740 } })

  test('form/preview tabs switch panes and the toggle works behind the preview tab', async ({
    page,
  }) => {
    await openPaneWithFixture(page)

    const formTab = page.getByRole('tab', { name: 'Form' })
    const previewTab = page.getByRole('tab', { name: 'Pratinjau' })
    await expect(formTab).toHaveAttribute('aria-selected', 'true')

    await previewTab.click()
    await expect(previewTab).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('#cv-preview .cv-ats')).toBeVisible()

    await page.getByText('Creative', { exact: true }).click()
    await expect(page.locator('#cv-preview .cv-creative')).toBeVisible()

    // The preview stays inside the narrow viewport.
    const box = await page.locator('#cv-preview').boundingBox()
    expect(box, 'preview should be rendered').toBeTruthy()
    if (box) {
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(360)
    }
  })
})
