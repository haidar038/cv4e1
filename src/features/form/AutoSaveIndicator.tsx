import { useStore } from 'zustand'
import { documentStore } from '../store/document-store'
import { uiStore } from '../store/ui-store'
import { useMicrocopy } from './useMicrocopy'

/**
 * Autosave status for the user (D21 texts). `saving`/`saved` come from the
 * micro-copy pack; the error and private-mode texts are owned by the store
 * (they are set alongside the storage failures there) and are rendered as-is.
 * Announced politely via role=status so screen readers hear the transition
 * without interrupting typing.
 */
export function AutoSaveIndicator() {
  const pack = useMicrocopy()
  const status = useStore(uiStore, (s) => s.autosaveStatus)
  const storageMessage = useStore(uiStore, (s) => s.storageMessage)
  const lastSavedAt = useStore(documentStore, (s) => s.lastSavedAt)

  let text: string | null = null
  switch (status) {
    case 'saving':
      text = pack.autosave.saving
      break
    case 'saved':
      text = pack.autosave.saved
      break
    case 'error':
    case 'blocked':
      text = storageMessage
      break
    case 'idle':
      // After a reload the store is idle but the loaded draft carries its last
      // save time — the indicator must keep saying "Tersimpan", not nothing.
      text = lastSavedAt !== null ? pack.autosave.saved : null
      break
  }

  if (text === null) return null
  return (
    <p role="status" className="text-xs text-muted-foreground">
      {text}
    </p>
  )
}
