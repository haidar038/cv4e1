import type {
  CertificationDisplay,
  CreativeViewModel,
  EducationDisplay,
  ExperienceDisplay,
  OrderedSection,
  ProjectDisplay,
  SkillGroupDisplay,
} from '../../../../core/view-models'
import { EducationItem } from '../../sections/EducationItem'
import { ExperienceItem } from '../../sections/ExperienceItem'
import { ProjectItem } from '../../sections/ProjectItem'
import { SafeLink } from '../../../SafeLink'
import { CertificationItem, SkillsGroup } from '../../sections/SkillsCertifications'
import styles from './styles.module.css'

/**
 * The injected photo seam: the renderer never touches IndexedDB/storage
 * (module boundary — render/ may not import storage/). features/ supplies a
 * resolver that turns the view model's assetRef into a local object URL, or
 * undefined when the blob cannot be loaded (neutral placeholder).
 */
export type PhotoResolver = (assetRef: string) => string | undefined

export interface TemplateDefaultProps {
  vm: CreativeViewModel
  resolvePhotoUrl: PhotoResolver
}

type AnySectionItem =
  EducationDisplay | ExperienceDisplay | ProjectDisplay | SkillGroupDisplay | CertificationDisplay

/**
 * The one Creative template of Fase 1 (D17): two columns via flex — sidebar
 * (photo, contacts, links, skills) left, main column (name, headline, summary,
 * remaining sections) right. Flex is allowed here; the single-column rule is
 * ATS-specific. DOM order equals visual order, so the printed reading order
 * stays deterministic for extraction (FR-303).
 *
 * Like the ATS renderer, every display string (dates, GPA, labels, headings)
 * was already composed by normalize(); the template only places them. The
 * skills section is pulled into the sidebar while every remaining section
 * keeps its view-model order in the main column. The sidebar is not rendered
 * at all when it would be empty (no odd empty column), and a photo whose blob
 * failed to load becomes a neutral framed placeholder — never an <img> without
 * a URL, never invented content.
 */
export function TemplateDefault({ vm, resolvePhotoUrl }: TemplateDefaultProps) {
  const skills = vm.sections.find((section) => section.key === 'skills')
  const mainSections = vm.sections.filter((section) => section.key !== 'skills')
  const contacts = [vm.contacts.email, vm.contacts.phone, vm.contacts.location].filter(
    (contact): contact is string => contact !== undefined && contact !== '',
  )
  const photoUrl = vm.photo !== undefined ? resolvePhotoUrl(vm.photo.assetRef) : undefined
  const hasSidebar =
    vm.photo !== undefined || contacts.length > 0 || vm.links.length > 0 || skills !== undefined

  return (
    <article className={`cv-creative ${styles.doc}`}>
      {hasSidebar && (
        <aside className={styles.sidebar}>
          {vm.photo !== undefined &&
            (photoUrl !== undefined ? (
              // Alt text is the owner's name — pure view-model data, no copy
              // layer. An empty name (legal in-progress draft) makes the
              // photo decorative (alt="") per the structural gate contract.
              <img className={styles.photo} src={photoUrl} alt={vm.name} />
            ) : (
              <div className={styles.photoPlaceholder} aria-hidden="true" />
            ))}
          {contacts.map((contact) => (
            <p className={styles.contactLine} key={contact}>
              {contact}
            </p>
          ))}
          {vm.links.map((link) => (
            <p className={styles.linkLine} key={link.url}>
              {/* Same `label: url` composition as the ATS renderer: the URL
                  stays visible text for parsers (AC-001-a same field values).
                  SafeLink keeps non-http(s) schemes unclickable (F4c). */}
              <SafeLink url={link.url}>
                {link.label === link.url ? link.url : `${link.label}: ${link.url}`}
              </SafeLink>
            </p>
          ))}
          {skills !== undefined && <CreativeSection section={skills} />}
        </aside>
      )}
      <div className={styles.main}>
        {vm.name !== '' && <h1 className={styles.name}>{vm.name}</h1>}
        {vm.headline !== undefined && <p className={styles.headline}>{vm.headline}</p>}
        {vm.summary !== undefined && <p className={styles.summary}>{vm.summary}</p>}
        {mainSections.map((section) => (
          <CreativeSection key={section.key} section={section} />
        ))}
      </div>
    </article>
  )
}

function CreativeSection({ section }: { section: OrderedSection<AnySectionItem> }) {
  // buildOrderedSections guarantees the item shape per key (asserted by
  // normalize tests); the union is not key-discriminated, so each branch
  // narrows the same array to the shape its key implies.
  switch (section.key) {
    case 'education':
      return (
        <section className={styles.section}>
          <h2 className={styles.heading}>{section.heading}</h2>
          {(section.items as EducationDisplay[]).map((item, index) => (
            <EducationItem key={index} item={item} />
          ))}
        </section>
      )
    case 'experience':
    case 'organizations':
      return (
        <section className={styles.section}>
          <h2 className={styles.heading}>{section.heading}</h2>
          {(section.items as ExperienceDisplay[]).map((item, index) => (
            <ExperienceItem key={index} item={item} />
          ))}
        </section>
      )
    case 'projects':
      return (
        <section className={styles.section}>
          <h2 className={styles.heading}>{section.heading}</h2>
          {(section.items as ProjectDisplay[]).map((item, index) => (
            <ProjectItem key={index} item={item} />
          ))}
        </section>
      )
    case 'skills':
      return (
        <section className={styles.section}>
          <h2 className={styles.heading}>{section.heading}</h2>
          {(section.items as SkillGroupDisplay[]).map((item, index) => (
            <SkillsGroup key={index} item={item} />
          ))}
        </section>
      )
    case 'certifications':
      return (
        <section className={styles.section}>
          <h2 className={styles.heading}>{section.heading}</h2>
          {(section.items as CertificationDisplay[]).map((item, index) => (
            <CertificationItem key={index} item={item} />
          ))}
        </section>
      )
  }
}
