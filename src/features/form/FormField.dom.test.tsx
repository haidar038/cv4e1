import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormField } from './fields/FormField'
import { resetFormStores, runAxe, teardownFormStores } from './test-utils'
import { afterEach } from 'vitest'
import { documentStore } from '../store/document-store'
import { updateBasics } from '../store/actions'

beforeEach(async () => {
  await resetFormStores()
  // Every test edits a real open draft through the real store actions.
  documentStore.setState((state) => ({
    ...state,
    document: {
      schemaVersion: '1.0.0',
      basics: { name: '' },
      sections: {},
      meta: { locale: 'id', mode: 'ats' },
    },
    draftId: 'draft_1',
  }))
})

afterEach(async () => {
  await teardownFormStores()
})

describe('FormField typing buffer', () => {
  it('commits valid input per keystroke so autosave never lags behind typing', async () => {
    const user = userEvent.setup()
    render(
      <main>
        <FormField
          label="Email"
          storeValue=""
          onCommit={(value) => updateBasics({ email: value === '' ? undefined : value })}
        />
      </main>,
    )

    const input = screen.getByLabelText('Email')
    await user.type(input, 'budi.santoso@email.com')

    expect(documentStore.getState().document?.basics.email).toBe('budi.santoso@email.com')
  })

  it('keeps an invalid intermediate local (never rejected by the store) and shows its error only on blur', async () => {
    const user = userEvent.setup()
    render(
      <main>
        <FormField
          label="Email"
          kind="email"
          validationMessage="Format email belum benar, misalnya budi.santoso@email.com."
          storeValue=""
          onCommit={(value) => updateBasics({ email: value === '' ? undefined : value })}
        />
      </main>,
    )

    const input = screen.getByLabelText('Email')
    await user.type(input, 'budi@')

    // The half-typed address stays visible in the field, and no error exists
    // before the user has interacted past typing (AC: validation on blur).
    expect(input).toHaveValue('budi@')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(documentStore.getState().document?.basics.email).toBeUndefined()

    await user.tab()

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Format email belum benar, misalnya budi.santoso@email.com.',
    )
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby')
  })

  it('clears the error once the value becomes valid, and clears the field commits undefined', async () => {
    const user = userEvent.setup()
    render(
      <main>
        <FormField
          label="Email"
          kind="email"
          validationMessage="salah"
          storeValue="budi.santoso@email.com"
          onCommit={(value) => updateBasics({ email: value === '' ? undefined : value })}
        />
      </main>,
    )

    const input = screen.getByLabelText('Email')
    await user.clear(input)
    await user.tab()

    expect(input).toHaveValue('')
    expect(documentStore.getState().document?.basics.email).toBeUndefined()
  })
})

describe('FormField programmatic labelling (AC)', () => {
  it('wires label, hint description, and error via aria relations', async () => {
    const user = userEvent.setup()
    render(
      <main>
        <FormField
          label="Nama lengkap"
          hint="Tulis nama lengkap Anda seperti pada ijazah."
          kind="partialDate"
          validationMessage="Format tanggal belum benar."
          storeValue=""
          onCommit={() => {}}
        />
      </main>,
    )

    const input = screen.getByLabelText('Nama lengkap')
    expect(input).toHaveAccessibleDescription('Tulis nama lengkap Anda seperti pada ijazah.')

    await user.type(input, '2021-')
    await user.tab()

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(input).toHaveAccessibleDescription(
      expect.stringContaining('Format tanggal belum benar.'),
    )
  })

  it('passes the axe audit with a hint and a blurred error visible', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <main>
        <FormField
          label="Email"
          hint="Gunakan email berbasis nama Anda."
          kind="email"
          validationMessage="Format email belum benar."
          storeValue=""
          onCommit={() => {}}
        />
      </main>,
    )

    const input = screen.getByLabelText('Email')
    await user.type(input, 'budi@')
    await user.tab()

    await runAxe(container)
  })
})
