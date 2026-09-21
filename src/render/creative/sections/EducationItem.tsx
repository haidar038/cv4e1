import type { EducationDisplay } from '../../../core/view-models'
import { dateRangeText, joinMeta } from '../../ats/sections/display'
import styles from '../templates/default/styles.module.css'

export function EducationItem({ item }: { item: EducationDisplay }) {
  const meta = joinMeta([item.degree, item.field, item.location])
  const facts = joinMeta([
    dateRangeText(item.dates),
    item.status,
    item.gpa !== undefined ? `${item.gpa.label}: ${item.gpa.formatted}` : undefined,
  ])
  return (
    <article className={styles.item}>
      <p className={styles.itemTitle}>
        <strong>{item.institution}</strong>
      </p>
      {meta !== undefined && <p className={styles.itemMeta}>{meta}</p>}
      {facts !== undefined && <p className={styles.itemMeta}>{facts}</p>}
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
