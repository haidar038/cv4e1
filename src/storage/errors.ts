/**
 * Custom error classes for storage operations.
 */

export class StorageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StorageError'
  }
}

export class StorageFullError extends StorageError {
  constructor() {
    super('Penyimpanan penuh. Ekspor manual disarankan.')
    this.name = 'StorageFullError'
  }
}

export class StorageBlockedError extends StorageError {
  constructor() {
    super('Mode Privat terdeteksi. Perubahan tidak akan tersimpan permanen.')
    this.name = 'StorageBlockedError'
  }
}

export class InvalidDataError extends StorageError {
  constructor(details?: string) {
    super(`Data tidak valid untuk disimpan.${details ? ` Detail: ${details}` : ''}`)
    this.name = 'InvalidDataError'
  }
}
