import { createStore } from 'zustand/vanilla'

/**
 * Inert basket for Phase 2 (ADR-0005, state-management.md §7).
 *
 * MUST stay empty during Phase 1: no logic, no UI consumption, and never any
 * document content. In Phase 2, suggestions live here and reach the
 * DocumentStore only through an explicit user-approved Apply action.
 */
export interface AiState {
  // Intentionally empty in Phase 1.
}

export const aiStore = createStore<AiState>()(() => ({}))
