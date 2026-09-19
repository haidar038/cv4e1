import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { PlusIcon, XIcon } from '@phosphor-icons/react'
import type { Link } from '../../../core/schema'
import { fieldIsValid } from '../field-validation'
import { useBufferedValue } from '../useBufferedValue'
import { useMicrocopy } from '../useMicrocopy'

export interface LinkListEditorProps {
  links: Link[] | undefined
  onCommit: (links: Link[]) => void
}

interface LinkRow {
  label: string
  url: string
}

/**
 * Only rows with a non-empty, schema-valid URL reach the store; rows still
 * being typed stay in local state. `label` is omitted when empty (optional).
 */
function keyOf(rows: readonly Link[]): string {
  return JSON.stringify(rows)
}

function committable(rows: LinkRow[]): Link[] {
  return rows
    .filter((row) => row.url !== '' && fieldIsValid('url', row.url))
    .map((row) => ({ ...(row.label !== '' && { label: row.label }), url: row.url }))
}

export function LinkListEditor({ links, onCommit }: LinkListEditorProps) {
  const pack = useMicrocopy()
  const [rows, setRows] = useState<LinkRow[]>(() =>
    (links ?? []).map((row) => ({ label: row.label ?? '', url: row.url })),
  )
  const [lastCommittedKey, setLastCommittedKey] = useState(() => keyOf(committable(rows)))

  // Adopt external store changes (draft loaded, other tab) during render, but
  // only when they differ from what this editor last committed — rows still
  // being typed stay local.
  const storeKey = keyOf(links ?? [])
  if (storeKey !== lastCommittedKey) {
    setLastCommittedKey(storeKey)
    if (keyOf(committable(rows)) !== storeKey) {
      setRows((links ?? []).map((row) => ({ label: row.label ?? '', url: row.url })))
    }
  }

  const commitRows = (next: LinkRow[]) => {
    const committed = committable(next)
    setLastCommittedKey(keyOf(committed))
    setRows(next)
    onCommit(committed)
  }

  return (
    <Field>
      <FieldLabel>{pack.fields.linkLabel.label}</FieldLabel>
      <div className="flex flex-col gap-2">
        {rows.map((row, index) => (
          <LinkRowEditor
            key={index}
            index={index}
            row={row}
            onChange={(nextRow) => {
              const next = [...rows]
              next[index] = nextRow
              commitRows(next)
            }}
            onRemove={() => commitRows(rows.filter((_, position) => position !== index))}
          />
        ))}
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => commitRows([...rows, { label: '', url: '' }])}
          >
            <PlusIcon aria-hidden="true" />
            {pack.actions.addLink}
          </Button>
        </div>
      </div>
    </Field>
  )
}

interface LinkRowEditorProps {
  index: number
  row: LinkRow
  onChange: (next: LinkRow) => void
  onRemove: () => void
}

function LinkRowEditor({ index, row, onChange, onRemove }: LinkRowEditorProps) {
  const pack = useMicrocopy()
  const id = useId()
  const urlErrorId = `${id}-url-error`
  const position = index + 1

  const labelBuffer = useBufferedValue({
    storeValue: row.label,
    onCommit: (value) => onChange({ ...row, label: value }),
  })
  const urlBuffer = useBufferedValue({
    storeValue: row.url,
    kind: 'url',
    onCommit: (value) => onChange({ ...row, url: value }),
  })
  const showUrlError = urlBuffer.showError

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <div className="w-32 shrink-0">
          <Label srOnly={`${pack.fields.linkLabel.label} ${position}`} htmlFor={`${id}-label`} />
          <Input
            id={`${id}-label`}
            aria-label={`${pack.fields.linkLabel.label} ${position}`}
            value={labelBuffer.value}
            maxLength={60}
            placeholder={pack.fields.linkLabel.placeholder}
            onChange={(event) => labelBuffer.onChange(event.target.value)}
            onBlur={labelBuffer.onBlur}
          />
        </div>
        <div className="flex-1">
          <Label srOnly={`${pack.fields.linkUrl.label} ${position}`} htmlFor={`${id}-url`} />
          <Input
            id={`${id}-url`}
            type="url"
            aria-label={`${pack.fields.linkUrl.label} ${position}`}
            aria-invalid={showUrlError || undefined}
            aria-describedby={showUrlError ? urlErrorId : undefined}
            value={urlBuffer.value}
            maxLength={500}
            placeholder={pack.fields.linkUrl.placeholder}
            onChange={(event) => urlBuffer.onChange(event.target.value)}
            onBlur={urlBuffer.onBlur}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`${pack.actions.remove} ${pack.fields.linkLabel.label} ${position}`}
          onClick={onRemove}
        >
          <XIcon aria-hidden="true" />
        </Button>
      </div>
      {showUrlError && <FieldError id={urlErrorId}>{pack.validation.invalidUrl}</FieldError>}
    </div>
  )
}

/** Visually hidden label (used inside compact row layouts). */
function Label({ srOnly, htmlFor }: { srOnly: string; htmlFor: string }) {
  return (
    <FieldLabel htmlFor={htmlFor} className="sr-only">
      {srOnly}
    </FieldLabel>
  )
}
