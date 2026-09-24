import { expect, test, type Page } from '@playwright/test'

/**
 * Achievement flow end-to-end (unified action, FR-401/402/403, AC-401-a/b,
 * AC-403-a).
 *
 * Runs against the production build — the regression gate for the
 * React-Compiler class of bug (Task 18 incident: stale state in production
 * while jsdom stays green). The Groq endpoint is route-mocked, so no real
 * network ever leaves the harness; the mock payload is grounded in the
 * typed description (numbers and capitalised words all come from it).
 *
 * Unlike the per-row generator, candidates here are APPENDED as new rows:
 * state is locked by post-operation counts (row textboxes, Apply buttons),
 * not visibility alone. The mock returns 2 suggestions (static returns 3).
 */

const DESCRIPTION = 'membuat PRD dan SRS untuk aplikasi rindang bersama 2 teman'

function groundedMockBody(): string {
  return JSON.stringify({
    suggestions: [
      {
        text: 'Membuat PRD dan SRS bersama 2 teman untuk aplikasi rindang.',
        actionVerb: 'Membuat',
        usesPlaceholder: false,
        rationale: 'Membuat PRD dan SRS bersama 2 teman.',
        warnings: [],
      },
      {
        text: 'Membuat PRD untuk aplikasi rindang bersama 2 teman.',
        actionVerb: 'Membuat',
        usesPlaceholder: false,
        rationale: 'Membuat PRD untuk aplikasi rindang.',
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
  await row.fill('Baris lama.')
  await expect(row).toHaveValue('Baris lama.')
}

async function openAchievement(page: Page): Promise<void> {
  const trigger = page.getByRole('button', { name: 'Susun bullet dengan AI Pengalaman' })
  await trigger.scrollIntoViewIfNeeded()
  await trigger.click()
  await expect(page.getByRole('button', { name: 'Susun bullet', exact: true })).toBeVisible()
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

async function fillDescription(page: Page): Promise<void> {
  const box = page.getByRole('textbox', { name: 'Deskripsi pencapaian' })
  await box.scrollIntoViewIfNeeded()
  await box.fill(DESCRIPTION)
  await expect(box).toHaveValue(DESCRIPTION)
}

test.describe('achievement flow', () => {
  test('AI path: consent gates the send, Apply appends a new row', async ({ page }) => {
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
    await openAchievement(page)
    await fillDescription(page)

    const generate = page.getByRole('button', { name: 'Susun bullet', exact: true })
    await generate.scrollIntoViewIfNeeded()
    await generate.click()

    // First send requires the full consent dialog — nothing sent yet.
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    expect(groqCalls).toBe(0)

    await page.getByRole('button', { name: 'Setuju dan kirim' }).click()
    // The mock returns 2 suggestions, static returns 3 — the count proves
    // the granted request (not the pre-grant fallback) produced this list.
    const applyButtons = page.getByRole('button', { name: /Terapkan Saran \d/ })
    await expect(applyButtons).toHaveCount(2, { timeout: 15_000 })
    expect(groqCalls).toBe(1)

    // The AI provenance banner names the list for review.
    await expect(
      page.getByText(
        'Daftar ini dibuat AI — tinjau kembali sebelum menerapkan. AI dapat membuat kesalahan.',
      ),
    ).toBeVisible()

    // AC-401-a: candidates on screen, the existing row untouched, no new row yet.
    await expect(page.getByRole('textbox', { name: 'Poin pencapaian 1' })).toHaveValue(
      'Baris lama.',
    )
    await expect(page.getByRole('textbox', { name: 'Poin pencapaian 2' })).toBeHidden()

    // AC-401-b: Apply appends exactly the approved text as a new row.
    const applyFirst = page.getByRole('button', { name: 'Terapkan Saran 1' })
    await applyFirst.scrollIntoViewIfNeeded()
    await applyFirst.click()
    const newRow = page.getByRole('textbox', { name: 'Poin pencapaian 2' })
    await expect(newRow).toHaveValue('Membuat PRD dan SRS bersama 2 teman untuk aplikasi rindang.')
    // The applied candidate leaves the list; the other one stays applicable.
    await expect(page.getByRole('button', { name: 'Terapkan Saran 1' })).toBeHidden()
    await expect(page.getByRole('button', { name: 'Terapkan Saran 2' })).toBeVisible()
  })

  test('fallback path without a key: static suggestions append end-to-end', async ({ page }) => {
    let groqCalls = 0
    await page.route('**/api.groq.com/**', async (route) => {
      groqCalls += 1
      await route.abort()
    })

    await createDraftWithBullet(page)
    await openAchievement(page)
    await fillDescription(page)

    const generate = page.getByRole('button', { name: 'Susun bullet', exact: true })
    await generate.scrollIntoViewIfNeeded()
    await generate.click()

    // AC-403-a: usable non-AI output, no dialog, zero requests, no banner.
    // Verb-leading input takes the no-prefix path (T-C): exactly 1 static
    // candidate carrying the description verbatim.
    await expect(page.getByRole('button', { name: /Terapkan Saran \d/ })).toHaveCount(1)
    await expect(
      page.getByText('Belum ada kunci — menampilkan saran manual yang tetap bisa dipakai.'),
    ).toBeVisible()
    await expect(
      page.getByText(
        'Daftar ini dibuat AI — tinjau kembali sebelum menerapkan. AI dapat membuat kesalahan.',
      ),
    ).toBeHidden()
    expect(groqCalls).toBe(0)

    // No static rewrite of verb-leading input (T-C): the raw task returns
    // unprefixed, so the first candidate carries the description verbatim.
    const applyFirst = page.getByRole('button', { name: 'Terapkan Saran 1' })
    await applyFirst.scrollIntoViewIfNeeded()
    await applyFirst.click()
    const newRow = page.getByRole('textbox', { name: 'Poin pencapaian 2' })
    await expect(newRow).toHaveValue(`${DESCRIPTION} [dampak yang dapat diukur]`)
  })

  test('declining consent sends nothing and falls back to static', async ({ page }) => {
    let groqCalls = 0
    await page.route('**/api.groq.com/**', async (route) => {
      groqCalls += 1
      await route.abort()
    })

    await createDraftWithBullet(page)
    await saveGroqKey(page)
    await openAchievement(page)
    await fillDescription(page)

    const generate = page.getByRole('button', { name: 'Susun bullet', exact: true })
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
    const trigger = page.getByRole('button', { name: 'Susun bullet dengan AI Pengalaman' })
    await trigger.scrollIntoViewIfNeeded()
    await trigger.focus()
    await page.keyboard.press('Enter')
    const generate = page.getByRole('button', { name: 'Susun bullet', exact: true })
    await expect(generate).toBeVisible()

    // A filled description enables the button so it can take focus.
    await fillDescription(page)

    // Escape only reaches the panel handler from inside the panel.
    await generate.focus()
    await page.keyboard.press('Escape')
    await expect(generate).toBeHidden()
    await expect(page.getByRole('textbox', { name: 'Poin pencapaian 1' })).toHaveValue(
      'Baris lama.',
    )
    await expect(page.getByRole('textbox', { name: 'Poin pencapaian 2' })).toBeHidden()
  })
})
