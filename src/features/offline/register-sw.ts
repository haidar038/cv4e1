/**
 * Service-worker registration guard (Task 14, D20).
 *
 * The worker only makes sense over http(s): on `file://` there is no origin
 * to scope a worker to, so the app runs as a plain page without offline
 * precaching (documented limitation, not a failure). Registration is manual —
 * `vite.config.ts` sets `injectRegister: false` — so this predicate, not the
 * plugin's inline snippet, decides. Production-only: the dev server never
 * serves the built worker.
 */

/** Pure predicate, unit-tested (node env, no DOM): only http(s) registers. */
export function shouldRegisterServiceWorker(protocol: string): boolean {
  return protocol === 'http:' || protocol === 'https:'
}

/** Fire-and-forget registration; a failure never breaks the app shell. */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
  if (!shouldRegisterServiceWorker(window.location.protocol)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Offline precaching unavailable — the app itself works regardless.
    })
  })
}
