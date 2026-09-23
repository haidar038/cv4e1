import { expect, test, type Page } from '@playwright/test'

/**
 * Bullet generator end-to-end (Task 19, FR-401/402/403, AC-401-a/b, AC-403-a).
 *
 * Runs against the production build — the regression gate for the
 * React-Compiler class of bug (Task 18 incident: stale state in production
 * while jsdom stays green). The Groq endpoint is route-mocked, so no real
 * network ever leaves the harness; the mock payload is grounded in the
 * typed input (numbers and capitalised words all come from it).
 */

const RAW_TASK = 'membantu menyusun laporan untuk 30 peserta'

function groundedMockBody(): string {
  return JSON.stringify({
    suggestions: [
      {
        text: 'Menyusun laporan untuk 30 peserta [dampak yang dapat diukur].',
        actionVerb: 'Menyusun',
        usesPlaceholder: true,
        rationale: 'Membantu menyusun laporan untuk 30 peserta.',
        warnings: [],
      },
      {
        text: 'Membantu menyusun laporan untuk 30 peserta.',
        actionVerb: 'Membantu',
        usesPlaceholder: false,
        rationale: 'Membantu menyusun laporan untuk 30 peserta.',
        warnings: [],
      },
    ],
  })
}

function groqEnvelope(content: string): string {
  return JSON.stringify({ choices: [{ message: { content } }] })
}

async function createDraftWithBullet(page: Page): Promise<void> {
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
  await row.fill(RAW_TASK)
  await expect(row).toHaveValue(RAW_TASK)
}

async function openGenerator(page: Page): Promise<void> {
  const trigger = page.getByRole('button', {
    name: 'Saran bullet AI Pengalaman Poin pencapaian 1',
  })
  await trigger.scrollIntoViewIfNeeded()
  await trigger.click()
  await expect(page.getByRole('button', { name: 'Minta saran' })).toBeVisible()
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

test.describe('bullet generator', () => {
  test('AI path: consent gates the send, Apply changes only the approved row', async ({ page }) => {
    let groqCalls = 0
    await page.route('**/api.groq.com/**', async (route) => {
      groqCalls += 1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: groqEnvelope(groundedMockBody()),
      })
    })

    await createDraftWithBullet(page)
    await saveGroqKey(page)
    await openGenerator(page)

    const generate = page.getByRole('button', { name: 'Minta saran' })
    await generate.scrollIntoViewIfNeeded()
    await generate.click()

    // First send requires the full consent dialog — nothing sent yet.
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    expect(groqCalls).toBe(0)

    await page.getByRole('button', { name: 'Setuju dan kirim' }).click()
    // The mock returns 2 suggestions, static returns 3 — the count proves
    // the granted retry (not the pre-grant fallback) produced this list.
    const applyButtons = page.getByRole('button', { name: /Terapkan Saran \d/ })
    await expect(applyButtons).toHaveCount(2)
    expect(groqCalls).toBe(1)
    const applyFirst = page.getByRole('button', { name: 'Terapkan Saran 1' })
    await expect(applyFirst).toBeVisible()

    // AC-401-a: candidates on screen, the row (and document) untouched.
    await expect(page.getByRole('textbox', { name: 'Poin pencapaian 1' })).toHaveValue(RAW_TASK)

    // AC-401-b: only the approved suggestion lands in the row.
    await applyFirst.scrollIntoViewIfNeeded()
    await applyFirst.click()
    await expect(page.getByRole('textbox', { name: 'Poin pencapaian 1' })).toHaveValue(
      'Menyusun laporan untuk 30 peserta [dampak yang dapat diukur].',
    )
    await expect(page.getByRole('button', { name: 'Terapkan Saran 1' })).toBeHidden()
  })

  test('fallback path without a key: static suggestions apply end-to-end', async ({ page }) => {
    let groqCalls = 0
    await page.route('**/api.groq.com/**', async (route) => {
      groqCalls += 1
      await route.abort()
    })

    await createDraftWithBullet(page)
    await openGenerator(page)

    const generate = page.getByRole('button', { name: 'Minta saran' })
    await generate.scrollIntoViewIfNeeded()
    await generate.click()

    // AC-403-a: usable non-AI output, no dialog, zero requests.
    const applyFirst = page.getByRole('button', { name: 'Terapkan Saran 1' })
    await expect(applyFirst).toBeVisible()
    await expect(
      page.getByText('Belum ada kunci — menampilkan saran manual yang tetap bisa dipakai.'),
    ).toBeVisible()
    expect(groqCalls).toBe(0)

    await applyFirst.scrollIntoViewIfNeeded()
    await applyFirst.click()
    const row = page.getByRole('textbox', { name: 'Poin pencapaian 1' })
    await expect(row).not.toHaveValue(RAW_TASK)
    await expect(row).toHaveValue(/\[dampak yang dapat diukur\]/)
  })

  test('declining consent sends nothing and falls back to static', async ({ page }) => {
    let groqCalls = 0
    await page.route('**/api.groq.com/**', async (route) => {
      groqCalls += 1
      await route.abort()
    })

    await createDraftWithBullet(page)
    await saveGroqKey(page)
    await openGenerator(page)

    const generate = page.getByRole('button', { name: 'Minta saran' })
    await generate.scrollIntoViewIfNeeded()
    await generate.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await page.getByRole('button', { name: 'Tolak' }).click()
    await expect(dialog).toBeHidden()

    await expect(page.getByRole('button', { name: 'Terapkan Saran 1' })).toBeVisible()
    await expect(
      page.getByText(
        'Persetujuan ditolak — menampilkan saran manual. Tidak ada data yang dikirim.',
      ),
    ).toBeVisible()
    expect(groqCalls).toBe(0)
  })

  test('keyboard flow: trigger opens with Enter, Escape closes without applying', async ({
    page,
  }) => {
    await page.route('**/api.groq.com/**', async (route) => {
      await route.abort()
    })

    await createDraftWithBullet(page)
    const trigger = page.getByRole('button', {
      name: 'Saran bullet AI Pengalaman Poin pencapaian 1',
    })
    await trigger.scrollIntoViewIfNeeded()
    await trigger.focus()
    await page.keyboard.press('Enter')
    const generate = page.getByRole('button', { name: 'Minta saran' })
    await expect(generate).toBeVisible()

    // Escape only reaches the panel handler from inside the panel.
    await generate.focus()
    await page.keyboard.press('Escape')
    await expect(generate).toBeHidden()
    await expect(page.getByRole('textbox', { name: 'Poin pencapaian 1' })).toHaveValue(RAW_TASK)
  })
})
