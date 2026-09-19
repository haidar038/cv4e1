import { describe, it, expect, beforeEach } from 'vitest'
import { registerMigration, clearMigrations, migrateDocument } from './migration'
import { SCHEMA_VERSION } from './schema-parts'

describe('Migration Framework', () => {
  beforeEach(() => {
    clearMigrations()
  })

  it('should return document unchanged if already at current version', () => {
    const doc = { schemaVersion: SCHEMA_VERSION, data: 'test' }
    const result = migrateDocument(doc)
    expect(result).toEqual(doc)
  })

  it('should throw error for future versions (downgrade protection)', () => {
    const futureDoc = { schemaVersion: '99.0.0', data: 'future' }
    expect(() => migrateDocument(futureDoc)).toThrow(/Cannot downgrade/)
  })

  it('should apply a single registered migration step', () => {
    // Simulate upgrading from v0.9.0 to v1.0.0 by adding a field
    registerMigration({
      from: '0.9.0',
      to: '1.0.0',
      migrate: (doc) => ({ ...doc, newField: 'added-by-migration' }),
    })

    const oldDoc = { schemaVersion: '0.9.0', basics: { name: 'Test' } }
    const result = migrateDocument(oldDoc)

    expect(result.schemaVersion).toBe('1.0.0')
    expect(result.newField).toBe('added-by-migration')
    expect(result.basics).toEqual({ name: 'Test' }) // Preserved
  })

  it('should chain multiple migrations correctly', () => {
    // Path: 0.8.0 -> 0.9.0 -> 1.0.0
    registerMigration({
      from: '0.8.0',
      to: '0.9.0',
      migrate: (doc) => ({ ...doc, step1: true }),
    })
    registerMigration({
      from: '0.9.0',
      to: '1.0.0',
      migrate: (doc) => ({ ...doc, step2: true }),
    })

    const veryOldDoc = { schemaVersion: '0.8.0' }
    const result = migrateDocument(veryOldDoc)

    expect(result.schemaVersion).toBe(SCHEMA_VERSION)
    expect(result.step1).toBe(true)
    expect(result.step2).toBe(true)
  })

  it('should fail clearly if no path exists', () => {
    const orphanDoc = { schemaVersion: '0.5.0' }
    expect(() => migrateDocument(orphanDoc)).toThrow(/No migration path/)
  })
})
