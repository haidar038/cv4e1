import { describe, expect, it } from 'vitest'
import { AIProviderError } from './errors'
import type { FetchImpl } from './http'
import { normalizeProviderBaseUrl, OpenAICompatibleProvider } from './openai-compatible-provider'

describe('normalizeProviderBaseUrl', () => {
  it('accepts https and strips trailing slashes', () => {
    expect(normalizeProviderBaseUrl('https://llm.example.com/v1/')).toEqual({
      ok: true,
      url: 'https://llm.example.com/v1',
    })
    expect(normalizeProviderBaseUrl('  https://llm.example.com  ')).toEqual({
      ok: true,
      url: 'https://llm.example.com',
    })
  })

  it('allows plain http only for loopback (local model servers)', () => {
    expect(normalizeProviderBaseUrl('http://localhost:11434').ok).toBe(true)
    expect(normalizeProviderBaseUrl('http://127.0.0.1:11434').ok).toBe(true)
    expect(normalizeProviderBaseUrl('http://192.168.1.10:11434')).toEqual({
      ok: false,
      reason: 'insecure-protocol',
    })
    expect(normalizeProviderBaseUrl('http://example.com')).toEqual({
      ok: false,
      reason: 'insecure-protocol',
    })
  })

  it('rejects empty, unparsable, and non-http(s) input', () => {
    expect(normalizeProviderBaseUrl('   ')).toEqual({ ok: false, reason: 'empty' })
    expect(normalizeProviderBaseUrl('not a url')).toEqual({ ok: false, reason: 'invalid-url' })
    expect(normalizeProviderBaseUrl('ftp://files.example.com')).toEqual({
      ok: false,
      reason: 'insecure-protocol',
    })
  })
})

describe('OpenAICompatibleProvider', () => {
  it('posts to the configured endpoint with the configured model', async () => {
    const seen: string[] = []
    const fetchImpl: FetchImpl = async (url, init) => {
      seen.push(url)
      const headers = init.headers as Record<string, string>
      expect(headers['Authorization']).toBe('Bearer custom-key')
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                role: 'assistant',
                content: JSON.stringify({ text: 'Konfigurasi ok.', changes: [], warnings: [] }),
              },
            },
          ],
        }),
        { status: 200 },
      )
    }
    const provider = new OpenAICompatibleProvider({
      baseUrl: 'https://llm.example.com/v1/',
      apiKey: 'custom-key',
      model: 'local-model',
      systemPrompt: 'Return JSON.',
      fetchImpl,
    })
    expect(provider.id).toBe('openai-compatible')
    // Polish path exercises the same transport with a different payload.
    const result = await provider.polishText({ text: 'Konfigurasi ok.', mode: 'id' })
    expect(result.text).toBe('Konfigurasi ok.')
    expect(seen).toEqual(['https://llm.example.com/v1/chat/completions'])
  })

  it('rejects an invalid endpoint at construction', () => {
    expect(
      () =>
        new OpenAICompatibleProvider({
          baseUrl: 'ftp://files.example.com',
          apiKey: 'k',
          model: 'm',
          systemPrompt: 'Return JSON.',
        }),
    ).toThrow(AIProviderError)
  })
})
