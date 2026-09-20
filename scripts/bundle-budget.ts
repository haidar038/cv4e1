/**
 * Bundle budget rules for cv4every1, expressed as data + pure functions.
 *
 * Source of truth: docs/07-quality/performance-budget.md §1 (NFR-008, D24).
 *
 * Two layers of enforcement, deliberately different in severity:
 *
 *   1. Ratchet (fatal): no metric may exceed the stored baseline by more than
 *      RATCHET_TOLERANCE. This is the CI gate — it stops silent bundle growth
 *      while the app is being built out.
 *   2. Absolute budgets (warning): the §1 targets. The first production build
 *      already exceeds the CSS and font targets (documented debt in §1), so
 *      these are reported but non-fatal until the cleanup lands.
 *
 * This module performs no I/O (gzipSync is deterministic computation), so it
 * is unit-testable on its own. The filesystem walk lives in
 * `check-bundle-size.ts`.
 */

import { gzipSync } from 'node:zlib'

/**
 * Metrics tracked in `scripts/bundle-baseline.json` and enforced by the ratchet.
 *
 * `jsGzip` is the gzip of *every* JS file in dist/ — all chunks, eager and lazy
 * — and therefore cannot express the cost of the first visit. `initialJsGzip`
 * is the JS referenced by dist/index.html: what the first visit actually
 * downloads and executes. The §1 200 KB target is a budget for the initial
 * chunk, so it is judged against `initialJsGzip`.
 */
export type MetricName = 'initialJsGzip' | 'jsGzip' | 'cssGzip' | 'fontsRaw' | 'transferGzip'

export interface BundleStats {
  readonly initialJsGzip: number
  readonly jsGzip: number
  readonly cssGzip: number
  readonly fontsRaw: number
  readonly transferGzip: number
}

export const BUDGET_METRICS: readonly MetricName[] = [
  'initialJsGzip',
  'jsGzip',
  'cssGzip',
  'fontsRaw',
  'transferGzip',
]

/** Absolute targets from performance-budget.md §1, in bytes. */
export const ABSOLUTE_BUDGETS: Readonly<Record<MetricName, number>> = {
  initialJsGzip: 200 * 1000,
  jsGzip: 200 * 1000,
  cssGzip: 30 * 1000,
  fontsRaw: 100 * 1000,
  transferGzip: 400 * 1000,
}

/** Allowed growth over the stored baseline before the gate fails (D24). */
export const RATCHET_TOLERANCE = 0.1

export type AssetKind = 'js' | 'css' | 'font' | 'other'

export function classifyFile(filePath: string): AssetKind {
  const lower = filePath.toLowerCase()
  if (lower.endsWith('.js') || lower.endsWith('.mjs')) return 'js'
  if (lower.endsWith('.css')) return 'css'
  if (lower.endsWith('.woff') || lower.endsWith('.woff2') || lower.endsWith('.ttf')) return 'font'
  if (lower.endsWith('.otf')) return 'font'
  return 'other'
}

export interface DistFileInput {
  readonly path: string
  readonly bytes: Uint8Array
}

/**
 * Extracts the JS asset names referenced by dist/index.html. These are the
 * chunks a first visit downloads eagerly; everything else in dist/ is lazy.
 * Returns dist-relative POSIX paths like `assets/index-abc123.js`, with any
 * leading slash from absolute srcs stripped so they match the dist walk.
 */
export function entryJsFiles(html: string): string[] {
  return [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+\.js)["']/g)]
    .map((match) => match[1]?.replace(/^\//, ''))
    .filter((src): src is string => src !== undefined && src !== '')
}

/**
 * Aggregates raw dist/ files into the tracked metrics. Text assets (JS, CSS)
 * are measured gzipped because that is what the wire carries; fonts are
 * measured raw because woff2 is already compressed. `transferGzip` estimates
 * first-visit transfer: the gzip of every file in dist/.
 */
export function computeStats(files: readonly DistFileInput[]): BundleStats {
  const html = files.find((file) => file.path === 'index.html')
  const eagerJs =
    html === undefined
      ? new Set<string>()
      : new Set(entryJsFiles(new TextDecoder().decode(html.bytes)))

  let initialJsGzip = 0
  let jsGzip = 0
  let cssGzip = 0
  let fontsRaw = 0
  let transferGzip = 0

  for (const file of files) {
    const gzipped = gzipSync(file.bytes).length
    const kind = classifyFile(file.path)
    if (kind === 'js') {
      jsGzip += gzipped
      // index.html references like `assets/index-abc.js`; normalize the same
      // way the walk does (OS separators → POSIX) before comparing.
      if (eagerJs.has(file.path.replaceAll('\\', '/'))) initialJsGzip += gzipped
    }
    if (kind === 'css') cssGzip += gzipped
    if (kind === 'font') fontsRaw += file.bytes.length
    transferGzip += gzipped
  }

  return { initialJsGzip, jsGzip, cssGzip, fontsRaw, transferGzip }
}

export interface BudgetViolation {
  readonly metric: MetricName
  readonly baseline: number
  readonly current: number
  /** (current - baseline) / baseline; Infinity when the baseline is 0. */
  readonly percentOver: number
}

export function evaluateBudget(
  current: BundleStats,
  baseline: BundleStats,
  tolerance: number = RATCHET_TOLERANCE,
): BudgetViolation[] {
  const violations: BudgetViolation[] = []

  for (const metric of BUDGET_METRICS) {
    const base = baseline[metric]
    const now = current[metric]
    if (now > base * (1 + tolerance)) {
      violations.push({
        metric,
        baseline: base,
        current: now,
        percentOver: base === 0 ? Number.POSITIVE_INFINITY : (now - base) / base,
      })
    }
  }

  return violations
}

/**
 * Validates untrusted JSON (our own baseline file, but still untrusted input)
 * into BundleStats. Throws with an actionable message; the CLI wrapper exits 1.
 */
export function parseBaselineJson(input: unknown): BundleStats {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new Error('bundle baseline must be a JSON object')
  }

  const record = input as Record<string, unknown>
  const parsed: Record<MetricName, number> = {
    initialJsGzip: 0,
    jsGzip: 0,
    cssGzip: 0,
    fontsRaw: 0,
    transferGzip: 0,
  }

  for (const metric of BUDGET_METRICS) {
    const value = record[metric]
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      throw new Error(
        `bundle baseline is invalid: "${metric}" must be a finite non-negative number — rebuild it with: bun scripts/check-bundle-size.ts --update`,
      )
    }
    parsed[metric] = value
  }

  return parsed
}

/** Decimal kB, matching Vite's reporting and the budget doc's "KB" convention. */
export function formatBytes(bytes: number): string {
  return `${(bytes / 1000).toFixed(1)} KB`
}
