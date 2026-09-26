import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { documentStore } from '../store/document-store'
import { uiStore } from '../store/ui-store'
import { resetFormStores, runAxe, teardownFormStores } from '../form/test-utils'
import { STORAGE_NOTICE_KEY } from './storage-prefs'
import { StorageNoticeBanner, StorageNoticeFooter } from './StorageNotice'

const VERBATIM =
  'Data Anda tersimpan di peramban pada perangkat ini. Membersihkan data peramban, mode penyamaran, atau pembersihan otomatis dapat menghapus draft Anda. Gunakan Ekspor Draft untuk membuat salinan cadangan.'

function openSavedDocument(): void {
  documentStore.setState({
    document: {
      schemaVersion: '1.0.0',
      basics: { name: 'Budi Santoso' },
      sections: {},
      meta: { locale: 'id', mode: 'ats' },
    },
    draftId: 'draft_1',
    dirty: false,
    lastSavedAt: 123,
    externalNotice: null,
  })
}

beforeEach(async () => {
  await resetFormStores()
  localStorage.removeItem(STORAGE_NOTICE_KEY)
})

afterEach(async () => {
  await teardownFormStores()
})

describe('StorageNotice (Task 15, FR-109)', () => {
  it('uses the verbatim strategy text in both the banner and the footer', () => {
    openSavedDocument()
    render(
      <>
        <StorageNoticeBanner />
        <StorageNoticeFooter />
      </>,
    )

    // Live-region rule (Task 14): role + text, never role + name.
    expect(screen.getByRole('status')).toHaveTextContent(VERBATIM)
    expect(screen.getByRole('contentinfo')).toHaveTextContent(VERBATIM)
  })

  it('stays hidden before the first successful save — never on an empty first visit', () => {
    render(
      <>
        <StorageNoticeBanner />
        <StorageNoticeFooter />
      </>,
    )

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    // The footer is the permanent home: always visible, even with no draft.
    expect(screen.getByRole('contentinfo')).toHaveTextContent(VERBATIM)
  })

  it('dismissing the banner acknowledges it without touching the footer', async () => {
    const user = userEvent.setup()
    openSavedDocument()
    render(
      <>
        <StorageNoticeBanner />
        <StorageNoticeFooter />
      </>,
    )

    await user.click(screen.getByRole('button', { name: 'Mengerti' }))

    expect(localStorage.getItem(STORAGE_NOTICE_KEY)).toBe('1')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('shows the translated notice for the en locale instead of blanking generic guidance (FR-702)', () => {
    openSavedDocument()
    uiStore.setState({ locale: 'en' })
    render(
      <>
        <StorageNoticeBanner />
        <StorageNoticeFooter />
      </>,
    )

    const englishNotice =
      'Your data is stored in the browser on this device. Clearing browser data, private mode, or automatic cleanup can delete your drafts. Use Export to keep a backup copy.'
    expect(screen.getByRole('status')).toHaveTextContent(englishNotice)
    expect(screen.getByRole('contentinfo')).toHaveTextContent(englishNotice)
    // The Indonesian verbatim never leaks into the English interface.
    expect(screen.queryByText(VERBATIM)).not.toBeInTheDocument()
  })

  it('passes the axe audit with the banner visible', async () => {
    openSavedDocument()
    render(
      <>
        <StorageNoticeBanner />
        <StorageNoticeFooter />
      </>,
    )
    await runAxe(document.body)
  })

  it('shows the AGPL legal line with source, license, and about links (F4e)', () => {
    openSavedDocument()
    render(<StorageNoticeFooter />)

    const footer = screen.getByRole('contentinfo')
    expect(footer).toHaveTextContent('cv4every1 © 2026 M. Khaidar')
    expect(footer).toHaveTextContent('AGPL-3.0')
    expect(screen.getByRole('link', { name: 'Lisensi' })).toHaveAttribute(
      'href',
      'https://github.com/haidar038/cv4e1/blob/main/LICENSE',
    )
    expect(screen.getByRole('link', { name: 'Kode sumber' })).toHaveAttribute(
      'href',
      'https://github.com/haidar038/cv4e1',
    )
    expect(screen.getByRole('link', { name: 'Tentang' })).toHaveAttribute('href', '/landing.html')
  })

  it('points the about link at the English landing under the en locale (F4e)', () => {
    openSavedDocument()
    uiStore.setState({ locale: 'en' })
    render(<StorageNoticeFooter />)

    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/landing-en.html')
    expect(screen.getByRole('contentinfo')).toHaveTextContent('free software')
  })
})
