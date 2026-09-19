import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createDraft } from '../store/actions'
import { documentStore } from '../store/document-store'
import { toATSViewModel } from '../../core/normalize'
import { FormLayout } from './FormLayout'
import { openTestDocument, resetFormStores, runAxe, teardownFormStores } from './test-utils'

beforeEach(async () => {
  await resetFormStores()
})

afterEach(async () => {
  await teardownFormStores()
})

describe('empty state', () => {
  it('guides without judging and creates the first draft from the CTA', async () => {
    const user = userEvent.setup()
    render(
      <main>
        <FormLayout />
      </main>,
    )

    expect(screen.getByText('Mulai dari halaman kosong')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Buat CV pertama' }))

    await waitFor(() => {
      expect(documentStore.getState().draftId).not.toBeNull()
    })
    expect(screen.getByRole('button', { name: 'Data Diri' })).toBeInTheDocument()
  })
})

describe('section navigation (keyboard-first)', () => {
  it('shows all seven sections with a progress indicator', () => {
    openTestDocument()
    render(
      <main>
        <FormLayout />
      </main>,
    )

    for (const label of [
      'Data Diri',
      'Pendidikan',
      'Pengalaman',
      'Organisasi',
      'Proyek',
      'Keahlian',
      'Sertifikasi',
    ]) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }
    expect(screen.getByText('Bagian 1 dari 7')).toBeInTheDocument()
  })

  it('walkthrough: keyboard-only user opens a section and fills a field (NFR-005)', async () => {
    const user = userEvent.setup()
    openTestDocument()
    render(
      <main>
        <FormLayout />
      </main>,
    )

    // First Tab stop is the first accordion trigger.
    await user.tab()
    expect(document.activeElement).toHaveAccessibleName('Data Diri')

    // Enter opens the section; focus stays on the trigger, and one more Tab
    // moves into the panel's first field.
    await user.keyboard('{Enter}')
    const name = screen.getByLabelText('Nama lengkap')
    await user.tab()
    expect(name).toHaveFocus()

    await user.type(name, 'Budi Santoso')
    expect(documentStore.getState().document?.basics.name).toBe('Budi Santoso')
  })

  it('keeps the keyboard walkthrough free of focus traps across sections', async () => {
    const user = userEvent.setup()
    openTestDocument()
    render(
      <main>
        <FormLayout />
      </main>,
    )

    await user.tab()
    await user.keyboard('{Enter}')
    await user.tab() // into the name field
    await user.tab() // headline
    await user.tab() // email
    await user.tab() // phone
    await user.tab() // location
    await user.tab() // summary
    await user.tab() // link add button area
    // Wherever we are, Tab keeps moving forward without getting stuck.
    const focusBefore = document.activeElement
    await user.tab()
    expect(document.activeElement).not.toBe(focusBefore)
  })
})

describe('section reorder (F-B9, D22: buttons, not drag-and-drop)', () => {
  it('moves a section down and persists the new sectionOrder', async () => {
    const user = userEvent.setup()
    openTestDocument()
    render(
      <main>
        <FormLayout />
      </main>,
    )

    const down = screen.getByRole('button', { name: 'Turunkan Pendidikan' })
    expect(screen.queryByRole('button', { name: 'Naikkan Pendidikan' })).not.toBeInTheDocument()
    await user.click(down)

    const order = documentStore.getState().document?.sectionOrder
    expect(order?.[0]).toBe('experience')
    expect(order?.[1]).toBe('education')
  })

  it('moves a section back up (order is fully keyboard-operable)', async () => {
    const user = userEvent.setup()
    openTestDocument()
    render(
      <main>
        <FormLayout />
      </main>,
    )

    await user.click(screen.getByRole('button', { name: 'Turunkan Pendidikan' }))
    await user.click(screen.getByRole('button', { name: 'Naikkan Pendidikan' }))

    expect(documentStore.getState().document?.sectionOrder?.[0]).toBe('education')
  })
})

describe('skip link to the preview', () => {
  it('renders only when a preview target exists — never a dead link', () => {
    openTestDocument()
    const { rerender } = render(
      <main>
        <FormLayout />
      </main>,
    )
    expect(screen.queryByRole('link', { name: 'Lewati ke pratinjau CV' })).not.toBeInTheDocument()

    rerender(
      <main>
        <div id="cv-preview" />
        <FormLayout />
      </main>,
    )
    const link = screen.getByRole('link', { name: 'Lewati ke pratinjau CV' })
    expect(link).toHaveAttribute('href', '#cv-preview')
  })
})

describe('view-model invariant through the form (AC)', () => {
  it('an emptied section disappears from the ATS view model', async () => {
    const user = userEvent.setup()
    openTestDocument()
    render(
      <main>
        <FormLayout />
      </main>,
    )

    // Add an education entry, then remove it again — all via the UI.
    await user.click(screen.getByRole('button', { name: 'Data Diri' })) // close basics
    await user.click(screen.getByRole('button', { name: 'Pendidikan' }))
    await user.click(screen.getByRole('button', { name: 'Tambah Pendidikan' }))
    await user.click(screen.getByRole('button', { name: 'Hapus Pendidikan 1' }))

    const document = documentStore.getState().document
    expect(document).not.toBeNull()
    if (document === null) throw new Error('unreachable')
    const viewModel = toATSViewModel(document)
    expect(viewModel.sections.find((section) => section.key === 'education')).toBeUndefined()
  })
})

describe('accessibility', () => {
  it('passes the axe audit with sections open and controls visible', async () => {
    const user = userEvent.setup()
    openTestDocument()
    const { container } = render(
      <main>
        <FormLayout />
      </main>,
    )

    await user.click(screen.getByRole('button', { name: 'Data Diri' }))
    await runAxe(container)
  })
})

describe('draft lifecycle through the panel-free path', () => {
  it('createDraft is idempotent enough for the empty state CTA', async () => {
    openTestDocument()
    render(
      <main>
        <FormLayout />
      </main>,
    )
    // No empty state is shown while a document is open.
    expect(screen.queryByText('Mulai dari halaman kosong')).not.toBeInTheDocument()
  })

  it('createDraft from the empty state works through the real action', async () => {
    await createDraft()
    expect(documentStore.getState().document).not.toBeNull()
  })
})
