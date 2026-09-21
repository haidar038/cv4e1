import { expect, test, type Page } from '@playwright/test'

/**
 * Delete-all-data + local-storage notice gates (Task 15, FR-108/FR-109,
 * FR-111, J9, DF-8).
 *
 * What this proves (and nothing more):
 *  - confirming the wipe empties all three places — IndexedDB
 *    (drafts + assets + meta), localStorage (`cv4every1:*`), and the Task-14
 *    service-worker precache — verified by raw reads with no product import,
 *    while the success state is still on screen (before the explicit reload);
 *  - the reload after the wipe lands on the fully empty condition, with the
 *    stores still empty (the SW re-precaches the *shell* on reload — that is
 *    app code, not user data, and is not counted);
 *  - export-first downloads a valid `.cv4e.json` envelope of the open draft;
 *  - cancelling the dialog deletes nothing;
 *  - a second tab in the same origin resets to empty via broadcast, without
 *    reloading.
 *
 * What this does NOT claim: the partial-failure copy (blocked storage,
 * missing Cache Storage on `file://`) — those paths are unit-proven in
 * `src/storage/wipe.test.ts` with injected fakes, because this harness
 * always runs on http with storage available. Zero off-origin requests
 * across the flow (NFR-002/009) is collected in every test.
 */

const ORIGIN = 'http://127.0.0.1:4173'

const VERBATIM_PART = 'Membersihkan data peramban, mode penyamaran'

async function waitForServiceWorkerControl(page: Page): Promise<void> {
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, {
    timeout: 30_000,
  })
}

/** Collects off-origin requests; blob:/data: are in-page, not network. */
function collectEgress(page: Page): string[] {
  const offOrigin: string[] = []
  page.on('request', (request) => {
    const url = request.url()
    if (url.startsWith('blob:') || url.startsWith('data:')) return
    if (!url.startsWith(ORIGIN)) offOrigin.push(url)
  })
  return offOrigin
}

/** Creates one draft with a saved name; the autosave debounce is waited out. */
async function createSavedDraft(page: Page, name: string): Promise<void> {
  await page.goto('/')
  await page.getByRole('button', { name: 'Buat CV pertama' }).click()
  await page.getByRole('button', { name: 'Data Diri', exact: true }).click()
  await page.getByLabel('Nama lengkap').fill(name)
  // Same precedent as mode-switch/offline specs: 'Tersimpan' predates our
  // keystrokes, so the fixed 2 s debounce wait is the proof of persistence.
  await page.waitForTimeout(3000)
  await expect(page.getByText('Tersimpan').first()).toBeVisible({ timeout: 15_000 })
}

/** Raw IndexedDB row count — no product import (e2e rule). */
async function countStore(page: Page, store: string): Promise<number> {
  return page.evaluate(
    (storeName) =>
      new Promise<number>((resolve, reject) => {
        const open = indexedDB.open('cv4every1')
        open.onerror = () => reject(open.error)
        open.onsuccess = () => {
          const database = open.result
          try {
            const request = database
              .transaction(storeName, 'readonly')
              .objectStore(storeName)
              .getAll()
            request.onsuccess = () => {
              database.close()
              resolve((request.result as unknown[]).length)
            }
            request.onerror = () => {
              database.close()
              reject(request.error)
            }
          } catch (error) {
            database.close()
            reject(error)
          }
        }
      }),
    store,
  )
}

async function ownStorageKeys(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    Object.keys(localStorage).filter((key) => key.startsWith('cv4every1:')),
  )
}

async function cacheNames(page: Page): Promise<string[]> {
  return page.evaluate(() => caches.keys())
}

async function openWipeDialog(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Hapus semua data', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByText('Hapus semua data?')).toBeVisible()
}

