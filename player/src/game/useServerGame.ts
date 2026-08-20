// Playing against the server.
//
// Predict, send, reconcile. The client runs the same `applyCommand` the edge
// function runs, so the HUD updates on the same frame as the click; the
// authoritative answer arrives a moment later and replaces the guess. When they
// agree — which is nearly always — nothing visibly happens, which is the point.
//
// Two cases where the guess is deliberately not shown:
//
//  - ROLLS. The server generates the dice, because a client that supplies its
//    own faces can supply twenties. Predicting a roll would show a number that
//    is about to change, so the roll is left pending instead.
//  - COMMANDS THE CALLER MAY NOT ISSUE. A player clicking something DM-only
//    would otherwise watch an effect appear and then be undone. A DM issuing
//    the same command IS predicted: it is deterministic, so the guess and the
//    truth agree.
//
// `useGameState` remains the local-only path the `#solo` harness uses. This is
// the same shape with a network under it, so the components above cannot tell
// which one they are talking to.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  applyCommand, loadContent, playerViewOf,
  isPredictable,
  type Character, type ContentIndex, type DetailLevel, type DomainEvent,
  type PlayerCommand, type PlayerView, type Role, type Viewer
} from '@engine'
import { supabase } from '../supabase'
import { loadSheet } from './sheetStore'

export interface ServerDispatchResult {
  rejected?: string[]
  events: DomainEvent[]
  /** True while the authoritative answer is still in flight. */
  pending?: boolean
}

export interface ServerGame {
  view: PlayerView | null
  loading: boolean
  error: string | null
  /** Content drift and anything else the codec noticed on load. */
  problems: string[]
  detail: DetailLevel
  setDetail(detail: DetailLevel): void
  dispatch(command: PlayerCommand): Promise<ServerDispatchResult>
  events: DomainEvent[]
  /** True while a command is in flight, for a spinner on the roll card. */
  busy: boolean
  content: ContentIndex
  reload(): void
}

export function useServerGame({
  characterId, viewer = { kind: 'owner' }, role = 'owner'
}: {
  characterId: string | null
  viewer?: Viewer
  /** The caller's relationship to this character, for predicting refusals. */
  role?: Role
}): ServerGame {
  const content = useMemo<ContentIndex>(() => loadContent(), [])
  const [character, setCharacter] = useState<Character | null>(null)
  const [detail, setDetail] = useState<DetailLevel>('inspect')
  const [events, setEvents] = useState<DomainEvent[]>([])
  const [problems, setProblems] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  // The revision the local character is based on. Sent with every write so a
  // concurrent DM edit produces a refusal to reconcile rather than a clobber.
  const revision = useRef(0)

  useEffect(() => {
    if (!characterId) { setLoading(false); return }
    let cancelled = false
    setLoading(true)
    setError(null)

    loadSheet(supabase(), characterId)
      .then((stored) => {
        if (cancelled) return
        if (!stored) {
          setCharacter(null)
          setError('this character has no sheet yet')
          return
        }
        setCharacter(stored.character)
        revision.current = stored.revision
        setProblems(stored.problems.map((p) => `${p.severity}: ${p.message}`))
      })
      .catch((e: unknown) => { if (!cancelled) setError(String(e)) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [characterId, reloadKey])

  const view = useMemo(
    () => character
      ? playerViewOf(character, content, { detail, viewer, revision: revision.current })
      : null,
    [character, content, detail, viewer]
  )

  const dispatch = useCallback(async (command: PlayerCommand): Promise<ServerDispatchResult> => {
    if (!character || !characterId) return { events: [], rejected: ['no character loaded'] }

    // Optimistic half. Skipped where the server owns the answer, so the player
    // never sees a number that is about to be replaced by a different one.
    const predictable = isPredictable(role, command.type)
    let predicted: Character | null = null
    if (predictable) {
      const guess = applyCommand(character, command, content)
      if (guess.rejected) {
        // The client and server run the same rules, so a local refusal is
        // almost certainly the server's answer too — and saying so immediately
        // is better than a round trip to be told the same thing.
        return { rejected: guess.rejected.reasons, events: guess.events }
      }
      predicted = guess.character
      setCharacter(guess.character)
      setEvents((prev) => [...guess.events, ...prev].slice(0, 50))
    }

    setBusy(true)
    try {
      const { data, error: fnError } = await supabase().functions.invoke('command', {
        body: { characterId, command, revision: revision.current }
      })

      if (fnError) {
        if (predicted) setCharacter(character) // roll the guess back
        return { events: [], rejected: [fnError.message] }
      }
      if (data?.rejected) {
        if (predicted) setCharacter(character)
        return { events: data.events ?? [], rejected: data.rejected }
      }
      if (data?.conflict) {
        if (predicted) setCharacter(character)
        setReloadKey((n) => n + 1)
        return { events: [], rejected: ['somebody else changed this character; reloading'] }
      }

      // Authoritative. Replaces the guess whether or not they agreed.
      revision.current = data.revision
      setCharacter(data.character)
      setEvents((prev) => [...(data.events ?? []), ...prev].slice(0, 50))
      return { events: data.events ?? [] }
    } catch (e: unknown) {
      if (predicted) setCharacter(character)
      return { events: [], rejected: [String(e)] }
    } finally {
      setBusy(false)
    }
  }, [character, characterId, content, role])

  return {
    view, loading, error, problems, detail, setDetail, dispatch, events, busy,
    content,
    reload: () => setReloadKey((n) => n + 1)
  }
}
