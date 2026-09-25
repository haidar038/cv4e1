import { AIProviderError } from './errors'
import type {
  BulletGenerationInput,
  BulletSuggestion,
  PolishInput,
  PolishSuggestion,
  TailoringResult,
} from './types'
import type { SectionKey } from '../core/view-models'

/**
 * Structured-output validation pipeline (FR-404, FR-405, structured-output-spec.md §3):
 *
 * ```text
 * Respons mentah → ekstrak JSON → parse → validasi bentuk
 *   → pemeriksaan grounding → kandidat tervalidasi
 * ```
 *
 * Every stage rejects with AIProviderError (`malformed-output` or
 * `grounding-violation`); callers fall back to the static provider and the
 * draft is never touched. Hand-written guards instead of zod keep `ai/`
 * dependency-free (architecture-overview.md §5) and the future network chunk
 * minimal. Never repaired, only rejected ("jangan dipaksa sembuh").
 */

// --- Shape guards ---

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

interface BulletSuggestionJSON {
  readonly text: string
  readonly actionVerb: string
  readonly usesPlaceholder: boolean
  readonly rationale: string
  readonly warnings: string[]
}

function isBulletSuggestionJSON(value: unknown): value is BulletSuggestionJSON {
  return (
    isRecord(value) &&
    isNonEmptyString(value.text) &&
    typeof value.actionVerb === 'string' &&
    typeof value.usesPlaceholder === 'boolean' &&
    typeof value.rationale === 'string' &&
    isStringArray(value.warnings)
  )
}

interface PolishSuggestionJSON {
  readonly text: string
  readonly changes: string[]
  readonly warnings: string[]
}

function isPolishSuggestionJSON(value: unknown): value is PolishSuggestionJSON {
  return (
    isRecord(value) &&
    isNonEmptyString(value.text) &&
    isStringArray(value.changes) &&
    isStringArray(value.warnings)
  )
}

// --- Stage 1+2: extract JSON, parse ---

/**
 * Parses raw provider text into JSON. Accepts plain JSON and single fenced
 * blocks (```json / ```); anything else — prose around the JSON, truncated
 * output, empty text — is rejected, never salvaged.
 */
export function extractJsonFromText(raw: string): unknown {
  const trimmed = raw.trim()
  const fenced = /^```(?:json)?[ \t]*\r?\n([\s\S]*?)\r?\n?```\s*$/.exec(trimmed)
  const jsonText = (fenced?.[1] ?? trimmed).trim()
  if (jsonText === '') throw new AIProviderError('malformed-output')
  try {
    return JSON.parse(jsonText) as unknown
  } catch {
    throw new AIProviderError('malformed-output')
  }
}

// --- Stage 3: grounding check (our own layer, not schema validation) ---

const NUMBER_PATTERN = /\d+(?:[.,]\d+)*(?:\s*%)?/g
const WORD_PATTERN = /[\p{L}][\p{L}\p{M}'-]*/gu
const BRACKET_SPAN_PATTERN = /\[[^\]]*\]/g
const MAX_GROUNDING_DETAILS = 5

/** Normalizes a number token so `30 %`, `3,52`, and `3.52` compare sanely. */
function normalizeNumber(token: string): string {
  return token.replace(/[\s.,%]/g, '')
}

function collectNumbers(text: string): string[] {
  return (text.match(NUMBER_PATTERN) ?? []).map(normalizeNumber)
}

function collectWordSet(text: string): Set<string> {
  const words = new Set<string>()
  for (const match of text.match(WORD_PATTERN) ?? []) {
    words.add(match.toLowerCase())
  }
  return words
}

/**
 * Capitalized tokens are entity candidates (names, places, months, grades).
 * Single common words are harmless: they pass whenever they appear in the
 * input, which legitimately reused words always do.
 */
