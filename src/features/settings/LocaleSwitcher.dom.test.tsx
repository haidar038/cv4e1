import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LocaleSwitcher } from './LocaleSwitcher'
import { initLocalePreference, readStoredLocale, setLocale } from '../store/actions'
import { uiStore } from '../store/ui-store'
import { resetFormStores, runAxe, teardownFormStores } from '../form/test-utils'

const STORAGE_KEY = 'cv4every1:locale'

beforeEach(async () => {
  await resetFormStores()
  localStorage.removeItem(STORAGE_KEY)
})

afterEach(async () => {
  await teardownFormStores()
  localStorage.removeItem(STORAGE_KEY)
  document.documentElement.lang = 'id'
})

function renderSwitcher() {
  return render(
    <main>
      <LocaleSwitcher />
    </main>,
  )
}

describe('LocaleSwitcher (FR-701)', () => {
  it('starts in Indonesian with Indonesia checked', () => {
    renderSwitcher()
    expect(screen.getByText('Bahasa antarmuka')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Indonesia' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Inggris' })).not.toBeChecked()
  })

  it('switches to English through the real action and persists the choice', async () => {
    const user = userEvent.setup()
    renderSwitcher()

    await user.click(screen.getByRole('radio', { name: 'Inggris' }))

    expect(uiStore.getState().locale).toBe('en')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('en')
    // The interface itself flips: legend and options come from the EN pack.
    expect(screen.getByText('Interface language')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'English' })).toBeChecked()
    // Screen-reader pronunciation follows the page language.
    expect(document.documentElement.lang).toBe('en')
    // The switch is announced in the new language.
    expect(screen.getByRole('status')).toHaveTextContent('English language active')
  })

  it('switches back to Indonesian and persists that too', async () => {
    const user = userEvent.setup()
    renderSwitcher()

    await user.click(screen.getByRole('radio', { name: 'Inggris' }))
    await user.click(screen.getByRole('radio', { name: 'Indonesian' }))

    expect(uiStore.getState().locale).toBe('id')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('id')
    expect(screen.getByText('Bahasa antarmuka')).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('id')
  })

  it('is keyboard-operable: arrows move between the two languages', async () => {
    const user = userEvent.setup()
    renderSwitcher()

    const indonesian = screen.getByRole('radio', { name: 'Indonesia' })
    indonesian.focus()
    expect(indonesian).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    // Labels flip with the pack: the second option is now named in English.
    const english = screen.getByRole('radio', { name: 'English' })
    expect(english).toBeChecked()
    expect(english).toHaveFocus()
    expect(uiStore.getState().locale).toBe('en')
  })

  it('passes the scoped axe audit', async () => {
    const { container } = renderSwitcher()
    await runAxe(container)
  })
})

describe('locale preference storage (FR-701)', () => {
  it('reads nothing when no preference is stored', () => {
    expect(readStoredLocale()).toBeNull()
  })

  it('ignores an unrecognized stored value', () => {
    localStorage.setItem(STORAGE_KEY, 'de')
    expect(readStoredLocale()).toBeNull()
  })

  it('setLocale writes the store and the storage together', () => {
    setLocale('en')
    expect(uiStore.getState().locale).toBe('en')
    expect(readStoredLocale()).toBe('en')
  })

  it('initLocalePreference restores a stored choice without touching documents', () => {
    localStorage.setItem(STORAGE_KEY, 'en')
    initLocalePreference()
    expect(uiStore.getState().locale).toBe('en')
  })
})
