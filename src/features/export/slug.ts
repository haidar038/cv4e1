import type { ResumeMode } from '../store/ui-store'

/**
 * Suggested PDF filename (Task 14, J5): `CV-<SlugNama>-<mode>.pdf`.
 *
 * Honest by construction: `window.print()` cannot set the save-dialog
 * filename programmatically, so this is guidance text shown in the print
 * instructions modal — the user types it when saving. Diacritics are folded
 * (`é` → `e`) so the suggestion is safe on filesystems that dislike them.
 */

/** Lowercase ASCII slug, max 40 chars; falls back to `tanpa-nama`. */
export function slugifyName(name: string): string {
  const slug = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '')
  return slug === '' ? 'tanpa-nama' : slug
}

export function suggestedPdfFilename(name: string, mode: ResumeMode): string {
  return `CV-${slugifyName(name)}-${mode}.pdf`
}
