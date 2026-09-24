import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { openTestDocument, resetFormStores, runAxe, teardownFormStores } from '../form/test-utils'
import {
  clearAchievementState,
  resolveAchievementRequest,
  startAchievementRequest,
} from '../store/ai-store'
import { addSectionItem } from '../store/actions'
import { documentStore } from '../store/document-store'
import { AchievementPanel } from './AchievementPanel'
import { AchievementTrigger } from './AchievementTrigger'
import { clearSessionCredentials, setSessionCredentials } from './session-keys'
import { consentStore } from './consent-store'

const DESCRIPTION = 'membantu menyusun laporan untuk 30 peserta'
const VERB_DESCRIPTION = 'membuat PRD dan SRS untuk aplikasi rindang bersama 2 teman selama magang'

function groundedMockBody(): string {
  return JSON.stringify({
    suggestions: [
      {
        text: 'Membuat PRD dan SRS bersama 2 teman untuk aplikasi rindang.',
        actionVerb: 'Membuat',
        usesPlaceholder: false,
        rationale: 'Membuat PRD dan SRS bersama 2 teman.',
        warnings: [],
      },
      {
        text: 'Membuat PRD untuk aplikasi rindang selama magang bersama 2 teman.',
        actionVerb: 'Membuat',
        usesPlaceholder: false,
        rationale: 'Membuat PRD untuk aplikasi rindang selama magang.',
        warnings: [],
      },
    ],
  })
}

function groqEnvelope(content: string): string {
  return JSON.stringify({ choices: [{ message: { content } }] })
}

function renderPanel(overrides?: {
  onAppend?: (text: string) => void
  onRequestClose?: () => void
}) {
  const onAppend = overrides?.onAppend ?? vi.fn()
  const onRequestClose = overrides?.onRequestClose ?? vi.fn()
  render(
    <AchievementPanel
      section="experience"
      sectionLabel="Pengalaman"
      itemIndex={0}
      onAppend={onAppend}
      onRequestClose={onRequestClose}
    />,
  )
  return { onAppend, onRequestClose }
}

async function fillDescription(
  user: ReturnType<typeof userEvent.setup>,
  text: string = DESCRIPTION,
): Promise<void> {
  const box = screen.getByRole('textbox', { name: 'Deskripsi pencapaian' })
  await user.click(box)
  await user.type(box, text)
  await expect(box).toHaveValue(text)
}

beforeEach(async () => {
  await resetFormStores()
  openTestDocument()
  // The append path reads the row's live text from the DocumentStore at event
  // time (Task 18 stale-closure class) — the panel alone is not enough.
  addSectionItem('experience', {
    organization: 'Organisasi Contoh',
    current: false,
    highlights: ['Baris lama.'],
  })
  clearSessionCredentials()
  consentStore.setState({ grants: {} })
  clearAchievementState()
})

afterEach(async () => {
  await teardownFormStores()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  clearSessionCredentials()
  consentStore.setState({ grants: {} })
  clearAchievementState()
})

