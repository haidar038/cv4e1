import { ArrowDownIcon, ArrowUpIcon } from '@phosphor-icons/react'
import type { SectionKey } from '../../core/view-models'
import { Button } from '@/components/ui/button'
import { useMicrocopy } from './useMicrocopy'

export interface SectionOrderControlsProps {
  section: SectionKey
  sectionLabel: string
  position: number
  total: number
  onMove: (section: SectionKey, direction: 'up' | 'down') => void
}

/**
 * Section reorder buttons (F-B9, D22): plain buttons instead of drag-and-drop,
 * so reordering works with the keyboard naturally and no DnD dependency is
 * added. Hidden entirely for the first/last section instead of being disabled,
 * keeping the tab order free of dead controls.
 */
export function SectionOrderControls({
  section,
  sectionLabel,
  position,
  total,
  onMove,
}: SectionOrderControlsProps) {
  const pack = useMicrocopy()
  return (
    <div className="flex flex-col">
      {position > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={`${pack.actions.moveUp} ${sectionLabel}`}
          onClick={() => onMove(section, 'up')}
        >
          <ArrowUpIcon aria-hidden="true" />
        </Button>
      )}
      {position < total - 1 && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={`${pack.actions.moveDown} ${sectionLabel}`}
          onClick={() => onMove(section, 'down')}
        >
          <ArrowDownIcon aria-hidden="true" />
        </Button>
      )}
    </div>
  )
}
