// Server authority.
//
// The engine was built pure and portable for precisely this: the same
// `applyCommand` the client runs for prediction runs here for truth. There is
// one implementation and two call sites, which is the property that stops the
// two from disagreeing.
//
// Three things happen here that cannot happen on a client, and they are the
// whole reason this exists:
//
//  1. AUTHORISATION. A player may act on their own character; only the DM may
//     inflict. RLS already prevents reading somebody else's sheet, but it
//     cannot tell a legitimate `equipItem` from a `dmDamage`, because both are
//     writes to a row the caller may write.
//
//  2. THE DICE. The server rolls. A client that supplies its own faces can
//     supply twenties, so the faces arriving in a command are discarded and
//     regenerated here. This is the difference between a dice roller and a
//     game.
//
//  3. ORDERING. The revision check makes two simultaneous writers resolve to a
//     refusal rather than to whichever request happened to land second.

import { createClient } from 'jsr:@supabase/supabase-js@2'
import {
  applyCommand, decodeSheet, encodeSheet, isServerRolled, loadContent, mayIssue
} from '../_shared/engine.mjs'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

// Who-may-issue-what lives in the engine (src/view/authority.ts) so this and
// the client's optimistic path cannot drift apart. Duplicating the list here is
// how a client eventually predicts something the server refuses.

const content = loadContent()

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' }
  })
}

/**
 * How many d20s this command needs, asked of the engine rather than guessed.
 *
 * The client already had to know this to render the roll button, but asking it
 * again here is the point: a client claiming one die for a roll that has
 * disadvantage would otherwise get to keep the better number.
 */
function faceCountFor(character: unknown, command: Record<string, unknown>): number {
  // The reducer rejects a face count that does not match the resolution, so the
  // cheapest correct approach is to try one die and let a mismatch tell us it
  // wanted two. Rolling both up front and discarding is equivalent and simpler.
  const probe = applyCommand(character, { ...command, faces: [1] }, content)
  if (!probe.rejected) return 1
  const message = probe.rejected.reasons.join(' ')
  const match = message.match(/needs (\d+) d20/)
  return match ? Number(match[1]) : 1
}

function rollFaces(count: number): number[] {
  const out = new Uint32Array(count)
  crypto.getRandomValues(out)
  return Array.from(out, (n) => (n % 20) + 1)
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'not signed in' }, 401)

  // The caller's own token, so every query below is subject to the same RLS the
  // client is. The service key is deliberately not used: an authority that
  // bypasses its own access rules is one bug away from leaking everything.
  const db = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: auth } = await db.auth.getUser()
  const user = auth?.user
  if (!user) return json({ error: 'not signed in' }, 401)

  let body: { characterId?: string; command?: Record<string, unknown>; revision?: number }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'body must be JSON' }, 400)
  }

  const { characterId, command } = body
  if (!characterId || !command || typeof command['type'] !== 'string') {
    return json({ error: 'characterId and command are required' }, 400)
  }

  // --- who is asking ------------------------------------------------------
  const { data: character } = await db
    .from('characters')
    .select('id, campaign_id, owner_id, kind')
    .eq('id', characterId)
    .maybeSingle()
  if (!character) return json({ error: 'no such character' }, 404)

  const { data: membership } = await db
    .from('campaign_members')
    .select('role')
    .eq('campaign_id', character.campaign_id)
    .eq('profile_id', user.id)
    .maybeSingle()
  if (!membership) return json({ error: 'not a member of that campaign' }, 403)

  const isDm = membership.role === 'dm'
  const isOwner = character.owner_id === user.id

  const role = isDm ? 'dm' : isOwner ? 'owner' : 'other'
  const permission = mayIssue(role, command['type'] as string)
  if (!permission.allowed) {
    return json({ error: permission.reason }, 403)
  }

  // --- the sheet ----------------------------------------------------------
  const { data: row } = await db
    .from('character_sheets')
    .select('sheet, revision')
    .eq('character_id', characterId)
    .maybeSingle()
  if (!row) return json({ error: 'that character has no sheet yet' }, 409)

  const decoded = decodeSheet(row.sheet, content)
  if (!decoded.character) {
    return json({
      error: 'stored sheet could not be read',
      problems: decoded.problems
    }, 422)
  }

  // --- the dice -----------------------------------------------------------
  let effective = command
  if (isServerRolled(command['type'] as string)) {
    const count = faceCountFor(decoded.character, command)
    effective = { ...command, faces: rollFaces(count) }
  }

  // --- the transition -----------------------------------------------------
  const result = applyCommand(decoded.character, effective, content)
  if (result.rejected) {
    return json({ rejected: result.rejected.reasons, events: result.events }, 200)
  }

  // --- persist ------------------------------------------------------------
  const next = row.revision + 1
  const { data: written } = await db
    .from('character_sheets')
    .update({
      sheet: encodeSheet(result.character),
      revision: next,
      updated_at: new Date().toISOString()
    })
    .eq('character_id', characterId)
    .eq('revision', row.revision)
    .select('revision')
    .maybeSingle()

  if (!written) {
    // Somebody else moved between the read and the write. The caller re-reads
    // and decides; guessing on their behalf is how edits get lost.
    return json({ conflict: true, error: 'the sheet changed while you were acting' }, 409)
  }

  // Events are written after the state they describe, and a failure here is
  // logged rather than fatal: an event that missed the table must not undo a
  // state change that landed.
  if (result.events.length > 0) {
    const { error } = await db.from('game_events').insert(
      result.events.map((e: { type: string; payload: unknown }) => ({
        campaign_id: character.campaign_id,
        character_id: characterId,
        actor_id: user.id,
        type: e.type,
        payload: e.payload,
        // An NPC's business stays on the DM's side of the screen.
        visibility: character.kind === 'npc'
          ? 'dm'
          : e.type === 'CommandRejected' ? 'private' : 'public'
      }))
    )
    if (error) console.error('events not written:', error.message)
  }

  return json({
    ok: true,
    revision: written.revision,
    character: result.character,
    events: result.events
  })
})
