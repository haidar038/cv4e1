import { useStore } from 'zustand'
import { getMicrocopy, microcopyStructural, type MicrocopyPack } from '../../content/microcopy/id'
import { uiStore } from '../store/ui-store'

/**
 * The microcopy pack for the active locale. For `id` this is the full domain
 * pack; for any other locale the Indonesia-specific guidance is blanked
 * (FR-204) while structural labels remain until the English pack lands in
 * Fase 3 (F-G5) — never null, so components can consume it directly.
 */
export function useMicrocopy(): MicrocopyPack {
  const locale = useStore(uiStore, (s) => s.locale)
  return getMicrocopy(locale) ?? microcopyStructural
}
