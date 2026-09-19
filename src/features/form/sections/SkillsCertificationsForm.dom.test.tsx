import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { documentStore } from '../../store/document-store'
import { SkillsForm } from './SkillsForm'
import { CertificationsForm } from './CertificationsForm'
import { openTestDocument, resetFormStores, runAxe, teardownFormStores } from '../test-utils'

beforeEach(async () => {
  await resetFormStores()
  openTestDocument()
})

afterEach(async () => {
  await teardownFormStores()
})

describe('SkillsForm (grouped categories)', () => {
  it('adds a group, commits category and items, and never persists placeholder rows', async () => {
    const user = userEvent.setup()
    render(
      <main>
        <SkillsForm />
      </main>,
    )
    await user.click(screen.getByRole('button', { name: 'Tambah grup' }))

    await user.type(screen.getByLabelText('Kategori'), 'Teknis')
    // The add-item button appends a local row only; typing commits it.
    await user.click(screen.getByRole('button', { name: 'Tambah Keahlian' }))
    await user.type(screen.getByLabelText('Keahlian 1'), 'JavaScript')

    const group = documentStore.getState().document?.sections.skills?.[0]
    expect(group?.category).toBe('Teknis')
    expect(group?.items).toEqual(['JavaScript'])
  })

  it('passes the axe audit', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <main>
        <SkillsForm />
      </main>,
    )
    await user.click(screen.getByRole('button', { name: 'Tambah grup' }))
    await user.type(screen.getByLabelText('Kategori'), 'Teknis')

    await runAxe(container)
  })
})

describe('CertificationsForm', () => {
  it('commits name, issuer, issue date, and validates the URL on blur', async () => {
    const user = userEvent.setup()
    render(
      <main>
        <CertificationsForm />
      </main>,
    )
    await user.click(screen.getByRole('button', { name: 'Tambah Sertifikasi' }))

    await user.type(screen.getByLabelText('Nama sertifikasi'), 'Belajar Dasar Pemrograman Web')
    await user.type(screen.getByLabelText('Penerbit'), 'Dicoding Academy')
    await user.type(screen.getByLabelText('Tanggal terbit'), '2024-03')

    const item = documentStore.getState().document?.sections.certifications?.[0]
    expect(item?.name).toBe('Belajar Dasar Pemrograman Web')
    expect(item?.issuer).toBe('Dicoding Academy')
    expect(item?.issueDate).toBe('2024-03')

    const url = screen.getByLabelText('URL')
    await user.type(url, 'dicoding')
    await user.tab()
    expect(screen.getByRole('alert')).toHaveTextContent(/Format tautan belum benar/)
  })

  it('passes the axe audit', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <main>
        <CertificationsForm />
      </main>,
    )
    await user.click(screen.getByRole('button', { name: 'Tambah Sertifikasi' }))
    await user.type(screen.getByLabelText('Nama sertifikasi'), 'Belajar Dasar Pemrograman Web')

    await runAxe(container)
  })
})
