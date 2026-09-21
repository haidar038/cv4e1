import { useEffect, useState } from 'react'
import { useStore } from 'zustand'
import { Button } from '@/components/ui/button'
import { DraftPanel } from './features/drafts/DraftPanel'
import { FormLayout } from './features/form/FormLayout'
import { useMicrocopy } from './features/form/useMicrocopy'
import { PreviewPane } from './features/preview/PreviewPane'
import { initStoreSync, loadDraftAction, refreshDrafts } from './features/store/actions'
import { documentStore } from './features/store/document-store'

/**
 * D14 (no router): the workspace restores the last opened draft from a small
 * localStorage preference. This is a UI preference — resume content itself
 * lives only in IndexedDB (AGENTS.md §2.9).
 */
const LAST_DRAFT_KEY = 'cv4every1:lastDraftId'

type MobileView = 'form' | 'preview'

/**
 * App shell (Task 12): draft panel beside a form + live-preview workspace.
 * Desktop shows form and preview side by side; mobile switches between them
 * through plain tab buttons (`aria-selected` + `aria-controls`, natively
 * keyboard-operable — plan decision D-dec-2: no base-ui Tabs, which would
 * spend the ±4,4 KB of remaining jsGzip ratchet room for no behaviour gain).
 * Both panes stay mounted (mobile hides one with `hidden`) so `#cv-preview`
 * always exists while a draft is open — the form's skip link is never dead
 * and the print stylesheets keep a stable surface.
 */
function App() {
  const draftId = useStore(documentStore, (s) => s.draftId)
  const hasDocument = useStore(documentStore, (s) => s.document !== null)
  const [mobileView, setMobileView] = useState<MobileView>('form')
  const pack = useMicrocopy()

  useEffect(() => {
    initStoreSync()
    void refreshDrafts()
    const lastDraftId = localStorage.getItem(LAST_DRAFT_KEY)
    if (lastDraftId !== null) void loadDraftAction(lastDraftId)
  }, [])

  useEffect(() => {
    if (draftId === null) {
      localStorage.removeItem(LAST_DRAFT_KEY)
    } else {
      localStorage.setItem(LAST_DRAFT_KEY, draftId)
    }
  }, [draftId])

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 lg:flex-row">
      <DraftPanel />
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {hasDocument && <MobileTabs mobileView={mobileView} onChange={setMobileView} />}
        <div className="flex min-w-0 flex-1 flex-col gap-4 lg:flex-row">
          <main
            id="cv-form"
            aria-label={pack.preview.formLabel}
            className={`min-w-0 flex-1 ${mobileView === 'preview' ? 'hidden lg:flex' : 'flex'}`}
          >
            <FormLayout />
          </main>
          {hasDocument && (
            // Print renders at paper width (below `lg`), where `hidden` would
            // win and blank the PDF — `print:block` keeps the document
            // printable from any viewport (Task 12 print/PDF fix).
            <div
              className={`min-w-0 flex-1 ${mobileView === 'form' ? 'hidden lg:block print:block' : 'block'}`}
            >
              <PreviewPane />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** Mobile-only Form/Pratinjau switcher; hidden on desktop where both panes show. */
function MobileTabs({
  mobileView,
  onChange,
}: {
  mobileView: MobileView
  onChange: (view: MobileView) => void
}) {
  const pack = useMicrocopy()
  const tabs: Array<{ value: MobileView; label: string; controls: string }> = [
    { value: 'form', label: pack.preview.formTab, controls: 'cv-form' },
    { value: 'preview', label: pack.preview.previewTab, controls: 'cv-preview' },
  ]
  return (
    <div
      role="tablist"
      aria-label={pack.preview.regionLabel}
      className="flex gap-2 lg:hidden print:hidden"
    >
      {tabs.map((tab) => (
        <Button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={mobileView === tab.value}
          aria-controls={tab.controls}
          variant={mobileView === tab.value ? 'default' : 'outline'}
          size="sm"
          className="flex-1"
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  )
}

export default App
