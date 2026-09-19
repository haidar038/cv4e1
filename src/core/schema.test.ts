import { describe, it, expect } from 'vitest'
import { validateResumeDocument, createEmptyResumeDocument } from './schema'
import emptyDoc from '../../fixtures/empty-document.json'
import fullDoc from '../../fixtures/full-document.json'
import unknownFieldsDoc from '../../fixtures/unknown-fields.json'

describe('ResumeDocument Schema Validation', () => {
  describe('Valid Documents', () => {
    it('should accept an empty document with minimal fields', () => {
      const result = validateResumeDocument(emptyDoc)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.schemaVersion).toBe('1.0.0')
        expect(result.data.basics.name).toBe('')
        expect(result.data.sections).toEqual({})
      }
    })

    it('should accept a fully populated document', () => {
      const result = validateResumeDocument(fullDoc)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.meta?.locale).toBe('id')
        expect(result.data.basics.photo?.enabled).toBe(true)
        expect(result.data.sections.education).toHaveLength(1)
        expect(result.data.sectionOrder).toContain('education')
      }
    })

    it('should apply defaults correctly when creating empty doc programmatically', () => {
      const doc = createEmptyResumeDocument()
      expect(doc.schemaVersion).toBe('1.0.0')
      expect(doc.basics.name).toBe('')
      // Meta should have defaults applied by Zod if present in schema definition logic,
      // but our create function parses a raw object. Let's verify structure exists.
      expect(typeof doc.sections).toBe('object')
    })
  })

  describe('Invalid Documents', () => {
    it('should reject missing required field: basics.name', () => {
      const invalid = { ...fullDoc, basics: { ...fullDoc.basics, name: undefined } }
      const result = validateResumeDocument(invalid)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors.some((e) => e.path.includes('name'))).toBe(true)
      }
    })

    it('should reject invalid date format in education.startDate', () => {
      const invalid = JSON.parse(JSON.stringify(fullDoc)) // Deep clone
      invalid.sections.education[0].startDate = 'August 2021'
      const result = validateResumeDocument(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject invalid GPA value pattern', () => {
      const invalid = JSON.parse(JSON.stringify(fullDoc))
      invalid.sections.education[0].gpa.value = 'ABC'
      const result = validateResumeDocument(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject non-object input', () => {
      const result = validateResumeDocument('just a string')
      expect(result.success).toBe(false)
    })
  })

  describe('Design Decision D2: Unknown Fields', () => {
    it('should preserve unknown top-level fields in _unknownFields', () => {
      const result = validateResumeDocument(unknownFieldsDoc)
      expect(result.success).toBe(true)

      if (result.success) {
        // Known fields should be parsed normally
        expect(result.data.schemaVersion).toBe('1.0.0')
        expect(result.data.basics.name).toBe('Uji Field Tak Dikenal')

        // Unknown fields should be captured
        expect(result.data._unknownFields).toBeDefined()
        expect(result.data._unknownFields?._futureFeatureFlag).toBe(true)
        expect(result.data._unknownFields?.customMetadata).toEqual({
          source: 'external-tool',
          id: 'ext-999',
        })
      }
    })

    it('should not add _unknownFields key if no unknowns exist', () => {
      const result = validateResumeDocument(fullDoc)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data._unknownFields).toBeUndefined()
      }
    })
  })
})
