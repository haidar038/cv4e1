import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toATSViewModel } from '../../../core/normalize'
import { documentStore } from '../../store/document-store'
import { EducationForm } from './EducationForm'
import { openTestDocument, resetFormStores, runAxe, teardownFormStores } from '../test-utils'
import { uiStore } from '../../store/ui-store'

beforeEach(async () => {
  await resetFormStores()
  openTestDocument()
})

afterEach(async () => {
  await teardownFormStores()
})

function renderForm() {
  return render(
    <main>
      <EducationForm />
    </main>,
  )
}

describe('EducationForm', () => {
  it('adds an item through the real action and commits typed input', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: 'Tambah Pendidikan' }))
    const institution = screen.getByLabelText('Nama institusi')
    await user.type(institution, 'Universitas Contoh Nusantara')

    const items = documentStore.getState().document?.sections.education
    expect(items?.[0]?.institution).toBe('Universitas Contoh Nusantara')
  })

  it('offers the four Indonesian statuses with their writing examples (FR-202)', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByRole('button', { name: 'Tambah Pendidikan' }))

    const select = screen.getByLabelText('Status pendidikan')
    for (const label of ['Lulus', 'Lulus (menunggu wisuda)', 'Sedang menempuh', 'Berhenti']) {
      expect(screen.getByRole('option', { name: label })).toBeInTheDocument()
    }

    await user.selectOptions(select, 'Lulus (menunggu wisuda)')
    expect(documentStore.getState().document?.sections.education?.[0]?.status).toBe(
      'awaiting-ceremony',
    )
    // The writing example appears at the point of filling (J2).
    expect(screen.getByText(/Lulus \(menunggu wisuda\), yudisium Juli 2026/)).toBeInTheDocument()
  })

  it('shows the GPA scale warning while the scale is untouched and clears it after (FR-201)', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByRole('button', { name: 'Tambah Pendidikan' }))

    const value = screen.getByLabelText('IPK')
    await user.type(value, '3.52')

    expect(screen.getByText(/Skala IPK belum ditulis/)).toBeInTheDocument()
    const items = documentStore.getState().document?.sections.education
    expect(items?.[0]?.gpa).toEqual({ value: '3.52', scale: '4.00', label: 'IPK' })

    const scale = screen.getByLabelText('Skala')
    await user.clear(scale)
    await user.type(scale, '4')
    expect(screen.queryByText(/Skala IPK belum ditulis/)).not.toBeInTheDocument()
    expect(documentStore.getState().document?.sections.education?.[0]?.gpa?.scale).toBe('4')
  })

  it('surfaces a blur-time error for an invalid GPA without polluting the store', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByRole('button', { name: 'Tambah Pendidikan' }))

    const value = screen.getByLabelText('IPK')
    await user.type(value, '3.')
    await user.tab()

    expect(screen.getByRole('alert')).toHaveTextContent('Format IPK belum benar, misalnya 3.52.')
    // The last VALID prefix ('3') is committed; the rejected intermediate ('3.')
    // never reaches the document.
    expect(documentStore.getState().document?.sections.education?.[0]?.gpa?.value).toBe('3')
  })

  it('keeps working when the store rejects nothing: removing all items empties the section (AC)', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByRole('button', { name: 'Tambah Pendidikan' }))
    await user.click(screen.getByRole('button', { name: 'Hapus Pendidikan 1' }))

    const document = documentStore.getState().document
    if (document === null) throw new Error('unreachable')
    expect(viewModelSectionKeys(document)).not.toContain('education')
  })

  it('passes the axe audit with a filled item', async () => {
    const user = userEvent.setup()
    const { container } = renderForm()
    await user.click(screen.getByRole('button', { name: 'Tambah Pendidikan' }))
    await user.type(screen.getByLabelText('Nama institusi'), 'Universitas Contoh Nusantara')

    await runAxe(container)
  })

  it('hides the Indonesia-specific guidance when the locale is not id (FR-204)', async () => {
    const user = userEvent.setup()
    uiStore.setState({ locale: 'en' })
    renderForm()
    await user.click(screen.getByRole('button', { name: 'Tambah Pendidikan' }))
    await user.type(screen.getByLabelText('IPK'), '3.52')

    expect(screen.queryByText(/Skala IPK belum ditulis/)).not.toBeInTheDocument()
    // Labels stay programmatic even without the domain pack.
    expect(screen.getByLabelText('IPK')).toBeInTheDocument()
  })
})

function viewModelSectionKeys(
  document: NonNullable<ReturnType<typeof documentStore.getState>['document']>,
) {
  return toATSViewModel(document).sections.map((section) => section.key)
}
