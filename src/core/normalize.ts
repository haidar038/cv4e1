/**
 * Normalization functions: ResumeDocument → View Models.
 *
 * These are PURE FUNCTIONS. No side effects, no DOM access.
 * Business rules for mode enforcement live HERE, not in renderers or components.
 */

import type { ValidatedResumeDocument } from './schema'
import type { ATSViewModel, CreativeViewModel } from './view-models'
import { buildOrderedSections, buildContactDisplay } from './normalize-helpers'

/**
 * Derives the ATS ViewModel from a validated ResumeDocument.
 *
 * RULES ENFORCED (AGENTS.md §2.15, rendering-architecture.md §2):
 * - Photo is STRUCTURALLY ABSENT (not just hidden via flag)
 * - Single column implied by absence of layout hints
 * - Standard headings only
 * - Empty sections excluded
 */
export function toATSViewModel(doc: ValidatedResumeDocument): ATSViewModel {
  const locale = (doc.meta?.locale ?? 'id') as 'id' | 'en'

  const viewModel: ATSViewModel = {
    mode: 'ats',
    name: doc.basics.name,
    contacts: buildContactDisplay(doc),
    links: (doc.basics.links ?? []).map((l) => ({ label: l.label ?? l.url, url: l.url })),
    // NOTE: photo field intentionally omitted — structural enforcement of ATS rule
    sections: buildOrderedSections(doc, locale),
  }

  // Optional fields stay ABSENT rather than explicitly `undefined`
  // (exactOptionalPropertyTypes). JSON serialization is unchanged, since
  // JSON.stringify drops undefined-valued keys either way.
  if (doc.basics.headline !== undefined) viewModel.headline = doc.basics.headline
  if (doc.basics.summary !== undefined) viewModel.summary = doc.basics.summary

  return viewModel
}

/**
 * Derives the Creative ViewModel from a validated ResumeDocument.
 *
 * RULES (rendering-architecture.md §2):
 * - Photo included IF enabled AND has assetRef
 * - Two-column layout permitted (renderer decides)
 * - Color accents permitted (template decides)
 * - Text must remain selectable (renderer responsibility)
 * - Empty sections excluded
 */
export function toCreativeViewModel(doc: ValidatedResumeDocument): CreativeViewModel {
  const locale = (doc.meta?.locale ?? 'id') as 'id' | 'en'
  const photoEnabled = doc.basics.photo?.enabled ?? false
  const photoAssetRef = doc.basics.photo?.assetRef

  const viewModel: CreativeViewModel = {
    mode: 'creative',
    name: doc.basics.name,
    contacts: buildContactDisplay(doc),
    links: (doc.basics.links ?? []).map((l) => ({ label: l.label ?? l.url, url: l.url })),
    sections: buildOrderedSections(doc, locale),
  }

  if (doc.basics.headline !== undefined) viewModel.headline = doc.basics.headline
  if (doc.basics.summary !== undefined) viewModel.summary = doc.basics.summary

  // Photo is included only when enabled AND an assetRef is present.
  if (photoEnabled && photoAssetRef) {
    viewModel.photo = { assetRef: photoAssetRef, enabled: true }
  }

  return viewModel
}
