import { useEffect } from 'react'
import { useStore } from 'zustand'
import { DraftPanel } from './features/drafts/DraftPanel'
import { FormLayout } from './features/form/FormLayout'
import { initStoreSync, loadDraftAction, refreshDrafts } from './features/store/actions'
import { documentStore } from './features/store/document-store'

/**
 * D14 (no router): the workspace restores the last opened draft from a small
 * localStorage preference. This is a UI preference — resume content itself
 * lives only in IndexedDB (AGENTS.md §2.9).
 */
const LAST_DRAFT_KEY = 'cv4every1:lastDraftId'

function App() {
  const draftId = useStore(documentStore, (s) => s.draftId)

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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 lg:flex-row">
      <DraftPanel />
      <main id="cv-form" className="flex min-w-0 flex-1">
        <FormLayout />
      </main>
    </div>
  )
}

export default App
