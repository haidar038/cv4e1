import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { documentStore } from '../store/document-store'
import { openTestDocument, resetFormStores, teardownFormStores } from '../form/test-utils'
import { PreviewPane } from './PreviewPane'

beforeEach(async () => {
  await resetFormStores()
})

afterEach(async () => {
  await teardownFormStores()
})

/** openTestDocument starts nameless (legal in-progress draft); previews need content. */
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

/** Named document with a photo ref but no blob — the jsdom-honest placeholder path. */
function openNamedDocumentWithPhoto(): void {
  openNamedDocument()
  documentStore.setState((state) => {
    if (state.document === null) return state
    return {
      ...state,
      document: {
        ...state.document,
        basics: {
          ...state.document.basics,
          photo: { enabled: true, assetRef: 'asset_missing_blob' },
        },
      },
    }
  })
}

describe('PreviewPane', () => {
  it('renders nothing without an open draft', () => {
    render(<PreviewPane />)
    expect(document.getElementById('cv-preview')).toBeNull()
  })

  it('mounts the ATS renderer for the stored mode, structurally photo-free', async () => {
    openNamedDocumentWithPhoto()
    render(<PreviewPane />)

    // Lazy chunk resolves async; the name heading proves the renderer mounted.
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Budi Santoso')
    expect(document.querySelector('#cv-preview .cv-ats')).not.toBeNull()
    // AC-002-a at UI level: the photo exists in the document but never in ATS output.
    expect(document.querySelector('#cv-preview img')).toBeNull()
    expect(screen.getByRole('region', { name: 'Pratinjau CV' })).toBeInTheDocument()
  })

  it('mounts the Creative renderer after toggling, with the photo placeholder', async () => {
    const user = userEvent.setup()
    openNamedDocumentWithPhoto()
    render(<PreviewPane />)
    await screen.findByRole('heading', { level: 1 })

    await user.click(screen.getByRole('radio', { name: 'Creative' }))

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Budi Santoso')
    expect(document.querySelector('#cv-preview .cv-creative')).not.toBeNull()
    // No blob in fake IndexedDB: the injected resolver yields no URL, so the
    // renderer shows its neutral placeholder (the resolved path is proven by
    // the node renderer tests and the real-browser e2e).
    expect(document.querySelector('#cv-preview img')).toBeNull()
    expect(document.querySelector('#cv-preview [aria-hidden="true"]')).not.toBeNull()
  })

  it('shows the photo notice in ATS mode with a photo, once per session', async () => {
    const user = userEvent.setup()
    openNamedDocumentWithPhoto()
    render(<PreviewPane />)
    await screen.findByRole('heading', { level: 1 })

    expect(screen.getByText(/Versi ATS menyembunyikan foto/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tutup pemberitahuan' }))
    expect(screen.queryByText(/Versi ATS menyembunyikan foto/)).not.toBeInTheDocument()
  })

  it('passes the axe audit with the ATS renderer mounted', async () => {
    openNamedDocument()
    render(<PreviewPane />)
    await screen.findByRole('heading', { level: 1 })

    const results = await axe.run(document.body, { resultTypes: ['violations'] })
    const summary = results.violations
      .map(
        (violation) => `${violation.id}: ${violation.nodes.map((node) => node.html).join(' | ')}`,
      )
      .join('\n')
    expect(summary, summary).toBe('')
  })

  it('passes the axe audit with the Creative renderer mounted', async () => {
    const user = userEvent.setup()
    openNamedDocument()
    render(<PreviewPane />)
    await screen.findByRole('heading', { level: 1 })
    await user.click(screen.getByRole('radio', { name: 'Creative' }))
    await screen.findByRole('heading', { level: 1 })

    const results = await axe.run(document.body, { resultTypes: ['violations'] })
    const summary = results.violations
      .map(
        (violation) => `${violation.id}: ${violation.nodes.map((node) => node.html).join(' | ')}`,
      )
      .join('\n')
    expect(summary, summary).toBe('')
  })
})
