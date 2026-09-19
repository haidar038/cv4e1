import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { documentStore } from '../../store/document-store'
import { ProjectsForm } from './ProjectsForm'
import { openTestDocument, resetFormStores, runAxe, teardownFormStores } from '../test-utils'

beforeEach(async () => {
  await resetFormStores()
  openTestDocument()
})

afterEach(async () => {
  await teardownFormStores()
})

describe('ProjectsForm', () => {
  it('commits name, free-text context, and dates', async () => {
    const user = userEvent.setup()
    render(
      <main>
        <ProjectsForm />
      </main>,
    )
    await user.click(screen.getByRole('button', { name: 'Tambah Proyek' }))

    await user.type(screen.getByLabelText('Nama proyek'), 'Sistem Pendataan UMKM')
    expect(screen.getByLabelText('Konteks proyek')).toHaveAttribute('placeholder', 'Tugas akhir')
    await user.type(screen.getByLabelText('Mulai'), '2024-09')
    await user.type(screen.getByLabelText('Peran Anda'), 'Pengembang')

    const item = documentStore.getState().document?.sections.projects?.[0]
    expect(item?.name).toBe('Sistem Pendataan UMKM')
    expect(item?.startDate).toBe('2024-09')
    expect(item?.role).toBe('Pengembang')
    expect(item?.context).toBeUndefined()
  })

  it('rejects an invalid URL only on blur, with the reason attached to the field', async () => {
    const user = userEvent.setup()
    render(
      <main>
        <ProjectsForm />
      </main>,
    )
    await user.click(screen.getByRole('button', { name: 'Tambah Proyek' }))

    const url = screen.getByLabelText('URL')
    await user.type(url, 'belum jadi')
    await user.tab()

    expect(screen.getByRole('alert')).toHaveTextContent(/Format tautan belum benar/)
    expect(documentStore.getState().document?.sections.projects?.[0]?.url).toBeUndefined()
  })

  it('passes the axe audit', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <main>
        <ProjectsForm />
      </main>,
    )
    await user.click(screen.getByRole('button', { name: 'Tambah Proyek' }))
    await user.type(screen.getByLabelText('Nama proyek'), 'Sistem Pendataan UMKM')

    await runAxe(container)
  })
})
