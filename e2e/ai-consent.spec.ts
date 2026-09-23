import { expect, test } from '@playwright/test'

/**
 * AI consent gate proven in a real browser (Task 18, AC-402-a, FR-407/408).
 *
 * No provider call exists yet (triggers arrive in Task 19), so these specs
 * prove the two browser-observable halves: declining sends nothing, and keys
 * live in tab memory only. All assertions run against route counters — no
 * real network ever leaves the harness.
 */

test.describe('AI consent gate', () => {
  test('declining the review dialog sends zero requests', async ({ page }) => {
    let groqCalls = 0
    await page.route('**/api.groq.com/**', async (route) => {
      groqCalls += 1
      await route.abort()
    })
    await page.goto('/')

    await page.getByRole('button', { name: 'Tinjau persetujuan (Groq)' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Groq')).toBeVisible()
    await page.getByRole('button', { name: 'Tolak' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()

    expect(groqCalls).toBe(0)
  })

  test('a saved key works for the session and vanishes on reload', async ({ page }) => {
    let groqCalls = 0
    await page.route('**/api.groq.com/**', async (route) => {
      groqCalls += 1
      await route.abort()
    })
    await page.goto('/')

    // FR-408: the unconfigured reason is visible before any key exists.
    await expect(page.getByText('Belum ada kunci — fitur AI nonaktif.').first()).toBeVisible()

    await page.getByLabel('Kunci API').first().click()
    await page.getByLabel('Kunci API').first().pressSequentially('gsk-e2e-fake-key')
    await expect(page.getByLabel('Kunci API').first()).toHaveValue('gsk-e2e-fake-key')
    await page.getByRole('button', { name: 'Simpan di sesi ini' }).first().click()
    await expect(page.getByText('Kunci tersimpan di sesi ini.').first()).toBeVisible()

    // Session memory, proven by a real reload: the draft survives IndexedDB,
    // the key does not survive the tab.
    await page.reload()
    await expect(page.getByText('Belum ada kunci — fitur AI nonaktif.').first()).toBeVisible()

    expect(groqCalls).toBe(0)
  })
})
