import {
  createEmptyResumeDocument,
  validateResumeDocument,
  type ResumeBasics,
  type ResumeSections,
  type ValidatedResumeDocument,
} from '../../core/schema'
import type { SectionKey } from '../../core/view-models'
import {
  AutoSaveManager,
  deleteDraft as deleteDraftFromStorage,
  InvalidDataError,
  listDrafts,
  loadDraft as loadDraftFromStorage,
  notifyDataWiped,
  notifyTabs,
  onExternalUpdate,
  requestPersistentStorage,
  saveDraft,
  StorageBlockedError,
  wipeLocalData,
  type SyncMessage,
  type WipeReport,
} from '../../storage'
import { importResumeLazy } from '../../storage/export-import-lazy'
import { ImportError, type ImportErrorReason } from '../../storage/export-import-types'
import { documentStore } from './document-store'
import { draftStore } from './draft-store'
import { uiStore, type ResumeMode } from './ui-store'

// --- User-facing storage messages (Bahasa Indonesia, D21 tone: guide, never blame) ---

const MSG_SAVE_FAILED = 'Gagal menyimpan — ekspor manual disarankan.'
const MSG_BLOCKED = 'Mode privat: perubahan tidak tersimpan.'
const MSG_INVALID =
  'Perubahan tidak dapat diterapkan karena ada isian yang belum valid. Periksa kembali isian Anda.'
const MSG_CORRUPT =
  'Draft ini tidak dapat dibuka karena datanya rusak atau dibuat di versi aplikasi lain. Draft yang sedang terbuka tidak diubah.'
const MSG_MISSING = 'Draft tidak ditemukan. Mungkin sudah dihapus di tab lain.'
const MSG_LIST_FAILED = 'Daftar draft tidak dapat dibaca.'

// --- Autosave wiring (single AutoSaveManager for the whole app) ---

let autosave: AutoSaveManager | null = null

function getAutosave(): AutoSaveManager {
  if (autosave !== null) return autosave
  autosave = new AutoSaveManager({
    onStatusChange: (status) => uiStore.setState({ autosaveStatus: status }),
    onSuccess: (draftId) => {
      // The persisted id is authoritative here: it is where a brand-new draft
      // first receives its id.
      documentStore.setState({ draftId, dirty: false, lastSavedAt: Date.now() })
      notifyTabs('draft_updated', draftId)
      void refreshDrafts()
    },
    onError: (error) => {
      if (error instanceof StorageBlockedError) {
        uiStore.setState({ storageMessage: MSG_BLOCKED })
      } else {
        // Covers StorageFullError and anything unexpected; in-memory state is
        // never discarded (state-management.md §4).
        uiStore.setState({ storageMessage: MSG_SAVE_FAILED })
      }
    },
  })
  return autosave
}

/** Forces a pending autosave to run now (tab hide/close, draft switch, tests). */
export async function flushAutosave(): Promise<void> {
  await getAutosave().flush()
}

function reportStorageFailure(error: unknown): void {
  if (error instanceof StorageBlockedError) {
    uiStore.setState({ autosaveStatus: 'blocked', storageMessage: MSG_BLOCKED })
  } else {
    uiStore.setState({ autosaveStatus: 'error', storageMessage: MSG_SAVE_FAILED })
  }
}

// --- Internal helpers ---

function mirrorDocumentPreferences(doc: ValidatedResumeDocument): void {
  uiStore.setState({ mode: doc.meta?.mode ?? 'ats', locale: doc.meta?.locale ?? 'id' })
}

/**
 * Materializes schema-default `meta` at the store boundary so documents held
 * in memory always carry their locale/mode. Without this, the first `setMode`
 * on a meta-less document would materialize `meta.locale` as a side effect and
 * break the "only meta.mode changes" invariant.
 */
function withMaterializedMeta(doc: ValidatedResumeDocument): ValidatedResumeDocument {
  if (doc.meta !== undefined) return doc
  return { ...doc, meta: { locale: 'id', mode: 'ats' } }
}

/**
 * Key-order-independent JSON snapshot. Zod rebuilds objects in schema order,
 * while spreads keep insertion order — content equality must not care.
 */
function stableSnapshot(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null'
  if (Array.isArray(value)) return `[${value.map(stableSnapshot).join(',')}]`
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
    a.localeCompare(b),
  )
  return `{${entries.map(([key, val]) => `${JSON.stringify(key)}:${stableSnapshot(val)}`).join(',')}}`
}

/**
 * The single mutation gate for the open document. Mutations only reach the
 * store through named actions that funnel into here (state-management.md §3).
 * Re-validates before committing so the store only ever holds a
 * `ValidatedResumeDocument`, and skips genuinely unchanged results.
 */
