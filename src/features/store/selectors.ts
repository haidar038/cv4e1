import type { ValidatedResumeDocument } from '../../core/schema'
import { toATSViewModel, toCreativeViewModel } from '../../core/normalize'
import type { ATSViewModel, CreativeViewModel } from '../../core/view-models'

/**
 * View-model selectors, memoized by document reference (state-management.md §5).
 *
 * `normalize()` is pure and proven side-effect free, so caching on the input
 * reference is sound: every store action produces a new document object when
 * (and only when) content changes, so an identical reference can never hide a
 * real change — and unrelated UI state can never invalidate the cache.
 */

interface VMCache<VM> {
  readonly source: ValidatedResumeDocument
  readonly vm: VM
}

let atsCache: VMCache<ATSViewModel> | null = null

export function selectATSViewModel(document: ValidatedResumeDocument | null): ATSViewModel | null {
  if (document === null) return null
  if (atsCache !== null && atsCache.source === document) return atsCache.vm
  const vm = toATSViewModel(document)
  atsCache = { source: document, vm }
  return vm
}

let creativeCache: VMCache<CreativeViewModel> | null = null

export function selectCreativeViewModel(
  document: ValidatedResumeDocument | null,
): CreativeViewModel | null {
  if (document === null) return null
  if (creativeCache !== null && creativeCache.source === document) return creativeCache.vm
  const vm = toCreativeViewModel(document)
  creativeCache = { source: document, vm }
  return vm
}
