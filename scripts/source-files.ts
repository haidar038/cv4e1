/**
 * Filesystem walker for source files, kept separate so that the boundary rules
 * themselves stay free of I/O and directly unit-testable.
 */

import { readdirSync } from 'node:fs'

/** Extensions that participate in the import-graph boundary check. */
const SOURCE_EXTENSIONS = ['.ts', '.tsx'] as const

/**
 * Collects repo-relative POSIX paths of every source file under `root`.
 * Paths always use `/` so that results are identical on Windows and Linux.
 */
export function collectSourceFiles(root: string): string[] {
  const files: string[] = []

  const walk = (dir: string): void => {
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      // Forward slashes work on every platform, and keep path handling POSIX-only.
      const path = `${dir}/${entry.name}`
      if (entry.isDirectory()) {
        walk(path)
        continue
      }
      if (SOURCE_EXTENSIONS.some((extension) => entry.name.endsWith(extension))) {
        files.push(path)
      }
    }
  }

  walk(root)
  return files.sort()
}
