import { useStore } from 'zustand'
import { Button } from '@/components/ui/button'
import { dismissPhotoNotice } from '../store/actions'
import { uiStore } from '../store/ui-store'
import { useMicrocopy } from '../form/useMicrocopy'

/**
 * Contextual photo notice (Task 12, FR-002/AC-002-a + FR-203): explains WHY
 * the photo disappears in ATS mode. The body text is the verbatim
 * `photo.atsHiddenNotice` micro-copy shared with PhotoUpload (F-C3) — reused,
 * never rewritten.
 *
 * "Once per session" (plan decision D-dec-4) means the lifetime of this tab:
 * an in-memory `uiStore` flag, never persisted. A reload may show the notice
 * again, which is harmless for guidance and keeps storage semantics trivial.
 * `role="status"` (not `alert`): this is help, not an error. No photo in the
 * document, Creative mode, or an already-dismissed notice renders nothing.
 */
export function PhotoNotice({ hasPhoto }: { hasPhoto: boolean }) {
  const pack = useMicrocopy()
  const mode = useStore(uiStore, (s) => s.mode)
  const dismissed = useStore(uiStore, (s) => s.photoNoticeDismissed)

  if (mode !== 'ats' || !hasPhoto || dismissed) return null

  return (
    <div role="status" className="flex items-start justify-between gap-3 border p-3">
      <p className="text-xs text-muted-foreground">{pack.photo.atsHiddenNotice}</p>
      <Button type="button" variant="ghost" size="xs" onClick={dismissPhotoNotice}>
        {pack.preview.dismissNotice}
      </Button>
    </div>
  )
}
