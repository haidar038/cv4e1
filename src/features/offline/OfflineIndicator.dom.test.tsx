import { describe, expect, it } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { OfflineIndicator } from './OfflineIndicator'

describe('OfflineIndicator (F-G3)', () => {
  it('stays silent while online, announces while offline', () => {
    render(<OfflineIndicator />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    act(() => {
      window.dispatchEvent(new Event('offline'))
    })
    // Live-region query rule (see e2e/a11y.spec.ts): queried by role alone
    // plus text content — never by accessible name, which neither engine
    // computes from live-region contents.
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent(
      'Anda sedang offline. Semua perubahan tetap tersimpan di perangkat ini.',
    )

    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
