import { useRef, useState } from 'react'
import { useStore } from 'zustand'
import { CopyIcon, PencilIcon, TrashIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { exportResumeLazy } from '../../storage/export-import-lazy'
import type { DraftSummary } from '../../storage'
import {
  createDraft,
  deleteDraftAction,
  duplicateDraft,
  importDraftAction,
  loadDraftAction,
  renameDraft,
} from '../store/actions'
import { DataManagement } from '../settings/DataManagement'
import { AiSettings } from '../ai/AiSettings'
import { ImportCvDialog } from '../import/ImportCvDialog'
import { documentStore } from '../store/document-store'
import { draftStore } from '../store/draft-store'
import { useMicrocopy } from '../form/useMicrocopy'

const ACCEPTED_IMPORT_TYPE = 'application/json'

function downloadJson(json: string, title: string): void {
  const blob = new Blob([json], { type: ACCEPTED_IMPORT_TYPE })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${sanitizeFilename(title)}.json`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function sanitizeFilename(title: string): string {
  return (
    title
      .replace(/[^\p{L}\p{N}_-]+/gu, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'cv'
  )
}

/**
 * Draft navigation panel (D23): list of saved drafts side-by-side with the
 * form (stacked on mobile), plus draft actions — new, rename, duplicate,
 * delete, export of the open draft, and import of an exported envelope. A
 * failed import never touches the open draft; its reason is announced through
 * the localized micro-copy.
 */
export function DraftPanel() {
  const pack = useMicrocopy()
  const summaries = useStore(draftStore, (s) => s.summaries)
  const selectedId = useStore(draftStore, (s) => s.selectedId)
  const document = useStore(documentStore, (s) => s.document)

  const [renameTarget, setRenameTarget] = useState<DraftSummary | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DraftSummary | null>(null)
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    if (document === null) return
    const title = document.meta?.title ?? document.basics.name ?? ''
    void exportResumeLazy(document).then((json) => downloadJson(json, title))
  }

  const handleImportFile = async (file: File | undefined) => {
    if (file === undefined) return
    setImportMessage(null)
    const json = await file.text()
    const result = await importDraftAction(json)
    if (!result.ok && result.reason !== 'STORAGE') {
      setImportMessage(pack.importErrors[result.reason])
    }
  }

  return (
    <aside aria-label={pack.drafts.title} className="flex w-full shrink-0 flex-col gap-3 lg:w-64">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-sm font-medium">{pack.drafts.title}</h2>
        <Button size="sm" onClick={() => void createDraft()}>
          {pack.drafts.create}
        </Button>
      </div>

      {importMessage !== null && (
        <p role="alert" className="text-xs text-destructive">
          {importMessage}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={handleExport} disabled={document === null}>
          {pack.drafts.export}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setImportMessage(null)
            fileInputRef.current?.click()
          }}
        >
          {pack.drafts.import}
        </Button>
        {/* T3a (FR-501/FR-502): PDF import with mandatory human review. */}
        <Button variant="outline" size="sm" onClick={() => setPdfDialogOpen(true)}>
          {pack.importPdf.button}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMPORT_TYPE}
          aria-label={pack.drafts.import}
          className="sr-only"
          onChange={(event) => {
            void handleImportFile(event.target.files?.[0])
            event.target.value = ''
          }}
        />
      </div>
      <ImportCvDialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen} />

      {summaries.length === 0 ? (
        <p className="text-xs text-muted-foreground">{pack.drafts.empty}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {summaries.map((summary) => {
            const isSelected = summary.id === selectedId
            return (
              <li
                key={summary.id}
                className={`flex items-center gap-1 border p-1 ${isSelected ? 'border-primary' : 'border-input'}`}
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 truncate px-1 py-0.5 text-left text-xs hover:underline"
                  aria-current={isSelected ? 'true' : undefined}
                  onClick={() => void loadDraftAction(summary.id)}
                >
                  {summary.title}
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`${pack.drafts.rename} ${summary.title}`}
                  onClick={() => setRenameTarget(summary)}
                >
                  <PencilIcon aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`${pack.drafts.duplicate} ${summary.title}`}
                  onClick={() => void duplicateDraft(summary.id)}
                >
                  <CopyIcon aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`${pack.drafts.remove} ${summary.title}`}
                  onClick={() => setDeleteTarget(summary)}
                >
                  <TrashIcon aria-hidden="true" />
                </Button>
              </li>
            )
          })}
        </ul>
      )}

      <Dialog
        open={renameTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null)
        }}
      >
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>{pack.drafts.renameTitle}</DialogTitle>
          </DialogHeader>
          {renameTarget !== null && (
            <RenameDraftForm
              initialTitle={renameTarget.title}
              label={pack.drafts.rename}
              onSubmit={(title) => {
                void renameDraft(renameTarget.id, title)
                setRenameTarget(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>{pack.drafts.remove}</DialogTitle>
            <DialogDescription>{pack.drafts.confirmDelete}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteTarget !== null) void deleteDraftAction(deleteTarget.id)
                setDeleteTarget(null)
              }}
            >
              {pack.drafts.remove}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task 15 (J9, F-A6): delete-all-data danger zone — beside the other
          data actions, never hidden in an advanced menu. */}
      <DataManagement />

      {/* Task 18 (FR-402/407/408): BYO-key session settings — with the other
          data-session configuration, outside #cv-preview. */}
      <AiSettings />
    </aside>
  )
}

function RenameDraftForm({
  initialTitle,
  label,
  onSubmit,
}: {
  initialTitle: string
  label: string
  onSubmit: (title: string) => void
}) {
  const [title, setTitle] = useState(initialTitle)
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(title)
      }}
    >
      <Input
        aria-label={label}
        value={title}
        maxLength={200}
        onChange={(event) => setTitle(event.target.value)}
      />
      <DialogFooter>
        <Button type="submit">{label}</Button>
      </DialogFooter>
    </form>
  )
}
