import { gzipSync } from 'node:zlib'
import { describe, expect, test } from 'vitest'
import {
  entryJsFiles,
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
  initialJsGzip: 0,
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

describe('entryJsFiles', () => {
  test('extracts every module script src from index.html', () => {
    const html = [
      '<!doctype html>',
      '<html lang="id">',
      '  <head><script type="module" crossorigin src="/assets/index-abc123.js"></script></head>',
      '  <body><div id="root"></div></body>',
      '</html>',
    ].join('\n')
    expect(entryJsFiles(html)).toEqual(['assets/index-abc123.js'])
  })

  test('ignores inline scripts, non-js srcs, and modulepreload links', () => {
    const html = [
      '<script>window.x = 1</script>',
      '<link rel="modulepreload" href="/assets/preload-abc.js">',
      '<script type="module">import "./x"</script>',
    ].join('\n')
    expect(entryJsFiles(html)).toEqual([])
  })
})

describe('computeStats', () => {
  const jsBytes = Buffer.from('console.log("hello world")\n')
  const cssBytes = Buffer.from('body{margin:0}\n')
  const fontBytes = Buffer.from([0x77, 0x4f, 0x46, 0x32, 0, 1, 2, 3])
  const htmlBytes = Buffer.from(
    '<!doctype html><script type="module" src="assets/index-a1b2.js"></script><div id="root"></div>',
  )

  test('aggregates per kind and estimates transfer as the sum of all gzips', () => {
    const files = [
      { path: 'assets/index-a1b2.js', bytes: jsBytes },
      { path: 'assets/index-a1b2.css', bytes: cssBytes },
      { path: 'assets/roboto-latin.woff2', bytes: fontBytes },
      { path: 'index.html', bytes: htmlBytes },
    ]

    expect(computeStats(files)).toEqual({
      initialJsGzip: gzipSync(jsBytes).length,
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

  test('a lazy chunk counts toward jsGzip but not initialJsGzip', () => {
    const htmlBytes = Buffer.from('<script type="module" src="assets/index-entry.js"></script>')
    const files = [
      { path: 'assets/index-entry.js', bytes: jsBytes },
      { path: 'assets/export-import-chunk.js', bytes: jsBytes },
      { path: 'index.html', bytes: htmlBytes },
    ]
    const result = computeStats(files)
    expect(result.jsGzip).toBe(2 * gzipSync(jsBytes).length)
    expect(result.initialJsGzip).toBe(gzipSync(jsBytes).length)
    expect(result.transferGzip).toBe(2 * gzipSync(jsBytes).length + gzipSync(htmlBytes).length)
  })

  test('JS with no index.html present is counted entirely as lazy', () => {
    const files = [{ path: 'assets/orphan.js', bytes: jsBytes }]
    const result = computeStats(files)
    expect(result.jsGzip).toBe(gzipSync(jsBytes).length)
    expect(result.initialJsGzip).toBe(0)
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
  const BASE = stats({
    initialJsGzip: 800,
    jsGzip: 1000,
    cssGzip: 2000,
    fontsRaw: 5000,
    transferGzip: 10000,
  })

  test('passes when nothing grew', () => {
    expect(evaluateBudget(BASE, BASE)).toEqual([])
  })

  test('passes when metrics shrank', () => {
    expect(evaluateBudget(stats({ initialJsGzip: 1, jsGzip: 1 }), BASE)).toEqual([])
  })

  test('passes at exactly the +10% ratchet edge', () => {
    expect(evaluateBudget(stats({ initialJsGzip: 880, jsGzip: 1100 }), BASE)).toEqual([])
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

  test('initial chunk growth is judged independently of lazy chunk growth', () => {
    // Lazy chunk doubled — jsGzip over the ratchet, initialJsGzip untouched.
    const lazyGrowth = evaluateBudget(stats({ jsGzip: 2000, initialJsGzip: 800 }), BASE)
    expect(lazyGrowth.map((violation) => violation.metric)).toEqual(['jsGzip'])
    // Initial chunk grew — initialJsGzip over, jsGzip within.
    const initialGrowth = evaluateBudget(stats({ jsGzip: 1050, initialJsGzip: 900 }), BASE)
    expect(initialGrowth.map((violation) => violation.metric)).toEqual(['initialJsGzip'])
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
    expect(
      parseBaselineJson({ initialJsGzip: 1, jsGzip: 2, cssGzip: 3, fontsRaw: 4, transferGzip: 5 }),
    ).toEqual(stats({ initialJsGzip: 1, jsGzip: 2, cssGzip: 3, fontsRaw: 4, transferGzip: 5 }))
  })

  test.each([undefined, null, 42, 'x', [], { jsGzip: 1 }])(
    'rejects malformed input %#',
    (input) => {
      expect(() => parseBaselineJson(input)).toThrow()
    },
  )

  test('rejects negative and non-finite metric values', () => {
    const negative = { initialJsGzip: -1, jsGzip: 2, cssGzip: 3, fontsRaw: 4, transferGzip: 5 }
    const nan = { initialJsGzip: Number.NaN, jsGzip: 2, cssGzip: 3, fontsRaw: 4, transferGzip: 5 }
    expect(() => parseBaselineJson(negative)).toThrow(/initialJsGzip/)
    expect(() => parseBaselineJson(nan)).toThrow(/initialJsGzip/)
  })

  test('rejects a legacy baseline that predates initialJsGzip', () => {
    expect(() =>
      parseBaselineJson({ jsGzip: 1, cssGzip: 2, fontsRaw: 3, transferGzip: 4 }),
    ).toThrow(/initialJsGzip/)
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
