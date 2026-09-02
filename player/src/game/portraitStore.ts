// Where a character's picture lives.
//
// Two images per character, from one upload:
//
//  - `full`  the whole picture, shown as the standing figure on the sheet and
//            the inventory screen. Downscaled, never the original bytes.
//  - `head`  a square crop the player chose, shown in the HUD and anywhere a
//            small round portrait reads better than a name.
//
// Two backends behind one interface, because the harness and the real app have
// genuinely different constraints rather than different preferences. `#solo`
// has no backend at all, so it keeps blobs in IndexedDB and the picture never
// leaves the browser. A real campaign uploads to the same public `campaign-art`
// bucket the DM's own art already uses, so the portrait follows the character
// to the DM's stage and to every other player.
//
// Nothing here touches the rules engine: a portrait is not a fact about a
// character sheet, it is a fact about how one is drawn.

import { supabase, storageUrl } from '../supabase'

export interface Portrait {
  /** Displayable URL — an object URL locally, a CDN URL in a campaign. */
  full: string
  head: string
}

export interface PortraitBlobs {
  full: Blob
  head: Blob
}

export interface PortraitStore {
  get(characterId: string): Promise<Portrait | null>
  put(characterId: string, blobs: PortraitBlobs): Promise<Portrait>
}

// ---------------------------------------------------------------------------
// Local — the harness, and anywhere signed-out
// ---------------------------------------------------------------------------

const DB_NAME = 'dungeon-theatre'
const STORE = 'portraits'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function idb<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then((db) => new Promise<T>((resolve, reject) => {
    const request = run(db.transaction(STORE, mode).objectStore(STORE))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  }))
}

/**
 * Blobs in IndexedDB rather than data URLs in localStorage.
 *
 * A 900px WebP is a couple of hundred kilobytes; localStorage's ~5MB ceiling
 * is shared with everything else the app keeps and is measured in UTF-16
 * characters, so base64 would spend roughly 2.7× the file size against it. A
 * party of six would be flirting with a quota error that surfaces as a thrown
 * write in the middle of character creation.
 */
export const localPortraits: PortraitStore = {
  async get(characterId) {
    try {
      const stored = await idb<PortraitBlobs | undefined>('readonly', (s) => s.get(characterId))
      if (!stored) return null
      return { full: URL.createObjectURL(stored.full), head: URL.createObjectURL(stored.head) }
    } catch {
      // A private window can refuse IndexedDB outright. No portrait is a fine
      // outcome; a crashed character sheet is not.
      return null
    }
  },
  async put(characterId, blobs) {
    await idb('readwrite', (s) => s.put(blobs, characterId))
    return { full: URL.createObjectURL(blobs.full), head: URL.createObjectURL(blobs.head) }
  }
}

// ---------------------------------------------------------------------------
// Supabase — a real campaign
// ---------------------------------------------------------------------------

/**
 * Deterministic, and deliberately shaped so the storage policy can verify it.
 *
 * `<campaignId>/portrait/<characterId>.webp` lets the RLS check confirm three
 * things from the path alone: which campaign the file belongs to, that it is a
 * player portrait rather than DM art, and which character — so a player can be
 * allowed to write their own portrait and nothing else.
 */
export function portraitPath(campaignId: string, characterId: string, which: 'full' | 'head'): string {
  return which === 'full'
    ? `${campaignId}/portrait/${characterId}.webp`
    : `${campaignId}/portrait/${characterId}-head.webp`
}

export function supabasePortraits(campaignId: string): PortraitStore {
  return {
    async get(characterId) {
      // Existence has to be checked, not assumed. The paths are deterministic,
      // so it is tempting to hand back URLs and let a missing file 404 on the
      // <img> — but every caller distinguishes "no portrait" (show initials)
      // from "a portrait" by whether this returns null, and a URL that 404s is
      // indistinguishable from a real one until the image fails to decode. The
      // result is a broken-image icon where initials belong.
      const { data, error } = await supabase().storage
        .from('campaign-art')
        .list(`${campaignId}/portrait`, { search: characterId })
      if (error || !data) return null

      const names = new Set(data.map((f) => f.name))
      if (!names.has(`${characterId}.webp`) || !names.has(`${characterId}-head.webp`)) return null

      return {
        full: storageUrl(portraitPath(campaignId, characterId, 'full'))!,
        head: storageUrl(portraitPath(campaignId, characterId, 'head'))!
      }
    },
    async put(characterId, blobs) {
      const bucket = supabase().storage.from('campaign-art')
      for (const which of ['full', 'head'] as const) {
        const { error } = await bucket.upload(
          portraitPath(campaignId, characterId, which),
          which === 'full' ? blobs.full : blobs.head,
          { contentType: 'image/webp', upsert: true, cacheControl: '3600' }
        )
        if (error) throw new Error(error.message)
      }
      // Cache-busted, or the browser shows the picture that was just replaced.
      const stamp = Date.now()
      return {
        full: `${storageUrl(portraitPath(campaignId, characterId, 'full'))}?v=${stamp}`,
        head: `${storageUrl(portraitPath(campaignId, characterId, 'head'))}?v=${stamp}`
      }
    }
  }
}
