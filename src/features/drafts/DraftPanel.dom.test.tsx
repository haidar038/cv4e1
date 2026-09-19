import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createDraft, flushAutosave } from '../store/actions'
import { documentStore } from '../store/document-store'
import { draftStore } from '../store/draft-store'
import { exportResume } from '../../storage/export-import'
import { DraftPanel } from './DraftPanel'
import { resetFormStores, runAxe, teardownFormStores } from '../form/test-utils'

beforeEach(async () => {
  await resetFormStores()
})

afterEach(async () => {
  await teardownFormStores()
})

function renderPanel() {
  return render(
    <main>
      <DraftPanel />
    </main>,
  )
}

async function createSavedDraft(): Promise<void> {
  await createDraft()
  await flushAutosave()
}

describe('DraftPanel lifecycle actions (D23, F-A3/F-A4)', () => {
  it('creates a draft and lists it', async () => {
    const user = userEvent.setup()
    renderPanel()

    await user.click(screen.getByRole('button', { name: 'CV baru' }))

    await waitFor(() => {
      expect(draftStore.getState().summaries).toHaveLength(1)
    })
  })

  it('renames a draft through the dialog', async () => {
    const user = userEvent.setup()
    renderPanel()
    await createSavedDraft()

    await user.click(screen.getByRole('button', { name: 'Ganti nama Untitled CV' }))
    const input = screen.getByLabelText('Ganti nama')
    await user.clear(input)
    await user.type(input, 'CV Lamaran Toko')
    await user.click(screen.getByRole('button', { name: 'Ganti nama' }))

    await waitFor(() => {
      expect(draftStore.getState().summaries[0]?.title).toBe('CV Lamaran Toko')
    })
  })

  it('duplicates a draft without switching the selection', async () => {
    const user = userEvent.setup()
    renderPanel()
    await createSavedDraft()

    await user.click(screen.getByRole('button', { name: 'Duplikat Untitled CV' }))

    await waitFor(() => {
      expect(draftStore.getState().summaries).toHaveLength(2)
    })
  })

  it('deletes a draft after confirmation and drops the tab to the empty condition', async () => {
    const user = userEvent.setup()
    renderPanel()
    await createSavedDraft()

    await user.click(screen.getByRole('button', { name: 'Hapus Untitled CV' }))
    expect(
      screen.getByText('Hapus CV ini? Tindakan ini tidak bisa dibatalkan.'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^Hapus$/ }))

    await waitFor(() => {
      expect(draftStore.getState().summaries).toHaveLength(0)
    })
    expect(documentStore.getState().document).toBeNull()
  })

  it('exports the open draft as a downloadable envelope', async () => {
    const user = userEvent.setup()
    renderPanel()
    await createSavedDraft()
    const clicked: string[] = []
    // jsdom/vitest cannot create object URLs from Blobs: stub the URL layer
    // and intercept the download anchor's click.
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push(this.download)
    })

    await user.click(screen.getByRole('button', { name: 'Ekspor' }))

    expect(clicked).toHaveLength(1)
    expect(clicked[0]).toMatch(/^cv.*\.json$|^Untitled-CV\.json$/)
  })

  it('imports a valid envelope as a NEW draft and never overwrites the open one (AC)', async () => {
    const user = userEvent.setup()
    renderPanel()
    await createSavedDraft()
    const openDoc = documentStore.getState().document
    const envelope = exportResume(openDoc!)

    const input = screen.getByLabelText('Impor')
    await user.upload(input, new File([envelope], 'backup.json', { type: 'application/json' }))

    await waitFor(() => {
      expect(draftStore.getState().summaries).toHaveLength(2)
    })
    expect(documentStore.getState().document?.basics.name).toBe(openDoc?.basics.name)
  })

  it('reports a corrupt file with the specific NOT_JSON message and keeps the open draft (AC)', async () => {
    const user = userEvent.setup()
    renderPanel()
    await createSavedDraft()
    const before = documentStore.getState().document

    const input = screen.getByLabelText('Impor')
    await user.upload(
      input,
      new File(['ini bukan json'], 'rusak.json', { type: 'application/json' }),
    )

    expect(await screen.findByText(/bukan berkas teks yang dapat dibaca/)).toBeInTheDocument()
    expect(documentStore.getState().document).toBe(before)
  })

  it('passes the axe audit with drafts listed', async () => {
    await createSavedDraft()
    const { container } = renderPanel()
    await runAxe(container)
  })
})