function collectEntityCandidates(text: string): string[] {
  const candidates: string[] = []
  for (const match of text.replace(BRACKET_SPAN_PATTERN, ' ').match(WORD_PATTERN) ?? []) {
    if (match.length >= 2 && /^\p{Lu}/u.test(match)) {
      candidates.push(match)
    }
  }
  return candidates
}

/**
 * Invariant check (FR-405, evaluation-dataset.md §1): every number and every
 * entity candidate in the output must already exist in the grounding source.
 * Metric placeholders live inside `[...]` spans and are stripped before the
 * entity pass, so `[dampak yang dapat diukur]` never counts as a violation.
 * Comparison is verbatim-tolerant (Q8): numbers present in the input survive.
 */
export function checkGrounding(outputs: readonly string[], allowedFacts: string): string[] {
  const allowedNumbers = new Set<string>(collectNumbers(allowedFacts))
  const allowedWords = collectWordSet(allowedFacts)
  const violations: string[] = []
  const seen = new Set<string>()

  const report = (violation: string): void => {
    if (violations.length < MAX_GROUNDING_DETAILS && !seen.has(violation)) {
      seen.add(violation)
      violations.push(violation)
    }
  }

  for (const output of outputs) {
    for (const number of collectNumbers(output)) {
      if (!allowedNumbers.has(number)) report(`angka "${number}" tidak ada pada input`)
    }
    for (const candidate of collectEntityCandidates(output)) {
      if (!allowedWords.has(candidate.toLowerCase())) {
        report(`entitas "${candidate}" tidak ada pada input`)
      }
    }
  }
  return violations
}

// --- Full pipelines ---

/**
 * Validates a bullet-generator response against the output schema, then
 * grounding. Returns validated candidates; throws `malformed-output` or
 * `grounding-violation` otherwise.
 */
export function validateBulletOutput(
  raw: string,
  input: BulletGenerationInput,
): readonly BulletSuggestion[] {
  const parsed = extractJsonFromText(raw)
  if (!isRecord(parsed) || !Array.isArray(parsed.suggestions) || parsed.suggestions.length === 0) {
    throw new AIProviderError('malformed-output')
  }
  const suggestions: BulletSuggestion[] = parsed.suggestions.map((item) => {
    if (!isBulletSuggestionJSON(item)) throw new AIProviderError('malformed-output')
    return {
      text: item.text,
      actionVerb: item.actionVerb,
      usesPlaceholder: item.usesPlaceholder,
      rationale: item.rationale,
      warnings: item.warnings,
    }
  })
  const violations = checkGrounding(
    suggestions.flatMap((suggestion) => [suggestion.text, suggestion.rationale]),
    input.allowedFacts,
  )
  if (violations.length > 0) throw new AIProviderError('grounding-violation', undefined, violations)
  return suggestions
}

/**
 * Validates a polish response. Polish must never add facts, change dates, or
 * drop information (C2) — enforced here by the same containment check against
 * the source text.
 */
export function validatePolishOutput(raw: string, input: PolishInput): PolishSuggestion {
  const parsed = extractJsonFromText(raw)
  if (!isRecord(parsed) || !isPolishSuggestionJSON(parsed)) {
    throw new AIProviderError('malformed-output')
  }
  const violations = checkGrounding([parsed.text], input.text)
  if (violations.length > 0) throw new AIProviderError('grounding-violation', undefined, violations)
  return { text: parsed.text, changes: parsed.changes, warnings: parsed.warnings }
}

// --- T3b tailoring (FR-601/602, ADR-0011) ---

/**
 * Known section keys, mirroring `SectionKey` in core/view-models.ts.
 * Typed (not stringly) so an unknown key is a compile error here, not a
 * silent pass — `summary` is deliberately absent: it lives in basics and
 * can never name a section to strengthen.
 */
const TAILORING_SECTION_KEYS: readonly SectionKey[] = [
  'education',
  'experience',
  'organizations',
  'projects',
  'skills',
  'certifications',
]

