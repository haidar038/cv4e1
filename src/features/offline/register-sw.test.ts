import { describe, expect, it } from 'vitest'
import { shouldRegisterServiceWorker } from './register-sw'

describe('shouldRegisterServiceWorker (file:// fallback)', () => {
  it('registers on http(s) origins only', () => {
    expect(shouldRegisterServiceWorker('http:')).toBe(true)
    expect(shouldRegisterServiceWorker('https:')).toBe(true)
  })

  it('never registers off http(s) — the app runs without a worker there', () => {
    expect(shouldRegisterServiceWorker('file:')).toBe(false)
    expect(shouldRegisterServiceWorker('data:')).toBe(false)
    expect(shouldRegisterServiceWorker('')).toBe(false)
  })
})
