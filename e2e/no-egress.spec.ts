import { expect, test } from '@playwright/test'

/**
 * Off-origin request evidence (NFR-002, NFR-009, NFR-015).
 *
 * Everything the core flow needs must be served from our own origin: no
 * analytics, no CDN font, no third-party script. The strongest available proof
 * is simply watching the network — a unit test cannot observe a request that
 * was never written, but the browser can observe one that is.
 *
 * Deliberately scoped to the core (offline) flow: "isi form → simpan". The AI
 * phase is the only place that may ever leave the origin, and it does not exist
 * yet (Phase 2) — when it does, its own spec must prove the request happens
 * only after explicit per-operation consent.
 */
const ORIGIN = 'http://127.0.0.1:4173'

test('the core flow makes no off-origin request', async ({ page }) => {
  const offOrigin: string[] = []

  page.on('request', (request) => {
    const url = request.url()
    // In-page object/data URLs are not network traffic.
    if (url.startsWith('blob:') || url.startsWith('data:')) return
    if (!url.startsWith(ORIGIN)) offOrigin.push(url)
  })

  await page.goto('/')
  await page.getByRole('button', { name: 'Buat CV pertama' }).click()
  // Exact name: the reorder buttons read "Turunkan Pendidikan" etc.
  await page.getByRole('button', { name: 'Pendidikan', exact: true }).click()

  // Task 13b (FR-206, AC-206-a): the verb-suggestion flow is part of the core
  // offline surface — opening the panel and picking a verb must also produce
  // zero off-origin requests. The catalog is a bundled static JSON, so there
  // is nothing to fetch.
  await page.getByRole('button', { name: 'Pengalaman', exact: true }).click()
  await page.getByRole('button', { name: 'Tambah Pengalaman', exact: true }).click()
  await page.getByRole('button', { name: 'Tambah Poin pencapaian', exact: true }).click()
  await page.getByRole('button', { name: 'Saran kata kerja Pengalaman Poin pencapaian 1' }).click()
  await page.getByRole('button', { name: 'Memimpin', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Poin pencapaian 1' })).toHaveValue('Memimpin')

  expect(offOrigin).toEqual([])
})
