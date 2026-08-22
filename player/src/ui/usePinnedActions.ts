// Which actions the player keeps on the bar.
//
// The HUD suggests a sensible bar on its own — attacks, then damage spells,
// then whatever costs a resource. That guess is right often enough to be worth
// keeping, and wrong often enough that a player needs the last word: a bard
// wants Vicious Mockery there, a scout wants the rope, and no heuristic is
// going to know that.
//
// So there are two lists, not one. `pinned` is what the player explicitly put
// on the bar; `hidden` is what they explicitly took off it. Anything they have
// not had an opinion about is still filled in by the suggestion. Storing only
// `pinned` would have meant the first pin silently wiped the whole suggested
// bar, and storing only `hidden` would have meant a player could never promote
// something the suggestion ranked below the cut. The two lists are kept
// disjoint: pinning clears a hide, hiding clears a pin.
//
// This lives in the browser, per character, and deliberately does not go to
// the server: it is a preference about one person's screen, not a fact about
// the character. It costs nothing, needs no migration, and works before
// sign-in — which matters because #solo has no account at all. The trade is
// that the bar does not follow the player to another device, which is a fair
// price and easy to change later if anyone asks.
//
// It is an external store rather than component state because the HUD and the
// menu render in different subtrees and both need the same answer. Two
// useState hooks would each hold their own copy, so pinning something in the
// menu would leave the bar showing the old set until something else forced a
// re-render — which is exactly the bug this shape rules out.

import { useCallback, useSyncExternalStore } from 'react'

/** How many buttons the bar holds before it starts crowding the theatre. */
export const HUD_SLOTS = 6

/**
 * Bottom pixels the HUD and its roll readouts occupy, so the stage can keep
 * the dice clear of them. Generous on purpose: a roll result landing behind
 * the bar is worse than one floating slightly high.
 */
export const HUD_RESERVED_PX = 150

export interface Stored {
  /** Explicitly added, in the order the player added them. */
  pinned: string[]
  /** Explicitly removed, so the suggestion stops putting them back. */
  hidden: string[]
}

export interface PinnedActions extends Stored {
  /** Explicitly pinned — not merely suggested. */
  isPinned(actionId: string): boolean
  /** Put it on the bar, or take it off. `onBar` is its state right now. */
  toggle(actionId: string, onBar: boolean): void
  /** Back to the suggested bar, forgetting every choice for this character. */
  reset(): void
  /** True once the player has expressed any opinion at all. */
  customized: boolean
}

const EMPTY: Stored = { pinned: [], hidden: [] }

const keyFor = (characterId: string): string => `dungeon-theatre:hud-bar:${characterId}`

// Snapshots must be referentially stable between writes or useSyncExternalStore
// re-renders forever, so every character's current value is cached here and
// only ever replaced by a write.
const cache = new Map<string, Stored>()
const listeners = new Set<() => void>()

function load(characterId: string): Stored {
  const cached = cache.get(characterId)
  if (cached) return cached

  let value = EMPTY
  try {
    const raw = localStorage.getItem(keyFor(characterId))
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Stored>
      const strings = (x: unknown): string[] =>
        Array.isArray(x) ? x.filter((v): v is string => typeof v === 'string') : []
      value = { pinned: strings(parsed.pinned), hidden: strings(parsed.hidden) }
    }
  } catch {
    // A corrupted preference is not worth an error screen; the suggested bar
    // is a perfectly good answer.
  }
  cache.set(characterId, value)
  return value
}

function save(characterId: string, next: Stored): void {
  cache.set(characterId, next)
  try {
    localStorage.setItem(keyFor(characterId), JSON.stringify(next))
  } catch {
    // Private browsing, a full quota — the bar still works for this session.
  }
  for (const notify of listeners) notify()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function usePinnedActions(characterId: string): PinnedActions {
  const state = useSyncExternalStore(
    subscribe,
    () => load(characterId),
    () => EMPTY // No localStorage during server render; the suggestion stands.
  )

  const toggle = useCallback((actionId: string, onBar: boolean) => {
    const prev = load(characterId)
    // Symmetric on purpose: taking something off the bar always both drops any
    // explicit pin and records the removal, so one click removes it whether it
    // got there by the player's choice or by the suggestion's.
    save(characterId, onBar
      ? {
          pinned: prev.pinned.filter((id) => id !== actionId),
          hidden: prev.hidden.includes(actionId) ? prev.hidden : [...prev.hidden, actionId]
        }
      : {
          pinned: prev.pinned.includes(actionId) ? prev.pinned : [...prev.pinned, actionId],
          hidden: prev.hidden.filter((id) => id !== actionId)
        })
  }, [characterId])

  const reset = useCallback(() => { save(characterId, EMPTY) }, [characterId])

  return {
    pinned: state.pinned,
    hidden: state.hidden,
    isPinned: (id) => state.pinned.includes(id),
    toggle,
    reset,
    customized: state.pinned.length > 0 || state.hidden.length > 0
  }
}

/**
 * The bar itself: the player's picks first, then the suggestion filling what
 * is left, minus anything they took off.
 *
 * Exported because the menu needs the same answer the HUD renders — a pin
 * button has to know whether the thing is currently on the bar, and computing
 * that twice in two places is how the two disagree.
 */
export function barFor<T extends { id: string }>(
  suggested: T[], all: T[], prefs: Stored
): T[] {
  const byId = new Map(all.map((a) => [a.id, a]))
  const chosen = prefs.pinned.map((id) => byId.get(id)).filter((a): a is T => a !== undefined)
  const chosenIds = new Set(chosen.map((a) => a.id))
  const filler = suggested.filter((a) => !chosenIds.has(a.id) && !prefs.hidden.includes(a.id))
  return [...chosen, ...filler].slice(0, HUD_SLOTS)
}
