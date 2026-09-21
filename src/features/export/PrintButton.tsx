import { useState } from 'react'
import { useStore } from 'zustand'
import { Button } from '@/components/ui/button'
import { documentStore } from '../store/document-store'
import { uiStore } from '../store/ui-store'
import { useMicrocopy } from '../form/useMicrocopy'
import { PrintInstructionsModal } from './PrintInstructionsModal'
import { hasSeenPrintHelp, markPrintHelpSeen } from './print-prefs'
import { suggestedPdfFilename } from './slug'

/**
 * Print button (Task 14, D19, ADR-0007).
 *
 * ADR-0007 Opsi 4: the PDF is the browser print dialog over the live preview
 * (one codepath — preview IS the PDF source), so this button calls
 * `window.print()` on exactly the active mode's stylesheet. First print opens
 * the instructions modal; afterwards it prints directly. The help button
 * reopens the modal anytime. Lives OUTSIDE `#cv-preview` so control text can
 * never leak into the extraction gates.
 */
export function PrintButton() {
  const pack = useMicrocopy()
  const document = useStore(documentStore, (s) => s.document)
  const mode = useStore(uiStore, (s) => s.mode)
  const [helpOpen, setHelpOpen] = useState(false)

  if (document === null) return null
  const filename = suggestedPdfFilename(document.basics.name, mode)

  const handlePrint = (hideNextTime: boolean): void => {
    if (hideNextTime) markPrintHelpSeen()
    setHelpOpen(false)
    window.print()
  }

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <Button
        type="button"
        size="sm"
        onClick={() => {
          if (hasSeenPrintHelp()) window.print()
          else setHelpOpen(true)
        }}
      >
        {pack.print.button}
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => setHelpOpen(true)}>
        {pack.print.helpButton}
      </Button>
      <PrintInstructionsModal
        open={helpOpen}
        onOpenChange={setHelpOpen}
        filename={filename}
        onPrint={handlePrint}
      />
    </div>
  )
}
