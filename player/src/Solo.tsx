// The session harness.
//
// The real Stage needs a signed-in player, a campaign and a live DM. That is
// correct for the product and hopeless for judging whether the thing feels
// good, so `#solo` runs the whole loop against local state and no backend:
// four characters, the same HUD and menu the Stage uses, and a DM panel on the
// other side of the table.
//
// Everything here is either a component the Stage also renders or a harness
// affordance clearly marked as one.

import { useMemo, useState } from 'react'
import { StageView } from '@stage-ui/StageView'
import { EMPTY_SNAPSHOT } from '@shared/types'
import { totalOf, type DiceRoll } from '@shared/dice'
import { loadContent, type Character, type ContentIndex, type DamageRollSpec, type RollSpec } from '@engine'
import { useGameState } from './game/useGameState'
import { PARTY } from './game/character'
import { Hud } from './ui/Hud'
import { GameMenu, type MenuTab } from './ui/GameMenu'
import { DmPanel } from './ui/DmPanel'
import { CreateCharacter } from './ui/CreateCharacter'
import {
  DamagePrompt, DamageResult, RollResult, damageLabelOf, damageOutcomeFromEvents, isHealing,
  rollDamageFaces, rollFor, outcomeFromEvents, type DamageOutcome, type RollOutcome
} from './ui/RollWidget'
import { HUD_RESERVED_PX } from './ui/usePinnedActions'

let nextCustomId = 1

