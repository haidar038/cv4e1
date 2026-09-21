import { describe, expect, it } from 'vitest'
import { hasSeenPrintHelp, markPrintHelpSeen, PRINT_HELP_KEY } from './print-prefs'

function memoryStorage(): Map<string, string> & {
  getItem(k: string): string | null
  setItem(k: string, v: string): void
} {
  const map = new Map<string, string>()
  return Object.assign(map, {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string): void => {
      map.set(k, v)
    },
  })
}

describe('print first-run flag (localStorage UI preference, never CV content)', () => {
  it('starts unseen, persists after marking', () => {
    const storage = memoryStorage()
    expect(hasSeenPrintHelp(storage)).toBe(false)
    markPrintHelpSeen(storage)
    expect(storage.get(PRINT_HELP_KEY)).toBe('1')
    expect(hasSeenPrintHelp(storage)).toBe(true)
  })

  it('survives throwing storage (blocked mode shows guidance, never crashes)', () => {
    const throwing = {
      getItem: (): string | null => {
        throw new Error('blocked')
      },
      setItem: (): void => {
        throw new Error('blocked')
      },
    }
    expect(hasSeenPrintHelp(throwing)).toBe(false)
    expect(() => markPrintHelpSeen(throwing)).not.toThrow()
  })
})
