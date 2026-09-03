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
import { publishEvents, subscribeToCharacterEvents } from './eventStream'

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
  /**
   * Send several commands as one change — the level-up wizard's Accept.
   *
   * Deliberately not `dispatch` in a loop. Two things break there: `dispatch`
   * closes over `character`, so every iteration predicts against pre-level-up
   * state and can refuse a perfectly good command locally before it is ever
   * sent; and `revision.current` only advances on an authoritative reply, so
   * a queued second command carries a revision the server has already moved
   * past and comes back as a conflict.
   *
   * So this skips prediction entirely and threads the revision forward from
   * each reply. A level-up is a deliberate act behind a button that already
   * says "Applying…" — it can afford the round trips, and correctness here
   * matters more than optimism.
   */
  dispatchAll(commands: PlayerCommand[]): Promise<ServerDispatchResult>
  events: DomainEvent[]
  /** True while a command is in flight, for a spinner on the roll card. */
  busy: boolean
  content: ContentIndex
  /**
   * The raw character behind `view`.
   *
   * Everything that renders should read `view` — that is the whole point of a
   * view model. This exists for the one case that genuinely needs the state
   * itself: staging a multi-command change (the level-up wizard) by folding
   * `applyCommand` onto a local copy before any of it is sent.
   */
  character: Character | null
  reload(): void
}

export function useServerGame({
  characterId, viewer = { kind: 'owner' }, role = 'owner', campaignId, actorId
}: {
  characterId: string | null
  viewer?: Viewer
  /** The caller's relationship to this character, for predicting refusals. */
  role?: Role
  /**
   * The table to publish domain events to. Omitted in any context without a
   * campaign (the create-preview harness), where publishing would be writing
   * events nobody can read.
   */
  campaignId?: string
  /** Whose action this was, for attribution on the shared stream. */
  actorId?: string | null
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

  /**
   * Keeps this sheet from going stale when somebody ELSE changes it.
   *
   * The gap this closes: the DM's loot browser writes a character's inventory
   * through a one-shot call that never touches the tab holding that
   * character's own sheet open, and that tab had no way to learn anything
   * happened — a grant would land in the database, announce itself on the
   * table's event stream as a splash, and then the player's own inventory
   * would keep showing the old list until they closed and reopened the app.
   *
   * Silent and debounced: a fetch replaces the character in place with no
   * loading flash, and a burst of events from one command (an attack can
   * emit three) coalesces into one refetch rather than three.
   *
   * Every event for this character triggers it, including ones this client
   * itself caused — not only the loot browser's, but any command dispatched
   * through this same hook's `dispatch`. Skipping self-caused events looked
   * safe (dispatch already applies the authoritative reply) and was not: the
   * DM's Tools tab and the Loot tab act as the SAME actor, and the grant
   * bypasses this hook's dispatch entirely, so a same-actor skip would leave
   * the very tab a DM is watching stale forever. The cost of not skipping is
   * one redundant read after a normal action, which is silent and cheap;
   * the cost of skipping was the bug this fixes.
   */
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!characterId) return
    let cancelled = false
    const channel = subscribeToCharacterEvents(supabase(), characterId, () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current)
      refreshTimer.current = setTimeout(() => {
        void loadSheet(supabase(), characterId).then((stored) => {
          if (cancelled || !stored) return
          setCharacter(stored.character)
          revision.current = stored.revision
        })
      }, 400)
    })
    return () => {
      cancelled = true
      if (refreshTimer.current) clearTimeout(refreshTimer.current)
      void supabase().removeChannel(channel)
    }
  }, [characterId, actorId])

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

      // Share what happened. Only the AUTHORITATIVE events are published —
      // a local prediction that the server later disagreed with must never
      // reach another player's stage. Failure is swallowed on purpose: an
      // event that did not reach the table must not undo a state change that
      // did, and the sheet is still correct either way.
      if (campaignId && (data.events ?? []).length > 0) {
        void publishEvents(supabase(), campaignId, characterId, actorId ?? null, data.events)
      }
      return { events: data.events ?? [] }
    } catch (e: unknown) {
      if (predicted) setCharacter(character)
      return { events: [], rejected: [String(e)] }
    } finally {
      setBusy(false)
    }
  }, [character, characterId, content, role, campaignId, actorId])

  const dispatchAll = useCallback(async (
    commands: PlayerCommand[]
  ): Promise<ServerDispatchResult> => {
    if (!characterId) return { events: [], rejected: ['no character loaded'] }
    const produced: DomainEvent[] = []
    setBusy(true)
    try {
      for (const command of commands) {
        const { data, error: fnError } = await supabase().functions.invoke('command', {
          body: { characterId, command, revision: revision.current }
        })
        if (fnError) return { events: produced, rejected: [fnError.message] }
        if (data?.rejected) return { events: produced, rejected: data.rejected }
        if (data?.conflict) {
          setReloadKey((n) => n + 1)
          return { events: produced, rejected: ['somebody else changed this character; reloading'] }
        }
        // Threaded forward, so the next command is based on this one's result
        // rather than on the state the batch started from.
        revision.current = data.revision
        setCharacter(data.character)
        produced.push(...(data.events ?? []))
        if (campaignId && (data.events ?? []).length > 0) {
          void publishEvents(supabase(), campaignId, characterId, actorId ?? null, data.events)
        }
      }
      setEvents((prev) => [...produced, ...prev].slice(0, 50))
      return { events: produced }
    } catch (e: unknown) {
      return { events: produced, rejected: [e instanceof Error ? e.message : String(e)] }
    } finally {
      setBusy(false)
    }
  }, [characterId, campaignId, actorId])

  return {
    view, loading, error, problems, detail, setDetail, dispatch, dispatchAll, events, busy,
    content, character,
    reload: () => setReloadKey((n) => n + 1)
  }
}
