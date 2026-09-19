import { FormField } from './FormField'
import { useMicrocopy } from '../useMicrocopy'
import type { FieldCopy } from '../../../content/microcopy/id'

export interface PartialDateFieldProps {
  copy: FieldCopy
  storeValue: string
  onCommit: (value: string) => void
  disabled?: boolean | undefined
}

/**
 * Partial date (`YYYY`, `YYYY-MM`, `YYYY-MM-DD` — the schema's partialDate
 * shape). Numeric keyboard on mobile, format validated on blur via the core
 * schema through the shared buffer.
 */
export function PartialDateField({ copy, storeValue, onCommit, disabled }: PartialDateFieldProps) {
  const pack = useMicrocopy()
  return (
    <FormField
      label={copy.label}
      hint={copy.hint}
      placeholder={copy.placeholder}
      kind="partialDate"
      inputMode="numeric"
      maxLength={10}
      validationMessage={pack.validation.invalidDate}
      storeValue={storeValue}
      onCommit={onCommit}
      disabled={disabled}
    />
  )
}
