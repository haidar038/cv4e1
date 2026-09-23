import { PlusIcon, XIcon } from '@phosphor-icons/react'
import type { ExperienceItem } from '../../../core/schema'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { addSectionItem, removeSectionItem, updateSectionItem } from '../../store/actions'
import { useMicrocopy } from '../useMicrocopy'
import { ActionVerbSuggestions } from '../ActionVerbSuggestions'
import { BulletGenerator } from '../../ai/BulletGenerator'
import { PolishTrigger } from '../../ai/PolishTrigger'
import { FormField } from '../fields/FormField'
import { HighlightsEditor } from '../fields/HighlightsEditor'
import { PartialDateField } from '../fields/PartialDateField'
import { SelectField } from '../fields/SelectField'
import type { FieldCopy } from '../../../content/microcopy/id'
import type { SectionKey } from '../../../core/view-models'
import { useSectionItems } from './useSectionItems'

export function ExperienceForm() {
  const pack = useMicrocopy()
  const items = useSectionItems('experience')

  return (
    <div className="flex flex-col gap-5">
      {items.map((item, index) => (
        <ExperienceItemEditor key={index} section="experience" index={index} item={item} />
      ))}
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addSectionItem('experience', { organization: '', current: false })}
        >
          <PlusIcon aria-hidden="true" />
          {`${pack.actions.addItem} ${pack.sections.experience}`}
        </Button>
      </div>
    </div>
  )
}

/**
 * Shared item editor for `experience` and `organizations` — the schema gives
 * both the identical item shape, and target-users.md §8 requires organizations
 * to be treated as equal experience, never as "less".
 */
export function ExperienceItemEditor({
  section,
  index,
  item,
}: {
  section: Extract<SectionKey, 'experience' | 'organizations'>
  index: number
  item: ExperienceItem
}) {
  const pack = useMicrocopy()
  const sectionLabel =
    section === 'experience' ? pack.sections.experience : pack.sections.organizations
  const heading = `${sectionLabel} ${index + 1}`
  const commit = (patch: Partial<ExperienceItem>) => updateSectionItem(section, index, patch)

  return (
    <fieldset className="flex flex-col gap-4 border p-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium">{heading}</h4>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`${pack.actions.remove} ${heading}`}
          onClick={() => removeSectionItem(section, index)}
        >
          <XIcon aria-hidden="true" />
        </Button>
      </div>
      <FormField
        label={pack.fields.orgName.label}
        placeholder={pack.fields.orgName.placeholder}
        maxLength={200}
        storeValue={item.organization}
        onCommit={(value) => commit({ organization: value })}
      />
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-2">
        <FormField
          label={pack.fields.role.label}
          placeholder={pack.fields.role.placeholder}
          maxLength={200}
          storeValue={item.role ?? ''}
          onCommit={(value) => commit({ role: value === '' ? undefined : value })}
        />
        <EmploymentTypeSelect
          value={item.employmentType}
          onCommit={(value) => commit({ employmentType: value })}
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
        {/* `current` locks the end date: there is nothing to fill yet. */}
        <PartialDateField
          copy={pack.fields.endDate}
          storeValue={item.endDate ?? ''}
          onCommit={(value) => commit({ endDate: value === '' ? undefined : value })}
          disabled={item.current === true}
        />
      </div>
      <CurrentCheckbox
        label={pack.fields.current}
        checked={item.current === true}
        onCheckedChange={(checked) => commit({ current: checked })}
      />
      <HighlightsEditor
        highlights={item.highlights}
        onCommit={(highlights) => commit({ highlights })}
        renderRowSlot={({ position, insertAtCursor: insertVerb, replaceRow }) => (
          <>
            <ActionVerbSuggestions
              section={section}
              sectionLabel={sectionLabel}
              rowLabel={`${pack.fields.highlights.label} ${position}`}
              onPick={insertVerb}
            />
            <BulletGenerator
              section={section}
              sectionLabel={sectionLabel}
              rowLabel={`${pack.fields.highlights.label} ${position}`}
              rawTask={item.highlights?.[position - 1] ?? ''}
              itemIndex={index}
              position={position}
              onApply={replaceRow}
            />
            <PolishTrigger
              target={{ kind: 'bullet', section, itemIndex: index, position }}
              label={`${pack.fields.highlights.label} ${position}`}
              text={item.highlights?.[position - 1] ?? ''}
              onApply={replaceRow}
            />
          </>
        )}
      />
    </fieldset>
  )
}

function EmploymentTypeSelect({
  value,
  onCommit,
}: {
  value: ExperienceItem['employmentType']
  onCommit: (value: ExperienceItem['employmentType']) => void
}) {
  const pack = useMicrocopy()
  const options = (
    Object.entries(pack.employmentType) as Array<
      [NonNullable<ExperienceItem['employmentType']>, string]
    >
  ).map(([employmentType, label]) => ({ value: employmentType, label }))
  return (
    <SelectField
      label={pack.fields.employmentType.label}
      value={value}
      emptyOptionLabel={pack.common.selectEmpty}
      onCommit={(next) =>
        onCommit(next === undefined ? undefined : (next as ExperienceItem['employmentType']))
      }
      options={options}
    />
  )
}

function CurrentCheckbox({
  label,
  checked,
  onCheckedChange,
}: {
  label: FieldCopy
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  // aria-label carries the accessible name: base-ui's checkbox root is a span
  // (not a natively labelable element), so a plain <label> cannot associate
  // with it — while the visible text stays as a sibling span so the accessible
  // name matches the visible one (WCAG 2.5.3 Label in Name).
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        aria-label={label.label}
        checked={checked}
        onCheckedChange={(next) => onCheckedChange(next === true)}
      />
      <span className="text-xs">{label.label}</span>
    </div>
  )
}
