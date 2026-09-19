import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import 'fake-indexeddb/auto'
import {
  db,
  destroySync,
  loadDraft,
  saveDraft,
  StorageBlockedError,
  type DraftRecord,
} from '../../storage'
import { exportResume } from '../../storage/export-import'
import { aiStore } from './ai-store'
import {
  addSectionItem,
  createDraft,
  deleteDraftAction,
  duplicateDraft,
  flushAutosave,
  handleExternalMessage,
  importDraftAction,
  initStoreSync,
  loadDraftAction,
  moveSectionItem,
  removeSectionItem,
  renameDraft,
  setMode,
  setSectionOrder,
  stopStoreSync,
  updateBasics,
  updateSectionItem,
} from './actions'
import type { EducationItem } from '../../core/schema'
import { documentStore } from './document-store'
import { draftStore } from './draft-store'
import { selectATSViewModel, selectCreativeViewModel } from './selectors'
import { uiStore } from './ui-store'

/** Fixture item shape taken from fixtures/full-document.json (fake data only). */
const educationItem: EducationItem = {
  institution: 'Universitas Contoh Nusantara',
  degree: 'S1 Teknik Informatika',
  field: 'Rekayasa Perangkat Lunak',
  location: 'Kota Contoh',
  startDate: '2021-08',
  endDate: '2025-07',
  status: 'graduated',
  gpa: { value: '3.52', scale: '4.00', label: 'IPK' },
  highlights: ['Tugas akhir: sistem informasi pendataan UMKM berbasis web'],
}

function requireDocument() {
  const doc = documentStore.getState().document
  if (doc === null) throw new Error('expected a document to be open in the store')
  return doc
}

beforeEach(async () => {
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
    openPanel: null,
    autosaveStatus: 'idle',
    storageMessage: null,
  })
  await Promise.all([db.drafts.clear(), db.assets.clear()])
})

afterEach(async () => {
  // Cancel any pending debounce timer so it cannot fire into a later test,
  // then tear down cross-tab subscriptions and mocks.
  await flushAutosave()
  stopStoreSync()
  destroySync()
  vi.restoreAllMocks()
})

describe('document lifecycle', () => {
  it('createDraft persists a new draft, selects it, and mirrors its preferences', async () => {
    await createDraft()

    const { document, draftId, dirty } = documentStore.getState()
    expect(document).not.toBeNull()
    expect(draftId).not.toBeNull()
    expect(dirty).toBe(false)
    expect(draftStore.getState().selectedId).toBe(draftId)
    expect(draftStore.getState().summaries.some((summary) => summary.id === draftId)).toBe(true)
    expect(uiStore.getState().mode).toBe('ats')
  })

  it('createDraft keeps the in-memory document usable when storage is blocked', async () => {
    vi.spyOn(db.drafts, 'put').mockRejectedValue(new StorageBlockedError())

    await expect(createDraft()).resolves.toBeUndefined()

    expect(documentStore.getState().document).not.toBeNull()
    expect(documentStore.getState().draftId).toBeNull()
    expect(uiStore.getState().autosaveStatus).toBe('blocked')
  })

  it('loadDraftAction loads a saved draft and mirrors its mode', async () => {
    const saved = await saveDraft({
      schemaVersion: '1.0.0',
      basics: { name: 'Citra Lestari' },
      sections: {},
      meta: { locale: 'id', mode: 'creative' },
    })

    await loadDraftAction(saved.id)

    expect(documentStore.getState().draftId).toBe(saved.id)
    expect(requireDocument().basics.name).toBe('Citra Lestari')
    expect(documentStore.getState().dirty).toBe(false)
    expect(uiStore.getState().mode).toBe('creative')
  })

  it('loadDraftAction reports a missing draft instead of crashing', async () => {
    await loadDraftAction('does-not-exist')

    expect(uiStore.getState().storageMessage).not.toBeNull()
    expect(documentStore.getState().document).toBeNull()
  })

  it('a corrupted draft never destroys the currently open document', async () => {
    await createDraft()
    const openDoc = requireDocument()

    const corrupt = { id: 'corrupt-id', updatedAt: 1, garbage: true } as unknown as DraftRecord
    await db.drafts.put(corrupt)
    await loadDraftAction('corrupt-id')

    expect(uiStore.getState().storageMessage).not.toBeNull()
    expect(documentStore.getState().document).toBe(openDoc)
    expect(documentStore.getState().draftId).not.toBe('corrupt-id')
  })

  it('updateBasics marks the draft dirty and autosave persists the change', async () => {
    await createDraft()
    const draftId = documentStore.getState().draftId

    updateBasics({ name: 'Budi Santoso' })
    expect(documentStore.getState().dirty).toBe(true)

    await flushAutosave()

    expect(uiStore.getState().autosaveStatus).toBe('saved')
    expect(documentStore.getState().dirty).toBe(false)
    expect(documentStore.getState().draftId).toBe(draftId)
    const persisted = await loadDraft(draftId ?? '')
    expect(persisted?.basics.name).toBe('Budi Santoso')
  })

  it('a full quota keeps the in-memory document intact and reports the failure', async () => {
    await createDraft()

    const quotaError = Object.assign(new Error('quota exceeded'), { name: 'QuotaExceededError' })
    vi.spyOn(db.drafts, 'put').mockRejectedValueOnce(quotaError)
    updateBasics({ name: 'Ani Rahayu' })
    await flushAutosave()

    expect(uiStore.getState().autosaveStatus).toBe('error')
    expect(uiStore.getState().storageMessage).toContain('ekspor manual')
    expect(requireDocument().basics.name).toBe('Ani Rahayu')
    expect(documentStore.getState().dirty).toBe(true)
  })
})

