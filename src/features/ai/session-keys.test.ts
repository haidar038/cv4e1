import { beforeEach, describe, expect, it } from 'vitest'
import { exportResume } from '../../storage/export-import'
import type { ValidatedResumeDocument } from '../../core/schema'
import {
  clearSessionCredentials,
  getSessionCredentials,
  hasSessionCredentials,
  setSessionCredentials,
} from './session-keys'

beforeEach(() => {
  clearSessionCredentials()
})

describe('session-keys vault', () => {
  it('stores and returns credentials per provider', () => {
    expect(hasSessionCredentials('groq')).toBe(false)
    expect(getSessionCredentials('groq')).toBeNull()
    setSessionCredentials('groq', { apiKey: 'gsk-test' })
    expect(hasSessionCredentials('groq')).toBe(true)
    expect(getSessionCredentials('groq')).toEqual({ apiKey: 'gsk-test' })
  })

  it('keeps providers isolated', () => {
    setSessionCredentials('groq', { apiKey: 'gsk-test' })
    expect(hasSessionCredentials('openai-compatible')).toBe(false)
    setSessionCredentials('openai-compatible', {
      apiKey: 'custom',
      model: 'm',
      baseUrl: 'https://llm.example.com',
    })
    expect(getSessionCredentials('openai-compatible')).toEqual({
      apiKey: 'custom',
      model: 'm',
      baseUrl: 'https://llm.example.com',
    })
    expect(getSessionCredentials('groq')).toEqual({ apiKey: 'gsk-test' })
  })

  it('treats blank keys as absent and returns copies', () => {
    setSessionCredentials('groq', { apiKey: '   ' })
    expect(hasSessionCredentials('groq')).toBe(false)
    setSessionCredentials('groq', { apiKey: 'gsk-test' })
    const copy = getSessionCredentials('groq')
    expect(copy).not.toBeNull()
    expect(copy).toEqual({ apiKey: 'gsk-test' })
  })

  it('forgets selectively or entirely', () => {
    setSessionCredentials('groq', { apiKey: 'a' })
    setSessionCredentials('openai-compatible', { apiKey: 'b' })
    clearSessionCredentials('groq')
    expect(hasSessionCredentials('groq')).toBe(false)
    expect(hasSessionCredentials('openai-compatible')).toBe(true)
    clearSessionCredentials()
    expect(hasSessionCredentials('openai-compatible')).toBe(false)
  })

  it('exposes no persistence surface', async () => {
    const api = Object.keys(await import('./session-keys'))
    expect(api.sort()).toEqual([
      'clearSessionCredentials',
      'getSessionCredentials',
      'hasSessionCredentials',
      'setSessionCredentials',
    ])
  })
})

describe('session keys never enter the export envelope (FR-110)', () => {
  const document: ValidatedResumeDocument = {
    schemaVersion: '1.0.0',
    basics: { name: '' },
    sections: {},
    meta: { locale: 'id', mode: 'ats' },
  }

  it('an active session key is absent from resume and backup exports', () => {
    setSessionCredentials('groq', { apiKey: 'gsk-live-secret-value' })
    setSessionCredentials('openai-compatible', {
      apiKey: 'custom-live-secret',
      model: 'm',
      baseUrl: 'https://llm.example.com',
    })
    for (const kind of ['resume', 'backup'] as const) {
      const envelope = exportResume(document, kind)
      expect(envelope).not.toContain('gsk-live-secret-value')
      expect(envelope).not.toContain('custom-live-secret')
      expect(envelope).not.toContain('llm.example.com')
    }
  })
})
