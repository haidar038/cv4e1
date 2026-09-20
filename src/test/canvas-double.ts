import { vi } from 'vitest'

/**
 * Deterministic canvas 2D context for the jsdom project.
 *
 * jsdom ships without the `canvas` package, so a real `getContext('2d')` call is
 * "not implemented": it prints a console error and returns null. Two callers hit
 * that path in this suite:
 *
 * 1. **axe-core** — its color-contrast rule probes a canvas (`_isIconLigature`)
 *    on every audit, which is where the noisy "Not implemented:
 *    HTMLCanvasElement's getContext()" line came from (verified by stack probe).
 * 2. **the photo pipeline** — `compressPhoto` draws onto a canvas before
 *    encoding.
 *
 * The double keeps that probe deterministic instead of failing. Its
 * `measureText` is length-proportional and its `getImageData` returns a non-empty
 * pattern on purpose: axe treats a zero-width measurement or an all-zero pixel
 * buffer as an "icon ligature" and would then skip the element entirely. With
 * this double axe keeps auditing the text, and jsdom still reports
 * color-contrast as "incomplete" (no layout) exactly as documented for the
 * `runAxe` helper — jsdom cannot judge contrast; that stays an e2e concern.
 *
 * Real pixels of a compressed photo are still verified by the pure encoder-loop
 * tests in `compress.test.ts` (node env) plus a real-browser check; the double
 * only stands in for the platform.
 */

export interface Canvas2DContextDouble {
  readonly canvas: HTMLCanvasElement
  font: string
  textAlign: string
  textBaseline: string
  readonly drawImage: ReturnType<typeof vi.fn>
  readonly fillText: ReturnType<typeof vi.fn>
  readonly clearRect: ReturnType<typeof vi.fn>
  measureText(text: string): { width: number }
  getImageData(x: number, y: number, width: number, height: number): { data: Uint8ClampedArray }
}

let lastContext: Canvas2DContextDouble | null = null

/**
 * The most recently created context double, so a test can assert what the code
 * under test drew (e.g. the scaled dimensions passed to `drawImage`).
 */
export function lastCanvasContext(): Canvas2DContextDouble {
  if (lastContext === null) {
    throw new Error('no canvas 2D context was created — did the code under test run?')
  }
  return lastContext
}

export function resetCanvasContexts(): void {
  lastContext = null
}

function createContextDouble(canvas: HTMLCanvasElement): Canvas2DContextDouble {
  return {
    canvas,
    font: '',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    drawImage: vi.fn(),
    fillText: vi.fn(),
    clearRect: vi.fn(),
    measureText: (text: string) => ({ width: text.length * 8 }),
    getImageData: (_x: number, _y: number, width: number, height: number) => ({
      data: new Uint8ClampedArray(Math.max(1, width) * Math.max(1, height) * 4).fill(255),
    }),
  }
}

/** Installs the double on `HTMLCanvasElement.prototype.getContext`. */
export function installCanvasDouble(): void {
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement) {
    const context = createContextDouble(this)
    lastContext = context
    return context
  } as unknown as typeof HTMLCanvasElement.prototype.getContext
}
