import { useId } from 'react'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useBufferedValue } from '../useBufferedValue'
import type { ConstrainedFieldKind } from '../field-validation'

export interface FormFieldProps {
  label: string
  /** Guidance below the label; hidden when absent or blank (FR-204 structural pack). */
  hint?: string | undefined
  placeholder?: string | undefined
  type?: 'text' | 'email' | 'tel' | 'url' | undefined
  multiline?: boolean | undefined
  maxLength?: number | undefined
  inputMode?: 'text' | 'numeric' | 'tel' | 'decimal' | undefined
  kind?: ConstrainedFieldKind | undefined
  /** Message rendered when the blurred value is invalid for `kind`. */
  validationMessage?: string | undefined
  storeValue: string
  onCommit: (value: string) => void
  disabled?: boolean | undefined
}

/**
 * The workhorse text field: programmatic label + description wiring, error
 * announced via a role=alert node connected with aria-describedby, and the
 * typing buffer from useBufferedValue (valid input commits per keystroke,
 * errors appear on blur only).
 */
export function FormField({
  label,
  hint,
  placeholder,
  type = 'text',
  multiline = false,
  maxLength,
  inputMode,
  kind,
  validationMessage,
  storeValue,
  onCommit,
  disabled,
}: FormFieldProps) {
  const buffer = useBufferedValue({ storeValue, kind, onCommit })
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy =
    [hint !== undefined && hint !== '' ? hintId : null, buffer.showError ? errorId : null]
      .filter(Boolean)
      .join(' ') || undefined

  const sharedProps = {
    id,
    value: buffer.value,
    maxLength,
    placeholder,
    inputMode,
    disabled,
    'aria-invalid': buffer.showError || undefined,
    'aria-describedby': describedBy,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      buffer.onChange(event.target.value),
    onBlur: buffer.onBlur,
  } as const

  return (
    <Field data-invalid={buffer.showError || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {hint !== undefined && hint !== '' && <FieldDescription id={hintId}>{hint}</FieldDescription>}
      {multiline ? <Textarea rows={4} {...sharedProps} /> : <Input type={type} {...sharedProps} />}
      {buffer.showError && validationMessage !== undefined && validationMessage !== '' && (
        <FieldError id={errorId}>{validationMessage}</FieldError>
      )}
    </Field>
  )
}
