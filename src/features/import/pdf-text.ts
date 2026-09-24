/**
 * PDF text-layer extraction (T3a, ADR-0008).
 *
 * Lazy-loaded: pdf.js ships in its own chunk plus a worker file, never in
 * the initial JS. The worker file (~469 KB gzip) is NOT optional: pdf.js v6
 * needs the worker source even for main-thread parsing (its LoopbackPort
 * "fake worker" runtime-imports it), and Node only worked by accident
 * (repo-local file on disk). Browsers get a real Worker via `?url`,
 * which also keeps multi-page parsing off the UI thread.
 *
 * DOM-free and React-free: runs in Node (spike, without workerSrc) and
 * the browser (workerSrc set below). Never invents text — returns exactly
 * what the text layer holds.
 */

/** Failures the pipeline maps to FR-408 notes (never thrown to the UI raw). */
export type PdfTextErrorReason = 'EMPTY_FILE' | 'NO_TEXT_LAYER' | 'TOO_MANY_PAGES' | 'PARSE_FAILED'

export class PdfTextError extends Error {
  readonly reason: PdfTextErrorReason
  constructor(reason: PdfTextErrorReason, detail?: string) {
    super(detail === undefined ? reason : `${reason}: ${detail}`)
    this.name = 'PdfTextError'
    this.reason = reason
  }
}

/** Minimal pdf.js surface this module needs (injectable seam for tests). */
export interface PdfJsApi {
  getDocument: (params: { data: Uint8Array; disableWorker: boolean }) => {
    promise: Promise<{
      numPages: number
      getPage: (n: number) => Promise<PdfPage>
    }>
  }
}

interface PdfJsModule extends PdfJsApi {
  GlobalWorkerOptions: { workerSrc: string }
}

async function loadPdfJs(): Promise<PdfJsApi> {
  // One import point for the whole app (no inline pdf.js imports elsewhere).
  const mod = (await import('pdfjs-dist/legacy/build/pdf.mjs')) as unknown as PdfJsModule
  // `?url` emits the worker as a separate lazy asset (never initial JS).
  // Browsers only: vite-node (unit tests) and plain Node (spike) cannot
  // resolve `?url` and must keep the repo-local fake-worker path intact,
  // so a failed or non-browser resolution never touches workerSrc.
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      const workerSrc = (await import('pdfjs-dist/legacy/build/pdf.worker.mjs?url'))
        .default as string
      if (workerSrc.startsWith('http') || workerSrc.startsWith('/') || workerSrc.startsWith('blob:')) {
        mod.GlobalWorkerOptions.workerSrc = workerSrc
      }
    } catch {
      // No shipped worker URL: openPdfDocument surfaces UNREADABLE downstream.
    }
  }
  return mod
}

export interface TextContentItem {
  readonly str: string
  /** End-of-line marker from pdf.js geometry (absent in test doubles). */
  readonly hasEOL?: boolean
}

export interface PdfPage {
  getTextContent: () => Promise<{ items: readonly TextContentItem[] }>
  render: (params: {
    canvasContext: CanvasRenderingContext2D
    viewport: { width: number; height: number }
  }) => { promise: Promise<void> }
  getViewport: (params: { scale: number }) => { width: number; height: number }
}

export interface PdfDocumentHandle {
  readonly pageCount: number
  getPage: (n: number) => Promise<PdfPage>
}

export interface OpenPdfOptions {
  /** ADR-0008 provisional cap: at most 5 pages are read. */
  readonly maxPages?: number
  /** Test seam: bypasses the lazy chunk. Production never passes this. */
  readonly loader?: () => Promise<PdfJsApi>
}

const DEFAULT_MAX_PAGES = 5

/** Opens a PDF for text and (when needed) page rendering. Throws PdfTextError. */
export async function openPdfDocument(
  data: Uint8Array,
  options?: OpenPdfOptions,
): Promise<PdfDocumentHandle> {
  if (data.length === 0) throw new PdfTextError('EMPTY_FILE')
  const maxPages = options?.maxPages ?? DEFAULT_MAX_PAGES
  let api: PdfJsApi
  try {
    api = options?.loader !== undefined ? await options.loader() : await loadPdfJs()
  } catch {
    throw new PdfTextError('PARSE_FAILED')
  }
  try {
    // A defensive copy: pdf.js may detach/transfer the buffer it is given.
    // disableWorker keeps parsing on the calling thread; browsers still
    // need workerSrc (set above) for the loopback handler code.
    const doc = await api.getDocument({ data: data.slice(), disableWorker: true }).promise
    if (doc.numPages > maxPages) throw new PdfTextError('TOO_MANY_PAGES', `${doc.numPages} pages`)
    return {
      pageCount: doc.numPages,
      getPage: (n) => doc.getPage(n) as Promise<PdfPage>,
    }
  } catch (error) {
    if (error instanceof PdfTextError) throw error
    throw new PdfTextError('PARSE_FAILED')
  }
}

export interface ExtractPdfTextOptions extends OpenPdfOptions {}

/**
 * Extracts joined text-layer content from PDF bytes.
 * Throws PdfTextError (never returns partial guesses): thin/empty layers
 * are the OCR fallback's trigger, decided by the pipeline — not here.
 */
export async function extractPdfText(
  data: Uint8Array,
  options?: ExtractPdfTextOptions,
): Promise<{ text: string; pageCount: number }> {
  const doc = await openPdfDocument(data, options)
  try {
    const parts: string[] = []
    for (let n = 1; n <= doc.pageCount; n += 1) {
      const page = await doc.getPage(n)
      const content = await page.getTextContent()
      parts.push(joinTextItems(content.items))
    }
    const text = parts.join('\n')
    if (text.trim() === '') throw new PdfTextError('NO_TEXT_LAYER')
    return { text, pageCount: doc.pageCount }
  } catch (error) {
    if (error instanceof PdfTextError) throw error
    throw new PdfTextError('PARSE_FAILED')
  }
}

/**
 * Joins one page's text items, restoring line breaks where pdf.js geometry
 * reports them (`hasEOL`). Without this, multi-line CVs collapse into one
 * line and the mapper sees no headers at all.
 */
export function joinTextItems(items: readonly TextContentItem[]): string {
  let out = ''
  items.forEach((item, index) => {
    if (index > 0) out += items[index - 1]?.hasEOL === true ? '\n' : ' '
    out += item.str
  })
  return out
}

/**
 * Renders one page to a canvas for the OCR fallback (ADR-0008: ≤200 DPI).
 * Screen CSS renders at 96 DPI, so scale ≈ 200/96.
 */
export async function renderPdfPage(
  doc: PdfDocumentHandle,
  pageNumber: number,
  scale = 200 / 96,
): Promise<HTMLCanvasElement> {
  const page = await doc.getPage(pageNumber)
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = Math.floor(viewport.width)
  canvas.height = Math.floor(viewport.height)
  const context = canvas.getContext('2d')
  if (context === null) throw new PdfTextError('PARSE_FAILED', 'no-2d-context')
  await page.render({ canvasContext: context, viewport }).promise
  return canvas
}
