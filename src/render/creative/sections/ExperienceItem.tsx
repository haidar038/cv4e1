import type { ExperienceDisplay } from '../../../core/view-models'
import { dateRangeText, joinMeta } from '../../ats/sections/display'
import styles from '../templates/default/styles.module.css'

/** Used for both `experience` and `organizations` — same display shape. */
export function ExperienceItem({ item }: { item: ExperienceDisplay }) {
  const meta = joinMeta([item.employmentType, item.location])
  const dates = dateRangeText(item.dates)
  return (
    <article className={styles.item}>
      <p className={styles.itemTitle}>
        <strong>{item.organization}</strong>
        {item.role !== undefined && ` — ${item.role}`}
      </p>
      {meta !== undefined && <p className={styles.itemMeta}>{meta}</p>}
      {dates !== undefined && <p className={styles.itemMeta}>{dates}</p>}
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
