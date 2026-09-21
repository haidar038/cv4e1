import { useEffect, useState } from 'react'
import { useMicrocopy } from '../form/useMicrocopy'

/**
 * Offline status indicator (Task 14, F-G3).
 *
 * Silent while online (nothing to say); a `role="status"` live region while
 * offline, so screen readers announce the transition. Guidance tone, never
 * alarming — offline is a fully supported state here, not an error.
 */
export function OfflineIndicator() {
  const pack = useMicrocopy()
  const [online, setOnline] = useState<boolean>(
    () => typeof navigator === 'undefined' || navigator.onLine,
  )

  useEffect(() => {
    const goOffline = (): void => setOnline(false)
    const goOnline = (): void => setOnline(true)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  if (online) return null
  // Live-region query rule (see e2e/a11y.spec.ts): Testing Library and
  // Playwright both fail to match an accessible *name* from live-region
  // contents, so tests target this node by role + text, never role + name.
  // A `div` (not `p`) keeps the text query working identically in jsdom.
  return (
    <div
      role="status"
      className="border p-2 text-center text-xs text-muted-foreground print:hidden"
    >
      {pack.offline.offlineMessage}
    </div>
  )
}
