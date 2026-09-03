// The player HUD.
//
// Visually quiet, and deliberately incomplete: it answers "am I okay?", "what
// am I holding?", "what can I do right now?" and "what resources do I have?".
// Ability scores, skills, saves, the full inventory and every action live
// behind the menu, because a theatre screen with a character sheet on it is the
// thing this product exists not to be.

import React from 'react'
import type { ActionCostView, ActionView, PlayerView } from '@engine'
import { ResourceDisplay } from './Readouts'
import { actionIcon } from './icons'
import { ActionEconomyPips, isSpent, useActionEconomy } from './ActionEconomy'
import { barFor, usePinnedActions } from './usePinnedActions'

/**
 * The suggested bar, before the player has said otherwise.
 *
 * What earns a slot, in order:
 *  1. Weapon attacks.
 *  2. Anything with a combat effect — a damage cantrip, an attack-roll spell,
 *     a save-for-effect spell. A caster's whole kit can be spells, so a rule
 *     that only looked at weapons left them with an empty bar.
 *  3. Everything else that spends a resource — buffs, utility, healing.
 *  4. The character's free abilities. This tier matters on its own: a rogue's
 *     Cunning Action costs nothing at all, so folding it into tier 3 left the
 *     character whose entire identity is bonus actions with one button. Dash,
 *     Dodge and Hide stay in the menu — everyone has those.
 */
export function suggestedBar(actions: ActionView[]): ActionView[] {
  const usable = actions.filter((a) => a.available)
  return [
    ...usable.filter((a) => a.kind === 'attack'),
    ...usable.filter((a) => a.kind !== 'attack' && hasCombatEffect(a)),
    ...usable.filter((a) => a.kind !== 'attack' && !hasCombatEffect(a) && a.costs.length > 0),
    ...usable.filter((a) =>
      a.kind !== 'attack' && !hasCombatEffect(a) && a.costs.length === 0 && a.kind !== 'basic'
      && a.sourceId !== 'system:baseline')
  ]
}

export function hasCombatEffect(a: ActionView): boolean {
  return Boolean(a.preview?.damageLabel || a.preview?.attackBonusDisplay || a.preview?.saveDc)
}