function applyDocumentUpdate(
  mutate: (doc: ValidatedResumeDocument) => ValidatedResumeDocument,
): void {
  const { document: current, draftId } = documentStore.getState()
  if (current === null) return

  const validation = validateResumeDocument(mutate(withMaterializedMeta(current)))
  if (!validation.success) {
    uiStore.setState({ storageMessage: MSG_INVALID })
    return
  }
  const validated = validation.data
  if (stableSnapshot(validated) === stableSnapshot(current)) return

  documentStore.setState({ document: validated, dirty: true })
  getAutosave().registerChange(validated, draftId ?? undefined)
}

type SectionItem<K extends SectionKey> = NonNullable<ResumeSections[K]>[number]

/**
 * With a generic K, TypeScript sees `doc.sections[section]` as the union of
 * every section's array, so correlated per-section reads and writes each need
 * one honest cast (union → monomorphic array on the way in, computed-key
 * object → ResumeSections on the way out). The runtime value is exactly this
 * section's array; the casts only restore the correlation TS cannot track.
 */
function readSectionItems<K extends SectionKey>(
  doc: ValidatedResumeDocument,
  section: K,
): SectionItem<K>[] {
  return (doc.sections[section] ?? []) as unknown as SectionItem<K>[]
}

function withSectionItems<K extends SectionKey>(
  doc: ValidatedResumeDocument,
  section: K,
  items: SectionItem<K>[],
): ValidatedResumeDocument {
  return {
    ...doc,
    sections: { ...doc.sections, [section]: items } as unknown as ResumeSections,
  }
}

/** Applies a mutation to one section's items; null from `mutate` means no-op. */
function mutateSectionItems<K extends SectionKey>(
  doc: ValidatedResumeDocument,
  section: K,
  mutate: (items: SectionItem<K>[]) => SectionItem<K>[] | null,
): ValidatedResumeDocument {
  const items = mutate(readSectionItems(doc, section).slice())
  if (items === null) return doc
  return withSectionItems(doc, section, items)
}

// --- Draft lifecycle actions ---

export async function createDraft(): Promise<void> {
  const doc = withMaterializedMeta(createEmptyResumeDocument())
  // F-G4: ask for persistent storage on first-draft creation. Best-effort and
  // fire-and-forget — denial changes nothing about saving or editing.
  void requestPersistentStorage()
  documentStore.setState({
    document: doc,
    draftId: null,
    dirty: true,
    lastSavedAt: null,
    externalNotice: null,
  })
  draftStore.setState({ selectedId: null })
  mirrorDocumentPreferences(doc)

  try {
    const record = await saveDraft(doc)
    documentStore.setState({ draftId: record.id, dirty: false, lastSavedAt: record.updatedAt })
    draftStore.setState({ selectedId: record.id })
    notifyTabs('draft_updated', record.id)
    await refreshDrafts()
  } catch (error) {
    // Storage blocked/full: the in-memory document stays fully usable
    // (unsaved); the user sees the status and can keep editing.
    reportStorageFailure(error)
  }
}

export async function loadDraftAction(draftId: string): Promise<void> {
  try {
    const record = await loadDraftFromStorage(draftId)
    if (record === null) {
      uiStore.setState({ storageMessage: MSG_MISSING })
      await refreshDrafts()
      return
    }
    const { id, updatedAt, ...doc } = record
    const content = withMaterializedMeta(doc)
    documentStore.setState({
      document: content,
      draftId: id,
      dirty: false,
      lastSavedAt: updatedAt,
      externalNotice: null,
    })
    draftStore.setState({ selectedId: id })
    mirrorDocumentPreferences(content)
  } catch (error) {
    // Corrupted draft: inform the user and keep whatever is currently open
    // untouched — never destroy in-memory state over a read failure.
    if (error instanceof InvalidDataError) {
      uiStore.setState({ storageMessage: MSG_CORRUPT })
      return
    }
    reportStorageFailure(error)
  }
}

export async function deleteDraftAction(draftId: string): Promise<void> {
  try {
    await deleteDraftFromStorage(draftId)
    notifyTabs('draft_deleted', draftId)
  } catch (error) {
    reportStorageFailure(error)
    return
  }
  if (documentStore.getState().draftId === draftId) {
    // Same resurrection guard as wipeAllDataAction (gate fix): the autosave
    // still holds the deleted document and would re-save it on tab unload.
    getAutosave().discardPending()
    documentStore.setState({
      document: null,
      draftId: null,
      dirty: false,
      lastSavedAt: null,
      externalNotice: null,
    })
    draftStore.setState({ selectedId: null })
  }
  await refreshDrafts()
}

