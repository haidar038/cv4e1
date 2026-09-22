import type { SectionKey } from '../core/view-models'

/**
 * Shared contract for every suggestion source (ADR-0005, ai-provider-strategy.md §1).
 *
 * The application core never calls a provider API directly. Network providers
 * (Groq, OpenAI-compatible — Fase 2, Task 18+) implement this interface behind
 * an explicit per-operation consent gate (FR-402); offline providers below
 * resolve without any network access.
 *
 * Identifier spellings follow docs/00-project-context/glossary.md §4.
 */

/** Language of AI input and output. Mirrors LOCALES in src/core/schema-parts.ts. */
export type AILocale = 'id' | 'en'

/** Suggestion capability. `tailoring` is Fase 3 (C3); the other two are Fase 2. */
export type AiCapability = 'bullets' | 'polish' | 'tailoring'

export interface BulletGenerationInput {
  /** Raw task description exactly as the user typed it. */
  readonly rawTask: string
  /** Section the bullet belongs to — steers verb choice, never sent whole. */
  readonly section: SectionKey
  readonly targetRole?: string
  readonly locale: AILocale
  /**
   * Facts the model may use — the grounding source (DF-6 minimisasi data).
   * Nothing outside this string may appear in the output (FR-405).
   */
  readonly allowedFacts: string
}

export interface BulletSuggestion {
  readonly text: string
  /** Empty when the section has no action verbs (e.g. education, skills). */
  readonly actionVerb: string
  /** True when the text carries a metric placeholder instead of a number. */
  readonly usesPlaceholder: boolean
  /** Why this suggestion was made — shown before Apply. */
  readonly rationale: string
  readonly warnings: readonly string[]
}

/** Polish (ID), Polish (EN), Terjemahkan ke Inggris (C2). */
export type PolishMode = 'id' | 'en' | 'translate-en'

export interface PolishInput {
  readonly text: string
  readonly mode: PolishMode
}

export interface PolishSuggestion {
  readonly text: string
  /** Human-readable list of what changed — previewed before Apply (FR-401). */
  readonly changes: readonly string[]
  readonly warnings: readonly string[]
}

/** Fase 3 (C3). Shape follows the sketch in ai-product-spec.md §C2/C3. */
export interface JobTailoringInput {
  /** Pasted job ad — untrusted input, never treated as instructions. */
  readonly jobDescription: string
  readonly section: SectionKey
  readonly locale: AILocale
  readonly allowedFacts: string
}

/** Fase 3 (C3). Never claims new skills for the user. */
export interface TailoringResult {
  readonly matchedKeywords: readonly string[]
  readonly unsupportedKeywords: readonly string[]
  readonly sectionsToStrengthen: readonly SectionKey[]
  readonly clarifyingQuestions: readonly string[]
  readonly warnings: readonly string[]
}

export interface AIProvider {
  /** Stable identifier: `static`, `noop`, `groq`, `openai-compatible`, … */
  readonly id: string
  /** False for offline providers — the UI can promise zero egress. */
  readonly requiresNetwork: boolean
  /** False when no key is configured, offline, or otherwise unusable (FR-408). */
  isAvailable(): Promise<boolean>
  generateBullets(input: BulletGenerationInput): Promise<readonly BulletSuggestion[]>
  polishText(input: PolishInput): Promise<PolishSuggestion>
  tailorToJob(input: JobTailoringInput): Promise<TailoringResult>
}
