import { useStore } from 'zustand'
import type { ResumeSections } from '../../../core/schema'
import type { SectionKey } from '../../../core/view-models'
import { documentStore } from '../../store/document-store'

type SectionItem<K extends SectionKey> = NonNullable<ResumeSections[K]>[number]

const EMPTY_ITEMS: never[] = []

/**
 * The generic section read hits the union of every section's array type; the
 * cast restores the per-section correlation TS cannot track (same documented
 * bridging as the store actions). EMPTY_ITEMS keeps the selector referentially
 * stable so useStore does not re-render on unrelated updates.
 */
export function useSectionItems<K extends SectionKey>(section: K): SectionItem<K>[] {
  return useStore(
    documentStore,
    (s) => (s.document?.sections[section] ?? EMPTY_ITEMS) as SectionItem<K>[],
  )
}
