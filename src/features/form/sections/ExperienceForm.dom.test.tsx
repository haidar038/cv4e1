import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { documentStore } from '../../store/document-store'
import { ExperienceForm } from './ExperienceForm'
import { OrganizationsForm as OrganizationsFormWrapper } from './OrganizationsForm'
import { openTestDocument, resetFormStores, runAxe, teardownFormStores } from '../test-utils'

beforeEach(async () => {
  await resetFormStores()
  openTestDocument()
})

afterEach(async () => {
  await teardownFormStores()
})

describe('ExperienceForm', () => {
  function renderForm() {
    return render(
      <main>
        <ExperienceForm />
      </main>,
    )
  }

  it('offers all six employment types in Bahasa Indonesia', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByRole('button', { name: 'Tambah Pengalaman' }))

    for (const label of [
      'Penuh waktu',
      'Paruh waktu',
      'Magang',
      'Freelance',
      'Sukarelawan',
      'Organisasi',
    ]) {
      expect(screen.getByRole('option', { name: label })).toBeInTheDocument()
    }
    await user.selectOptions(screen.getByLabelText('Jenis'), 'Magang')
    expect(documentStore.getState().document?.sections.experience?.[0]?.employmentType).toBe(
      'internship',
    )
  })

  it('disables the end date while `current` is checked and re-enables it after (edge case)', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByRole('button', { name: 'Tambah Pengalaman' }))

    const endDate = screen.getByLabelText('Selesai')
    expect(endDate).toBeEnabled()

    await user.click(screen.getByLabelText('Saya masih menempati posisi ini'))
    expect(endDate).toBeDisabled()
    expect(documentStore.getState().document?.sections.experience?.[0]?.current).toBe(true)

    await user.click(screen.getByLabelText('Saya masih menempati posisi ini'))
    expect(endDate).toBeEnabled()
  })

  it('passes the axe audit with an item in progress', async () => {
    const user = userEvent.setup()
    const { container } = renderForm()
    await user.click(screen.getByRole('button', { name: 'Tambah Pengalaman' }))
    await user.type(screen.getByLabelText('Nama perusahaan/organisasi'), 'CV Contoh Digital')

    await runAxe(container)
  })
})

describe('OrganizationsForm (equal treatment, F-C guidance)', () => {
  it('shows the guiding organizations micro-copy and adds items to its own section', async () => {
    const user = userEvent.setup()
    render(
      <main>
        <OrganizationsFormWrapper />
      </main>,
    )

    expect(screen.getByText(/pengalaman yang sah/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tambah Organisasi' }))
    await user.type(
      screen.getByLabelText('Nama perusahaan/organisasi'),
      'Himpunan Mahasiswa Jurusan Teknik Informatika',
    )

    const items = documentStore.getState().document?.sections.organizations
    expect(items?.[0]?.organization).toBe('Himpunan Mahasiswa Jurusan Teknik Informatika')
    expect(documentStore.getState().document?.sections.experience).toBeUndefined()
  })
})