/** "1d10 fire · +7" — the numbers a player picks an action by. */
export function previewLine(a: ActionView): string | null {
  const p = a.preview
  if (!p) return null
  const parts = [
    p.damageLabel,
    p.attackBonusDisplay,
    p.saveDc ? `DC ${p.saveDc}${p.saveAbility ? ` ${p.saveAbility.toUpperCase()}` : ''}` : null
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : null
}

export function Hud({
  view, onOpenMenu, onAction, portraitUrl
}: {
  view: PlayerView
  onOpenMenu(tab?: string): void
  onAction(actionId: string): void
  /** The square crop from the portrait picker. Absent until one is chosen. */
  portraitUrl?: string
}): React.JSX.Element {
  const prefs = usePinnedActions(view.meta.characterId)
  const economy = useActionEconomy()
  // Only what is happening to you now. Permanent traits belong in the menu —
  // a chip for "Fighting Style: Defense" that never goes away is furniture.
  const active = view.effects.filter((e) => e.kind !== 'passive')

  const hp = view.vitals.hitPoints
  const hpPct = hp.max.value > 0 ? Math.max(0, Math.min(100, (hp.current / hp.max.value) * 100)) : 0
  const bloodied = hp.current <= hp.max.value / 2

  const weapon = view.equipment.find((s) => s.slot === 'mainHand')
  const weaponAction = view.actions.find((a) => a.kind === 'attack')

  // The HUD shows a handful of actions, not all of them. The player's own
  // picks come first, then the suggestion fills the rest. Unavailable ones are
  // excluded from the suggestion rather than greyed — a bar of things you
  // cannot do is worse than a shorter bar — but an action the player pinned
  // deliberately stays put and greys out, because a bar that rearranges itself
  // every time a slot runs dry is a bar nobody can build muscle memory on.
  const pinned = barFor(suggestedBar(view.actions), view.actions, prefs)

  return (
    <div className="pointer-events-auto flex items-end gap-3 rounded-2xl border border-white/10 bg-ink/80 px-4 py-3 shadow-2xl backdrop-blur-md">

      {/* Am I okay?
          The portrait carries the answer rather than sitting beside it: the
          ring is the health bar, so the thing the eye already goes to when
          something hits you is the thing that changed. */}
      <button
        type="button"
        onClick={() => onOpenMenu('character')}
        title={`${view.meta.name} — ${hp.current}/${hp.max.display} hit points`}
        className="group relative shrink-0"
      >
        <div
          className="grid h-[4.5rem] w-[4.5rem] place-items-center rounded-full p-[3px] transition"
          // A conic gradient is the ring: filled to the health fraction, track
          // the rest of the way round. One element, no SVG, and it animates.
          style={{
            background: `conic-gradient(${bloodied ? '#e0a458' : '#4fae94'} ${hpPct}%, rgba(255,255,255,0.10) ${hpPct}%)`
          }}
        >
          <div className="grid h-full w-full place-items-center overflow-hidden rounded-full border border-white/10 bg-ink-soft">
            {portraitUrl ? (
              <img src={portraitUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="font-display text-lg text-parchment/50">
                {initialsOf(view.meta.name)}
              </span>
            )}
          </div>
        </div>

        {/* Hit points, on the portrait's hem where BG3 puts them. */}
        <span
          className={`absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border border-white/15 px-2 py-px text-[11px] font-semibold tabular-nums backdrop-blur ${
            bloodied ? 'bg-ink/95 text-ember' : 'bg-ink/95 text-parchment'
          }`}
        >
          {hp.current}
          <span className="text-parchment/40">/{hp.max.display}</span>
        </span>

        {/* Armour class, as its own badge rather than a labelled column. */}
        <span className="absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full border border-arcane/50 bg-ink px-1 text-[11px] font-semibold tabular-nums text-parchment">
          {view.vitals.armorClass.display}
        </span>

        {hp.temporary > 0 && (
          <span className="absolute -left-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full border border-arcane/60 bg-arcane/25 px-1 text-[11px] tabular-nums text-parchment">
            +{hp.temporary}
          </span>
        )}
      </button>

      <Divider />

      {/* What do I have left this turn? Sits next to the portrait because it
          answers the same question the health ring does: what shape am I in
          right now. */}
      <ActionEconomyPips economy={economy} />

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
        {pinned.map((a) => {
          const preview = previewLine(a)
          // Spent is a nudge, not a veto: the engine models no turn at all,
          // so the DM may well allow it. Dim it and say so.
          const spent = isSpent(a.cost, economy)
          return (
            <button
              key={a.id}
              type="button"
              disabled={!a.available}
              title={a.available
                ? [a.label, preview, a.cost.label, spent ? `(${a.cost.label} already used this turn)` : null]
                  .filter(Boolean).join(' — ')
                : a.unavailableReasons.join(' · ')}
              onClick={() => { economy.spend(a.cost); onAction(a.id) }}
              className={`relative flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition ${
                a.available
                  ? `border-white/15 bg-white/5 hover:border-arcane/60 hover:bg-arcane/10 ${spent ? 'opacity-50' : ''}`
                  : 'cursor-not-allowed border-white/5 bg-transparent opacity-40'
              }`}
            >
              {/* The picture is the point of a hotbar: a player learns the
                  shape long before they re-read the name. */}
              {/* The cost, as the same shape the pips use, cornered on the
                  icon. Reading "this is a bonus action" should not require
                  reading a word. */}
              <CostMark cost={a.cost} />
              {actionIcon(a) && (
                <img src={actionIcon(a)} alt="" className="h-8 w-8 shrink-0 rounded" />
              )}
              <span className="min-w-0">
              <span className="block max-w-[7.5rem] truncate text-[12px] text-parchment">{a.label}</span>
              {/* What it does, not just what it costs. A caster picking between
                  three cantrips is choosing on the damage, and making them open
                  the menu to see it is the whole complaint. */}
              {a.available && preview ? (
                <span className="block max-w-[7.5rem] truncate text-[10px] tabular-nums text-parchment/60">
                  {preview}
                </span>
              ) : (
                <span className="block max-w-[7.5rem] truncate text-[10px] text-parchment/45">
                  {a.available ? a.cost.label : a.unavailableReasons[0]}
                </span>
              )}
              </span>
            </button>
          )
        })}

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

/**
 * A cost, as a shape rather than a word.
 *
 * The same green circle / orange triangle / blue diamond the pips use, so
 * "what does this cost" and "what do I have left" are answered in one
 * vocabulary. Free and movement get no mark: nothing is rationed there, and a
 * mark that never means anything is noise on every button that has one.
 */
function CostMark({ cost }: { cost: ActionCostView }): React.JSX.Element | null {
  const shape =
    cost.type === 'action' ? 'rounded-full bg-verdigris'
      : cost.type === 'bonusAction' ? '[clip-path:polygon(50%_0%,100%_100%,0%_100%)] bg-ember'
        : cost.type === 'reaction' ? 'rotate-45 bg-arcane'
          : null
  if (!shape) return null
  return (
    <span
      title={cost.label}
      className={`pointer-events-none absolute -left-1 -top-1 h-2.5 w-2.5 ${shape}`}
    />
  )
}

function Divider(): React.JSX.Element {
  return <div className="h-10 w-px shrink-0 self-center bg-white/10" />
}

/** "Sir Aldren" -> "SA". What the portrait shows before there is a portrait. */
function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}
