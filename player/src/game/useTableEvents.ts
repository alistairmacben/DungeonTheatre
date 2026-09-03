// What the rest of the table just did.
//
// `useServerGame` gives you the events from YOUR OWN commands. This gives you
// everyone else's, so the stage reacts to the whole session rather than to one
// sheet — which is the difference between Phase L and a private animation.
//
// The stream is the `game_events` table rather than a broadcast channel, so a
// client that reconnects reads what it missed. RLS applies to the realtime feed
// too: a player simply never receives a DM-only row.

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { subscribeToEvents, type StreamedEvent } from './eventStream'

/** Enough of a StreamedEvent for the reaction layer, which wants only these. */
export interface TableEvent {
  type: string
  payload: Record<string, unknown>
}

/**
 * Events from the table, newest first, excluding your own.
 *
 * Your own are filtered out because `useServerGame` already surfaced them the
 * moment the server answered — showing them again when the row echoes back
 * would double every beat you cause.
 */
export function useTableEvents(
  campaignId: string | null, ownCharacterId: string | null, limit = 30
): TableEvent[] {
  const [events, setEvents] = useState<TableEvent[]>([])

  useEffect(() => {
    if (!campaignId) return
    // Deliberately NOT backfilling with `recentEvents`: joining a table should
    // not replay the last fifty things that happened as if they were happening
    // now. History belongs in a log, and this is a stage.
    const channel = subscribeToEvents(supabase(), campaignId, (row: StreamedEvent) => {
      if (row.characterId && row.characterId === ownCharacterId) return
      setEvents((prev) => [{ type: row.type, payload: row.payload }, ...prev].slice(0, limit))
    })
    return () => { void supabase().removeChannel(channel) }
  }, [campaignId, ownCharacterId, limit])

  return events
}
