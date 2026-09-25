'use no memo'
import { useEffect, useId, useRef, useState } from 'react'
import { SparkleIcon } from '@phosphor-icons/react'
import { cn } from 'cn'
import { buttonVariants } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useMicrocopy } from '../form/useMicrocopy'
import { clearTailoringState } from '../store/ai-store'
import type { SectionKey } from '../../core/view-models'
import { TailoringPanel } from './TailoringPanel'

export interface TailoringTriggerProps {
  readonly section: SectionKey
  readonly sectionLabel: string
}

/** Long-press delay before the tooltip opens on touch devices. */
const LONG_PRESS_MS = 500

/**
 * Section-level T3b entry point (FR-601/602/603).
 *
 * One trigger opens one textarea: the pasted job ad goes in, the keyword
 * gap analysis for the section comes out as read-only review. Unlike the
 * C1/C1b/C2 triggers there is no Apply — a gap list never mutates the
 * draft, so this trigger takes no commit callback (FR-602 structural).
 *
 * The tooltip is intentionally hand-rolled (no positioning engine): the
 * base-ui Tooltip subtree costs double-digit kilobytes in the initial
 * chunk (performance-budget.md §1 — the ratchet is nearly exhausted), and
 * a hint anchored above its trigger needs nothing more than an absolutely
 * positioned note plus hover/focus/long-press handlers. Opted out of React
 * Compiler memoization like the other AI triggers; the production-build
 * e2e is the regression gate for this file.
 */
export function TailoringTrigger({ section, sectionLabel }: TailoringTriggerProps) {
  const pack = useMicrocopy()
  const [open, setOpen] = useState(false)
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tooltipId = useId()
  const triggerLabel = `${pack.aiTailoring.triggerLabel} ${sectionLabel}`

  const requestClose = (): void => {
    clearTailoringState()
    triggerRef.current?.focus()
    setOpen(false)
  }

  const cancelPress = (): void => {
    if (pressTimerRef.current !== null) {
      clearTimeout(pressTimerRef.current)
      pressTimerRef.current = null
    }
    setTooltipOpen(false)
  }

  // A press released, moved, or unmounted never opens the tooltip.
  useEffect(
    () => () => {
      if (pressTimerRef.current !== null) clearTimeout(pressTimerRef.current)
    },
    [],
  )

  return (
    // `contents` lets the trigger join the section flow while the panel
    // (basis-full, order-last) unfolds below it.
    <Collapsible open={open} onOpenChange={setOpen} className="contents">
      <span className="relative inline-flex">
        <CollapsibleTrigger
          ref={triggerRef}
          type="button"
          aria-label={triggerLabel}
          aria-describedby={tooltipOpen ? tooltipId : undefined}
          className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
          onMouseEnter={() => setTooltipOpen(true)}
          onMouseLeave={() => setTooltipOpen(false)}
          onFocus={() => setTooltipOpen(true)}
          onBlur={() => setTooltipOpen(false)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setTooltipOpen(false)
          }}
          onTouchStart={() => {
            pressTimerRef.current = setTimeout(() => setTooltipOpen(true), LONG_PRESS_MS)
          }}
          onTouchEnd={cancelPress}
          onTouchMove={cancelPress}
          onTouchCancel={cancelPress}
        >
          <SparkleIcon aria-hidden="true" />
        </CollapsibleTrigger>
        {tooltipOpen && (
          <span
            role="tooltip"
            id={tooltipId}
            className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1 w-max max-w-60 -translate-x-1/2 bg-foreground px-3 py-1.5 text-center text-xs text-background"
          >
            {pack.aiTailoring.triggerTooltip}
          </span>
        )}
      </span>
      <CollapsibleContent className="order-last basis-full">
        <TailoringPanel
          section={section}
          sectionLabel={sectionLabel}
          onRequestClose={requestClose}
        />
      </CollapsibleContent>
    </Collapsible>
  )
}
