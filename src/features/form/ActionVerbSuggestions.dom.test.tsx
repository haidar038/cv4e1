import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { documentStore } from '../store/document-store'
import { getVerbCategories, getVerbsForSection } from '../../content/action-verbs'
import { ExperienceForm } from './sections/ExperienceForm'
import { EducationForm } from './sections/EducationForm'
import { SkillsForm } from './sections/SkillsForm'
import { ActionVerbSuggestionsPanel, groupVerbsByCategory } from './ActionVerbSuggestionsPanel'
import { openTestDocument, resetFormStores, runAxe, teardownFormStores } from './test-utils'

beforeEach(async () => {
  await resetFormStores()
  openTestDocument()
})

afterEach(async () => {
  await teardownFormStores()
})

/**
 * Task 13b (FR-205, FR-206, J4): section-aware verb suggestions next to every
 * bullet row of Experience, Organizations and Projects — keyboard operable,
 * inserting at the caret without ever overwriting user text. The panel is an
 * inline disclosure (no portal), so container-scoped axe audits cover it.
 */
describe('ActionVerbSuggestions (ExperienceForm integration)', () => {
  async function renderWithBulletRows(user: ReturnType<typeof userEvent.setup>, rowCount = 1) {
    render(
      <main>
        <ExperienceForm />
      </main>,
    )
    await user.click(screen.getByRole('button', { name: 'Tambah Pengalaman' }))
    for (let index = 0; index < rowCount; index += 1) {
      await user.click(screen.getByRole('button', { name: 'Tambah Poin pencapaian' }))
    }
  }

  function openPanel(user: ReturnType<typeof userEvent.setup>) {
    return user.click(
      screen.getByRole('button', { name: 'Saran kata kerja Pengalaman Poin pencapaian 1' }),
    )
  }

  function panel() {
    return screen.getByRole('group', { name: 'Saran kata kerja' })
  }

  it('names each row trigger unambiguously (section + row in the accessible name)', async () => {
    const user = userEvent.setup()
    await renderWithBulletRows(user, 2)

    expect(
      screen.getByRole('button', { name: 'Saran kata kerja Pengalaman Poin pencapaian 1' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Saran kata kerja Pengalaman Poin pencapaian 2' }),
    ).toBeInTheDocument()
  })

  it('lists the section-filtered catalog grouped by category with the phrase pattern', async () => {
    const user = userEvent.setup()
    await renderWithBulletRows(user)
    await openPanel(user)

    expect(within(panel()).getByRole('button', { name: 'Memimpin' })).toBeInTheDocument()
    expect(within(panel()).getByText(/Memimpin \[jumlah\]/)).toBeInTheDocument()
    // Category headings come from the catalog, not hardcoded strings.
    expect(within(panel()).getByRole('group', { name: 'Manajerial' })).toBeInTheDocument()
  })

  it('inserts the verb at the caret into the store and returns focus (mid-word)', async () => {
    const user = userEvent.setup()
    await renderWithBulletRows(user)
    const input = screen.getByLabelText('Poin pencapaian 1') as HTMLInputElement
    await user.type(input, 'Membuat')
    input.setSelectionRange(3, 3)

    await openPanel(user)
    await user.click(within(panel()).getByRole('button', { name: 'Memimpin' }))

    await waitFor(() => expect(input).toHaveFocus())
    expect(input).toHaveValue('Mem Memimpin buat')
    expect(input.selectionStart).toBe(13)
    expect(
      screen.getByRole('button', { name: 'Saran kata kerja Pengalaman Poin pencapaian 1' }),
    ).toHaveAttribute('aria-expanded', 'false')
    expect(documentStore.getState().document?.sections.experience?.[0]?.highlights).toEqual([
      'Mem Memimpin buat',
    ])
  })

  it('is fully keyboard operable: open, arrows, insert, focus back to the editor', async () => {
    const user = userEvent.setup()
    await renderWithBulletRows(user)
    const trigger = screen.getByRole('button', {
      name: 'Saran kata kerja Pengalaman Poin pencapaian 1',
    })
    await user.click(trigger)

    const verbs = within(panel()).getAllByRole('button')
    expect(verbs[0]).toHaveFocus()

    await user.keyboard('{ArrowDown}')
    expect(verbs[1]).toHaveFocus()
    await user.keyboard('{End}')
    expect(verbs[verbs.length - 1]).toHaveFocus()
    await user.keyboard('{Home}')
    expect(verbs[0]).toHaveFocus()

    const picked = verbs[0]?.textContent ?? ''
    await user.keyboard('{Enter}')

    const input = screen.getByLabelText('Poin pencapaian 1') as HTMLInputElement
    await waitFor(() => expect(input).toHaveFocus())
    expect(input).toHaveValue(picked)
    expect(input.selectionStart).toBe(picked.length)
    expect(documentStore.getState().document?.sections.experience?.[0]?.highlights).toEqual([
      picked,
    ])
  })

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup()
    await renderWithBulletRows(user)
    const trigger = screen.getByRole('button', {
      name: 'Saran kata kerja Pengalaman Poin pencapaian 1',
    })
    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    await user.keyboard('{Escape}')

    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveFocus()
  })

  it('passes the axe audit with the panel open', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <main>
        <ExperienceForm />
      </main>,
    )
    await user.click(screen.getByRole('button', { name: 'Tambah Pengalaman' }))
    await user.click(screen.getByRole('button', { name: 'Tambah Poin pencapaian' }))
    await user.click(
      screen.getByRole('button', { name: 'Saran kata kerja Pengalaman Poin pencapaian 1' }),
    )
    expect(panel()).toBeInTheDocument()

    await runAxe(container)
  })
})