interface TailoringOutputJSON {
  readonly matchedKeywords: string[]
  readonly unsupportedKeywords: string[]
  readonly sectionsToStrengthen: SectionKey[]
  readonly clarifyingQuestions: string[]
  readonly warnings: string[]
}

function isTailoringOutputJSON(value: unknown): value is TailoringOutputJSON {
  return (
    isRecord(value) &&
    isStringArray(value.matchedKeywords) &&
    isStringArray(value.unsupportedKeywords) &&
    Array.isArray(value.sectionsToStrengthen) &&
    value.sectionsToStrengthen.every(
      (section): section is SectionKey =>
        typeof section === 'string' &&
        (TAILORING_SECTION_KEYS as readonly string[]).includes(section),
    ) &&
    isStringArray(value.clarifyingQuestions) &&
    isStringArray(value.warnings)
  )
}

/**
 * Word-boundary containment (case-insensitive). Mirrors the matcher in
 * features/ai/tailoring-matcher.ts so both paths are held to one rule;
 * duplicated here for the same dependency-free reason as the section list.
 */
function containsWord(haystack: string, needle: string): boolean {
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`\\b${escaped}\\b`, 'iu').test(haystack)
}

/**
 * Sentence-initial capitals state no fact ("Apakah …?" asks; it does not
 * claim). The checker lowers the first letter so natural questions are not
 * rejected for their casing — every other capitalized word is still held
 * to the input vocabulary.
 */
function lowerSentenceInitial(question: string): string {
  return question.replace(/^\p{Lu}/u, (initial) => initial.toLowerCase())
}

/**
 * Validates a tailoring response against the output schema, then grounding.
 *
 * Two-way citation rule (prompt §4.6, ADR-0011): every matched keyword must
 * appear in the JD *and* the resume excerpt; every unsupported keyword must
 * appear in the JD and *not* in the excerpt. Questions and warnings pass
 * the standard number/entity containment against both inputs combined.
 * An all-empty content envelope is rejected — a model that says nothing
 * about a real ad has failed, and the caller falls back to static.
 */
export function validateTailoringOutput(
  raw: string,
  sentJobDescription: string,
  resumeExcerpt: string,
): TailoringResult {
  const parsed = extractJsonFromText(raw)
  if (!isRecord(parsed) || !isTailoringOutputJSON(parsed)) {
    throw new AIProviderError('malformed-output')
  }
  const violations: string[] = []
  for (const keyword of parsed.matchedKeywords) {
    if (!containsWord(sentJobDescription, keyword) || !containsWord(resumeExcerpt, keyword)) {
      violations.push(`kutipan "${keyword}" tidak ada di kedua input`)
    }
  }
  for (const keyword of parsed.unsupportedKeywords) {
    if (!containsWord(sentJobDescription, keyword)) {
      violations.push(`celah "${keyword}" tidak ada di deskripsi lowongan`)
    } else if (containsWord(resumeExcerpt, keyword)) {
      violations.push(`celah "${keyword}" ternyata didukung data`)
    }
  }
  violations.push(
    ...checkGrounding(
      [...parsed.clarifyingQuestions.map(lowerSentenceInitial), ...parsed.warnings],
      `${sentJobDescription}\n${resumeExcerpt}`,
    ),
  )
  if (violations.length > 0) throw new AIProviderError('grounding-violation', undefined, violations)
  if (
    parsed.matchedKeywords.length === 0 &&
    parsed.unsupportedKeywords.length === 0 &&
    parsed.clarifyingQuestions.length === 0
  ) {
    throw new AIProviderError('malformed-output')
  }
  return {
    matchedKeywords: [...parsed.matchedKeywords],
    unsupportedKeywords: [...parsed.unsupportedKeywords],
    sectionsToStrengthen: [...parsed.sectionsToStrengthen],
    clarifyingQuestions: [...parsed.clarifyingQuestions],
    warnings: [...parsed.warnings],
  }
}
