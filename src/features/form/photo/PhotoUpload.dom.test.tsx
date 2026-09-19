import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { loadAsset } from '../../../storage'
import { documentStore } from '../../store/document-store'
import { uiStore } from '../../store/ui-store'
import * as storageApi from '../../../storage'
import { PhotoUpload } from './PhotoUpload'
import { openTestDocument, resetFormStores, runAxe, teardownFormStores } from '../test-utils'
import { StorageFullError } from '../../../storage'

beforeEach(async () => {
  await resetFormStores()
  openTestDocument()
})

afterEach(async () => {
  await teardownFormStores()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function renderUpload() {
  return render(
    <main>
      <PhotoUpload photo={documentStore.getState().document?.basics.photo} />
    </main>,
  )
}

function stubCanvasPipeline(): void {
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn(async () => ({ width: 1200, height: 900 }) as ImageBitmap),
  )
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D)
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/webp;base64,xxxx')
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => {
    callback(new Blob(['compressed-bytes'], { type: 'image/webp' }))
  })
}

describe('PhotoUpload input validation (D18)', () => {
  it('rejects a 3 MB photo with a friendly message that names the limit (AC)', async () => {
    const user = userEvent.setup()
    const saveAssetSpy = vi.spyOn(storageApi, 'saveAsset')
    renderUpload()

    const file = new File([new ArrayBuffer(3 * 1024 * 1024)], 'besar.jpg', { type: 'image/jpeg' })
    await user.upload(screen.getByLabelText('Pilih foto'), file)

    expect(await screen.findByText(/melebihi 2 MB/)).toBeInTheDocument()
    expect(saveAssetSpy).not.toHaveBeenCalled()
    expect(documentStore.getState().document?.basics.photo?.assetRef).toBeUndefined()
  })

  it('rejects unsupported types without touching storage', async () => {
    const saveAssetSpy = vi.spyOn(storageApi, 'saveAsset')
    renderUpload()

    // A file picker filters by `accept`, but drag-and-drop or an
    // "all files" override bypasses it — dispatch directly to reach that path.
    const file = new File([new ArrayBuffer(10)], 'gambar.gif', { type: 'image/gif' })
    fireEvent.change(screen.getByLabelText('Pilih foto'), { target: { files: [file] } })

    expect(await screen.findByText(/Format foto belum didukung/)).toBeInTheDocument()
    expect(saveAssetSpy).not.toHaveBeenCalled()
  })
})

describe('PhotoUpload compression + storage (D18 pipeline)', () => {
  it('compresses a 1.5 MB photo and stores the Blob in the assets store (AC)', async () => {
    const user = userEvent.setup()
    stubCanvasPipeline()
    renderUpload()

    const file = new File([new ArrayBuffer(1_500_000)], 'pasfoto.jpg', { type: 'image/jpeg' })
    await user.upload(screen.getByLabelText('Pilih foto'), file)

    await waitFor(() => {
      expect(documentStore.getState().document?.basics.photo?.assetRef).toMatch(/^photo_/)
    })
    const ref = documentStore.getState().document?.basics.photo?.assetRef
    if (ref === undefined) throw new Error('unreachable')
    const stored = await loadAsset(ref)
    // jsdom's structured clone of a Blob loses its prototype, so identity is
    // not assertable here — existence is. Blob round-trip integrity is proven
    // by the storage repository tests (node environment).
    expect(stored).not.toBeNull()
  })

  it('keeps the text draft intact and shows a clear message when the quota is full', async () => {
    const user = userEvent.setup()
    stubCanvasPipeline()
    vi.spyOn(storageApi, 'saveAsset').mockRejectedValue(new StorageFullError())
    updateName('Budi Santoso')
    renderUpload()

    const file = new File([new ArrayBuffer(1_500_000)], 'pasfoto.jpg', { type: 'image/jpeg' })
    await user.upload(screen.getByLabelText('Pilih foto'), file)

    expect(await screen.findByText(/Kuota penyimpanan perangkat penuh/)).toBeInTheDocument()
    // The text draft is untouched (edge case: quota full on photo save).
    expect(documentStore.getState().document?.basics.name).toBe('Budi Santoso')
    expect(documentStore.getState().document?.basics.photo?.assetRef).toBeUndefined()
  })
})

describe('PhotoUpload ATS notice (F-C3)', () => {
  it('explains why the photo is hidden while ATS mode is active — verbatim copy', () => {
    uiStore.setState({ mode: 'ats' })
    renderUpload()
    expect(
      screen.getByText(
        'Versi ATS menyembunyikan foto agar aman dibaca sistem pelacak lamaran. Foto Anda tetap tersimpan dan muncul di versi Creative.',
      ),
    ).toBeInTheDocument()
  })

  it('does not show the ATS notice in creative mode', () => {
    uiStore.setState({ mode: 'creative' })
    renderUpload()
    expect(screen.queryByText(/Versi ATS menyembunyikan foto/)).not.toBeInTheDocument()
  })
})

describe('PhotoUpload accessibility', () => {
  it('passes the axe audit in ATS mode with the notice visible', async () => {
    uiStore.setState({ mode: 'ats' })
    const { container } = renderUpload()
    await runAxe(container)
  })
})

function updateName(name: string): void {
  const state = documentStore.getState()
  if (state.document === null) throw new Error('expected an open document')
  documentStore.setState({
    ...state,
    document: { ...state.document, basics: { ...state.document.basics, name } },
  })
}
