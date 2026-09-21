import { lazy, Suspense } from 'react'
import { useStore } from 'zustand'
import { documentStore } from '../store/document-store'
import { selectATSViewModel, selectCreativeViewModel } from '../store/selectors'
import { useMicrocopy } from '../form/useMicrocopy'
import { usePhotoResolver } from './usePhotoResolver'

const LazyATSRenderer = lazy(() =>
  import('@/render/ats/ATSRenderer').then((module) => ({ default: module.ATSRenderer })),
)

const LazyCreativeRenderer = lazy(() =>
  import('@/render/creative/CreativeRenderer').then((module) => ({
    default: module.CreativeRenderer,
  })),
)

/**
 * Temporary preview surface for Tasks 10–11, to be replaced by the real
 * PreviewPane in Task 12: a renderer mounts only when the URL asks for its
 * mode (`?preview=ats` / `?preview=creative`) and a draft is open. This gives
 * the print and extraction e2e gates a real production-build page to drive
 * (ADR-0007: preview and PDF share one codepath) while leaving the preview
 * UX, mode toggle and mobile tabs entirely to Task 12, which removes this gate.
 *
 * Each renderer is its own lazy chunk, so the app shell budget is untouched
 * (performance-budget.md §3). The Creative photo resolver is injected here —
 * features/ owns the storage touch; render/ stays storage-free.
 *
 * View models come from the memoized selectors — normalize() is never called
 * in components outside the selectors (state-management.md §5).
 */
export function PreviewGate() {
  const pack = useMicrocopy()
  const document = useStore(documentStore, (state) => state.document)
  const preview = new URLSearchParams(window.location.search).get('preview')
  const creativeVm = preview === 'creative' ? selectCreativeViewModel(document) : null
  const resolvePhotoUrl = usePhotoResolver(creativeVm?.photo?.assetRef)

  if (preview !== 'ats' && preview !== 'creative') return null
  if (document === null) return null

  if (preview === 'ats') {
    const vm = selectATSViewModel(document)
    if (vm === null) return null
    return (
      <section id="cv-preview" aria-label={pack.preview.regionLabel}>
        <Suspense fallback={null}>
          <LazyATSRenderer vm={vm} />
        </Suspense>
      </section>
    )
  }

  const vm = creativeVm
  if (vm === null) return null
  return (
    <section id="cv-preview" aria-label={pack.preview.regionLabel}>
      <Suspense fallback={null}>
        <LazyCreativeRenderer vm={vm} resolvePhotoUrl={resolvePhotoUrl} />
      </Suspense>
    </section>
  )
}
