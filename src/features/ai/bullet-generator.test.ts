import { afterEach, describe, expect, it } from 'vitest'
import {
  AIProviderError,
  buildBulletPayload,
  type AIProvider,
  type BulletGenerationInput,
  type BulletSuggestion,
  type FetchImpl,
  type JobTailoringInput,
  type PolishInput,
  type RetryPolicy,
} from '../../ai'
import {
  buildBulletInput,
  requestBulletSuggestions,
  selectBulletProviderId,
  type BulletRequest,
} from './bullet-generator'
import { consentStore } from './consent-store'
import { clearSessionCredentials, setSessionCredentials } from './session-keys'

const request: BulletRequest = {
  rawTask: 'membantu menyusun laporan penjualan mingguan untuk 30 peserta',
  section: 'experience',
  locale: 'id',
}

function chatResponse(content: string): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** Hard-coded provider double — the contract path, no network involved. */
function fakeProvider(
  behavior: (input: BulletGenerationInput) => Promise<readonly BulletSuggestion[]>,
): AIProvider {
  return {
    id: 'fake',
    requiresNetwork: true,
    isAvailable: () => Promise.resolve(true),
    generateBullets: (input) => behavior(input),
    polishText: (_input: PolishInput) =>
      Promise.reject(new AIProviderError('capability-not-implemented')),
    tailorToJob: (_input: JobTailoringInput) =>
      Promise.reject(new AIProviderError('capability-not-implemented')),
  }
}

function groundedAiEnvelope(): string {
  return JSON.stringify({
    suggestions: [
      {
        text: 'Menyusun laporan penjualan mingguan untuk 30 peserta.',
        actionVerb: 'Menyusun',
        usesPlaceholder: false,
        rationale: 'Membantu menyusun laporan penjualan mingguan untuk 30 peserta.',
        warnings: [],
      },
    ],
  })
}

/** Grounded candidate reused by the retry-path tests (numbers come from the input). */
function groundedSuggestion(): BulletSuggestion {
  return {
    text: 'Menyusun laporan penjualan mingguan untuk 30 peserta.',
    actionVerb: 'Menyusun',
    usesPlaceholder: false,
    rationale: 'Membantu menyusun laporan penjualan mingguan untuk 30 peserta.',
    warnings: [],
  }
}

/** Retry seam: backoff costs nothing and is deterministic in tests. */
const noWait: RetryPolicy = { sleep: async () => {}, random: () => 0 }

afterEach(() => {
  clearSessionCredentials()
  consentStore.setState({ grants: {} })
})

describe('buildBulletInput (DF-6 minimisation)', () => {
  it('sends exactly the allowlisted fields — never a spread of the document', () => {
    const payload = buildBulletPayload(buildBulletInput(request))
    expect(Object.keys(payload).sort()).toEqual(
      ['allowedFacts', 'locale', 'rawTask', 'section'].sort(),
    )
    expect(payload['rawTask']).toBe(request.rawTask)
    expect(payload['section']).toBe('experience')
  })

  it('adds targetRole explicitly and admits it as grounding', () => {
    const payload = buildBulletPayload(
      buildBulletInput({ ...request, targetRole: 'Staff Administrasi' }),
    )
    expect(payload['targetRole']).toBe('Staff Administrasi')
    expect(String(payload['allowedFacts'])).toContain('Staff Administrasi')
  })

  it('truncates pasted pages to the prompt budget', () => {
    const payload = buildBulletPayload(buildBulletInput({ ...request, rawTask: 'a'.repeat(2500) }))
    expect(String(payload['rawTask']).length).toBeLessThan(2500)
    expect(String(payload['rawTask'])).toContain('[dipotong]')
  })
})

describe('selectBulletProviderId', () => {
  it('is null without credentials and prefers Groq on ties', () => {
    expect(selectBulletProviderId()).toBeNull()
    setSessionCredentials('openai-compatible', {
      apiKey: 'oai-key',
      model: 'm',
      baseUrl: 'https://example.com',
    })
    expect(selectBulletProviderId()).toBe('openai-compatible')
    setSessionCredentials('groq', { apiKey: 'gsk-test' })
    expect(selectBulletProviderId()).toBe('groq')
  })
})