/**
 * Full local wipe (Task 15, FR-108, DF-8): IndexedDB + localStorage +
 * Cache Storage via `wipeLocalData` (which never throws — the report carries
 * partial failures honestly). On a cleared IndexedDB the in-memory stores
 * reset and other tabs are told to do the same; the caller reloads the page
 * as the explicit final step (the dialog offers it — never an instant,
 * unread auto-reload). No broadcast when nothing was deleted.
 */
export async function wipeAllDataAction(): Promise<WipeReport> {
  const report = await wipeLocalData()
  const cleared = report.steps.some((step) => step.step === 'indexedDB' && step.ok)
  if (!cleared) return report
  // Forget the autosave's held document BEFORE resetting the stores: the
  // unload handlers would otherwise re-save it into the empty database
  // during the reload that follows (Task 15 — the wipe must stay wiped).
  getAutosave().discardPending()
  documentStore.setState({
    document: null,
    draftId: null,
    dirty: false,
    lastSavedAt: null,
    externalNotice: null,
  })
  draftStore.setState({ summaries: [], selectedId: null })
  notifyDataWiped()
  await refreshDrafts()
  return report
}

export async function renameDraft(draftId: string, title: string): Promise<void> {
  try {
    const record = await loadDraftFromStorage(draftId)
    if (record === null) {
      uiStore.setState({ storageMessage: MSG_MISSING })
      return
    }
    // Strip storage fields so they never leak into _unknownFields on re-save.
    const { id, updatedAt, ...doc } = record
    const validated = validateResumeDocument({
      ...doc,
      meta: {
        locale: doc.meta?.locale ?? 'id',
        mode: doc.meta?.mode ?? 'ats',
        ...(doc.meta?.template !== undefined && { template: doc.meta.template }),
        title,
      },
    })
    if (!validated.success) {
      uiStore.setState({ storageMessage: MSG_INVALID })
      return
    }
    await saveDraft(validated.data, id)
    if (documentStore.getState().draftId === id) {
      documentStore.setState({ document: validated.data })
    }
    notifyTabs('draft_updated', id)
    await refreshDrafts()
  } catch (error) {
    reportStorageFailure(error)
  }
}

export async function duplicateDraft(draftId: string): Promise<void> {
  try {
    const record = await loadDraftFromStorage(draftId)
    if (record === null) {
      uiStore.setState({ storageMessage: MSG_MISSING })
      return
    }
    // Strip storage fields so the copy never inherits id/updatedAt via _unknownFields.
    const { id: _sourceId, updatedAt: _sourceUpdatedAt, ...doc } = record
    const validated = validateResumeDocument({
      ...doc,
      meta: {
        locale: doc.meta?.locale ?? 'id',
        mode: doc.meta?.mode ?? 'ats',
        ...(doc.meta?.template !== undefined && { template: doc.meta.template }),
        ...(doc.meta?.title !== undefined && { title: `${doc.meta.title} (salinan)` }),
      },
    })
    if (!validated.success) {
      uiStore.setState({ storageMessage: MSG_INVALID })
      return
    }
    const copy = await saveDraft(validated.data)
    notifyTabs('draft_updated', copy.id)
    await refreshDrafts()
  } catch (error) {
    reportStorageFailure(error)
  }
}

export async function refreshDrafts(): Promise<void> {
  try {
    draftStore.setState({ summaries: await listDrafts() })
  } catch {
    uiStore.setState({ storageMessage: MSG_LIST_FAILED })
  }
}

export type ImportDraftResult =
  { ok: true; draftId: string } | { ok: false; reason: ImportErrorReason | 'STORAGE' }

/**
 * Imports an exported envelope as a NEW draft and opens it. The active
 * document is only touched after `importResume` validated the input
 * (import-export-spec §6) — a failed import never overwrites the open draft.
 * The failure reason is returned, not announced: the UI maps it to localized
 * micro-copy. A storage failure while saving additionally sets the store's
 * user-facing storage message (D21).
 */
export async function importDraftAction(json: string): Promise<ImportDraftResult> {
  let doc: ValidatedResumeDocument
  try {
    doc = await importResumeLazy(json)
  } catch (error) {
    if (error instanceof ImportError) return { ok: false, reason: error.reason }
    // importResumeLazy only throws ImportError; anything else is unexpected, and
    // the safe behavior for the user is the generic validation message.
    return { ok: false, reason: 'VALIDATION_FAILED' }
  }
  try {
    const record = await saveDraft(doc)
    notifyTabs('draft_updated', record.id)
    await refreshDrafts()
    await loadDraftAction(record.id)
    return { ok: true, draftId: record.id }
  } catch (error) {
    reportStorageFailure(error)
    return { ok: false, reason: 'STORAGE' }
  }
}

