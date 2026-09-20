import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StringListEditor } from './StringListEditor'

/**
 * Component-level behaviour of the row editor itself, including the Task 13b
 * per-row slot (renderRowSlot) that ActionVerbSuggestions plugs into.
 *
 * The harness mirrors the real store contract: `onCommit` results flow back
 * into `values`, otherwise the editor's external-adoption logic would (by
 * design) discard the local edit as stale.
 */
describe('StringListEditor', () => {
  function StatefulHarness({
    initial,
    onCommit,
    renderRowSlot,
  }: {
    initial?: string[]
    onCommit?: (values: string[]) => void
    renderRowSlot?:
      | ((args: { position: number; insertAtCursor: (text: string) => void }) => React.ReactNode)
      | undefined
  }) {
    const [values, setValues] = useState<string[] | undefined>(initial)
    return (
      <StringListEditor
        label="Poin"
        addItemLabel="Tambah Poin"
        removeRowAria={(position) => `Hapus Poin ${position}`}
        maxLength={400}
        values={values}
        onCommit={(next) => {
          setValues(next)
          onCommit?.(next)
        }}
        renderRowSlot={renderRowSlot}
      />
    )
  }

  it('renders one labelled row per value', () => {
    render(<StatefulHarness initial={['alpha', 'beta']} />)
    expect(screen.getByLabelText('Poin 1')).toHaveValue('alpha')
    expect(screen.getByLabelText('Poin 2')).toHaveValue('beta')
  })

  it('commits the non-empty projection while typing and clears to empty', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()
    render(<StatefulHarness onCommit={onCommit} />)
    await user.click(screen.getByRole('button', { name: 'Tambah Poin' }))

    const input = screen.getByLabelText('Poin 1')
    await user.type(input, 'A')
    expect(onCommit).toHaveBeenLastCalledWith(['A'])

    await user.clear(input)
    expect(onCommit).toHaveBeenLastCalledWith([])
  })

  it('renders the per-row slot with each row position', () => {
    render(
      <StatefulHarness
        initial={['alpha', 'beta']}
        renderRowSlot={({ position }) => <button type="button">ekstra {position}</button>}
      />,
    )
    expect(screen.getByRole('button', { name: 'ekstra 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ekstra 2' })).toBeInTheDocument()
  })

  it('renders no slot content when renderRowSlot is omitted', () => {
    render(<StatefulHarness initial={['alpha']} />)
    expect(screen.queryByText(/ekstra/)).toBeNull()
  })

  it('inserts from the slot at the caret and restores focus and caret', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()
    render(
      <StatefulHarness
        initial={['abc']}
        onCommit={onCommit}
        renderRowSlot={({ insertAtCursor }) => (
          <button type="button" onClick={() => insertAtCursor('Memimpin')}>
            sisip
          </button>
        )}
      />,
    )
    const input = screen.getByLabelText('Poin 1') as HTMLInputElement
    input.focus()
    input.setSelectionRange(1, 1)

    await user.click(screen.getByRole('button', { name: 'sisip' }))

    expect(input).toHaveValue('a Memimpin bc')
    expect(onCommit).toHaveBeenLastCalledWith(['a Memimpin bc'])
    // The click blurred the input; the editor gives focus and the caret back.
    await waitFor(() => expect(input).toHaveFocus())
    // Caret sits after the inserted verb and its trailing separator.
    expect(input.selectionStart).toBe(11)
  })

  it('inserts at the end when the row input was never focused', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()
    render(
      <StatefulHarness
        initial={['abc']}
        onCommit={onCommit}
        renderRowSlot={({ insertAtCursor }) => (
          <button type="button" onClick={() => insertAtCursor('Memimpin')}>
            sisip
          </button>
        )}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'sisip' }))

    expect(screen.getByLabelText('Poin 1')).toHaveValue('abc Memimpin')
    expect(onCommit).toHaveBeenLastCalledWith(['abc Memimpin'])
  })
})
