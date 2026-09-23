import { expect, test, type Page } from '@playwright/test'

/**
 * Polish end-to-end (Task 20, FR-401/402/403, AC-401-a/b, AC-403-a).
 *
 * Runs against the production build — the regression gate for the
 * React-Compiler class of bug (Task 18 incident: stale state in production
 * while jsdom stays green). The Groq endpoint is route-mocked, so no real
 * network ever leaves the harness; the mock payload is grounded in the
 * typed input (numbers and capitalised words all come from it).
 *
 * Unlike bullets, the static polish fallback never rewrites (guidance
 * only), so success and fallback are locked by the Apply button: present
 * for a live candidate, absent for static guidance.
 */

const RAW_TEXT = 'membantu menyusun laporan untuk 30 peserta'
const POLISHED_TEXT = 'Membantu menyusun laporan untuk 30 peserta.'

function groundedMockBody(): string {
  return JSON.stringify({
    text: POLISHED_TEXT,
    changes: ['Memperbaiki kapitalisasi awal kalimat.', 'Menambahkan tanda baca akhir.'],
    warnings: [],
  })
}

function groqEnvelope(content: string): string {
  return JSON.stringify({ choices: [{ message: { content } }] })
}

async function createDraftWithSummary(page: Page): Promise<void> {
  await page.goto('/')
  await page.getByRole('button', { name: 'Buat CV pertama' }).click()
  await page.getByRole('button', { name: 'Data Diri', exact: true }).click()
  const summary = page.getByRole('textbox', { name: 'Ringkasan' })
  await summary.scrollIntoViewIfNeeded()
  await summary.fill(RAW_TEXT)
  await expect(summary).toHaveValue(RAW_TEXT)
}

async function openPolish(page: Page): Promise<void> {
  const trigger = page.getByRole('button', { name: 'Poles teks dengan AI Ringkasan' })
  await trigger.scrollIntoViewIfNeeded()
  await trigger.click()
  await expect(page.getByRole('button', { name: 'Minta polesan' })).toBeVisible()
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

test.describe('polish', () => {
  test('AI path: consent gates the send, Apply changes only the approved text', async ({
    page,
  }) => {
    let groqCalls = 0
    await page.route('**/api.groq.com/**', async (route) => {
      groqCalls += 1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: groqEnvelope(groundedMockBody()),
      })
    })

    await createDraftWithSummary(page)
    await saveGroqKey(page)
    await openPolish(page)

    const generate = page.getByRole('button', { name: 'Minta polesan' })
    await generate.scrollIntoViewIfNeeded()
    await generate.click()

    // First send requires the full consent dialog — nothing sent yet.
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    expect(groqCalls).toBe(0)

    await page.getByRole('button', { name: 'Setuju dan kirim' }).click()
    // The Apply button proves the granted retry (not the pre-grant
    // fallback) produced this candidate — static guidance offers no Apply.
    const apply = page.getByRole('button', { name: 'Terapkan Ringkasan' })
    await expect(apply).toBeVisible()
    expect(groqCalls).toBe(1)
    await expect(page.getByText('Memperbaiki kapitalisasi awal kalimat.')).toBeVisible()

    // AC-401-a: candidate on screen, the field (and document) untouched.
    await expect(page.getByRole('textbox', { name: 'Ringkasan' })).toHaveValue(RAW_TEXT)

    // AC-401-b: only the approved polish lands in the field.
    await apply.scrollIntoViewIfNeeded()
    await apply.click()
    await expect(page.getByRole('textbox', { name: 'Ringkasan' })).toHaveValue(POLISHED_TEXT)
    await expect(page.getByRole('button', { name: 'Terapkan Ringkasan' })).toBeHidden()
  })

  test('fallback path without a key: static guidance, no Apply, zero requests', async ({
    page,
  }) => {
    let groqCalls = 0
    await page.route('**/api.groq.com/**', async (route) => {
      groqCalls += 1
      await route.abort()
    })

    await createDraftWithSummary(page)
    await openPolish(page)

    const generate = page.getByRole('button', { name: 'Minta polesan' })
    await generate.scrollIntoViewIfNeeded()
    await generate.click()

    // AC-403-a: usable non-AI output, no dialog, zero requests, no rewrite.
    await expect(
      page.getByText('Belum ada kunci — menampilkan panduan manual yang tetap bisa dipakai.'),
    ).toBeVisible()
    await expect(
      page.getByText('Pertahankan semua angka, nama, dan tanggal persis seperti semula.'),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Terapkan Ringkasan' })).toBeHidden()
    expect(groqCalls).toBe(0)
    await expect(page.getByRole('textbox', { name: 'Ringkasan' })).toHaveValue(RAW_TEXT)
  })

  test('declining consent sends nothing and falls back to static', async ({ page }) => {
    let groqCalls = 0
    await page.route('**/api.groq.com/**', async (route) => {
      groqCalls += 1
      await route.abort()
    })

    await createDraftWithSummary(page)
    await saveGroqKey(page)
    await openPolish(page)

    const generate = page.getByRole('button', { name: 'Minta polesan' })
    await generate.scrollIntoViewIfNeeded()
    await generate.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await page.getByRole('button', { name: 'Tolak' }).click()
    await expect(dialog).toBeHidden()

    await expect(page.getByRole('button', { name: 'Terapkan Ringkasan' })).toBeHidden()
    await expect(
      page.getByText(
        'Persetujuan ditolak — menampilkan panduan manual. Tidak ada data yang dikirim.',
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

    await createDraftWithSummary(page)
    const trigger = page.getByRole('button', { name: 'Poles teks dengan AI Ringkasan' })
    await trigger.scrollIntoViewIfNeeded()
    await trigger.focus()
    await page.keyboard.press('Enter')
    const generate = page.getByRole('button', { name: 'Minta polesan' })
    await expect(generate).toBeVisible()

    // Escape only reaches the panel handler from inside the panel.
    await generate.focus()
    await page.keyboard.press('Escape')
    await expect(generate).toBeHidden()
    await expect(page.getByRole('textbox', { name: 'Ringkasan' })).toHaveValue(RAW_TEXT)
  })
})
