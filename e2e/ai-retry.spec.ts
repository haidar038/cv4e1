import { expect, test, type Page } from '@playwright/test'

/**
 * Retry policy end-to-end (Task 21, FR-403/406/408).
 *
 * Runs against the production build — the regression gate for the
 * React-Compiler class of bug (Task 18 incident: stale state in production
 * while jsdom stays green). The Groq endpoint is route-mocked, so no real
 * network ever leaves the harness; mock payloads are grounded in the typed
 * input. State is locked by post-operation counts, not visibility alone:
 * the mock returns 2 bullet suggestions (static returns 3), and polish
 * success carries an Apply button (static guidance has none).
 */

const RAW_TASK = 'membantu menyusun laporan untuk 30 peserta'
const RAW_TEXT = 'membantu menyusun laporan untuk 30 peserta'
const POLISHED_TEXT = 'Membantu menyusun laporan untuk 30 peserta.'

function groundedBulletBody(): string {
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

function groundedPolishBody(): string {
  return JSON.stringify({
    text: POLISHED_TEXT,
    changes: ['Memperbaiki kapitalisasi awal kalimat.'],
    warnings: [],
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

async function createDraftWithSummary(page: Page): Promise<void> {
  await page.goto('/')
  await page.getByRole('button', { name: 'Buat CV pertama' }).click()
  await page.getByRole('button', { name: 'Data Diri', exact: true }).click()
  const summary = page.getByRole('textbox', { name: 'Ringkasan' })
  await summary.scrollIntoViewIfNeeded()
  await summary.fill(RAW_TEXT)
  await expect(summary).toHaveValue(RAW_TEXT)
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

async function consentAndSend(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await page.getByRole('button', { name: 'Setuju dan kirim' }).click()
}

test.describe('retry policy', () => {
  test('bullets: one 429 then success — the retry wins, Apply lands the candidate', async ({
    page,
  }) => {
    let groqCalls = 0
    await page.route('**/api.groq.com/**', async (route) => {
      groqCalls += 1
      if (groqCalls === 1) {
        // First attempt hits the quota wall with no Retry-After hint, so
        // the bounded backoff (~1s) applies before the retry succeeds.
        await route.fulfill({ status: 429, contentType: 'application/json', body: '{}' })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: groqEnvelope(groundedBulletBody()),
        })
      }
    })

    await createDraftWithBullet(page)
    await saveGroqKey(page)

    const trigger = page.getByRole('button', {
      name: 'Saran bullet AI Pengalaman Poin pencapaian 1',
    })
    await trigger.scrollIntoViewIfNeeded()
    await trigger.click()
    const generate = page.getByRole('button', { name: 'Minta saran' })
    await generate.scrollIntoViewIfNeeded()
    await generate.click()
    await consentAndSend(page)

    // The mock returns 2 suggestions, static returns 3 — the count proves
    // the retry (not the fallback) produced this list. The bounded backoff
    // adds ~1s on top of the consent flow, so this gate gets headroom.
    const applyButtons = page.getByRole('button', { name: /Terapkan Saran \d/ })
    await expect(applyButtons).toHaveCount(2, { timeout: 15_000 })
    expect(groqCalls).toBe(2)
    await expect(page.getByRole('textbox', { name: 'Poin pencapaian 1' })).toHaveValue(RAW_TASK)

    const applyFirst = page.getByRole('button', { name: 'Terapkan Saran 1' })
    await applyFirst.scrollIntoViewIfNeeded()
    await applyFirst.click()
    await expect(page.getByRole('textbox', { name: 'Poin pencapaian 1' })).toHaveValue(
      'Menyusun laporan untuk 30 peserta [dampak yang dapat diukur].',
    )
  })

  test('bullets: persistent 429 names the quota and falls back to static', async ({ page }) => {
    let groqCalls = 0
    await page.route('**/api.groq.com/**', async (route) => {
      groqCalls += 1
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        headers: { 'Retry-After': '0' },
        body: '{}',
      })
    })

    await createDraftWithBullet(page)
    await saveGroqKey(page)

    const trigger = page.getByRole('button', {
      name: 'Saran bullet AI Pengalaman Poin pencapaian 1',
    })
    await trigger.scrollIntoViewIfNeeded()
    await trigger.click()
    const generate = page.getByRole('button', { name: 'Minta saran' })
    await generate.scrollIntoViewIfNeeded()
    await generate.click()
    await consentAndSend(page)

    // Bounded attempts (1 + 2 retries), then the FR-408 quota note with
    // usable static output — the draft untouched throughout.
    await expect(
      page.getByText(
        'Batas pemakaian AI tercapai — menampilkan saran manual. Draft Anda tidak berubah; coba lagi nanti.',
      ),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /Terapkan Saran \d/ })).toHaveCount(3)
    expect(groqCalls).toBe(3)
    await expect(page.getByRole('textbox', { name: 'Poin pencapaian 1' })).toHaveValue(RAW_TASK)
  })

  test('polish: one 429 then success — the retry wins, Apply lands the candidate', async ({
    page,
  }) => {
    let groqCalls = 0
    await page.route('**/api.groq.com/**', async (route) => {
      groqCalls += 1
      if (groqCalls === 1) {
        await route.fulfill({ status: 429, contentType: 'application/json', body: '{}' })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: groqEnvelope(groundedPolishBody()),
        })
      }
    })

    await createDraftWithSummary(page)
    await saveGroqKey(page)

    const trigger = page.getByRole('button', { name: 'Poles teks dengan AI Ringkasan' })
    await trigger.scrollIntoViewIfNeeded()
    await trigger.click()
    const generate = page.getByRole('button', { name: 'Minta polesan' })
    await generate.scrollIntoViewIfNeeded()
    await generate.click()
    await consentAndSend(page)

    // The Apply button proves the retry (not static guidance) produced
    // this candidate — static guidance offers no Apply. Headroom covers
    // the bounded backoff on loaded machines.
    const apply = page.getByRole('button', { name: 'Terapkan Ringkasan' })
    await expect(apply).toBeVisible({ timeout: 15_000 })
    expect(groqCalls).toBe(2)
    await expect(page.getByRole('textbox', { name: 'Ringkasan' })).toHaveValue(RAW_TEXT)

    await apply.scrollIntoViewIfNeeded()
    await apply.click()
    await expect(page.getByRole('textbox', { name: 'Ringkasan' })).toHaveValue(POLISHED_TEXT)
  })
})
