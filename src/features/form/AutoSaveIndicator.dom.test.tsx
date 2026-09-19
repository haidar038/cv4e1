import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { documentStore } from '../store/document-store'
import { uiStore } from '../store/ui-store'
import { AutoSaveIndicator } from './AutoSaveIndicator'
import { resetFormStores, teardownFormStores } from './test-utils'

beforeEach(async () => {
  await resetFormStores()
})

afterEach(async () => {
  await teardownFormStores()
})

describe('AutoSaveIndicator (D21 texts)', () => {
  it('transitions Menyimpan… → Tersimpan with the status (AC)', () => {
    const { rerender } = render(<AutoSaveIndicator />)

    uiStore.setState({ autosaveStatus: 'saving' })
    rerender(<AutoSaveIndicator />)
    expect(screen.getByRole('status')).toHaveTextContent('Menyimpan…')

    uiStore.setState({ autosaveStatus: 'saved' })
    rerender(<AutoSaveIndicator />)
    expect(screen.getByRole('status')).toHaveTextContent('Tersimpan')
  })

  it('keeps saying Tersimpan after a reload via the restored lastSavedAt (AC)', () => {
    // After a reload the autosave status is idle again; the loaded draft
    // carries the time of its last successful save.
    documentStore.setState({ lastSavedAt: 1727000000000 })
    render(<AutoSaveIndicator />)

    expect(screen.getByRole('status')).toHaveTextContent('Tersimpan')
  })

  it('shows nothing while idle with no save yet', () => {
    render(<AutoSaveIndicator />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('renders the private-mode message when storage is blocked (D21, edge case)', () => {
    uiStore.setState({
      autosaveStatus: 'blocked',
      storageMessage: 'Mode privat: perubahan tidak tersimpan.',
    })
    render(<AutoSaveIndicator />)

    expect(screen.getByRole('status')).toHaveTextContent('Mode privat: perubahan tidak tersimpan.')
  })

  it('renders the save-failed message while the in-memory draft stays intact (D21)', () => {
    uiStore.setState({
      autosaveStatus: 'error',
      storageMessage: 'Gagal menyimpan — ekspor manual disarankan.',
    })
    render(<AutoSaveIndicator />)

    expect(screen.getByRole('status')).toHaveTextContent(
      'Gagal menyimpan — ekspor manual disarankan.',
    )
  })
})
