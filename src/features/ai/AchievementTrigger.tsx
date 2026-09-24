'use no memo'
import { useEffect, useId, useRef, useState } from 'react'
import { SparkleIcon } from '@phosphor-icons/react'
import { cn } from 'cn'
import { buttonVariants } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useMicrocopy } from '../form/useMicrocopy'
import { documentStore } from '../store/document-store'
import { clearAchievementState } from '../store/ai-store'
import { AchievementPanel } from './AchievementPanel'
import type { AchievementSectionKey } from './achievement-generator'

export interface AchievementTriggerProps {
  readonly section: AchievementSectionKey
  readonly sectionLabel: string
  readonly itemIndex: number
  /** Appends approved suggestion texts as new bullet rows (FR-401 Apply). */
  readonly onCommitHighlights: (highlights: string[]) => void
}

/**
 * Reads the item's live bullet rows from the DocumentStore at event time —
 * never from a captured render prop. Event-handler closures can observe
 * permanently stale render state in the production build (Task 18
 * incident); the store read is always fresh because editors commit every
 * change.
 */
function readLiveHighlights(section: AchievementSectionKey, itemIndex: number): string[] {
  const items = documentStore.getState().document?.sections[section]
  return [...(items?.[itemIndex]?.highlights ?? [])]
}

/** Long-press delay before the tooltip opens on touch devices. */
const LONG_PRESS_MS = 500

/**
 * Item-level C1b entry point (unified flow, FR-401/402/403).
 *
 * One trigger opens one textarea: the achievement description goes in,
 * 1–3 polished bullets come out, each applied as a new row. The per-row
 * C1/C2 triggers stay untouched — this is additive, not a replacement.
 *
 * The tooltip is intentionally hand-rolled (no positioning engine): the
 * base-ui Tooltip subtree costs double-digit kilobytes in the initial
 * chunk (performance-budget.md §1 — the ratchet is nearly exhausted), and
 * a hint anchored above its trigger needs nothing more than an absolutely
 * positioned note plus hover/focus/long-press handlers. Opted out of React
 * Compiler memoization like the other AI triggers; the production-build
 * e2e is the regression gate for this file.
 */
export function AchievementTrigger({
  section,
  sectionLabel,
  itemIndex,
  onCommitHighlights,
}: AchievementTriggerProps) {
  const pack = useMicrocopy()
  const [open, setOpen] = useState(false)
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tooltipId = useId()
  const triggerLabel = `${pack.aiAchievement.triggerLabel} ${sectionLabel}`

  const requestClose = (): void => {
    clearAchievementState()
    triggerRef.current?.focus()
    setOpen(false)
  }

  const appendHighlight = (text: string): void => {
    onCommitHighlights([...readLiveHighlights(section, itemIndex), text])
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
    // `contents` lets the trigger join the item's flex line while the panel
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
            {pack.aiAchievement.triggerTooltip}
          </span>
        )}
      </span>
      <CollapsibleContent className="order-last basis-full">
        <AchievementPanel
          section={section}
          sectionLabel={sectionLabel}
          itemIndex={itemIndex}
          onAppend={appendHighlight}
          onRequestClose={requestClose}
        />
      </CollapsibleContent>
    </Collapsible>
  )
}
