import { useMicrocopy } from '../useMicrocopy'
import { StringListEditor } from './StringListEditor'

export interface HighlightsEditorProps {
  highlights: string[] | undefined
  onCommit: (highlights: string[]) => void
}

/** Bullet editor for an item's `highlights` (max 400 chars each, schema). */
export function HighlightsEditor({ highlights, onCommit }: HighlightsEditorProps) {
  const pack = useMicrocopy()
  return (
    <StringListEditor
      label={pack.fields.highlights.label}
      hint={pack.fields.highlights.hint === '' ? undefined : pack.fields.highlights.hint}
      addItemLabel={`${pack.actions.addItem} ${pack.fields.highlights.label}`}
      removeRowAria={(position) =>
        `${pack.actions.remove} ${pack.fields.highlights.label} ${position}`
      }
      maxLength={400}
      values={highlights}
      onCommit={onCommit}
    />
  )
}
