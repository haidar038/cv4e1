import { describe, expect, it } from 'vitest'
import { AIProviderError } from './errors'
import { AI_REQUEST_TIMEOUT_MS, postJson } from './http'
import type { FetchImpl } from './http'

function jsonResponder(status: number, body: unknown): FetchImpl {
  return async () => new Response(JSON.stringify(body), { status })
}

async function catchCode(promise: Promise<unknown>): Promise<string> {
  try {
    await promise
  } catch (error) {
    if (error instanceof AIProviderError) return error.code
    throw new Error(`expected AIProviderError, got ${String(error)}`)
  }
  throw new Error('expected AIProviderError, nothing was thrown')
}

describe('postJson', () => {
  it('posts JSON with merged headers and returns the parsed body', async () => {
    const seen: Array<{ url: string; init: RequestInit }> = []
    const fetchImpl: FetchImpl = async (url, init) => {
      seen.push({ url, init })
      return new Response('{"ok":true}', { status: 200 })
    }
    const result = await postJson('https://example.test/v1/chat', {
      headers: { Authorization: 'Bearer test-key' },
      body: { model: 'm' },
      fetchImpl,
    })
    expect(result).toEqual({ ok: true })
    expect(seen).toHaveLength(1)
    expect(seen[0]?.url).toBe('https://example.test/v1/chat')
    expect(seen[0]?.init.method).toBe('POST')
    expect(seen[0]?.init.body).toBe('{"model":"m"}')
    const headers = seen[0]?.init.headers as Record<string, string>
    expect(headers['Content-Type']).toBe('application/json')
    expect(headers['Authorization']).toBe('Bearer test-key')
  })

  it('maps HTTP statuses to the error taxonomy', async () => {
    await expect(
      catchCode(
        postJson('https://x.test', {
          body: {},
          fetchImpl: jsonResponder(401, {}),
        }),
      ),
    ).resolves.toBe('auth-failed')
    await expect(
      catchCode(
        postJson('https://x.test', {
          body: {},
          fetchImpl: jsonResponder(403, {}),
        }),
      ),
    ).resolves.toBe('auth-failed')
    await expect(
      catchCode(
        postJson('https://x.test', {
          body: {},
          fetchImpl: jsonResponder(429, {}),
        }),
      ),
    ).resolves.toBe('rate-limited')
    await expect(
      catchCode(
        postJson('https://x.test', {
          body: {},
          fetchImpl: jsonResponder(500, {}),
        }),
      ),
    ).resolves.toBe('network-error')
    await expect(
      catchCode(
        postJson('https://x.test', {
          body: {},
          fetchImpl: jsonResponder(400, {}),
        }),
      ),
    ).resolves.toBe('network-error')
  })

  it('maps transport failures and aborts', async () => {
    const failing: FetchImpl = async () => {
      throw new TypeError('fetch failed')
    }
    await expect(
      catchCode(postJson('https://x.test', { body: {}, fetchImpl: failing })),
    ).resolves.toBe('network-error')

    const hanging: FetchImpl = (_url, init) =>
      new Promise<never>((_, reject) => {
        init.signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'))
        })
      })
    await expect(
      catchCode(postJson('https://x.test', { body: {}, fetchImpl: hanging, timeoutMs: 10 })),
    ).resolves.toBe('timeout')
  })

  it('rejects empty and non-JSON 200 bodies', async () => {
    await expect(
      catchCode(
        postJson('https://x.test', {
          body: {},
          fetchImpl: async () => new Response('', { status: 200 }),
        }),
      ),
    ).resolves.toBe('malformed-output')
    await expect(
      catchCode(
        postJson('https://x.test', {
          body: {},
          fetchImpl: async () => new Response('not json', { status: 200 }),
        }),
      ),
    ).resolves.toBe('malformed-output')
  })

  it('exposes the maintainer-approved default timeout', () => {
    expect(AI_REQUEST_TIMEOUT_MS).toBe(30_000)
  })

  it('carries a parseable Retry-After hint on 429 for the retry policy', async () => {
    const hinted: FetchImpl = async () =>
      new Response('{}', { status: 429, headers: { 'Retry-After': '2' } })
    try {
      await postJson('https://x.test', { body: {}, fetchImpl: hinted })
      throw new Error('expected AIProviderError, nothing was thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(AIProviderError)
      const providerError = error as AIProviderError
      expect(providerError.code).toBe('rate-limited')
      expect(providerError.retryAfterMs).toBe(2000)
    }
  })

  it('leaves the hint empty when 429 carries no usable Retry-After', async () => {
    for (const headers of [{}, { 'Retry-After': 'soon' }, { 'Retry-After': '-5' }]) {
      const bare: FetchImpl = async () => new Response('{}', { status: 429, headers })
      try {
        await postJson('https://x.test', { body: {}, fetchImpl: bare })
        throw new Error('expected AIProviderError, nothing was thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(AIProviderError)
        const providerError = error as AIProviderError
        expect(providerError.code).toBe('rate-limited')
        expect(providerError.retryAfterMs).toBeUndefined()
      }
    }
  })
})
