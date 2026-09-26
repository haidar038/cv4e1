import { useStore } from 'zustand'
import { setPaperSize } from '../store/actions'
import { documentStore } from '../store/document-store'
import { uiStore, type PaperSize } from '../store/ui-store'
import { useMicrocopy } from '../form/useMicrocopy'

/**
 * Preview paper-size selector (A4 ↔ Letter): the same native-radio pattern
 * as ModeToggle — free keyboard arrows and screen-reader semantics, no
 * extra dependency. The choice is a UI preference (localStorage) that only
 * changes the on-screen paper frame; the browser print dialog stays the
 * paper-size control for the actual PDF (ADR-0007).
 */
export function PaperSizeSelector() {
  const pack = useMicrocopy()
  const paperSize = useStore(uiStore, (s) => s.paperSize)
  const hasDocument = useStore(documentStore, (s) => s.document !== null)

  if (!hasDocument) return null

  const options: Array<{ value: PaperSize; label: string }> = [
    { value: 'a4', label: pack.preview.paperA4 },
    { value: 'letter', label: pack.preview.paperLetter },
  ]

  return (
    <div>
      <fieldset className="border-0 p-0">
        <legend className="mb-1 text-xs font-medium">{pack.preview.paperSizeLabel}</legend>
        <div className="inline-flex w-full border border-input sm:w-auto">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex-1 cursor-pointer text-center sm:flex-none sm:px-6"
            >
              <input
                type="radio"
                name="cv-paper-size"
                value={option.value}
                checked={paperSize === option.value}
                onChange={() => {
                  if (paperSize !== option.value) setPaperSize(option.value)
                }}
                className="peer sr-only"
              />
              <span className="block px-3 py-1.5 text-xs font-medium text-muted-foreground peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-1 peer-focus-visible:ring-ring peer-focus-visible:ring-inset">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  )
}
