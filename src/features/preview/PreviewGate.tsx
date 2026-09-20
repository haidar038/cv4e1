import { lazy, Suspense } from 'react'
import { useStore } from 'zustand'
import { documentStore } from '../store/document-store'
import { selectATSViewModel } from '../store/selectors'
import { useMicrocopy } from '../form/useMicrocopy'

const LazyATSRenderer = lazy(() =>
  import('@/render/ats/ATSRenderer').then((module) => ({ default: module.ATSRenderer })),
)

/**
 * Temporary preview surface for Task 10, to be replaced by the real
 * PreviewPane in Task 12: the ATS renderer mounts only when the URL asks
 * for it (`?preview=ats`) and a draft is open. This gives the print and
 * extraction e2e gates a real production-build page to drive (ADR-0007:
 * preview and PDF share one codepath) while leaving the preview UX,
 * mode toggle and mobile tabs entirely to Task 12.
 *
 * The view model comes from the memoized selector — normalize() is never
 * called in components (state-management.md §5). The renderer chunk is born
 * lazy so the app shell budget is untouched (performance-budget.md §3).
 */
export function PreviewGate() {
  const pack = useMicrocopy()
  const document = useStore(documentStore, (state) => state.document)

  if (new URLSearchParams(window.location.search).get('preview') !== 'ats') return null
  if (document === null) return null
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
