import { useState } from 'react'
import { fieldIsValid, type ConstrainedFieldKind } from './field-validation'

export interface BufferedValue {
  value: string
  /** True when the current local text is invalid for this field's kind. */
  invalidNow: boolean
  /** True only after the field was blurred while invalid (AC: no error before interaction). */
  showError: boolean
  onChange: (next: string) => void
  onBlur: () => void
}

/**
 * Local editing buffer for a constrained field. Valid input commits on every
 * keystroke so autosave never lags behind typing; invalid intermediate input
 * (a half-typed email, `3.` for a GPA, `2021-` for a date) stays local because
 * the store would reject it, and its error message surfaces only on blur.
 */
export function useBufferedValue(options: {
  storeValue: string
  kind?: ConstrainedFieldKind | undefined
  onCommit: (value: string) => void
}): BufferedValue {
  const { storeValue, kind, onCommit } = options
  const [local, setLocal] = useState(storeValue)
  const [blurred, setBlurred] = useState(false)

  // Adopt external store changes (draft loaded, other tab) by adjusting state
  // during render (react.dev: "adjusting state when props change"). While the
  // local text is a valid value it is already committed, so store and local
  // agree; while it is an invalid intermediate the store has not changed, so
  // typing is never clobbered.
  const [prevStoreValue, setPrevStoreValue] = useState(storeValue)
  if (prevStoreValue !== storeValue) {
    setPrevStoreValue(storeValue)
    setLocal(storeValue)
  }

  const invalidNow = kind !== undefined && !fieldIsValid(kind, local)
  return {
    value: local,
    invalidNow,
    showError: blurred && invalidNow,
    onChange(next) {
      setLocal(next)
      if (kind === undefined || fieldIsValid(kind, next)) onCommit(next)
    },
    onBlur() {
      setBlurred(true)
    },
  }
}
