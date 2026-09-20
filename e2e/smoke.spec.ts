import { expect, test } from '@playwright/test'

/**
 * Smoke test for the app shell served by `vite preview` from the production
 * build (ADR-0007: preview and PDF share one codepath, so this is the surface
 * the later print tests build on).
 *
 * Deliberately shell-agnostic: it must stay green through Task 8, when the
 * Hello-World placeholder is replaced by the real workspace shell.
 * Feature-specific behaviour belongs in dedicated specs.
 */
test('app shell loads cleanly', async ({ page }) => {
  const consoleErrors: string[] = []
  const pageErrors: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => {
    pageErrors.push(error.message)
  })

  await page.goto('/')

  await expect(page.locator('#root')).not.toBeEmpty()

  // Product title (index.html); the full-page audit in a11y.spec.ts also asserts
  // it together with `html lang="id"`.
  await expect(page).toHaveTitle('cv4every1')

  expect(consoleErrors).toEqual([])
  expect(pageErrors).toEqual([])
})
