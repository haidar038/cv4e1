import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { useId } from 'react'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectFieldProps {
  label: string
  value: string | undefined
  options: SelectOption[]
  /** Renders an extra empty option with this label that commits `undefined`. */
  emptyOptionLabel?: string | undefined
  /** Optional guidance below the select, e.g. the chosen status writing example. */
  description?: string | undefined
  onCommit: (value: string | undefined) => void
}

/** Native select (keyboard- and screen-reader-friendly by construction). */
export function SelectField({
  label,
  value,
  options,
  emptyOptionLabel,
  description,
  onCommit,
}: SelectFieldProps) {
  const id = useId()
  const descriptionId = `${id}-description`
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <NativeSelect
        id={id}
        value={value ?? ''}
        aria-describedby={
          description !== undefined && description !== '' ? descriptionId : undefined
        }
        onChange={(event) => {
          const next = event.target.value
          onCommit(next === '' ? undefined : next)
        }}
      >
        {emptyOptionLabel !== undefined && <option value="">{emptyOptionLabel}</option>}
        {options.map((option) => (
          <NativeSelectOption key={option.value} value={option.value}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      {description !== undefined && description !== '' && (
        <FieldDescription id={descriptionId}>{description}</FieldDescription>
      )}
    </Field>
  )
}