describe('requestBulletSuggestions', () => {
  it('resolves the mocked-provider contract without touching the network', async () => {
    let calls = 0
    const provider = fakeProvider(() => {
      calls += 1
      return Promise.resolve([
        {
          text: 'Menyusun laporan penjualan mingguan untuk 30 peserta.',
          actionVerb: 'Menyusun',
          usesPlaceholder: false,
          rationale: 'Membantu menyusun laporan penjualan mingguan untuk 30 peserta.',
          warnings: [],
        },
      ])
    })
    const result = await requestBulletSuggestions(request, { provider })
    expect(calls).toBe(1)
    expect(result.source).toBe('ai')
    expect(result.errorCode).toBeNull()
    expect(result.suggestions).toHaveLength(1)
  })

  it('falls back to static on malformed output (FR-404)', async () => {
    const provider = fakeProvider(() => Promise.reject(new AIProviderError('malformed-output')))
    const result = await requestBulletSuggestions(request, { provider })
    expect(result.source).toBe('static')
    expect(result.errorCode).toBe('malformed-output')
    expect(result.suggestions.length).toBeGreaterThan(0)
    for (const suggestion of result.suggestions) {
      expect(suggestion.text).toContain(request.rawTask)
    }
  })

  it('retries a transient timeout with backoff, then falls back to static (FR-406)', async () => {
    let calls = 0
    const sleeps: number[] = []
    const provider = fakeProvider(() => {
      calls += 1
      return Promise.reject(new AIProviderError('timeout'))
    })
    const result = await requestBulletSuggestions(request, {
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
    expect(result.suggestions.length).toBeGreaterThan(0)
  })

  it('recovers when a retry succeeds — the AI candidate is used, not static', async () => {
    let calls = 0
    const provider = fakeProvider(() => {
      calls += 1
      return calls === 1
        ? Promise.reject(new AIProviderError('network-error'))
        : Promise.resolve([groundedSuggestion()])
    })
    const result = await requestBulletSuggestions(request, { provider, retry: noWait })
    expect(calls).toBe(2)
    expect(result.source).toBe('ai')
    expect(result.errorCode).toBeNull()
    expect(result.suggestions).toHaveLength(1)
  })

  it('never retries rejected candidates — grounding failure costs one request (FR-405)', async () => {
    let calls = 0
    const provider = fakeProvider(() => {
      calls += 1
      return Promise.reject(new AIProviderError('grounding-violation'))
    })
    const result = await requestBulletSuggestions(request, { provider, retry: noWait })
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
        : Promise.resolve([groundedSuggestion()])
    })
    const result = await requestBulletSuggestions(request, {
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
    const result = await requestBulletSuggestions(request, {
      provider,
      retry: { ...noWait, shouldStop: () => true },
    })
    expect(calls).toBe(1)
    expect(result.source).toBe('static')
    expect(result.errorCode).toBe('offline')
  })

  it('rejects invented numbers and entities through the real transport (FR-405)', async () => {
    setSessionCredentials('groq', { apiKey: 'gsk-test-key' })
    consentStore.getState().grant('groq')
    let calls = 0
    const fetchImpl: FetchImpl = () => {
      calls += 1
      return Promise.resolve(
        chatResponse(
          JSON.stringify({
            suggestions: [
              {
                text: 'Meningkatkan penjualan sebesar 50% di PT Maju Jaya.',
                actionVerb: 'Meningkatkan',
                usesPlaceholder: false,
                rationale: 'Membantu menyusun laporan penjualan mingguan.',
                warnings: [],
              },
            ],
          }),
        ),
      )
    }
    const result = await requestBulletSuggestions(request, { fetchImpl })
    expect(calls).toBe(1)
    expect(result.source).toBe('static')
    expect(result.errorCode).toBe('grounding-violation')
    for (const suggestion of result.suggestions) {
      expect(suggestion.text).not.toContain('50')
      expect(suggestion.text).not.toContain('Maju Jaya')
    }
  })

  it('accepts grounded numbers through the real transport', async () => {
    setSessionCredentials('groq', { apiKey: 'gsk-test-key' })
    consentStore.getState().grant('groq')
    const fetchImpl: FetchImpl = () => Promise.resolve(chatResponse(groundedAiEnvelope()))
    const result = await requestBulletSuggestions(request, { fetchImpl })
    expect(result.source).toBe('ai')
    expect(result.errorCode).toBeNull()
    const [first] = result.suggestions
    expect(first?.text).toContain('30')
  })

  it('sends nothing without a session grant — consent-declined falls back (FR-402)', async () => {
    setSessionCredentials('groq', { apiKey: 'gsk-test-key' })
    let calls = 0
    const fetchImpl: FetchImpl = () => {
      calls += 1
      return Promise.resolve(chatResponse(groundedAiEnvelope()))
    }
    const result = await requestBulletSuggestions(request, { fetchImpl })
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
    const result = await requestBulletSuggestions(request, { fetchImpl })
    expect(calls).toBe(0)
    expect(result.source).toBe('static')
    expect(result.errorCode).toBe('provider-unavailable')
    expect(result.suggestions.length).toBeGreaterThan(0)
  })

  it('returns empty static output for empty input without any request', async () => {
    const provider = fakeProvider(() => {
      throw new Error('must not be called')
    })
    const result = await requestBulletSuggestions({ ...request, rawTask: '   ' }, { provider })
    expect(result.suggestions).toEqual([])
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
      const result = await requestBulletSuggestions(request, { fetchImpl })
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
    const result = await requestBulletSuggestions(request, { provider })
    expect(result.source).toBe('static')
    expect(result.errorCode).toBe('network-error')
  })
})

describe('static fallback grounding (FR-405)', () => {
  it('invents no digits beyond the input', async () => {
    const result = await requestBulletSuggestions(request)
    const inputDigits = new Set(request.rawTask.match(/\d+/g) ?? [])
    for (const suggestion of result.suggestions) {
      for (const digit of suggestion.text.match(/\d+/g) ?? []) {
        expect(inputDigits.has(digit)).toBe(true)
      }
    }
  })
})
