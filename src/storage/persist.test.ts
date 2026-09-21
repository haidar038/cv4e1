import { describe, expect, it } from 'vitest'
import { requestPersistentStorage } from './persist'

describe('requestPersistentStorage (F-G4, best-effort)', () => {
  it('returns true when the browser grants persistence', async () => {
    await expect(
      requestPersistentStorage({ storage: { persist: async () => true } }),
    ).resolves.toBe(true)
  })

  it('returns false on denial, absence, or failure — never throws', async () => {
    await expect(
      requestPersistentStorage({ storage: { persist: async () => false } }),
    ).resolves.toBe(false)
    await expect(requestPersistentStorage({})).resolves.toBe(false)
    await expect(
      requestPersistentStorage({
        storage: {
          persist: async (): Promise<boolean> => {
            throw new Error('denied')
          },
        },
      }),
    ).resolves.toBe(false)
  })
})
