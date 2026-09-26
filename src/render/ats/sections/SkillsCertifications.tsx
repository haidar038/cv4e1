import type { CertificationDisplay, SkillGroupDisplay } from '../../../core/view-models'
import { SafeLink } from '../../SafeLink'
import { joinMeta } from './display'

export function SkillsGroup({ item }: { item: SkillGroupDisplay }) {
  return (
    <article className="cv-ats-item">
      <p className="cv-ats-item-title">
        {item.category !== undefined && <strong>{item.category}: </strong>}
        {item.items.join(', ')}
      </p>
    </article>
  )
}

export function CertificationItem({ item }: { item: CertificationDisplay }) {
  const meta = joinMeta([item.issuer, item.issueDate])
  return (
    <article className="cv-ats-item">
      <p className="cv-ats-item-title">
        <strong>{item.name}</strong>
      </p>
      {meta !== undefined && <p className="cv-ats-item-meta">{meta}</p>}
      {item.url !== undefined && (
        <p className="cv-ats-item-meta">
          <SafeLink url={item.url}>{item.url}</SafeLink>
        </p>
      )}
    </article>
  )
}
