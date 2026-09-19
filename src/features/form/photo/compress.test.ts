import { describe, expect, it } from 'vitest'
import {
  PHOTO_MAX_EDGE_PX,
  PHOTO_MAX_INPUT_BYTES,
  computeTargetDimensions,
  nextQuality,
  validatePhotoInput,
} from './compress'

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
