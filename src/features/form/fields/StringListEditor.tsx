import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { PlusIcon, XIcon } from '@phosphor-icons/react'
import { insertAtCursor } from './insertAtCursor'

function keyOf(rows: readonly string[]): string {
  return rows.filter((row) => row !== '').join('\u0000')
}

/** Everything a per-row slot needs in order to offer row-level extras. */
export interface StringListRowSlotArgs {
  /** 1-based row position, matching the row input's accessible name suffix. */
  position: number
  /** Inserts `text` at this row input's caret; never overwrites user text. */
  insertAtCursor: (text: string) => void
  /** Replaces this row's text wholesale (AI Apply); typing stays untouched. */
  replaceRow: (text: string) => void
}

export interface StringListEditorProps {
  /** Visible group label, also the base for per-row accessible names. */
  label: string
  hint?: string | undefined
  addItemLabel: string
  removeRowAria: (position: number) => string
  maxLength: number
  placeholder?: string | undefined
  /** Current values; undefined behaves like an empty list. */
  values: string[] | undefined
  onCommit: (values: string[]) => void
  /**
   * Optional per-row slot rendered between the input and the remove button
   * (e.g. verb suggestions). Omit for lists without row-level extras —
   * Education and Skills stay slot-free.
   */
  renderRowSlot?: ((args: StringListRowSlotArgs) => ReactNode) | undefined
}

/**
 * Ordered list of single-line string values (highlights, skill items). Rows
 * live in local state so an empty row survives while typing; the store only
 * ever receives the non-empty projection, so no placeholder values persist.
 */
export function StringListEditor({
  label,
  hint,
  addItemLabel,
  removeRowAria,
  maxLength,
  placeholder,
  values,
  onCommit,
  renderRowSlot,
}: StringListEditorProps) {
  const [rows, setRows] = useState<string[]>(() => values ?? [])
  const [lastCommittedKey, setLastCommittedKey] = useState(() => keyOf(values ?? []))
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  // Adopt external store changes (draft loaded, other tab) during render, but
  // only when they differ from what this editor last committed — otherwise
  // clearing a row to retype it would remove the row mid-typing.
  const storeKey = keyOf(values ?? [])
  if (storeKey !== lastCommittedKey) {
    setLastCommittedKey(storeKey)
    if (keyOf(rows) !== storeKey) setRows([...(values ?? [])])
  }

  const commit = (next: string[]) => {
    const committed = next.filter((row) => row !== '')
    setLastCommittedKey(keyOf(committed))
    onCommit(committed)
  }

  // Suggestion application goes through the same commit path as typing:
  // the whole row is replaced, the store receives the non-empty projection,
  // and focus returns to the row input so keyboard flow continues there.
  const replaceRow = (index: number, text: string) => {
    const next = [...rows]
    next[index] = text
    setRows(next)
    commit(next)
    requestAnimationFrame(() => {
      const target = inputRefs.current[index]
      if (!target) return
      target.focus()
      target.setSelectionRange(text.length, text.length)
    })
  }
  // Suggestion insertion goes through the same commit path as typing. The
  // selection is read off the input element (it survives the blur a click
  // causes); focus and caret are restored a frame later so the popover's own
  // close-focus handling cannot win the race.
  const insertIntoRow = (index: number, text: string) => {
    const input = inputRefs.current[index]
    const current = rows[index] ?? ''
    const result = insertAtCursor({
      value: current,
      selectionStart: input?.selectionStart ?? current.length,
      insert: text,
    })
    const next = [...rows]
    next[index] = result.value
    setRows(next)
    commit(next)
    requestAnimationFrame(() => {
      const target = inputRefs.current[index]
      if (!target) return
      target.focus()
      target.setSelectionRange(result.caret, result.caret)
    })
  }

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      {hint !== undefined && hint !== '' && <FieldDescription>{hint}</FieldDescription>}
      <div className="flex flex-col gap-2">
        {rows.map((row, index) => {
          const rowLabel = `${label} ${index + 1}`
          return (
            // flex-wrap: a row slot's full-width panel (e.g. verb suggestions)
            // unfolds on its own line below the input.
            <div key={index} className="flex flex-wrap items-center gap-2">
              <Input
                ref={(element) => {
                  inputRefs.current[index] = element
                }}
                className="min-w-0 flex-1"
                aria-label={rowLabel}
                value={row}
                maxLength={maxLength}
                placeholder={placeholder}
                onChange={(event) => {
                  const next = [...rows]
                  next[index] = event.target.value
                  setRows(next)
                  commit(next)
                }}
              />
              {renderRowSlot?.({
                position: index + 1,
                insertAtCursor: (text) => insertIntoRow(index, text),
                replaceRow: (text) => replaceRow(index, text),
              })}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={removeRowAria(index + 1)}
                onClick={() => {
                  const next = rows.filter((_, position) => position !== index)
                  setRows(next)
                  commit(next)
                }}
              >
                <XIcon aria-hidden="true" />
              </Button>
            </div>
          )
        })}
        <div>
          <Button type="button" variant="outline" size="sm" onClick={() => setRows([...rows, ''])}>
            <PlusIcon aria-hidden="true" />
            {addItemLabel}
          </Button>
        </div>
      </div>
    </Field>
  )
}
