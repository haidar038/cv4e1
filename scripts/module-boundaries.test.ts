import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  MODULE_RULES,
  extractImportSpecifiers,
  findBoundaryViolations,
  moduleOfFile,
  packageNameOf,
  resolveTarget,
  type ImportRef,
} from './module-boundaries.ts'
import { collectSourceFiles } from './source-files.ts'

/** Builds an ImportRef for tests that only care about file + specifier. */
function ref(file: string, specifier: string, line = 1): ImportRef {
  return { file, line, specifier }
}

describe('moduleOfFile', () => {
  it('maps src/<module>/... to its module', () => {
    expect(moduleOfFile('src/core/schema.ts')).toBe('core')
    expect(moduleOfFile('src/storage/db.ts')).toBe('storage')
    expect(moduleOfFile('src/render/ats/ATSRenderer.tsx')).toBe('render')
    expect(moduleOfFile('src/features/store/document-store.ts')).toBe('features')
    expect(moduleOfFile('src/content/microcopy/id.ts')).toBe('content')
    expect(moduleOfFile('src/ai/provider.ts')).toBe('ai')
  })

  it('returns null for unconstrained locations', () => {
    expect(moduleOfFile('src/components/ui/button.tsx')).toBeNull()
    expect(moduleOfFile('src/lib/utils.ts')).toBeNull()
    expect(moduleOfFile('src/hooks/use-mobile.ts')).toBeNull()
    expect(moduleOfFile('src/App.tsx')).toBeNull()
  })

  it('returns null outside src/', () => {
    expect(moduleOfFile('scripts/check-boundaries.ts')).toBeNull()
    expect(moduleOfFile('fixtures/full-document.json')).toBeNull()
    expect(moduleOfFile('e2e/smoke.spec.ts')).toBeNull()
  })
})

describe('resolveTarget', () => {
  it('resolves same-module relative specifiers', () => {
    expect(resolveTarget('./db', 'src/storage/repository.ts')).toEqual({
      kind: 'module',
      module: 'storage',
    })
  })

  it('resolves cross-module relative specifiers (the evasion a path-pattern check misses)', () => {
    expect(resolveTarget('../core/schema', 'src/storage/repository.ts')).toEqual({
      kind: 'module',
      module: 'core',
    })
    expect(resolveTarget('../../storage/db', 'src/core/some/deep.ts')).toEqual({
      kind: 'module',
      module: 'storage',
    })
    expect(resolveTarget('../render/ats/ATSRenderer', 'src/storage/export.ts')).toEqual({
      kind: 'module',
      module: 'render',
    })
  })

  it('resolves @/ alias specifiers', () => {
    expect(resolveTarget('@/storage/repository', 'src/features/x.ts')).toEqual({
      kind: 'module',
      module: 'storage',
    })
    expect(resolveTarget('@/core/schema', 'src/features/x.ts')).toEqual({
      kind: 'module',
      module: 'core',
    })
  })

  it('treats bare specifiers as packages', () => {
    expect(resolveTarget('react', 'src/core/x.ts')).toEqual({
      kind: 'package',
      packageName: 'react',
    })
    expect(resolveTarget('@phosphor-icons/react', 'src/core/x.ts')).toEqual({
      kind: 'package',
      packageName: '@phosphor-icons/react',
    })
    expect(resolveTarget('react/jsx-runtime', 'src/render/x.tsx')).toEqual({
      kind: 'package',
      packageName: 'react',
    })
  })

  it('classifies fixtures and unconstrained src dirs as outside the module system', () => {
    expect(
      resolveTarget('../../fixtures/full-document.json', 'src/core/normalize.test.ts'),
    ).toEqual({
      kind: 'outside',
      path: 'fixtures/full-document.json',
    })
    expect(resolveTarget('@/components/ui/button', 'src/features/x.tsx')).toEqual({
      kind: 'outside',
      path: '@/components/ui/button',
    })
  })
})

describe('packageNameOf', () => {
  it('returns the bare package name, including scoped subpaths', () => {
    expect(packageNameOf('zod')).toBe('zod')
    expect(packageNameOf('dexie')).toBe('dexie')
    expect(packageNameOf('@scope/pkg')).toBe('@scope/pkg')
    expect(packageNameOf('@scope/pkg/sub/path')).toBe('@scope/pkg')
  })
})

