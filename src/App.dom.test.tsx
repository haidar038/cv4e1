import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { openTestDocument, resetFormStores, teardownFormStores } from './features/form/test-utils'

beforeEach(async () => {
  await resetFormStores()
})

afterEach(async () => {
  await teardownFormStores()
})

/**
 * App shell mobile tabs (Task 12): one pane at a time on mobile, both
 * side by side on desktop. Both panes stay mounted — mobile hides one with
 * `hidden`, desktop (`lg:`) always shows both.
 */
describe('App workspace tabs', () => {
  it('shows neither tabs nor preview in the empty state', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: 'Buat CV pertama' })).toBeInTheDocument()
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    expect(document.getElementById('cv-preview')).toBeNull()
  })

  it('switches panes on mobile while keeping both desktop-visible', async () => {
    const user = userEvent.setup()
    openTestDocument()
    render(<App />)

    const formTab = screen.getByRole('tab', { name: 'Form' })
    const previewTab = screen.getByRole('tab', { name: 'Pratinjau' })
    expect(formTab).toHaveAttribute('aria-selected', 'true')
    expect(previewTab).toHaveAttribute('aria-selected', 'false')
    expect(document.getElementById('cv-preview')).not.toBeNull()

    const form = document.getElementById('cv-form')
    const preview = document.getElementById('cv-preview')
    // The visibility wrapper owns `hidden lg:block`: #cv-preview itself sits
    // one level deeper (inside the labelled preview region), so climb two.
    const previewPane = preview?.parentElement?.parentElement
    // Mobile shows the form tab: form plain `flex` (all breakpoints), preview
    // `hidden` on mobile and `lg:block` on desktop where both panes show.
    expect(form?.className).toContain('flex')
    expect(form?.className).not.toContain('hidden')
    expect(previewPane?.className).toContain('hidden')
    expect(previewPane?.className).toContain('lg:block')

    await user.click(previewTab)
    expect(formTab).toHaveAttribute('aria-selected', 'false')
    expect(previewTab).toHaveAttribute('aria-selected', 'true')
    expect(form?.className).toContain('hidden')
    expect(form?.className).toContain('lg:flex')
    expect(previewPane?.className).not.toContain('hidden')

    await user.click(formTab)
    expect(form?.className).not.toContain('hidden')
    expect(previewPane?.className).toContain('hidden')
  })
})
