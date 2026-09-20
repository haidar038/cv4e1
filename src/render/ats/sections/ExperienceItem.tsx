import type { ExperienceDisplay } from '../../../core/view-models'
import { dateRangeText, joinMeta } from './display'

/** Used for both `experience` and `organizations` — same display shape. */
export function ExperienceItem({ item }: { item: ExperienceDisplay }) {
  const meta = joinMeta([item.employmentType, item.location])
  const dates = dateRangeText(item.dates)
  return (
    <article className="cv-ats-item">
      <p className="cv-ats-item-title">
        <strong>{item.organization}</strong>
        {item.role !== undefined && ` — ${item.role}`}
      </p>
      {meta !== undefined && <p className="cv-ats-item-meta">{meta}</p>}
      {dates !== undefined && <p className="cv-ats-item-meta">{dates}</p>}
      {item.highlights.length > 0 && (
        <ul>
          {item.highlights.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
      )}
    </article>
  )
}
