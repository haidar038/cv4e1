import { describe, expect, it, vi } from 'vitest'
import {
  PHOTO_MAX_EDGE_PX,
  PHOTO_MAX_INPUT_BYTES,
  PHOTO_MAX_OUTPUT_BYTES,
  PhotoCompressError,
  compressPhoto,
  computeTargetDimensions,
  encodeWithinBudget,
  nextQuality,
  validatePhotoInput,
  type Dimensions,
  type PhotoCompressionDeps,
} from './compress'

function blobOfSize(bytes: number): Blob {
  return new Blob([new Uint8Array(bytes)])
}

describe('validatePhotoInput (D18 limits as data)', () => {
  it('accepts the supported image types within the size limit', () => {
    expect(validatePhotoInput('image/jpeg', 1024)).toBeNull()
    expect(validatePhotoInput('image/png', 1024)).toBeNull()
    expect(validatePhotoInput('image/webp', 1024)).toBeNull()
  })

  it('accepts a photo exactly at the 2 MB limit', () => {
    expect(validatePhotoInput('image/jpeg', PHOTO_MAX_INPUT_BYTES)).toBeNull()
  })

  it('rejects oversized photos — a 3 MB file is too large (AC)', () => {
    expect(validatePhotoInput('image/jpeg', 3 * 1024 * 1024)).toBe('tooLarge')
  })

  it('rejects unsupported types — including image disguises', () => {
    expect(validatePhotoInput('image/gif', 1024)).toBe('wrongType')
    expect(validatePhotoInput('application/pdf', 1024)).toBe('wrongType')
    expect(validatePhotoInput('', 1024)).toBe('wrongType')
  })
})

describe('computeTargetDimensions (longest edge, never upscale, extreme ratios safe)', () => {
  it('keeps small photos untouched', () => {
    expect(computeTargetDimensions(400, 300)).toEqual({ width: 400, height: 300 })
  })

  it('clamps the longest side to 800 px keeping the aspect ratio', () => {
    expect(computeTargetDimensions(1600, 1200)).toEqual({ width: 800, height: 600 })
    expect(computeTargetDimensions(1200, 1600)).toEqual({ width: 600, height: 800 })
  })

  it('handles extreme panoramas and verticals without zero-sized sides', () => {
    expect(computeTargetDimensions(4000, 200)).toEqual({ width: 800, height: 40 })
    expect(computeTargetDimensions(200, 4000)).toEqual({ width: 40, height: 800 })
    expect(computeTargetDimensions(20000, 2)).toEqual({ width: 800, height: 1 })
  })

  it('honours a custom max edge', () => {
    expect(computeTargetDimensions(1000, 500, 100)).toEqual({ width: 100, height: 50 })
    expect(computeTargetDimensions(1000, 500, PHOTO_MAX_EDGE_PX)).toEqual({
      width: 800,
      height: 400,
    })
  })
})

describe('nextQuality (encoder quality stepping)', () => {
  it('steps down by 0.1 while above the floor', () => {
    expect(nextQuality(0.9)).toBe(0.8)
    expect(nextQuality(0.6)).toBe(0.5)
  })

  it('returns null at the minimum quality so the loop stops', () => {
    expect(nextQuality(0.5)).toBeNull()
    expect(nextQuality(0.4)).toBeNull()
  })
})