// --- Document editing actions ---

export function updateBasics(patch: Partial<ResumeBasics>): void {
  applyDocumentUpdate((doc) => ({ ...doc, basics: { ...doc.basics, ...patch } }))
}

export function addSectionItem<K extends SectionKey>(section: K, item: SectionItem<K>): void {
  applyDocumentUpdate((doc) =>
    mutateSectionItems(doc, section, (items) => {
      items.push(item)
      return items
    }),
  )
}

export function updateSectionItem<K extends SectionKey>(
  section: K,
  index: number,
  patch: Partial<SectionItem<K>>,
): void {
  applyDocumentUpdate((doc) =>
    mutateSectionItems(doc, section, (items) => {
      const current = items[index]
      if (current === undefined) return null
      // Generic spread loses its correlation in TS; Object.assign keeps the
      // concrete runtime shape while the cast restores the static one.
      items[index] = Object.assign({}, current, patch) as SectionItem<K>
      return items
    }),
  )
}

export function removeSectionItem<K extends SectionKey>(section: K, index: number): void {
  applyDocumentUpdate((doc) =>
    mutateSectionItems(doc, section, (items) => {
      if (items[index] === undefined) return null
      items.splice(index, 1)
      return items
    }),
  )
}

export function moveSectionItem<K extends SectionKey>(
  section: K,
  fromIndex: number,
  toIndex: number,
): void {
  applyDocumentUpdate((doc) =>
    mutateSectionItems(doc, section, (items) => {
      const moving = items[fromIndex]
      if (moving === undefined || toIndex < 0 || toIndex >= items.length) return null
      items.splice(fromIndex, 1)
      items.splice(toIndex, 0, moving)
      return items
    }),
  )
}

export function setSectionOrder(order: readonly SectionKey[]): void {
  applyDocumentUpdate((doc) => ({ ...doc, sectionOrder: [...order] }))
}

/**
 * Switches the rendering mode. The ONLY document change is `meta.mode` —
 * everything else must stay byte-identical (proven by the invariant test).
 * The mode is per draft, so it is persisted through autosave like any edit.
 */
export function setMode(mode: ResumeMode): void {
  uiStore.setState({ mode })
  applyDocumentUpdate((doc) => ({
    ...doc,
    meta: {
      locale: doc.meta?.locale ?? 'id',
      mode,
      ...(doc.meta?.template !== undefined && { template: doc.meta.template }),
      ...(doc.meta?.title !== undefined && { title: doc.meta.title }),
    },
  }))
}

// --- Panel + multi-tab ---

export function setOpenPanel(panel: string | null): void {
  uiStore.setState({ openPanel: panel })
}

/** Dismisses the Task 12 ATS photo notice for the rest of this tab's session. */
export function dismissPhotoNotice(): void {
  uiStore.setState({ photoNoticeDismissed: true })
}

/**
 * Reaction to a message from another tab. Non-blocking by design: an update
 * only raises a notice (never overwrites the local copy), a deletion of the
 * open draft moves this tab to the empty condition, and a completed full
 * wipe (Task 15) resets this tab to the empty condition without reloading.
 */
export function handleExternalMessage(message: SyncMessage): void {
  if (message.type === 'data_wiped') {
    // Same resurrection guard as wipeAllDataAction: this tab's autosave
    // still holds the deleted document and would re-save it on unload.
    getAutosave().discardPending()
    documentStore.setState({
      document: null,
      draftId: null,
      dirty: false,
      lastSavedAt: null,
      externalNotice: null,
    })
    draftStore.setState({ summaries: [], selectedId: null })
    void refreshDrafts()
    return
  }
  const { draftId } = documentStore.getState()
  if (message.draftId !== draftId) {
    void refreshDrafts()
    return
  }
  if (message.type === 'draft_deleted') {
    documentStore.setState({
      document: null,
      draftId: null,
      dirty: false,
      lastSavedAt: null,
      externalNotice: { kind: 'deleted', at: message.timestamp },
    })
    draftStore.setState({ selectedId: null })
  } else {
    documentStore.setState({ externalNotice: { kind: 'updated', at: message.timestamp } })
  }
  void refreshDrafts()
}

let unsubscribeSync: (() => void) | null = null

/** Subscribes the stores to cross-tab BroadcastChannel messages. Idempotent. */
export function initStoreSync(): void {
  if (unsubscribeSync !== null) return
  unsubscribeSync = onExternalUpdate(handleExternalMessage)
}

export function stopStoreSync(): void {
  unsubscribeSync?.()
  unsubscribeSync = null
}
