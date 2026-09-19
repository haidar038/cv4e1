/**
 * Migration Framework for ResumeDocument.
 *
 * Migrations are deterministic, pure functions that transform a document
 * from one schema version to the next. They must never drop user data.
 * See docs/04-data/migration-policy.md.
 */

import { SCHEMA_VERSION } from './schema-parts'

// --- Types ---

export type SchemaVersion = string

export interface MigrationStep {
  from: SchemaVersion
  to: SchemaVersion
  migrate: (doc: Record<string, unknown>) => Record<string, unknown>
}

type MigrationRegistry = Map<SchemaVersion, MigrationStep[]>

// --- Registry ---

const registry: MigrationRegistry = new Map()

/**
 * Registers a migration step. Called at module load time or via init.
 */
export function registerMigration(step: MigrationStep): void {
  const existing = registry.get(step.from) || []
  existing.push(step)
  // Sort by target version ascending to ensure correct chaining order
  existing.sort((a, b) => compareVersions(a.to, b.to))
  registry.set(step.from, existing)
}

/**
 * Clears all registered migrations. Used exclusively in tests.
 */
export function clearMigrations(): void {
  registry.clear()
}

// --- Version Comparison Helper ---

function parseVersion(v: string): number[] {
  return v.split('.').map(Number)
}

function compareVersions(a: string, b: string): number {
  const pa = parseVersion(a)
  const pb = parseVersion(b)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] ?? 0
    const nb = pb[i] ?? 0
    if (na > nb) return 1
    if (na < nb) return -1
  }
  return 0
}

// --- Core Migration Logic ---

/**
 * Migrates a raw document object from its current schemaVersion up to CURRENT_SCHEMA_VERSION.
 * Throws an error if no path exists or if a migration step fails.
 * Does NOT validate the final result — caller should do that.
 */
export function migrateDocument(rawDoc: Record<string, unknown>): Record<string, unknown> {
  let doc = { ...rawDoc }
  let currentVersion = String(doc.schemaVersion ?? '0.0.0')

  if (compareVersions(currentVersion, SCHEMA_VERSION) === 0) {
    return doc // Already up to date
  }

  if (compareVersions(currentVersion, SCHEMA_VERSION) > 0) {
    throw new Error(
      `Cannot downgrade: document version ${currentVersion} is newer than app version ${SCHEMA_VERSION}.`,
    )
  }

  // Find chain of migrations
  const visited = new Set<string>()

  while (compareVersions(currentVersion, SCHEMA_VERSION) < 0) {
    if (visited.has(currentVersion)) {
      throw new Error(`Circular migration detected at version ${currentVersion}`)
    }
    visited.add(currentVersion)

    const steps = registry.get(currentVersion)
    if (!steps || steps.length === 0) {
      throw new Error(
        `No migration path from ${currentVersion} to ${SCHEMA_VERSION}. ` +
          `Missing registration for version "${currentVersion}".`,
      )
    }

    // Take the first available step forward (sorted ascending)
    const step = steps[0]
    // Explicit guard: `noUncheckedIndexedAccess` cannot infer non-emptiness from the check above.
    if (step === undefined) {
      throw new Error(
        `No migration path from ${currentVersion} to ${SCHEMA_VERSION}. ` +
          `Missing registration for version "${currentVersion}".`,
      )
    }

    try {
      doc = step.migrate(doc)
    } catch (err) {
      throw new Error(
        `Migration failed at step ${step.from} → ${step.to}: ${(err as Error).message}`,
        { cause: err },
      )
    }

    // Ensure the migrated doc reports its new version
    doc.schemaVersion = step.to
    currentVersion = step.to
  }

  return doc
}
