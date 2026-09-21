import { db } from './db'

/**
 * Full local wipe (Task 15, FR-108, DF-8, local-storage-strategy.md §7).
 *
 * `repository.wipeAllData()` only cleared the IndexedDB `drafts` + `assets`
 * stores. Deleting *all* traces also means the `meta` store, the small UI
 * preferences in `localStorage` (never resume content — AGENTS.md §2.9), and
 * the Task-14 service-worker precache in Cache Storage.
 *
 * Design notes:
 * - Injectable seams (`WipeDeps`, defaulting to the real globals) keep this
 *   testable in the `node` project, which has neither `localStorage` nor
 *   `caches` (same seam pattern as `features/offline/register-sw.ts` and
 *   `storage/persist.ts`).
 * - This function never throws: every step reports honestly instead, so a
 *   partially-failing wipe (blocked storage, missing Cache Storage on
 *   `file://`) can tell the user exactly what remains (Task 15 edge cases).
 *   Step notes carry counts only — never resume content (NFR-011).
 * - Only the app's own precache (`PRECACHE_NAME`, kept in sync with
 *   `src/pwa/sw.ts` by name — that file runs in worker scope and must not be
 *   imported here) is deleted. Foreign caches are left alone.
 */

/** Must stay identical to `PRECACHE_NAME` in `src/pwa/sw.ts`. */
export const WIPE_PRECACHE_NAME = 'cv4every1-precache'

/**
 * Every `localStorage` key the app owns starts with this prefix (UI
 * preferences + the last-draft pointer — never CV content). The sweep below
 * removes all of them, which covers every key known today without a list
 * that could drift out of sync:
 * - `cv4every1:lastDraftId` (`src/App.tsx`, D14 UI preference)
 * - `cv4every1:printHelpSeen` (`src/features/export/print-prefs.ts`)
 * - `cv4every1:storageNoticeSeen` (`src/features/settings/storage-prefs.ts`)
 */
export const WIPE_KEY_PREFIX = 'cv4every1:'

export type WipeStepName = 'indexedDB' | 'localStorage' | 'cache'

export interface WipeStepResult {
  step: WipeStepName
  ok: boolean
  /** How many entries this step removed (counts only — never content). */
  removed: number
  /** Short machine-stable note for honest user-facing reports. */
  note: string
}

export interface WipeReport {
  steps: WipeStepResult[]
  ok: boolean
}

export interface WipeDeps {
  clearStores: () => Promise<void>
  /** Null = storage unavailable (blocked) — nothing could have been written. */
  listStorageKeys: () => string[] | null
  removeStorageKey: (key: string) => void
  /** Null = Cache Storage unavailable (`file://`, old browser). */
  listCaches: () => Promise<string[] | null>
  deleteCache: (name: string) => Promise<boolean>
}

/** Clears the three IndexedDB stores, including `meta` (Fase 0 only used drafts + assets). */
export async function clearIndexedDBStores(): Promise<void> {
  await db.transaction('rw', db.drafts, db.assets, db.meta, async () => {
    await db.drafts.clear()
    await db.assets.clear()
    await db.meta.clear()
  })
}

function defaultDeps(): WipeDeps {
  return {
    clearStores: clearIndexedDBStores,
    listStorageKeys: () => {
      try {
        const keys: string[] = []
        for (let index = 0; index < localStorage.length; index += 1) {
          const key = localStorage.key(index)
          if (key !== null) keys.push(key)
        }
        return keys
      } catch {
        return null
      }
    },
    removeStorageKey: (key: string) => {
      localStorage.removeItem(key)
    },
    listCaches: async () => {
      try {
        if (typeof caches === 'undefined') return null
        return await caches.keys()
      } catch {
        return null
      }
    },
    deleteCache: async (name: string) => {
      return await caches.delete(name)
    },
  }
}

/**
 * Wipes all three local places and reports each step honestly. Never throws —
 * callers (and the multi-tab broadcast in `wipeAllDataAction`) branch on the
 * returned report instead of catching.
 */
export async function wipeLocalData(overrides: Partial<WipeDeps> = {}): Promise<WipeReport> {
  const deps: WipeDeps = { ...defaultDeps(), ...overrides }
  const steps: WipeStepResult[] = []

  try {
    await deps.clearStores()
    steps.push({ step: 'indexedDB', ok: true, removed: 0, note: 'cleared' })
  } catch {
    steps.push({ step: 'indexedDB', ok: false, removed: 0, note: 'failed' })
  }

  const storageKeys = deps.listStorageKeys()
  if (storageKeys === null) {
    steps.push({ step: 'localStorage', ok: true, removed: 0, note: 'unavailable' })
  } else {
    let removed = 0
    let failed = 0
    for (const key of storageKeys) {
      if (!key.startsWith(WIPE_KEY_PREFIX)) continue
      try {
        deps.removeStorageKey(key)
        removed += 1
      } catch {
        failed += 1
      }
    }
    steps.push({
      step: 'localStorage',
      ok: failed === 0,
      removed,
      note: failed === 0 ? 'cleared' : 'partial',
    })
  }

  try {
    const names = await deps.listCaches()
    if (names === null) {
      steps.push({ step: 'cache', ok: true, removed: 0, note: 'unavailable' })
    } else if (!names.includes(WIPE_PRECACHE_NAME)) {
      steps.push({ step: 'cache', ok: true, removed: 0, note: 'already-absent' })
    } else {
      const deleted = await deps.deleteCache(WIPE_PRECACHE_NAME)
      steps.push({
        step: 'cache',
        ok: deleted,
        removed: deleted ? 1 : 0,
        note: deleted ? 'cleared' : 'failed',
      })
    }
  } catch {
    steps.push({ step: 'cache', ok: false, removed: 0, note: 'failed' })
  }

  return { steps, ok: steps.every((step) => step.ok) }
}
