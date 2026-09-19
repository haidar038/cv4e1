/**
 * Module boundary rules for cv4every1, expressed as data.
 *
 * Source of truth: docs/03-architecture/architecture-overview.md §5
 * (mirrored in plans/cv4every1-fase-1-mvp.md):
 *
 *   core/     may depend on nothing    (no React, DOM, storage, network)
 *   storage/  may depend on core/
 *   render/   may depend on core/      (never storage/, ai/, network)
 *   ai/       may depend on core/      (never storage/, render/)
 *   content/  may depend on nothing
 *   features/ may depend on anything
 *
 * Everything under `src/` that is not one of those directories — shared UI
 * primitives, `lib/`, `hooks/`, `App.tsx` — is unconstrained, because the
 * architecture table defines no rule for it. It is therefore never reported as
 * a violation target.
 *
 * This module performs no I/O and touches no DOM, so it is unit-testable on its
 * own. The filesystem walk lives in `source-files.ts`.
 */

export const MODULE_DIRS = ['ai', 'content', 'core', 'features', 'render', 'storage'] as const

export type ModuleName = (typeof MODULE_DIRS)[number]

export interface ModuleRule {
  /** Modules this module may import from, via relative path or `@/` alias. */
  readonly allowedModules: readonly ModuleName[]
  /**
   * Bare package specifiers this module may import.
   * `undefined` means no external-dependency policy is enforced.
   */
  readonly allowedPackages?: readonly string[]
}

/** Test-runner tooling is not a product dependency, and is allowed everywhere. */
const TEST_TOOLING: readonly string[] = ['vitest', 'fake-indexeddb']

export const MODULE_RULES: Readonly<Record<ModuleName, ModuleRule>> = {
  core: { allowedModules: [], allowedPackages: ['zod'] },
  storage: { allowedModules: ['core'], allowedPackages: ['dexie'] },
  render: { allowedModules: ['core'], allowedPackages: ['react'] },
  ai: { allowedModules: ['core'], allowedPackages: [] },
  content: { allowedModules: [], allowedPackages: [] },
  features: { allowedModules: [...MODULE_DIRS] },
}

const SOURCE_PREFIX = 'src/'

export function isModuleName(value: string | undefined): value is ModuleName {
  return value !== undefined && (MODULE_DIRS as readonly string[]).includes(value)
}

/**
 * Maps a repo-relative POSIX path to the module that owns it.
 * Returns null for unconstrained locations, including everything outside `src/`.
 */
export function moduleOfFile(file: string): ModuleName | null {
  if (!file.startsWith(SOURCE_PREFIX)) return null
  const topLevelDir = file.slice(SOURCE_PREFIX.length).split('/')[0]
  return isModuleName(topLevelDir) ? topLevelDir : null
}

// --- POSIX path helpers (no `node:path`, so this stays platform-independent) ---

function dirname(file: string): string {
  const index = file.lastIndexOf('/')
  return index === -1 ? '' : file.slice(0, index)
}

function joinPath(base: string, relative: string): string {
  const stack: string[] = []
  for (const segment of [...base.split('/'), ...relative.split('/')]) {
    if (segment === '' || segment === '.') continue
    if (segment === '..') {
      stack.pop()
      continue
    }
    stack.push(segment)
  }
  return stack.join('/')
}

/** `zod` → `zod`; `@scope/pkg/sub` → `@scope/pkg`. */
export function packageNameOf(specifier: string): string {
  const [first, second] = specifier.split('/')
  if (first === undefined) return specifier
  if (!first.startsWith('@')) return first
  return second === undefined ? first : `${first}/${second}`
}

// --- Target resolution ---

export type ResolvedTarget =
  | { readonly kind: 'module'; readonly module: ModuleName }
  | { readonly kind: 'package'; readonly packageName: string }
  | { readonly kind: 'outside'; readonly path: string }

/**
 * Resolves a specifier written inside `importerFile` to a module, a bare package,
 * or something outside the module system (fixtures, assets, unconstrained src dirs).
 */
export function resolveTarget(specifier: string, importerFile: string): ResolvedTarget {
  if (specifier.startsWith('.')) {
    // Relative specifiers are exactly what a path-pattern check would miss.
    const resolved = joinPath(dirname(importerFile), specifier)
    const module = moduleOfFile(resolved)
    return module === null ? { kind: 'outside', path: resolved } : { kind: 'module', module }
  }
  if (specifier.startsWith('@/')) {
    const module = moduleOfFile(`${SOURCE_PREFIX}${specifier.slice(2)}`)
    return module === null ? { kind: 'outside', path: specifier } : { kind: 'module', module }
  }
  return { kind: 'package', packageName: packageNameOf(specifier) }
}

