import type { ProjectDisplay } from '../../../core/view-models'
import { dateRangeText } from '../../ats/sections/display'
import styles from '../templates/default/styles.module.css'

export function ProjectItem({ item }: { item: ProjectDisplay }) {
  const dates = dateRangeText(item.dates)
  return (
    <article className={styles.item}>
      <p className={styles.itemTitle}>
        <strong>{item.name}</strong>
        {item.role !== undefined && ` — ${item.role}`}
      </p>
      {item.context !== undefined && <p className={styles.itemMeta}>{item.context}</p>}
      {dates !== undefined && <p className={styles.itemMeta}>{dates}</p>}
      {item.url !== undefined && (
        <p className={styles.itemMeta}>
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
