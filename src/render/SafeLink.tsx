import type { ReactNode } from 'react'
import { safeHref } from '../core/safe-url'

/**
 * Hyperlink with a scheme gate (F4c, security-requirements.md §2).
 *
 * User-supplied URLs reach `<a href>` here. Only http(s) becomes clickable;
 * anything else (`javascript:`, `data:`, …) renders as plain text so the
 * user's data stays visible without becoming executable. Text content is
 * identical either way, so ATS text-extraction expectations are unaffected.
 */
export function SafeLink({ url, children }: { url: string; children: ReactNode }) {
  const href = safeHref(url)
  if (href === null) return <span>{children}</span>
  return <a href={href}>{children}</a>
}
