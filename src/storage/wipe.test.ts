import { describe, expect, it, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db } from './db'
import { saveDraft } from './repository'
import { WIPE_KEY_PREFIX, WIPE_PRECACHE_NAME, wipeLocalData, type WipeDeps } from './wipe'
import type { ValidatedResumeDocument } from '../core/schema'

function createTestDoc(name: string): ValidatedResumeDocument {
  return { schemaVersion: '1.0.0', basics: { name }, sections: {} }
}

/** Map-backed localStorage stand-in (the node project has no DOM storage). */
function fakeStorage(
  initial: string[] = [],
): { keys: string[]; removed: string[] } & Pick<WipeDeps, 'listStorageKeys' | 'removeStorageKey'> {
  const keys = [...initial]
  const removed: string[] = []
  return {
    keys,
    removed,
    listStorageKeys: () => [...keys],
    removeStorageKey: (key: string) => {
      removed.push(key)
      const index = keys.indexOf(key)
      if (index >= 0) keys.splice(index, 1)
    },
  }
}

function fakeCaches(
  names: string[] = [],
  failDelete = false,
): Pick<WipeDeps, 'listCaches' | 'deleteCache'> & { deleted: string[] } {
  const deleted: string[] = []
  return {
    deleted,
    listCaches: async () => [...names],
    deleteCache: async (name: string) => {
      if (failDelete) return false
      deleted.push(name)
      return true
    },
  }
}

describe('wipeLocalData (Task 15, FR-108)', () => {
  beforeEach(async () => {
    await Promise.all([db.drafts.clear(), db.assets.clear(), db.meta.clear()])
  })

  it('clears all three IndexedDB stores with the real default seam', async () => {
    await saveDraft(createTestDoc('Wipe Me'))
    await db.assets.put({ ref: 'photo-1', blob: new Blob(['x'], { type: 'image/png' }) })
    await db.meta.put({ key: 'mode', value: 'ats' })

    // No overrides for IndexedDB: the node project has no localStorage/caches,
    // so those steps honestly report "unavailable" while the real Dexie clear runs.
    const report = await wipeLocalData()

    expect(report.steps.find((step) => step.step === 'indexedDB')).toMatchObject({ ok: true })
    expect(await db.drafts.count()).toBe(0)
    expect(await db.assets.count()).toBe(0)
    expect(await db.meta.count()).toBe(0)
    expect(report.ok).toBe(true)
  })

  it('removes every cv4every1: localStorage key — including all keys known today — and keeps foreign keys', async () => {
    const storage = fakeStorage([
      'cv4every1:lastDraftId',
      'cv4every1:printHelpSeen',
      'cv4every1:storageNoticeSeen',
      'some-other-app',
    ])
    const caches = fakeCaches([])

    const report = await wipeLocalData({ ...storage, ...caches })

    expect(report.ok).toBe(true)
    expect(storage.removed.sort()).toEqual([
      'cv4every1:lastDraftId',
      'cv4every1:printHelpSeen',
      'cv4every1:storageNoticeSeen',
    ])
    expect(storage.keys).toEqual(['some-other-app'])
  })

  it('deletes exactly the app precache and leaves foreign caches alone', async () => {
    const storage = fakeStorage([])
    const caches = fakeCaches([WIPE_PRECACHE_NAME, 'foreign-cache'])

    const report = await wipeLocalData({ ...storage, ...caches })

    expect(report.ok).toBe(true)
    expect(caches.deleted).toEqual([WIPE_PRECACHE_NAME])
    expect(report.steps.find((step) => step.step === 'cache')).toMatchObject({
      ok: true,
      removed: 1,
      note: 'cleared',
    })
  })

  it('stays honest when the precache is already absent', async () => {
    const report = await wipeLocalData({ ...fakeStorage([]), ...fakeCaches([]) })

    expect(report.ok).toBe(true)
    expect(report.steps.find((step) => step.step === 'cache')).toMatchObject({
      ok: true,
      note: 'already-absent',
    })
  })

  it('treats unavailable Cache Storage (file://) and blocked localStorage as nothing-to-delete, not failure', async () => {
    const report = await wipeLocalData({
      listStorageKeys: () => null,
      removeStorageKey: () => {},
      listCaches: async () => null,
      deleteCache: async () => true,
    })

    expect(report.ok).toBe(true)
    expect(report.steps.find((step) => step.step === 'localStorage')).toMatchObject({
      ok: true,
      note: 'unavailable',
    })
    expect(report.steps.find((step) => step.step === 'cache')).toMatchObject({
      ok: true,
      note: 'unavailable',
    })
  })

  it('never throws: a failed IndexedDB clear is reported, not raised', async () => {
    const report = await wipeLocalData({
      clearStores: async () => {
        throw new Error('blocked')
      },
      ...fakeStorage([]),
      ...fakeCaches([]),
    })

    expect(report.ok).toBe(false)
    expect(report.steps.find((step) => step.step === 'indexedDB')).toMatchObject({ ok: false })
  })

  it('reports partial localStorage and failed cache deletion honestly', async () => {
    const storage = fakeStorage(['cv4every1:a', 'cv4every1:b'])
    const report = await wipeLocalData({
      listStorageKeys: storage.listStorageKeys,
      removeStorageKey: (key: string) => {
        if (key === 'cv4every1:b') throw new Error('blocked')
        storage.removeStorageKey(key)
      },
      ...fakeCaches([WIPE_PRECACHE_NAME], true),
    })

    expect(report.ok).toBe(false)
    expect(report.steps.find((step) => step.step === 'localStorage')).toMatchObject({
      ok: false,
      note: 'partial',
    })
    expect(report.steps.find((step) => step.step === 'cache')).toMatchObject({
      ok: false,
      note: 'failed',
    })
    expect(WIPE_KEY_PREFIX).toBe('cv4every1:')
  })
})
