// The DM's hand.
//
// Six generic verbs, not a button per D&D effect. The DM types a number and
// picks a type; the engine handles resistance, temporary hit points, the
// maximum, and the fact that a condition might be dormant until the table says
// otherwise. Nothing here needs a monster to exist — that is the whole point
// for a theatre-of-the-mind table.

import { useState } from 'react'
import type { PlayerCommand, PlayerView } from '@engine'

const DAMAGE_TYPES = [
  'slashing', 'piercing', 'bludgeoning', 'fire', 'cold', 'lightning',
  'acid', 'poison', 'necrotic', 'radiant', 'thunder', 'force', 'psychic'
] as const

const CONDITIONS = [
  'blinded', 'charmed', 'deafened', 'frightened', 'grappled', 'incapacitated',
  'invisible', 'paralyzed', 'petrified', 'poisoned', 'prone', 'restrained',
  'stunned', 'unconscious'
]

export function DmPanel({
  view, dispatch, onClose, embedded = false
}: {
  view: PlayerView
  dispatch(command: PlayerCommand): Promise<string[] | undefined> | string[] | undefined
  onClose(): void
  /**
   * True when the panel sits inside the DM screen rather than floating over
   * the stage. It then drops its own frame and close button: the surrounding
   * screen owns both, and a close button that closes nothing is a lie.
   */
  embedded?: boolean
}): React.JSX.Element {
  const [amount, setAmount] = useState(10)
  const [damageType, setDamageType] = useState<string>('slashing')
  const [note, setNote] = useState<string | null>(null)

  const send = (command: PlayerCommand, success: string): void => {
    // The DM's own commands are authoritative, so the note reports what the
    // server actually did rather than what was asked for.
    void Promise.resolve(dispatch(command))
      .then((rejected) => setNote(rejected ? rejected.join(' · ') : success))
  }

  const id = view.meta.characterId
  const active = view.effects.filter((e) => e.kind !== 'passive')

  return (
    <div className={embedded
      ? 'p-4'
      : 'pointer-events-auto absolute right-4 top-4 z-30 w-80 rounded-2xl border border-ember/30 bg-ink/95 p-4 shadow-2xl backdrop-blur'}>
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm text-ember">DM · {view.meta.name}</h3>
        {!embedded && (
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] text-parchment/40 transition hover:text-parchment/80"
          >
            close
          </button>
        )}
      </div>

      <p className="mt-1 text-[11px] text-parchment/40">
        {view.vitals.hitPoints.current} / {view.vitals.hitPoints.max.value} hp
        {view.vitals.hitPoints.temporary > 0 && ` (+${view.vitals.hitPoints.temporary} temp)`}
      </p>

      {/* --- damage and healing ------------------------------------------- */}
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
            className="w-16 rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-sm tabular-nums text-parchment"
          />
          <select
            value={damageType}
            onChange={(e) => setDamageType(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-xs text-parchment"
          >
            {DAMAGE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => send(
              { type: 'dmDamage', characterId: id, amount, damageType: damageType as never },
              `${amount} ${damageType} damage`)}
            className="flex-1 rounded-lg border border-ember/50 bg-ember/10 px-2 py-1.5 text-xs text-parchment transition hover:bg-ember/20"
          >
            Damage
          </button>
          <button
            type="button"
            onClick={() => send({ type: 'dmHeal', characterId: id, amount }, `healed ${amount}`)}
            className="flex-1 rounded-lg border border-verdigris/50 bg-verdigris/10 px-2 py-1.5 text-xs text-parchment transition hover:bg-verdigris/20"
          >
            Heal
          </button>
          <button
            type="button"
            onClick={() => send(
              { type: 'dmTemporaryHitPoints', characterId: id, amount },
              `${amount} temporary hit points`)}
            className="flex-1 rounded-lg border border-arcane/50 bg-arcane/10 px-2 py-1.5 text-xs text-parchment transition hover:bg-arcane/20"
          >
            Temp
          </button>
        </div>
      </div>

      {/* --- conditions ----------------------------------------------------- */}
      <div className="mt-4">
        <p className="mb-1.5 text-[10px] uppercase tracking-wide text-parchment/40">Conditions</p>
        <div className="flex flex-wrap gap-1">
          {CONDITIONS.map((c) => {
            const held = active.find((e) => e.id === `srd:condition.${c}`)
            const on = held !== undefined
            return (
              <button
                key={c}
                type="button"
                onClick={() => send(
                  on
                    ? {
                      type: 'removeCondition', characterId: id,
                      // The INSTANCE, not the condition — see EffectView.instanceId.
                      instanceId: held?.instanceId ?? ''
                    }
                    : {
                      type: 'applyCondition', characterId: id,
                      conditionId: `srd:condition.${c}` as never, sourceId: 'dm:narration'
                    },
                  on ? `removed ${c}` : `applied ${c}`)}
                className={`rounded px-1.5 py-0.5 text-[10px] transition ${
                  on
                    ? 'bg-ember/25 text-ember'
                    : 'bg-white/5 text-parchment/45 hover:bg-white/10 hover:text-parchment/70'
                }`}
              >
                {c}
              </button>
            )
          })}
        </div>
      </div>

      {/* --- resources ------------------------------------------------------ */}
      {view.resources.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-[10px] uppercase tracking-wide text-parchment/40">Resources</p>
          <div className="space-y-1">
            {view.resources.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-[11px] text-parchment/60">{r.label}</span>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    disabled={r.current <= 0}
                    onClick={() => send(
                      { type: 'dmSetResource', characterId: id, resourceId: r.id, remaining: r.current - 1 },
                      `${r.label} → ${r.current - 1}`)}
                    className="rounded bg-white/5 px-1.5 text-[11px] text-parchment/60 transition hover:bg-white/15 disabled:opacity-30"
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-[11px] tabular-nums text-parchment/70">
                    {r.current}/{r.maximum}
                  </span>
                  <button
                    type="button"
                    disabled={r.current >= r.maximum}
                    onClick={() => send(
                      { type: 'dmSetResource', characterId: id, resourceId: r.id, remaining: r.current + 1 },
                      `${r.label} → ${r.current + 1}`)}
                    className="rounded bg-white/5 px-1.5 text-[11px] text-parchment/60 transition hover:bg-white/15 disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- the improvised effect ------------------------------------------ */}
      <div className="mt-4">
        <p className="mb-1.5 text-[10px] uppercase tracking-wide text-parchment/40">Improvise</p>
        <AdHocEffect view={view} send={send} />
      </div>

      {note && <p className="mt-3 text-[11px] text-parchment/50">{note}</p>}
    </div>
  )
}

/**
 * An effect the DM builds at the table out of the ordinary vocabulary.
 *
 * Deliberately a stat, an operation and a number rather than a menu of named
 * D&D effects: anything the modifier language can say, the DM can say. It lands
 * with `dm` provenance, so the player's breakdown shows where it came from.
 */
function AdHocEffect({
  view, send
}: {
  view: PlayerView
  send(command: PlayerCommand, success: string): void
}): React.JSX.Element {
  const [label, setLabel] = useState('Blessing of the Idol')
  const [target, setTarget] = useState('armorClass')
  const [value, setValue] = useState(2)

  const applied = (view.effects ?? []).filter((e) => e.id.startsWith('dm:adhoc.'))

  return (
    <div className="space-y-2">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="what is it called?"
        className="w-full rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-xs text-parchment"
      />
      <div className="flex gap-2">
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-xs text-parchment"
        >
          <option value="armorClass">armour class</option>
          <option value="speed.walk">walking speed</option>
          <option value="hitPoints.max">maximum hit points</option>
          <option value="initiative">initiative</option>
          <option value="ability.str.score">Strength score</option>
          <option value="ability.dex.score">Dexterity score</option>
          <option value="ability.con.score">Constitution score</option>
          <option value="spell.saveDc">spell save DC</option>
        </select>
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-16 rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-xs tabular-nums text-parchment"
        />
      </div>
      <button
        type="button"
        onClick={() => send({
          type: 'dmApplyEffect',
          characterId: view.meta.characterId,
          effect: {
            id: `dm:adhoc.${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
            name: label,
            provenance: 'dm',
            contentVersion: 1,
            kind: 'environment',
            activation: { always: true },
            completeness: 'complete',
            modifiers: [{
              id: `dm-adhoc-${target}`,
              channel: 'value',
              target,
              op: 'add',
              value,
              permanence: 'temporary'
            }]
          }
        } as PlayerCommand, `${label} applied`)}
        className="w-full rounded-lg border border-white/15 px-2 py-1.5 text-xs text-parchment/80 transition hover:border-arcane/50 hover:text-parchment"
      >
        Apply
      </button>

      {applied.map((e) => (
        <button
          key={e.id}
          type="button"
          onClick={() => send(
            { type: 'dmRemoveEffect', characterId: view.meta.characterId, sourceId: e.id },
            `${e.label} removed`)}
          className="w-full rounded-lg bg-ember/10 px-2 py-1 text-left text-[11px] text-ember transition hover:bg-ember/20"
        >
          {e.label} — remove
        </button>
      ))}
    </div>
  )
}
