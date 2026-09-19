import { PlusIcon, XIcon } from '@phosphor-icons/react'
import type { CertificationItem } from '../../../core/schema'
import { Button } from '@/components/ui/button'
import { addSectionItem, removeSectionItem, updateSectionItem } from '../../store/actions'
import { useMicrocopy } from '../useMicrocopy'
import { FormField } from '../fields/FormField'
import { PartialDateField } from '../fields/PartialDateField'
import { useSectionItems } from './useSectionItems'

export function CertificationsForm() {
  const pack = useMicrocopy()
  const items = useSectionItems('certifications')

  return (
    <div className="flex flex-col gap-5">
      {items.map((item, index) => (
        <CertificationItemEditor key={index} index={index} item={item} />
      ))}
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addSectionItem('certifications', { name: '' })}
        >
          <PlusIcon aria-hidden="true" />
          {`${pack.actions.addItem} ${pack.sections.certifications}`}
        </Button>
      </div>
    </div>
  )
}

function CertificationItemEditor({ index, item }: { index: number; item: CertificationItem }) {
  const pack = useMicrocopy()
  const heading = `${pack.sections.certifications} ${index + 1}`
  const commit = (patch: Partial<CertificationItem>) =>
    updateSectionItem('certifications', index, patch)

  return (
    <fieldset className="flex flex-col gap-4 border p-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium">{heading}</h4>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`${pack.actions.remove} ${heading}`}
          onClick={() => removeSectionItem('certifications', index)}
        >
          <XIcon aria-hidden="true" />
        </Button>
      </div>
      <FormField
        label={pack.fields.certName.label}
        placeholder={pack.fields.certName.placeholder}
        maxLength={200}
        storeValue={item.name}
        onCommit={(value) => commit({ name: value })}
      />
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-2">
        <FormField
          label={pack.fields.issuer.label}
          placeholder={pack.fields.issuer.placeholder}
          maxLength={200}
          storeValue={item.issuer ?? ''}
          onCommit={(value) => commit({ issuer: value === '' ? undefined : value })}
        />
        <PartialDateField
          copy={pack.fields.issueDate}
          storeValue={item.issueDate ?? ''}
          onCommit={(value) => commit({ issueDate: value === '' ? undefined : value })}
        />
      </div>
      <FormField
        label={pack.fields.url.label}
        placeholder={pack.fields.url.placeholder}
        type="url"
        kind="url"
        maxLength={500}
        validationMessage={pack.validation.invalidUrl}
        storeValue={item.url ?? ''}
        onCommit={(value) => commit({ url: value === '' ? undefined : value })}
      />
    </fieldset>
  )
}
