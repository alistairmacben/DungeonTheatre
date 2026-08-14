// The vertical-slice harness.
//
// The real Stage needs a signed-in player, a campaign and a live DM. That is
// correct for the product and hopeless for judging whether the thing feels
// good, so `#solo` renders the identical theatre + HUD + menu against local
// state and no backend. It imports the same three components the Stage does —
// if it looks right here it looks right there.

import { useState } from 'react'
import { StageView } from '@stage-ui/StageView'
import { EMPTY_SNAPSHOT } from '@shared/types'
import { parseNotation, rollValues, totalOf, type DiceRoll } from '@shared/dice'
import type { Character } from '@engine'
import { useGameState } from './game/useGameState'
import { PARTY } from './game/character'
import { Hud } from './ui/Hud'
import { GameMenu, type MenuTab } from './ui/GameMenu'

export function Solo(): React.JSX.Element {
  // Switching characters is a harness affordance, not a product feature: the
  // point is to see how different archetypes render through one HUD.
  const [who, setWho] = useState(0)

  return (
    <div className="relative h-full w-full">
      {/* Keyed on the character, because the game state is seeded from it and
          a fresh character means a fresh game, not a re-render. */}
      <SoloCharacter key={PARTY[who]!.id} character={PARTY[who]!} />

      <div className="pointer-events-auto absolute left-4 top-4 flex gap-1">
        {PARTY.map((c, i) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setWho(i)}
            className={`rounded-lg border px-3 py-1.5 text-xs transition ${
              i === who
                ? 'border-arcane/60 bg-arcane/10 text-parchment'
                : 'border-white/10 bg-ink/70 text-parchment/50 hover:text-parchment/80'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
  )
}

function SoloCharacter({ character }: { character: Character }): React.JSX.Element {
  const game = useGameState(character)
  const [menuTab, setMenuTab] = useState<MenuTab | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [roll, setRoll] = useState<DiceRoll | null>(null)
  const [rollSeq, setRollSeq] = useState(1)

  return (
    <>
      <StageView
        snapshot={EMPTY_SNAPSHOT}
        resolveAsset={() => null}
        idleMessage="The hall is dark. Your torch gutters."
        roll={roll}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 p-4">
        {note && (
          <p className="pointer-events-auto rounded-lg border border-white/10 bg-ink/85 px-3 py-1.5 text-xs text-parchment/80 backdrop-blur">
            {note}
          </p>
        )}
        <Hud
          view={game.view}
          onOpenMenu={(tab) => setMenuTab((tab as MenuTab) ?? 'character')}
          onAction={(actionId) => {
            const action = game.view.actions.find((a) => a.id === actionId)
            if (!action) return
            if (!action.available) {
              setNote(action.unavailableReasons.join(' · '))
              return
            }
            if (action.kind === 'attack' && action.preview?.attackBonusDisplay) {
              const notation = `1d20${action.preview.attackBonusDisplay}`
              const parsed = parseNotation(notation)
              if (parsed) {
                const dice = rollValues(parsed)
                setRoll({
                  id: `solo-${rollSeq}`,
                  campaignId: 'solo',
                  rollerId: 'solo',
                  characterId: game.view.meta.characterId,
                  rollerName: game.view.meta.name,
                  color: '#c9a227',
                  notation,
                  dice,
                  modifier: parsed.modifier,
                  total: totalOf(dice, parsed.modifier),
                  visibility: 'public',
                  theme: 'bone',
                  at: rollSeq
                })
                setRollSeq((n) => n + 1)
                setNote(`${action.label} — ${action.preview.damageLabel} on a hit`)
              }
              return
            }
            const rejected = game.dispatch(action.command)
            setNote(rejected ? rejected.join(' · ') : `${action.label} used`)
          }}
        />
      </div>

      {menuTab && (
        <GameMenu
          view={game.view}
          tab={menuTab}
          onTab={setMenuTab}
          onClose={() => setMenuTab(null)}
          dispatch={game.dispatch}
        />
      )}
    </>
  )
}
