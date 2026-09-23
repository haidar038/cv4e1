import { createStore } from 'zustand/vanilla'

/**
 * Per-session AI consent grants (Task 18, FR-402, ai-privacy-policy.md §3).
 *
 * Semantics (maintainer decision, Task 18 Q3): the FIRST send to a provider
 * in this tab requires the full consent dialog; later sends in the same
 * session proceed while the grant stands. "Session" = tab lifetime, like
 * `photoNoticeDismissed` in ui-store. Grants live in this vanilla store —
 * memory only, never persisted — and revoking returns the provider to the
 * prompt-again state. Absence of a grant always means "ask first".
 */

export type AiProviderId = 'groq' | 'openai-compatible'

interface ConsentState {
  readonly grants: Record<string, true>
  grant: (providerId: AiProviderId) => void
  revoke: (providerId: AiProviderId) => void
}

export const consentStore = createStore<ConsentState>()((set) => ({
  grants: {},
  grant: (providerId) => set((state) => ({ grants: { ...state.grants, [providerId]: true } })),
  revoke: (providerId) =>
    set((state) => {
      const grants = { ...state.grants }
      delete grants[providerId]
      return { grants }
    }),
}))

/** True when the full consent dialog must be shown before sending. */
export function needsConsent(providerId: AiProviderId): boolean {
  return consentStore.getState().grants[providerId] !== true
}
