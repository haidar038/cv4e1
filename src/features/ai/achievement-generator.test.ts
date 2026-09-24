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
import { ACHIEVEMENT_MAX_INPUT_CHARS, ACHIEVEMENT_MAX_SUGGESTIONS } from './achievement-prompts'
import {
  buildAchievementInput,
  requestAchievementBullets,
  selectAchievementProviderId,
  type AchievementRequest,
} from './achievement-generator'
import { consentStore } from './consent-store'
import { clearSessionCredentials, setSessionCredentials } from './session-keys'

const request: AchievementRequest = {
  description: 'membuat PRD, SRS, dan dokumen pengujian untuk aplikasi rindang bersama 2 teman',
  section: 'projects',
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

function groundedSuggestion(text: string): BulletSuggestion {
  return {
    text,
    actionVerb: 'Menyusun',
    usesPlaceholder: false,
    rationale: 'Merumuskan dokumentasi dari deskripsi magang.',
    warnings: [],
  }
}

/** Retry seam: backoff costs nothing and is deterministic in tests. */
const noWait: RetryPolicy = { sleep: async () => {}, random: () => 0 }

afterEach(() => {
  clearSessionCredentials()
  consentStore.setState({ grants: {} })
})

describe('buildAchievementInput (DF-6 minimisation)', () => {
  it('sends exactly the allowlisted fields — never a spread of the document', () => {
    const payload = buildBulletPayload(buildAchievementInput(request))
    expect(Object.keys(payload).sort()).toEqual(
      ['allowedFacts', 'locale', 'rawTask', 'section'].sort(),
    )
    expect(payload['rawTask']).toBe(request.description)
    expect(payload['section']).toBe('projects')
    expect(payload['allowedFacts']).toBe(request.description)
  })

  it('truncates pasted pages to the prompt budget', () => {
    const payload = buildBulletPayload(
      buildAchievementInput({ ...request, description: 'a'.repeat(2500) }),
    )
    expect(String(payload['rawTask']).length).toBeLessThan(2500)
    expect(String(payload['rawTask'])).toContain('[dipotong]')
    expect(ACHIEVEMENT_MAX_INPUT_CHARS).toBe(2000)
  })
})

describe('selectAchievementProviderId', () => {
  it('is null without credentials and prefers Groq on ties', () => {
    expect(selectAchievementProviderId()).toBeNull()
    setSessionCredentials('openai-compatible', {
      apiKey: 'oai-key',
      model: 'm',
      baseUrl: 'https://example.com',
    })
    expect(selectAchievementProviderId()).toBe('openai-compatible')
    setSessionCredentials('groq', { apiKey: 'gsk-test' })
    expect(selectAchievementProviderId()).toBe('groq')
  })
})

describe('requestAchievementBullets', () => {
  it('resolves the mocked-provider contract without touching the network', async () => {
    let calls = 0
    const provider = fakeProvider(() => {
      calls += 1
      return Promise.resolve([
        groundedSuggestion('Menyusun PRD, SRS, dan dokumen pengujian untuk 2 teman.'),
      ])
    })
    const result = await requestAchievementBullets(request, { provider })
    expect(calls).toBe(1)
    expect(result.source).toBe('ai')
    expect(result.errorCode).toBeNull()
    expect(result.suggestions).toHaveLength(1)
  })

  it('caps the candidate list at 3 even when the provider returns more', async () => {
    const provider = fakeProvider(() =>
      Promise.resolve([
        groundedSuggestion('Satu.'),
        groundedSuggestion('Dua.'),
        groundedSuggestion('Tiga.'),
        groundedSuggestion('Empat.'),
        groundedSuggestion('Lima.'),
      ]),
    )
    const result = await requestAchievementBullets(request, { provider })
    expect(result.source).toBe('ai')
    expect(result.suggestions).toHaveLength(ACHIEVEMENT_MAX_SUGGESTIONS)
    expect(ACHIEVEMENT_MAX_SUGGESTIONS).toBe(3)
  })

  it('falls back to static on malformed output (FR-404)', async () => {
    const provider = fakeProvider(() => Promise.reject(new AIProviderError('malformed-output')))
    const result = await requestAchievementBullets(request, { provider, retry: noWait })
    expect(result.source).toBe('static')
    expect(result.errorCode).toBe('malformed-output')
    expect(result.suggestions.length).toBeGreaterThan(0)
  })

  it('retries a transient timeout with backoff, then falls back to static (FR-406)', async () => {
    let calls = 0
    const sleeps: number[] = []
    const provider = fakeProvider(() => {
      calls += 1
      return Promise.reject(new AIProviderError('timeout'))
    })
    const result = await requestAchievementBullets(request, {
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
  })

  it('never retries rejected candidates — grounding failure costs one request (FR-405)', async () => {
    let calls = 0
    const provider = fakeProvider(() => {
      calls += 1
      return Promise.reject(new AIProviderError('grounding-violation'))
    })
    const result = await requestAchievementBullets(request, { provider, retry: noWait })
    expect(calls).toBe(1)
    expect(result.source).toBe('static')
    expect(result.errorCode).toBe('grounding-violation')
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
                rationale: 'Membantu acara kampus.',
                warnings: [],
              },
            ],
          }),
        ),
      )
    }
    const result = await requestAchievementBullets(request, { fetchImpl })
    expect(calls).toBe(1)
    expect(result.source).toBe('static')
    expect(result.errorCode).toBe('grounding-violation')
  })

  it('sends nothing without a session grant — consent-declined falls back (FR-402)', async () => {
    setSessionCredentials('groq', { apiKey: 'gsk-test-key' })
    let calls = 0
    const fetchImpl: FetchImpl = () => {
      calls += 1
      return Promise.resolve(chatResponse('{}'))
    }
    const result = await requestAchievementBullets(request, { fetchImpl })
    expect(calls).toBe(0)
    expect(result.source).toBe('static')
    expect(result.errorCode).toBe('consent-declined')
  })

  it('uses static directly without credentials — zero requests (FR-408/AC-403-a)', async () => {
    let calls = 0
    const fetchImpl: FetchImpl = () => {
      calls += 1
      return Promise.resolve(chatResponse('{}'))
    }
    const result = await requestAchievementBullets(request, { fetchImpl })
    expect(calls).toBe(0)
    expect(result.source).toBe('static')
    expect(result.errorCode).toBe('provider-unavailable')
    expect(result.suggestions.length).toBeGreaterThan(0)
  })

  it('returns empty static output for empty input without any request', async () => {
    const provider = fakeProvider(() => {
      throw new Error('must not be called')
    })
    const result = await requestAchievementBullets({ ...request, description: '   ' }, { provider })
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
        return Promise.resolve(chatResponse('{}'))
      }
      const result = await requestAchievementBullets(request, { fetchImpl })
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
    const result = await requestAchievementBullets(request, { provider })
    expect(result.source).toBe('static')
    expect(result.errorCode).toBe('network-error')
  })
})

describe('static fallback grounding (FR-405)', () => {
  it('invents no digits beyond the input', async () => {
    const result = await requestAchievementBullets(request)
    const inputDigits = new Set(request.description.match(/\d+/g) ?? [])
    for (const suggestion of result.suggestions) {
      for (const digit of suggestion.text.match(/\d+/g) ?? []) {
        expect(inputDigits.has(digit)).toBe(true)
      }
    }
  })
})
