'use no memo'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { openTestDocument, resetFormStores, runAxe, teardownFormStores } from '../form/test-utils'
import { documentStore } from '../store/document-store'
import { draftStore } from '../store/draft-store'
import { ImportCvDialog } from './ImportCvDialog'
import type { PdfDocumentHandle } from './pdf-text'

const SAMPLE_TEXT = `Contoh Nama Fiktif
contoh.fiktif@example.com

PENDIDIKAN
Universitas Contoh Bangsa
2019 – 2023`

function textDoc(text: string): PdfDocumentHandle {
  return {
    pageCount: 1,
    getPage: async () => ({
      getTextContent: async () => ({ items: [{ str: text }] }),
      render: () => ({ promise: Promise.resolve() }),
      getViewport: () => ({ width: 10, height: 10 }),
    }),
  }
}

function renderDialog(seams?: { text?: string }) {
  const onOpenChange = vi.fn()
  render(
    <ImportCvDialog
      open
      onOpenChange={onOpenChange}
      pipelineDeps={{ openPdf: async () => textDoc(seams?.text ?? SAMPLE_TEXT) }}
    />,
  )
  return { onOpenChange }
}

async function uploadPdf(name = 'cv.pdf', type = 'application/pdf') {
  const user = userEvent.setup()
  const input = screen.getByLabelText('Pilih berkas PDF')
  const file = new File([new Uint8Array([1, 2, 3])], name, { type })
  await user.upload(input, file)
}

describe('ImportCvDialog (T3a, FR-501/AC-501-a, FR-502/AC-502-a)', () => {
  beforeEach(async () => {
    await resetFormStores()
    openTestDocument()
  })

  afterEach(async () => {
    await teardownFormStores()
  })

  it('AC-501-a: review shows candidates while the open draft stays untouched', async () => {
    renderDialog()
    await uploadPdf()
    await waitFor(() => {
      expect(screen.getByText('Tinjau hasil impor')).toBeInTheDocument()
    })
    expect(screen.getByText('Contoh Nama Fiktif')).toBeInTheDocument()
    expect(screen.getByText('Universitas Contoh Bangsa')).toBeInTheDocument()
    // AC-502-a: nothing saved before approval — the open draft is intact.
    expect(documentStore.getState().document?.basics.name).toBe('')
    expect(draftStore.getState().summaries).toHaveLength(1)
  })

  it('approval saves a NEW draft and opens it; the old draft is not mutated', async () => {
    const { onOpenChange } = renderDialog()
    await uploadPdf()
    await waitFor(() => {
      expect(screen.getByText('Tinjau hasil impor')).toBeInTheDocument()
    })
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Simpan sebagai CV baru' }))
    await waitFor(() => {
      expect(documentStore.getState().document?.basics.name).toBe('Contoh Nama Fiktif')
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
    // One real draft (the import); the seeded fake summary is replaced by storage truth.
    expect(draftStore.getState().summaries).toHaveLength(1)
    expect(draftStore.getState().selectedId).not.toBe('draft_test_1')
  })

  it('closing before approval leaves every store untouched', async () => {
    const { onOpenChange } = renderDialog()
    await uploadPdf()
    await waitFor(() => {
      expect(screen.getByText('Tinjau hasil impor')).toBeInTheDocument()
    })
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Batal' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(documentStore.getState().document?.basics.name).toBe('')
    expect(draftStore.getState().summaries).toHaveLength(1)
  })

  it('non-PDF files are rejected with an actionable note (import-export-spec §6)', async () => {
    renderDialog()
    // NOTE: user-event upload() enforces the input's accept attribute like a
    // real picker would — fireEvent reaches our own type guard instead, which
    // is what this test owns (the picker behavior is the browser's).
    const input = screen.getByLabelText('Pilih berkas PDF')
    const file = new File([new Uint8Array([1, 2, 3])], 'cv.txt', { type: 'text/plain' })
    fireEvent.change(input, { target: { files: [file] } })
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('bukan PDF')
    })
    expect(documentStore.getState().document?.basics.name).toBe('')
  })

  it('review state has no axe violations', async () => {
    const { container } = render(
      <ImportCvDialog
        open
        onOpenChange={vi.fn()}
        pipelineDeps={{ openPdf: async () => textDoc(SAMPLE_TEXT) }}
      />,
    )
    await uploadPdf()
    await waitFor(() => {
      expect(screen.getByText('Tinjau hasil impor')).toBeInTheDocument()
    })
    await runAxe(container)
  })

  it('Escape closes the dialog without saving', async () => {
    const { onOpenChange } = renderDialog()
    await uploadPdf()
    await waitFor(() => {
      expect(screen.getByText('Tinjau hasil impor')).toBeInTheDocument()
    })
    const user = userEvent.setup()
    await user.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(documentStore.getState().document?.basics.name).toBe('')
  })
})
