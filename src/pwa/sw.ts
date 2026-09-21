/**
 * Minimal precache service worker (Task 14, D20).
 *
 * Built by `vite-plugin-pwa` in `injectManifest` mode: the plugin replaces
 * `self.__WB_MANIFEST` with the precached app-shell URLs at build time
 * (build-time only — the plugin ships zero runtime code into the app bundle).
 *
 * Deliberate deviation from the Fase 1 plan text ("Workbox service worker"):
 * `generateSW` emits a ~10 KB gzip workbox runtime into dist/, which would
 * single-handedly fail the jsGzip ratchet (only ±3,3 KB of room left after
 * Task 12). This worker is ~1 KB of raw Cache API with exactly two jobs —
 * serve the precached shell offline, and prune hashed assets left behind by
 * older builds — so the ratchet keeps protecting the budget. There is
 * intentionally NO runtime caching: CV data lives in IndexedDB and must never
 * be cached as network responses (AGENTS.md §2.9).
 *
 * Update strategy: the new worker installs on the next visit, claims clients
 * immediately (`skipWaiting` + `clientsClaim` equivalent below), and deletes
 * any cache entry not in the fresh manifest — a stale SW can never pin the
 * user to an old shell. If Cache Storage is cleared, the shell refetches from
 * the network while drafts in IndexedDB stay intact (cache ≠ data).
 *
 * `file://` fallback: this file is never registered off http(s) — see
 * `features/offline/register-sw.ts`. The app runs without it.
 */

// The app tsconfig uses the DOM lib only (no WebWorker lib), so the worker
// surface is declared minimally and locally instead of widening the lib for
// the whole project.
interface PrecacheEntry {
  readonly url: string
  readonly revision: string | null
}

interface WorkerEvent {
  waitUntil(promise: Promise<unknown>): void
  respondWith(response: Promise<Response>): void
  readonly request: Request
}

declare const self: {
  readonly __WB_MANIFEST: ReadonlyArray<PrecacheEntry | string>
  skipWaiting(): Promise<void> | void
  readonly clients: { claim(): Promise<void> }
  readonly caches: CacheStorage
  readonly location: Location
  addEventListener(
    type: 'install' | 'activate' | 'fetch',
    listener: (event: WorkerEvent) => void,
  ): void
}

const PRECACHE_NAME = 'cv4every1-precache'

function manifestUrls(): string[] {
  return self.__WB_MANIFEST.map((entry) => (typeof entry === 'string' ? entry : entry.url))
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await self.caches.open(PRECACHE_NAME)
      await cache.addAll(manifestUrls())
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Drop whole foreign caches, then prune hashed assets from older builds
      // that are no longer in this build's manifest.
      const keys = await self.caches.keys()
      await Promise.all(
        keys.filter((key) => key !== PRECACHE_NAME).map((key) => self.caches.delete(key)),
      )
      const cache = await self.caches.open(PRECACHE_NAME)
      const keep = new Set(manifestUrls())
      const origin = self.location.origin
      await Promise.all(
        (await cache.keys()).map((request) => {
          const path = request.url.startsWith(origin)
            ? request.url.slice(origin.length).replace(/^\//, '')
            : request.url
          const bare = path.split('?')[0] ?? path
          if (!keep.has(path) && !keep.has(bare) && !keep.has(`/${bare}`)) {
            return cache.delete(request)
          }
          return Promise.resolve(false)
        }),
      )
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  // Never runtime-cache anything off-origin (there is nothing off-origin
  // today — C-T10 — and this guard keeps it that way by construction).
  if (new URL(request.url, self.location.href).origin !== self.location.origin) return
  event.respondWith(
    (async () => {
      // URL-keyed match (Workbox-precache semantics): `cache.addAll` stores
      // entries under their URL, but `match(request)` additionally folds the
      // request's headers into the response's `Vary` check — and the static
      // server sends `Vary: Origin`, so document-issued requests
      // (navigation/script/style) MISS while synthetic ones HIT. Matching the
      // URL string builds the same default Request the precache used, so
      // shell URLs always hit. Safe: the precache holds our own static bytes;
      // nothing here is content-negotiated.
      const cached = await self.caches.match(request.url)
      if (cached !== undefined) return cached
      if (request.mode === 'navigate') {
        const fallback = await self.caches.match('index.html')
        if (fallback !== undefined) return fallback
      }
      return fetch(request)
    })(),
  )
})
