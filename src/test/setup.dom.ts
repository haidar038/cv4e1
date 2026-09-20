import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { installCanvasDouble, resetCanvasContexts } from './canvas-double'

// fake-indexeddb must be installed BEFORE any module that resolves the Dexie
// dependency chain — setup files run before the test module's imports, which
// is exactly the ordering Dexie needs in the jsdom environment.
//
// jsdom has no canvas implementation, so the deterministic 2D double is
// installed here (see canvas-double.ts for why) instead of letting axe-core and
// the photo pipeline hit jsdom's "not implemented" path.
installCanvasDouble()

afterEach(() => {
  cleanup()
  resetCanvasContexts()
})
