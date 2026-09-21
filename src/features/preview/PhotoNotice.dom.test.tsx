import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { documentStore } from '../store/document-store'
import { setMode } from '../store/actions'
import { uiStore } from '../store/ui-store'
import { microcopyId } from '../../content/microcopy/id'
import { openTestDocument, resetFormStores, teardownFormStores } from '../form/test-utils'
import { PhotoNotice } from './PhotoNotice'

const VERBATIM =
  'Versi ATS menyembunyikan foto agar aman dibaca sistem pelacak lamaran. Foto Anda tetap tersimpan dan muncul di versi Creative.'

beforeEach(async () => {
  await resetFormStores()
})

afterEach(async () => {
  await teardownFormStores()
})

/** Adds a photo to the open test document (enabled + assetRef, blob optional). */
function attachPhoto(): void {
  documentStore.setState((state) => {
    if (state.document === null) return state
    return {
      ...state,
      document: {
        ...state.document,
        basics: {
          ...state.document.basics,
          photo: { enabled: true, assetRef: 'asset_test_photo' },
        },
      },
    }
  })
}

describe('PhotoNotice', () => {
  it('explains why in ATS mode with a photo, using the verbatim micro-copy', () => {
    openTestDocument()
    attachPhoto()
    render(<PhotoNotice hasPhoto />)
    expect(screen.getByRole('status')).toHaveTextContent(VERBATIM)
    expect(microcopyId.photo.atsHiddenNotice).toBe(VERBATIM)
  })

  it('renders nothing without a photo in the document', () => {
    openTestDocument()
    render(<PhotoNotice hasPhoto={false} />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('renders nothing in Creative mode even with a photo', () => {
    openTestDocument()
    attachPhoto()
    setMode('creative')
    render(<PhotoNotice hasPhoto />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('dismisses once per session and stays hidden across a mode round-trip', async () => {
    const user = userEvent.setup()
    openTestDocument()
    attachPhoto()
    const { rerender } = render(<PhotoNotice hasPhoto />)
    expect(screen.getByRole('status')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Tutup pemberitahuan' }))
    expect(uiStore.getState().photoNoticeDismissed).toBe(true)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    // Same session: switching away and back must not resurface the notice.
    setMode('creative')
    rerender(<PhotoNotice hasPhoto />)
    setMode('ats')
    rerender(<PhotoNotice hasPhoto />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('passes the axe audit with the notice visible', async () => {
    openTestDocument()
    attachPhoto()
    render(<PhotoNotice hasPhoto />)
    await screen.findByRole('status')

    const results = await axe.run(document.body, { resultTypes: ['violations'] })
    const summary = results.violations
      .map(
        (violation) => `${violation.id}: ${violation.nodes.map((node) => node.html).join(' | ')}`,
      )
      .join('\n')
    expect(summary, summary).toBe('')
  })
})