describe('extractImportSpecifiers', () => {
  it('extracts static, side-effect, type-only, re-export and dynamic imports', () => {
    const source = [
      "import { z } from 'zod'",
      "import './polyfill'",
      "import type { ATSViewModel } from './view-models'",
      "export { x } from './y'",
      "export * from './z'",
      "const mod = await import('./lazy')",
    ].join('\n')

    const specifiers = extractImportSpecifiers(source, 'src/core/sample.ts').map((r) => r.specifier)
    expect(specifiers).toEqual(['zod', './polyfill', './view-models', './y', './z', './lazy'])
  })

  it('handles multi-line named imports', () => {
    const source = ['import {', '  a,', '  b,', "} from './multi'"].join('\n')
    const refs = extractImportSpecifiers(source, 'src/core/sample.ts')
    expect(refs).toHaveLength(1)
    expect(refs[0]?.specifier).toBe('./multi')
    expect(refs[0]?.line).toBe(1)
  })

  it('reports the line number of each import', () => {
    const source = ['// header', '', "import { a } from './a'", '', "import { b } from './b'"].join(
      '\n',
    )
    const refs = extractImportSpecifiers(source, 'src/core/sample.ts')
    expect(refs.map((r) => r.line)).toEqual([3, 5])
  })

  it('ignores imports that only appear inside comments', () => {
    const source = [
      "// import { bad } from '../storage/db'",
      '/*',
      "import { alsoBad } from '../render/x'",
      '*/',
      "import { good } from './good'",
    ].join('\n')

    const refs = extractImportSpecifiers(source, 'src/core/sample.ts')
    expect(refs.map((r) => r.specifier)).toEqual(['./good'])
  })
})

describe('findBoundaryViolations', () => {
  it('allows the documented dependency directions', () => {
    const imports = [
      ref('src/core/schema.ts', 'zod'),
      ref('src/storage/repository.ts', 'dexie'),
      ref('src/storage/repository.ts', '../core/schema'),
      ref('src/storage/repository.ts', './db'),
      ref('src/render/ats/ATSRenderer.tsx', 'react'),
      ref('src/render/ats/ATSRenderer.tsx', '../../core/view-models'),
      ref('src/features/form/BasicsForm.tsx', '@/render/ats/ATSRenderer'),
      ref('src/features/form/BasicsForm.tsx', '@/storage/repository'),
      ref('src/components/ui/button.tsx', 'react'),
    ]
    expect(findBoundaryViolations(imports)).toEqual([])
  })

  it('rejects core/ importing a package outside its allowlist', () => {
    const violations = findBoundaryViolations([ref('src/core/bad.ts', 'react', 7)])
    expect(violations).toHaveLength(1)
    expect(violations[0]?.from).toBe('core')
    expect(violations[0]?.to).toBe('package:react')
    expect(violations[0]?.line).toBe(7)
  })

  it('counts type-only imports as real dependencies', () => {
    const source = "import type { CSSProperties } from 'react'"
    const violations = findBoundaryViolations(extractImportSpecifiers(source, 'src/core/sample.ts'))
    expect(violations).toHaveLength(1)
    expect(violations[0]?.to).toBe('package:react')
  })

  it('rejects render/ reaching into storage/, including via relative paths', () => {
    const viaRelative = findBoundaryViolations([
      ref('src/render/ats/sections/Edu.tsx', '../../../storage/db'),
    ])
    const viaAlias = findBoundaryViolations([
      ref('src/render/ats/ATSRenderer.tsx', '@/storage/repository'),
    ])
    expect(viaRelative[0]?.to).toBe('storage')
    expect(viaAlias[0]?.to).toBe('storage')
  })

  it('rejects storage/ importing render/, and core/ importing storage/', () => {
    const storageToRender = findBoundaryViolations([
      ref('src/storage/export.ts', '../render/ats/ATSRenderer'),
    ])
    const coreToStorage = findBoundaryViolations([ref('src/core/x.ts', '../storage/db')])
    expect(storageToRender[0]?.to).toBe('render')
    expect(coreToStorage[0]?.to).toBe('storage')
  })

  it('rejects content/ importing anything, including packages', () => {
    const violations = findBoundaryViolations([
      ref('src/content/action-verbs/index.ts', '../../core/schema'),
      ref('src/content/microcopy/id.ts', 'date-fns'),
    ])
    expect(violations.map((v) => v.to)).toEqual(['core', 'package:date-fns'])
  })

  it('allows test tooling inside any module', () => {
    const imports = [
      ref('src/core/schema.test.ts', 'vitest'),
      ref('src/storage/repository.test.ts', 'fake-indexeddb/auto'),
    ]
    expect(findBoundaryViolations(imports)).toEqual([])
  })

  it('does not constrain unclassified src directories', () => {
    expect(findBoundaryViolations([ref('src/lib/utils.ts', 'clsx')])).toEqual([])
  })

  it('declares a rule for every module directory', () => {
    expect(Object.keys(MODULE_RULES).sort()).toEqual([
      'ai',
      'content',
      'core',
      'features',
      'render',
      'storage',
    ])
  })
})

describe('the real repository', () => {
  it('passes its own boundary rules', () => {
    const files = collectSourceFiles('src')
    // Guards against a silently empty walk passing this test for the wrong reason.
    expect(files).toContain('src/core/schema.ts')
    expect(files.length).toBeGreaterThan(10)

    const imports = files.flatMap((file) =>
      extractImportSpecifiers(readFileSync(file, 'utf8'), file),
    )
    expect(imports.length).toBeGreaterThan(10)

    expect(findBoundaryViolations(imports)).toEqual([])
  })
})
