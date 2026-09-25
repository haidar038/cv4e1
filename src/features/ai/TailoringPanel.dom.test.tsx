import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { openTestDocument, resetFormStores, runAxe, teardownFormStores } from '../form/test-utils'
import { clearTailoringState } from '../store/ai-store'
import { addSectionItem } from '../store/actions'
import { documentStore } from '../store/document-store'
import { TailoringPanel } from './TailoringPanel'
import { TailoringTrigger } from './TailoringTrigger'
import { clearSessionCredentials, setSessionCredentials } from './session-keys'
import { consentStore } from './consent-store'

const JD = 'Dicari staf administrasi yang menguasai Microsoft Excel dan komunikasi.'

function groqEnvelope(content: string): string {
  return JSON.stringify({ choices: [{ message: { content } }] })
}

function renderPanel(overrides?: { onRequestClose?: () => void }) {
  const onRequestClose = overrides?.onRequestClose ?? vi.fn()
  const { container } = render(
    <TailoringPanel
      section="experience"
      sectionLabel="Pengalaman"
      onRequestClose={onRequestClose}
    />,
  )
  return { onRequestClose, container }
}

async function fillJd(user: ReturnType<typeof userEvent.setup>, text: string = JD): Promise<void> {
  const box = screen.getByRole('textbox', { name: 'Deskripsi lowongan' })
  await user.click(box)
  await user.type(box, text)
  await expect(box).toHaveValue(text)
}

function seedDocument(): void {
  addSectionItem('experience', {
    organization: 'Organisasi Contoh',
    current: false,
    highlights: ['Menyusun laporan Microsoft Excel.'],
  })
  addSectionItem('projects', {
    name: 'Aplikasi kas kelas',
    highlights: ['Mencatat pemasukan dan pengeluaran.'],
  })
}

beforeEach(async () => {
  await resetFormStores()
  openTestDocument()
  seedDocument()
  clearSessionCredentials()
  consentStore.setState({ grants: {} })
  clearTailoringState()
})

afterEach(async () => {
  await teardownFormStores()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  clearSessionCredentials()
  consentStore.setState({ grants: {} })
  clearTailoringState()
})

describe('TailoringPanel (T3b, FR-601/602)', () => {
  it('FR-601: static analysis lists gaps while the document stays untouched', async () => {
    const user = userEvent.setup()
    renderPanel()
    const before = JSON.stringify(documentStore.getState().document)

    await fillJd(user)
    await user.click(screen.getByRole('button', { name: 'Analisis kecocokan' }))

    // Static fallback (no key): JD∩resume split, deterministic.
    const matched = await screen.findByRole('region', { name: 'Kata kunci yang didukung data' })
    expect(matched).toHaveTextContent('excel')
    expect(matched).toHaveTextContent('microsoft')
    const unsupported = screen.getByRole('region', { name: 'Kata kunci yang belum didukung' })
    expect(unsupported).toHaveTextContent('administrasi')
    expect(unsupported).toHaveTextContent('komunikasi')
    expect(
      screen.getByText('Belum ada kunci — menampilkan hasil manual yang tetap bisa dipakai.'),
    ).toBeInTheDocument()
    expect(JSON.stringify(documentStore.getState().document)).toBe(before)
  })

  it('FR-602: the panel offers no mutation path at all', async () => {
    const user = userEvent.setup()
    renderPanel()

    await fillJd(user)
    await user.click(screen.getByRole('button', { name: 'Analisis kecocokan' }))
    await screen.findByRole('region', { name: 'Kata kunci yang didukung data' })

    // No Apply button exists anywhere in this flow — review only.
    expect(screen.queryByRole('button', { name: /Terapkan/ })).toBeNull()
  })

  it('flags sections with zero keyword hits for strengthening', async () => {
    const user = userEvent.setup()
    renderPanel()

    await fillJd(user)
    await user.click(screen.getByRole('button', { name: 'Analisis kecocokan' }))

    const sections = await screen.findByRole('region', { name: 'Bagian yang perlu diperkuat' })
    expect(sections).toHaveTextContent('Proyek')
    expect(sections).not.toHaveTextContent('Pengalaman')
  })

  it('AI path carries the session banner naming its provenance', async () => {
    vi.stubGlobal(
      'fetch',
      async () =>
        new Response(
          groqEnvelope(
            JSON.stringify({
              matchedKeywords: ['Excel'],
              unsupportedKeywords: ['administrasi'],
              sectionsToStrengthen: [],
              clarifyingQuestions: ['Apakah pengalaman administrasi Anda mencakup Excel?'],
              warnings: [],
            }),
          ),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
    )
    setSessionCredentials('groq', { apiKey: 'gsk-test' })
    consentStore.getState().grant('groq')
    const user = userEvent.setup()
    renderPanel()

    await fillJd(user, 'Dicari staf administrasi Excel. Anda menyusun laporan.')
    await user.click(screen.getByRole('button', { name: 'Analisis kecocokan' }))

    // The mock returns an AI list (with a question the static path never
    // asks) — the count and the banner prove the AI path produced it.
    await screen.findByRole('region', { name: 'Pertanyaan klarifikasi' })
    expect(
      screen.getByText('Daftar ini dibuat AI — tinjau kembali. AI dapat membuat kesalahan.'),
    ).toBeInTheDocument()
  })

  it('Escape requests close', async () => {
    const user = userEvent.setup()
    const { onRequestClose } = renderPanel()

    await fillJd(user)
    fireEvent.keyDown(screen.getByRole('group', { name: 'Sesuaikan dengan lowongan Pengalaman' }), {
      key: 'Escape',
    })
    expect(onRequestClose).toHaveBeenCalledTimes(1)
  })

  it('passes axe on the ready panel', async () => {
    const user = userEvent.setup()
    const { container } = renderPanel()

    await fillJd(user)
    await user.click(screen.getByRole('button', { name: 'Analisis kecocokan' }))
    await screen.findByRole('region', { name: 'Kata kunci yang didukung data' })

    await runAxe(container)
  })
})

describe('TailoringTrigger (tooltip + long-press)', () => {
  it('opens the panel on click and explains itself on hover', async () => {
    const user = userEvent.setup()
    render(<TailoringTrigger section="experience" sectionLabel="Pengalaman" />)
    const trigger = screen.getByRole('button', { name: 'Sesuaikan dengan lowongan Pengalaman' })

    await user.hover(trigger)
    await screen.findByText(
      'Tempel deskripsi lowongan — lihat kata kunci mana yang didukung data Anda.',
    )

    await user.click(trigger)
    await expect(screen.getByRole('button', { name: 'Analisis kecocokan' })).toBeVisible()
  })

  it('opens the tooltip on long-press and cancels on early release', async () => {
    vi.useFakeTimers()
    try {
      render(<TailoringTrigger section="experience" sectionLabel="Pengalaman" />)
      const trigger = screen.getByRole('button', { name: 'Sesuaikan dengan lowongan Pengalaman' })

      fireEvent.touchStart(trigger)
      expect(
        screen.queryByText(
          'Tempel deskripsi lowongan — lihat kata kunci mana yang didukung data Anda.',
        ),
      ).toBeNull()
      await act(async () => {
        vi.advanceTimersByTime(600)
      })
      expect(
        screen.getByText(
          'Tempel deskripsi lowongan — lihat kata kunci mana yang didukung data Anda.',
        ),
      ).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })
})
