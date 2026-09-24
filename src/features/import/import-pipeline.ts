/**
 * PDF import pipeline (T3a, FR-501/FR-502, ADR-0008/ADR-0009/ADR-0010).
 *
 * One narrow path: validate the file pre-parse → text layer → OCR fallback
 * only when the layer is thin → deterministic field mapping → schema
 * validation → candidate. The open draft and every store are never touched
 * here: the candidate reaches a NEW draft only through an explicit approval
 * action (AC-501-a/AC-502-a).
 *
 * Failure taxonomy maps to FR-408 notes in microcopy; the UI never sees
 * raw engine errors.
 */
import { validateResumeDocument, type ValidatedResumeDocument } from '../../core/schema'
import { mapTextToCandidate, type CandidateSource, type FieldCandidate } from './field-mapper'
import { OcrError, recognizeImage, type OcrImage } from './ocr-text'
import {
  joinTextItems,
  openPdfDocument,
  PdfTextError,
  renderPdfPage,
  type PdfDocumentHandle,
} from './pdf-text'

export type ImportPdfErrorReason =
  | 'NOT_PDF'
  | 'TOO_LARGE'
  | 'UNREADABLE'
  | 'NO_TEXT_NO_OCR'
  | 'OCR_UNAVAILABLE'
  | 'MAPPING_EMPTY'
  | 'VALIDATION_FAILED'

export class ImportPdfError extends Error {
  readonly reason: ImportPdfErrorReason
  constructor(reason: ImportPdfErrorReason, detail?: string) {
    super(detail === undefined ? reason : `${reason}: ${detail}`)
    this.name = 'ImportPdfError'
    this.reason = reason
  }
}

export interface ImportCandidate {
  readonly document: ValidatedResumeDocument
  readonly fields: readonly FieldCandidate[]
  readonly unmapped: readonly string[]
  readonly unmappedTotal: number
  readonly source: CandidateSource
  readonly pageCount: number
  readonly fileName: string
  /** Machine keys for honest notes (ocr-fallback, photo-ignored, thin-text). */
  readonly warnings: readonly string[]
}

/** ADR-0008 provisional cap: 10 MB, checked before parsing (AB-1). */
export const IMPORT_PDF_MAX_BYTES = 10 * 1024 * 1024
/** Text layers shorter than this trigger the OCR fallback. */
export const IMPORT_PDF_THIN_TEXT_CHARS = 50

export interface ImportPipelineDeps {
  /** Test seam for the pdf.js document (spike + e2e prove the real one). */
  readonly openPdf?: (data: Uint8Array) => Promise<PdfDocumentHandle>
  /** Test seam for page rendering (jsdom has no canvas 2d). */
  readonly renderPage?: (doc: PdfDocumentHandle, page: number) => Promise<OcrImage>
  /** Test seam for the OCR engine (spike proved the real one). */
  readonly recognize?: (
    image: OcrImage,
    onProgress?: (ratio: number) => void,
    signal?: AbortSignal,
  ) => Promise<string>
}

async function defaultRenderPage(doc: PdfDocumentHandle, page: number): Promise<OcrImage> {
  return renderPdfPage(doc, page)
}

async function defaultRecognize(
  image: OcrImage,
  onProgress?: (ratio: number) => void,
  signal?: AbortSignal,
): Promise<string> {
  return recognizeImage(
    image,
    onProgress !== undefined || signal !== undefined
      ? {
          ...(onProgress !== undefined ? { onProgress } : {}),
          ...(signal !== undefined ? { signal } : {}),
        }
      : undefined,
  )
}

function buildDocumentForReview(
  mapped: ValidatedResumeDocument,
  fileName: string,
): ValidatedResumeDocument {
  const title = fileName.replace(/\.pdf$/i, '').slice(0, 80) || 'Impor CV'
  return {
    ...mapped,
    meta: {
      locale: 'id' as const,
      mode: 'ats' as const,
      title: `Impor CV — ${title}`,
    },
  }
}

/**
 * Runs the full import for one PDF file. Resolves a reviewable candidate
 * or throws ImportPdfError. No store, no draft, no side effect.
 * `signal` cancels between pages (ADR-0010); a cancel is silent for the
 * caller to treat as a plain reset, never an error note.
 */
export async function runPdfImport(
  file: File,
  onProgress?: (stage: string, ratio: number) => void,
  deps?: ImportPipelineDeps,
  signal?: AbortSignal,
): Promise<ImportCandidate> {
  if (file.type !== '' && file.type !== 'application/pdf') {
    throw new ImportPdfError('NOT_PDF', file.type)
  }
  if (file.size > IMPORT_PDF_MAX_BYTES) {
    throw new ImportPdfError('TOO_LARGE', `${file.size} bytes`)
  }
  const data = new Uint8Array(await file.arrayBuffer())
  const openPdf = deps?.openPdf ?? openPdfDocument
  let doc: PdfDocumentHandle
  try {
    doc = await openPdf(data)
  } catch (error) {
    if (error instanceof PdfTextError && error.reason === 'TOO_MANY_PAGES') {
      throw new ImportPdfError('UNREADABLE', 'too-many-pages')
    }
    throw new ImportPdfError('UNREADABLE')
  }

  onProgress?.('extracting', 0)
  let text = ''
  let source: CandidateSource = 'text-layer'
  const warnings: string[] = []
  try {
    const parts: string[] = []
    for (let n = 1; n <= doc.pageCount; n += 1) {
      const page = await doc.getPage(n)
      const content = await page.getTextContent()
      parts.push(joinTextItems(content.items))
      onProgress?.('extracting', n / doc.pageCount)
    }
    text = parts.join('\n')
  } catch {
    throw new ImportPdfError('UNREADABLE')
  }

  if (text.trim().length < IMPORT_PDF_THIN_TEXT_CHARS) {
    // Thin/empty layer → OCR fallback (ADR-0008), else manual entry.
    warnings.push('ocr-fallback')
    const renderPage = deps?.renderPage ?? defaultRenderPage
    const recognize = deps?.recognize ?? defaultRecognize
    try {
      const ocrParts: string[] = []
      for (let n = 1; n <= doc.pageCount; n += 1) {
        if (signal?.aborted === true) throw new OcrError('CANCELLED')
        const image = await renderPage(doc, n)
        ocrParts.push(
          await recognize(
            image,
            (ratio) => onProgress?.('ocr', (n - 1 + ratio) / doc.pageCount),
            signal,
          ),
        )
      }
      text = ocrParts.join('\n')
      source = 'ocr'
    } catch (error) {
      if (error instanceof OcrError && error.reason === 'CANCELLED') throw error
      if (error instanceof OcrError && error.reason === 'ASSETS_UNAVAILABLE') {
        throw new ImportPdfError('OCR_UNAVAILABLE')
      }
      throw new ImportPdfError('NO_TEXT_NO_OCR')
    }
    if (text.trim() === '') throw new ImportPdfError('NO_TEXT_NO_OCR')
  }

  onProgress?.('mapping', 1)
  const mapped = mapTextToCandidate(text, source)
  if (mapped.fields.length === 0) throw new ImportPdfError('MAPPING_EMPTY')
  const validation = validateResumeDocument(buildDocumentForReview(mapped.document, file.name))
  if (!validation.success) throw new ImportPdfError('VALIDATION_FAILED')
  return {
    document: validation.data,
    fields: mapped.fields,
    unmapped: mapped.unmapped,
    unmappedTotal: mapped.unmappedTotal,
    source,
    pageCount: doc.pageCount,
    fileName: file.name,
    warnings,
  }
}
