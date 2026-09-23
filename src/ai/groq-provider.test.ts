import { describe, expect, it } from 'vitest'
import { AIProviderError } from './errors'
import { GROQ_BASE_URL, GROQ_DEFAULT_MODEL, GroqProvider } from './groq-provider'
import type { FetchImpl } from './http'
import type { BulletGenerationInput } from './types'

const SYSTEM_PROMPT = 'Return suggestions as JSON.'
const GROUNDED = 'Membantu menyusun laporan penjualan mingguan.'

const input: BulletGenerationInput = {
  rawTask: GROUNDED,
  section: 'experience',
  locale: 'id',
  allowedFacts: GROUNDED,
}

function suggestionEnvelope(text: string): string {
  return JSON.stringify({
    suggestions: [
      { text, actionVerb: 'Menyusun', usesPlaceholder: true, rationale: GROUNDED, warnings: [] },
    ],
  })
}

function chatResponder(content: string, status = 200): FetchImpl {
  return async () =>
    new Response(JSON.stringify({ choices: [{ message: { role: 'assistant', content } }] }), {
      status,
    })
}

interface SeenCall {
  url: string
  init: RequestInit
}

function recordingResponder(content: string, seen: SeenCall[]): FetchImpl {
  return async (url, init) => {
    seen.push({ url, init })
    return new Response(
      JSON.stringify({ choices: [{ message: { role: 'assistant', content } }] }),
      { status: 200 },
    )
  }
}

function catchError(promise: Promise<unknown>): Promise<AIProviderError> {
  return promise.then(
    () => {
      throw new Error('expected AIProviderError')
    },
    (error: unknown) => {
      if (error instanceof AIProviderError) return error
      throw new Error(`expected AIProviderError, got ${String(error)}`)
    },
  )
}

describe('GroqProvider', () => {
  it('identifies as the networked groq provider with the approved default model', () => {
    expect(GROQ_BASE_URL).toBe('https://api.groq.com/openai/v1')
    expect(GROQ_DEFAULT_MODEL).toBe('openai/gpt-oss-120b')
    const provider = new GroqProvider({ apiKey: 'k', systemPrompt: SYSTEM_PROMPT })
    expect(provider.id).toBe('groq')
    expect(provider.requiresNetwork).toBe(true)
  })

  it('reports availability from key presence without touching the network', async () => {
    let calls = 0
    const counting: FetchImpl = async () => {
      calls += 1
      return new Response('{}')
    }
    await expect(
      new GroqProvider({
        apiKey: 'gsk-test',
        systemPrompt: SYSTEM_PROMPT,
        fetchImpl: counting,
      }).isAvailable(),
    ).resolves.toBe(true)
    await expect(
      new GroqProvider({
        apiKey: '  ',
        systemPrompt: SYSTEM_PROMPT,
        fetchImpl: counting,
      }).isAvailable(),
    ).resolves.toBe(false)
    expect(calls).toBe(0)
  })

  it('posts to the Groq endpoint with Bearer auth and returns validated suggestions', async () => {
    const seen: SeenCall[] = []
    const provider = new GroqProvider({
      apiKey: 'gsk-test-key',
      systemPrompt: SYSTEM_PROMPT,
      fetchImpl: recordingResponder(
        suggestionEnvelope(`${GROUNDED} [dampak yang dapat diukur].`),
        seen,
      ),
    })
    const suggestions = await provider.generateBullets(input)
    expect(suggestions).toHaveLength(1)
    expect(seen).toHaveLength(1)
    expect(seen[0]?.url).toBe('https://api.groq.com/openai/v1/chat/completions')
    const headers = seen[0]?.init.headers as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer gsk-test-key')
    const body = JSON.parse(String(seen[0]?.init.body)) as {
      model: string
      response_format: { type: string }
      temperature: number
      messages: Array<{ role: string; content: string }>
    }
    expect(body.model).toBe('openai/gpt-oss-120b')
    expect(body.response_format).toEqual({ type: 'json_object' })
    expect(body.temperature).toBe(0.2)
    expect(body.messages).toHaveLength(2)
    const userPayload = JSON.parse(body.messages[1]?.content ?? '{}') as Record<string, unknown>
    expect(Object.keys(userPayload).sort()).toEqual([
      'allowedFacts',
      'locale',
      'rawTask',
      'section',
    ])
  })

  it('honours a configured model override', async () => {
    const seen: SeenCall[] = []
    const provider = new GroqProvider({
      apiKey: 'k',
      model: 'custom-model',
      systemPrompt: SYSTEM_PROMPT,
      fetchImpl: recordingResponder(suggestionEnvelope(GROUNDED), seen),
    })
    await provider.generateBullets(input)
    const body = JSON.parse(String(seen[0]?.init.body)) as { model: string }
    expect(body.model).toBe('custom-model')
  })

  it('never reaches the network with an empty key (FR-402 gate order)', async () => {
    const seen: SeenCall[] = []
    const provider = new GroqProvider({
      apiKey: '',
      systemPrompt: SYSTEM_PROMPT,
      fetchImpl: recordingResponder(suggestionEnvelope(GROUNDED), seen),
    })
    const error = await catchError(provider.generateBullets(input))
    expect(error.code).toBe('provider-unavailable')
    expect(seen).toHaveLength(0)
  })

  it('surfaces provider failures through the taxonomy', async () => {
    const auth = new GroqProvider({
      apiKey: 'bad',
      systemPrompt: SYSTEM_PROMPT,
      fetchImpl: chatResponder('{}', 401),
    })
    await expect(catchError(auth.generateBullets(input))).resolves.toMatchObject({
      code: 'auth-failed',
    })

    const limited = new GroqProvider({
      apiKey: 'k',
      systemPrompt: SYSTEM_PROMPT,
      fetchImpl: chatResponder('{}', 429),
    })
    await expect(catchError(limited.generateBullets(input))).resolves.toMatchObject({
      code: 'rate-limited',
    })

    const liar = new GroqProvider({
      apiKey: 'k',
      systemPrompt: SYSTEM_PROMPT,
      fetchImpl: chatResponder(suggestionEnvelope('Meningkatkan efisiensi sebesar 30%.')),
    })
    const grounding = await catchError(liar.generateBullets(input))
    expect(grounding.code).toBe('grounding-violation')
    expect(grounding.details.length).toBeGreaterThan(0)
  })

  it('defers tailoring to Fase 3', async () => {
    const provider = new GroqProvider({ apiKey: 'k', systemPrompt: SYSTEM_PROMPT })
    await expect(
      catchError(
        provider.tailorToJob({
          jobDescription: 'x',
          section: 'experience',
          locale: 'id',
          allowedFacts: 'x',
        }),
      ),
    ).resolves.toMatchObject({ code: 'capability-not-implemented' })
  })
})
