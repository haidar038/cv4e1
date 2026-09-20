import { describe, expect, test } from 'vitest'
import {
  CONSOLE_ALLOWLIST,
  findConsoleViolations,
  findSecretViolations,
  isTestFile,
} from './privacy-rules.ts'

describe('findSecretViolations (NFR-006)', () => {
  const scan = (source: string) => findSecretViolations([{ path: 'dist/assets/index.js', source }])

  test('flags known credential formats in the bundle', () => {
    const violations = scan(
      [
        'const key = "sk-proj-abcdefghij0123456789"',
        'const at = "sk-ant-api03-abcdefghij0123456789"',
        'const g = "AIzaSyA1234567890abcdefghijklmnopqrstuv"',
        'const t = "ghp_abcdefghijklmnopqrstuvwx0123456789ABCD"',
        'const s = "xoxb-123456789012-abcdefghijklmnop"',
        'const a = "AKIAIOSFODNN7EXAMPLE"',
        'const h = "Bearer abcdef0123456789abcdef0123456789"',
        'const j = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.SflKxwRJSMeK"',
      ].join('\n'),
    )
    expect(violations.map((v) => v.patternId)).toEqual(
      expect.arrayContaining([
        'openai-key',
        'anthropic-key',
        'google-api-key',
        'github-token',
        'slack-token',
        'aws-access-key',
        'bearer-literal',
        'jwt',
      ]),
    )
  })

  test('flags private key blocks and secret-shaped assignments', () => {
    const violations = scan(
      '-----BEGIN RSA PRIVATE KEY-----\nconst cfg = { apiKey: "abcd1234efgh5678" }',
    )
    expect(violations.map((v) => v.patternId)).toEqual(
      expect.arrayContaining(['private-key', 'secret-assignment']),
    )
  })

  test('does not flag human sentences, short values, or placeholder names', () => {
    // "placeholder" here is the *key name*, not a key-shaped assignment of a long value.
    const clean = [
      'const label = "Masukkan API key Anda di sini"',
      'const cfg = { apiKey: "" }',
      'const cfg = { token: "x" }',
      'const msg = "Password minimal delapan karakter dan mengandung angka."',
      'const url = "https://contoh.id/?q=teks+bebas+berita+biasa"',
    ].join('\n')
    expect(scan(clean)).toEqual([])
  })

  test('reports an excerpt that does not contain the full secret', () => {
    const secret = 'sk-proj-0123456789abcdefghijklmnop'
    const [violation] = scan(`const k = "${secret}";`)
    expect(violation).toBeDefined()
    expect(violation?.excerpt.includes(secret)).toBe(false)
  })

  test('scans css and html inputs too, keyed by path', () => {
    const violations = findSecretViolations([
      {
        path: 'dist/index.html',
        source: '<meta name="api-key" content="AIzaSyA1234567890abcdefghijklmnopqrstuv">',
      },
    ])
    expect(violations[0]?.file).toBe('dist/index.html')
  })
})

describe('findConsoleViolations (NFR-011)', () => {
  const scan = (source: string, file = 'src/features/store/actions.ts') =>
    findConsoleViolations([{ file, source }])

  test('allowlists the exact diagnostic messages that exist today', () => {
    const source = CONSOLE_ALLOWLIST.map((message) => `console.warn('${message}', error)`).join(
      '\n',
    )
    expect(scan(source)).toEqual([])
  })

  test('rejects interpolation — the channel resume data would flow through', () => {
    expect(scan('console.warn("draft:", doc)')).toHaveLength(1)
    expect(scan('console.warn(`saved ${doc.basics.name}`)')).toHaveLength(1)
    expect(scan('console.log(doc)')).toHaveLength(1)
    expect(scan('console.info(someVariable)')).toHaveLength(1)
  })

  test('rejects allowlisted prefixes with anything appended', () => {
    // The allowlist entry is a full exact match of the first argument, so
    // appending resume content to an approved message is still a violation.
    expect(scan(`console.warn('${CONSOLE_ALLOWLIST[0]} ' + doc.basics.name)`)).toHaveLength(1)
  })

  test('rejects unknown fixed messages — the list is closed', () => {
    expect(scan('console.warn("new message")')).toHaveLength(1)
  })

  test('covers every console method that could emit content', () => {
    for (const method of ['log', 'warn', 'error', 'info', 'debug', 'trace', 'dir', 'table']) {
      expect(scan(`console.${method}(doc)`)).toHaveLength(1)
    }
  })

  test('skips test files — they never ship in the bundle', () => {
    expect(scan('console.log(doc)', 'src/features/store/store.test.ts')).toEqual([])
    expect(scan('console.log(doc)', 'src/test/setup.dom.ts')).toEqual([])
  })

  test('reports the line number of the offending call', () => {
    const [violation] = scan('const a = 1\nconst b = 2\nconsole.log(doc)')
    expect(violation?.line).toBe(3)
  })
})

describe('isTestFile', () => {
  test('recognizes the repo’s test conventions', () => {
    expect(isTestFile('src/core/schema.test.ts')).toBe(true)
    expect(isTestFile('src/features/form/FormLayout.dom.test.tsx')).toBe(true)
    expect(isTestFile('src/test/canvas-double.ts')).toBe(true)
    expect(isTestFile('src/features/store/actions.ts')).toBe(false)
    expect(isTestFile('scripts/check-privacy.ts')).toBe(false)
  })
})
