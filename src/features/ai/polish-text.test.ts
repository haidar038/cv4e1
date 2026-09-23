import { afterEach, describe, expect, it } from 'vitest'
import {
  AIProviderError,
  buildPolishPayload,
  type AIProvider,
  type BulletGenerationInput,
  type BulletSuggestion,
  type FetchImpl,
  type JobTailoringInput,
  type PolishInput,
  type PolishSuggestion,
  type RetryPolicy,
} from '../../ai'
import { consentStore } from './consent-store'
import {
  buildPolishInput,
  requestPolishSuggestion,
  selectPolishProviderId,
  type PolishRequest,
} from './polish-text'
import { clearSessionCredentials, setSessionCredentials } from './session-keys'

const request: PolishRequest = {
  text: 'membantu menyusun laporan penjualan mingguan untuk 30 peserta',
  mode: 'id',
}

function chatResponse(content: string): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** Hard-coded provider double — the contract path, no network involved. */
function fakeProvider(behavior: (input: PolishInput) => Promise<PolishSuggestion>): AIProvider {
  return {
    id: 'fake',
    requiresNetwork: true,
    isAvailable: () => Promise.resolve(true),
    generateBullets: (_input: BulletGenerationInput) =>
      Promise.resolve([] as readonly BulletSuggestion[]),
    polishText: (input) => behavior(input),
    tailorToJob: (_input: JobTailoringInput) =>
      Promise.reject(new AIProviderError('capability-not-implemented')),
  }
}

function groundedAiEnvelope(): string {
  return JSON.stringify({
    text: 'Membantu menyusun laporan penjualan mingguan untuk 30 peserta.',
    changes: ['Memperbaiki kapitalisasi awal kalimat.'],
    warnings: [],
  })
}

/** Grounded candidate reused by the retry-path tests (numbers come from the input). */
function groundedSuggestion(): PolishSuggestion {
  return {
    text: 'Membantu menyusun laporan penjualan mingguan untuk 30 peserta.',
    changes: ['Memperbaiki kapitalisasi awal kalimat.'],
    warnings: [],
  }
}

/** Retry seam: backoff costs nothing and is deterministic in tests. */
const noWait: RetryPolicy = { sleep: async () => {}, random: () => 0 }

afterEach(() => {
  clearSessionCredentials()
  consentStore.setState({ grants: {} })
})

describe('buildPolishInput (DF-6 minimisation)', () => {
  it('sends exactly the allowlisted fields — selected text plus mode', () => {
    const payload = buildPolishPayload(buildPolishInput(request))
    expect(Object.keys(payload).sort()).toEqual(['mode', 'text'].sort())
    expect(payload['text']).toBe(request.text)
    expect(payload['mode']).toBe('id')
  })

  it('routes each mode through the same minimal shape', () => {
    for (const mode of ['id', 'en', 'translate-en'] as const) {
      const payload = buildPolishPayload(buildPolishInput({ ...request, mode }))
      expect(payload['mode']).toBe(mode)
      expect(payload['text']).toBe(request.text)
    }
  })

  it('truncates pasted pages to the prompt budget', () => {
    const payload = buildPolishPayload(buildPolishInput({ ...request, text: 'a'.repeat(2500) }))
    expect(String(payload['text']).length).toBeLessThan(2500)
    expect(String(payload['text'])).toContain('[dipotong]')
  })
})

describe('selectPolishProviderId', () => {
  it('is null without credentials and prefers Groq on ties', () => {
    expect(selectPolishProviderId()).toBeNull()
    setSessionCredentials('openai-compatible', {
      apiKey: 'oai-key',
      model: 'm',
      baseUrl: 'https://example.com',
    })
    expect(selectPolishProviderId()).toBe('openai-compatible')
    setSessionCredentials('groq', { apiKey: 'gsk-test' })
    expect(selectPolishProviderId()).toBe('groq')
  })
})

