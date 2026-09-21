import { lazy, Suspense, useEffect } from 'react'
import { useStore } from 'zustand'
import { documentStore } from '../store/document-store'
import { selectATSViewModel, selectCreativeViewModel } from '../store/selectors'
import { uiStore } from '../store/ui-store'
import { useMicrocopy } from '../form/useMicrocopy'
import { usePhotoResolver } from './usePhotoResolver'
import { ModeToggle } from './ModeToggle'
import { PhotoNotice } from './PhotoNotice'
import { PrintButton } from '../export/PrintButton'

const LazyATSRenderer = lazy(() =>
  import('@/render/ats/ATSRenderer').then((module) => ({ default: module.ATSRenderer })),
)

const LazyCreativeRenderer = lazy(() =>
  import('@/render/creative/CreativeRenderer').then((module) => ({
    default: module.CreativeRenderer,
  })),
)

/**
 * Real preview surface (Task 12, FR-003/FR-008, J3). Replaces the temporary
 * `?preview=ats|creative` PreviewGate: the renderer matching the active mode
 * is always mounted once a draft is open — desktop beside the form, mobile
 * behind the Pratinjau tab (visibility is owned by `App`, this pane always
 * renders so `#cv-preview` exists for the form's skip link).
 *
 * Pattern inherited from the gate: one lazy chunk per renderer (the app-shell
 * budget stays untouched — performance-budget.md §3), view models from the
 * memoized selectors (`normalize()` is never called in components,
 * state-management.md §5), and the Creative photo resolver injected here in
 * features/ so render/ stays storage-free. The idle preload below warms both
 * chunks after first paint so toggling rarely suspends (AC: no flicker);
 * the fallback stays empty and animation-free (`prefers-reduced-motion` is
 * respected by construction).
 *
 * Both memoized view models are read every render: either may be cached, so
 * this costs nothing, keeps the hooks unconditional, and derives `hasPhoto`
 * for the notice without touching the document.
 *
 * The toggle and notice live OUTSIDE `#cv-preview` on purpose: the preview
 * region is exactly the printable document surface (the print stylesheets
 * hide everything else), so the ATS/Creative extraction gates keep proving
 * document-only recovery without control text leaking into expectations.
 */
export function PreviewPane() {
  const pack = useMicrocopy()
  const document = useStore(documentStore, (state) => state.document)
  const mode = useStore(uiStore, (state) => state.mode)

  const atsVm = selectATSViewModel(document)
  const creativeVm = selectCreativeViewModel(document)
  const resolvePhotoUrl = usePhotoResolver(creativeVm?.photo?.assetRef)

  // Warm the non-active chunk shortly after first paint. A plain timeout
  // (not requestIdleCallback) keeps this jsdom-safe and type-trivial; it only
  // affects fetch timing, never the eager shell budget both ratchets guard.
  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
      if (cancelled) return
      void import('@/render/ats/ATSRenderer')
      void import('@/render/creative/CreativeRenderer')
    }, 1000)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [])

  if (document === null) return null

  const hasPhoto = creativeVm?.photo !== undefined

  return (
    <section aria-label={pack.preview.regionLabel} className="flex min-w-0 flex-1 flex-col gap-3">
      <ModeToggle />
      <PhotoNotice hasPhoto={hasPhoto} />
      {/* Task 14: print controls beside the toggle — outside `#cv-preview` so
          control text never leaks into the extraction gates. */}
      <PrintButton />
      {/* The printable document surface is a plain div on purpose: the print
          stylesheets hide everything outside `.cv-ats`/`.cv-creative`, so the
          ATS/Creative extraction gates keep proving document-only recovery
          without control text leaking into expectations. The labelled region
          above keeps every control inside a landmark (axe `region` rule). */}
      <div id="cv-preview" className="min-w-0 flex-1">
        <Suspense fallback={null}>
          {mode === 'creative' ? (
            creativeVm === null ? null : (
              <LazyCreativeRenderer vm={creativeVm} resolvePhotoUrl={resolvePhotoUrl} />
            )
          ) : atsVm === null ? null : (
            <LazyATSRenderer vm={atsVm} />
          )}
        </Suspense>
      </div>
    </section>
  )
}
