/**
 * In-memory API-key vault (Task 18, FR-407/FR-110, ai-provider-strategy.md §4).
 *
 * Session memory is a deliberate privacy decision (maintainer, Task 18 Q2):
 * a module-level Map lives and dies with the tab. There is deliberately NO
 * save/load/serialize API — persistence cannot be added by accident, only by
 * writing a new storage call, which review and the FR-110 round-trip test
 * would catch. Keys never enter `ResumeDocument`, IndexedDB, localStorage,
 * the export envelope, or logs (NFR-011: this module has zero console calls).
 */

export interface ProviderSessionCredentials {
  readonly apiKey: string
  readonly model?: string
  readonly baseUrl?: string
}

const vault = new Map<string, ProviderSessionCredentials>()

export function setSessionCredentials(
  providerId: string,
  credentials: ProviderSessionCredentials,
): void {
  vault.set(providerId, { ...credentials })
}

export function getSessionCredentials(providerId: string): ProviderSessionCredentials | null {
  const found = vault.get(providerId)
  return found === undefined ? null : { ...found }
}

export function hasSessionCredentials(providerId: string): boolean {
  const found = vault.get(providerId)
  return found !== undefined && found.apiKey.trim() !== ''
}

/** Forgets one provider, or every provider when called without an argument. */
export function clearSessionCredentials(providerId?: string): void {
  if (providerId === undefined) {
    vault.clear()
    return
  }
  vault.delete(providerId)
}
