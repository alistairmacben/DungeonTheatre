// The client's hold on game state.
//
// The engine is pure and portable, so the client runs the identical resolver
// the server will run. That is the "client predicts, server is authoritative"
// design from architecture.md §6 — and it means swapping to server-authoritative
// later changes where the character comes from, not how anything is rendered.
//
// Every mutation goes through applyCommand, which is the same function the
// authority will call. The UI never writes a field on the character.

import { useCallback, useMemo, useState } from 'react'
import {
  applyCommand, loadContent, playerViewOf,
  type Character, type ContentIndex, type DetailLevel, type DomainEvent,
  type PlayerCommand, type PlayerView
} from '@engine'
import { SIR_ALDREN } from './character'

export interface GameState {
  view: PlayerView
  /** Detail tier for the current view. Raising it costs payload, not correctness. */
  detail: DetailLevel
  setDetail(detail: DetailLevel): void
  /**
   * Send a command, and get back what happened.
   *
   * The events are returned rather than only pushed into state because reading
   * `events` straight after dispatching reads the *previous* render's array —
   * which silently loses the result of the roll you just made.
   */
  dispatch(command: PlayerCommand): DispatchResult
  /**
   * Send several commands as one change.
   *
   * NOT the same as calling `dispatch` in a loop, and the difference is a bug
   * rather than an optimisation: `dispatch` is a callback closed over the
   * current `character`, so a second call in the same tick re-applies to the
   * state the first one started from and the last `setCharacter` wins. The
   * level-up wizard commits four commands at once and lost three of them that
   * way. This threads the character through the fold and sets state once.
   *
   * Stops at the first rejection, keeping the commands before it — they are
   * ordered and each assumes the last one landed.
   */
  dispatchAll(commands: PlayerCommand[]): DispatchResult
  /** Most recent first. The theatre will eventually consume these. */
  events: DomainEvent[]
  content: ContentIndex
  character: Character
}

export interface DispatchResult {
  /** Present only when nothing changed, carrying the reasons why. */
  rejected?: string[]
  /** Newest first. Empty only if the command produced nothing at all. */
  events: DomainEvent[]
}

export function useGameState(initial: Character = SIR_ALDREN): GameState {
  const content = useMemo<ContentIndex>(() => loadContent(), [])
  const [character, setCharacter] = useState<Character>(initial)
  const [detail, setDetail] = useState<DetailLevel>('inspect')
  const [events, setEvents] = useState<DomainEvent[]>([])
  const [revision, setRevision] = useState(0)

  const view = useMemo(
    () => playerViewOf(character, content, { detail, revision }),
    [character, content, detail, revision]
  )

  const dispatch = useCallback((command: PlayerCommand): DispatchResult => {
    const result = applyCommand(character, command, content)
    setEvents((prev) => [...result.events, ...prev].slice(0, 50))
    if (result.rejected) {
      // A rejection is a result, not an error: it carries the same reasons an
      // unavailable action would have shown.
      return { rejected: result.rejected.reasons, events: result.events }
    }
    setCharacter(result.character)
    setRevision((n) => n + 1)
    return { events: result.events }
  }, [character, content])

  const dispatchAll = useCallback((commands: PlayerCommand[]): DispatchResult => {
    let next = character
    const produced: DomainEvent[] = []
    for (const command of commands) {
      const result = applyCommand(next, command, content)
      produced.push(...result.events)
      if (result.rejected) {
        setEvents((prev) => [...produced, ...prev].slice(0, 50))
        return { rejected: result.rejected.reasons, events: produced }
      }
      next = result.character
    }
    setCharacter(next)
    setRevision((n) => n + 1)
    setEvents((prev) => [...produced, ...prev].slice(0, 50))
    return { events: produced }
  }, [character, content])

  return { view, detail, setDetail, dispatch, dispatchAll, events, content, character }
}
