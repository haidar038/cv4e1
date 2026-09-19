import { PlusIcon, XIcon } from '@phosphor-icons/react'
import type { SkillGroup } from '../../../core/schema'
import { Button } from '@/components/ui/button'
import { addSectionItem, removeSectionItem, updateSectionItem } from '../../store/actions'
import { useMicrocopy } from '../useMicrocopy'
import { FormField } from '../fields/FormField'
import { StringListEditor } from '../fields/StringListEditor'
import { useSectionItems } from './useSectionItems'

export function SkillsForm() {
  const pack = useMicrocopy()
  const items = useSectionItems('skills')

  return (
    <div className="flex flex-col gap-5">
      {items.map((group, index) => (
        <SkillGroupEditor key={index} index={index} group={group} />
      ))}
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addSectionItem('skills', { items: [] })}
        >
          <PlusIcon aria-hidden="true" />
          {pack.actions.addGroup}
        </Button>
      </div>
    </div>
  )
}

function SkillGroupEditor({ index, group }: { index: number; group: SkillGroup }) {
  const pack = useMicrocopy()
  const heading = `${pack.sections.skills} ${index + 1}`
  const commit = (patch: Partial<SkillGroup>) => updateSectionItem('skills', index, patch)

  return (
    <fieldset className="flex flex-col gap-4 border p-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium">{heading}</h4>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`${pack.actions.remove} ${heading}`}
          onClick={() => removeSectionItem('skills', index)}
        >
          <XIcon aria-hidden="true" />
        </Button>
      </div>
      <FormField
        label={pack.fields.skillCategory.label}
        placeholder={pack.fields.skillCategory.placeholder}
        maxLength={80}
        storeValue={group.category ?? ''}
        onCommit={(value) => commit({ category: value === '' ? undefined : value })}
      />
      <StringListEditor
        label={pack.fields.skillItem.label}
        addItemLabel={`${pack.actions.addItem} ${pack.fields.skillItem.label}`}
        removeRowAria={(position) =>
          `${pack.actions.remove} ${pack.fields.skillItem.label} ${position}`
        }
        maxLength={60}
        placeholder={pack.fields.skillItem.placeholder}
        values={group.items}
        onCommit={(values) => commit({ items: values })}
      />
    </fieldset>
  )
}
