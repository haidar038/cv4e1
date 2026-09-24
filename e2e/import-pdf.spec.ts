import { expect, test, type Page } from '@playwright/test'

/**
 * PDF import end-to-end (T3a, FR-501/AC-501-a, FR-502/AC-502-a).
 *
 * Runs against the production build with the REAL pdf.js chunk (no mocks):
 * a hand-built one-page PDF is uploaded through the drafts panel, reviewed,
 * and approved into a new draft. The OCR path stays out of e2e (multi-MB
 * downloads, proven by spike T3a + unit seams + manual runs).
 */

function buildPdfBytes(lines: string[]): Buffer {
  const enc = new TextEncoder()
  // One page; each line is its own text operation (T* = next line).
  const ops = lines
    .map((text, index) =>
      index === 0 ? `BT /F1 12 Tf 12 TL 72 720 Td (${text}) Tj` : `T* (${text}) Tj`,
    )
    .join('\n')
  const stream = enc.encode(`${ops} ET`)
  const objects: Array<[number, string, Uint8Array | null]> = [
    [1, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', null],
    [2, '<< /Type /Catalog /Pages 3 0 R >>', null],
    [3, '<< /Type /Pages /Kids [4 0 R] /Count 1 >>', null],
    [
      4,
      '<< /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 1 0 R >> >> /Contents 5 0 R >>',
      null,
    ],
    [5, `<< /Length ${stream.length} >>`, stream],
  ]
  const out: number[] = []
  const pushStr = (s: string): void => {
    for (const b of enc.encode(s)) out.push(b)
  }
  const pushBytes = (b: Uint8Array): void => {
    for (const byte of b) out.push(byte)
  }
  pushStr('%PDF-1.4\n')
  const offsets = new Map<number, number>()
  for (const [num, body, bytes] of objects) {
    offsets.set(num, out.length)
    pushStr(`${num} 0 obj\n`)
    if (bytes === null) {
      pushStr(`${body}\nendobj\n`)
    } else {
      pushStr(`${body}\nstream\n`)
      pushBytes(bytes)
      pushStr('\nendstream\nendobj\n')
    }
  }
  const maxObj = objects.length
  const xrefAt = out.length
  pushStr(`xref\n0 ${maxObj + 1}\n0000000000 65535 f \n`)
  for (let num = 1; num <= maxObj; num += 1) {
    const at = offsets.get(num)
    pushStr(
      at === undefined ? '0000000000 00000 f \n' : `${String(at).padStart(10, '0')} 00000 n \n`,
    )
  }
  pushStr(`trailer\n<< /Size ${maxObj + 1} /Root 2 0 R >>\nstartxref\n${xrefAt}\n%%EOF`)
  return Buffer.from(out)
}

const CV_LINES = [
  'Contoh Nama Fiktif',
  'contoh.fiktif@example.com',
  'PENDIDIKAN',
  'Universitas Contoh Bangsa',
  '2019 - 2023',
  'KEAHLIAN',
  'JavaScript, TypeScript',
]

async function openImportDialog(page: Page): Promise<void> {
  await page.goto('/')
  await page.getByRole('button', { name: 'Buat CV pertama' }).click()
  await openImportDialogForOpenDraft(page)
}

async function openImportDialogForOpenDraft(page: Page): Promise<void> {
  const trigger = page.getByRole('button', { name: 'Impor PDF' })
  await trigger.scrollIntoViewIfNeeded()
  await trigger.click()
  await expect(page.getByText('Impor CV dari PDF')).toBeVisible()
}

async function uploadPdf(page: Page, lines: string[]): Promise<void> {
  const input = page.getByLabel('Pilih berkas PDF')
  await input.setInputFiles({
    name: 'cv-lama.pdf',
    mimeType: 'application/pdf',
    buffer: buildPdfBytes(lines),
  })
}

test.describe('pdf import', () => {
  test('text path: review gates the save, approval opens a new draft', async ({ page }) => {
    await openImportDialog(page)
    await uploadPdf(page, CV_LINES)
    await expect(page.getByText('Tinjau hasil impor')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('Contoh Nama Fiktif')).toBeVisible()
    await expect(page.getByText('Universitas Contoh Bangsa')).toBeVisible()
    // AC-502-a pre-approval proof lives in the dom test (the modal makes the
    // background form inert, so it cannot be queried here by role).
    const approve = page.getByRole('button', { name: 'Simpan sebagai CV baru' })
    await approve.scrollIntoViewIfNeeded()
    await approve.click()
    // The new draft opens; its Basics section carries the imported name.
    await page.getByRole('button', { name: 'Data Diri' }).click()
    await expect(page.getByRole('textbox', { name: 'Nama lengkap' })).toHaveValue(
      'Contoh Nama Fiktif',
      { timeout: 15_000 },
    )
  })

  test('cancel and Escape leave the open draft untouched', async ({ page }) => {
    await openImportDialog(page)
    await uploadPdf(page, CV_LINES)
    await expect(page.getByText('Tinjau hasil impor')).toBeVisible({ timeout: 30_000 })
    await page.getByRole('button', { name: 'Batal' }).click()
    await expect(page.getByText('Impor CV dari PDF')).toBeHidden()
    await page.getByRole('button', { name: 'Data Diri' }).click()
    await expect(page.getByRole('textbox', { name: 'Nama lengkap' })).toHaveValue('')
    // Escape closes the reopened dialog without saving either.
    // A draft already exists, so reopen straight from the drafts panel.
    await openImportDialogForOpenDraft(page)
    await uploadPdf(page, CV_LINES)
    await expect(page.getByText('Tinjau hasil impor')).toBeVisible({ timeout: 30_000 })
    await page.keyboard.press('Escape')
    await expect(page.getByText('Impor CV dari PDF')).toBeHidden()
    await expect(page.getByRole('textbox', { name: 'Nama lengkap' })).toHaveValue('')
  })

  test('non-PDF upload answers with an actionable note', async ({ page }) => {
    await openImportDialog(page)
    const input = page.getByLabel('Pilih berkas PDF')
    await input.setInputFiles({
      name: 'cv.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('bukan pdf'),
    })
    await expect(page.getByRole('alert')).toContainText('bukan PDF')
  })
})