describe('sections without suggestions (plan AC: no suggestions where irrelevant)', () => {
  it('keeps Education trigger-free even with bullet rows present', async () => {
    const user = userEvent.setup()
    render(
      <main>
        <EducationForm />
      </main>,
    )
    await user.click(screen.getByRole('button', { name: 'Tambah Pendidikan' }))
    await user.click(screen.getByRole('button', { name: 'Tambah Poin pencapaian' }))
    expect(screen.getByLabelText('Poin pencapaian 1')).toBeInTheDocument()

    expect(screen.queryByRole('button', { name: /Saran kata kerja/ })).toBeNull()
  })

  it('keeps Skills trigger-free even with item rows present', async () => {
    const user = userEvent.setup()
    render(
      <main>
        <SkillsForm />
      </main>,
    )
    await user.click(screen.getByRole('button', { name: 'Tambah grup' }))
    await user.click(screen.getByRole('button', { name: 'Tambah Keahlian' }))
    expect(screen.getByLabelText('Keahlian 1')).toBeInTheDocument()

    expect(screen.queryByRole('button', { name: /Saran kata kerja/ })).toBeNull()
  })
})

describe('ActionVerbSuggestionsPanel (pure helpers and defensive paths)', () => {
  it('groups the section catalog by catalog category, dropping empty groups', () => {
    const groups = groupVerbsByCategory(getVerbsForSection('experience'))
    expect(groups.length).toBeGreaterThan(0)
    const categories = getVerbCategories()
    for (const group of groups) {
      expect(categories).toContain(group.category)
      expect(group.verbs.length).toBeGreaterThan(0)
    }
    expect(groups.map((group) => group.category)).toEqual(
      categories.filter((category) => groups.some((group) => group.category === category)),
    )
  })

  it('handles an empty catalog with a graceful empty state, not an error', () => {
    render(
      <ActionVerbSuggestionsPanel
        section="experience"
        onPick={() => {}}
        onRequestClose={() => {}}
        verbs={[]}
      />,
    )
    expect(screen.getByText('Belum ada saran kata kerja untuk bagian ini.')).toBeInTheDocument()
  })
})
