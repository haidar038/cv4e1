import { describe, expect, it } from 'vitest'
import { documentStore } from '../store/document-store'
import { ImportPdfError, runPdfImport } from './import-pipeline'
import { OcrError } from './ocr-text'
import type { PdfDocumentHandle } from './pdf-text'

const SAMPLE_TEXT = `Contoh Nama Fiktif
contoh.fiktif@example.com

PENDIDIKAN
Universitas Contoh Bangsa
2019 – 2023

KEAHLIAN
JavaScript, TypeScript`;

function fakeFile(name: string, type: string, size: number, bytes: Uint8Array): File {
  const file = new File([bytes as unknown as BlobPart], name, { type })
  if (file.size !== size) {
    Object.defineProperty(file, 'size', { value: size })
  }
  return file
}

function fakeDoc(text: string, pageCount = 1): PdfDocumentHandle {
  return {
    pageCount,
    getPage: async () => ({
      getTextContent: async () => ({ items: [{ str: text }] }),
      render: () => ({ promise: Promise.resolve() }),
      getViewport: () => ({ width: 100, height: 100 }),
    }),
  }
}

const TEXT_DEPS = { openPdf: async () => fakeDoc(SAMPLE_TEXT) }

describe('runPdfImport (T3a, FR-501/FR-502)', () => {
  it('rejects non-PDF files before parsing (import-export-spec §6)', async () => {
    const file = fakeFile('cv.txt', 'text/plain', 10, new Uint8Array([1, 2, 3]))
    await expect(runPdfImport(file, undefined, TEXT_DEPS)).rejects.toMatchObject({
      reason: 'NOT_PDF',
    })
  })

  it('rejects oversized files pre-parse (AB-1, ADR-0008 10 MB cap)', async () => {
    const file = fakeFile('cv.pdf', 'application/pdf', 10 * 1024 * 1024 + 1, new Uint8Array([1]))
    await expect(runPdfImport(file, undefined, TEXT_DEPS)).rejects.toMatchObject({
      reason: 'TOO_LARGE',
    })
  })

  it('AC-501-a/502-a: resolves a reviewable candidate without touching any store', async () => {
    const before = documentStore.getState().document
    const file = fakeFile('cv.pdf', 'application/pdf', 100, new Uint8Array([1, 2, 3]))
    const candidate = await runPdfImport(file, undefined, TEXT_DEPS)
    expect(candidate.source).toBe('text-layer')
    expect(candidate.pageCount).toBe(1)
    expect(candidate.document.basics.name).toBe('Contoh Nama Fiktif')
    expect(candidate.document.meta?.title).toContain('Impor CV')
    expect(candidate.fields.length).toBeGreaterThan(0)
    // The open draft is untouched: review happens before any save.
    expect(documentStore.getState().document).toBe(before)
    expect(candidate).not.toBeInstanceOf(ImportPdfError)
  })

  it('thin text falls back to OCR and reports the source honestly', async () => {
    const file = fakeFile('scan.pdf', 'application/pdf', 100, new Uint8Array([1, 2, 3]))
    const progress: string[] = []
    const candidate = await runPdfImport(
      file,
      (stage) => {
        progress.push(stage)
      },
      {
        openPdf: async () => fakeDoc('   '),
        renderPage: async () => 'page-image',
        recognize: async (_image, onProgress) => {
          onProgress?.(0.5)
          return SAMPLE_TEXT
        },
      },
    )
    expect(candidate.source).toBe('ocr')
    expect(candidate.warnings).toContain('ocr-fallback')
    expect(candidate.document.basics.email).toBe('contoh.fiktif@example.com')
    expect(progress).toContain('ocr')
  })

  it('cold-cache OCR failure answers OCR_UNAVAILABLE (manual entry is the fallback)', async () => {
    const file = fakeFile('scan.pdf', 'application/pdf', 100, new Uint8Array([1, 2, 3]))
    await expect(
      runPdfImport(file, undefined, {
        openPdf: async () => fakeDoc('  '),
        renderPage: async () => 'page-image',
        recognize: async () => {
          throw new OcrError('ASSETS_UNAVAILABLE', 'offline')
        },
      }),
    ).rejects.toMatchObject({ reason: 'OCR_UNAVAILABLE' })
  })

  it('unmappable text throws MAPPING_EMPTY instead of an empty candidate', async () => {
    const file = fakeFile('cv.pdf', 'application/pdf', 100, new Uint8Array([1, 2, 3]))
    const line = '1'.repeat(60)
    await expect(
      runPdfImport(file, undefined, { openPdf: async () => fakeDoc(`${line}\n${line}`) }),
    ).rejects.toMatchObject({ reason: 'MAPPING_EMPTY' })
  })

  it('unreadable bytes throw UNREADABLE', async () => {
    const file = fakeFile('cv.pdf', 'application/pdf', 100, new Uint8Array([1, 2, 3]))
    await expect(
      runPdfImport(file, undefined, {
        openPdf: async () => {
          throw new Error('corrupt')
        },
      }),
    ).rejects.toMatchObject({ reason: 'UNREADABLE' })
  })
})