describe('mode switching invariant', () => {
  it('setMode changes only meta.mode in the document', async () => {
    await createDraft()
    updateBasics({ name: 'Dewi Anggraini' })
    const before = JSON.parse(JSON.stringify(requireDocument()))

    setMode('creative')

    const after = JSON.parse(JSON.stringify(requireDocument()))
    if (after.meta !== undefined) delete after.meta.mode
    if (before.meta !== undefined) delete before.meta.mode
    expect(after).toEqual(before)
    expect(uiStore.getState().mode).toBe('creative')
  })

  it('the switched mode is persisted per draft', async () => {
    await createDraft()
    const draftId = documentStore.getState().draftId

    setMode('creative')
    await flushAutosave()

    const persisted = await loadDraft(draftId ?? '')
    expect(persisted?.meta?.mode).toBe('creative')
  })
})

describe('section item actions', () => {
  it('add, update, move, and remove items round-trip through validation', async () => {
    await createDraft()

    addSectionItem('education', educationItem)
    addSectionItem('education', { ...educationItem, institution: 'Politeknik Contoh' })
    expect(requireDocument().sections.education).toHaveLength(2)

    updateSectionItem('education', 0, { degree: 'S1 Sistem Informasi' })
    expect(requireDocument().sections.education?.[0]?.degree).toBe('S1 Sistem Informasi')

    moveSectionItem('education', 1, 0)
    expect(requireDocument().sections.education?.[0]?.institution).toBe('Politeknik Contoh')

    removeSectionItem('education', 0)
    expect(requireDocument().sections.education).toHaveLength(1)
    expect(requireDocument().sections.education?.[0]?.institution).toBe(
      'Universitas Contoh Nusantara',
    )
  })

  it('setSectionOrder stores the section order', async () => {
    await createDraft()

    setSectionOrder(['education', 'projects', 'skills'])

    expect(requireDocument().sectionOrder).toEqual(['education', 'projects', 'skills'])
  })

  it('out-of-range item operations are safe no-ops that never dirty the document', async () => {
    await createDraft()
    const before = requireDocument()

    moveSectionItem('education', 5, 0)
    updateSectionItem('education', 9, { degree: 'X' })
    removeSectionItem('education', 3)

    expect(documentStore.getState().document).toBe(before)
    expect(documentStore.getState().dirty).toBe(false)
  })
})

describe('memoized view-model selectors', () => {
  it('selectors recompute only when the document reference changes', async () => {
    await createDraft()

    const doc = requireDocument()
    const ats = selectATSViewModel(doc)
    const creative = selectCreativeViewModel(doc)
    expect(ats).not.toBeNull()
    expect(selectATSViewModel(doc)).toBe(ats)
    expect(selectCreativeViewModel(doc)).toBe(creative)

    // Unrelated UI state changes must not invalidate the memoized view models.
    uiStore.setState({ openPanel: 'drafts' })
    expect(selectATSViewModel(doc)).toBe(ats)
    expect(selectCreativeViewModel(doc)).toBe(creative)

    // A real document change (new reference) recomputes to a new object.
    updateBasics({ name: 'Eko Prasetyo' })
    expect(selectATSViewModel(requireDocument())).not.toBe(ats)
  })
})

