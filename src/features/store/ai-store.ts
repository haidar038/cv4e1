import { createStore } from 'zustand/vanilla'
import type { AIErrorCode, BulletSuggestion } from '../../ai'
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

export interface AiState {
  readonly bulletScope: BulletScope | null
  readonly bulletStatus: BulletStatus
  readonly bulletSuggestions: readonly BulletSuggestion[]
  readonly bulletSource: BulletSource | null
  readonly bulletErrorCode: AIErrorCode | null
}

const initialAiState: AiState = {
  bulletScope: null,
  bulletStatus: 'idle',
  bulletSuggestions: [],
  bulletSource: null,
  bulletErrorCode: null,
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
