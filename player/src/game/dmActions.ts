// One-shot commands against somebody else's sheet.
//
// `useServerGame` is the right tool when you are holding a character: it loads
// the sheet, keeps a revision, predicts, reconciles. The DM handing loot to
// four players needs none of that and cannot have it anyway — a hook per
// recipient is not something React will let you write in a loop.
//
// So this sends a single command and gets out. It reads the target's current
// revision immediately beforehand rather than caching one, because the DM is
// not tracking that sheet and any revision it held would be a guess.

import { supabase } from '../supabase'
import { loadSheet } from './sheetStore'
import type { PlayerCommand } from '@engine'

export interface OneShotResult {
  ok: boolean
  error?: string
}

export async function sendAsDm(
  characterId: string, command: PlayerCommand
): Promise<OneShotResult> {
  try {
    const stored = await loadSheet(supabase(), characterId)
    if (!stored) return { ok: false, error: 'that character has no sheet yet' }

    const { data, error } = await supabase().functions.invoke('command', {
      body: { characterId, command, revision: stored.revision }
    })
    if (error) return { ok: false, error: error.message }
    if (data?.rejected) return { ok: false, error: (data.rejected as string[]).join(' · ') }
    if (data?.conflict) {
      return { ok: false, error: 'somebody changed that sheet just now — try again' }
    }
    return { ok: true }
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
