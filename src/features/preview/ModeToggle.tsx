import { useStore } from 'zustand'
import { setMode } from '../store/actions'
import { documentStore } from '../store/document-store'
import { uiStore, type ResumeMode } from '../store/ui-store'
import { useMicrocopy } from '../form/useMicrocopy'

/**
 * Mode toggle (Task 12, FR-003, J3): the product-differentiating switcher.
 *
 * Decision D-dec-1 (plan): native radio inputs, not a base-ui ToggleGroup —
 * the measured base-ui popover variant cost +25,4 KB in Task 13b against
 * ±4,4 KB of remaining jsGzip ratchet room, and native radios give keyboard
 * arrows, focus retention, and screen-reader semantics for free. Styling uses
 * theme tokens only; no transitions are added, so `prefers-reduced-motion`
 * is respected by construction (there is nothing to animate).
 *
 * The mode change itself is announced twice: natively by the radio group,
 * and explicitly through the `role="status"` live region (AC: announced to
 * screen readers). The only document change flows through `setMode()`, which
 * touches `meta.mode` alone (invariant proven in `store.test.ts`).
 */
export function ModeToggle() {
  const pack = useMicrocopy()
  const mode = useStore(uiStore, (s) => s.mode)
  const hasDocument = useStore(documentStore, (s) => s.document !== null)

  if (!hasDocument) return null

  const options: Array<{ value: ResumeMode; label: string }> = [
    { value: 'ats', label: pack.preview.atsMode },
    { value: 'creative', label: pack.preview.creativeMode },
  ]
  const activeLabel = mode === 'ats' ? pack.preview.atsMode : pack.preview.creativeMode

  return (
    <div>
      <fieldset className="border-0 p-0">
        <legend className="mb-1 text-xs font-medium">{pack.preview.modeLabel}</legend>
        <div className="inline-flex w-full border border-input sm:w-auto">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex-1 cursor-pointer text-center sm:flex-none sm:px-6"
            >
              <input
                type="radio"
                name="cv-preview-mode"
                value={option.value}
                checked={mode === option.value}
                onChange={() => {
                  if (mode !== option.value) setMode(option.value)
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
      <p role="status" className="sr-only">
        {pack.preview.modeStatus.replace('{mode}', activeLabel)}
      </p>
    </div>
  )
}
