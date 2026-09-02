// Rolling, and showing what happened.
//
// The engine decides how many dice and which to keep; this rolls that many and
// sends the faces back. That split is the whole reason a player can click a
// skill without knowing that chain mail gave them disadvantage — the number of
// dice already accounts for it.

import React from 'react'
import type { DamageRollSpec, DiceExpr, PlayerCommand, RollSpec } from '@engine'
import { rollValues, type DieSides, type RolledDie } from '@shared/dice'

/** The faces for a spec, using the shared roller the dice tray already uses. */
export function rollFor(spec: RollSpec): RolledDie[] {
  return rollValues({ dice: [{ sides: 20, qty: spec.diceCount }], modifier: 0 })
}

/**
 * Rolls a hit's damage locally — one pool at a time, since each pool can be a
 * different die size. `critical` doubles the dice, never the flat bonus
 * (folded server-side); the server re-rolls all of this anyway, this is only
 * what animates on the roller's own screen while the real answer is in transit.
 */
export function rollDamageFaces(spec: DamageRollSpec, critical: boolean): number[][] {
  return spec.pools.map(({ dice }: { dice: DiceExpr }) => {
    const count = dice.count * (critical ? 2 : 1)
    const sides = dice.sides as DieSides
    return rollValues({ dice: [{ sides, qty: count }], modifier: 0 }).map((d) => d.value)
  })
}

/** True when this roll restores hit points rather than removing them. */
export function isHealing(spec: DamageRollSpec | null): boolean {
  return spec?.pools.some((p) => p.type === 'healing') ?? false
}

/** "2d10 fire", "1d8+3 healing" — what is about to be thrown. */
export function damageLabelOf(spec: DamageRollSpec): string {
  return spec.pools
    .map((p) => {
      const flat = p.flat > 0 ? `+${p.flat}` : p.flat < 0 ? `${p.flat}` : ''
      return `${p.dice.count}d${p.dice.sides}${flat} ${p.type}`
    })
    .join(' + ')
}

export interface DamageOutcome {
  label: string
  critical: boolean
  total: number
  damageLabel: string
  pools: { type: string; rolls: number[]; total: number }[]
}

export interface RollOutcome {
  label: string
  faces: number[]
  natural: number
  modifier: number
  total: number
  advantage: string
  success?: boolean
  critical?: boolean
  criticalMiss?: boolean
  terms: {
    source: string; value?: number; op?: string
    applied: boolean; reason?: string; note?: string
  }[]
}

/**
 * A compact, tappable readout: name, bonus, and one tap to roll it.
 *
 * This is the level-1 form. The bonus is visible because a player learns from
 * seeing it; everything behind it stays behind it.
 */
export function RollChip({
  spec, sublabel, marker, icon, onRoll
}: {
  spec: RollSpec
  sublabel?: string
  /** A proficiency dot, an advantage arrow — whatever the caller wants shown. */
  marker?: React.ReactNode
  /** URL of a small icon shown before the label, if one exists for this roll. */
  icon?: string
  onRoll(spec: RollSpec): void
}): React.JSX.Element {
  const advantaged = spec.diceCount > 1
  return (
    <button
      type="button"
      onClick={() => onRoll(spec)}
      className="group flex w-full items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-left transition hover:border-arcane/50 hover:bg-arcane/10"
    >
      <span className="flex min-w-0 items-center gap-1.5">
        {icon && <img src={icon} alt="" className="h-4 w-4 shrink-0 opacity-90" />}
        {marker}
        <span className="truncate text-[13px] text-parchment/85">{spec.label.replace(/\s[+-]\d+$/, '')}</span>
        {sublabel && (
          <span className="text-[10px] uppercase tracking-wide text-parchment/30">{sublabel}</span>
        )}
        {advantaged && (
          <span
            title={`${spec.keep === 'highest' ? 'advantage' : 'disadvantage'}: two dice`}
            className={`text-[9px] ${spec.keep === 'highest' ? 'text-verdigris' : 'text-ember'}`}
          >
            {spec.keep === 'highest' ? '▲' : '▼'}
          </span>
        )}
      </span>
      <span className="shrink-0 text-sm tabular-nums text-parchment/70 group-hover:text-parchment">
        {spec.modifierDisplay}
      </span>
    </button>
  )
}

/**
 * The result, front and centre.
 *
 * A new player needs the total and whether it was good. A veteran wants the
 * arithmetic. Both are here, the second one folded away.
 */
