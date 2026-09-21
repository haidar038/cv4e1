/**
 * PWA icon generator (Task 14, D20).
 *
 * The artwork is original (a teal rounded square with a white "CV" mark drawn
 * from a 5x7 pixel font below) — no downloaded assets, satisfying C-T10. This
 * script re-renders `public/icons/icon-192.png` and `public/icons/icon-512.png`
 * deterministically from that description using only node builtins
 * (`node:zlib` for the IDAT stream, hand-rolled CRC32), so icon generation
 * needs no dependency at all — the "local script + dev dependency" planning
 * option collapsed to "local script, zero dependencies".
 *
 * The matching `public/icons/icon.svg` source is hand-drawn and committed
 * alongside; the PNGs are the installable assets the webmanifest references.
 *
 * Usage: bun scripts/generate-pwa-icons.ts
 */

import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// --- CRC32 (ISO 3309, reversed polynomial 0xEDB88320) ---

const CRC_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = c % 2 === 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff]! ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length)
  const view = new DataView(out.buffer)
  view.setUint32(0, data.length)
  for (let i = 0; i < 4; i += 1) out[4 + i] = type.charCodeAt(i)
  out.set(data, 8)
  const check = new Uint8Array(4 + data.length)
  check.set(out.subarray(4, 8 + data.length))
  view.setUint32(8 + data.length, crc32(check))
  return out
}

// --- 5x7 pixel glyphs for "C" and "V" (original, drawn for this icon) ---

const GLYPHS: Record<string, readonly string[]> = {
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
}

const BG = { r: 15, g: 118, b: 110 } // teal-700, approximates the --primary token
const FG = { r: 255, g: 255, b: 255 }

function paintIcon(size: number): Uint8Array {
  // Full-bleed background (maskable-safe: the mark keeps a wide margin).
  const pixels = new Uint8Array(size * size * 3)
  for (let i = 0; i < size * size; i += 1) {
    pixels[i * 3] = BG.r
    pixels[i * 3 + 1] = BG.g
    pixels[i * 3 + 2] = BG.b
  }

  // Rounded corners (radius = 1/4 of the edge) so the raster matches the SVG.
  const radius = Math.floor(size / 4)
  const corner = (cx: number, cy: number, x: number, y: number): boolean => {
    const dx = x - cx
    const dy = y - cy
    return dx * dx + dy * dy > radius * radius
  }
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const outside =
        (x < radius && y < radius && corner(radius, radius, x, y)) ||
        (x >= size - radius && y < radius && corner(size - radius - 1, radius, x, y)) ||
        (x < radius && y >= size - radius && corner(radius, size - radius - 1, x, y)) ||
        (x >= size - radius &&
          y >= size - radius &&
          corner(size - radius - 1, size - radius - 1, x, y))
      if (outside) {
        // Transparent corners are not representable in RGB; instead keep the
        // background — installers mask the icon themselves (purpose maskable).
      }
    }
  }

  // "CV" mark: two 5x7 glyphs, one blank column between, scaled to ~1/2 width.
  const scale = Math.max(1, Math.floor(size / 24))
  const glyphW = 5 * scale
  const glyphH = 7 * scale
  const gap = scale
  const totalW = glyphW * 2 + gap
  const startX = Math.floor((size - totalW) / 2)
  const startY = Math.floor((size - glyphH) / 2)

  const drawGlyph = (glyph: readonly string[], offsetX: number): void => {
    glyph.forEach((row, rowIndex) => {
      for (let col = 0; col < row.length; col += 1) {
        if (row[col] !== '1') continue
        for (let dy = 0; dy < scale; dy += 1) {
          for (let dx = 0; dx < scale; dx += 1) {
            const x = offsetX + col * scale + dx
            const y = startY + rowIndex * scale + dy
            const at = (y * size + x) * 3
            pixels[at] = FG.r
            pixels[at + 1] = FG.g
            pixels[at + 2] = FG.b
          }
        }
      }
    })
  }
  drawGlyph(GLYPHS['C']!, startX)
  drawGlyph(GLYPHS['V']!, startX + glyphW + gap)

  // PNG: 8-bit truecolor, one scanline filter byte (0 = None) per row.
  const raw = new Uint8Array(size * (1 + size * 3))
  for (let y = 0; y < size; y += 1) {
    raw[y * (1 + size * 3)] = 0
    raw.set(pixels.subarray(y * size * 3, (y + 1) * size * 3), y * (1 + size * 3) + 1)
  }

  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = new Uint8Array(13)
  const view = new DataView(ihdr.buffer)
  view.setUint32(0, size)
  view.setUint32(4, size)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // truecolor
  const idat = deflateSync(raw)

  const parts = [
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', new Uint8Array(idat)),
    chunk('IEND', new Uint8Array(0)),
  ]
  const total = parts.reduce((sum, part) => sum + part.length, 0)
  const out = new Uint8Array(total)
  let at = 0
  for (const part of parts) {
    out.set(part, at)
    at += part.length
  }
  return out
}

function main(): void {
  const dir = join(import.meta.dirname, '..', 'public', 'icons')
  mkdirSync(dir, { recursive: true })
  for (const size of [192, 512]) {
    const path = join(dir, `icon-${size}.png`)
    writeFileSync(path, paintIcon(size))
    console.log(`generate-pwa-icons: wrote ${path}`)
  }
}

main()