describe('requestPolishSuggestion', () => {
  it('resolves the mocked-provider contract without touching the network', async () => {
    let calls = 0
    const provider = fakeProvider((input) => {
      calls += 1
      return Promise.resolve({
        text: `${input.text}.`,
        changes: ['Menambahkan tanda baca akhir.'],
        warnings: [],
      })
    })
    const result = await requestPolishSuggestion(request, { provider })
    expect(calls).toBe(1)
    expect(result.source).toBe('ai')
    expect(result.errorCode).toBeNull()
    expect(result.suggestion.text).toContain(request.text)
    expect(result.suggestion.changes.length).toBeGreaterThan(0)
  })

  it('falls back to static guidance on malformed output (FR-404)', async () => {
    const provider = fakeProvider(() => Promise.reject(new AIProviderError('malformed-output')))
    const result = await requestPolishSuggestion(request, { provider })
    expect(result.source).toBe('static')
    expect(result.errorCode).toBe('malformed-output')
    // Static fallback never rewrites: the text is the input verbatim.
    expect(result.suggestion.text).toBe(request.text)
    expect(result.suggestion.changes.length).toBeGreaterThan(0)
  })

  it('retries a transient timeout with backoff, then falls back to static (FR-406)', async () => {
    let calls = 0
    const sleeps: number[] = []
    const provider = fakeProvider(() => {
      calls += 1
      return Promise.reject(new AIProviderError('timeout'))
    })
    const result = await requestPolishSuggestion(request, {
      provider,
      retry: {
        sleep: async (ms: number) => {
          sleeps.push(ms)
        },
        random: () => 0,
      },
    })
    expect(calls).toBe(3)
    expect(sleeps).toEqual([500, 1000])
    expect(result.source).toBe('static')
    expect(result.errorCode).toBe('timeout')
    expect(result.suggestion.text).toBe(request.text)
  })

  it('recovers when a retry succeeds — the AI candidate is used, not static', async () => {
    let calls = 0
    const provider = fakeProvider(() => {
      calls += 1
      return calls === 1
        ? Promise.reject(new AIProviderError('network-error'))
        : Promise.resolve(groundedSuggestion())
    })
    const result = await requestPolishSuggestion(request, { provider, retry: noWait })
    expect(calls).toBe(2)
    expect(result.source).toBe('ai')
    expect(result.errorCode).toBeNull()
    expect(result.suggestion.text).toContain('30')
  })

  it('never retries rejected candidates — grounding failure costs one request (FR-405)', async () => {
    let calls = 0
    const provider = fakeProvider(() => {
      calls += 1
      return Promise.reject(new AIProviderError('grounding-violation'))
    })
    const result = await requestPolishSuggestion(request, { provider, retry: noWait })
    expect(calls).toBe(1)
    expect(result.source).toBe('static')
    expect(result.errorCode).toBe('grounding-violation')
  })

  it('waits out a server Retry-After hint on rate-limited instead of backing off', async () => {
    let calls = 0
    const sleeps: number[] = []
    const provider = fakeProvider(() => {
      calls += 1
      return calls === 1
        ? Promise.reject(new AIProviderError('rate-limited', undefined, [], { retryAfterMs: 250 }))
        : Promise.resolve(groundedSuggestion())
    })
    const result = await requestPolishSuggestion(request, {
      provider,
      retry: {
        sleep: async (ms: number) => {
          sleeps.push(ms)
        },
        random: () => 0,
      },
    })
    expect(calls).toBe(2)
    expect(sleeps).toEqual([250])
    expect(result.source).toBe('ai')
    expect(result.errorCode).toBeNull()
  })

  it('stops retrying when the radio dies mid-retry and reports offline', async () => {
    let calls = 0
    const provider = fakeProvider(() => {
      calls += 1
      return Promise.reject(new AIProviderError('timeout'))
    })
    const result = await requestPolishSuggestion(request, {
      provider,
      retry: { ...noWait, shouldStop: () => true },
    })
    expect(calls).toBe(1)
    expect(result.source).toBe('static')
    expect(result.errorCode).toBe('offline')
  })

  it('rejects added facts through the real transport (FR-405, C2-strict)', async () => {
    setSessionCredentials('groq', { apiKey: 'gsk-test-key' })
    consentStore.getState().grant('groq')
    let calls = 0
    const fetchImpl: FetchImpl = () => {
      calls += 1
      return Promise.resolve(
        chatResponse(
          JSON.stringify({
            text: 'Memimpin 50 panitia acara kampus PT Maju Jaya pada 2024.',
            changes: ['Menambahkan detail.'],
            warnings: [],
          }),
        ),
      )
    }
    const result = await requestPolishSuggestion(
      { text: 'membantu acara kampus', mode: 'id' },
      { fetchImpl },
    )
    expect(calls).toBe(1)
    expect(result.source).toBe('static')
    expect(result.errorCode).toBe('grounding-violation')
    expect(result.suggestion.text).not.toContain('50')
    expect(result.suggestion.text).not.toContain('Maju Jaya')
  })

  it('accepts grounded polish through the real transport', async () => {
    setSessionCredentials('groq', { apiKey: 'gsk-test-key' })
    consentStore.getState().grant('groq')
    const fetchImpl: FetchImpl = () => Promise.resolve(chatResponse(groundedAiEnvelope()))
    const result = await requestPolishSuggestion(request, { fetchImpl })
    expect(result.source).toBe('ai')
    expect(result.errorCode).toBeNull()
    expect(result.suggestion.text).toContain('30')
    expect(result.suggestion.changes.length).toBeGreaterThan(0)
  })

  it('sends nothing without a session grant — consent-declined falls back (FR-402)', async () => {
    setSessionCredentials('groq', { apiKey: 'gsk-test-key' })
    let calls = 0
    const fetchImpl: FetchImpl = () => {
      calls += 1
      return Promise.resolve(chatResponse(groundedAiEnvelope()))
    }
    const result = await requestPolishSuggestion(request, { fetchImpl })
    expect(calls).toBe(0)
    expect(result.source).toBe('static')
    expect(result.errorCode).toBe('consent-declined')
  })

  it('uses static directly without credentials — zero requests (FR-408/AC-403-a)', async () => {
    let calls = 0
    const fetchImpl: FetchImpl = () => {
      calls += 1
      return Promise.resolve(chatResponse(groundedAiEnvelope()))
    }
    const result = await requestPolishSuggestion(request, { fetchImpl })
    expect(calls).toBe(0)
    expect(result.source).toBe('static')
    expect(result.errorCode).toBe('provider-unavailable')
    expect(result.suggestion.changes.length).toBeGreaterThan(0)
  })

  it('returns empty static output for empty input without any request', async () => {
    const provider = fakeProvider(() => {
      throw new Error('must not be called')
    })
    const result = await requestPolishSuggestion({ text: '   ', mode: 'id' }, { provider })
    expect(result.suggestion.text).toBe('')
    expect(result.source).toBe('static')
  })

  it('falls back with offline when the device reports no connection', async () => {
    setSessionCredentials('groq', { apiKey: 'gsk-test-key' })
    consentStore.getState().grant('groq')
    // Node exposes globalThis.navigator as getter-only — redefine, then restore.
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
    Object.defineProperty(globalThis, 'navigator', {
      value: { onLine: false },
      configurable: true,
    })
    try {
      let calls = 0
      const fetchImpl: FetchImpl = () => {
        calls += 1
        return Promise.resolve(chatResponse(groundedAiEnvelope()))
      }
      const result = await requestPolishSuggestion(request, { fetchImpl })
      expect(calls).toBe(0)
      expect(result.source).toBe('static')
      expect(result.errorCode).toBe('offline')
    } finally {
      if (descriptor !== undefined) {
        Object.defineProperty(globalThis, 'navigator', descriptor)
      } else {
        delete (globalThis as { navigator?: unknown }).navigator
      }
    }
  })

  it('treats unexpected failures as network-error fallback, never a throw', async () => {
    const provider = fakeProvider(() => Promise.reject(new Error('boom')))
    const result = await requestPolishSuggestion(request, { provider })
    expect(result.source).toBe('static')
    expect(result.errorCode).toBe('network-error')
  })
})

describe('static fallback grounding (FR-405)', () => {
  it('never rewrites the input — digits beyond the input cannot appear', async () => {
    const result = await requestPolishSuggestion(request)
    const inputDigits = new Set(request.text.match(/\d+/g) ?? [])
    for (const digit of result.suggestion.text.match(/\d+/g) ?? []) {
      expect(inputDigits.has(digit)).toBe(true)
    }
  })
})
