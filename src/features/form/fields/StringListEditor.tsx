import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { PlusIcon, XIcon } from '@phosphor-icons/react'

function keyOf(rows: readonly string[]): string {
  return rows.filter((row) => row !== '').join('\u0000')
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
}: StringListEditorProps) {
  const [rows, setRows] = useState<string[]>(() => values ?? [])
  const [lastCommittedKey, setLastCommittedKey] = useState(() => keyOf(values ?? []))

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

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      {hint !== undefined && hint !== '' && <FieldDescription>{hint}</FieldDescription>}
      <div className="flex flex-col gap-2">
        {rows.map((row, index) => {
          const rowLabel = `${label} ${index + 1}`
          return (
            <div key={index} className="flex items-center gap-2">
              <Input
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
