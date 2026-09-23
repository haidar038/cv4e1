import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { resetFormStores, runAxe, teardownFormStores } from '../form/test-utils'
import { AiSettings } from './AiSettings'
import { ConsentDialog } from './ConsentDialog'
import { consentStore } from './consent-store'
import { clearSessionCredentials, hasSessionCredentials } from './session-keys'

beforeEach(async () => {
  await resetFormStores()
  clearSessionCredentials()
  consentStore.setState({ grants: {} })
})

afterEach(async () => {
  await teardownFormStores()
})

describe('ConsentDialog (Task 18, FR-402)', () => {
  const request = {
    providerName: 'Groq',
    dataFields: ['Deskripsi tugas mentah', 'Bahasa'],
    policyUrl: 'https://groq.com/privacy-policy',
  }

  it('shows provider, data, consequence, and policy link', async () => {
    const user = userEvent.setup()
    let granted = false
    render(
      <ConsentDialog
        open
        request={request}
        onGrant={() => {
          granted = true
        }}
        onDecline={() => {}}
      />,
    )
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Groq')).toBeInTheDocument()
    expect(screen.getByText('Deskripsi tugas mentah')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Baca kebijakan privasi penyedia' })).toHaveAttribute(
      'href',
      'https://groq.com/privacy-policy',
    )
    await user.click(screen.getByRole('button', { name: 'Setuju dan kirim' }))
    expect(granted).toBe(true)
  })

  it('declining — by button or Escape — counts as declined', async () => {
    const user = userEvent.setup()
    let declined = 0
    let granted = 0
    const { rerender } = render(
      <ConsentDialog
        open
        request={request}
        onGrant={() => {
          granted += 1
        }}
        onDecline={() => {
          declined += 1
        }}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Tolak' }))
    expect(declined).toBe(1)
    expect(granted).toBe(0)

    rerender(
      <ConsentDialog
        open
        request={request}
        onGrant={() => {
          granted += 1
        }}
        onDecline={() => {
          declined += 1
        }}
      />,
    )
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(declined).toBe(2)
    expect(granted).toBe(0)
  })
})

describe('AiSettings (Task 18, FR-407/408/110)', () => {
  it('shows the unconfigured reason and saves a Groq key to the session', async () => {
    const user = userEvent.setup()
    render(<AiSettings />)
    expect(
      screen.getAllByText('Belum ada kunci — fitur AI nonaktif. Saran manual tetap tersedia.'),
    ).toHaveLength(2)
    const keyInputs = screen.getAllByLabelText('Kunci API')
    expect(keyInputs).toHaveLength(2)
    await user.type(keyInputs[0] as HTMLElement, 'gsk-test-key')
    const saveButtons = screen.getAllByRole('button', { name: 'Simpan di sesi ini' })
    expect(saveButtons).toHaveLength(2)
    await user.click(saveButtons[0] as HTMLElement)
    expect(hasSessionCredentials('groq')).toBe(true)
    expect(screen.getByText('Kunci tersimpan di sesi ini.')).toBeInTheDocument()
  })

  it('rejects invalid endpoints and incomplete forms before saving', async () => {
    const user = userEvent.setup()
    render(<AiSettings />)
    await user.type(screen.getByLabelText('Alamat endpoint'), 'http://example.com')
    const saveButtons = screen.getAllByRole('button', { name: 'Simpan di sesi ini' })
    expect(saveButtons).toHaveLength(2)
    await user.click(saveButtons[1] as HTMLElement)
    expect(
      await screen.findByText(
        'Alamat tidak valid. Gunakan https, atau http hanya untuk localhost.',
      ),
    ).toBeInTheDocument()
    expect(hasSessionCredentials('openai-compatible')).toBe(false)
  })

  it('grants and revokes session consent from the review dialog', async () => {
    const user = userEvent.setup()
    render(<AiSettings />)
    await user.click(screen.getByRole('button', { name: 'Tinjau persetujuan (Groq)' }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Setuju dan kirim' }))
    expect(
      screen.getByText('Persetujuan sesi ini aktif. Anda bisa mencabutnya kapan saja.'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cabut persetujuan' }))
    expect(
      screen.queryByText('Persetujuan sesi ini aktif. Anda bisa mencabutnya kapan saja.'),
    ).not.toBeInTheDocument()
  })

  it('passes an accessibility audit with the dialog open', async () => {
    const user = userEvent.setup()
    const { container } = render(<AiSettings />)
    await user.click(screen.getByRole('button', { name: 'Tinjau persetujuan (Groq)' }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    await runAxe(container)
  })
})
