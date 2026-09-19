import { describe, it, expect } from 'vitest'
import { exportResume, importResume } from './export-import'
import { validateResumeDocument } from '../core/schema'
import type { ValidatedResumeDocument } from '../core/schema'
import fullDocRaw from '../../fixtures/full-document.json'
import emptyDocRaw from '../../fixtures/empty-document.json'
import { ImportError } from './export-import-types'

function getValidated(raw: unknown): ValidatedResumeDocument {
  const result = validateResumeDocument(raw)
  if (!result.success) throw new Error('Fixture invalid')
  return result.data
}

describe('Export & Import', () => {
  describe('Round-Trip Integrity', () => {
    it('should preserve data through export -> import cycle (full doc)', () => {
      const original = getValidated(fullDocRaw)
      const jsonStr = exportResume(original)
      const restored = importResume(jsonStr)

      // Deep equality check excluding volatile fields like exportedAt which aren't in the doc itself
      expect(restored).toEqual(original)
    })

    it('should preserve data through export -> import cycle (empty doc)', () => {
      const original = getValidated(emptyDocRaw)
      const jsonStr = exportResume(original)
      const restored = importResume(jsonStr)

      expect(restored).toEqual(original)
    })
  })

  describe('Error Handling', () => {
    it('should reject non-JSON input', () => {
      expect(() => importResume('{invalid')).toThrow(ImportError)
      try {
        importResume('{invalid')
      } catch (e) {
        expect((e as ImportError).reason).toBe('NOT_JSON')
      }
    })

    it('should reject wrong format ID', () => {
      const badEnvelope = JSON.stringify({ format: 'other-app', kind: 'resume', data: {} })
      expect(() => importResume(badEnvelope)).toThrow(/Bukan file cv4every1/)
      try {
        importResume(badEnvelope)
      } catch (e) {
        expect((e as ImportError).reason).toBe('WRONG_FORMAT_ID')
      }
    })

    it('should reject unsupported kind', () => {
      const badKind = JSON.stringify({ format: 'cv4every1', kind: 'unknown-type', data: {} })
      expect(() => importResume(badKind)).toThrow(/Jenis ekspor tidak didukung/)
      try {
        importResume(badKind)
      } catch (e) {
        expect((e as ImportError).reason).toBe('UNSUPPORTED_KIND')
      }
    })

    it('should reject missing data field', () => {
      const noData = JSON.stringify({ format: 'cv4every1', kind: 'resume' })
      expect(() => importResume(noData)).toThrow(/Field "data" hilang/)
      try {
        importResume(noData)
      } catch (e) {
        expect((e as ImportError).reason).toBe('INVALID_ENVELOPE_STRUCTURE')
      }
    })

    it('should reject schema version newer than app', () => {
      const futureDoc = { ...getValidated(emptyDocRaw), schemaVersion: '99.0.0' }
      const envelope = JSON.stringify({
        format: 'cv4every1',
        kind: 'resume',
        formatVersion: '1.0.0',
        exportedAt: new Date().toISOString(),
        data: futureDoc,
      })

      expect(() => importResume(envelope)).toThrow(/lebih baru daripada aplikasi/)
      try {
        importResume(envelope)
      } catch (e) {
        expect((e as ImportError).reason).toBe('SCHEMA_TOO_NEW')
      }
    })

    it('should fail validation for corrupted current-version data', () => {
      // Create a valid-looking envelope but with structurally invalid inner data for v1.0.0
      // e.g., basics.name is required by Zod but we remove it after validating initially?
      // Actually simpler: pass an object that fails Zod directly inside a valid envelope structure.

      const badInnerData = { schemaVersion: '1.0.0', /* missing basics */ sections: {} }
      const envelope = JSON.stringify({
        format: 'cv4every1',
        kind: 'resume',
        formatVersion: '1.0.0',
        exportedAt: new Date().toISOString(),
        data: badInnerData,
      })

      expect(() => importResume(envelope)).toThrow(/gagal lolos validasi/)
      try {
        importResume(envelope)
      } catch (e) {
        expect((e as ImportError).reason).toBe('VALIDATION_FAILED')
      }
    })
  })
})
