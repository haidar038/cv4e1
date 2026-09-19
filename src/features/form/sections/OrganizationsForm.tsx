import { PlusIcon } from '@phosphor-icons/react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { addSectionItem } from '../../store/actions'
import { ExperienceItemEditor } from './ExperienceForm'
import { useMicrocopy } from '../useMicrocopy'
import { useSectionItems } from './useSectionItems'

/**
 * Organizations use the identical item schema as experience and are presented
 * the same way (target-users.md §8: kepanitiaan/BEM/KKN are legitimate CV
 * material) — the only addition is the guiding micro-copy (F-C: organizations
 * guidance) shown above the items.
 */
export function OrganizationsForm() {
  const pack = useMicrocopy()
  const items = useSectionItems('organizations')

  return (
    <div className="flex flex-col gap-5">
      {pack.organizations.guidance !== '' && (
        <Alert>
          <AlertTitle>{pack.sections.organizations}</AlertTitle>
          <AlertDescription>
            <p>{pack.organizations.guidance}</p>
            {pack.organizations.examples !== '' && <p>{pack.organizations.examples}</p>}
          </AlertDescription>
        </Alert>
      )}
      {items.map((item, index) => (
        <ExperienceItemEditor key={index} section="organizations" index={index} item={item} />
      ))}
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addSectionItem('organizations', { organization: '', current: false })}
        >
          <PlusIcon aria-hidden="true" />
          {`${pack.actions.addItem} ${pack.sections.organizations}`}
        </Button>
      </div>
    </div>
  )
}
