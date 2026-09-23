'use no memo'
import { useRef, useState } from 'react'
import { SparkleIcon } from '@phosphor-icons/react'
import { cn } from 'cn'
import { buttonVariants } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useMicrocopy } from '../form/useMicrocopy'
import { clearBulletState } from '../store/ai-store'
import { BulletSuggestionsPanel } from './BulletSuggestionsPanel'
import type { BulletSectionKey } from './bullet-generator'

export interface BulletGeneratorProps {
  readonly section: BulletSectionKey
  /** Section display label (e.g. "Pengalaman") — keeps names unambiguous across sections. */
  readonly sectionLabel: string
  /** Row display label (e.g. "Poin pencapaian 2"). */
  readonly rowLabel: string
  /** Current row text; the request is built from the value at click time. */
  readonly rawTask: string
  readonly itemIndex: number
  /** 1-based bullet row position. */
  readonly position: number
  /** Replaces this row's text with the approved suggestion (FR-401 Apply). */
  readonly onApply: (text: string) => void
}

/**
 * Per-bullet C1 entry point (Task 19, FR-401/402/403).
 *
 * Same inline-panel shape as ActionVerbSuggestions (a popover positioning
 * module would breach the bundle ratchet): the trigger joins the row's flex
 * line while the panel unfolds below it. Opted out of React Compiler
 * memoization like AiSettings — the open/close handlers own focus
 * restoration, and only the production-build e2e can prove the flow.
 */
export function BulletGenerator({
  section,
  sectionLabel,
  rowLabel,
  rawTask,
  itemIndex,
  position,
  onApply,
}: BulletGeneratorProps) {
  const pack = useMicrocopy()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const triggerLabel = `${pack.aiBullets.triggerLabel} ${sectionLabel} ${rowLabel}`

  const requestClose = (): void => {
    clearBulletState()
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
        <BulletSuggestionsPanel
          section={section}
          sectionLabel={sectionLabel}
          rowLabel={rowLabel}
          rawTask={rawTask}
          itemIndex={itemIndex}
          position={position}
          onApply={onApply}
          onRequestClose={requestClose}
        />
      </CollapsibleContent>
    </Collapsible>
  )
}
