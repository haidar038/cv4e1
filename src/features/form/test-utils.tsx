import 'fake-indexeddb/auto'
import { expect } from 'vitest'
import axe from 'axe-core'
import { destroySync } from '../../storage'
import { db } from '../../storage'
import { flushAutosave, stopStoreSync } from '../store/actions'
import { documentStore } from '../store/document-store'
import { draftStore } from '../store/draft-store'
import { uiStore } from '../store/ui-store'

/** Resets all store singletons and the fake IndexedDB between component tests. */
export async function resetFormStores(): Promise<void> {
  documentStore.setState({
    document: null,
    draftId: null,
    dirty: false,
    lastSavedAt: null,
    externalNotice: null,
  })
  draftStore.setState({ summaries: [], selectedId: null })
  uiStore.setState({
    mode: 'ats',
    locale: 'id',
    paperSize: 'a4',
    openPanel: null,
    autosaveStatus: 'idle',
    storageMessage: null,
    photoNoticeDismissed: false,
  })
  await Promise.all([db.drafts.clear(), db.assets.clear()])
}

/** Flushes pending autosaves and tears down cross-tab wiring after a test. */
export async function teardownFormStores(): Promise<void> {
  await flushAutosave()
  stopStoreSync()
  destroySync()
}

/**
 * Opens a minimal valid document directly in the store so component tests can
 * exercise the real actions (which re-validate every mutation) without the
 * async createDraft dance.
 */
export function openTestDocument(): void {
  documentStore.setState({
    document: {
      schemaVersion: '1.0.0',
      basics: { name: '' },
      sections: {},
      meta: { locale: 'id', mode: 'ats' },
    },
    draftId: 'draft_test_1',
    dirty: false,
    lastSavedAt: null,
    externalNotice: null,
  })
  draftStore.setState({
    selectedId: 'draft_test_1',
    summaries: [{ id: 'draft_test_1', title: 'CV', updatedAt: 1 }],
  })
}

/**
 * axe audit scoped to rendered components. Page-level rules (document title,
 * html lang, one-main-landmark) cannot be meaningfully judged on an isolated
 * fragment, so they are disabled here; they belong to the e2e audits of
 * Task 10/12. color-contrast needs real layout and is reported as
 * "incomplete" (not a violation) in jsdom.
 */
export async function runAxe(container: HTMLElement): Promise<void> {
  const results = await axe.run(container, {
    resultTypes: ['violations'],
    rules: {
      'document-title': { enabled: false },
      'html-has-lang': { enabled: false },
      'html-lang-valid': { enabled: false },
      'landmark-one-main': { enabled: false },
      region: { enabled: false },
    },
  })
  const summary = results.violations
    .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.html).join(' | ')}`)
    .join('\n')
  expect(summary, summary).toBe('')
}
