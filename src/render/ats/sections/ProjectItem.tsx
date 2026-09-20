import type { ProjectDisplay } from '../../../core/view-models'
import { dateRangeText } from './display'

export function ProjectItem({ item }: { item: ProjectDisplay }) {
  const dates = dateRangeText(item.dates)
  return (
    <article className="cv-ats-item">
      <p className="cv-ats-item-title">
        <strong>{item.name}</strong>
        {item.role !== undefined && ` — ${item.role}`}
      </p>
      {item.context !== undefined && <p className="cv-ats-item-meta">{item.context}</p>}
      {dates !== undefined && <p className="cv-ats-item-meta">{dates}</p>}
      {item.url !== undefined && (
        <p className="cv-ats-item-meta">
          <a href={item.url}>{item.url}</a>
        </p>
      )}
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
