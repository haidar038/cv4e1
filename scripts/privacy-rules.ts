/**
 * Privacy rules for cv4every1, expressed as data + pure functions.
 *
 * Requirements: NFR-006, NFR-011. Docs: docs/06-security/privacy-and-data-handling.md.
 *
 * Two checks, deliberately cheap and static:
 *
 *   1. Secret scan of the production build (NFR-006). The dist/ bundle is
 *      scanned for credential-shaped literals. A secret can only reach the
 *      bundle if it is written into source or imported at build time — static
 *      scanning of the artifact is exactly where that would show up.
 *   2. Console-call audit of product source (NFR-011). The only safe way to
 *      keep resume data out of logs is to log nothing but fixed, allowlisted
 *      diagnostic messages. Interpolation (`console.log(doc)`, template
 *      literals) is rejected even when its intent is innocent, because intent
 *      is not reviewable by a gate.
 *
 * This module performs no I/O, so it is unit-testable on its own. The
 * filesystem walk lives in `check-privacy.ts`.
 */

// --- NFR-006: secrets in the production build ---

export interface SecretPattern {
  readonly id: string
  readonly description: string
  readonly pattern: RegExp
}

/**
 * Known credential formats first, then a generic "secret-looking key with a
 * string value" pattern. The generic pattern requires a value of at least 16
 * characters without whitespace — real secrets are long single tokens; human
 * sentences contain spaces and are not flagged.
 */
export const SECRET_PATTERNS: readonly SecretPattern[] = [
  {
    id: 'openai-key',
    description: 'OpenAI-style API key (sk-…)',
    // Negative lookahead keeps `sk-ant-…` keys classified as anthropic-key.
    pattern: /\bsk-(?!ant-)[A-Za-z0-9-]{20,}\b/,
  },
  {
    id: 'anthropic-key',
    description: 'Anthropic-style API key (sk-ant-…)',
    pattern: /\bsk-ant-[A-Za-z0-9-]{20,}\b/,
  },
  {
    id: 'google-api-key',
    description: 'Google-style API key (AIza…)',
    pattern: /\bAIza[0-9A-Za-z_-]{35}\b/,
  },
  {
    id: 'github-token',
    description: 'GitHub token (ghp_/gho_/ghu_/ghs_/ghr_…)',
    pattern: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/,
  },
  {
    id: 'slack-token',
    description: 'Slack token (xox…)',
    pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/,
  },
  {
    id: 'aws-access-key',
    description: 'AWS access key id (AKIA…)',
    pattern: /\bAKIA[0-9A-Z]{16}\b/,
  },
  {
    id: 'bearer-literal',
    description: 'hardcoded bearer token',
    pattern: /\bBearer\s+[A-Za-z0-9._-]{32,}\b/,
  },
  {
    id: 'jwt',
    description: 'JSON Web Token',
    pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
  },
  {
    id: 'private-key',
    description: 'PEM private key block',
    pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  },
  {
    id: 'secret-assignment',
    description: 'string literal assigned to a secret-named key',
    pattern:
      /(?:api[_-]?key|apikey|secret|token|password|passwd|pwd)\s*["']?\s*[:=]\s*["']([^"'\s]{16,})["']/i,
  },
]

export interface DistFileInput {
  readonly path: string
  readonly source: string
}

export interface SecretViolation {
  readonly file: string
  /** Which pattern matched, for actionable output. */
  readonly patternId: string
  readonly description: string
  /** A short excerpt around the match — never the full match itself. */
  readonly excerpt: string
}

/**
 * Context for the report: up to 20 characters before and after the match, but
 * the matched secret itself is truncated — a report must never become the
 * leak it exists to prevent.
 */
function excerptAround(source: string, index: number, length: number): string {
  const pre = source.slice(Math.max(0, index - 20), index)
  const post = source.slice(index + length, index + length + 20)
  const redacted = length <= 8 ? '…' : `${source.slice(index, index + 6)}…`
  return `…${pre}${redacted}${post}`.replaceAll('\n', ' ')
}

export function findSecretViolations(files: readonly DistFileInput[]): SecretViolation[] {
  const violations: SecretViolation[] = []

  for (const file of files) {
    for (const { id, description, pattern } of SECRET_PATTERNS) {
      const global = new RegExp(
        pattern.source,
        pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`,
      )
      for (const match of file.source.matchAll(global)) {
        const matched = match[0]
        if (matched === undefined || match.index === undefined) continue
        violations.push({
          file: file.path,
          patternId: id,
          description,
          excerpt: excerptAround(file.source, match.index, matched.length),
        })
      }
    }
  }

  return violations.sort(
    (a, b) => a.file.localeCompare(b.file) || a.patternId.localeCompare(b.patternId),
  )
}

// --- NFR-011: console calls in product source ---

/**
 * The complete allowlist of console messages in product code. Everything here
 * is a fixed diagnostic about infrastructure (sync channel, autosave), never
 * about user content. Adding to this list requires a review of the message:
 * it must not interpolate, and it must not be reachable with resume data.
 */
export const CONSOLE_ALLOWLIST: readonly string[] = [
  'BroadcastChannel not supported. Multi-tab sync disabled.',
  'Failed to broadcast sync message:',
  'Unexpected autosave failure:',
]

/** The console methods that could emit user-visible output. */
const CONSOLE_METHODS = 'log|warn|error|info|debug|trace|dir|table'

export interface SourceFileInput {
  readonly file: string
  readonly source: string
}

export interface ConsoleCallViolation {
  readonly file: string
  readonly line: number
  readonly reason: string
}

/** Tests never ship in the bundle, so they are out of scope for NFR-011. */
export function isTestFile(file: string): boolean {
  return file.includes('.test.') || file.startsWith('src/test/')
}

/**
 * Finds console calls in product source that are not an exact allowlisted
 * message. A call is allowlisted only when its first argument is a plain
 * string literal equal to an allowlisted message — template literals and
 * identifiers as first argument are always violations, because they are the
 * channel through which resume data reaches the console.
 */
export function findConsoleViolations(files: readonly SourceFileInput[]): ConsoleCallViolation[] {
  const violations: ConsoleCallViolation[] = []

  for (const file of files) {
    if (isTestFile(file.file)) continue

    const lines = file.source.split('\n')
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index]
      if (line === undefined) continue

      const call = new RegExp(`\\bconsole\\s*\\.\\s*(?:${CONSOLE_METHODS})\\s*\\(`)
      if (!call.test(line)) continue

      const literal =
        /^\s*console\s*\.\s*(?:log|warn|error|info|debug|trace|dir|table)\s*\(\s*(['"])((?:(?!\1).)*)\1/
      const match = literal.exec(line)
      const firstArgument = match?.[2]
      const allowed = firstArgument !== undefined && CONSOLE_ALLOWLIST.includes(firstArgument)

      if (!allowed) {
        violations.push({
          file: file.file,
          line: index + 1,
          reason:
            'console call that is not an exact allowlisted message — resume data must never reach the log (NFR-011)',
        })
      }
    }
  }

  return violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)
}
