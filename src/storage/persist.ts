/**
 * Persistent-storage request (Task 14, F-G4).
 *
 * Asks the browser not to evict the origin's IndexedDB under storage
 * pressure. Best-effort by design: denial or absence changes nothing — data
 * still saves, and the export reminder (Task 15) remains the real backup.
 * Called once when the first draft is created; never blocks, never throws.
 */

/** Minimal structural surface so tests can inject fakes without a DOM. */
export interface PersistNavigator {
  readonly storage?: {
    persist(): Promise<boolean>
  }
}

/** Returns true when persistence was granted; false otherwise (never throws). */
export async function requestPersistentStorage(
  navigatorLike: PersistNavigator = navigator,
): Promise<boolean> {
  try {
    const result = await navigatorLike.storage?.persist()
    return result === true
  } catch {
    return false
  }
}
