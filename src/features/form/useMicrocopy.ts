import { useStore } from 'zustand'
import { getMicrocopy, microcopyStructural, type MicrocopyPack } from '../../content/microcopy/id'
import { uiStore } from '../store/ui-store'

/**
 * The microcopy pack for the active locale. For `id` this is the full domain
 * pack; for `en` the full English pack (T3c, ADR-0012) with Indonesia-specific
 * guidance blanked (FR-204). Unknown locales fall back to
 * `microcopyStructural` — never null, so components can consume it directly.
 */
export function useMicrocopy(): MicrocopyPack {
  const locale = useStore(uiStore, (s) => s.locale)
  return getMicrocopy(locale) ?? microcopyStructural
}
