/**
 * Photo compression pipeline (decision D18): Canvas API native, no new
 * dependency.
 *
 * Structure: the encoder loop (`encodeWithinBudget`) is a pure function with no
 * DOM at all, so the quality step-down, the WebP/JPEG decision, the byte budget
 * and the failure path are unit-tested in the `node` environment. The thin
 * browser adapter (`compressPhoto`) decodes, scales, draws and then delegates to
 * that loop; its platform seams are injectable, so all of its logic is testable
 * without a canvas too. What remains genuinely browser-only — `createImageBitmap`
 * EXIF decoding, `canvas.toBlob`, `URL.createObjectURL` — is documented here
 * instead of pretended to be covered.
 *
 * EXIF orientation from phone cameras is normalized by decoding with
 * `imageOrientation: 'from-image'` (createImageBitmap), falling back to an
 * `<img>` decode, which applies EXIF orientation in modern browsers.
 */

export const PHOTO_MAX_INPUT_BYTES = 2 * 1024 * 1024
export const PHOTO_MAX_OUTPUT_BYTES = 500 * 1024
export const PHOTO_MAX_EDGE_PX = 800
export const PHOTO_MIN_QUALITY = 0.5
export const PHOTO_QUALITY_STEP = 0.1
export const PHOTO_START_QUALITY = 0.9

export const PHOTO_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export type PhotoInputError = 'wrongType' | 'tooLarge'

/** Null means the input is acceptable for compression. */
export function validatePhotoInput(type: string, sizeBytes: number): PhotoInputError | null {
  if (!PHOTO_ACCEPTED_TYPES.includes(type as (typeof PHOTO_ACCEPTED_TYPES)[number])) {
    return 'wrongType'
  }
  if (sizeBytes > PHOTO_MAX_INPUT_BYTES) return 'tooLarge'
  return null
}

export interface Dimensions {
  width: number
  height: number
}

/**
 * Clamps the longest side to `maxEdge`, never upscales, and never produces a
 * zero-sized side for extreme (panorama/vertical) aspect ratios.
 */
export function computeTargetDimensions(
  width: number,
  height: number,
  maxEdge: number = PHOTO_MAX_EDGE_PX,
): Dimensions {
  const longest = Math.max(width, height)
  if (longest <= maxEdge) {
    return { width: Math.max(1, width), height: Math.max(1, height) }
  }
  const scale = maxEdge / longest
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

/** Next lower quality step, or null when `PHOTO_MIN_QUALITY` is reached. */
export function nextQuality(quality: number): number | null {
  const next = Math.round((quality - PHOTO_QUALITY_STEP) * 10) / 10
  return next >= PHOTO_MIN_QUALITY ? next : null
}

export class PhotoCompressError extends Error {
  constructor() {
    super('photo could not be compressed')
  }
}

/** Encodes the prepared canvas; `null` means the platform could not encode. */
export interface PhotoEncodeAttempt {
  (mime: string, quality: number): Promise<Blob | null>
}

export interface EncodeWithinBudgetOptions {
  /** Whether this platform's encoder really produces WebP for the canvas. */
  readonly supportsWebP: boolean
  readonly encode: PhotoEncodeAttempt
  /** Output-size target; defaults to `PHOTO_MAX_OUTPUT_BYTES`. */
  readonly maxBytes?: number
  /** First quality tried; defaults to `PHOTO_START_QUALITY`. */
  readonly startQuality?: number
}

/**
 * The encoder loop shared by the photo pipeline: choose WebP when the platform
 * supports it (JPEG otherwise), encode at `startQuality`, and step the quality
 * down until the result fits `maxBytes`.
 *
 * The byte budget is a target, not a guarantee: when even the lowest quality
 * stays over it, the smallest result found is returned rather than dropping the
 * user's photo. Only a total encoder failure — every attempt returning `null` —
 * raises `PhotoCompressError`, so an attempt that fails mid-loop never discards
 * an earlier success.
 */
export async function encodeWithinBudget(options: EncodeWithinBudgetOptions): Promise<Blob> {
  const mime = options.supportsWebP ? 'image/webp' : 'image/jpeg'
  const maxBytes = options.maxBytes ?? PHOTO_MAX_OUTPUT_BYTES
  let quality = options.startQuality ?? PHOTO_START_QUALITY
  let bestEffort: Blob | null = null

  for (;;) {
    const output = await options.encode(mime, quality)
    if (output !== null) {
      if (output.size <= maxBytes) return output
      // Quality only ever decreases, so this keeps the smallest result so far.
      bestEffort = output
    }
    const step = nextQuality(quality)
    if (step === null) break
    quality = step
  }

  if (bestEffort === null) throw new PhotoCompressError()
  return bestEffort
}

export interface DecodedPhoto extends Dimensions {
  readonly source: CanvasImageSource
}

/**
 * Platform seams of `compressPhoto`. The defaults are the real browser
 * implementations; tests inject fakes so the scaling and error paths are
 * covered without a canvas.
 */
export interface PhotoCompressionDeps {
  decode(blob: Blob): Promise<DecodedPhoto>
  createCanvas(width: number, height: number): HTMLCanvasElement
  encode(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob | null>
  supportsWebP(canvas: HTMLCanvasElement): boolean
}

function decodeViaImgElement(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new PhotoCompressError())
    }
    img.src = url
  })
}

async function decode(blob: Blob): Promise<DecodedPhoto> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' })
      return { width: bitmap.width, height: bitmap.height, source: bitmap }
    } catch {
      // Some browsers reject the options object; the <img> path still applies
      // EXIF orientation at decode time.
    }
  }
  const img = await decodeViaImgElement(blob)
  const width = img.naturalWidth > 0 ? img.naturalWidth : img.width
  const height = img.naturalHeight > 0 ? img.naturalHeight : img.height
  return { width, height, source: img }
}

const browserDeps: PhotoCompressionDeps = {
  decode,
  createCanvas: (width, height) => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    return canvas
  },
  encode: (canvas, mime, quality) =>
    new Promise((resolve) => {
      canvas.toBlob((result) => resolve(result), mime, quality)
    }),
  supportsWebP: (canvas) => canvas.toDataURL('image/webp').startsWith('data:image/webp'),
}

/**
 * Compresses an already-validated photo Blob: clamp to the longest edge, draw
 * it onto a canvas sized to those dimensions, then let `encodeWithinBudget`
 * find the largest quality that fits the byte budget.
 */
export async function compressPhoto(
  blob: Blob,
  deps: PhotoCompressionDeps = browserDeps,
): Promise<Blob> {
  const decoded = await deps.decode(blob)
  const target = computeTargetDimensions(decoded.width, decoded.height)

  const canvas = deps.createCanvas(target.width, target.height)
  const ctx = canvas.getContext('2d')
  if (ctx === null) throw new PhotoCompressError()
  ctx.drawImage(decoded.source, 0, 0, target.width, target.height)

  return encodeWithinBudget({
    supportsWebP: deps.supportsWebP(canvas),
    encode: (mime, quality) => deps.encode(canvas, mime, quality),
  })
}