export function RollResult({
  outcome, onDismiss, onRollDamage, damageVerb = 'Roll Damage'
}: {
  outcome: RollOutcome
  onDismiss(): void
  /** Present right after an attack roll that has damage waiting to be rolled. */
  onRollDamage?(): void
  damageVerb?: string
}): React.JSX.Element {
  const [open, setOpen] = React.useState(false)
  const tone = outcome.critical
    ? 'border-verdigris/60 bg-verdigris/10'
    : outcome.criticalMiss
      ? 'border-ember/60 bg-ember/10'
      : 'border-white/15 bg-ink/90'

  return (
    <div className={`pointer-events-auto w-[22rem] rounded-xl border px-4 py-3 shadow-2xl backdrop-blur ${tone}`}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-[13px] text-parchment/70">{outcome.label}</span>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-[11px] text-parchment/40 transition hover:text-parchment/80"
        >
          dismiss
        </button>
      </div>

      <div className="mt-1 flex items-baseline gap-3">
        <span className="text-4xl font-semibold tabular-nums text-parchment">{outcome.total}</span>
        <span className="text-[12px] text-parchment/50">
          {/* Showing the die and the bonus separately is how a player learns
              what the bonus even is. */}
          d20 {outcome.natural} {outcome.modifier >= 0 ? '+' : '−'} {Math.abs(outcome.modifier)}
        </span>
        {outcome.critical && (
          <span className="rounded bg-verdigris/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-verdigris">
            critical
          </span>
        )}
        {outcome.criticalMiss && (
          <span className="rounded bg-ember/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-ember">
            fumble
          </span>
        )}
      </div>

      {outcome.faces.length > 1 && (
        <p className="mt-1 text-[11px] text-parchment/45">
          {outcome.advantage}: rolled {outcome.faces.join(' and ')}, kept {outcome.natural}
        </p>
      )}

      {onRollDamage && !outcome.criticalMiss && outcome.success !== false && (
        <button
          type="button"
          onClick={onRollDamage}
          className="mt-2 w-full rounded-lg border border-ember/40 bg-ember/10 py-1.5 text-[12px] font-medium text-ember transition hover:border-ember hover:bg-ember/20"
        >
          {outcome.critical ? 'Roll Damage (critical!)' : damageVerb}
        </button>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-2 text-[11px] text-parchment/40 transition hover:text-parchment/70"
      >
        {open ? 'hide the maths' : 'why this number?'}
      </button>

      {open && (
        <ul className="mt-2 space-y-0.5 border-t border-white/10 pt-2">
          {outcome.terms.filter((t) => t.applied).map((t, i) => (
            <li key={i} className="flex justify-between gap-3 text-[12px]">
              <span className="text-parchment/60">
                {t.source}
                {t.note && <span className="text-parchment/35"> · {t.note}</span>}
              </span>
              {t.value !== undefined && (
                <span className="tabular-nums text-parchment/80">
                  {/* Proficiency carries a multiplier. Showing it as "+2" makes
                      the reader's arithmetic disagree with the total. */}
                  {t.op === 'proficiency' || t.op === 'multiply'
                    ? `×${t.value}`
                    : t.value >= 0 ? `+${t.value}` : t.value}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Pulls the payload of the most recent RollMade event, if it is still fresh. */
export function outcomeFromEvents(
  events: { type: string; payload: Record<string, unknown> }[]
): RollOutcome | null {
  const made = events.find((e) => e.type === 'RollMade' && e.payload['kind'] !== 'damage')
  return made ? (made.payload as unknown as RollOutcome) : null
}

/** Same idea, for the damage-rolling follow-up. */
export function damageOutcomeFromEvents(
  events: { type: string; payload: Record<string, unknown> }[]
): DamageOutcome | null {
  const made = events.find((e) => e.type === 'RollMade' && e.payload['kind'] === 'damage')
  return made ? (made.payload as unknown as DamageOutcome) : null
}

/**
 * "Cure Wounds — Roll Healing", for a spell with no to-hit roll in front of it.
 *
 * Magic Missile, Sacred Flame and Cure Wounds all land without a d20, so there
 * is no attack result to hang the button off. Casting them used to end with a
 * note saying the spell was used and no number anywhere, which is not a spell
 * having been cast so much as a slot having been spent.
 */
export function DamagePrompt({
  label, healing, onRoll, onDismiss
}: {
  label: string
  healing: boolean
  onRoll(): void
  onDismiss(): void
}): React.JSX.Element {
  return (
    <div className="pointer-events-auto flex w-[22rem] items-center gap-3 rounded-xl border border-ember/40 bg-ink/90 px-4 py-2.5 shadow-2xl backdrop-blur">
      <span className="min-w-0 flex-1 truncate text-[13px] text-parchment/70">{label}</span>
      <button
        type="button"
        onClick={onRoll}
        className="shrink-0 rounded-lg border border-ember/50 bg-ember/10 px-3 py-1.5 text-[12px] font-medium text-ember transition hover:border-ember hover:bg-ember/20"
      >
        {healing ? 'Roll Healing' : 'Roll Damage'}
      </button>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 text-[11px] text-parchment/40 transition hover:text-parchment/80"
      >
        skip
      </button>
    </div>
  )
}

/** The total, front and centre — same idea as RollResult, no d20 involved. */
export function DamageResult({
  outcome, onDismiss
}: { outcome: DamageOutcome; onDismiss(): void }): React.JSX.Element {
  return (
    <div className="pointer-events-auto w-[22rem] rounded-xl border border-ember/50 bg-ink/90 px-4 py-3 shadow-2xl backdrop-blur">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-[13px] text-parchment/70">{outcome.label}</span>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-[11px] text-parchment/40 transition hover:text-parchment/80"
        >
          dismiss
        </button>
      </div>

      <div className="mt-1 flex items-baseline gap-3">
        <span className="text-4xl font-semibold tabular-nums text-parchment">{outcome.total}</span>
        <span className="text-[12px] text-parchment/50">{outcome.damageLabel}</span>
        {outcome.critical && (
          <span className="rounded bg-verdigris/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-verdigris">
            critical
          </span>
        )}
      </div>

      {outcome.pools.some((p) => p.rolls.length > 1) && (
        <p className="mt-1 text-[11px] text-parchment/45">
          rolled {outcome.pools.map((p) => p.rolls.join('+')).join(', ')}
        </p>
      )}
    </div>
  )
}

export type { PlayerCommand }
