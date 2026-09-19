/**
 * CLI wrapper around the module boundary rules.
 *
 * Usage:  bun scripts/check-boundaries.ts
 * Exit:   1 when a violation is found, 0 otherwise. Never modifies anything.
 */

import { readFileSync } from 'node:fs'
import { collectSourceFiles } from './source-files.ts'
import { extractImportSpecifiers, findBoundaryViolations } from './module-boundaries.ts'

const SOURCE_ROOT = 'src'

function main(): void {
  const files = collectSourceFiles(SOURCE_ROOT)
  const imports = files.flatMap((file) => extractImportSpecifiers(readFileSync(file, 'utf8'), file))
  const violations = findBoundaryViolations(imports)

  if (violations.length === 0) {
    console.log(
      `check:boundaries OK — ${files.length} files, ${imports.length} import specifiers checked.`,
    )
    return
  }

  console.error(`check:boundaries found ${violations.length} violation(s):\n`)
  for (const violation of violations) {
    console.error(`  ${violation.file}:${violation.line}`)
    console.error(`    import "${violation.specifier}"`)
    console.error(`    ${violation.reason}`)
  }
  console.error('\nSee docs/03-architecture/architecture-overview.md §5 for the module table.')
  process.exitCode = 1
}

main()