describe('AchievementPanel (unified flow, FR-401/AC-401-a/b)', () => {
  it('AC-401-a: generating shows candidates while the document stays untouched', async () => {
    const user = userEvent.setup()
    renderPanel()
    const before = JSON.stringify(documentStore.getState().document)

    await fillDescription(user)
    await user.click(screen.getByRole('button', { name: 'Susun bullet' }))
    const firstApply = await screen.findByRole('button', { name: 'Terapkan Saran 1' })

    // Static fallback (no key): three verb-led candidates reusing the description.
    expect(screen.getAllByRole('button', { name: /Terapkan Saran \d/ })).toHaveLength(3)
    expect(firstApply).toBeInTheDocument()
    expect(
      screen.getByText('Belum ada kunci — menampilkan saran manual yang tetap bisa dipakai.'),
    ).toBeInTheDocument()
    expect(documentStore.getState().document).not.toBeNull()
    expect(JSON.stringify(documentStore.getState().document)).toBe(before)
  })

  it('AC-401-b: Apply appends exactly the approved text and keeps the panel open', async () => {
    const user = userEvent.setup()
    const onAppend = vi.fn()
    renderPanel({ onAppend })

    await fillDescription(user)
    await user.click(screen.getByRole('button', { name: 'Susun bullet' }))
    const firstApply = await screen.findByRole('button', { name: 'Terapkan Saran 1' })
    const firstText = firstApply.closest('li')?.querySelector('p:nth-of-type(2)')?.textContent ?? ''
    expect(firstText).toContain(DESCRIPTION)

    await user.click(firstApply)
    expect(onAppend).toHaveBeenCalledTimes(1)
    expect(onAppend).toHaveBeenCalledWith(firstText)
    // Applied candidates leave the list so they cannot be appended twice —
    // the panel stays open for the remaining ones.
    expect(screen.queryByRole('button', { name: 'Terapkan Saran 1' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Terapkan Saran 2' })).toBeInTheDocument()
    expect(JSON.stringify(documentStore.getState().document)).not.toContain(firstText)
  })

  it('FR-408 + review banner: AI candidates carry the session warning (Task 21 notes)', async () => {
    vi.stubGlobal(
      'fetch',
      async () =>
        new Response(groqEnvelope(groundedMockBody()), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    )
    setSessionCredentials('groq', { apiKey: 'gsk-test' })
    consentStore.getState().grant('groq')
    const user = userEvent.setup()
    renderPanel()

    await fillDescription(user, VERB_DESCRIPTION)
    await user.click(screen.getByRole('button', { name: 'Susun bullet' }))
    await screen.findByRole('button', { name: 'Terapkan Saran 1' })

    // The mock returns 2 suggestions, static returns 3 — the count proves
    // the AI path produced this list, and the banner names its provenance.
    expect(screen.getAllByRole('button', { name: /Terapkan Saran \d/ })).toHaveLength(2)
    expect(
      screen.getByText(
        'Daftar ini dibuat AI — tinjau kembali sebelum menerapkan. AI dapat membuat kesalahan.',
      ),
    ).toBeInTheDocument()
  })

  it('verb-leading input returns the raw task unprefixed, never stacked', async () => {
    const user = userEvent.setup()
    renderPanel()

    await fillDescription(user, VERB_DESCRIPTION)
    await user.click(screen.getByRole('button', { name: 'Susun bullet' }))
    const firstApply = await screen.findByRole('button', { name: 'Terapkan Saran 1' })

    // T-C no-prefix path through the panel: one candidate, no second verb.
    expect(screen.getAllByRole('button', { name: /Terapkan Saran \d/ })).toHaveLength(1)
    const firstText = firstApply.closest('li')?.querySelector('p:nth-of-type(2)')?.textContent ?? ''
    expect(firstText).toBe(`${VERB_DESCRIPTION} [dampak yang dapat diukur]`)
    expect(firstText.toLowerCase()).not.toMatch(/^(mengelola|membuat) membuat\b/)
  })

  it('FR-408: persistent 429 names the quota and falls back to static', async () => {
    let calls = 0
    vi.stubGlobal('fetch', async () => {
      calls += 1
      return new Response('{}', { status: 429, headers: { 'Retry-After': '0' } })
    })
    setSessionCredentials('groq', { apiKey: 'gsk-test' })
    consentStore.getState().grant('groq')
    const user = userEvent.setup()
    renderPanel()

    await fillDescription(user)
    await user.click(screen.getByRole('button', { name: 'Susun bullet' }))
    await screen.findByText(
      'Batas pemakaian AI tercapai — menampilkan saran manual. Draft Anda tidak berubah; coba lagi nanti.',
    )
    expect(calls).toBe(3)
    expect(screen.getAllByRole('button', { name: /Terapkan Saran \d/ })).toHaveLength(3)
  })

  it('FR-408: a timeout names the wait instead of the generic error', async () => {
    renderPanel()
    const scope = { section: 'experience', itemIndex: 0, description: DESCRIPTION } as const
    startAchievementRequest(scope)
    resolveAchievementRequest({ suggestions: [], source: 'static', errorCode: 'timeout' }, scope)
    await screen.findByText(
      'AI tidak menjawab tepat waktu — menampilkan saran manual. Draft Anda tidak berubah.',
    )
  })

  it('disables generation for empty input and explains why', async () => {
    renderPanel()
    expect(screen.getByRole('button', { name: 'Susun bullet' })).toBeDisabled()
    expect(
      screen.getByText('Tulis dulu deskripsi pencapaian Anda, lalu bullet akan muncul di sini.'),
    ).toBeInTheDocument()
  })

  it('Escape requests close without applying anything', async () => {
    const user = userEvent.setup()
    const onAppend = vi.fn()
    const onRequestClose = vi.fn()
    renderPanel({ onAppend, onRequestClose })

    await fillDescription(user)
    await user.click(screen.getByRole('button', { name: 'Susun bullet' }))
    await screen.findByRole('button', { name: 'Terapkan Saran 1' })
    await user.keyboard('{Escape}')

    expect(onRequestClose).toHaveBeenCalledTimes(1)
    expect(onAppend).not.toHaveBeenCalled()
  })

  it('passes an axe audit with suggestions on screen', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <main>
        <AchievementPanel
          section="experience"
          sectionLabel="Pengalaman"
          itemIndex={0}
          onAppend={() => {}}
          onRequestClose={() => {}}
        />
      </main>,
    )
    await fillDescription(user)
    await user.click(screen.getByRole('button', { name: 'Susun bullet' }))
    await screen.findByRole('button', { name: 'Terapkan Saran 1' })
    await runAxe(container)
  })
})

describe('AchievementTrigger (tooltip + long-press)', () => {
  it('opens the panel on click and explains itself on hover', async () => {
    const user = userEvent.setup()
    render(
      <AchievementTrigger
        section="experience"
        sectionLabel="Pengalaman"
        itemIndex={0}
        onCommitHighlights={() => {}}
      />,
    )
    const trigger = screen.getByRole('button', { name: 'Susun bullet dengan AI Pengalaman' })

    await user.hover(trigger)
    await screen.findByText(
      'Tulis deskripsi pencapaian — AI menyusun 1–3 bullet poles yang bisa ditinjau.',
    )

    await user.click(trigger)
    await expect(screen.getByRole('button', { name: 'Susun bullet' })).toBeVisible()
  })

  it('opens the tooltip on long-press and cancels on early release', async () => {
    vi.useFakeTimers()
    try {
      render(
        <AchievementTrigger
          section="experience"
          sectionLabel="Pengalaman"
          itemIndex={0}
          onCommitHighlights={() => {}}
        />,
      )
      const trigger = screen.getByRole('button', { name: 'Susun bullet dengan AI Pengalaman' })

      fireEvent.touchStart(trigger)
      expect(
        screen.queryByText(
          'Tulis deskripsi pencapaian — AI menyusun 1–3 bullet poles yang bisa ditinjau.',
        ),
      ).toBeNull()
      await act(async () => {
        vi.advanceTimersByTime(600)
      })
      expect(
        screen.getByText(
          'Tulis deskripsi pencapaian — AI menyusun 1–3 bullet poles yang bisa ditinjau.',
        ),
      ).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('appends approved text to the live rows through the commit path', async () => {
    const user = userEvent.setup()
    const committed: string[][] = []
    render(
      <AchievementTrigger
        section="experience"
        sectionLabel="Pengalaman"
        itemIndex={0}
        onCommitHighlights={(highlights) => {
          committed.push([...highlights])
        }}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Susun bullet dengan AI Pengalaman' }))
    await fillDescription(user, VERB_DESCRIPTION)
    await user.click(screen.getByRole('button', { name: 'Susun bullet' }))
    const firstApply = await screen.findByRole('button', { name: 'Terapkan Saran 1' })
    const firstText = firstApply.closest('li')?.querySelector('p:nth-of-type(2)')?.textContent ?? ''
    await user.click(firstApply)

    // Live-read at event time: the pre-existing row plus the new candidate.
    expect(committed).toHaveLength(1)
    expect(committed[0]).toEqual(['Baris lama.', firstText])
    expect(firstText).toContain(VERB_DESCRIPTION)
  })
})
