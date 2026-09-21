import { expect, test, type Page } from '@playwright/test'

/**
 * Offline + installability gates (Task 14, FR-301/FR-304, NFR-001/NFR-003,
 * NFR-009/NFR-012).
 *
 * What this proves (and nothing more):
 *  - the precached app shell loads after a full offline reload (real reload,
 *    not just a network cut — the Task 12 `setOffline`-without-reload claim
 *    is extended here to reload-offline, which is what "offline sepenuhnya"
 *    means);
 *  - the core flow works offline: fill form → autosave → reload offline →
 *    draft restored → toggle mode → print path (stubbed `window.print`;
 *    the real dialog cannot be automated, and PDF *content* fidelity is
 *    already proven by ats/creative-print.spec.ts);
 *  - zero off-origin requests across the whole flow (NFR-009), manifest valid
 *    and served from our own origin with local icons (D20, NFR-012).
 *
 * What this does NOT claim: first-visit-offline (impossible without a prior
 * visit), persistence across browser restarts, or the native print dialog.
 */

const ORIGIN = 'http://127.0.0.1:4173'

async function waitForServiceWorkerControl(page: Page): Promise<void> {
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, {
    timeout: 30_000,
  })
}

test('manifest is valid and served from our own origin with local icons', async ({ page }) => {
  const offOrigin: string[] = []
  page.on('request', (request) => {
    const url = request.url()
    if (url.startsWith('blob:') || url.startsWith('data:')) return
    if (!url.startsWith(ORIGIN)) offOrigin.push(url)
  })

  const response = await page.request.get('/manifest.webmanifest')
  expect(response.ok()).toBe(true)
  const manifest = (await response.json()) as {
    name?: unknown
    short_name?: unknown
    lang?: unknown
    display?: unknown
    start_url?: unknown
    icons?: Array<{ src?: string; sizes?: string }>
  }
  expect(manifest.name).toBe('cv4every1')
  expect(manifest.short_name).toBe('cv4every1')
  expect(manifest.lang).toBe('id')
  expect(manifest.display).toBe('standalone')
  expect(manifest.start_url).toBe('/')

  const sizes = new Set((manifest.icons ?? []).map((icon) => icon.sizes))
  expect(sizes.has('192x192')).toBe(true)
  expect(sizes.has('512x512')).toBe(true)
  for (const icon of manifest.icons ?? []) {
    expect(icon.src, 'icon must be same-origin (D20, no remote assets)').toMatch(/^\//)
    const iconResponse = await page.request.get(icon.src ?? '')
    expect(iconResponse.ok()).toBe(true)
  }

  expect(offOrigin).toEqual([])
})

test('full flow offline: fill → save → reload offline → draft → toggle → print', async ({
  page,
  context,
}) => {
  const offOrigin: string[] = []
  page.on('request', (request) => {
    const url = request.url()
    if (url.startsWith('blob:') || url.startsWith('data:')) return
    if (!url.startsWith(ORIGIN)) offOrigin.push(url)
  })

  // First visit warms the service worker; claim takes effect on this page
  // without a reload, but we reload anyway below to prove the cold path.
  await page.goto('/')
  await expect(page.locator('#root')).not.toBeEmpty()
  await waitForServiceWorkerControl(page)

  // Full offline reload: the shell must come from the SW precache.
  await context.setOffline(true)
  await page.reload()
  await expect(page.locator('#root')).not.toBeEmpty()
  await expect(page.getByRole('button', { name: 'Buat CV pertama' })).toBeVisible({
    timeout: 15_000,
  })

  // Fill the form offline; autosave persists to IndexedDB (also offline).
  await page.getByRole('button', { name: 'Buat CV pertama' }).click()
  await page.getByRole('button', { name: 'Data Diri', exact: true }).click()
  await page.getByLabel('Nama lengkap').fill('Budi Santoso')
  // `first()`: the autosave text renders in the indicator and once more in
  // the shell (same pattern as other specs) — strict mode needs one target.
  // The fixed wait covers the 2 s autosave debounce (D1): 'Tersimpan' is
  // already visible from draft creation, so it cannot prove OUR keystrokes
  // persisted — same precedent as mode-switch.spec.ts (AC-003-a).
  await page.waitForTimeout(3000)
  await expect(page.getByText('Tersimpan').first()).toBeVisible({ timeout: 15_000 })

  // Second offline reload: the draft restores from storage (D14 lastDraftId).
  await page.reload()
  await page.getByRole('button', { name: 'Data Diri', exact: true }).click()
  await expect(page.getByLabel('Nama lengkap')).toHaveValue('Budi Santoso', {
    timeout: 15_000,
  })

  // Toggle both renderers offline (chunks are precached after first paint).
  // Desktop viewport: both panes show side by side, no tab switch needed.
  await expect(page.locator('#cv-preview .cv-ats')).toBeVisible({ timeout: 15_000 })
  await page.getByText('Creative', { exact: true }).click()
  await expect(page.locator('#cv-preview .cv-creative')).toBeVisible()
  await page.getByText('ATS', { exact: true }).click()
  await expect(page.locator('#cv-preview .cv-ats')).toBeVisible()

  // Print path offline: the dialog cannot be automated, so the stub proves
  // the button reaches `window.print()` on the active mode (AC-301-a).
  await page.evaluate(() => {
    ;(window as unknown as { __printed?: boolean }).__printed = false
    window.print = () => {
      ;(window as unknown as { __printed?: boolean }).__printed = true
    }
  })
  await page.getByRole('button', { name: 'Panduan cetak' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByText('CV-budi-santoso-ats.pdf')).toBeVisible()
  await page.getByRole('button', { name: 'Cetak sekarang' }).click()
  expect(await page.evaluate(() => (window as unknown as { __printed?: boolean }).__printed)).toBe(
    true,
  )

  expect(offOrigin).toEqual([])
})

test('clearing Cache Storage keeps IndexedDB drafts intact (cache ≠ data)', async ({
  page,
  context,
}) => {
  await page.goto('/')
  await waitForServiceWorkerControl(page)

  await page.getByRole('button', { name: 'Buat CV pertama' }).click()
  await page.getByRole('button', { name: 'Data Diri', exact: true }).click()
  await page.getByLabel('Nama lengkap').fill('Budi Santoso')
  // Same debounce wait as above — 'Tersimpan' predates our keystrokes.
  await page.waitForTimeout(3000)
  await expect(page.getByText('Tersimpan').first()).toBeVisible({ timeout: 15_000 })

  // Wipe every cache, then reload ONLINE: the shell refetches, the draft
  // restores from IndexedDB — proving the two stores are independent.
  // (`expect` cannot run inside evaluate — assert the returned keys here.)
  const remaining = await page.evaluate(async () => {
    for (const key of await caches.keys()) await caches.delete(key)
    return await caches.keys()
  })
  expect(remaining).toEqual([])
  await context.setOffline(false)
  await page.reload()
  await page.getByRole('button', { name: 'Data Diri', exact: true }).click()
  await expect(page.getByLabel('Nama lengkap')).toHaveValue('Budi Santoso', {
    timeout: 15_000,
  })
})
