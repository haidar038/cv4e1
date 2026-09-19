import { useEffect, useRef, useState } from 'react'
import { useStore } from 'zustand'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { deleteAsset, loadAsset, saveAsset, StorageFullError } from '../../../storage'
import type { Photo } from '../../../core/schema'
import { TrashIcon, UploadSimpleIcon } from '@phosphor-icons/react'
import { updateBasics } from '../../store/actions'
import { uiStore } from '../../store/ui-store'
import { useMicrocopy } from '../useMicrocopy'
import { compressPhoto, validatePhotoInput } from './compress'

export interface PhotoUploadProps {
  photo: Photo | undefined
}

function createAssetRef(): string {
  const cryptoObject = globalThis.crypto
  if (cryptoObject !== undefined && 'randomUUID' in cryptoObject) {
    return `photo_${cryptoObject.randomUUID()}`
  }
  return `photo_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Photo input (F-B8, D18): validates type and size, compresses via Canvas to
 * the D18 budget, stores the Blob in the `assets` store through `saveAsset`,
 * and links it from `basics.photo.assetRef`. While ATS mode is active the
 * mode-notice from the micro-copy pack explains WHY the photo will not be
 * rendered (F-C3) — the stored photo itself is never touched by the mode.
 */
export function PhotoUpload({ photo }: PhotoUploadProps) {
  const pack = useMicrocopy()
  const mode = useStore(uiStore, (s) => s.mode)
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const assetRef = photo?.assetRef
  // Derive the shown preview from the current ref so removing the photo hides
  // the image without a synchronous setState inside the effect.
  const shownPreviewUrl = assetRef === undefined ? null : previewUrl

  useEffect(() => {
    if (assetRef === undefined) return
    let revoked = false
    let objectUrl: string | null = null
    void loadAsset(assetRef)
      .then((blob) => {
        if (blob === null || revoked) return
        objectUrl = URL.createObjectURL(blob)
        setPreviewUrl(objectUrl)
      })
      .catch(() => {
        // A missing/unreadable asset must not break the form; the notice
        // stays empty and the user can simply upload again.
      })
    return () => {
      revoked = true
      if (objectUrl !== null) URL.revokeObjectURL(objectUrl)
    }
  }, [assetRef])

  const handleFile = async (file: File | undefined) => {
    if (file === undefined) return
    setMessage(null)
    const inputError = validatePhotoInput(file.type, file.size)
    if (inputError !== null) {
      setMessage(pack.photoErrors[inputError])
      return
    }
    setProcessing(true)
    try {
      const compressed = await compressPhoto(file)
      const ref = createAssetRef()
      await saveAsset(ref, compressed)
      if (assetRef !== undefined && assetRef !== ref) {
        void deleteAsset(assetRef).catch(() => {
          // The replaced asset may already be gone; nothing to recover.
        })
      }
      updateBasics({ photo: { enabled: photo?.enabled ?? true, assetRef: ref } })
    } catch (error) {
      // The text draft is untouched either way: photo storage failures never
      // reach the document store.
      setMessage(
        error instanceof StorageFullError
          ? pack.photoErrors.quotaFull
          : pack.photoErrors.compressFailed,
      )
    } finally {
      setProcessing(false)
    }
  }

  const removePhoto = () => {
    setMessage(null)
    if (assetRef !== undefined) {
      void deleteAsset(assetRef).catch(() => {})
    }
    updateBasics({ photo: { enabled: photo?.enabled ?? true } })
  }

  return (
    <Field>
      <FieldLabel>{pack.photoUpload.label}</FieldLabel>
      {mode === 'ats' && pack.photo.atsHiddenNotice !== '' && (
        <Alert>
          <AlertDescription>{pack.photo.atsHiddenNotice}</AlertDescription>
        </Alert>
      )}
      {pack.photo.tips !== '' && <FieldDescription>{pack.photo.tips}</FieldDescription>}
      <div className="flex items-center gap-3">
        {shownPreviewUrl !== null && (
          // Decorative: the adjacent controls carry the meaning, and a photo
          // of the user needs no invented description.
          <img
            src={shownPreviewUrl}
            alt=""
            className="h-16 w-16 border object-cover object-center"
          />
        )}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              <UploadSimpleIcon aria-hidden="true" />
              {assetRef !== undefined ? pack.photoUpload.replace : pack.photoUpload.select}
            </Button>
            {assetRef !== undefined && (
              <Button type="button" variant="ghost" size="sm" onClick={removePhoto}>
                <TrashIcon aria-hidden="true" />
                {pack.photoUpload.remove}
              </Button>
            )}
          </div>
          {processing && <FieldDescription>{pack.photoUpload.processing}</FieldDescription>}
          {message !== null && (
            <p role="alert" className="text-xs font-normal text-destructive">
              {message}
            </p>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label={assetRef !== undefined ? pack.photoUpload.replace : pack.photoUpload.select}
        className="sr-only"
        onChange={(event) => {
          void handleFile(event.target.files?.[0])
          event.target.value = ''
        }}
      />
    </Field>
  )
}
