import { expect, test, type Page } from '@playwright/test'

/**
 * Tailoring flow end-to-end (T3b, FR-601/602/603).
 *
 * Runs against the production build — the regression gate for the
 * React-Compiler class of bug (Task 18 incident: stale state in production
 * while jsdom stays green). There is deliberately no Apply step anywhere in
 * this flow: the gap analysis is read-only review (FR-602 holds
 * structurally), so these specs lock the outcome by visible lists and by
 * post-operation draft counts, not visibility alone.
 */

const JD = 'Dicari staf administrasi yang menguasai Microsoft Excel.'

function groqEnvelope(content: string): string {
  return JSON.stringify({ choices: [{ message: { content } }] })
}

async function createDraftWithExcelHighlight(page: Page): Promise<void> {
  await page.goto('/')
  await page.getByRole('button', { name: 'Buat CV pertama' }).click()
  await page.getByRole('button', { name: 'Pengalaman', exact: true }).click()
  const addItem = page.getByRole('button', { name: 'Tambah Pengalaman' })
  await addItem.scrollIntoViewIfNeeded()
  await addItem.click()
  const addBullet = page.getByRole('button', { name: 'Tambah Poin pencapaian' })
  await addBullet.scrollIntoViewIfNeeded()
  await addBullet.click()
  const row = page.getByRole('textbox', { name: 'Poin pencapaian 1' })
  await row.fill('Menyusun laporan Microsoft Excel.')
  await expect(row).toHaveValue('Menyusun laporan Microsoft Excel.')
}

async function openTailoring(page: Page): Promise<void> {
  const trigger = page.getByRole('button', { name: 'Sesuaikan dengan lowongan Pengalaman' })
  await trigger.scrollIntoViewIfNeeded()
  await trigger.click()
  await expect(page.getByRole('button', { name: 'Analisis kecocokan', exact: true })).toBeVisible()
}

async function fillJd(page: Page, text: string = JD): Promise<void> {
  const box = page.getByRole('textbox', { name: 'Deskripsi lowongan' })
  await box.scrollIntoViewIfNeeded()
  await box.fill(text)
  await expect(box).toHaveValue(text)
}

async function saveGroqKey(page: Page): Promise<void> {
  const keyInput = page.getByLabel('Kunci API').first()
  await keyInput.scrollIntoViewIfNeeded()
  await keyInput.pressSequentially('gsk-e2e-fake-key')
  const saveButton = page.getByRole('button', { name: 'Simpan di sesi ini' }).first()
  await saveButton.scrollIntoViewIfNeeded()
  await saveButton.click()
  await expect(page.getByText('Kunci tersimpan di sesi ini.').first()).toBeVisible()
}

test.describe('tailoring flow', () => {
  test('static path: review lists the gaps and the draft stays untouched', async ({ page }) => {
    await createDraftWithExcelHighlight(page)
    await openTailoring(page)
    await fillJd(page)

    const generate = page.getByRole('button', { name: 'Analisis kecocokan', exact: true })
    await generate.scrollIntoViewIfNeeded()
    await generate.click()

    // Static fallback (no key): JD∩resume split, deterministic.
    const matched = page.getByRole('region', { name: 'Kata kunci yang didukung data' })
    await expect(matched).toContainText('excel')
    const unsupported = page.getByRole('region', { name: 'Kata kunci yang belum didukung' })
    await expect(unsupported).toContainText('administrasi')
    await expect(
      page.getByText('Belum ada kunci — menampilkan hasil manual yang tetap bisa dipakai.'),
    ).toBeVisible()

    // FR-602: no mutation path exists — one highlight row before and after,
    // and no Apply button anywhere in the flow.
    await expect(page.getByRole('textbox', { name: 'Poin pencapaian 1' })).toHaveValue(
      'Menyusun laporan Microsoft Excel.',
    )
    await expect(page.getByRole('button', { name: /Terapkan/ })).toHaveCount(0)
  })

  test('AI path: consent gates the send, the banner names the provenance', async ({ page }) => {
    let groqCalls = 0
    await page.route('**/api.groq.com/**', async (route) => {
      groqCalls += 1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: groqEnvelope(
          JSON.stringify({
            matchedKeywords: ['Excel'],
            unsupportedKeywords: ['administrasi'],
            sectionsToStrengthen: [],
            clarifyingQuestions: ['Apakah staf administrasi menyusun Excel?'],
            warnings: [],
          }),
        ),
      })
    })

    await createDraftWithExcelHighlight(page)
    await saveGroqKey(page)
    await openTailoring(page)
    await fillJd(page)

    const generate = page.getByRole('button', { name: 'Analisis kecocokan', exact: true })
    await generate.scrollIntoViewIfNeeded()
    await generate.click()

    // First send requires the full consent dialog — nothing sent yet.
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    expect(groqCalls).toBe(0)

    await page.getByRole('button', { name: 'Setuju dan kirim' }).click()

    // The mock returns a question the static path never asks — its presence
    // plus the banner proves the AI path produced this list.
    await expect(page.getByRole('region', { name: 'Pertanyaan klarifikasi' })).toContainText(
      'Apakah staf administrasi menyusun Excel?',
    )
    await expect(
      page.getByText('Daftar ini dibuat AI — tinjau kembali. AI dapat membuat kesalahan.'),
    ).toBeVisible()
    expect(groqCalls).toBeGreaterThanOrEqual(1)
  })

  test('empty ad keeps generation disabled', async ({ page }) => {
    await createDraftWithExcelHighlight(page)
    await openTailoring(page)

    const generate = page.getByRole('button', { name: 'Analisis kecocokan', exact: true })
    await expect(generate).toBeDisabled()
    await expect(
      page.getByText('Tempel dulu deskripsi lowongannya, lalu hasilnya muncul di sini.'),
    ).toBeVisible()
  })

  test('static path works fully offline with zero off-origin requests (AC-604-a)', async ({
    page,
    context,
  }) => {
    const offOrigin: string[] = []
    page.on('request', (request) => {
      const url = request.url()
      if (url.startsWith('blob:') || url.startsWith('data:')) return
      if (!url.startsWith('http://127.0.0.1:4173')) offOrigin.push(url)
    })

    // Warm-up online: shell precached, draft content autosaved.
    await createDraftWithExcelHighlight(page)
    // Same debounce wait as offline.spec.ts — autosave persists the highlight.
    await page.waitForTimeout(3000)
    await page.goto('/')
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null, {
      timeout: 30_000,
    })

    // Cold offline reload, then the full tailoring flow on precached chunks.
    await context.setOffline(true)
    await page.reload()
    await expect(page.locator('#root')).not.toBeEmpty()
    await page.getByRole('button', { name: 'Pengalaman', exact: true }).click()
    await expect(page.getByRole('textbox', { name: 'Poin pencapaian 1' })).toHaveValue(
      'Menyusun laporan Microsoft Excel.',
      { timeout: 15_000 },
    )
    await openTailoring(page)
    await fillJd(page)

    const generate = page.getByRole('button', { name: 'Analisis kecocokan', exact: true })
    await generate.scrollIntoViewIfNeeded()
    await generate.click()

    const matched = page.getByRole('region', { name: 'Kata kunci yang didukung data' })
    await expect(matched).toContainText('excel')
    const unsupported = page.getByRole('region', { name: 'Kata kunci yang belum didukung' })
    await expect(unsupported).toContainText('administrasi')

    // The pasted ad never leaves the device — nothing off-origin, online or off.
    expect(offOrigin).toEqual([])
  })
})