describe('draft list actions', () => {
  it('renameDraft updates the summary title and the open document meta', async () => {
    await createDraft()
    const draftId = documentStore.getState().draftId ?? ''

    await renameDraft(draftId, 'CV Backend')

    expect(draftStore.getState().summaries.find((s) => s.id === draftId)?.title).toBe('CV Backend')
    expect(requireDocument().meta?.title).toBe('CV Backend')
  })

  it('duplicateDraft creates a copy marked "(salinan)" without switching selection', async () => {
    await createDraft()
    const originalId = documentStore.getState().draftId ?? ''
    await renameDraft(originalId, 'CV Asli')

    await duplicateDraft(originalId)

    const summaries = draftStore.getState().summaries
    expect(summaries).toHaveLength(2)
    expect(summaries.find((s) => s.id === originalId)?.title).toBe('CV Asli')
    const copy = summaries.find((s) => s.id !== originalId)
    expect(copy?.title).toBe('CV Asli (salinan)')
    expect(documentStore.getState().draftId).toBe(originalId)
  })

  it('deleteDraftAction removes the draft; deleting the open draft empties the workspace', async () => {
    await createDraft()
    const draftId = documentStore.getState().draftId ?? ''

    await deleteDraftAction(draftId)

    expect(documentStore.getState().document).toBeNull()
    expect(documentStore.getState().draftId).toBeNull()
    expect(draftStore.getState().selectedId).toBeNull()
    expect(draftStore.getState().summaries).toHaveLength(0)
  })
})

describe('multi-tab (state-management.md §6)', () => {
  it("an 'updated' message only raises a notice — never a silent overwrite", () => {
    handleExternalMessage({ type: 'draft_updated', draftId: 'open-1', timestamp: 111 })
    // No document open yet: the message concerns another draft, only the list refreshes.
    expect(documentStore.getState().externalNotice).toBeNull()
  })

  it('an update for the open draft raises a non-blocking notice and keeps the local copy', async () => {
    await createDraft()
    const draftId = documentStore.getState().draftId ?? ''
    const localDoc = requireDocument()

    handleExternalMessage({ type: 'draft_updated', draftId, timestamp: 222 })

    expect(documentStore.getState().externalNotice).toEqual({ kind: 'updated', at: 222 })
    expect(documentStore.getState().document).toBe(localDoc)
  })

  it('a deletion of the open draft moves this tab to the empty condition', async () => {
    await createDraft()
    const draftId = documentStore.getState().draftId ?? ''

    handleExternalMessage({ type: 'draft_deleted', draftId, timestamp: 333 })

    expect(documentStore.getState().document).toBeNull()
    expect(documentStore.getState().draftId).toBeNull()
    expect(documentStore.getState().externalNotice).toEqual({ kind: 'deleted', at: 333 })
  })

  it('initStoreSync wires BroadcastChannel messages into the stores', async () => {
    await createDraft()
    const draftId = documentStore.getState().draftId ?? ''
    initStoreSync()

    // A second channel with the same name acts as "another tab".
    const other = new BroadcastChannel('cv4every1-sync')
    try {
      other.postMessage({ type: 'draft_updated', draftId, timestamp: 444 })
      await vi.waitFor(
        () => {
          expect(documentStore.getState().externalNotice).toEqual({ kind: 'updated', at: 444 })
        },
        { timeout: 2000 },
      )
    } finally {
      other.close()
    }
  })
})

describe('AI store', () => {
  it('exists as an inert basket and stays empty', () => {
    expect(aiStore.getState()).toEqual({})
  })
})

describe('importDraftAction', () => {
  it('imports a valid envelope as a NEW draft and opens it (Task 9)', async () => {
    await createDraft()
    updateBasics({ name: 'Citra Lestari' })
    await flushAutosave()
    const exportedJson = exportResume(requireDocument())

    const result = await importDraftAction(exportedJson)

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('unreachable')
    const { document, draftId } = documentStore.getState()
    expect(draftId).toBe(result.draftId)
    expect(document?.basics.name).toBe('Citra Lestari')
    // The import added a draft instead of overwriting: two summaries now exist.
    expect(draftStore.getState().summaries).toHaveLength(2)
  })

  it('reports the specific ImportError reason and never touches the open draft', async () => {
    await createDraft()
    updateBasics({ name: 'Sebelum Impor' })
    const before = documentStore.getState().document

    const result = await importDraftAction('bukan json sama sekali')

    expect(result).toEqual({ ok: false, reason: 'NOT_JSON' })
    expect(documentStore.getState().document).toBe(before)
    expect(documentStore.getState().document?.basics.name).toBe('Sebelum Impor')
  })

  it('rejects an envelope of the wrong format without touching the open draft', async () => {
    await createDraft()
    const before = documentStore.getState().document

    const result = await importDraftAction(
      JSON.stringify({ format: 'salah', kind: 'resume', formatVersion: '1.0.0', data: {} }),
    )

    expect(result).toEqual({ ok: false, reason: 'WRONG_FORMAT_ID' })
    expect(documentStore.getState().document).toBe(before)
  })
})
