import { describe, it, expect, beforeEach, vi } from 'vitest'
import 'fake-indexeddb/auto' // Polyfills IndexedDB globally for tests
import { db } from './db'
import { saveDraft, loadDraft, listDrafts, deleteDraft, wipeAllData } from './repository'
import type { ValidatedResumeDocument } from '../core/schema'
import { StorageFullError } from './errors'

// Helper to create a minimal valid document for testing
function createTestDoc(name: string = 'Test User'): ValidatedResumeDocument {
  return {
    schemaVersion: '1.0.0',
    basics: { name },
    sections: {},
  }
}

describe('Storage Repository', () => {
  beforeEach(async () => {
    // Clean slate before each test
    await db.drafts.clear()
    await db.assets.clear()
  })

  describe('saveDraft & loadDraft', () => {
    it('should save a new draft and retrieve it correctly', async () => {
      const doc = createTestDoc('Alice Example')

      // Save without existing ID -> generates new one
      const savedRecord = await saveDraft(doc)

      expect(savedRecord.id).toBeDefined()
      expect(savedRecord.updatedAt).toBeGreaterThan(0)
      expect(savedRecord.basics.name).toBe('Alice Example')

      // Load it back
      const loadedRecord = await loadDraft(savedRecord.id)

      expect(loadedRecord).not.toBeNull()
      expect(loadedRecord?.id).toBe(savedRecord.id)
      expect(loadedRecord?.basics.name).toBe('Alice Example')
    })

    it('should update an existing draft when ID is provided', async () => {
      const doc1 = createTestDoc('Bob Original')
      const record1 = await saveDraft(doc1)

      // Wait slightly to ensure timestamp difference if we were checking strictly,
      // but logic relies on ID presence.

      const doc2 = createTestDoc('Bob Updated')
      const record2 = await saveDraft(doc2, record1.id)

      expect(record2.id).toBe(record1.id)
      expect(record2.basics.name).toBe('Bob Updated')

      const loaded = await loadDraft(record1.id)
      expect(loaded?.basics.name).toBe('Bob Updated')
    })

    it('should throw InvalidDataError for invalid documents', async () => {
      // Cast to any to simulate runtime bad data passing type check
      const badDoc = {
        ...createTestDoc(),
        schemaVersion: '99.99.99',
      } as unknown as ValidatedResumeDocument

      await expect(saveDraft(badDoc)).rejects.toThrow(/Data tidak valid/)
    })
  })

  describe('listDrafts', () => {
    it('should return empty array when no drafts exist', async () => {
      const drafts = await listDrafts()
      expect(drafts).toEqual([])
    })

    it('should return drafts sorted by updatedAt descending', async () => {
      const docA = createTestDoc('A')
      const docB = createTestDoc('B')
      const docC = createTestDoc('C')

      // Save sequentially with tiny delays to ensure distinct timestamps in real env,
      // though fake-indexeddb might be fast enough to collide.
      // We rely on the fact that later saves have higher/equal timestamps.
      await saveDraft(docA)
      await new Promise((r) => setTimeout(r, 10))
      await saveDraft(docB)
      await new Promise((r) => setTimeout(r, 10))
      await saveDraft(docC)

      const drafts = await listDrafts()

      expect(drafts.length).toBe(3)
      // Most recent first
      const [newest, middle, oldest] = drafts
      expect(newest?.title).toBe('C')
      expect(middle?.title).toBe('B')
      expect(oldest?.title).toBe('A')
    })

    it('should use meta.title if available, else basics.name', async () => {
      const docWithMeta = {
        ...createTestDoc('Name Only'),
        meta: { title: 'Custom Title' },
      } as ValidatedResumeDocument

      await saveDraft(docWithMeta)
      const drafts = await listDrafts()
      expect(drafts[0]?.title).toBe('Custom Title')
    })
  })

  describe('deleteDraft', () => {
    it('should remove a draft permanently', async () => {
      const doc = createTestDoc('ToDelete')
      const record = await saveDraft(doc)

      await deleteDraft(record.id)

      const loaded = await loadDraft(record.id)
      expect(loaded).toBeNull()

      const all = await listDrafts()
      expect(all.length).toBe(0)
    })
  })

  describe('wipeAllData', () => {
    it('should clear all drafts and assets', async () => {
      await saveDraft(createTestDoc('Wipe Me'))

      // Mock asset save just to populate store
      const blob = new Blob(['test'], { type: 'image/png' })
      await db.assets.put({ ref: 'asset-1', blob })

      await wipeAllData()

      const drafts = await db.drafts.count()
      const assets = await db.assets.count()

      expect(drafts).toBe(0)
      expect(assets).toBe(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle QuotaExceededError gracefully', async () => {
      const doc = createTestDoc('Quota Test')

      // Mock the underlying IndexedDB transaction or table operation.
      // Since Dexie wraps IDB, mocking the table's internal _trans or similar is fragile.
      // A more robust way for unit tests of this layer is to mock the repository function itself
      // if we were testing callers, but here we want to test the repository's error translation.
      // We will mock the global indexedDB.open or the specific store interaction via a simpler spy approach.

      // Alternative: Directly inject an error into the promise chain by spying on the DB instance method used.
      // However, since saveDraft calls db.drafts.put(), and that returns a PromiseExtended,
      // we can cast the implementation to any to satisfy TS while rejecting with our custom error object.

      // Use any cast to bypass strict PromiseExtended typing for mocking purposes.
      // This is safe here because we are testing error handling logic, not the return value.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(vi.spyOn(db.drafts, 'put') as any).mockImplementationOnce(() => {
        const err = new Error('Quota exceeded')
        Object.defineProperty(err, 'name', { value: 'QuotaExceededError' })
        return Promise.reject(err)
      })

      await expect(saveDraft(doc)).rejects.toThrow(StorageFullError)

      vi.restoreAllMocks()
    })
  })
})
