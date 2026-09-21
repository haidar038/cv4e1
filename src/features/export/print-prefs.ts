/**
 * First-print flag (Task 14, D19).
 *
 * A UI preference in `localStorage` — never resume content (AGENTS.md §2.9).
 * The print instructions modal opens before the first `window.print()` and
 * can be reopened anytime from the help button. Storage access is guarded:
 * when blocked, the modal simply shows every time (harmless guidance).
 */

export const PRINT_HELP_KEY = 'cv4every1:printHelpSeen'

interface StringStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

function safeStorage(): StringStorage | null {
  try {
    return localStorage
  } catch {
    return null
  }
}

export function hasSeenPrintHelp(storage: StringStorage | null = safeStorage()): boolean {
  try {
    return storage?.getItem(PRINT_HELP_KEY) === '1'
  } catch {
    return false
  }
}

export function markPrintHelpSeen(storage: StringStorage | null = safeStorage()): void {
  try {
    storage?.setItem(PRINT_HELP_KEY, '1')
  } catch {
    // Guidance only — a blocked write just means the modal shows again.
  }
}