export function Solo(): React.JSX.Element {
  // A dedicated, harness-level load: `CreateCharacter` needs a ContentIndex
  // before any character (and therefore any `useGameState`) exists yet.
  const content = useMemo<ContentIndex>(() => loadContent(), [])
  const [customParty, setCustomParty] = useState<Character[]>([])
  const roster = [...PARTY, ...customParty]

  // An id, not an index — the roster grows at runtime now, and an index
  // silently points at the wrong character the moment one is added.
  const [selectedId, setSelectedId] = useState(PARTY[0]!.id)
  const selected = roster.find((c) => c.id === selectedId) ?? roster[0]!

  const [dmOpen, setDmOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  return (
    <div className="relative h-full w-full">
      {/* Keyed on the character, because game state is seeded from it and a
          different character means a fresh game, not a re-render. */}
      <SoloCharacter
        key={selected.id}
        character={selected}
        dmOpen={dmOpen}
        onCloseDm={() => setDmOpen(false)}
      />

      <div className="pointer-events-auto absolute left-4 top-4 flex gap-1">
        {roster.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelectedId(c.id)}
            className={`rounded-lg border px-3 py-1.5 text-xs transition ${
              c.id === selectedId
                ? 'border-arcane/60 bg-arcane/10 text-parchment'
                : 'border-white/10 bg-ink/70 text-parchment/50 hover:text-parchment/80'
            }`}
          >
            {c.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="ml-2 rounded-lg border border-white/10 bg-ink/70 px-3 py-1.5 text-xs text-parchment/50 transition hover:text-parchment/80"
        >
          + New
        </button>
        <button
          type="button"
          onClick={() => setDmOpen((v) => !v)}
          className={`ml-2 rounded-lg border px-3 py-1.5 text-xs transition ${
            dmOpen
              ? 'border-ember/60 bg-ember/10 text-parchment'
              : 'border-white/10 bg-ink/70 text-parchment/50 hover:text-parchment/80'
          }`}
        >
          DM
        </button>
      </div>

      {creating && (
        <CreateCharacter
          content={content}
          characterId={`custom-${nextCustomId}`}
          campaignId="camp-1"
          suggestedName="New Character"
          onCancel={() => setCreating(false)}
          onSubmit={async (character) => {
            if (!character) return 'something went wrong building that character'
            nextCustomId += 1
            setCustomParty((prev) => [...prev, character])
            setSelectedId(character.id)
            setCreating(false)
            return undefined
          }}
        />
      )}
    </div>
  )
}

function SoloCharacter({ character, dmOpen, onCloseDm }: {
  character: Character
  dmOpen: boolean
  onCloseDm(): void
}): React.JSX.Element {
  const game = useGameState(character)
  const [menuTab, setMenuTab] = useState<MenuTab | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [outcome, setOutcome] = useState<RollOutcome | null>(null)
  const [damageSpec, setDamageSpec] = useState<DamageRollSpec | null>(null)
  const [damageOutcome, setDamageOutcome] = useState<DamageOutcome | null>(null)
  const [roll, setRoll] = useState<DiceRoll | null>(null)
  const [rollSeq, setRollSeq] = useState(1)
  const healingPending = isHealing(damageSpec)

  /**
   * One path for every roll in the product.
   *
   * The engine said how many dice; the shared roller throws them; the reducer
   * turns the faces into a result. The 3D dice on the stage and the readout the
   * player sees are the same roll, not two that happen to agree.
   */
  const makeRoll = (spec: RollSpec, damageRoll?: DamageRollSpec): void => {
    const dice = rollFor(spec)
    const faces = dice.map((d) => d.value)
    const result = game.dispatch({ ...spec.command, faces } as never)
    if (result.rejected) { setNote(result.rejected.join(' · ')); return }

    // From the returned events, not from `game.events` — that array is last
    // render's, so reading it here silently drops the roll just made.
    const rolled = outcomeFromEvents(result.events)
    if (rolled) setOutcome(rolled)
    setDamageOutcome(null)
    setDamageSpec(damageRoll ?? null)

    setRoll({
      id: `solo-${rollSeq}`,
      campaignId: 'solo',
      rollerId: 'solo',
      characterId: game.view.meta.characterId,
      rollerName: game.view.meta.name,
      color: '#c9a227',
      notation: `${spec.diceCount}d20${spec.modifierDisplay}`,
      dice,
      modifier: spec.modifier,
      total: totalOf(dice, spec.modifier),
      visibility: 'public',
      theme: 'bone',
      at: rollSeq
    })
    setRollSeq((n) => n + 1)
    setNote(null)
  }

  // The follow-up: once an attack has landed, roll what it does.
  const rollDamage = (): void => {
    // No `outcome` is a legitimate state, not a missing one: Magic Missile and
    // Cure Wounds land with no to-hit roll in front of them, and nothing that
    // never rolled a d20 can have rolled a critical.
    if (!damageSpec) return
    const critical = Boolean(outcome?.critical)
    const faces = rollDamageFaces(damageSpec, critical)
    const result = game.dispatch({
      type: 'rollDamage', characterId: damageSpec.characterId,
      source: damageSpec.source, critical, faces
    } as never)
    if (result.rejected) { setNote(result.rejected.join(' · ')); return }
    const rolled = damageOutcomeFromEvents(result.events)
    if (!rolled) return
    setDamageOutcome(rolled)
    setDamageSpec(null)

    setRoll({
      id: `solo-${rollSeq}`,
      campaignId: 'solo',
      rollerId: 'solo',
      characterId: game.view.meta.characterId,
      rollerName: game.view.meta.name,
      color: '#c9a227',
      notation: rolled.damageLabel,
      dice: damageSpec.pools.flatMap((p, i) =>
        (faces[i] ?? []).map((value) => ({ sides: p.dice.sides as 4 | 6 | 8 | 10 | 12 | 20, value }))),
      modifier: 0,
      total: rolled.total,
      visibility: 'public',
      theme: 'bone',
      at: rollSeq
    })
    setRollSeq((n) => n + 1)
    setNote(null)
  }

  return (
    <>
      <StageView
        snapshot={EMPTY_SNAPSHOT}
        resolveAsset={() => null}
        idleMessage="The hall is dark. Your torch gutters."
        roll={roll}
        diceBottomInset={HUD_RESERVED_PX}
      />

      {/* The result sits above the HUD, where the eye already is. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 p-4">
        {outcome && (
          <RollResult
            outcome={outcome}
            onDismiss={() => { setOutcome(null); setDamageSpec(null) }}
            onRollDamage={damageSpec ? rollDamage : undefined}
            damageVerb={healingPending ? 'Roll Healing' : 'Roll Damage'}
          />
        )}
        {/* No attack roll in front of it, so the prompt stands alone. */}
        {!outcome && damageSpec && (
          <DamagePrompt
            label={damageLabelOf(damageSpec)}
            healing={healingPending}
            onRoll={rollDamage}
            onDismiss={() => setDamageSpec(null)}
          />
        )}
        {damageOutcome && (
          <DamageResult outcome={damageOutcome} onDismiss={() => setDamageOutcome(null)} />
        )}
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
            // An attack is a roll; everything else is a state transition.
            if (action.roll) { makeRoll(action.roll, action.damageRoll); return }
            const { rejected } = game.dispatch(action.command)
            if (rejected) { setNote(rejected.join(' · ')); return }
            // A spell that lands without a to-hit roll — Magic Missile, Cure
            // Wounds — still has a number to roll, and no attack result to
            // hang the button off. Offer it on its own.
            setOutcome(null)
            setDamageOutcome(null)
            setDamageSpec(action.damageRoll ?? null)
            setNote(action.damageRoll ? null : `${action.label} used`)
          }}
        />
      </div>

      {menuTab && (
        <GameMenu
          view={game.view}
          tab={menuTab}
          onTab={setMenuTab}
          onClose={() => setMenuTab(null)}
          dispatch={(c) => game.dispatch(c).rejected}
          onRoll={(spec, damageRoll) => { setMenuTab(null); makeRoll(spec, damageRoll) }}
        />
      )}

      {dmOpen && (
        <DmPanel
          view={game.view}
          dispatch={(c) => game.dispatch(c).rejected}
          onClose={onCloseDm}
        />
      )}
    </>
  )
}
