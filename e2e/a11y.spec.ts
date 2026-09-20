// Named import: under this repo's CJS-interop settings the default export
// resolves to the module namespace and is not constructable.
import { AxeBuilder } from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import type { Result } from 'axe-core'

/**
 * Full-page accessibility audit (NFR-007, accessibility-plan.md §5).
 *
 * The jsdom suite already audits every component with axe, but jsdom cannot
 * judge what needs real layout: `color-contrast` comes back as "incomplete",
 * and page-level rules (document title, `html` lang, a single main landmark)
 * cannot be judged on an isolated fragment. This spec closes exactly that gap
 * by auditing the real, production build in a real browser at a real viewport.
 *
 * WCAG-only tags on purpose: the `best-practice` ruleset flags things that are
 * not part of the promise we make (and depend on the shadcn scaffold), while the
 * wcag2a, wcag2aa, wcag21a, wcag21aa and wcag22aa tag set is exactly the
 * "WCAG 2.2 AA" target.
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

async function audit(page: Page) {
  return new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
}

async function expectNoViolations(page: Page): Promise<void> {
  const results = await audit(page)
  const report = violationsReport(results.violations)
  expect(report, report).toBe('')
  // Guards against a silently empty audit: there must be rules that actually
  // passed, and color-contrast specifically must have been evaluated rather than
  // reported as "incomplete" — that is the whole reason this spec exists, since
  // jsdom can only ever return "incomplete" for it.
  expect(results.passes.length, 'axe evaluated no rules').toBeGreaterThan(0)
  expect(
    results.passes.some((rule) => rule.id === 'color-contrast'),
    'color-contrast was not evaluated — this audit would prove nothing',
  ).toBe(true)
}

test.describe('full-page WCAG 2.2 AA audit', () => {
  test('empty state (page-level rules included)', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#root')).not.toBeEmpty()

    // Asserted explicitly because these are exactly what an isolated jsdom
    // fragment cannot answer.
    expect(await page.title()).toBe('cv4every1')
    await expect(page.locator('html')).toHaveAttribute('lang', 'id')
    await expect(page.getByRole('main')).toHaveCount(1)

    await expectNoViolations(page)
  })

  test.describe('mobile', () => {
    test.use({ viewport: { width: 360, height: 740 } })

    test('guided form with a draft open at 360 px', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('button', { name: 'Buat CV pertama' }).click()
      // Open the education section so real fields, hints, status picker and the
      // autosave indicator are in the audited tree at mobile width.
      // `exact` matters: the section reorder controls carry names like
      // "Turunkan Pendidikan", which would otherwise match by substring.
      const educationSection = page.getByRole('button', { name: 'Pendidikan', exact: true })
      await educationSection.click()
      await expect(educationSection).toHaveAttribute('aria-expanded', 'true')

      await expectNoViolations(page)
    })

    test('action verb suggestions panel at 360 px', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('button', { name: 'Buat CV pertama' }).click()
      await page.getByRole('button', { name: 'Pengalaman', exact: true }).click()
      await page.getByRole('button', { name: 'Tambah Pengalaman', exact: true }).click()
      await page.getByRole('button', { name: 'Tambah Poin pencapaian', exact: true }).click()
      const trigger = page.getByRole('button', {
        name: 'Saran kata kerja Pengalaman Poin pencapaian 1',
      })
      await trigger.click()
      await expect(trigger).toHaveAttribute('aria-expanded', 'true')
      const panel = page.getByRole('group', { name: 'Saran kata kerja' })
      await expect(panel).toBeVisible()

      // The unfolded panel is part of the audited tree — its muted pattern
      // text is exactly what needs real layout to judge color-contrast.
      await expectNoViolations(page)

      // And the open panel must stay inside the narrow viewport.
      const box = await panel.boundingBox()
      expect(box, 'panel should be rendered').toBeTruthy()
      if (box) {
        expect(box.x).toBeGreaterThanOrEqual(0)
        expect(box.x + box.width).toBeLessThanOrEqual(360)
      }
    })
  })
})
