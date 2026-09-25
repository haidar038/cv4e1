import type { SectionKey } from '../../core/view-models'
import type { TailoringResult } from '../../ai'
import { TAILORING_MAX_LIST_ITEMS } from './tailoring-prompts'

/**
 * Static T3b keyword matcher (FR-601/604, ADR-0011).
 *
 * Deterministic, offline, zero egress: JD tokens are intersected with the
 * resume corpus. This is a heuristic fallback, not an ATS verdict — word
 * boundaries are literal (no stemming: "mengelola" does not match
 * "pengelolaan"), short noisy tokens are dropped, and section hints only
 * cover the keyword-dense sections. The LLM path refines this; the
 * validator (`validateTailoringOutput`) holds both paths to the same
 * two-way citation rule.
 */

/** One resume section as plain text (basics/contact/photo excluded upstream). */
export interface TailoringCorpus {
  readonly section: SectionKey
  readonly text: string
}

/** Functional words with no keyword signal, ID + EN. */
const STOPWORDS: ReadonlySet<string> = new Set(
  (
    'dan yang di ke dari untuk dengan pada adalah ini itu sebagai dalam oleh agar supaya jika atau serta ' +
    'saya kami kita anda kamu beliau mereka sudah telah akan sedang tidak bukan jangan bisa dapat harus perlu ' +
    'lebih kurang sangat cukup tiap setiap semua para sang si nya lah kah pun per Hingga antara tanpa melalu ' +
    'and the for with from are you your will our job work this that these those who will shall can may must ' +
    'have has had been were was are not but our its their his her your who whom whose which when where how ' +
    'what why all any each both few more most other some such only own same than too very'
  )
    .toLowerCase()
    .split(/\s+/),
)

/** Sections where a keyword gap is actionable signal (ADR-0011). */
const GAP_SECTIONS: readonly SectionKey[] = ['experience', 'organizations', 'projects', 'skills']

/**
 * JD tokens in first-appearance order, deduped. Keeps tokens with a letter
 * (`S1`, `QA`, `UI` survive; pure years do not), drops stopwords and
 * single characters.
 */
export function extractJdKeywords(jobDescription: string): string[] {
  const seen = new Set<string>()
  const keywords: string[] = []
  for (const raw of jobDescription.toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
    if (raw.length < 2 || STOPWORDS.has(raw) || !/\p{L}/u.test(raw)) continue
    if (seen.has(raw)) continue
    seen.add(raw)
    keywords.push(raw)
  }
  return keywords
}

function wordBoundaryPresent(haystack: string, needle: string): boolean {
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`\\b${escaped}\\b`, 'iu').test(haystack)
}

/**
 * Splits JD keywords into matched (word-boundary hit in the corpus) and
 * unsupported. Both lists are capped (prompt §8); the cap keeps the first
 * appearances, which carry the JD's own emphasis order.
 */
export function splitKeywords(
  jdKeywords: readonly string[],
  resumeText: string,
): Pick<TailoringResult, 'matchedKeywords' | 'unsupportedKeywords'> {
  const matched: string[] = []
  const unsupported: string[] = []
  for (const keyword of jdKeywords) {
    if (wordBoundaryPresent(resumeText, keyword)) matched.push(keyword)
    else unsupported.push(keyword)
  }
  return {
    matchedKeywords: matched.slice(0, TAILORING_MAX_LIST_ITEMS),
    unsupportedKeywords: unsupported.slice(0, TAILORING_MAX_LIST_ITEMS),
  }
}

/**
 * Gap sections with zero matched-keyword hits, in corpus order. Education,
 * certifications, and summary are excluded by design: they rarely carry JD
 * vocabulary, so listing them every time would be noise, not signal.
 */
export function suggestSectionsToStrengthen(
  matchedKeywords: readonly string[],
  corpus: readonly TailoringCorpus[],
): SectionKey[] {
  const inCorpus = new Set(corpus.map((entry) => entry.section))
  const weak: SectionKey[] = []
  for (const section of GAP_SECTIONS) {
    if (!inCorpus.has(section)) continue
    const text = corpus.find((entry) => entry.section === section)?.text ?? ''
    const hit = matchedKeywords.some((keyword) => wordBoundaryPresent(text, keyword))
    if (!hit) weak.push(section)
  }
  return weak
}

/** Full static analysis: the default behind every T3b request (FR-604). */
export function matchTailoringKeywords(
  jobDescription: string,
  corpus: readonly TailoringCorpus[],
  resumeText?: string,
): TailoringResult {
  // The matchable vocabulary is the flat excerpt, not the corpus alone:
  // unsectioned text (headline/summary) counts for matching, while section
  // hints still come from the corpus. One grounding source for both paths.
  const haystack = resumeText ?? corpus.map((entry) => entry.text).join('\n')
  const keywords = extractJdKeywords(jobDescription)
  const { matchedKeywords, unsupportedKeywords } = splitKeywords(keywords, haystack)
  return {
    matchedKeywords,
    unsupportedKeywords,
    sectionsToStrengthen: suggestSectionsToStrengthen(matchedKeywords, corpus),
    clarifyingQuestions: [],
    warnings: [],
  }
}
