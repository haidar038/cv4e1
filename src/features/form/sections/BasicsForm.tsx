import { useStore } from 'zustand'
import type { ResumeBasics } from '../../../core/schema'
import { updateBasics } from '../../store/actions'
import { documentStore } from '../../store/document-store'
import { useMicrocopy } from '../useMicrocopy'
import { FormField } from '../fields/FormField'
import { LinkListEditor } from '../fields/LinkListEditor'
import { PhotoUpload } from '../photo/PhotoUpload'

const EMPTY_BASICS: ResumeBasics = { name: '' }

export function BasicsForm() {
  const pack = useMicrocopy()
  const basics = useStore(documentStore, (s) => s.document?.basics ?? EMPTY_BASICS)

  return (
    <div className="flex flex-col gap-5">
      <FormField
        label={pack.fields.name.label}
        hint={pack.fields.name.hint}
        placeholder={pack.fields.name.placeholder}
        maxLength={120}
        storeValue={basics.name}
        onCommit={(value) => updateBasics({ name: value })}
      />
      <FormField
        label={pack.fields.headline.label}
        hint={pack.fields.headline.hint}
        placeholder={pack.fields.headline.placeholder}
        maxLength={160}
        storeValue={basics.headline ?? ''}
        onCommit={(value) => updateBasics({ headline: value === '' ? undefined : value })}
      />
      <FormField
        label={pack.fields.email.label}
        hint={pack.fields.email.hint}
        placeholder={pack.fields.email.placeholder}
        type="email"
        kind="email"
        maxLength={200}
        validationMessage={pack.validation.invalidEmail}
        storeValue={basics.email ?? ''}
        onCommit={(value) => updateBasics({ email: value === '' ? undefined : value })}
      />
      <FormField
        label={pack.fields.phone.label}
        hint={pack.fields.phone.hint}
        placeholder={pack.fields.phone.placeholder}
        type="tel"
        maxLength={40}
        storeValue={basics.phone ?? ''}
        onCommit={(value) => updateBasics({ phone: value === '' ? undefined : value })}
      />
      <FormField
        label={pack.fields.location.label}
        hint={pack.fields.location.hint}
        placeholder={pack.fields.location.placeholder}
        maxLength={120}
        storeValue={basics.location ?? ''}
        onCommit={(value) => updateBasics({ location: value === '' ? undefined : value })}
      />
      <FormField
        label={pack.fields.summary.label}
        hint={pack.fields.summary.hint}
        placeholder={pack.fields.summary.placeholder}
        multiline
        maxLength={1200}
        storeValue={basics.summary ?? ''}
        onCommit={(value) => updateBasics({ summary: value === '' ? undefined : value })}
      />
      <LinkListEditor
        links={basics.links}
        onCommit={(links) => updateBasics({ links: links.length === 0 ? undefined : links })}
      />
      <PhotoUpload photo={basics.photo} />
    </div>
  )
}
