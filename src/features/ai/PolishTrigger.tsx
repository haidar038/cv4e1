'use no memo'
import { useRef, useState } from 'react'
import { SparkleIcon } from '@phosphor-icons/react'
import { cn } from 'cn'
import { buttonVariants } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useMicrocopy } from '../form/useMicrocopy'
import { clearPolishState } from '../store/ai-store'
import { PolishSuggestionsPanel, type PolishTarget } from './PolishSuggestionsPanel'

export interface PolishTriggerProps {
  /** Which text this trigger polishes: the summary field or one bullet row. */
  readonly target: PolishTarget
  /** Field/row display label (e.g. "Ringkasan" or "Poin pencapaian 2"). */
  readonly label: string
  /** Current text; the request is built from the value at click time. */
  readonly text: string
  /** Replaces the target text with the approved polish (FR-401 Apply). */
  readonly onApply: (text: string) => void
}

/**
 * Per-text C2 entry point (Task 20, FR-401/402/403).
 *
 * Same inline-panel shape as BulletGenerator (Task 19): the trigger joins
 * the row's flex line while the panel unfolds below it. Opted out of React
 * Compiler memoization like the bullet UI — the open/close handlers own
 * focus restoration, and only the production-build e2e can prove the flow.
 */
export function PolishTrigger({ target, label, text, onApply }: PolishTriggerProps) {
  const pack = useMicrocopy()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const triggerLabel = `${pack.aiPolish.triggerLabel} ${label}`

  const requestClose = (): void => {
    clearPolishState()
    triggerRef.current?.focus()
    setOpen(false)
  }

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
        <SparkleIcon aria-hidden="true" />
      </CollapsibleTrigger>
      <CollapsibleContent className="order-last basis-full">
        <PolishSuggestionsPanel
          target={target}
          label={label}
          text={text}
          onApply={onApply}
          onRequestClose={requestClose}
        />
      </CollapsibleContent>
    </Collapsible>
  )
}
