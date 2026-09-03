// What you have left this turn.
//
// A deliberate piece of bookkeeping that the ENGINE DOES NOT DO. There is no
// turn state anywhere in `src/rules` — no initiative, no round, nothing that
// knows an action has been spent — because this is theatre of the mind and the
// DM adjudicates. That is the right call for the rules and a poor one for the
// player, who still has to remember whether they have moved and struck.
//
// So this is a scratchpad, not a referee. It counts down as you act, it dims
// what you have used, and it never stops you: if the DM says you may act
// again, you may, and the pips can be clicked back. Anything stricter would be
// the UI inventing a rule the engine deliberately declines to have.
//
// Action Surge and its kin are exactly why nothing is enforced. The engine
// models them as resources, not as turn grants, so rather than special-casing
// content in the UI the Action pip is simply clickable — spend it, and when a
// feature hands you another, click it back.

import React, { useCallback, useState } from 'react'
import type { ActionCostView } from '@engine'

/** The three the player actually budgets. Movement and free are not rationed. */
export type EconomyKind = 'action' | 'bonusAction' | 'reaction'

const ORDER: EconomyKind[] = ['action', 'bonusAction', 'reaction']

const SHAPE: Record<EconomyKind, { label: string; short: string; className: string }> = {
  // BG3's shorthand, which players already read fluently: a green circle for
  // the action, an orange triangle for the bonus action, a blue diamond for
  // the reaction.
  action: { label: 'Action', short: 'A', className: 'rounded-full' },
  bonusAction: { label: 'Bonus Action', short: 'B', className: '[clip-path:polygon(50%_0%,100%_100%,0%_100%)]' },
  reaction: { label: 'Reaction', short: 'R', className: 'rotate-45' }
}

const TONE: Record<EconomyKind, { on: string; off: string }> = {
  action: { on: 'bg-verdigris', off: 'bg-verdigris/15' },
  bonusAction: { on: 'bg-ember', off: 'bg-ember/15' },
  reaction: { on: 'bg-arcane', off: 'bg-arcane/15' }
}

export interface ActionEconomy {
  /** How many of each remain. Can exceed one — Action Surge, a second wind of luck. */
  remaining: Record<EconomyKind, number>
  /** Spends one of the given kind, if the cost is one this tracks. */
  spend(cost: ActionCostView): void
  /** Hands one back, for a feature that grants it or a DM who allows it. */
  restore(kind: EconomyKind): void
  /** Back to a full turn. */
  reset(): void
}

const FULL: Record<EconomyKind, number> = { action: 1, bonusAction: 1, reaction: 1 }

export function useActionEconomy(): ActionEconomy {
  const [remaining, setRemaining] = useState<Record<EconomyKind, number>>({ ...FULL })

  const spend = useCallback((cost: ActionCostView): void => {
    // 'free', 'movement' and 'time' are not rationed, so they spend nothing.
    if (cost.type !== 'action' && cost.type !== 'bonusAction' && cost.type !== 'reaction') return
    const kind = cost.type
    setRemaining((prev) => ({ ...prev, [kind]: Math.max(0, prev[kind] - 1) }))
  }, [])

  const restore = useCallback((kind: EconomyKind): void => {
    setRemaining((prev) => ({ ...prev, [kind]: prev[kind] + 1 }))
  }, [])

  const reset = useCallback((): void => setRemaining({ ...FULL }), [])

  return { remaining, spend, restore, reset }
}

/** True when this cost is one the player has already spent this turn. */
export function isSpent(cost: ActionCostView, economy: ActionEconomy): boolean {
  if (cost.type !== 'action' && cost.type !== 'bonusAction' && cost.type !== 'reaction') return false
  return economy.remaining[cost.type] <= 0
}

export function ActionEconomyPips({ economy }: { economy: ActionEconomy }): React.JSX.Element {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1.5">
        {ORDER.map((kind) => {
          const left = economy.remaining[kind]
          const shape = SHAPE[kind]
          const tone = TONE[kind]
          return (
            <button
              key={kind}
              type="button"
              onClick={() => (left > 0 ? economy.spend({ type: kind, label: shape.label }) : economy.restore(kind))}
              title={left > 0
                ? `${shape.label}: ${left} left — click to spend`
                : `${shape.label} used — click to give one back`}
              className="grid h-6 w-6 place-items-center transition hover:scale-110"
            >
              <span className={`h-4 w-4 ${shape.className} ${left > 0 ? tone.on : tone.off}`} />
              {/* More than one of a kind is worth a number; one is not. */}
              {left > 1 && (
                <span className="absolute text-[9px] font-semibold text-ink">{left}</span>
              )}
            </button>
          )
        })}
      </div>
      <button
        type="button"
        onClick={economy.reset}
        title="Start a new turn — everything comes back"
        className="text-[9px] uppercase tracking-widest text-parchment/35 transition hover:text-parchment/70"
      >
        new turn
      </button>
    </div>
  )
}
