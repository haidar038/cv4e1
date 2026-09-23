import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { openTestDocument, resetFormStores, runAxe, teardownFormStores } from '../form/test-utils'
import { updateBasics, addSectionItem } from '../store/actions'
import { clearPolishState, resolvePolishRequest, startPolishRequest } from '../store/ai-store'
import { documentStore } from '../store/document-store'
import { PolishSuggestionsPanel } from './PolishSuggestionsPanel'
import type { PolishTarget } from './PolishSuggestionsPanel'
import { clearSessionCredentials, setSessionCredentials } from './session-keys'
import { consentStore } from './consent-store'

const RAW_TEXT = 'membantu menyusun laporan untuk 30 peserta'
const BULLET_TARGET: PolishTarget = {
  kind: 'bullet',
  section: 'experience',
  itemIndex: 0,
  position: 1,
}

function groundedAiContent(): string {
  return JSON.stringify({
    text: 'Membantu menyusun laporan untuk 30 peserta.',
    changes: ['Memperbaiki kapitalisasi awal kalimat.'],
    warnings: [],
  })
}

/** Stubs the network with a grounded polish response and captures the payload. */
function stubGroundedFetch(): { bodies: string[] } {
  const bodies: string[] = []
  vi.stubGlobal('fetch', (...args: unknown[]) => {
    const init = args[1] as { body?: unknown } | undefined
    if (typeof init?.body === 'string') bodies.push(init.body)
    return Promise.resolve(
      new Response(JSON.stringify({ choices: [{ message: { content: groundedAiContent() } }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  })
  return { bodies }
}

function renderPanel(overrides?: {
  target?: PolishTarget
  label?: string
  text?: string
  onApply?: (text: string) => void
  onRequestClose?: () => void
}) {
  const onApply = overrides?.onApply ?? vi.fn()
  const onRequestClose = overrides?.onRequestClose ?? vi.fn()
  render(
    <PolishSuggestionsPanel
      target={overrides?.target ?? BULLET_TARGET}
      label={overrides?.label ?? 'Poin pencapaian 1'}
      text={overrides?.text ?? RAW_TEXT}
      onApply={onApply}
      onRequestClose={onRequestClose}
    />,
  )
  return { onApply, onRequestClose }
}

beforeEach(async () => {
  await resetFormStores()
  openTestDocument()
  // The panel reads the target's live text from the DocumentStore at event
  // time (Task 18 stale-closure class) — props alone are not enough.
  addSectionItem('experience', {
    organization: 'Organisasi Contoh',
    current: false,
    highlights: [RAW_TEXT],
  })
  clearSessionCredentials()
  consentStore.setState({ grants: {} })
  clearPolishState()
})

afterEach(async () => {
  await teardownFormStores()
  vi.unstubAllGlobals()
  clearSessionCredentials()
  consentStore.setState({ grants: {} })
  clearPolishState()
})

describe('PolishSuggestionsPanel (Task 20, FR-401/AC-401-a/b)', () => {
  it('AC-401-a: static guidance shows a checklist, no Apply, document untouched', async () => {
    const user = userEvent.setup()
    renderPanel()
    const before = JSON.stringify(documentStore.getState().document)

    await user.click(screen.getByRole('button', { name: 'Minta polesan' }))
    await screen.findByText('Belum ada kunci — menampilkan panduan manual yang tetap bisa dipakai.')

    // Static fallback never rewrites: checklist guidance only, no Apply.
    expect(
      screen.getByText('Pertahankan semua angka, nama, dan tanggal persis seperti semula.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Terapkan Poin pencapaian 1' })).toBeNull()
    expect(JSON.stringify(documentStore.getState().document)).toBe(before)
  })

  it('AC-401-b: AI candidate Applies exactly the approved text and closes', async () => {
    stubGroundedFetch()
    setSessionCredentials('groq', { apiKey: 'gsk-test' })
    consentStore.getState().grant('groq')
    const user = userEvent.setup()
    const onApply = vi.fn()
    const onRequestClose = vi.fn()
    renderPanel({ onApply, onRequestClose })

    await user.click(screen.getByRole('button', { name: 'Minta polesan' }))
    const apply = await screen.findByRole('button', { name: 'Terapkan Poin pencapaian 1' })

    // Candidates on screen, the document untouched.
    expect(screen.getByText('Membantu menyusun laporan untuk 30 peserta.')).toBeInTheDocument()
    expect(screen.getByText('Memperbaiki kapitalisasi awal kalimat.')).toBeInTheDocument()
    const before = JSON.stringify(documentStore.getState().document)

    await user.click(apply)
    expect(onApply).toHaveBeenCalledTimes(1)
    expect(onApply).toHaveBeenCalledWith('Membantu menyusun laporan untuk 30 peserta.')
    expect(onRequestClose).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(documentStore.getState().document)).toBe(before)
  })

  it('routes the selected mode into the request payload', async () => {
    const { bodies } = stubGroundedFetch()
    setSessionCredentials('groq', { apiKey: 'gsk-test' })
    consentStore.getState().grant('groq')
    const user = userEvent.setup()
    renderPanel()

    await user.click(screen.getByRole('radio', { name: 'Terjemahkan ke Inggris' }))
    await user.click(screen.getByRole('button', { name: 'Minta polesan' }))
    await screen.findByRole('button', { name: 'Terapkan Poin pencapaian 1' })

    expect(bodies.length).toBeGreaterThan(0)
    const payload = JSON.parse(bodies[0] ?? '{}') as {
      messages?: Array<{ role?: string; content?: string }>
    }
    expect(payload.messages?.[0]?.content).toContain('Polish (EN)')
    const userPayload = JSON.parse(payload.messages?.[1]?.content ?? '{}') as { mode?: string }
    expect(userPayload.mode).toBe('translate-en')
  })

  it('serves the summary field through the same panel', async () => {
    updateBasics({ summary: RAW_TEXT })
    const user = userEvent.setup()
    renderPanel({ target: { kind: 'summary' }, label: 'Ringkasan' })

    await user.click(screen.getByRole('button', { name: 'Minta polesan' }))
    await screen.findByText('Belum ada kunci — menampilkan panduan manual yang tetap bisa dipakai.')
    expect(
      screen.getByText('Pertahankan semua angka, nama, dan tanggal persis seperti semula.'),
    ).toBeInTheDocument()
  })

  it('FR-408: persistent 429 retries the bounded attempts, then names the quota (Task 21)', async () => {
    let calls = 0
    // Retry-After: 0 keeps the bounded backoff instant in jsdom.
    vi.stubGlobal('fetch', async () => {
      calls += 1
      return new Response('{}', { status: 429, headers: { 'Retry-After': '0' } })
    })
    setSessionCredentials('groq', { apiKey: 'gsk-test' })
    consentStore.getState().grant('groq')
    const user = userEvent.setup()
    renderPanel()
    const before = JSON.stringify(documentStore.getState().document)

    await user.click(screen.getByRole('button', { name: 'Minta polesan' }))
    await screen.findByText(
      'Batas pemakaian AI tercapai — menampilkan panduan manual. Draft Anda tidak berubah; coba lagi nanti.',
    )
    // Bounded retry through the real stack: 1 initial + 2 retries, then static.
    expect(calls).toBe(3)
    expect(
      screen.getByText('Pertahankan semua angka, nama, dan tanggal persis seperti semula.'),
    ).toBeInTheDocument()
    expect(JSON.stringify(documentStore.getState().document)).toBe(before)
  })

  it('FR-408: a timeout names the wait instead of the generic error (Task 21)', async () => {
    renderPanel()
    const scope = { target: 'bullet:experience:0:1', text: RAW_TEXT }
    startPolishRequest(scope)
    resolvePolishRequest(
      {
        suggestion: { text: RAW_TEXT, changes: [], warnings: [] },
        source: 'static',
        errorCode: 'timeout',
      },
      scope,
    )
    await screen.findByText(
      'AI tidak menjawab tepat waktu — menampilkan panduan manual. Draft Anda tidak berubah.',
    )
  })

  it('disables generation for empty input and explains why', async () => {
    updateBasics({ summary: undefined })
    renderPanel({ target: { kind: 'summary' }, label: 'Ringkasan', text: '   ' })
    expect(screen.getByRole('button', { name: 'Minta polesan' })).toBeDisabled()
    expect(
      screen.getByText('Tulis dulu teks pada field ini, lalu panduan akan muncul di sini.'),
    ).toBeInTheDocument()
  })

  it('Escape requests close without applying anything', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    const onRequestClose = vi.fn()
    renderPanel({ onApply, onRequestClose })

    await user.click(screen.getByRole('button', { name: 'Minta polesan' }))
    await screen.findByText('Belum ada kunci — menampilkan panduan manual yang tetap bisa dipakai.')
    await user.keyboard('{Escape}')

    expect(onRequestClose).toHaveBeenCalledTimes(1)
    expect(onApply).not.toHaveBeenCalled()
  })

  it('passes an axe audit with the AI candidate on screen', async () => {
    stubGroundedFetch()
    setSessionCredentials('groq', { apiKey: 'gsk-test' })
    consentStore.getState().grant('groq')
    const user = userEvent.setup()
    const { container } = render(
      <main>
        <PolishSuggestionsPanel
          target={BULLET_TARGET}
          label="Poin pencapaian 1"
          text={RAW_TEXT}
          onApply={() => {}}
          onRequestClose={() => {}}
        />
      </main>,
    )
    await user.click(screen.getByRole('button', { name: 'Minta polesan' }))
    await screen.findByRole('button', { name: 'Terapkan Poin pencapaian 1' })
    await runAxe(container)
  })
})
