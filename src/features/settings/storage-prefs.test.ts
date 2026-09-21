import { describe, expect, it } from 'vitest'
import { STORAGE_NOTICE_KEY, hasSeenStorageNotice, markStorageNoticeSeen } from './storage-prefs'

function fakeStorage(): {
  store: Record<string, string>
  storage: { getItem(key: string): string | null; setItem(key: string, value: string): void }
} {
  const store: Record<string, string> = {}
  return {
    store,
    storage: {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value
      },
    },
  }
}

describe('storage notice acknowledgement (Task 15, FR-109)', () => {
  it('is unseen by default and seen after acknowledgement', () => {
    const { store, storage } = fakeStorage()

    expect(hasSeenStorageNotice(storage)).toBe(false)
    markStorageNoticeSeen(storage)
    expect(store[STORAGE_NOTICE_KEY]).toBe('1')
    expect(hasSeenStorageNotice(storage)).toBe(true)
  })

  it('never throws on blocked storage — the banner simply shows again', () => {
    expect(hasSeenStorageNotice(null)).toBe(false)
    expect(() =>
      markStorageNoticeSeen({
        getItem: () => null,
        setItem: () => {
          throw new Error('blocked')
        },
      }),
    ).not.toThrow()
  })
})
