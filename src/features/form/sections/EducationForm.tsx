import { PlusIcon, XIcon } from '@phosphor-icons/react'
import type { EducationItem } from '../../../core/schema'
import { Button } from '@/components/ui/button'
import { addSectionItem, removeSectionItem, updateSectionItem } from '../../store/actions'
import { useMicrocopy } from '../useMicrocopy'
import { FormField } from '../fields/FormField'
import { GpaFieldGroup } from '../fields/GpaFieldGroup'
import { HighlightsEditor } from '../fields/HighlightsEditor'
import { PartialDateField } from '../fields/PartialDateField'
import { SelectField } from '../fields/SelectField'
import { useSectionItems } from './useSectionItems'

export function EducationForm() {
  const pack = useMicrocopy()
  const items = useSectionItems('education')

  return (
    <div className="flex flex-col gap-5">
      {items.map((item, index) => (
        <EducationItemEditor key={index} index={index} item={item} />
      ))}
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addSectionItem('education', { institution: '' })}
        >
          <PlusIcon aria-hidden="true" />
          {`${pack.actions.addItem} ${pack.sections.education}`}
        </Button>
      </div>
    </div>
  )
}

function statusOptions(pack: ReturnType<typeof useMicrocopy>) {
  return (Object.keys(pack.educationStatus) as Array<NonNullable<EducationItem['status']>>).map(
    (status) => ({ value: status, label: pack.educationStatus[status].label }),
  )
}

function EducationItemEditor({ index, item }: { index: number; item: EducationItem }) {
  const pack = useMicrocopy()
  const heading = `${pack.sections.education} ${index + 1}`
  const commit = (patch: Partial<EducationItem>) => updateSectionItem('education', index, patch)
  const selectedStatus = item.status !== undefined ? pack.educationStatus[item.status] : undefined

  return (
    <fieldset className="flex flex-col gap-4 border p-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium">{heading}</h4>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`${pack.actions.remove} ${heading}`}
          onClick={() => removeSectionItem('education', index)}
        >
          <XIcon aria-hidden="true" />
        </Button>
      </div>
      <FormField
        label={pack.fields.institution.label}
        placeholder={pack.fields.institution.placeholder}
        maxLength={200}
        storeValue={item.institution}
        onCommit={(value) => commit({ institution: value })}
      />
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-2">
        <FormField
          label={pack.fields.degree.label}
          placeholder={pack.fields.degree.placeholder}
          maxLength={200}
          storeValue={item.degree ?? ''}
          onCommit={(value) => commit({ degree: value === '' ? undefined : value })}
        />
        <FormField
          label={pack.fields.fieldOfStudy.label}
          placeholder={pack.fields.fieldOfStudy.placeholder}
          maxLength={200}
          storeValue={item.field ?? ''}
          onCommit={(value) => commit({ field: value === '' ? undefined : value })}
        />
      </div>
      <FormField
        label={pack.fields.itemLocation.label}
        placeholder={pack.fields.itemLocation.placeholder}
        maxLength={120}
        storeValue={item.location ?? ''}
        onCommit={(value) => commit({ location: value === '' ? undefined : value })}
      />
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-2">
        <PartialDateField
          copy={pack.fields.startDate}
          storeValue={item.startDate ?? ''}
          onCommit={(value) => commit({ startDate: value === '' ? undefined : value })}
        />
        <PartialDateField
          copy={pack.fields.endDate}
          storeValue={item.endDate ?? ''}
          onCommit={(value) => commit({ endDate: value === '' ? undefined : value })}
        />
      </div>
      <SelectField
        label={pack.fields.status.label}
        value={item.status}
        options={statusOptions(pack)}
        emptyOptionLabel={pack.common.selectEmpty}
        description={selectedStatus?.example}
        onCommit={(value) =>
          commit({ status: value === undefined ? undefined : (value as EducationItem['status']) })
        }
      />
      <GpaFieldGroup gpa={item.gpa} onCommit={(gpa) => commit({ gpa })} />
      <HighlightsEditor
        highlights={item.highlights}
        onCommit={(highlights) => commit({ highlights })}
      />
    </fieldset>
  )
}
