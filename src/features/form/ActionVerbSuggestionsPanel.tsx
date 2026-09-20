import type { KeyboardEvent } from 'react'
import type { SectionKey } from '../../core/view-models'
import type { ActionVerbEntry } from '../../content/action-verbs'
import { getVerbCategories, getVerbsForSection } from '../../content/action-verbs'
import { useMicrocopy } from './useMicrocopy'

/** Sections whose bullets get verb suggestions — exactly the catalog's target sections. */
export type SuggestionSectionKey = Extract<SectionKey, 'experience' | 'organizations' | 'projects'>

export interface ActionVerbSuggestionsPanelProps {
  section: SuggestionSectionKey
  /** Called with the picked verb; the row editor inserts it at the caret. */
  onPick: (verb: string) => void
  /** Escape closes the panel; the shell owns focus restoration and state. */
  onRequestClose: () => void
  /**
   * Overrides the catalog lookup — test seam for the empty-catalog path,
   * which the section-typed API cannot reach in production (the catalog
   * guarantees entries for all three sections; asserted in
   * action-verbs.test.ts).
   */
  verbs?: readonly ActionVerbEntry[]
}

/**
 * Groups verbs under catalog categories, preserving catalog order and
 * dropping categories without entries for this section. Pure data derivation
 * (no DOM) so the grouping contract is testable directly.
 */
export function groupVerbsByCategory(
  verbs: readonly ActionVerbEntry[],
): Array<{ category: string; verbs: ActionVerbEntry[] }> {
  return getVerbCategories()
    .map((category) => ({
      category,
      verbs: verbs.filter((entry) => entry.category === category),
    }))
    .filter((group) => group.verbs.length > 0)
}

/**
 * The suggestion list itself (FR-205): verbs filtered per section, grouped by
 * static category headings (each group named for its category; the outer
 * group is named for the panel). Each verb is a button whose accessible name
 * is the verb alone; the `examplePhrase` pattern is display-only (J4 — the
 * user stays the author, placeholders never leak into the CV text). Arrow
 * keys move focus through the verbs, Home/End jump, Enter activates, Escape
 * closes via `onRequestClose`.
 */
export function ActionVerbSuggestionsPanel({
  section,
  onPick,
  onRequestClose,
  verbs,
}: ActionVerbSuggestionsPanelProps) {
  const pack = useMicrocopy()
  const groups = groupVerbsByCategory(verbs ?? getVerbsForSection(section))

  if (groups.length === 0) {
    return <p className="px-1 py-2 text-muted-foreground">{pack.actionVerbs.emptyState}</p>
  }

  const moveFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onRequestClose()
      return
    }
    if (
      event.key !== 'ArrowDown' &&
      event.key !== 'ArrowUp' &&
      event.key !== 'Home' &&
      event.key !== 'End'
    ) {
      return
    }
    const buttons = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('button[data-verb]'),
    )
    if (buttons.length === 0) return
    event.preventDefault()
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement)
    if (event.key === 'Home' || (event.key === 'ArrowDown' && current === -1)) {
      buttons[0]?.focus()
    } else if (event.key === 'End' || (event.key === 'ArrowUp' && current === -1)) {
      buttons[buttons.length - 1]?.focus()
    } else if (event.key === 'ArrowDown') {
      buttons[(current + 1) % buttons.length]?.focus()
    } else {
      buttons[(current - 1 + buttons.length) % buttons.length]?.focus()
    }
  }

  return (
    <div
      role="group"
      aria-label={pack.actionVerbs.toggleLabel}
      className="flex max-h-64 flex-col gap-3 overflow-y-auto pr-1"
      data-slot="verb-suggestions"
      onKeyDown={moveFocus}
    >
      <p className="px-1 text-muted-foreground">{pack.actionVerbs.hint}</p>
      {groups.map((group, groupIndex) => (
        <div
          key={group.category}
          role="group"
          aria-label={group.category}
          className="flex flex-col gap-1"
        >
          <p className="text-muted-foreground">{group.category}</p>
          <ul className="flex flex-col gap-1">
            {group.verbs.map((entry, verbIndex) => (
              <li key={entry.verb}>
                <button
                  type="button"
                  data-verb={entry.verb}
                  autoFocus={groupIndex === 0 && verbIndex === 0}
                  onClick={() => onPick(entry.verb)}
                  className="w-full rounded-none border border-transparent px-1.5 py-1 text-left text-xs font-medium hover:border-border hover:bg-muted focus-visible:border-ring focus-visible:bg-muted focus-visible:outline-none"
                >
                  {entry.verb}
                </button>
                <p className="px-1.5 pb-1 text-muted-foreground">{entry.examplePhrase}</p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
