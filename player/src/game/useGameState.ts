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
  /** Send a command. Returns the reasons if it was rejected, so the UI can say so. */
  dispatch(command: PlayerCommand): string[] | undefined
  /** Most recent first. The theatre will eventually consume these. */
  events: DomainEvent[]
  content: ContentIndex
  character: Character
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

  const dispatch = useCallback((command: PlayerCommand): string[] | undefined => {
    const result = applyCommand(character, command, content)
    if (result.rejected) {
      // A rejection is a result, not an error: it carries the same reasons an
      // unavailable action would have shown.
      setEvents((prev) => [...result.events, ...prev].slice(0, 50))
      return result.rejected.reasons
    }
    setCharacter(result.character)
    setEvents((prev) => [...result.events, ...prev].slice(0, 50))
    setRevision((n) => n + 1)
    return undefined
  }, [character, content])

  return { view, detail, setDetail, dispatch, events, content, character }
}
