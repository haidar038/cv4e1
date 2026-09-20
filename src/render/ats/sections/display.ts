import type { DateRangeDisplay } from '../../../core/view-models'

/**
 * One-line date range with an en dash ("Agustus 2021 – Juli 2025"); a
 * one-sided range renders that side alone. All display formatting already
 * happened in normalize() — this only composes the two strings.
 */
export function dateRangeText(dates: DateRangeDisplay): string | undefined {
  const { start, end } = dates
  if (start !== undefined && end !== undefined) return `${start} – ${end}`
  return start ?? end
}

/** Joins present display strings with the `·` separator, dropping absent ones. */
export function joinMeta(parts: Array<string | undefined>): string | undefined {
  const present = parts.filter((part): part is string => part !== undefined && part !== '')
  if (present.length === 0) return undefined
  return present.join(' · ')
}
