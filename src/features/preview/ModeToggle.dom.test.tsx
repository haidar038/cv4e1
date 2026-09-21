import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { documentStore } from '../store/document-store'
import { uiStore } from '../store/ui-store'
import { openTestDocument, resetFormStores, teardownFormStores } from '../form/test-utils'
import { ModeToggle } from './ModeToggle'

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

function withoutMode(value: unknown): unknown {
  const copy = JSON.parse(JSON.stringify(value)) as {
    meta?: Record<string, unknown>
  }
  if (copy.meta !== undefined) delete copy.meta.mode
  return copy
}

describe('ModeToggle', () => {
  it('renders nothing without an open draft', () => {
    render(<ModeToggle />)
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
  })

  it('offers ATS and Creative with the stored mode checked', () => {
    openTestDocument()
    render(<ModeToggle />)
    // fieldset + legend exposes the group (same-name radios share one native
    // keyboard group); the legend names it for assistive technology.
    expect(screen.getByRole('group', { name: 'Mode tampilan CV' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'ATS' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Creative' })).not.toBeChecked()
  })

  it('switching mode changes only meta.mode — the AC-003-a invariant at UI level', async () => {
    const user = userEvent.setup()
    openNamedDocument()
    const before = documentStore.getState().document
    render(<ModeToggle />)

    await user.click(screen.getByRole('radio', { name: 'Creative' }))

    expect(uiStore.getState().mode).toBe('creative')
    const after = documentStore.getState().document
    expect(after?.meta?.mode).toBe('creative')
    expect(withoutMode(after)).toEqual(withoutMode(before))
  })

  it('announces the change to screen readers and keeps focus on the control', async () => {
    const user = userEvent.setup()
    openTestDocument()
    render(<ModeToggle />)

    expect(screen.getByRole('status')).toHaveTextContent('Mode ATS aktif')
    const creative = screen.getByRole('radio', { name: 'Creative' })
    await user.click(creative)

    expect(screen.getByRole('status')).toHaveTextContent('Mode Creative aktif')
    expect(creative).toHaveFocus()
  })

  it('is keyboard-operable with arrows and survives rapid toggling without a race', async () => {
    const user = userEvent.setup()
    openTestDocument()
    render(<ModeToggle />)

    const ats = screen.getByRole('radio', { name: 'ATS' })
    ats.focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'Creative' })).toBeChecked()

    // Rapid round-trip: the last action wins, state stays consistent.
    await user.keyboard('{ArrowLeft}')
    await user.keyboard('{ArrowRight}')
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('radio', { name: 'ATS' })).toBeChecked()
    expect(uiStore.getState().mode).toBe('ats')
    expect(documentStore.getState().document?.meta?.mode).toBe('ats')
  })

  it('passes the axe audit', async () => {
    openTestDocument()
    // Mounted inside its labelled preview region, as in the real shell, so
    // the landmark-scoped `region` rule judges the honest tree.
    render(
      <section aria-label="Pratinjau CV">
        <ModeToggle />
      </section>,
    )

    const results = await axe.run(document.body, { resultTypes: ['violations'] })
    const summary = results.violations
      .map(
        (violation) => `${violation.id}: ${violation.nodes.map((node) => node.html).join(' | ')}`,
      )
      .join('\n')
    expect(summary, summary).toBe('')
  })
})
