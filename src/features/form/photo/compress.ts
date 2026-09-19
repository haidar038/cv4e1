/**
 * Photo compression pipeline (decision D18): Canvas API native, no new
 * dependency. Pure parts (input validation, target dimensions, quality
 * stepping) are exported for direct unit testing; only the thin canvas/decode
 * runner touches the DOM. EXIF orientation from phone cameras is normalized by
 * decoding with `imageOrientation: 'from-image'` (createImageBitmap), falling
 * back to an `<img>` decode, which applies EXIF orientation in modern browsers.
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

async function decode(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(blob, { imageOrientation: 'from-image' })
    } catch {
      // Some browsers reject the options object; the <img> path still applies
      // EXIF orientation at decode time.
    }
  }
  return decodeViaImgElement(blob)
}

function toBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((result) => resolve(result), mime, quality)
  })
}

function canvasSupportsWebP(canvas: HTMLCanvasElement): boolean {
  return canvas.toDataURL('image/webp').startsWith('data:image/webp')
}

/**
 * Compresses an already-validated photo Blob: clamp to the longest edge,
 * step the encoder quality down until the output fits the byte budget, then
 * return the best result found (the byte budget is a target — a photo that
 * cannot reach it at minimum quality is still returned rather than dropped).
 */
export async function compressPhoto(blob: Blob): Promise<Blob> {
  const source = await decode(blob)
  const sourceWidth = 'width' in source ? source.width : 0
  const sourceHeight = 'height' in source ? source.height : 0
  const target = computeTargetDimensions(sourceWidth, sourceHeight)

  const canvas = document.createElement('canvas')
  canvas.width = target.width
  canvas.height = target.height
  const ctx = canvas.getContext('2d')
  if (ctx === null) throw new PhotoCompressError()
  ctx.drawImage(source, 0, 0, target.width, target.height)

  const mime = canvasSupportsWebP(canvas) ? 'image/webp' : 'image/jpeg'
  let quality = PHOTO_START_QUALITY
  let output = await toBlob(canvas, mime, quality)
  while (output !== null && output.size > PHOTO_MAX_OUTPUT_BYTES) {
    const step = nextQuality(quality)
    if (step === null) break
    quality = step
    output = await toBlob(canvas, mime, quality)
  }
  if (output === null) throw new PhotoCompressError()
  return output
}
