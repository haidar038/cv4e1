import { describe, expect, it } from 'vitest'
import {
  buildOcrAssetUrls,
  OCR_TESSERACT_VERSION,
  OcrError,
  recognizeImage,
  traineddataUrl,
  type OcrImage,
} from './ocr-text'

function okFactory(text: string) {
  return async () => ({
    recognize: async (_image: OcrImage) => ({ data: { text } }),
    terminate: async () => undefined,
  })
}

describe('ocr-text (T3a)', () => {
  it('pins versioned asset URLs (bumped only via ADR)', () => {
    expect(OCR_TESSERACT_VERSION).toBe('7.0.0')
    const assets = buildOcrAssetUrls()
    expect(assets.workerUrl).toBe(
      'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/worker.min.js',
    )
    expect(assets.coreUrl).toBe('https://cdn.jsdelivr.net/npm/tesseract.js-core@v7.0.0')
    expect(assets.langBaseUrl).toBe('https://cdn.jsdelivr.net/npm/@tesseract.js-data')
    expect(traineddataUrl('ind')).toBe(
      'https://cdn.jsdelivr.net/npm/@tesseract.js-data/ind/4.0.0_best_int/ind.traineddata.gz',
    )
  })

  it('returns engine text verbatim through the seam', async () => {
    const text = await recognizeImage('scan.png', {
      workerFactory: okFactory('Contoh Nama Fiktif'),
    })
    expect(text).toBe('Contoh Nama Fiktif')
  })

  it('empty engine output throws RECOGNIZE_FAILED', async () => {
    await expect(
      recognizeImage('scan.png', { workerFactory: okFactory('   \n  ') }),
    ).rejects.toMatchObject({ reason: 'RECOGNIZE_FAILED' })
  })

  it('engine download failure throws ASSETS_UNAVAILABLE (manual entry answers)', async () => {
    await expect(
      recognizeImage('scan.png', {
        workerFactory: async () => {
          throw new Error('fetch failed')
        },
      }),
    ).rejects.toMatchObject({ reason: 'ASSETS_UNAVAILABLE' })
  })

  it('aborted signal throws CANCELLED before touching the engine', async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(
      recognizeImage('scan.png', {
        signal: controller.signal,
        workerFactory: okFactory('x'),
      }),
    ).rejects.toMatchObject({ reason: 'CANCELLED' })
  })

  it('OcrError carries its reason', () => {
    expect(new OcrError('CANCELLED')).toMatchObject({ name: 'OcrError', reason: 'CANCELLED' })
  })
})
