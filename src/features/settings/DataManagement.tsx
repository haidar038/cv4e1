import { useState } from 'react'
import { useStore } from 'zustand'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { exportResumeLazy } from '../../storage/export-import-lazy'
import type { WipeReport, WipeStepName } from '../../storage'
import { wipeAllDataAction } from '../store/actions'
import { documentStore } from '../store/document-store'
import { useMicrocopy } from '../form/useMicrocopy'

/** Twin of the DraftPanel downloader (kept local — no cross-feature refactor). */
function downloadJson(json: string, title: string): void {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${
    title
      .replace(/[^\p{L}\p{N}_-]+/gu, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'cv'
  }.json`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function remainderLabel(step: WipeStepName, pack: ReturnType<typeof useMicrocopy>): string {
  if (step === 'indexedDB') return pack.dataSafety.remainderDrafts
  if (step === 'localStorage') return pack.dataSafety.remainderPrefs
  return pack.dataSafety.remainderCache
}

type Phase = 'confirm' | 'working' | 'done'

/**
 * Delete-all-data danger zone (Task 15, J9, F-A6, FR-108, DF-8).
 *
 * Lives in the DraftPanel — the home of every other data action
 * (new/rename/duplicate/delete/export/import) — so it is easy to find, never
 * hidden in an advanced menu. Flow: explicit confirmation → export-first
 * offer (a failed export never blocks the wipe) → wipe → explicit reload as
 * the final step (no unread auto-reload; the page must show the empty
 * condition afterwards). Cancelling deletes nothing. Mounted outside
 * `#cv-preview` so none of its text can leak into the PDF extraction gates.
 */
export function DataManagement() {
  const pack = useMicrocopy()
  const document = useStore(documentStore, (s) => s.document)
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<Phase>('confirm')
  const [report, setReport] = useState<WipeReport | null>(null)
  const [exportFailed, setExportFailed] = useState(false)

  const close = (): void => {
    setOpen(false)
    setPhase('confirm')
    setReport(null)
    setExportFailed(false)
  }

  const handleExportFirst = (): void => {
    if (document === null) return
    const title = document.meta?.title ?? document.basics.name ?? ''
    void exportResumeLazy(document).then(
      (json) => {
        downloadJson(json, title)
        setExportFailed(false)
      },
      () => {
        setExportFailed(true)
      },
    )
  }

  const handleConfirm = (): void => {
    setPhase('working')
    void wipeAllDataAction().then((wiped) => {
      setReport(wiped)
      setPhase('done')
    })
  }

  const failedSteps = (report?.steps ?? []).filter((step) => !step.ok)
  const remainder = failedSteps
    .map((step) => remainderLabel(step.step, pack))
    .filter((label) => label !== '')
    .join(', ')

  return (
    <section aria-label={pack.dataSafety.sectionTitle} className="flex flex-col gap-2 border p-2">
      <h2 className="font-heading text-sm font-medium">{pack.dataSafety.sectionTitle}</h2>
      {pack.dataSafety.sectionDescription !== '' && (
        <p className="text-xs text-muted-foreground">{pack.dataSafety.sectionDescription}</p>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="text-destructive"
        onClick={() => setOpen(true)}
      >
        {pack.dataSafety.openDialog}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) close()
        }}
      >
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>{pack.dataSafety.dialogTitle}</DialogTitle>
            {phase === 'confirm' && pack.dataSafety.dialogDescription !== '' && (
              <DialogDescription>{pack.dataSafety.dialogDescription}</DialogDescription>
            )}
          </DialogHeader>

          {phase === 'confirm' && (
            <>
              {exportFailed && pack.dataSafety.exportFailedNote !== '' && (
                <p role="alert" className="text-xs text-destructive">
                  {pack.dataSafety.exportFailedNote}
                </p>
              )}
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={close}>
                  {pack.dataSafety.cancel}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleExportFirst}
                  disabled={document === null}
                >
                  {pack.dataSafety.exportFirst}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="text-destructive"
                  onClick={handleConfirm}
                >
                  {pack.dataSafety.confirm}
                </Button>
              </DialogFooter>
            </>
          )}

          {phase === 'working' && (
            <p role="status" className="text-xs text-muted-foreground">
              {pack.dataSafety.wiping}
            </p>
          )}

          {phase === 'done' && report !== null && (
            <>
              {report.ok
                ? pack.dataSafety.success !== '' && (
                    <p role="status" className="text-xs text-muted-foreground">
                      {pack.dataSafety.success}
                    </p>
                  )
                : pack.dataSafety.partial !== '' && (
                    <p role="alert" className="text-xs text-destructive">
                      {pack.dataSafety.partial.replace('{remainder}', remainder)}
                    </p>
                  )}
              <DialogFooter>
                {!report.ok && (
                  <Button type="button" variant="outline" onClick={close}>
                    {pack.dataSafety.close}
                  </Button>
                )}
                <Button
                  type="button"
                  variant={report.ok ? 'default' : 'outline'}
                  className={report.ok ? undefined : 'text-destructive'}
                  onClick={() => window.location.reload()}
                >
                  {pack.dataSafety.reload}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
