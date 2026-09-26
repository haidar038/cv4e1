import { AxeBuilder } from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import type { Result } from 'axe-core'

/**
 * Interface-language gates (T3c, FR-701–FR-704, ADR-0012).
 *
 * The LocaleSwitcher is global chrome: it works with no draft open, swaps the
 * whole microcopy pack without a reload, persists a small localStorage
 * preference (never resume content), and never touches `ResumeDocument`.
 * Spec files keep their names — traceability refers to these paths.
 */

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

/** Readable failure output: axe's raw object is unreadable in CI logs. */
function violationsReport(violations: Result[]): string {
  return violations
    .map(
      (violation) =>
        `${violation.id} (${violation.impact ?? 'unknown'}): ${violation.help}\n` +
        violation.nodes.map((node) => `    ${node.target.join(' ')}`).join('\n'),
    )
    .join('\n')
}

async function switchToEnglish(page: Page): Promise<void> {
  // Click the visible label text, not the sr-only input: the span sits above
  // the input in hit-testing (same pattern as mode-switch.spec.ts).
  await page.getByText('Inggris', { exact: true }).click()
  await expect(page.getByRole('radio', { name: 'English' })).toBeChecked()
}

test('Indonesian is the default with Indonesia checked', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('group', { name: 'Bahasa antarmuka' })).toBeVisible()
  await expect(page.getByRole('radio', { name: 'Indonesia' })).toBeChecked()
  await expect(page.getByRole('heading', { name: 'CV saya' })).toBeVisible()
})

test('switching to English flips the interface and hides Indonesian guidance', async ({ page }) => {
  await page.goto('/')
  await switchToEnglish(page)

  // Structural labels come from the EN pack (FR-702).
  await expect(page.getByRole('group', { name: 'Interface language' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'My CVs' })).toBeVisible()
  await expect(page.getByText('No CV stored yet.')).toBeVisible()
  // Indonesia-specific strings are gone, not translated (FR-204/AC-702-a).
  await expect(page.getByText('Belum ada CV tersimpan.')).toHaveCount(0)
  // The page language follows for screen-reader pronunciation.
  expect(await page.evaluate(() => document.documentElement.lang)).toBe('en')
})

test('switching back restores the full Indonesian interface', async ({ page }) => {
  await page.goto('/')
  await switchToEnglish(page)
  await page.getByText('Indonesian', { exact: true }).click()

  await expect(page.getByRole('radio', { name: 'Indonesia' })).toBeChecked()
  await expect(page.getByRole('group', { name: 'Bahasa antarmuka' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.lang)).toBe('id')
})

test('the choice persists across a reload (AC-701-b)', async ({ page }) => {
  await page.goto('/')
  await switchToEnglish(page)
  expect(await page.evaluate(() => localStorage.getItem('cv4every1:locale'))).toBe('en')

  await page.reload()
  await expect(page.getByRole('radio', { name: 'English' })).toBeChecked()
  await expect(page.getByRole('group', { name: 'Interface language' })).toBeVisible()
})

test('the switch is announced and keyboard-operable without losing focus', async ({ page }) => {
  await page.goto('/')

  const indonesian = page.getByRole('radio', { name: 'Indonesia' })
  await indonesian.focus()
  await expect(indonesian).toBeFocused()
  await page.keyboard.press('ArrowRight')

  const english = page.getByRole('radio', { name: 'English' })
  await expect(english).toBeChecked()
  await expect(english).toBeFocused()
  await expect(
    page.locator('p[role="status"]', { hasText: 'English language active' }),
  ).toBeAttached()
})

test('switching works with the network cut and makes no off-origin request', async ({
  page,
  context,
}) => {
  const ORIGIN = 'http://127.0.0.1:4173'
  const offOrigin: string[] = []
  page.on('request', (request) => {
    const url = request.url()
    if (url.startsWith('blob:') || url.startsWith('data:')) return
    if (!url.startsWith(ORIGIN)) offOrigin.push(url)
  })

  await page.goto('/')
  await context.setOffline(true)

  // Both packs ride the app shell — no lazy chunk, no fetch, no egress.
  await switchToEnglish(page)
  await expect(page.getByRole('heading', { name: 'My CVs' })).toBeVisible()
  await page.getByText('Indonesian', { exact: true }).click()
  await expect(page.getByRole('heading', { name: 'CV saya' })).toBeVisible()

  expect(offOrigin).toEqual([])
})

test('the English page passes the WCAG 2.2 AA audit', async ({ page }) => {
  await page.goto('/')
  await switchToEnglish(page)
  await expect(page.locator('#root')).not.toBeEmpty()

  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  const report = violationsReport(results.violations)
  expect(report, report).toBe('')
  expect(results.passes.length, 'axe evaluated no rules').toBeGreaterThan(0)
})

/**
 * F4g bilingual CV content (FR-701–704 family, ADR-0012).
 *
 * The rendered CV follows the *document* locale, not the live interface:
 * a draft created while the UI is English carries meta.locale 'en' and
 * renders English headings/labels. Switching the interface back never
 * rewrites the document — the English CV keeps English headings under an
 * Indonesian UI.
 */
test('a CV created in English renders English headings and labels (F4g)', async ({ page }) => {
  await page.goto('/')
  await switchToEnglish(page)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')

  await page.getByRole('button', { name: 'Create my first CV' }).click()
  await page.getByRole('button', { name: 'Education', exact: true }).click()
  await page.getByRole('button', { name: 'Add Education' }).click()
  await page.getByLabel('Institution name').fill('Contoh University')
  await page.getByLabel('Education status').selectOption('graduated')

  const preview = page.locator('#cv-preview')
  await expect(preview.getByRole('heading', { name: 'EDUCATION' })).toBeVisible({
    timeout: 15_000,
  })
  await expect(preview).toContainText('Graduated')
  await expect(preview).not.toContainText('PENDIDIKAN')

  await page.getByText('Indonesian', { exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'id')
  await expect(preview.getByRole('heading', { name: 'EDUCATION' })).toBeVisible()
  await expect(preview).not.toContainText('PENDIDIKAN')
})
