import { createStore } from 'zustand/vanilla'
import type { DraftSummary } from '../../storage'

export interface DraftState {
  /** Lightweight summaries, most recently updated first (as `listDrafts()` returns them). */
  summaries: DraftSummary[]
  selectedId: string | null
}

export const draftStore = createStore<DraftState>()(() => ({ summaries: [], selectedId: null }))
