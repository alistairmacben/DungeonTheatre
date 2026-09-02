// Loading and replacing one character's picture.
//
// Split out of the components that show it because three of them need the same
// answer — the HUD's round portrait, the sheet's standing figure, and the
// picker that replaces both — and threading a load through each separately is
// how they end up disagreeing about whether a portrait exists.

import { useCallback, useEffect, useState } from 'react'
import type { Portrait, PortraitBlobs, PortraitStore } from './portraitStore'

export interface PortraitState {
  portrait: Portrait | null
  /** True until the first load settles, so the UI can avoid flashing initials. */
  loading: boolean
  error: string | null
  save(blobs: PortraitBlobs): Promise<void>
}

/**
 * `store` must be referentially stable across renders — a module constant, or
 * a `useMemo`. It is an effect dependency, and a store rebuilt every render
 * would re-fetch the portrait forever.
 */
export function usePortrait(store: PortraitStore, characterId: string): PortraitState {
  const [portrait, setPortrait] = useState<Portrait | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    store.get(characterId)
      .then((found) => { if (alive) setPortrait(found) })
      .catch(() => { if (alive) setPortrait(null) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [store, characterId])

  const save = useCallback(async (blobs: PortraitBlobs): Promise<void> => {
    setError(null)
    try {
      setPortrait(await store.put(characterId, blobs))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
      throw e
    }
  }, [store, characterId])

  return { portrait, loading, error, save }
}