// --- Import extraction ---

export interface ImportRef {
  /** Repo-relative POSIX path of the importing file. */
  readonly file: string
  /** 1-based line number of the import statement. */
  readonly line: number
  /** Specifier exactly as written in source. */
  readonly specifier: string
}

export interface BoundaryViolation extends ImportRef {
  readonly from: ModuleName
  /** Module name, or `package:<name>` for the offending target. */
  readonly to: string
  readonly reason: string
}

/**
 * A keyword (`import`, `export`, `from`) must not be part of a longer
 * hyphenated token. Without this guard, `\bimport` matches the `import`
 * inside the string `'./export-import'` (word boundary between `-` and `i`),
 * producing a phantom specifier that spans two real imports. `$` and `.` are
 * guarded for the same reason (`a$import 'x'`, `'./x.import'`); ordinary word
 * characters are already excluded by `\b`.
 */
const IMPORT_PATTERNS: readonly RegExp[] = [
  // import ... from 'x'  |  import type ... from 'x'
  /(?<![\w$.\-])\bimport\s+(?:type\s+)?[\s\S]*?(?<![\w$.\-])\bfrom\s*['"]([^'"]+)['"]/g,
  // import 'x'
  /(?<![\w$.\-])\bimport\s*['"]([^'"]+)['"]/g,
  // export { a } from 'x'  |  export * from 'x'  |  export type { a } from 'x'
  /(?<![\w$.\-])\bexport\s+(?:type\s+)?(?:\*|\{[\s\S]*?\})\s*(?<![\w$.\-])\bfrom\s*['"]([^'"]+)['"]/g,
  // import('x')
  /(?<![\w$.\-])\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
]

/**
 * Blanks out comments while preserving offsets, so reported line numbers stay accurate.
 *
 * Heuristic limitation: a `//` inside a string literal is treated as a comment start,
 * which could hide an import written later on that same line. No such line exists in
 * `src/` today; the trade-off is documented rather than hidden.
 */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, '')
}

function buildLineIndex(source: string): number[] {
  const newlineOffsets: number[] = []
  for (let index = 0; index < source.length; index += 1) {
    if (source.charCodeAt(index) === 10) newlineOffsets.push(index)
  }
  return newlineOffsets
}

function lineNumberAt(newlineOffsets: readonly number[], offset: number): number {
  let line = 1
  for (const newlineOffset of newlineOffsets) {
    if (newlineOffset >= offset) break
    line += 1
  }
  return line
}

/**
 * Extracts every import/export specifier in a source file.
 * Type-only imports are included on purpose: `import type` is still a dependency.
 */
export function extractImportSpecifiers(source: string, file: string): ImportRef[] {
  const scanned = stripComments(source)
  const newlineOffsets = buildLineIndex(scanned)
  const seen = new Set<string>()
  const refs: ImportRef[] = []

  for (const pattern of IMPORT_PATTERNS) {
    for (const match of scanned.matchAll(pattern)) {
      const specifier = match[1]
      if (specifier === undefined || match.index === undefined) continue
      const line = lineNumberAt(newlineOffsets, match.index)
      const key = `${line}:${specifier}`
      if (seen.has(key)) continue
      seen.add(key)
      refs.push({ file, line, specifier })
    }
  }

  return refs.sort((a, b) => a.line - b.line || a.specifier.localeCompare(b.specifier))
}

// --- Rule evaluation ---

export function findBoundaryViolations(imports: readonly ImportRef[]): BoundaryViolation[] {
  const violations: BoundaryViolation[] = []

  for (const entry of imports) {
    const from = moduleOfFile(entry.file)
    if (from === null) continue

    const rule = MODULE_RULES[from]
    const target = resolveTarget(entry.specifier, entry.file)

    if (target.kind === 'module') {
      // A module may always import from itself: the rule table lists *other* modules.
      if (target.module !== from && !rule.allowedModules.includes(target.module)) {
        violations.push({
          ...entry,
          from,
          to: target.module,
          reason: `${from}/ must not import ${target.module}/ (architecture-overview.md §5).`,
        })
      }
      continue
    }

    if (target.kind === 'package' && rule.allowedPackages !== undefined) {
      const isAllowed =
        rule.allowedPackages.includes(target.packageName) ||
        TEST_TOOLING.includes(target.packageName)
      if (!isAllowed) {
        const allowed = rule.allowedPackages.length > 0 ? rule.allowedPackages.join(', ') : '(none)'
        violations.push({
          ...entry,
          from,
          to: `package:${target.packageName}`,
          reason: `${from}/ must not import package "${target.packageName}". Allowed: ${allowed}.`,
        })
      }
    }
  }

  return violations
}
