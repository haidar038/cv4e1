import type { CertificationDisplay, SkillGroupDisplay } from '../../../core/view-models'
import { joinMeta } from '../../ats/sections/display'
import styles from '../templates/default/styles.module.css'

export function SkillsGroup({ item }: { item: SkillGroupDisplay }) {
  return (
    <article className={styles.item}>
      <p className={styles.itemTitle}>
        {item.category !== undefined && <strong>{item.category}: </strong>}
        {item.items.join(', ')}
      </p>
    </article>
  )
}

export function CertificationItem({ item }: { item: CertificationDisplay }) {
  const meta = joinMeta([item.issuer, item.issueDate])
  return (
    <article className={styles.item}>
      <p className={styles.itemTitle}>
        <strong>{item.name}</strong>
      </p>
      {meta !== undefined && <p className={styles.itemMeta}>{meta}</p>}
      {item.url !== undefined && (
        <p className={styles.itemMeta}>
          <a href={item.url}>{item.url}</a>
        </p>
      )}
    </article>
  )
}
