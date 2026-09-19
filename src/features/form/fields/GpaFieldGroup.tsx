import { useState } from 'react'
import { FieldDescription } from '@/components/ui/field'
import type { Gpa } from '../../../core/schema'
import { FormField } from './FormField'
import { useMicrocopy } from '../useMicrocopy'

export interface GpaFieldGroupProps {
  gpa: Gpa | undefined
  onCommit: (gpa: Gpa | undefined) => void
}

/** Default materialized here matches the schema defaults (gpaSchema). */
const DEFAULT_SCALE = '4.00'
const DEFAULT_LABEL = 'IPK'

/**
 * GPA value + scale pair. Clearing the value removes the whole GPA; the scale
 * commits only alongside a value. While a value exists and the user has not
 * yet touched the scale, the missingScaleWarning from the micro-copy pack is
 * shown (F-C: warn when the scale is missing — localization-guide §3.1).
 */
export function GpaFieldGroup({ gpa, onCommit }: GpaFieldGroupProps) {
  const pack = useMicrocopy()
  const [scaleTouched, setScaleTouched] = useState(false)

  const commitValue = (value: string) => {
    if (value === '') {
      onCommit(undefined)
      return
    }
    onCommit({ value, scale: gpa?.scale ?? DEFAULT_SCALE, label: gpa?.label ?? DEFAULT_LABEL })
  }

  const commitScale = (scale: string) => {
    setScaleTouched(true)
    if (gpa === undefined) return
    // An empty scale cannot be persisted (the schema always fills the
    // default), so clearing snaps back to the canonical default.
    onCommit({ value: gpa.value, scale: scale === '' ? DEFAULT_SCALE : scale, label: gpa.label })
  }

  const showMissingScaleWarning =
    gpa !== undefined && gpa.value !== '' && !scaleTouched && pack.gpa.missingScaleWarning !== ''

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:gap-2">
      <div className="flex-1">
        <FormField
          label={pack.fields.gpaValue.label}
          hint={pack.fields.gpaValue.hint}
          placeholder={pack.fields.gpaValue.placeholder}
          kind="gpaValue"
          inputMode="decimal"
          maxLength={5}
          validationMessage={pack.validation.invalidGpaValue}
          storeValue={gpa?.value ?? ''}
          onCommit={commitValue}
        />
      </div>
      <div className="flex-1">
        <FormField
          label={pack.fields.gpaScale.label}
          placeholder={pack.fields.gpaScale.placeholder}
          kind="gpaScale"
          inputMode="decimal"
          maxLength={5}
          validationMessage={pack.validation.invalidGpaScale}
          storeValue={gpa?.scale ?? ''}
          onCommit={commitScale}
        />
        {showMissingScaleWarning && (
          <FieldDescription>{pack.gpa.missingScaleWarning}</FieldDescription>
        )}
      </div>
    </div>
  )
}
