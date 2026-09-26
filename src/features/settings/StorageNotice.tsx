import { useState } from 'react'
import { useStore } from 'zustand'
import { Button } from '@/components/ui/button'
import { documentStore } from '../store/document-store'
import { uiStore } from '../store/ui-store'
import { useMicrocopy } from '../form/useMicrocopy'
import { hasSeenStorageNotice, markStorageNoticeSeen } from './storage-prefs'

/** Public repository — the AGPL Corresponding Source offer (F4e). */
const REPO_URL = 'https://github.com/haidar038/cv4e1'

/**
 * Local-storage notice (Task 15, F-A8, FR-109).
 *
 * Two shapes share one verbatim string (`local-storage-strategy.md` §9 —
 * never paraphrased, owned by microcopy):
 * - `StorageNoticeBanner`: prominent, appears only after the first draft has
 *   been saved successfully (`lastSavedAt`, not on an empty first visit) and
 *   disappears once acknowledged. A `role="status"` live region — queried by
 *   role + text, never role + name (Task 14 live-region rule).
 * - `StorageNoticeFooter`: the permanent home, always visible in the app
 *   shell footer — plain content, not a second live region.
 * Both hide in print so notice text can never leak into the PDF extraction
 * gates, and both render nothing for locales without the pack (FR-204).
 */
export function StorageNoticeBanner() {
  const pack = useMicrocopy()
  const document = useStore(documentStore, (s) => s.document)
  const lastSavedAt = useStore(documentStore, (s) => s.lastSavedAt)
  const [seen, setSeen] = useState<boolean>(() => hasSeenStorageNotice())

  if (document === null || lastSavedAt === null || seen || pack.storageNotice.notice === '') {
    return null
  }

  const dismiss = (): void => {
    markStorageNoticeSeen()
    setSeen(true)
  }

  return (
    <div
      role="status"
      className="flex items-center justify-between gap-2 border border-info p-2 text-xs text-info bg-info/10 print:hidden"
    >
      <p className="min-w-0 flex-1">{pack.storageNotice.notice}</p>
      <Button type="button" variant="outline" size="sm" onClick={dismiss}>
        {pack.storageNotice.dismiss}
      </Button>
    </div>
  )
}

export function StorageNoticeFooter() {
  const pack = useMicrocopy()
  const locale = useStore(uiStore, (s) => s.locale)
  if (pack.storageNotice.notice === '') return null
  return (
    <footer className="border border-info p-2 text-center text-xs text-info bg-info/10 print:hidden">
      <p>{pack.storageNotice.notice}</p>
      {/* F4e: AGPL Appropriate Legal Notices + landing link. One footer only —
          a second <footer> would duplicate the contentinfo landmark (axe).
          text-info (not muted): muted fails 4.5:1 on the info tint. */}
      <p className="mt-1 text-info">
        {pack.legal.notice}{' '}
        <a
          href={`${REPO_URL}/blob/main/LICENSE`}
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          {pack.legal.license}
        </a>
        {' · '}
        <a href={REPO_URL} target="_blank" rel="noreferrer" className="underline">
          {pack.legal.source}
        </a>
        {' · '}
        <a href={locale === 'id' ? '/landing.html' : '/landing-en.html'} className="underline">
          {pack.legal.about}
        </a>
      </p>
    </footer>
  )
}
