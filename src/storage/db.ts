import Dexie, { type Table } from 'dexie'
import type { DraftRecord, AssetRecord } from './types'

/**
 * cv4every1 IndexedDB Database Schema (Version 1)
 *
 * Design Decisions Applied:
 * - D10: Database name is "cv4every1".
 * - D11: Object stores are "drafts", "assets", and "meta".
 */
export class Cv4Every1Database extends Dexie {
  drafts!: Table<DraftRecord, string>
  assets!: Table<AssetRecord, string>
  meta!: Table<{ key: string; value: unknown }, string>

  constructor() {
    super('cv4every1')

    this.version(1).stores({
      // KeyPath: id (UUIDv7 or randomUUID)
      // Indexes: updatedAt (for sorting), title (derived for quick lookup if needed, though primarily we sort by date)
      drafts: 'id, updatedAt',

      // KeyPath: ref (matches basics.photo.assetRef)
      assets: 'ref',

      // Singleton store for app-level metadata/preferences that might need persistence beyond localStorage
      // Though per spec, UI prefs go to localStorage. This is reserved for future use or complex state sync.
      meta: 'key',
    })
  }
}

// Singleton instance for the application
export const db = new Cv4Every1Database()
