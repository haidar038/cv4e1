import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { documentStore } from '../store/document-store'
import { openTestDocument, resetFormStores, runAxe, teardownFormStores } from '../form/test-utils'
import { PRINT_HELP_KEY } from './print-prefs'
import { PrintButton } from './PrintButton'

const printSpy = vi.fn()
const realPrint = window.print

function openNamedDocument(): void {
  openTestDocument()
  documentStore.setState((state) => {
    if (state.document === null) return state
    return {
      ...state,
      document: { ...state.document, basics: { ...state.document.basics, name: 'Budi Santoso' } },
    }
  })
}

beforeEach(async () => {
  await resetFormStores()
  localStorage.removeItem(PRINT_HELP_KEY)
  window.print = printSpy
  printSpy.mockClear()
  openNamedDocument()
})

afterEach(async () => {
  window.print = realPrint
  await teardownFormStores()
})

describe('PrintButton (D19)', () => {
  it('opens the instructions modal on first print, then prints with the suggested name', async () => {
    const user = userEvent.setup()
    render(<PrintButton />)

    await user.click(screen.getByRole('button', { name: 'Cetak / Simpan PDF' }))
    expect(printSpy).not.toHaveBeenCalled()
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Mencetak CV sebagai PDF')).toBeInTheDocument()
    expect(screen.getByText('CV-budi-santoso-ats.pdf')).toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: 'Jangan tampilkan lagi' }))
    await user.click(screen.getByRole('button', { name: 'Cetak sekarang' }))

    expect(printSpy).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem(PRINT_HELP_KEY)).toBe('1')
  })

  it('prints directly once the help was seen, without the modal', async () => {
    const user = userEvent.setup()
    localStorage.setItem(PRINT_HELP_KEY, '1')
    render(<PrintButton />)

    await user.click(screen.getByRole('button', { name: 'Cetak / Simpan PDF' }))
    expect(printSpy).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('reopens the guidance anytime from the help button', async () => {
    const user = userEvent.setup()
    localStorage.setItem(PRINT_HELP_KEY, '1')
    render(<PrintButton />)

    await user.click(screen.getByRole('button', { name: 'Panduan cetak' }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    // Help text covers all three browsers (D19).
    expect(screen.getByText(/Chrome:/)).toBeInTheDocument()
    expect(screen.getByText(/Firefox:/)).toBeInTheDocument()
    expect(screen.getByText(/Safari:/)).toBeInTheDocument()
  })

  it('passes the axe audit with the modal open', async () => {
    const user = userEvent.setup()
    render(<PrintButton />)
    await user.click(screen.getByRole('button', { name: 'Panduan cetak' }))
    await screen.findByRole('dialog')
    await runAxe(document.body)
  })
})
