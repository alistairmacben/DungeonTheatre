// The domain event stream.
//
// The reducer has emitted Bloodied, Downed, SpellCast, ConcentrationBroken and
// the rest since the first slice, and until now nothing consumed them. This is
// where they go, so that Phase J — the theatre reacting to a session rather
// than to a character sheet — has something to react to.
//
// Events are domain-shaped, never presentational. `Bloodied` belongs here;
// `ScreenShake` does not. What the stage does with a Bloodied is the stage's
// decision, and keeping that decision out of the engine is what lets the same
// event drive a sound, a colour grade, or nothing at all.

import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import type { DomainEvent } from '@engine'

/** Who is entitled to see an event. Mirrors the CHECK on the table. */
export type EventVisibility = 'public' | 'private' | 'dm'

export interface StreamedEvent {
  id: number
  campaignId: string
  characterId: string | null
  actorId: string | null
  type: string
  payload: Record<string, unknown>
  visibility: EventVisibility
  createdAt: string
}

/**
 * Which events are private by default.
 *
 * A rejected command is the actor's own business — broadcasting every fumbled
 * click to the table would be noise, and worse, would leak what a player
 * *tried* to do. Everything else is public unless the caller says otherwise,
 * because the whole point of the stream is a shared table.
 */
const PRIVATE_BY_DEFAULT = new Set(['CommandRejected'])

export function defaultVisibility(event: DomainEvent): EventVisibility {
  return PRIVATE_BY_DEFAULT.has(event.type) ? 'private' : 'public'
}

/**
 * Publishes a batch of events.
 *
 * Batched because one command routinely produces several — a cast spends a
 * slot, ends concentration and announces the spell — and they belong to the
 * same moment. Failure is returned rather than thrown: an event that did not
 * reach the table must not roll back a state change that did.
 */
export async function publishEvents(
  db: SupabaseClient,
  campaignId: string,
  characterId: string,
  actorId: string | null,
  events: DomainEvent[],
  visibilityFor: (e: DomainEvent) => EventVisibility = defaultVisibility
): Promise<{ ok: boolean; error?: string }> {
  if (events.length === 0) return { ok: true }

  const rows = events.map((e) => ({
    campaign_id: campaignId,
    character_id: characterId,
    actor_id: actorId,
    type: e.type,
    payload: e.payload,
    visibility: visibilityFor(e)
  }))

  const { error } = await db.from('game_events').insert(rows)
  return error ? { ok: false, error: error.message } : { ok: true }
}

/** Recent events, newest first. RLS decides which of them the caller sees. */
export async function recentEvents(
  db: SupabaseClient, campaignId: string, limit = 50
): Promise<StreamedEvent[]> {
  const { data, error } = await db
    .from('game_events')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('id', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`could not read events: ${error.message}`)
  return (data ?? []).map(rowToEvent)
}

/**
 * Subscribes to the campaign's events.
 *
 * Postgres changes rather than a broadcast channel, so the stream is the table:
 * a client that reconnects reads what it missed instead of silently losing it.
 * RLS applies to the realtime feed too, so a player simply never receives a
 * DM-only event.
 */
export function subscribeToEvents(
  db: SupabaseClient,
  campaignId: string,
  onEvent: (event: StreamedEvent) => void
): RealtimeChannel {
  return db
    .channel(`game-events:${campaignId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'game_events',
        filter: `campaign_id=eq.${campaignId}`
      },
      (message) => onEvent(rowToEvent(message.new as Record<string, unknown>))
    )
    .subscribe()
}
/**
 * Subscribes to one character's own events, regardless of who caused them.
 *
 * `subscribeToEvents` watches a whole campaign and is what the STAGE reacts
 * to; this is what tells a SHEET it is stale. The gap between them is real:
 * the DM's loot browser writes a character's inventory through a one-shot
 * call that never touches the browser tab holding that character's own
 * sheet open, and `subscribeToEvents` alone cannot fix that — a player is
 * never subscribed to their own events (see `useTableEvents`'s exclusion),
 * so the one sheet that most needs to know it changed is the one thing that
 * filter was built to leave out.
 */
export function subscribeToCharacterEvents(
  db: SupabaseClient,
  characterId: string,
  /** The actor who caused it, so the caller can ignore its own writes. */
  onEvent: (actorId: string | null) => void
): RealtimeChannel {
  return db
    .channel(`character-events:${characterId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'game_events',
        filter: `character_id=eq.${characterId}`
      },
      (message) => onEvent((message.new as { actor_id: string | null }).actor_id)
    )
    .subscribe()
}


function rowToEvent(row: Record<string, unknown>): StreamedEvent {
  return {
    id: row['id'] as number,
    campaignId: row['campaign_id'] as string,
    characterId: (row['character_id'] as string | null) ?? null,
    actorId: (row['actor_id'] as string | null) ?? null,
    type: row['type'] as string,
    payload: (row['payload'] as Record<string, unknown>) ?? {},
    visibility: (row['visibility'] as EventVisibility) ?? 'public',
    createdAt: row['created_at'] as string
  }
}
