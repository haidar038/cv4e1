/**
 * CLI wrapper around the bundle budget rules (D24, NFR-008).
 *
 * Usage:
 *   bun scripts/check-bundle-size.ts            compare dist/ against scripts/bundle-baseline.json
 *   bun scripts/check-bundle-size.ts --update   rebuild the baseline from the current dist/
 *
 * Exit codes: 0 = within the ratchet; 1 = ratchet violation, missing/empty
 * dist/, or missing/invalid baseline. Absolute-budget overruns
 * (performance-budget.md §1) are printed as warnings, not failures — see the
 * header of `bundle-budget.ts` for why.
 */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  ABSOLUTE_BUDGETS,
  BUDGET_METRICS,
  computeStats,
  evaluateBudget,
  formatBytes,
  parseBaselineJson,
  type BundleStats,
  type DistFileInput,
} from './bundle-budget.ts'

const DIST_ROOT = 'dist'
const BASELINE_FILE = 'scripts/bundle-baseline.json'

function collectDistFiles(root: string): DistFileInput[] {
  const files: DistFileInput[] = []
  // Bun's fs types type recursive entries as `string | Buffer`; coerce to string.
  for (const dirent of readdirSync(root, { recursive: true })) {
    const entry = dirent.toString()
    const full = join(root, entry)
    if (!statSync(full).isFile()) continue
    // readdirSync may return OS separators; the budget rules key on POSIX paths.
    files.push({ path: entry.replaceAll('\\', '/'), bytes: readFileSync(full) })
  }
  return files
}

function loadBaseline(): BundleStats {
  return parseBaselineJson(JSON.parse(readFileSync(BASELINE_FILE, 'utf8')))
}

function describeDelta(base: number, now: number): string {
  if (base === 0) return now === 0 ? '+0.0%' : 'new'
  const percent = ((now - base) / base) * 100
  return `${percent >= 0 ? '+' : ''}${percent.toFixed(1)}%`
}

function printMetricLine(metric: string, base: number, now: number, status: string): void {
  console.log(
    `  ${metric.padEnd(14)}baseline ${formatBytes(base).padStart(8)} · current ${formatBytes(now).padStart(8)} · ${describeDelta(base, now).padStart(7)} · ${status}`,
  )
}

function main(): void {
  const update = process.argv.slice(2).includes('--update')

  if (!existsSync(DIST_ROOT)) {
    console.error(`check:budget: "${DIST_ROOT}/" does not exist — run "bun run build" first.`)
    process.exitCode = 1
    return
  }

  const files = collectDistFiles(DIST_ROOT)
  if (files.length === 0) {
    console.error(`check:budget: "${DIST_ROOT}/" is empty — run "bun run build" first.`)
    process.exitCode = 1
    return
  }

  const current = computeStats(files)

  let baseline: BundleStats
  if (update) {
    writeFileSync(BASELINE_FILE, `${JSON.stringify(current, null, 2)}\n`)
    console.log(
      `check:budget: baseline written to ${BASELINE_FILE} (${files.length} files in dist/).`,
    )
    baseline = current
  } else if (existsSync(BASELINE_FILE)) {
    baseline = loadBaseline()
  } else {
    console.error(`check:budget: ${BASELINE_FILE} not found — create it after a clean build with:`)
    console.error('  bun scripts/check-bundle-size.ts --update')
    process.exitCode = 1
    return
  }

  console.log(`check:budget — ${files.length} files in dist/ · baseline ${BASELINE_FILE}`)
  const violations = evaluateBudget(current, baseline)

  for (const metric of BUDGET_METRICS) {
    const failing = violations.some((violation) => violation.metric === metric)
    printMetricLine(metric, baseline[metric], current[metric], failing ? 'RATCHET FAIL' : 'OK')
  }

  if (violations.length > 0) {
    console.error('')
    console.error('check:budget: bundle grew beyond the ratchet (baseline +10%, decision D24).')
    console.error('If the growth is intended, re-baseline consciously after review:')
    console.error('  bun scripts/check-bundle-size.ts --update')
    process.exitCode = 1
    return
  }

  for (const metric of BUDGET_METRICS) {
    if (current[metric] > ABSOLUTE_BUDGETS[metric]) {
      console.warn(
        `check:budget warning: ${metric} ${formatBytes(current[metric])} is over the performance-budget.md §1 target (${formatBytes(ABSOLUTE_BUDGETS[metric])}) — documented debt, not a gate.`,
      )
    }
  }
}

main()
