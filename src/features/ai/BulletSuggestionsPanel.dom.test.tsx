import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { openTestDocument, resetFormStores, runAxe, teardownFormStores } from '../form/test-utils'
import { clearBulletState, resolveBulletRequest, startBulletRequest } from '../store/ai-store'
import { addSectionItem } from '../store/actions'
import { documentStore } from '../store/document-store'
import { BulletSuggestionsPanel } from './BulletSuggestionsPanel'
import { clearSessionCredentials, setSessionCredentials } from './session-keys'
import { consentStore } from './consent-store'

const RAW_TASK = 'membantu menyusun laporan untuk 30 peserta'

function renderPanel(overrides?: {
  onApply?: (text: string) => void
  onRequestClose?: () => void
  rawTask?: string
}) {
  const onApply = overrides?.onApply ?? vi.fn()
  const onRequestClose = overrides?.onRequestClose ?? vi.fn()
  render(
    <BulletSuggestionsPanel
      section="experience"
      sectionLabel="Pengalaman"
      rowLabel="Poin pencapaian 1"
      rawTask={overrides?.rawTask ?? RAW_TASK}
      itemIndex={0}
      position={1}
      onApply={onApply}
      onRequestClose={onRequestClose}
    />,
  )
  return { onApply, onRequestClose }
}

beforeEach(async () => {
  await resetFormStores()
  openTestDocument()
  // The panel reads the row's live text from the DocumentStore at event
  // time (Task 18 stale-closure class) — the prop alone is not enough.
  addSectionItem('experience', {
    organization: 'Organisasi Contoh',
    current: false,
    highlights: [RAW_TASK],
  })
  clearSessionCredentials()
  consentStore.setState({ grants: {} })
  clearBulletState()
})

afterEach(async () => {
  await teardownFormStores()
  vi.unstubAllGlobals()
  clearSessionCredentials()
  consentStore.setState({ grants: {} })
  clearBulletState()
})

describe('BulletSuggestionsPanel (Task 19, FR-401/AC-401-a/b)', () => {
  it('AC-401-a: generating shows candidates while the document stays untouched', async () => {
    const user = userEvent.setup()
    renderPanel()
    const before = JSON.stringify(documentStore.getState().document)

    await user.click(screen.getByRole('button', { name: 'Minta saran' }))
    const firstApply = await screen.findByRole('button', { name: 'Terapkan Saran 1' })

    // Static fallback (no key): three verb-led candidates reusing the raw task.
    expect(screen.getAllByRole('button', { name: /Terapkan Saran \d/ })).toHaveLength(3)
    expect(firstApply).toBeInTheDocument()
    expect(
      screen.getByText('Belum ada kunci — menampilkan saran manual yang tetap bisa dipakai.'),
    ).toBeInTheDocument()
    expect(documentStore.getState().document).not.toBeNull()
    expect(JSON.stringify(documentStore.getState().document)).toBe(before)
  })

  it('AC-401-b: Apply passes exactly the approved text and closes', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    const onRequestClose = vi.fn()
    renderPanel({ onApply, onRequestClose })

    await user.click(screen.getByRole('button', { name: 'Minta saran' }))
    const firstApply = await screen.findByRole('button', { name: 'Terapkan Saran 1' })
    const firstText = firstApply.closest('li')?.querySelector('p:nth-of-type(2)')?.textContent ?? ''
    expect(firstText).toContain(RAW_TASK)

    await user.click(firstApply)
    expect(onApply).toHaveBeenCalledTimes(1)
    expect(onApply).toHaveBeenCalledWith(firstText)
    expect(onRequestClose).toHaveBeenCalledTimes(1)
  })

  it('disables generation for empty input and explains why', async () => {
    renderPanel({ rawTask: '   ' })
    expect(screen.getByRole('button', { name: 'Minta saran' })).toBeDisabled()
    expect(
      screen.getByText('Tulis dulu deskripsi tugas mentah Anda, lalu saran akan muncul di sini.'),
    ).toBeInTheDocument()
  })

  it('tells the user the role field is ignored while no AI key is stored (FR-408)', async () => {
    renderPanel()
    expect(
      screen.getByText(
        'Kolom ini baru dipakai setelah Anda menyimpan kunci AI — saran manual di bawah mengabaikannya.',
      ),
    ).toBeInTheDocument()
  })

  it('hides the offline role note once a key is stored', async () => {
    setSessionCredentials('groq', { apiKey: 'gsk-test' })
    renderPanel()
    expect(
      screen.queryByText(
        'Kolom ini baru dipakai setelah Anda menyimpan kunci AI — saran manual di bawah mengabaikannya.',
      ),
    ).toBeNull()
  })

  it('FR-408: persistent 429 retries the bounded attempts, then names the quota (Task 21)', async () => {
    let calls = 0
    // Retry-After: 0 keeps the bounded backoff instant in jsdom.
    vi.stubGlobal('fetch', async () => {
      calls += 1
      return new Response('{}', { status: 429, headers: { 'Retry-After': '0' } })
    })
    setSessionCredentials('groq', { apiKey: 'gsk-test-key' })
    consentStore.getState().grant('groq')
    const user = userEvent.setup()
    renderPanel()
    const before = JSON.stringify(documentStore.getState().document)

    await user.click(screen.getByRole('button', { name: 'Minta saran' }))
    await screen.findByText(
      'Batas pemakaian AI tercapai — menampilkan saran manual. Draft Anda tidak berubah; coba lagi nanti.',
    )
    // Bounded retry through the real stack: 1 initial + 2 retries, then static.
    expect(calls).toBe(3)
    expect(screen.getAllByRole('button', { name: /Terapkan Saran \d/ })).toHaveLength(3)
    expect(JSON.stringify(documentStore.getState().document)).toBe(before)
  })

  it('FR-408: a timeout names the wait instead of the generic error (Task 21)', async () => {
    renderPanel()
    const scope = { section: 'experience', itemIndex: 0, position: 1, rawTask: RAW_TASK } as const
    startBulletRequest(scope)
    resolveBulletRequest({ suggestions: [], source: 'static', errorCode: 'timeout' }, scope)
    await screen.findByText(
      'AI tidak menjawab tepat waktu — menampilkan saran manual. Draft Anda tidak berubah.',
    )
  })

  it('Escape requests close without applying anything', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    const onRequestClose = vi.fn()
    renderPanel({ onApply, onRequestClose })

    await user.click(screen.getByRole('button', { name: 'Minta saran' }))
    await screen.findByRole('button', { name: 'Terapkan Saran 1' })
    await user.keyboard('{Escape}')

    expect(onRequestClose).toHaveBeenCalledTimes(1)
    expect(onApply).not.toHaveBeenCalled()
  })

  it('passes an axe audit with suggestions on screen', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <main>
        <BulletSuggestionsPanel
          section="experience"
          sectionLabel="Pengalaman"
          rowLabel="Poin pencapaian 1"
          rawTask={RAW_TASK}
          itemIndex={0}
          position={1}
          onApply={() => {}}
          onRequestClose={() => {}}
        />
      </main>,
    )
    await user.click(screen.getByRole('button', { name: 'Minta saran' }))
    await screen.findByRole('button', { name: 'Terapkan Saran 1' })
    await runAxe(container)
  })
})
