import { gzipSync } from 'node:zlib'
import { describe, expect, test } from 'vitest'
import {
  ABSOLUTE_BUDGETS,
  BUDGET_METRICS,
  classifyFile,
  computeStats,
  evaluateBudget,
  formatBytes,
  parseBaselineJson,
  type BundleStats,
} from './bundle-budget.ts'

const stats = (over: Partial<BundleStats>): BundleStats => ({
  jsGzip: 0,
  cssGzip: 0,
  fontsRaw: 0,
  transferGzip: 0,
  ...over,
})

describe('classifyFile', () => {
  test('classifies by extension, case-insensitively', () => {
    expect(classifyFile('assets/index-B2U04wb.js')).toBe('js')
    expect(classifyFile('assets/chunk.MJS')).toBe('js')
    expect(classifyFile('assets/index-9c0onFEz.css')).toBe('css')
    expect(classifyFile('assets/roboto-latin.woff2')).toBe('font')
    expect(classifyFile('assets/icon.woff')).toBe('font')
    expect(classifyFile('assets/font.ttf')).toBe('font')
    expect(classifyFile('assets/font.otf')).toBe('font')
    expect(classifyFile('index.html')).toBe('other')
    expect(classifyFile('favicon.svg')).toBe('other')
  })
})

describe('computeStats', () => {
  const jsBytes = Buffer.from('console.log("hello world")\n')
  const cssBytes = Buffer.from('body{margin:0}\n')
  const fontBytes = Buffer.from([0x77, 0x4f, 0x46, 0x32, 0, 1, 2, 3])
  const htmlBytes = Buffer.from('<!doctype html><div id="root"></div>')

  test('aggregates per kind and estimates transfer as the sum of all gzips', () => {
    const files = [
      { path: 'assets/index-a1b2.js', bytes: jsBytes },
      { path: 'assets/index-a1b2.css', bytes: cssBytes },
      { path: 'assets/roboto-latin.woff2', bytes: fontBytes },
      { path: 'index.html', bytes: htmlBytes },
    ]

    expect(computeStats(files)).toEqual({
      jsGzip: gzipSync(jsBytes).length,
      cssGzip: gzipSync(cssBytes).length,
      fontsRaw: fontBytes.length,
      transferGzip:
        gzipSync(jsBytes).length +
        gzipSync(cssBytes).length +
        gzipSync(fontBytes).length +
        gzipSync(htmlBytes).length,
    })
  })

  test('counts each file once even when kinds repeat', () => {
    const files = [
      { path: 'a.js', bytes: jsBytes },
      { path: 'b.js', bytes: jsBytes },
    ]
    expect(computeStats(files).jsGzip).toBe(2 * gzipSync(jsBytes).length)
  })

  test('an empty dist yields zeroed stats', () => {
    expect(computeStats([])).toEqual(stats({}))
  })
})

describe('evaluateBudget', () => {
  const BASE = stats({ jsGzip: 1000, cssGzip: 2000, fontsRaw: 5000, transferGzip: 10000 })

  test('passes when nothing grew', () => {
    expect(evaluateBudget(BASE, BASE)).toEqual([])
  })

  test('passes when metrics shrank', () => {
    expect(evaluateBudget(stats({ jsGzip: 1 }), BASE)).toEqual([])
  })

  test('passes at exactly the +10% ratchet edge', () => {
    expect(evaluateBudget(stats({ jsGzip: 1100 }), BASE)).toEqual([])
  })

  test('fails just past the ratchet and reports the overshoot', () => {
    const violations = evaluateBudget(stats({ jsGzip: 1101 }), BASE)
    expect(violations).toHaveLength(1)
    expect(violations[0]?.metric).toBe('jsGzip')
    expect(violations[0]?.percentOver).toBeCloseTo(0.101, 3)
  })

  test('fails each offending metric independently, in metric order', () => {
    const violations = evaluateBudget(
      stats({ cssGzip: 2500, fontsRaw: 4000, transferGzip: 11001 }),
      BASE,
    )
    expect(violations.map((violation) => violation.metric)).toEqual(['cssGzip', 'transferGzip'])
  })

  test('tolerance is overridable', () => {
    expect(evaluateBudget(stats({ jsGzip: 1100 }), BASE, 0)).toHaveLength(1)
    expect(evaluateBudget(stats({ jsGzip: 1199 }), BASE, 0.2)).toEqual([])
  })

  test('any growth from a zero baseline is a violation', () => {
    const violations = evaluateBudget(stats({ fontsRaw: 1 }), stats({}))
    expect(violations).toHaveLength(1)
    expect(violations[0]?.metric).toBe('fontsRaw')
    expect(violations[0]?.percentOver).toBe(Number.POSITIVE_INFINITY)
  })
})

describe('parseBaselineJson', () => {
  test('accepts a valid baseline', () => {
    expect(parseBaselineJson({ jsGzip: 1, cssGzip: 2, fontsRaw: 3, transferGzip: 4 })).toEqual(
      stats({ jsGzip: 1, cssGzip: 2, fontsRaw: 3, transferGzip: 4 }),
    )
  })

  test.each([undefined, null, 42, 'x', [], { jsGzip: 1 }])(
    'rejects malformed input %#',
    (input) => {
      expect(() => parseBaselineJson(input)).toThrow()
    },
  )

  test('rejects negative and non-finite metric values', () => {
    const negative = { jsGzip: -1, cssGzip: 2, fontsRaw: 3, transferGzip: 4 }
    const nan = { jsGzip: Number.NaN, cssGzip: 2, fontsRaw: 3, transferGzip: 4 }
    expect(() => parseBaselineJson(negative)).toThrow(/jsGzip/)
    expect(() => parseBaselineJson(nan)).toThrow(/jsGzip/)
  })
})

describe('budget data sanity', () => {
  test('every metric has a positive absolute budget', () => {
    for (const metric of BUDGET_METRICS) {
      expect(ABSOLUTE_BUDGETS[metric]).toBeGreaterThan(0)
    }
  })

  test('formatBytes uses decimal kB', () => {
    expect(formatBytes(0)).toBe('0.0 KB')
    expect(formatBytes(68_740)).toBe('68.7 KB')
  })
})
