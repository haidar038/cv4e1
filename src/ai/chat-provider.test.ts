import { describe, expect, it } from 'vitest'
import { AIProviderError } from './errors'
import { buildBulletPayload, buildPolishPayload, extractAssistantContent } from './chat-provider'

describe('buildBulletPayload (DF-6 minimization)', () => {
  it('sends exactly the declared fields — never a spread of the input', () => {
    const payload = buildBulletPayload({
      rawTask: 'Membantu menyusun laporan.',
      section: 'experience',
      locale: 'id',
      allowedFacts: 'Membantu menyusun laporan.',
    })
    expect(Object.keys(payload).sort()).toEqual(['allowedFacts', 'locale', 'rawTask', 'section'])
  })

  it('includes targetRole only when provided', () => {
    const without = buildBulletPayload({
      rawTask: 'x',
      section: 'projects',
      locale: 'id',
      allowedFacts: 'x',
    })
    expect('targetRole' in without).toBe(false)
    const withRole = buildBulletPayload({
      rawTask: 'x',
      section: 'projects',
      targetRole: 'Asisten',
      locale: 'id',
      allowedFacts: 'x',
    })
    expect(withRole['targetRole']).toBe('Asisten')
  })

  it('limits polish to the selected text and mode', () => {
    expect(Object.keys(buildPolishPayload({ text: 'Contoh.', mode: 'id' })).sort()).toEqual([
      'mode',
      'text',
    ])
  })
})

describe('extractAssistantContent', () => {
  it('returns the assistant text of a valid response', () => {
    expect(
      extractAssistantContent({ choices: [{ message: { role: 'assistant', content: 'hi' } }] }),
    ).toBe('hi')
  })

  it('rejects missing choices, missing messages, and empty content', () => {
    for (const response of [
      {},
      { choices: [] },
      { choices: [{}] },
      { choices: [{ message: {} }] },
    ]) {
      expect(() => extractAssistantContent(response)).toThrow(AIProviderError)
    }
    try {
      extractAssistantContent({ choices: [{ message: { content: '  ' } }] })
      expect.unreachable('empty content must be rejected')
    } catch (error) {
      expect(error).toBeInstanceOf(AIProviderError)
      if (error instanceof AIProviderError) expect(error.code).toBe('malformed-output')
    }
  })
})
