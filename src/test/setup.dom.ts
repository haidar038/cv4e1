import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// fake-indexeddb must be installed BEFORE any module that resolves the Dexie
// dependency chain — setup files run before the test module's imports, which
// is exactly the ordering Dexie needs in the jsdom environment.
afterEach(() => {
  cleanup()
})
