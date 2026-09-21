import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useMicrocopy } from '../form/useMicrocopy'

/**
 * Print instructions modal (Task 14, D19, ADR-0007).
 *
 * The browser owns the print dialog — header/footer toggles and the output
 * filename cannot be set programmatically — so this modal is honest guidance
 * in Bahasa Indonesia: pick "Save as PDF", turn off headers/footers per
 * browser, and use the suggested `CV-<slug>-<mode>.pdf` name when saving.
 * Only non-empty guidance strings render (FR-204 blanks them for non-id).
 */
export function PrintInstructionsModal({
  open,
  onOpenChange,
  filename,
  onPrint,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  filename: string
  onPrint: (hideNextTime: boolean) => void
}) {
  const pack = useMicrocopy()
  const [hideNextTime, setHideNextTime] = useState(false)
  const steps = [pack.print.chrome, pack.print.firefox, pack.print.safari].filter(
    (step) => step !== '',
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>{pack.print.title}</DialogTitle>
          {pack.print.intro !== '' && <DialogDescription>{pack.print.intro}</DialogDescription>}
        </DialogHeader>
        {steps.length > 0 && (
          <ul className="flex list-disc flex-col gap-1 pl-5 text-xs text-muted-foreground">
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        )}
        {pack.print.filenameNote !== '' && (
          <p className="text-xs text-muted-foreground">
            {pack.print.filenameNote.replace('{filename}', filename)}
            <span className="mt-1 block font-mono break-all text-foreground">{filename}</span>
          </p>
        )}
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={hideNextTime}
            onChange={(event) => setHideNextTime(event.target.checked)}
          />
          {pack.print.doNotShowAgain}
        </label>
        <DialogFooter>
          <Button type="button" onClick={() => onPrint(hideNextTime)}>
            {pack.print.printAction}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
