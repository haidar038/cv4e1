import { describe, expect, expectTypeOf, it } from 'vitest'
import type { SectionKey } from '../../core/view-models'
import { getVerbsForSection, type CatalogSectionKey } from '../../content/action-verbs/index'
import { microcopyId, microcopyStructural } from '../../content/microcopy/id'
import type { EducationItem } from '../../core/schema'

/**
 * Task 13a deferred the union-consistency check to the features layer: the
 * content module mirrors core unions locally (content/ imports nothing), so
 * the identity is only enforceable here where both sides are importable.
 */
describe('content/core union consistency', () => {
  it('CatalogSectionKey accepts every SectionKey value and vice versa', () => {
    expectTypeOf<CatalogSectionKey>().toEqualTypeOf<SectionKey>()
  })

  it('every section accepted by the store has a verbs lookup (no runtime gap)', () => {
    const allSectionKeys: SectionKey[] = [
      'education',
      'experience',
      'organizations',
      'projects',
      'skills',
      'certifications',
    ]
    for (const key of allSectionKeys) {
      expect(() => getVerbsForSection(key)).not.toThrow()
    }
  })

  it('education status keys mirror the schema enum — the status picker stays exhaustive', () => {
    const schemaStatuses: Array<NonNullable<EducationItem['status']>> = [
      'graduated',
      'awaiting-ceremony',
      'in-progress',
      'discontinued',
    ]
    expect(
      schemaStatuses.every((status) => microcopyId.educationStatus[status] !== undefined),
    ).toBe(true)
  })

  it('the structural pack (FR-204) blanks every domain guidance string but keeps labels', () => {
    expect(microcopyStructural.gpa.hint).toBe('')
    expect(microcopyStructural.contact.phoneHint).toBe('')
    expect(microcopyStructural.photo.atsHiddenNotice).toBe('')
    expect(microcopyStructural.organizations.guidance).toBe('')
    expect(microcopyStructural.cvLength.softWarning).toBe('')
    expect(microcopyStructural.educationStatus.graduated.example).toBe('')
    expect(microcopyStructural.sections.basics).toBe(microcopyId.sections.basics)
    expect(microcopyStructural.fields.name.label).toBe(microcopyId.fields.name.label)
  })
})
