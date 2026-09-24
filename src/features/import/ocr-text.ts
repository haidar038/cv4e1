/**
 * OCR fallback (T3a, ADR-0008 + ADR-0010).
 *
 * Lazy-loaded: the tesseract.js wrapper ships in its own chunk (~8 KB gzip).
 * The worker script, WASM core, and traineddata are version-pinned files
 * fetched on demand on the user's explicit import action and pinned in
 * Cache Storage afterwards — never in the initial JS, never precached.
 * Downloading public model files sends no resume data anywhere (C-T3);
 * the remote-file approval itself lives in ADR-0010.
 *
 * DOM/React-free except for the canvas image type (features/ may use DOM).
 * Unit tests inject a worker factory; the real engine was proven by spike T3a.
 */

/** Failures the pipeline maps to FR-408 notes (never thrown to the UI raw). */
export type OcrErrorReason = 'ASSETS_UNAVAILABLE' | 'RECOGNIZE_FAILED' | 'CANCELLED'

export class OcrError extends Error {
  readonly reason: OcrErrorReason
  constructor(reason: OcrErrorReason, detail?: string) {
    super(detail === undefined ? reason : `${reason}: ${detail}`)
    this.name = 'OcrError'
    this.reason = reason
  }
}

/**
 * Version-pinned on-demand assets (verified live in spike T3a — all HEAD
 * 200 with the sizes below). Bumped only via ADR, never silently.
 */
export const OCR_TESSERACT_VERSION = '7.0.0' as const
const OCR_CORE_VERSION = '7.0.0' as const
const OCR_TRAINEDDATA_TAG = '4.0.0_best_int' as const

export interface OcrAssetUrls {
  readonly workerUrl: string
  readonly coreUrl: string
  readonly langBaseUrl: string
}

export function buildOcrAssetUrls(): OcrAssetUrls {
  return {
    workerUrl: `https://cdn.jsdelivr.net/npm/tesseract.js@${OCR_TESSERACT_VERSION}/dist/worker.min.js`,
    coreUrl: `https://cdn.jsdelivr.net/npm/tesseract.js-core@v${OCR_CORE_VERSION}`,
    langBaseUrl: 'https://cdn.jsdelivr.net/npm/@tesseract.js-data',
  }
}

export function traineddataUrl(lang: string): string {
  return `${buildOcrAssetUrls().langBaseUrl}/${lang}/${OCR_TRAINEDDATA_TAG}/${lang}.traineddata.gz`
}

/** Image shapes the pipeline can hand over (pdf.js canvas in production). */
export type OcrImage = HTMLCanvasElement | ImageData | Blob | string

/** Minimal worker surface (injectable seam for tests). */
export interface OcrWorker {
  recognize: (image: OcrImage) => Promise<{ data: { text: string } }>
  terminate: () => Promise<void>
}

export type OcrWorkerFactory = (langs: readonly string[]) => Promise<OcrWorker>

export interface RecognizeOptions {
  /** ADR-0008: Indonesian first, English second. */
  readonly langs?: readonly string[]
  readonly onProgress?: (ratio: number) => void
  readonly signal?: AbortSignal
  /** Test seam: bypasses engine download. Production never passes this. */
  readonly workerFactory?: OcrWorkerFactory
}

const DEFAULT_LANGS = ['ind', 'eng'] as const

async function defaultWorkerFactory(
  langs: readonly string[],
  onProgress?: (ratio: number) => void,
): Promise<OcrWorker> {
  // Single import point for the whole app (no inline tesseract imports elsewhere).
  const { createWorker } = await import('tesseract.js')
  const assets = buildOcrAssetUrls()
  const worker = await createWorker([...langs], undefined, {
    workerPath: assets.workerUrl,
    corePath: assets.coreUrl,
    langPath: assets.langBaseUrl,
    ...(onProgress !== undefined
      ? {
          logger: (m: { status: string; progress: number }) => {
            if (m.status === 'recognizing text' && typeof m.progress === 'number') {
              onProgress(m.progress)
            }
          },
        }
      : {}),
  })
  return {
    recognize: (image) =>
      worker.recognize(image as never).then((r) => ({ data: { text: r.data.text } })),
    terminate: () => worker.terminate().then(() => undefined),
  }
}

/** Fresh read every call (a cached boolean would miss mid-flight aborts). */
function isAborted(signal: AbortSignal | undefined): boolean {
  return signal?.aborted === true
}

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false
}

/**
 * Recognizes text from one page image. Returns raw OCR text verbatim —
 * mapping and grounding happen in field-mapper.ts, never here.
 */
export async function recognizeImage(image: OcrImage, options?: RecognizeOptions): Promise<string> {
  if (isAborted(options?.signal)) throw new OcrError('CANCELLED')
  const langs = options?.langs ?? DEFAULT_LANGS
  let worker: OcrWorker
  try {
    worker =
      options?.workerFactory !== undefined
        ? await options.workerFactory(langs)
        : await defaultWorkerFactory(langs, options?.onProgress)
  } catch {
    // Engine or asset download failed: offline with cold cache is the
    // common case (ADR-0010) — the pipeline answers with manual entry.
    throw new OcrError('ASSETS_UNAVAILABLE', isOffline() ? 'offline' : 'download-failed')
  }
  try {
    if (isAborted(options?.signal)) throw new OcrError('CANCELLED')
    const { data } = await worker.recognize(image)
    if (data.text.trim() === '') throw new OcrError('RECOGNIZE_FAILED', 'empty')
    return data.text
  } catch (error) {
    if (error instanceof OcrError) throw error
    throw new OcrError('RECOGNIZE_FAILED')
  } finally {
    await worker.terminate().catch(() => undefined)
  }
}
