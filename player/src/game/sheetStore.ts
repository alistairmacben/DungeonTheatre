// Reading and writing a character sheet.
//
// The sheet lives in `character_sheets`, not in `characters.sheet`. The reason
// is a leak that only shows up when you read the RLS: `characters_select_members`
// lets any campaign member `select('*')`, and the stage relies on that to draw
// NPC names and portraits. A sheet column on that table would therefore hand
// every player the DM's exact enemy hit points. Postgres RLS is row-level, so
// the sheet needs its own row to get its own policy.
//
// Writes carry the revision they were based on. A mismatch means somebody else
// moved first — the DM applying damage while the player equips a shield — and
// the write is refused rather than silently overwriting them.

import type { SupabaseClient } from '@supabase/supabase-js'
import { decodeSheet, encodeSheet, type Character, type Problem } from '@engine'
import { loadContent } from '@engine'

export interface StoredSheet {
  character: Character
  /** The value to send back on the next write. */
  revision: number
  /** Content drift and anything else the codec noticed. Never fatal here. */
  problems: Problem[]
}

export interface SaveResult {
  ok: boolean
  revision?: number
  /** Set when the write was refused because the stored revision had moved on. */
  conflict?: boolean
  error?: string
}

const content = loadContent()

/**
 * Loads one character's sheet.
 *
 * Returns `null` for a character that has no sheet yet — a stage NPC the DM
 * created before any rules data existed, or a player who has not built a
 * character. That is an ordinary state, not an error.
 */
export async function loadSheet(
  db: SupabaseClient, characterId: string
): Promise<StoredSheet | null> {
  const { data, error } = await db
    .from('character_sheets')
    .select('sheet, revision')
    .eq('character_id', characterId)
    .maybeSingle()

  if (error) throw new Error(`could not load sheet: ${error.message}`)
  if (!data) return null

  const decoded = decodeSheet(data.sheet, content)
  if (!decoded.character) {
    // A sheet that exists but will not decode is worth surfacing loudly: it
    // means a schema or content change broke somebody's character, and the
    // codec deliberately does not guess at a migration.
    throw new Error(
      `sheet for ${characterId} could not be read: `
      + decoded.problems.map((p) => p.message).join('; ')
    )
  }
  return { character: decoded.character, revision: data.revision, problems: decoded.problems }
}

/**
 * Writes a sheet, refusing to clobber a newer one.
 *
 * The revision check is done in the `.eq()` rather than read-then-write,
 * because a read-then-write has a race between the two halves that this does
 * not.
 */
export async function saveSheet(
  db: SupabaseClient,
  characterId: string,
  campaignId: string,
  character: Character,
  basedOnRevision: number
): Promise<SaveResult> {
  const next = basedOnRevision + 1
  const { data, error } = await db
    .from('character_sheets')
    .update({
      sheet: encodeSheet(character),
      revision: next,
      updated_at: new Date().toISOString()
    })
    .eq('character_id', characterId)
    .eq('revision', basedOnRevision)
    .select('revision')
    .maybeSingle()

  if (error) return { ok: false, error: error.message }
  if (!data) {
    // Either the row moved on, or it does not exist yet. Distinguishing the two
    // matters: the first is a conflict to reconcile, the second is a first save.
    const { data: existing } = await db
      .from('character_sheets')
      .select('revision')
      .eq('character_id', characterId)
      .maybeSingle()
    if (existing) return { ok: false, conflict: true }
    return createSheet(db, characterId, campaignId, character)
  }
  return { ok: true, revision: data.revision }
}

/** First write for a character that has no sheet row yet. */
export async function createSheet(
  db: SupabaseClient,
  characterId: string,
  campaignId: string,
  character: Character
): Promise<SaveResult> {
  const { data, error } = await db
    .from('character_sheets')
    .insert({
      character_id: characterId,
      campaign_id: campaignId,
      sheet: encodeSheet(character),
      revision: 1
    })
    .select('revision')
    .maybeSingle()

  if (error) return { ok: false, error: error.message }
  return { ok: true, revision: data?.revision ?? 1 }
}

/**
 * Finishes character creation: claims the stage character as the caller's own,
 * then writes its first sheet.
 *
 * The DM casts a Discord user to a stage character — name, portrait, colour —
 * and that row starts with no owner, because nobody has built a rules sheet
 * for it yet. Claiming happens here rather than earlier, so a player who opens
 * the creation form and never finishes has not silently taken the character;
 * finishing creation and taking ownership are the same action.
 *
 * `owner_id is null` in the query is not defence in depth, it is the actual
 * check: the RLS policy only allows the update at all when the row is
 * currently unowned (see `20260820_claim_unowned_character.sql`), so this
 * fails safely against a character somebody already claimed.
 */
export async function claimAndCreateSheet(
  db: SupabaseClient,
  characterId: string,
  campaignId: string,
  character: Character,
  profileId: string
): Promise<SaveResult> {
  const { data: claimed, error: claimError } = await db
    .from('characters')
    .update({ owner_id: profileId })
    .eq('id', characterId)
    .is('owner_id', null)
    .select('id')
    .maybeSingle()

  if (claimError) return { ok: false, error: claimError.message }
  if (!claimed) return { ok: false, error: 'this character already belongs to someone' }

  return createSheet(db, characterId, campaignId, character)
}
