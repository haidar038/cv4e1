import { beforeEach, describe, expect, it } from 'vitest'
import { consentStore, needsConsent } from './consent-store'

beforeEach(() => {
  consentStore.setState({ grants: {} })
})

describe('consent-store (FR-402: per-session grants)', () => {
  it('asks first: absence of a grant always means consent is needed', () => {
    expect(needsConsent('groq')).toBe(true)
    expect(needsConsent('openai-compatible')).toBe(true)
  })

  it('a grant lasts for the session until revoked', () => {
    consentStore.getState().grant('groq')
    expect(needsConsent('groq')).toBe(false)
    expect(needsConsent('openai-compatible')).toBe(true)
    consentStore.getState().revoke('groq')
    expect(needsConsent('groq')).toBe(true)
  })

  it('revoking an ungranted provider is a no-op', () => {
    consentStore.getState().revoke('groq')
    expect(needsConsent('groq')).toBe(true)
  })
})
