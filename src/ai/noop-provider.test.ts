import { describe, expect, it } from 'vitest'
import { AIProviderError } from './errors'
import { NoopProvider } from './noop-provider'
import type { AIProvider, BulletGenerationInput } from './types'

const bulletInput: BulletGenerationInput = {
  rawTask: 'Membantu menyusun laporan penjualan mingguan.',
  section: 'experience',
  locale: 'id',
  allowedFacts: 'Membantu menyusun laporan penjualan mingguan.',
}

describe('NoopProvider', () => {
  it('satisfies the AIProvider contract', () => {
    const provider: AIProvider = new NoopProvider()
    expect(provider.id).toBe('noop')
    expect(provider.requiresNetwork).toBe(false)
  })

  it('is never available', async () => {
    await expect(new NoopProvider().isAvailable()).resolves.toBe(false)
  })

  it('rejects every capability with provider-unavailable', async () => {
    const provider = new NoopProvider()
    await expect(provider.generateBullets(bulletInput)).rejects.toMatchObject({
      name: 'AIProviderError',
      code: 'provider-unavailable',
    })
    await expect(
      provider.polishText({ text: 'Contoh kalimat.', mode: 'id' }),
    ).rejects.toBeInstanceOf(AIProviderError)
    await expect(
      provider.tailorToJob({
        jobDescription: 'Contoh lowongan.',
        section: 'experience',
        locale: 'id',
        allowedFacts: 'Contoh fakta.',
      }),
    ).rejects.toMatchObject({ code: 'provider-unavailable' })
  })
})