test('wipe + explicit reload reaches the fully empty condition (AC-108-a)', async ({ page }) => {
  const offOrigin = collectEgress(page)
  await createSavedDraft(page, 'Budi Santoso')
  await waitForServiceWorkerControl(page)
  expect(await cacheNames(page)).toContain('cv4every1-precache')

  await openWipeDialog(page)
  await page.getByRole('button', { name: 'Ya, hapus semua' }).click()
  await expect(page.getByText(/Semua data terhapus/)).toBeVisible({ timeout: 15_000 })

  // All three places verified empty while the success state is on screen —
  // i.e. before the explicit reload (after it, the SW re-precaches the shell).
  expect(await countStore(page, 'drafts')).toBe(0)
  expect(await countStore(page, 'assets')).toBe(0)
  expect(await countStore(page, 'meta')).toBe(0)
  expect(await ownStorageKeys(page)).toEqual([])
  expect(await cacheNames(page)).toEqual([])

  await page.getByRole('button', { name: 'Muat ulang' }).click()
  await expect(page.getByRole('button', { name: 'Buat CV pertama' })).toBeVisible({
    timeout: 15_000,
  })

  // Still empty after the reload: drafts, prefs, and no resurrected data.
  expect(await countStore(page, 'drafts')).toBe(0)
  expect(await ownStorageKeys(page)).toEqual([])
  // The permanent footer notice is the always-visible storage warning.
  await expect(page.getByRole('contentinfo')).toContainText(VERBATIM_PART)

  expect(offOrigin).toEqual([])
})

test('export-first downloads a valid envelope of the open draft', async ({ page }) => {
  const offOrigin = collectEgress(page)
  await createSavedDraft(page, 'Budi Santoso')
  await openWipeDialog(page)

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Ekspor dulu (.json)' }).click(),
  ])
  const path = await download.path()
  expect(path).toBeTruthy()
  const { readFileSync } = await import('node:fs')
  const envelope = JSON.parse(readFileSync(path as string, 'utf8')) as {
    format?: unknown
    data?: { basics?: { name?: unknown } }
  }
  expect(envelope.format).toBe('cv4every1')
  expect(envelope.data?.basics?.name).toBe('Budi Santoso')

  // The dialog is still open: exporting never confirms the wipe.
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Batal' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()

  // Nothing deleted: the draft is intact.
  expect(await countStore(page, 'drafts')).toBe(1)
  await page.getByRole('button', { name: 'Data Diri', exact: true }).click()
  await expect(page.getByLabel('Nama lengkap')).toHaveValue('Budi Santoso')

  expect(offOrigin).toEqual([])
})

test('cancelling the dialog deletes nothing', async ({ page }) => {
  const offOrigin = collectEgress(page)
  await createSavedDraft(page, 'Budi Santoso')

  await openWipeDialog(page)
  await page.getByRole('button', { name: 'Batal' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()

  expect(await countStore(page, 'drafts')).toBe(1)
  await expect(page.getByLabel('Nama lengkap')).toHaveValue('Budi Santoso')

  expect(offOrigin).toEqual([])
})

test('a second tab resets to empty via broadcast, without reloading', async ({ page, context }) => {
  const offOrigin = collectEgress(page)
  await createSavedDraft(page, 'Budi Santoso')

  const second = await context.newPage()
  await second.goto('/')
  await second.getByRole('button', { name: 'Data Diri', exact: true }).click()
  await expect(second.getByLabel('Nama lengkap')).toHaveValue('Budi Santoso', {
    timeout: 15_000,
  })
  await second.evaluate(() => {
    ;(window as unknown as { __t15marker?: number }).__t15marker = 1
  })

  await openWipeDialog(page)
  await page.getByRole('button', { name: 'Ya, hapus semua' }).click()
  await expect(page.getByText(/Semua data terhapus/)).toBeVisible({ timeout: 15_000 })

  // The second tab follows into the empty condition on broadcast alone.
  await expect(second.getByRole('button', { name: 'Buat CV pertama' })).toBeVisible({
    timeout: 15_000,
  })
  expect(
    await second.evaluate(() => (window as unknown as { __t15marker?: number }).__t15marker),
  ).toBe(1)

  await second.close()
  expect(offOrigin).toEqual([])
})
