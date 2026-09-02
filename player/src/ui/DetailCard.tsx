// The card behind a spell, an action or an item.
//
// Everything here is already computed by the engine and was, until now,
// rendered as a run-on grey sentence: "Action · 120 ft · V, S · Concentration".
// True, and unreadable at a glance. This gives that same data the shape a
// player actually reads it in — what it does, how much it hurts, what it
// costs — with the cost isolated in its own footer so "can I afford this?"
// never has to be hunted for.
//
// It computes nothing about the rules. `damageRange` turns a dice pool into
// the min/max a player wants to see, which is arithmetic on numbers the view
// model already carries, not a rules decision.

import type { DamageRollSpec, DamageType } from '@engine'
import { damageTypeIcon } from './icons'

/**
 * The lowest and highest a damage pool can roll.
 *
 * `flat` already carries the dice's own modifier — build.ts folds it in when
 * it assembles the pools — so this is exactly count..count*sides plus that.
 */
export function damageRange(spec: DamageRollSpec): { min: number; max: number } {
  let min = 0
  let max = 0
  for (const p of spec.pools) {
    min += p.dice.count + p.flat
    max += p.dice.count * p.dice.sides + p.flat
  }
  return { min, max }
}

/** "3d4+3", or "2d6 + 1d8" when a pool mixes types. */
export function damageFormula(spec: DamageRollSpec): string {
  return spec.pools
    .map((p) => `${p.dice.count}d${p.dice.sides}${p.flat > 0 ? `+${p.flat}` : ''}`)
    .join(' + ')
}

// Damage types read faster with colour than with a word alone — fire is warm,
// cold is cold, healing is the same green the HP bar uses. Physical types stay
// deliberately neutral so the elemental ones carry the signal.
const DAMAGE_TONE: Record<string, string> = {
  fire: 'text-orange-400',
  cold: 'text-sky-300',
  lightning: 'text-yellow-300',
  thunder: 'text-indigo-300',
  acid: 'text-lime-400',
  poison: 'text-green-400',
  necrotic: 'text-purple-400',
  radiant: 'text-amber-200',
  force: 'text-fuchsia-300',
  psychic: 'text-violet-400',
  healing: 'text-verdigris'
}

export function damageTone(type: DamageType | 'healing' | undefined): string {
  return (type && DAMAGE_TONE[type]) ?? 'text-parchment/80'
}

function Meta({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div className="min-w-0">
      <p className="text-[9px] uppercase tracking-widest text-parchment/35">{label}</p>
      <p className="truncate text-[12px] text-parchment/75">{value}</p>
    </div>
  )
}

export interface DetailCardProps {
  /** "Level 1 Evocation Spell", "Action · Weapon". Sits under the row's own title. */
  subtitle?: string
  /** The headline number, when the thing does damage or healing. */
  damage?: DamageRollSpec
  /** "+7" for an attack, "DC 14 DEX" for a save. Shown beside the headline. */
  toHit?: string
  saveLabel?: string
  description?: string
  /** Plain-language consequences the engine derived from the effect source. */
  lines?: string[]
  /** Casting time, range, duration, components — whichever exist. */
  meta?: { label: string; value: string }[]
  /** The footer bar: what taking this costs. */
  cost?: string[]
  /** Shown in the footer's own voice when the thing cannot be used right now. */
  unavailable?: string[]
}

export function DetailCard({
  subtitle, damage, toHit, saveLabel, description, lines, meta, cost, unavailable
}: DetailCardProps): React.JSX.Element {
  const range = damage ? damageRange(damage) : null
  const healing = damage?.pools[0]?.type === 'healing'
  const tone = damageTone(damage?.pools[0]?.type)

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-white/10 bg-black/25">
      <div className="space-y-3 px-3 py-2.5">
        {subtitle && (
          <p className="text-[11px] italic text-parchment/45">{subtitle}</p>
        )}

        {/* The number first. It is what the player came to the card for. */}
        {range && (
          <div>
            <p className="text-lg leading-none font-semibold tabular-nums text-parchment">
              {range.min}~{range.max}
              <span className="ml-1.5 text-[12px] font-normal text-parchment/50">
                {healing ? 'Healing' : 'Damage'}
              </span>
            </p>
            <p className={`mt-1 flex items-center gap-1.5 text-[12px] tabular-nums ${tone}`}>
              {!healing && damage!.pools[0] && damageTypeIcon(damage!.pools[0].type as DamageType) && (
                <img
                  src={damageTypeIcon(damage!.pools[0]!.type as DamageType)}
                  alt=""
                  className="h-3.5 w-3.5 opacity-90"
                />
              )}
              {damageFormula(damage!)} {damage!.pools[0]?.type}
            </p>
          </div>
        )}

        {(toHit || saveLabel) && (
          <div className="flex flex-wrap gap-4">
            {toHit && <Meta label="Attack" value={toHit} />}
            {saveLabel && <Meta label="Save" value={saveLabel} />}
          </div>
        )}

        {description && (
          <p className="text-[13px] leading-relaxed text-parchment/70">{description}</p>
        )}

        {lines && lines.length > 0 && (
          <ul className="space-y-0.5">
            {lines.map((line, i) => (
              <li key={i} className="text-[12px] text-parchment/55">· {line}</li>
            ))}
          </ul>
        )}

        {meta && meta.length > 0 && (
          <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-white/5 pt-2.5">
            {meta.map((m) => <Meta key={m.label} label={m.label} value={m.value} />)}
          </div>
        )}
      </div>

      {/* What it costs, in its own bar — the one thing worth never hunting for. */}
      {cost && cost.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-arcane/25 bg-arcane/10 px-3 py-1.5">
          {cost.map((c) => (
            <span key={c} className="text-[11px] text-parchment/80">{c}</span>
          ))}
        </div>
      )}

      {unavailable && unavailable.length > 0 && (
        <div className="border-t border-ember/25 bg-ember/10 px-3 py-1.5">
          <span className="text-[11px] text-ember">Unavailable — {unavailable.join(' · ')}</span>
        </div>
      )}
    </div>
  )
}
