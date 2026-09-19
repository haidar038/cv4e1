import { useEffect, useState } from 'react'
import { useStore } from 'zustand'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Progress, ProgressLabel } from '@/components/ui/progress'
import type { SectionKey } from '../../core/view-models'
import { createDraft, setOpenPanel, setSectionOrder } from '../store/actions'
import { documentStore } from '../store/document-store'
import { uiStore } from '../store/ui-store'
import { AutoSaveIndicator } from './AutoSaveIndicator'
import { SectionOrderControls } from './SectionOrderControls'
import { SOFT_WARNING_PAGES, estimateCvPages } from './estimatePageCount'
import { useMicrocopy } from './useMicrocopy'
import { BasicsForm } from './sections/BasicsForm'
import { CertificationsForm } from './sections/CertificationsForm'
import { EducationForm } from './sections/EducationForm'
import { ExperienceForm } from './sections/ExperienceForm'
import { OrganizationsForm } from './sections/OrganizationsForm'
import { ProjectsForm } from './sections/ProjectsForm'
import { SkillsForm } from './sections/SkillsForm'

const FLOW_SECTIONS: SectionKey[] = [
  'education',
  'experience',
  'organizations',
  'projects',
  'skills',
  'certifications',
]

const SECTION_FORMS: { [K in SectionKey]: () => React.JSX.Element } = {
  education: EducationForm,
  experience: ExperienceForm,
  organizations: OrganizationsForm,
  projects: ProjectsForm,
  skills: SkillsForm,
  certifications: CertificationsForm,
}

type NavKey = 'basics' | SectionKey

/** Applies the stored sectionOrder (F-B9) to the known flow sections: stored order first, unknown keys ignored, keys absent from storage keep their default position at the end. */
function normalizeOrder(order: readonly string[] | undefined): SectionKey[] {
  const stored: SectionKey[] = []
  for (const key of order ?? []) {
    if (FLOW_SECTIONS.includes(key as SectionKey) && !stored.includes(key as SectionKey)) {
      stored.push(key as SectionKey)
    }
  }
  const missing = FLOW_SECTIONS.filter((key) => !stored.includes(key))
  return [...stored, ...missing]
}

/**
 * The guided form shell: section navigation as an accordion (one section open
 * at a time), progress indicator, autosave status, soft CV-length warning, and
 * the guided empty state when no draft is open. The skip link to the preview
 * region only renders once a `#cv-preview` target exists (built in Task 12) —
 * never as a dead link.
 */
export function FormLayout() {
  const pack = useMicrocopy()
  const document = useStore(documentStore, (s) => s.document)
  const openPanel = useStore(uiStore, (s) => s.openPanel)
  const storageMessage = useStore(uiStore, (s) => s.storageMessage)

  if (document === null) return <EmptyState />

  const order = normalizeOrder(document.sectionOrder)
  const navItems: Array<{ key: NavKey; label: string }> = [
    { key: 'basics', label: pack.sections.basics },
    ...order.map((key) => ({ key, label: pack.sections[key] })),
  ]
  const total = navItems.length
  const openIndex = Math.max(
    0,
    navItems.findIndex((item) => item.key === openPanel),
  )
  const showLengthWarning =
    estimateCvPages(document) > SOFT_WARNING_PAGES && pack.cvLength.softWarning !== ''

  const moveSection = (section: SectionKey, direction: 'up' | 'down') => {
    const from = order.indexOf(section)
    const to = direction === 'up' ? from - 1 : from + 1
    const moving = order[to]
    if (from < 0 || to < 0 || moving === undefined) return
    const next = [...order]
    next[from] = moving
    next[to] = section
    setSectionOrder(next)
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <SkipLink />
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <Progress
            value={((openIndex + 1) / total) * 100}
            aria-label={pack.progress.sectionProgress
              .replace('{current}', String(openIndex + 1))
              .replace('{total}', String(total))}
            className="flex-1"
          >
            <ProgressLabel>
              {pack.progress.sectionProgress
                .replace('{current}', String(openIndex + 1))
                .replace('{total}', String(total))}
            </ProgressLabel>
          </Progress>
          <AutoSaveIndicator />
        </div>
        {showLengthWarning && (
          <Alert>
            <AlertDescription>{pack.cvLength.softWarning}</AlertDescription>
          </Alert>
        )}
        {storageMessage !== null && (
          <p role="alert" className="text-xs text-destructive">
            {storageMessage}
          </p>
        )}
      </header>
      <Accordion
        value={openPanel !== null ? [openPanel] : []}
        onValueChange={(values) => setOpenPanel(values[values.length - 1] ?? null)}
      >
        {navItems.map((item, index) => {
          const SectionForm = item.key === 'basics' ? BasicsForm : SECTION_FORMS[item.key]
          return (
            <AccordionItem key={item.key} value={item.key}>
              <div className="flex items-center gap-1">
                <div className="min-w-0 flex-1">
                  <AccordionTrigger>{item.label}</AccordionTrigger>
                </div>
                {item.key !== 'basics' && (
                  <SectionOrderControls
                    section={item.key}
                    sectionLabel={item.label}
                    position={index - 1}
                    total={order.length}
                    onMove={moveSection}
                  />
                )}
              </div>
              <AccordionContent>
                <SectionForm />
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}

function EmptyState() {
  const pack = useMicrocopy()
  return (
    <section
      aria-labelledby="cv-empty-state-title"
      className="flex flex-1 flex-col items-center justify-center gap-3 border p-8 text-center"
    >
      <h2 id="cv-empty-state-title" className="font-heading text-sm font-medium">
        {pack.emptyState.title}
      </h2>
      <p className="max-w-sm text-xs text-muted-foreground">{pack.emptyState.description}</p>
      <Button size="sm" onClick={() => void createDraft()}>
        {pack.emptyState.cta}
      </Button>
    </section>
  )
}

/** Skip link to the preview region; rendered only when the target exists (Task 12). */
function SkipLink() {
  const pack = useMicrocopy()
  const [hasPreview, setHasPreview] = useState(false)
  useEffect(() => {
    if (document.getElementById('cv-preview') !== null) setHasPreview(true)
  }, [])
  if (!hasPreview) return null
  return (
    <a
      href="#cv-preview"
      className="sr-only focus:not-sr-only focus:absolute focus:z-10 focus:bg-background focus:p-2 focus:text-foreground"
    >
      {pack.skip.toPreview}
    </a>
  )
}
