import { describe, expect, it } from 'vitest'
import {
  extractPdfText,
  joinTextItems,
  PdfTextError,
  type PdfJsApi,
} from './pdf-text'

/**
 * Builds a minimal valid PDF in memory (no fixture file): objects are
 * emitted in numeric order while recording byte offsets for a correct xref.
 * Text avoids parentheses (unescaped in content streams by design).
 */
function buildPdf(pages: { text: string | null }[]): Uint8Array {
  const enc = new TextEncoder()
  const bodies = new Map<number, string | { header: string; stream: Uint8Array }>()
  const pageNums: number[] = []
  const contentOf = new Map<number, number>()
  let next = 4
  pages.forEach((page) => {
    const pageObj = next
    next += 1
    pageNums.push(pageObj)
    if (page.text !== null) {
      contentOf.set(pageObj, next)
      next += 1
    }
  })
  bodies.set(1, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
  bodies.set(2, '<< /Type /Catalog /Pages 3 0 R >>')
  bodies.set(
    3,
    `<< /Type /Pages /Kids [${pageNums.map((n) => `${n} 0 R`).join(' ')}] /Count ${pageNums.length} >>`,
  )
  pages.forEach((page, index) => {
    const pageObj = pageNums[index]
    if (pageObj === undefined) return
    const contentObj = contentOf.get(pageObj)
    bodies.set(
      pageObj,
      `<< /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 1 0 R >> >>${contentObj !== undefined ? ` /Contents ${contentObj} 0 R` : ''} >>`,
    )
    if (page.text !== null && contentObj !== undefined) {
      const stream = enc.encode(`BT /F1 12 Tf 72 720 Td (${page.text}) Tj ET`)
      bodies.set(contentObj, { header: `<< /Length ${stream.length} >>`, stream })
    }
  })
  const out: number[] = []
  const pushBytes = (bytes: Uint8Array): void => {
    for (const b of bytes) out.push(b)
  }
  const pushStr = (s: string): void => pushBytes(enc.encode(s))
  pushStr('%PDF-1.4\n')
  const offsets = new Map<number, number>()
  const maxObj = Math.max(...bodies.keys())
  for (let num = 1; num <= maxObj; num += 1) {
    const body = bodies.get(num)
    if (body === undefined) continue
    offsets.set(num, out.length)
    pushStr(`${num} 0 obj\n`)
    if (typeof body === 'string') {
      pushStr(`${body}\nendobj\n`)
    } else {
      pushStr(`${body.header}\nstream\n`)
      pushBytes(body.stream)
      pushStr('\nendstream\nendobj\n')
    }
  }
  const xrefAt = out.length
  pushStr(`xref\n0 ${maxObj + 1}\n0000000000 65535 f \n`)
  for (let num = 1; num <= maxObj; num += 1) {
    const at = offsets.get(num)
    pushStr(at === undefined ? '0000000000 00000 f \n' : `${String(at).padStart(10, '0')} 00000 n \n`)
  }
  pushStr(`trailer\n<< /Size ${maxObj + 1} /Root 2 0 R >>\nstartxref\n${xrefAt}\n%%EOF`)
  return new Uint8Array(out)
}

function fakeLoader(pages: { text: string | null }[]): () => Promise<PdfJsApi> {
  return async () => ({
    getDocument: () => ({
      promise: Promise.resolve({
        numPages: pages.length,
        getPage: (n: number) =>
          Promise.resolve({
            getTextContent: () =>
              Promise.resolve({
                items: pages[n - 1]?.text === null ? [] : [{ str: pages[n - 1]?.text ?? '' }],
              }),
            render: () => ({ promise: Promise.resolve() }),
            getViewport: () => ({ width: 10, height: 10 }),
          }),
      }),
    }),
  })
}

describe('extractPdfText (T3a)', () => {
  it('empty bytes throw EMPTY_FILE without touching the engine', async () => {
    await expect(extractPdfText(new Uint8Array(0), { loader: fakeLoader([{ text: 'x' }]) }))
      .rejects.toMatchObject({ reason: 'EMPTY_FILE' })
  })

  it('real engine: hand-built PDF parses without seams', async () => {
    const result = await extractPdfText(buildPdf([{ text: 'Contoh Nama Fiktif' }]))
    expect(result.text).toContain('Contoh Nama Fiktif')
    expect(result.pageCount).toBe(1)
  })

  it('real engine: garbage bytes throw PARSE_FAILED', async () => {
    await expect(
      extractPdfText(new TextEncoder().encode('bukan pdf sama sekali')),
    ).rejects.toMatchObject({ reason: 'PARSE_FAILED' })
  })

  it('joins text across pages', async () => {
    const result = await extractPdfText(new Uint8Array([1, 2, 3]), {
      loader: fakeLoader([{ text: 'Contoh Nama' }, { text: 'Fiktif' }]),
    })
    expect(result.text).toBe('Contoh Nama\nFiktif')
    expect(result.pageCount).toBe(2)
  })

  it('empty layers throw NO_TEXT_LAYER (the OCR fallback trigger)', async () => {
    await expect(
      extractPdfText(new Uint8Array([1]), { loader: fakeLoader([{ text: null }]) }),
    ).rejects.toMatchObject({ reason: 'NO_TEXT_LAYER' })
  })

  it('more pages than the cap throws TOO_MANY_PAGES', async () => {
    const pages = Array.from({ length: 6 }, () => ({ text: 'x' }))
    await expect(
      extractPdfText(new Uint8Array([1]), { loader: fakeLoader(pages), maxPages: 5 }),
    ).rejects.toMatchObject({ reason: 'TOO_MANY_PAGES' })
  })

  it('engine failures throw PARSE_FAILED, never partial text', async () => {
    await expect(
      extractPdfText(new Uint8Array([1]), {
        loader: async () => {
          throw new Error('nope')
        },
      }),
    ).rejects.toMatchObject({ reason: 'PARSE_FAILED' })
    await expect(
      extractPdfText(new Uint8Array([1, 2]), {
        loader: async () => ({
          getDocument: () => ({
            promise: Promise.reject(new Error('corrupt')),
          }),
        }),
      }),
    ).rejects.toMatchObject({ reason: 'PARSE_FAILED' })
  })

  it('PdfTextError carries its reason', () => {
    expect(new PdfTextError('EMPTY_FILE')).toMatchObject({ name: 'PdfTextError', reason: 'EMPTY_FILE' })
  })

  it('joinTextItems restores line breaks from hasEOL geometry', () => {
    expect(
      joinTextItems([
        { str: 'Contoh Nama', hasEOL: true },
        { str: 'PENDIDIKAN', hasEOL: true },
        { str: 'Terakhir', hasEOL: false },
      ]),
    ).toBe('Contoh Nama\nPENDIDIKAN\nTerakhir')
    expect(joinTextItems([{ str: 'a' }, { str: 'b' }])).toBe('a b')
    expect(joinTextItems([])).toBe('')
  })
})
