'use no memo'

import { useRef, useState } from 'react'
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
import { useMicrocopy } from '../form/useMicrocopy'
import { importPdfCandidateAction } from '../store/actions'
import {
  ImportPdfError,
  runPdfImport,
  type ImportCandidate,
  type ImportPipelineDeps,
} from './import-pipeline'
import { OcrError } from './ocr-text'

type Stage = 'idle' | 'working' | 'review' | 'error'

const ACCEPTED_PDF_TYPE = 'application/pdf'
const MAX_REVIEW_FIELDS = 30
const MAX_REVIEW_UNMAPPED = 10

/** Reads a PDF-import reason; unknown codes fall back honestly, never crash. */
function pdfErrorMessage(errors: Record<string, string>, fallback: string, reason: string): string {
  return errors[reason] ?? fallback
}

/**
 * PDF import dialog (T3a, FR-501/FR-502).
 *
 * Bounded flow in local state: pick a file → pipeline (lazy pdf.js, OCR
 * fallback with progress + cancel) → review candidates → explicit approval
 * saves a NEW draft (AC-501-a/AC-502-a). Reads the file and the pipeline
 * result at event time (Task 18 stale-closure class); nothing is stored
 * before approval, and cancel/close leaves every store untouched.
 */
export function ImportCvDialog({
  open,
  onOpenChange,
  pipelineDeps,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Test seam for the pipeline engines. Production never passes this. */
  pipelineDeps?: ImportPipelineDeps
}) {
  const pack = useMicrocopy()
  const copy = pack.importPdf
  const [stage, setStage] = useState<Stage>('idle')
  const [statusNote, setStatusNote] = useState<string | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [candidate, setCandidate] = useState<ImportCandidate | null>(null)
  const [errorReason, setErrorReason] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    abortRef.current?.abort()
    abortRef.current = null
    setStage('idle')
    setStatusNote(null)
    setProgress(null)
    setCandidate(null)
    setErrorReason(null)
    if (fileInputRef.current !== null) fileInputRef.current.value = ''
  }

  const handleClose = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const handleCancelWork = () => {
    handleClose(false)
  }

  const handleFile = (file: File | undefined) => {
    if (file === undefined) return
    const controller = new AbortController()
    abortRef.current = controller
    setStage('working')
    setStatusNote(copy.extractingNote)
    setProgress(0)
    setCandidate(null)
    setErrorReason(null)
    void runPdfImport(
      file,
      (pipelineStage, ratio) => {
        if (pipelineStage === 'ocr') {
          setStatusNote(copy.ocrNote)
          setProgress(ratio)
        } else if (pipelineStage === 'mapping') {
          setStatusNote(copy.mappingNote)
        } else {
          setProgress(ratio)
        }
      },
      pipelineDeps,
      controller.signal,
    ).then(
      (result) => {
        if (controller.signal.aborted) return
        abortRef.current = null
        setCandidate(result)
        setProgress(null)
        setStatusNote(copy.readyNote)
        setStage('review')
      },
      (error: unknown) => {
        if (controller.signal.aborted || error instanceof OcrError) {
          reset()
          return
        }
        abortRef.current = null
        setProgress(null)
        setStatusNote(null)
        setErrorReason(
          error instanceof ImportPdfError
            ? pdfErrorMessage(copy.errors, copy.errors.VALIDATION_FAILED, error.reason)
            : copy.errors.VALIDATION_FAILED,
        )
        setStage('error')
      },
    )
  }

  const handleApprove = () => {
    const current = candidate
    if (current === null) return
    setStatusNote(copy.mappingNote)
    void importPdfCandidateAction(current.document).then((result) => {
      if (!result.ok && result.reason !== 'STORAGE') {
        setErrorReason(pdfErrorMessage(copy.errors, copy.errors.VALIDATION_FAILED, result.reason))
        setStatusNote(null)
        setStage('error')
        return
      }
      handleClose(false)
    })
  }

  const shownFields = candidate?.fields.slice(0, MAX_REVIEW_FIELDS) ?? []
  const hiddenFieldCount = (candidate?.fields.length ?? 0) - shownFields.length
  const shownUnmapped = candidate?.unmapped.slice(0, MAX_REVIEW_UNMAPPED) ?? []

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        handleClose(next)
      }}
    >
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>{copy.dialogTitle}</DialogTitle>
          <DialogDescription>{copy.hint}</DialogDescription>
        </DialogHeader>

        {stage === 'idle' && (
          <div className="flex flex-col gap-2">
            <label htmlFor="import-pdf-file" className="text-xs font-medium">
              {copy.fileLabel}
            </label>
            <Input
              ref={fileInputRef}
              id="import-pdf-file"
              type="file"
              accept={ACCEPTED_PDF_TYPE}
              onChange={(event) => {
                handleFile(event.target.files?.[0])
              }}
            />
          </div>
        )}

        {stage === 'working' && (
          <div className="flex flex-col gap-2">
            <p role="status" className="text-xs text-muted-foreground">
              {statusNote}
              {progress !== null ? ` ${Math.round(progress * 100)}%` : ''}
            </p>
            {statusNote === copy.ocrNote && (
              <p className="text-xs text-muted-foreground">{copy.ocrDownloadNote}</p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={handleCancelWork}>
                {copy.cancelAction}
              </Button>
            </DialogFooter>
          </div>
        )}

        {stage === 'review' && candidate !== null && (
          <div className="flex flex-col gap-3">
            <p role="status" className="text-xs text-muted-foreground">
              {candidate.source === 'ocr' ? copy.sourceOcrNote : copy.sourceTextNote}
            </p>
            <div className="flex flex-col gap-1" aria-label={copy.reviewTitle}>
              <p className="text-xs font-medium">{copy.reviewTitle}</p>
              <p className="text-[11px] text-muted-foreground">
                {candidate.fields.length} {copy.fieldCountNote}
              </p>
              <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto">
                {shownFields.map((field) => (
                  <li key={field.field} className="flex flex-col gap-0.5 border border-input p-1.5">
                    <span className="text-xs font-medium">{field.value}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {field.field} ·{' '}
                      {field.confidence === 'high'
                        ? copy.confidenceHigh
                        : field.confidence === 'medium'
                          ? copy.confidenceMedium
                          : copy.confidenceLow}
                    </span>
                  </li>
                ))}
              </ul>
              {hiddenFieldCount > 0 && (
                <p className="text-[11px] text-muted-foreground">+{hiddenFieldCount}</p>
              )}
            </div>
            {candidate.unmappedTotal > 0 && (
              <div className="flex flex-col gap-1">
                <p className="text-xs text-muted-foreground">
                  {copy.unmappedNote.replace('{count}', String(candidate.unmappedTotal))}
                </p>
                <ul className="flex max-h-24 flex-col gap-0.5 overflow-y-auto">
                  {shownUnmapped.map((line, index) => (
                    <li key={`${index}-${line.slice(0, 20)}`} className="text-[11px] text-muted-foreground">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={handleCancelWork}>
                {copy.cancelAction}
              </Button>
              <Button onClick={handleApprove}>{copy.approveAction}</Button>
            </DialogFooter>
          </div>
        )}

        {stage === 'error' && (
          <div className="flex flex-col gap-2">
            <p role="alert" className="text-xs text-destructive">
              {errorReason}
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancelWork}>
                {copy.cancelAction}
              </Button>
              <Button
                onClick={() => {
                  reset()
                }}
              >
                {copy.retryAction}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
