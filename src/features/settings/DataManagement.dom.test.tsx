import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { db } from '../../storage'
import { createDraft } from '../store/actions'
import { documentStore } from '../store/document-store'
import { resetFormStores, runAxe, teardownFormStores } from '../form/test-utils'
import { DataManagement } from './DataManagement'

async function openDialog(): Promise<void> {
  const user = userEvent.setup()
  render(<DataManagement />)
  await user.click(screen.getByRole('button', { name: 'Hapus semua data' }))
  expect(await screen.findByRole('dialog')).toBeInTheDocument()
}

beforeEach(async () => {
  await resetFormStores()
  localStorage.clear()
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
})

afterEach(async () => {
  await teardownFormStores()
})

describe('DataManagement (Task 15, FR-108)', () => {
  it('cancelling the dialog deletes nothing', async () => {
    const user = userEvent.setup()
    await createDraft()
    localStorage.setItem('cv4every1:lastDraftId', 'keep-me')
    await openDialog()

    await user.click(screen.getByRole('button', { name: 'Batal' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(await db.drafts.count()).toBe(1)
    expect(localStorage.getItem('cv4every1:lastDraftId')).toBe('keep-me')
  })

  it('offers an export first: the download works and the dialog stays open', async () => {
    const user = userEvent.setup()
    render(<DataManagement />)
    await createDraft()
    const clicked: string[] = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push(this.download)
    })

    await user.click(screen.getByRole('button', { name: 'Hapus semua data' }))
    await screen.findByRole('dialog')
    await user.click(screen.getByRole('button', { name: 'Ekspor dulu (.json)' }))

    // The lazy export chunk resolves asynchronously — wait for the download.
    await waitFor(() => expect(clicked).toHaveLength(1))
    expect(clicked[0]).toMatch(/\.json$/)
    // Still open: the export never confirms or closes the wipe.
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(await db.drafts.count()).toBe(1)
  })

  it('confirming wipes IndexedDB + localStorage and offers the explicit reload', async () => {
    const user = userEvent.setup()
    render(<DataManagement />)
    await createDraft()
    await db.assets.put({ ref: 'photo-1', blob: new Blob(['x'], { type: 'image/png' }) })
    localStorage.setItem('cv4every1:lastDraftId', 'gone')
    localStorage.setItem('cv4every1:printHelpSeen', '1')
    localStorage.setItem('foreign-key', 'stays')

    await user.click(screen.getByRole('button', { name: 'Hapus semua data' }))
    await screen.findByRole('dialog')
    await user.click(screen.getByRole('button', { name: 'Ya, hapus semua' }))

    expect(await screen.findByText(/Semua data terhapus/)).toBeInTheDocument()
    expect(await db.drafts.count()).toBe(0)
    expect(await db.assets.count()).toBe(0)
    expect(documentStore.getState().document).toBeNull()
    expect(localStorage.getItem('cv4every1:lastDraftId')).toBeNull()
    expect(localStorage.getItem('cv4every1:printHelpSeen')).toBeNull()
    expect(localStorage.getItem('foreign-key')).toBe('stays')

    // The reload itself is proven by e2e/wipe-data.spec.ts against the real
    // build — jsdom cannot navigate, so clicking here would only emit
    // "not implemented" noise. The button's presence is the contract.
    expect(screen.getByRole('button', { name: 'Muat ulang' })).toBeInTheDocument()
  })

  it('passes the axe audit with the dialog open', async () => {
    const user = userEvent.setup()
    render(<DataManagement />)
    await user.click(screen.getByRole('button', { name: 'Hapus semua data' }))
    await screen.findByRole('dialog')
    await runAxe(document.body)
  })
})
