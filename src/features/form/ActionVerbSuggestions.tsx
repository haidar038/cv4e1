import { useRef, useState } from 'react'
import { LightbulbIcon } from '@phosphor-icons/react'
import { cn } from 'cn'
import { buttonVariants } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useMicrocopy } from './useMicrocopy'
import { ActionVerbSuggestionsPanel, type SuggestionSectionKey } from './ActionVerbSuggestionsPanel'

export interface ActionVerbSuggestionsProps {
  section: SuggestionSectionKey
  /** Section display label (e.g. "Pengalaman") — keeps names unambiguous across sections. */
  sectionLabel: string
  /** Row display label (e.g. "Poin pencapaian 2"). */
  rowLabel: string
  /** Called with the picked verb; the row editor inserts it at the caret. */
  onPick: (verb: string) => void
}

/**
 * Per-bullet suggestion entry point (FR-205, FR-206 — local catalog, no
 * network). A disclosure panel unfolds below the bullet row: a Base UI
 * popover was measured at +25.4 KB gzip for its positioning/portal module
 * graph, which breaches the fatal bundle ratchet, while the inline panel
 * keeps both gates green and is the safer shape on a 360 px screen.
 *
 * The trigger's accessible name carries section and row, so two rows never
 * share a name. Picking a verb inserts it at the caret via `onPick` and
 * closes the panel; the row editor returns focus to the input.
 */
export function ActionVerbSuggestions({
  section,
  sectionLabel,
  rowLabel,
  onPick,
}: ActionVerbSuggestionsProps) {
  const pack = useMicrocopy()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const triggerLabel = `${pack.actionVerbs.toggleLabel} ${sectionLabel} ${rowLabel}`

  return (
    // `contents` lets the trigger join the row's flex line while the panel
    // (basis-full, order-last) unfolds below the row.
    <Collapsible open={open} onOpenChange={setOpen} className="contents">
      <CollapsibleTrigger
        ref={triggerRef}
        type="button"
        aria-label={triggerLabel}
        className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
      >
        <LightbulbIcon aria-hidden="true" />
      </CollapsibleTrigger>
      <CollapsibleContent className="order-last basis-full">
        <ActionVerbSuggestionsPanel
          section={section}
          onPick={(verb) => {
            onPick(verb)
            setOpen(false)
          }}
          onRequestClose={() => {
            triggerRef.current?.focus()
            setOpen(false)
          }}
        />
      </CollapsibleContent>
    </Collapsible>
  )
}
