import { basicsSchema, gpaSchema, linkSchema, partialDateSchema } from '../../core/schema-parts'

export type ConstrainedFieldKind = 'email' | 'url' | 'partialDate' | 'gpaValue' | 'gpaScale'

/**
 * Field-level validation reuses the canonical Zod sub-schemas — there is no
 * second validator (architecture rule in plans/cv4every1-fase-1-mvp.md). Empty
 * input is always valid: clearing a field is a legitimate state, and
 * required-ness is enforced at export/print time, not while typing.
 */
export function fieldIsValid(kind: ConstrainedFieldKind, value: string): boolean {
  if (value === '') return true
  switch (kind) {
    case 'email':
      return basicsSchema.shape.email.safeParse(value).success
    case 'url':
      return linkSchema.shape.url.safeParse(value).success
    case 'partialDate':
      return partialDateSchema.safeParse(value).success
    case 'gpaValue':
      return gpaSchema.shape.value.safeParse(value).success
    case 'gpaScale':
      return gpaSchema.shape.scale.safeParse(value).success
  }
}
