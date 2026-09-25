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

  test('print controls, help modal, and offline indicator (Task 14 surfaces)', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Buat CV pertama' }).click()
    await page.getByRole('button', { name: 'Data Diri', exact: true }).click()
    await page.getByLabel('Nama lengkap').fill('Budi Santoso')
    await expect(page.locator('#cv-preview .cv-ats')).toBeVisible({ timeout: 15_000 })

    await page.getByRole('button', { name: 'Panduan cetak' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expectNoViolations(page)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Harness honesty: `context.setOffline()` blocks requests but does not
    // deliver the window online/offline events in this setup, so the banner
    // is driven by the real browser signal directly. The component contract
    // is "offline event → live-region banner", which is exactly what a real
    // network loss fires; the offline request-blocking itself is proven by
    // offline.spec.ts.
    await page.evaluate(() => window.dispatchEvent(new Event('offline')))
    // Live regions are queried by role + text, never role + name: both
    // Testing Library (jsdom) and Playwright/Chromium fail to match an
    // accessible *name* from live-region contents (the node reports Name ""
    // to the query engine even with text), while text matching works in both.
    await expect(
      page.getByRole('status').filter({
        hasText: 'Anda sedang offline. Semua perubahan tetap tersimpan di perangkat ini.',
      }),
    ).toBeVisible({ timeout: 15_000 })
    await expectNoViolations(page)
  })

  test('wipe dialog and storage notice surfaces (Task 15)', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Buat CV pertama' }).click()
    await page.getByRole('button', { name: 'Data Diri', exact: true }).click()
    await page.getByLabel('Nama lengkap').fill('Budi Santoso')
    await page.waitForTimeout(3000)
    await expect(page.getByText('Tersimpan').first()).toBeVisible({ timeout: 15_000 })

    // The prominent banner shows only after the first successful save.
    // Live regions are queried by role + text, never role + name (Task 14 rule).
    await expect(
      page.getByRole('status').filter({
        hasText: 'Membersihkan data peramban, mode penyamaran',
      }),
    ).toBeVisible({ timeout: 15_000 })

    await page.getByRole('button', { name: 'Hapus semua data', exact: true }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expectNoViolations(page)
    // The dialog stays open on purpose: the wipe itself belongs to
    // wipe-data.spec.ts — this test only proves the new surfaces are clean.
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

/**
 * F4a — surfaces the original spec never opened (NFR-005, NFR-007).
 *
 * The jsdom suite audits every component with axe, but only a real browser
 * can judge color-contrast and page-level rules. These tests extend that
 * real-browser coverage to the remaining dialogs, the offline tailoring
 * results, the EN locale, the Creative preview, the import-error alert,
 * and a full keyboard-only pass over the core flow.
 */
test.describe('F4a: remaining surfaces', () => {
  test('import PDF dialog opens, audits clean, and closes with Escape', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Impor PDF' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expectNoViolations(page)
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
  })

  test('draft rename and delete dialogs audit clean and close with Escape', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Buat CV pertama' }).click()
    const renameButton = page.getByRole('button', { name: /^Ganti nama / })
    await expect(renameButton).toBeVisible()
    const row = page.locator('li', { has: renameButton })

    await renameButton.click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expectNoViolations(page)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()

    await row.getByRole('button', { name: /^Hapus / }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('Hapus CV ini?')
    await expectNoViolations(page)
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
  })

  test('AI consent dialog audits clean and declining closes it', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Tinjau persetujuan (Groq)' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expectNoViolations(page)
    await page.getByRole('button', { name: 'Tolak' }).click()
    await expect(dialog).not.toBeVisible()
  })

  test('tailoring panel with offline static results audits clean', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Buat CV pertama' }).click()
    await page.getByRole('button', { name: 'Pengalaman', exact: true }).click()
    const addItem = page.getByRole('button', { name: 'Tambah Pengalaman' })
    await addItem.scrollIntoViewIfNeeded()
    await addItem.click()
    const addBullet = page.getByRole('button', { name: 'Tambah Poin pencapaian' })
    await addBullet.scrollIntoViewIfNeeded()
    await addBullet.click()
    await page
      .getByRole('textbox', { name: 'Poin pencapaian 1' })
      .fill('Menyusun laporan Microsoft Excel.')

    const trigger = page.getByRole('button', { name: 'Sesuaikan dengan lowongan Pengalaman' })
    await trigger.scrollIntoViewIfNeeded()
    await trigger.click()
    const box = page.getByRole('textbox', { name: 'Deskripsi lowongan' })
    await box.scrollIntoViewIfNeeded()
    await box.fill('Dicari staf administrasi yang menguasai Microsoft Excel.')
    const generate = page.getByRole('button', { name: 'Analisis kecocokan', exact: true })
    await generate.scrollIntoViewIfNeeded()
    await generate.click()

    // Static fallback (no key): deterministic keyword regions.
    await expect(page.getByRole('region', { name: 'Kata kunci yang didukung data' })).toContainText(
      'excel',
    )
    await expectNoViolations(page)
  })

  test('EN locale switches html lang and the empty state audits clean', async ({ page }) => {
    await page.goto('/')
    // The radios themselves are sr-only; users (and this test) toggle them
    // through the visible labels — clicking the input directly is
    // intercepted by its label span.
    await page.getByText('Inggris', { exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expectNoViolations(page)
    await page.getByText('Indonesian', { exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'id')
  })

  test('creative preview with data audits clean', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Buat CV pertama' }).click()
    await page.getByRole('button', { name: 'Data Diri', exact: true }).click()
    await page.getByLabel('Nama lengkap').fill('Budi Santoso')
    await page.getByText('Creative', { exact: true }).click()
    await expect(page.locator('#cv-preview .cv-creative')).toBeVisible({ timeout: 15_000 })
    await expectNoViolations(page)
  })

  test('malformed JSON import raises an alert and the page audits clean', async ({ page }) => {
    await page.goto('/')
    // Empty state has exactly one file input (the JSON importer); the photo
    // uploader only exists inside an open draft's Data Diri section.
    const fileInput = page.locator('input[type="file"]')
    await expect(fileInput).toHaveCount(1)
    await fileInput.setInputFiles({
      name: 'rusak.cv4e.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{ bukan json'),
    })
    await expect(page.getByRole('alert')).toBeVisible()
    await expectNoViolations(page)
  })

  test('keyboard-only core flow never loses visible focus (NFR-005)', async ({ page }) => {
    await page.goto('/')

    // Sweep the empty-state tab order until it wraps: every stop must exist
    // and be visible — a stop on <body> means focus escaped the page.
    const seen: string[] = []
    for (let i = 0; i < 40; i += 1) {
      await page.keyboard.press('Tab')
      const id = await page.evaluate(() => {
        const el = document.activeElement
        if (el === null) return 'NONE'
        if (el === document.body) return 'BODY'
        return `${el.tagName}|${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 40)}`
      })
      if (id === 'BODY' || id === 'NONE' || seen.includes(id)) break
      seen.push(id)
      await expect(page.locator(':focus'), `tab stop ${id} is not visible`).toBeVisible()
    }
    expect(seen.length, 'no keyboard stops found on the empty state').toBeGreaterThan(3)

    // Full keyboard path without a mouse: create → fill → print help →
    // close, with focus trapped in the dialog and returned to the trigger.
    const create = page.getByRole('button', { name: 'Buat CV pertama' })
    await create.focus()
    await page.keyboard.press('Enter')
    const dataDiri = page.getByRole('button', { name: 'Data Diri', exact: true })
    await expect(dataDiri).toBeVisible()
    await dataDiri.focus()
    await page.keyboard.press('Enter')
    await expect(dataDiri).toHaveAttribute('aria-expanded', 'true')

    const nameBox = page.getByLabel('Nama lengkap')
    await nameBox.focus()
    await nameBox.pressSequentially('Budi Santoso')
    await expect(page.locator('#cv-preview .cv-ats')).toBeVisible({ timeout: 15_000 })

    const help = page.getByRole('button', { name: 'Panduan cetak' })
    await help.focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    const inside = await dialog.evaluate((node) => node.contains(document.activeElement))
    expect(inside, 'focus did not move inside the dialog').toBe(true)
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
    await expect(help, 'focus did not return to the trigger').toBeFocused()
  })
})
