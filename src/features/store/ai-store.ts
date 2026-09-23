import { createStore } from 'zustand/vanilla'
import type { AIErrorCode, BulletSuggestion, PolishSuggestion } from '../../ai'
import type { BulletSectionKey } from '../ai/bullet-generator'

/**
 * Suggestion basket for Phase 2 (ADR-0005, state-management.md §7).
 *
 * Suggestions live here, never in the DocumentStore: Apply copies one item
 * through an explicit store action into the document (FR-401 "suggestion,
 * not mutation"). This module holds state only — orchestration stays in
 * `features/ai/bullet-generator.ts` (lazy-loaded, never in the initial
 * chunk) and the panel owns the consent dialog.
 */

export type BulletStatus = 'idle' | 'loading' | 'ready'

export interface BulletScope {
  readonly section: BulletSectionKey
  readonly itemIndex: number
  /** 1-based bullet row position, matching the row input's accessible name. */
  readonly position: number
  /** Raw task snapshot the request was built from (stale-response guard). */
  readonly rawTask: string
}

export type BulletSource = 'ai' | 'static'

/**
 * Polish scope (Task 20, C2). One request, one target: either the summary
 * field (`summary`) or a single bullet row (`section:item:position`). The
 * source-text snapshot guards against stale responses like the bullet
 * scope does.
 */
export interface PolishScope {
  readonly target: string
  readonly text: string
}

export type PolishStatus = 'idle' | 'loading' | 'ready'

export interface AiState {
  readonly bulletScope: BulletScope | null
  readonly bulletStatus: BulletStatus
  readonly bulletSuggestions: readonly BulletSuggestion[]
  readonly bulletSource: BulletSource | null
  readonly bulletErrorCode: AIErrorCode | null
  readonly polishScope: PolishScope | null
  readonly polishStatus: PolishStatus
  readonly polishSuggestion: PolishSuggestion | null
  readonly polishSource: BulletSource | null
  readonly polishErrorCode: AIErrorCode | null
}

const initialAiState: AiState = {
  bulletScope: null,
  bulletStatus: 'idle',
  bulletSuggestions: [],
  bulletSource: null,
  bulletErrorCode: null,
  polishScope: null,
  polishStatus: 'idle',
  polishSuggestion: null,
  polishSource: null,
  polishErrorCode: null,
}

export const aiStore = createStore<AiState>()(() => ({ ...initialAiState }))

function sameScope(left: BulletScope, right: BulletScope): boolean {
  return (
    left.section === right.section &&
    left.itemIndex === right.itemIndex &&
    left.position === right.position &&
    left.rawTask === right.rawTask
  )
}

export function startBulletRequest(scope: BulletScope): void {
  aiStore.setState({
    bulletScope: scope,
    bulletStatus: 'loading',
    bulletSuggestions: [],
    bulletSource: null,
    bulletErrorCode: null,
  })
}

export interface BulletOutcome {
  readonly suggestions: readonly BulletSuggestion[]
  readonly source: BulletSource
  readonly errorCode: AIErrorCode | null
}

/** Records a result unless a newer request has superseded its scope. */
export function resolveBulletRequest(outcome: BulletOutcome, scope: BulletScope): void {
  const current = aiStore.getState().bulletScope
  if (current === null || !sameScope(current, scope)) return
  aiStore.setState({
    bulletStatus: 'ready',
    bulletSuggestions: outcome.suggestions,
    bulletSource: outcome.source,
    bulletErrorCode: outcome.errorCode,
  })
}

export function clearBulletState(): void {
  aiStore.setState({ ...initialAiState })
}

export function startPolishRequest(scope: PolishScope): void {
  aiStore.setState({
    polishScope: scope,
    polishStatus: 'loading',
    polishSuggestion: null,
    polishSource: null,
    polishErrorCode: null,
  })
}

export interface PolishOutcome {
  readonly suggestion: PolishSuggestion
  readonly source: BulletSource
  readonly errorCode: AIErrorCode | null
}

/** Records a result unless a newer request has superseded its scope. */
export function resolvePolishRequest(outcome: PolishOutcome, scope: PolishScope): void {
  const current = aiStore.getState().polishScope
  if (current === null || current.target !== scope.target || current.text !== scope.text) {
    return
  }
  aiStore.setState({
    polishStatus: 'ready',
    polishSuggestion: outcome.suggestion,
    polishSource: outcome.source,
    polishErrorCode: outcome.errorCode,
  })
}

export function clearPolishState(): void {
  aiStore.setState({
    polishScope: null,
    polishStatus: 'idle',
    polishSuggestion: null,
    polishSource: null,
    polishErrorCode: null,
  })
}
