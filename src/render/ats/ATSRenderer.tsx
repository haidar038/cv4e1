import type {
  ATSViewModel,
  CertificationDisplay,
  EducationDisplay,
  ExperienceDisplay,
  OrderedSection,
  ProjectDisplay,
  SkillGroupDisplay,
} from '../../core/view-models'
import { EducationItem } from './sections/EducationItem'
import { ExperienceItem } from './sections/ExperienceItem'
import { ProjectItem } from './sections/ProjectItem'
import { CertificationItem, SkillsGroup } from './sections/SkillsCertifications'
import './print.css'

type AnySectionItem =
  EducationDisplay | ExperienceDisplay | ProjectDisplay | SkillGroupDisplay | CertificationDisplay

/**
 * ATS renderer (Task 10, ADR-0004/0007): renders the ATSViewModel as a
 * single-column, print-ready document whose text survives PDF extraction.
 *
 * Deliberately dumb: every display decision (controlled headings, date
 * formatting, GPA format, employment labels) was made by normalize(); the
 * only prop is the view model itself, so no template or layout surface
 * exists that could override mode rules (FR-008). The view model has no
 * photo field, which makes the "no image in ATS mode" rule structural
 * (AC-002-a), and the output is block-flow HTML with no decorative nesting.
 */
export function ATSRenderer({ vm }: { vm: ATSViewModel }) {
  return (
    <article className="cv-ats">
      <header className="cv-ats-header">
        {/* Rendering contract: skip empty fields instead of emitting empty
            headings — an in-progress draft may legally have an empty name. */}
        {vm.name !== '' && <h1 className="cv-ats-name">{vm.name}</h1>}
        {vm.headline !== undefined && <p className="cv-ats-headline">{vm.headline}</p>}
        <ContactLine vm={vm} />
        {vm.links.length > 0 && <LinksLine vm={vm} />}
        {vm.summary !== undefined && <p className="cv-ats-summary">{vm.summary}</p>}
      </header>
      {vm.sections.map((section) => (
        <AtsSection key={section.key} section={section} />
      ))}
    </article>
  )
}

function ContactLine({ vm }: { vm: ATSViewModel }) {
  const contacts = [vm.contacts.email, vm.contacts.phone, vm.contacts.location].filter(
    (contact): contact is string => contact !== undefined && contact !== '',
  )
  if (contacts.length === 0) return null
  return <p className="cv-ats-contacts">{contacts.join(' · ')}</p>
}

function LinksLine({ vm }: { vm: ATSViewModel }) {
  return (
    <p className="cv-ats-links">
      {vm.links.map((link, index) => (
        <span key={link.url}>
          {index > 0 && ' · '}
          {/* The URL itself stays visible as text: parsers must find it
              even when they never follow the anchor (ats-test-plan §1). */}
          <a href={link.url}>{link.label === link.url ? link.url : `${link.label}: ${link.url}`}</a>
        </span>
      ))}
    </p>
  )
}

function AtsSection({ section }: { section: OrderedSection<AnySectionItem> }) {
  // buildOrderedSections guarantees the item shape per key (asserted by
  // normalize tests); the union is not key-discriminated, so each branch
  // narrows the same array to the shape its key implies.
  switch (section.key) {
    case 'education':
      return (
        <section className="cv-ats-section">
          <h2 className="cv-ats-heading">{section.heading}</h2>
          {(section.items as EducationDisplay[]).map((item, index) => (
            <EducationItem key={index} item={item} />
          ))}
        </section>
      )
    case 'experience':
    case 'organizations':
      return (
        <section className="cv-ats-section">
          <h2 className="cv-ats-heading">{section.heading}</h2>
          {(section.items as ExperienceDisplay[]).map((item, index) => (
            <ExperienceItem key={index} item={item} />
          ))}
        </section>
      )
    case 'projects':
      return (
        <section className="cv-ats-section">
          <h2 className="cv-ats-heading">{section.heading}</h2>
          {(section.items as ProjectDisplay[]).map((item, index) => (
            <ProjectItem key={index} item={item} />
          ))}
        </section>
      )
    case 'skills':
      return (
        <section className="cv-ats-section">
          <h2 className="cv-ats-heading">{section.heading}</h2>
          {(section.items as SkillGroupDisplay[]).map((item, index) => (
            <SkillsGroup key={index} item={item} />
          ))}
        </section>
      )
    case 'certifications':
      return (
        <section className="cv-ats-section">
          <h2 className="cv-ats-heading">{section.heading}</h2>
          {(section.items as CertificationDisplay[]).map((item, index) => (
            <CertificationItem key={index} item={item} />
          ))}
        </section>
      )
  }
}
