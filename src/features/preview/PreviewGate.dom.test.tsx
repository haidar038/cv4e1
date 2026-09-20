import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import axe from 'axe-core'
import { documentStore } from '../store/document-store'
import { PreviewGate } from './PreviewGate'
import { openTestDocument, resetFormStores, teardownFormStores } from '../form/test-utils'

function setUrl(search: string): void {
  window.history.replaceState(null, '', `/${search}`)
}

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

beforeEach(async () => {
  await resetFormStores()
})

afterEach(async () => {
  setUrl('')
  await teardownFormStores()
})

/**
 * Task 10 preview gate: the ATS renderer mounts only behind `?preview=ats`
 * with an open draft. Task 12 replaces this surface with the PreviewPane.
 */
describe('PreviewGate', () => {
  it('renders nothing without the query parameter, even with a draft open', async () => {
    openTestDocument()
    render(<PreviewGate />)
    expect(document.getElementById('cv-preview')).toBeNull()
  })

  it('renders nothing with the parameter but no open draft', () => {
    setUrl('?preview=ats')
    render(<PreviewGate />)
    expect(document.getElementById('cv-preview')).toBeNull()
  })

  it('mounts the lazy ATS renderer when the gate is active and a draft is open', async () => {
    setUrl('?preview=ats')
    openNamedDocument()
    render(<PreviewGate />)

    // Lazy chunk resolves async; the name heading proves the renderer mounted.
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Budi Santoso')
    expect(document.getElementById('cv-preview')).not.toBeNull()
    expect(screen.getByRole('region', { name: 'Pratinjau CV' })).toBeInTheDocument()
  })

  it('passes the axe audit with the renderer mounted', async () => {
    setUrl('?preview=ats')
    openNamedDocument()
    render(<PreviewGate />)
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
