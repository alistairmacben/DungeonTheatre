// The player HUD.
//
// Visually quiet, and deliberately incomplete: it answers "am I okay?", "what
// am I holding?", "what can I do right now?" and "what resources do I have?".
// Ability scores, skills, saves, the full inventory and every action live
// behind the menu, because a theatre screen with a character sheet on it is the
// thing this product exists not to be.

import React from 'react'
import type { PlayerView } from '@engine'
import { ResourceDisplay, Value } from './Readouts'

export function Hud({
  view, onOpenMenu, onAction
}: {
  view: PlayerView
  onOpenMenu(tab?: string): void
  onAction(actionId: string): void
}): React.JSX.Element {
  // Only what is happening to you now. Permanent traits belong in the menu —
  // a chip for "Fighting Style: Defense" that never goes away is furniture.
  const active = view.effects.filter((e) => e.kind !== 'passive')

  const hp = view.vitals.hitPoints
  const hpPct = hp.max.value > 0 ? Math.max(0, Math.min(100, (hp.current / hp.max.value) * 100)) : 0
  const bloodied = hp.current <= hp.max.value / 2

  const weapon = view.equipment.find((s) => s.slot === 'mainHand')
  const weaponAction = view.actions.find((a) => a.kind === 'attack')

  // The HUD shows a handful of actions, not all of them. Attacks first, then
  // whatever costs a resource — those are the decisions a player actually
  // makes. Unavailable ones are excluded rather than greyed: a bar of things
  // you cannot do is worse than a shorter bar, and the full list with its
  // reasons is one click away in the menu.
  // Attacks, then things that spend a resource, then the character's own
  // abilities. The third tier matters: a rogue's Cunning Action costs nothing
  // at all, so a rule of "attacks and resource-spenders" left the character
  // whose entire identity is bonus actions with a HUD showing one button.
  // Dash, Dodge and Hide stay in the menu — everyone has those.
  const usable = view.actions.filter((a) => a.available)
  const pinned = [
    ...usable.filter((a) => a.kind === 'attack'),
    ...usable.filter((a) => a.kind !== 'attack' && a.costs.length > 0),
    ...usable.filter((a) =>
      a.kind !== 'attack' && a.costs.length === 0 && a.kind !== 'basic'
      && a.sourceId !== 'system:baseline')
  ].slice(0, 5)

  return (
    <div className="pointer-events-auto flex items-end gap-3 rounded-2xl border border-white/10 bg-ink/80 px-4 py-3 shadow-2xl backdrop-blur-md">

      {/* Am I okay? */}
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] uppercase tracking-widest text-parchment/45">HP</span>
          <span className={`text-2xl font-semibold tabular-nums ${bloodied ? 'text-ember' : 'text-parchment'}`}>
            {hp.current}
          </span>
          <span className="text-xs text-parchment/40">/</span>
          <Value readout={hp.max} size="sm" />
          {hp.temporary > 0 && (
            <span className="rounded bg-arcane/20 px-1 text-[10px] tabular-nums text-arcane">
              +{hp.temporary}
            </span>
          )}
        </div>
        <div className="h-1.5 w-40 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all duration-500 ${bloodied ? 'bg-ember' : 'bg-verdigris'}`}
            style={{ width: `${hpPct}%` }}
          />
        </div>
      </div>

      <Divider />

      {/* Armour Class — the number the equip loop changes */}
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[10px] uppercase tracking-widest text-parchment/45">AC</span>
        <Value readout={view.vitals.armorClass} />
      </div>

      <Divider />

      {/* What am I holding? */}
      <button
        type="button"
        onClick={() => onOpenMenu('inventory')}
        className="flex max-w-[11rem] flex-col items-start gap-0.5 text-left transition hover:opacity-80"
      >
        <span className="text-[10px] uppercase tracking-widest text-parchment/45">Equipped</span>
        <span className="truncate text-sm text-parchment">
          {weapon?.itemLabel ?? 'Unarmed'}
        </span>
        {weaponAction?.preview && (
          <span className="text-[11px] tabular-nums text-parchment/50">
            {weaponAction.preview.attackBonusDisplay} · {weaponAction.preview.damageLabel}
          </span>
        )}
      </button>

      {view.resources.length > 0 && (
        <>
          <Divider />
          <div className="flex items-end gap-4">
            {view.resources.slice(0, 4).map((r) => (
              <ResourceDisplay key={r.id} resource={r} />
            ))}
          </div>
        </>
      )}

      {active.length > 0 && (
        <>
          <Divider />
          <button
            type="button"
            onClick={() => onOpenMenu('effects')}
            className="flex flex-col items-start gap-1 transition hover:opacity-80"
          >
            <span className="text-[10px] uppercase tracking-widest text-parchment/45">Effects</span>
            <div className="flex flex-wrap gap-1">
              {active.slice(0, 4).map((e) => (
                <span
                  key={e.id}
                  title={e.effects.join(' · ')}
                  className="rounded bg-ember/15 px-1.5 py-0.5 text-[11px] text-ember"
                >
                  {e.label}
                </span>
              ))}
            </div>
          </button>
        </>
      )}

      <Divider />

      {/* What can I do right now? */}
      <div className="flex items-center gap-1.5">
        {pinned.map((a) => (
          <button
            key={a.id}
            type="button"
            disabled={!a.available}
            title={a.available ? a.label : a.unavailableReasons.join(' · ')}
            onClick={() => onAction(a.id)}
            className={`rounded-lg border px-2.5 py-2 text-left transition ${
              a.available
                ? 'border-white/15 bg-white/5 hover:border-arcane/60 hover:bg-arcane/10'
                : 'cursor-not-allowed border-white/5 bg-transparent opacity-40'
            }`}
          >
            <span className="block max-w-[7rem] truncate text-[12px] text-parchment">{a.label}</span>
            <span className="block text-[10px] text-parchment/45">
              {a.available ? a.cost.label : a.unavailableReasons[0]}
            </span>
          </button>
        ))}

        <button
          type="button"
          onClick={() => onOpenMenu()}
          className="ml-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-parchment transition hover:border-arcane/60 hover:bg-arcane/10"
        >
          Menu
        </button>
      </div>
    </div>
  )
}

function Divider(): React.JSX.Element {
  return <div className="h-10 w-px shrink-0 self-center bg-white/10" />
}
