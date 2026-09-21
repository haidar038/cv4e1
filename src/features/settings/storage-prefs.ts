/**
 * Storage-notice acknowledgement (Task 15, FR-109).
 *
 * A UI preference in `localStorage` — never resume content (AGENTS.md §2.9).
 * The prominent banner shows once (after the first successful save) until
 * acknowledged; the footer notice stays permanently regardless. Storage
 * access is guarded: when blocked, the banner simply shows again (harmless
 * guidance — same precedent as `export/print-prefs.ts`).
 */

export const STORAGE_NOTICE_KEY = 'cv4every1:storageNoticeSeen'

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

export function hasSeenStorageNotice(storage: StringStorage | null = safeStorage()): boolean {
  try {
    return storage?.getItem(STORAGE_NOTICE_KEY) === '1'
  } catch {
    return false
  }
}

export function markStorageNoticeSeen(storage: StringStorage | null = safeStorage()): void {
  try {
    storage?.setItem(STORAGE_NOTICE_KEY, '1')
  } catch {
    // Guidance only — a blocked write just means the banner shows again.
  }
}