describe('encodeWithinBudget (encoder loop, no DOM)', () => {
  it('returns the FIRST result that fits the budget — the highest quality that fits', async () => {
    const encode = vi.fn(async (_mime: string, quality: number) =>
      blobOfSize(quality <= 0.7 ? 400 * 1024 : 900 * 1024),
    )

    const output = await encodeWithinBudget({ supportsWebP: true, encode })

    expect(output.size).toBe(400 * 1024)
    expect(encode.mock.calls.map(([, quality]) => quality)).toEqual([0.9, 0.8, 0.7])
  })

  it('requests WebP when the platform supports it and JPEG when it does not', async () => {
    const webp = vi.fn(async () => blobOfSize(1024))
    const jpeg = vi.fn(async () => blobOfSize(1024))

    await encodeWithinBudget({ supportsWebP: true, encode: webp })
    await encodeWithinBudget({ supportsWebP: false, encode: jpeg })

    expect(webp).toHaveBeenCalledWith('image/webp', 0.9)
    expect(jpeg).toHaveBeenCalledWith('image/jpeg', 0.9)
  })

  it('steps down to the minimum quality and then returns the smallest result — the budget is a target, not a guarantee', async () => {
    const encode = vi.fn(async (_mime: string, _quality: number) => blobOfSize(900 * 1024))

    const output = await encodeWithinBudget({ supportsWebP: true, encode })

    expect(output.size).toBe(900 * 1024)
    expect(encode.mock.calls.map(([, quality]) => quality)).toEqual([0.9, 0.8, 0.7, 0.6, 0.5])
  })

  it('never discards an earlier success when a later attempt fails', async () => {
    const encode = vi.fn(async (_mime: string, quality: number) =>
      quality === 0.9 ? blobOfSize(900 * 1024) : null,
    )

    const output = await encodeWithinBudget({ supportsWebP: true, encode })

    expect(output.size).toBe(900 * 1024)
  })

  it('throws PhotoCompressError only when every attempt fails', async () => {
    const encode = vi.fn(async () => null)

    await expect(encodeWithinBudget({ supportsWebP: true, encode })).rejects.toBeInstanceOf(
      PhotoCompressError,
    )
    expect(encode).toHaveBeenCalledTimes(5)
  })

  it('honours an injected byte budget and start quality', async () => {
    const encode = vi.fn(async (_mime: string, _quality: number) => blobOfSize(64))

    await encodeWithinBudget({ supportsWebP: false, encode, maxBytes: 32, startQuality: 0.6 })

    expect(encode.mock.calls.map(([, quality]) => quality)).toEqual([0.6, 0.5])
  })
})

describe('compressPhoto (adapter with injected platform seams)', () => {
  function deps(overrides: Partial<PhotoCompressionDeps> = {}): {
    deps: PhotoCompressionDeps
    created: Dimensions[]
    drawImage: ReturnType<typeof vi.fn>
  } {
    const drawImage = vi.fn()
    const created: Dimensions[] = []
    const canvas = {
      getContext: () => ({ drawImage }),
    } as unknown as HTMLCanvasElement
    return {
      created,
      drawImage,
      deps: {
        decode: async () => ({ width: 1600, height: 1200, source: {} as CanvasImageSource }),
        createCanvas: (width, height) => {
          created.push({ width, height })
          return canvas
        },
        encode: async () => blobOfSize(100 * 1024),
        supportsWebP: () => true,
        ...overrides,
      },
    }
  }

  it('clamps the longest edge, sizes the canvas accordingly, and draws at that size', async () => {
    const { deps: injected, created, drawImage } = deps()

    const output = await compressPhoto(blobOfSize(1_500_000), injected)

    expect(created).toEqual([{ width: 800, height: 600 }])
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 800, 600)
    expect(output.size).toBe(100 * 1024)
  })

  it('encodes WebP when the platform reports support, JPEG otherwise', async () => {
    const seen: string[] = []
    const encode = async (_canvas: HTMLCanvasElement, mime: string) => {
      seen.push(mime)
      return blobOfSize(1024)
    }

    await compressPhoto(blobOfSize(1024), deps({ encode, supportsWebP: () => true }).deps)
    await compressPhoto(blobOfSize(1024), deps({ encode, supportsWebP: () => false }).deps)

    expect(seen).toEqual(['image/webp', 'image/jpeg'])
  })

  it('never keeps the drawn canvas by accident: the output is what the encoder returned', async () => {
    const output = await compressPhoto(blobOfSize(1024), deps().deps)

    expect(output.size).toBeLessThanOrEqual(PHOTO_MAX_OUTPUT_BYTES)
  })

  it('fails cleanly when the platform cannot give a 2D context', async () => {
    const injected: PhotoCompressionDeps = {
      decode: async () => ({ width: 100, height: 100, source: {} as CanvasImageSource }),
      createCanvas: () => ({ getContext: () => null }) as unknown as HTMLCanvasElement,
      encode: async () => blobOfSize(10),
      supportsWebP: () => true,
    }

    await expect(compressPhoto(blobOfSize(1024), injected)).rejects.toBeInstanceOf(
      PhotoCompressError,
    )
  })

  it('lets the decode failure surface as PhotoCompressError (the upload path shows a friendly message)', async () => {
    const injected = deps({
      decode: async () => {
        throw new PhotoCompressError()
      },
    }).deps

    await expect(compressPhoto(blobOfSize(1024), injected)).rejects.toBeInstanceOf(
      PhotoCompressError,
    )
  })
})
