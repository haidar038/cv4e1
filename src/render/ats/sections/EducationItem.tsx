import type { EducationDisplay } from '../../../core/view-models'
import { dateRangeText, joinMeta } from './display'

export function EducationItem({ item }: { item: EducationDisplay }) {
  const meta = joinMeta([item.degree, item.field, item.location])
  const facts = joinMeta([
    dateRangeText(item.dates),
    item.status,
    item.gpa !== undefined ? `${item.gpa.label}: ${item.gpa.formatted}` : undefined,
  ])
  return (
    <article className="cv-ats-item">
      <p className="cv-ats-item-title">
        <strong>{item.institution}</strong>
      </p>
      {meta !== undefined && <p className="cv-ats-item-meta">{meta}</p>}
      {facts !== undefined && <p className="cv-ats-item-meta">{facts}</p>}
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
