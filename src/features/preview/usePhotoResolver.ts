import { useEffect, useState } from 'react'
import { loadAsset } from '../../storage'

/**
 * The photo seam the Creative renderer consumes (Task 11, plan FR-001):
 * turns the view model's assetRef into a local object URL so render/ never
 * imports storage/ (module boundary). Features/ owns the storage touch.
 *
 * The state is a {ref, url} pair so the resolver answers `undefined` for any
 * ref it did not load — including a stale previous photo while a new one is
 * loading, and always while loading or when the blob cannot be loaded. The
 * renderer shows its neutral placeholder in those cases; text is unaffected.
 */
export type PhotoResolver = (assetRef: string) => string | undefined

export function usePhotoResolver(assetRef: string | undefined): PhotoResolver {
  const [loaded, setLoaded] = useState<{ ref: string; url: string } | null>(null)

  useEffect(() => {
    if (assetRef === undefined) return
    let cancelled = false
    let objectUrl: string | undefined
    void loadAsset(assetRef).then((blob) => {
      if (cancelled || blob === null) return
      objectUrl = URL.createObjectURL(blob)
      setLoaded({ ref: assetRef, url: objectUrl })
    })
    return () => {
      cancelled = true
      if (objectUrl !== undefined) URL.revokeObjectURL(objectUrl)
    }
  }, [assetRef])

  return (ref: string) =>
    ref === assetRef && loaded !== null && loaded.ref === ref ? loaded.url : undefined
}
