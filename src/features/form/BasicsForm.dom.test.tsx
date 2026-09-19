import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { documentStore } from '../store/document-store'
import { updateBasics } from '../store/actions'
import { BasicsForm } from './sections/BasicsForm'
import { openTestDocument, resetFormStores, runAxe, teardownFormStores } from './test-utils'

beforeEach(async () => {
  await resetFormStores()
  openTestDocument()
})

afterEach(async () => {
  await teardownFormStores()
})

describe('BasicsForm', () => {
  it('guides the Indonesian phone and location conventions at the point of filling (J2)', () => {
    render(
      <main>
        <BasicsForm />
      </main>,
    )

    expect(screen.getByLabelText('Nomor telepon')).toBeInTheDocument()
    expect(screen.getByText(/format nomor Indonesia yang konsisten/)).toBeInTheDocument()
    expect(screen.getByText(/nama kota saja tanpa alamat lengkap/)).toBeInTheDocument()
  })

  it('commits basics fields through the real store action', async () => {
    const user = userEvent.setup()
    render(
      <main>
        <BasicsForm />
      </main>,
    )

    await user.type(screen.getByLabelText('Nama lengkap'), 'Budi Santoso')
    await user.type(screen.getByLabelText('Nomor telepon'), '+62 812-3456-7890')

    const basics = documentStore.getState().document?.basics
    expect(basics?.name).toBe('Budi Santoso')
    expect(basics?.phone).toBe('+62 812-3456-7890')
  })

  it('adds a link row and commits only once the URL is valid', async () => {
    const user = userEvent.setup()
    render(
      <main>
        <BasicsForm />
      </main>,
    )

    await user.click(screen.getByRole('button', { name: 'Tambah tautan' }))
    // The empty row stays local: nothing is committed yet.
    expect(documentStore.getState().document?.basics.links).toBeUndefined()

    await user.type(screen.getByLabelText('URL 1'), 'budi')
    expect(documentStore.getState().document?.basics.links).toBeUndefined()

    await user.type(screen.getByLabelText('URL 1'), '.santoso@email.com')
    // Typing continues into the same buffer — but 'budi.santoso@email.com' is
    // not a URL, so it is still not committed until it becomes one.
    const links = documentStore.getState().document?.basics.links
    expect(links).toBeUndefined()

    await user.clear(screen.getByLabelText('URL 1'))
    await user.type(screen.getByLabelText('URL 1'), 'https://www.linkedin.com/in/budi')
    await user.type(screen.getByLabelText('Label tautan 1'), 'LinkedIn')

    const committed = documentStore.getState().document?.basics.links
    expect(committed?.[0]).toEqual({ label: 'LinkedIn', url: 'https://www.linkedin.com/in/budi' })
  })

  it('shows the unprofessional-email guidance only as help, never as an error', async () => {
    const user = userEvent.setup()
    render(
      <main>
        <BasicsForm />
      </main>,
    )

    const email = screen.getByLabelText('Email')
    await user.type(email, 'budikece999@email.com')
    await user.tab()

    // A valid address yields no validation error; the guidance is the
    // standing hint. (The ATS photo notice is a separate, unrelated alert.)
    expect(screen.queryByText(/Format email belum benar/)).not.toBeInTheDocument()
    expect(screen.getByText(/kesan profesional/)).toBeInTheDocument()
  })

  it('passes the axe audit with the photo section and links visible', async () => {
    updatePhoto()
    const { container } = render(
      <main>
        <BasicsForm />
      </main>,
    )
    await runAxe(container)
  })
})

function updatePhoto(): void {
  updateBasics({ photo: { enabled: true, assetRef: 'asset_test_001' } })
}
