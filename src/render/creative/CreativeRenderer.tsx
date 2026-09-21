import type { CreativeViewModel } from '../../core/view-models'
import { TemplateDefault, type PhotoResolver } from './templates/default/TemplateDefault'

/**
 * Creative renderer (Task 11, ADR-0004/0007): renders the CreativeViewModel
 * as a photo-bearing, two-column document whose text survives PDF
 * extraction. Deliberately dumb about data — every display decision was made
 * by normalize() — and structurally gated (structural.ts + the stylesheet
 * gates in CreativeRenderer.test.tsx): no rasterization, no text via
 * background-image, exactly one <img> with alt, colors only from theme
 * tokens. A template cannot bypass those gates because they run against the
 * rendered markup, not the source.
 *
 * Unlike the ATS renderer, the Creative view model legitimately carries the
 * photo, so the second prop is the injected photo resolver — features/
 * supplies the object-URL seam so render/ never imports storage/.
 */
export function CreativeRenderer({
  vm,
  resolvePhotoUrl,
}: {
  vm: CreativeViewModel
  resolvePhotoUrl: PhotoResolver
}) {
  return <TemplateDefault vm={vm} resolvePhotoUrl={resolvePhotoUrl} />
}
