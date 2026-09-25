import { PlusIcon, XIcon } from '@phosphor-icons/react'
import type { ProjectItem } from '../../../core/schema'
import { Button } from '@/components/ui/button'
import { addSectionItem, removeSectionItem, updateSectionItem } from '../../store/actions'
import { useMicrocopy } from '../useMicrocopy'
import { ActionVerbSuggestions } from '../ActionVerbSuggestions'
import { AchievementTrigger } from '../../ai/AchievementTrigger'
import { TailoringTrigger } from '../../ai/TailoringTrigger'
import { BulletGenerator } from '../../ai/BulletGenerator'
import { PolishTrigger } from '../../ai/PolishTrigger'
import { FormField } from '../fields/FormField'
import { HighlightsEditor } from '../fields/HighlightsEditor'
import { PartialDateField } from '../fields/PartialDateField'
import { useSectionItems } from './useSectionItems'

export function ProjectsForm() {
  const pack = useMicrocopy()
  const items = useSectionItems('projects')

  return (
    <div className="flex flex-col gap-5">
      {items.map((item, index) => (
        <ProjectItemEditor key={index} index={index} item={item} />
      ))}
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addSectionItem('projects', { name: '' })}
        >
          <PlusIcon aria-hidden="true" />
          {`${pack.actions.addItem} ${pack.sections.projects}`}
        </Button>
      </div>
      <TailoringTrigger section="projects" sectionLabel={pack.sections.projects} />
    </div>
  )
}

function ProjectItemEditor({ index, item }: { index: number; item: ProjectItem }) {
  const pack = useMicrocopy()
  const heading = `${pack.sections.projects} ${index + 1}`
  const commit = (patch: Partial<ProjectItem>) => updateSectionItem('projects', index, patch)

  return (
    <fieldset className="flex flex-col gap-4 border p-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium">{heading}</h4>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`${pack.actions.remove} ${heading}`}
          onClick={() => removeSectionItem('projects', index)}
        >
          <XIcon aria-hidden="true" />
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-2">
        <FormField
          label={pack.fields.projectName.label}
          placeholder={pack.fields.projectName.placeholder}
          maxLength={200}
          storeValue={item.name}
          onCommit={(value) => commit({ name: value })}
        />
        <FormField
          label={pack.fields.projectRole.label}
          placeholder={pack.fields.projectRole.placeholder}
          maxLength={200}
          storeValue={item.role ?? ''}
          onCommit={(value) => commit({ role: value === '' ? undefined : value })}
        />
      </div>
      <FormField
        label={pack.fields.context.label}
        hint={pack.fields.context.hint}
        placeholder={pack.fields.context.placeholder}
        maxLength={200}
        storeValue={item.context ?? ''}
        onCommit={(value) => commit({ context: value === '' ? undefined : value })}
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
      <HighlightsEditor
        highlights={item.highlights}
        onCommit={(highlights) => commit({ highlights })}
        renderRowSlot={({ position, insertAtCursor: insertVerb, replaceRow }) => (
          <>
            <ActionVerbSuggestions
              section="projects"
              sectionLabel={pack.sections.projects}
              rowLabel={`${pack.fields.highlights.label} ${position}`}
              onPick={insertVerb}
            />
            <BulletGenerator
              section="projects"
              sectionLabel={pack.sections.projects}
              rowLabel={`${pack.fields.highlights.label} ${position}`}
              rawTask={item.highlights?.[position - 1] ?? ''}
              itemIndex={index}
              position={position}
              onApply={replaceRow}
            />
            <PolishTrigger
              target={{ kind: 'bullet', section: 'projects', itemIndex: index, position }}
              label={`${pack.fields.highlights.label} ${position}`}
              text={item.highlights?.[position - 1] ?? ''}
              onApply={replaceRow}
            />
          </>
        )}
      />
      <AchievementTrigger
        section="projects"
        sectionLabel={pack.sections.projects}
        itemIndex={index}
        onCommitHighlights={(highlights) => commit({ highlights })}
      />
    </fieldset>
  )
}
