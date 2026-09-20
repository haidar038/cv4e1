/**
 * CLI wrapper around the privacy rules (NFR-006, NFR-011).
 *
 * Usage:
 *   bun scripts/check-privacy.ts               check src/ (console) and dist/ (secrets)
 *   bun scripts/check-privacy.ts --skip-dist   source-only; used knowingly, e.g. before a build
 *
 * Exit codes: 0 = clean; 1 = violations, or dist/ missing/empty in full mode
 * (a silently skipped secret scan would prove nothing).
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { collectSourceFiles } from './source-files.ts'
import {
  findConsoleViolations,
  findSecretViolations,
  type DistFileInput,
  type SourceFileInput,
} from './privacy-rules.ts'

const DIST_ROOT = 'dist'
const SCANNED_DIST_EXTENSIONS = ['.js', '.mjs', '.css', '.html'] as const

function collectDistTextFiles(root: string): DistFileInput[] {
  const files: DistFileInput[] = []
  // Bun's fs types type recursive entries as `string | Buffer`; coerce to string.
  for (const dirent of readdirSync(root, { recursive: true })) {
    const entry = dirent.toString()
    if (!SCANNED_DIST_EXTENSIONS.some((extension) => entry.toLowerCase().endsWith(extension))) {
      continue
    }
    const full = join(root, entry)
    if (!statSync(full).isFile()) continue
    // readdirSync may return OS separators; reports key on POSIX paths.
    files.push({ path: entry.replaceAll('\\', '/'), source: readFileSync(full, 'utf8') })
  }
  return files
}

function collectProductSources(): SourceFileInput[] {
  return collectSourceFiles('src').map((file) => ({
    file,
    source: readFileSync(file, 'utf8'),
  }))
}

function main(): void {
  const skipDist = process.argv.slice(2).includes('--skip-dist')

  const consoleViolations = findConsoleViolations(collectProductSources())
  if (consoleViolations.length > 0) {
    console.error(
      'check:privacy: NFR-011 — console calls outside the allowlist (docs: privacy-and-data-handling.md):',
    )
    for (const violation of consoleViolations) {
      console.error(`  ${violation.file}:${violation.line} — ${violation.reason}`)
    }
  }

  let secretViolations = findSecretViolations([])
  if (skipDist) {
    console.log('check:privacy: dist/ scan skipped (--skip-dist) — the secret check did not run.')
  } else if (!existsSync(DIST_ROOT)) {
    console.error(
      `check:privacy: "${DIST_ROOT}/" does not exist — run "bun run build" first, or pass --skip-dist knowingly.`,
    )
    process.exitCode = 1
  } else {
    const distFiles = collectDistTextFiles(DIST_ROOT)
    if (distFiles.length === 0) {
      console.error(
        `check:privacy: "${DIST_ROOT}/" contains no scannable files — run "bun run build" first.`,
      )
      process.exitCode = 1
    } else {
      secretViolations = findSecretViolations(distFiles)
      if (secretViolations.length > 0) {
        console.error(
          'check:privacy: NFR-006 — credential-shaped literals in the production build:',
        )
        for (const violation of secretViolations) {
          console.error(
            `  ${violation.file} — ${violation.description} (${violation.patternId}): ${violation.excerpt}`,
          )
        }
      }
    }
  }

  if (consoleViolations.length === 0 && secretViolations.length === 0 && process.exitCode !== 1) {
    console.log(
      skipDist
        ? 'check:privacy: OK — no non-allowlisted console calls in product source (NFR-011); secret scan skipped (--skip-dist).'
        : 'check:privacy: OK — no secrets in the build (NFR-006), no non-allowlisted console calls in product source (NFR-011).',
    )
  } else if (consoleViolations.length > 0 || secretViolations.length > 0) {
    process.exitCode = 1
  }
}

main()
