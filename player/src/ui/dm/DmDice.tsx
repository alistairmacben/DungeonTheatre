// The DM's dice.
//
// Two different needs behind one panel. Free-form dice are for everything the
// engine does not model — a monster's attack, a hidden check, a wandering
// encounter table — and the engine correctly knows nothing about any of it.
// Rolling on a character's behalf is the opposite: it goes through that
// character's own sheet so the modifiers are real, which matters because the
// number the table sees has to be the number the rules produce.
//
// Both land on the shared stage, because a DM roll nobody watches is a DM
// rolling in private, which they could do with actual dice.

import React, { useState } from 'react'
import type { PlayerView, RollSpec } from '@engine'
import { DIE_TYPES, rollValues, type DieSides, type RollVisibility } from '@shared/dice'

// The shared roller's own vocabulary, so the DM can never ask the stage for
// a die its tray has no model of. No d100: percentile is not something this
// engine or its dice ever had.
const DICE = DIE_TYPES

export interface StageRoll {
  notation: string
  dice: { sides: DieSides; value: number }[]
  modifier: number
  total: number
  visibility: RollVisibility
}

export function DmDice({ view, onRollToStage, onRollCharacter }: {
  /** The selected character, when one is open. Absent is fine — see below. */
  view: PlayerView | null
  onRollToStage(roll: StageRoll): void
  /** Rolls a real check or save through the character's own sheet. */
  onRollCharacter(spec: RollSpec): void
}): React.JSX.Element {
  const [count, setCount] = useState(1)
  const [sides, setSides] = useState<DieSides>(20)
  const [modifier, setModifier] = useState(0)
  const [hidden, setHidden] = useState(false)

  const throwDice = (): void => {
    const dice = rollValues({ dice: [{ sides, qty: count }], modifier: 0 })
    const total = dice.reduce((sum, d) => sum + d.value, 0) + modifier
    const sign = modifier > 0 ? `+${modifier}` : modifier < 0 ? `${modifier}` : ''
    onRollToStage({
      notation: `${count}d${sides}${sign}`,
      dice: dice.map((d) => ({ sides: d.sides as DieSides, value: d.value })),
      modifier,
      total,
      // A whispered roll still happens; the table simply is not shown it.
      // That is a DM screen, not a lie — the roll is real either way, and
      // `whisper` is the vocabulary the dice tray already speaks.
      visibility: hidden ? 'whisper' : 'public'
    })
  }

  return (
    <div className="space-y-4">
      <section className="space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-parchment/40">Throw dice</p>
        <div className="flex flex-wrap items-center gap-1.5">
          <input
            type="number" min={1} max={20} value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
            className="w-14 rounded border border-white/15 bg-black/30 px-2 py-1 text-right text-[13px] text-parchment"
          />
          <span className="text-parchment/40">d</span>
          {DICE.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setSides(d)}
              className={`rounded px-2 py-1 text-[12px] tabular-nums transition ${
                sides === d
                  ? 'bg-ember/20 text-ember'
                  : 'bg-white/5 text-parchment/50 hover:text-parchment/80'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-parchment/45">modifier</label>
          <input
            type="number" value={modifier}
            onChange={(e) => setModifier(Number(e.target.value) || 0)}
            className="w-16 rounded border border-white/15 bg-black/30 px-2 py-1 text-right text-[13px] text-parchment"
          />
          <label className="ml-2 flex items-center gap-1.5 text-[11px] text-parchment/45">
            <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} />
            whisper
          </label>
          <button
            type="button"
            onClick={throwDice}
            className="ml-auto rounded-lg border border-ember/50 bg-ember/10 px-3 py-1.5 text-[13px] text-parchment transition hover:bg-ember/20"
          >
            Roll
          </button>
        </div>
      </section>

      {view && (
        <section className="space-y-2 border-t border-white/10 pt-3">
          <p className="text-[10px] uppercase tracking-widest text-parchment/40">
            Roll for {view.meta.name}
          </p>
          <p className="text-[11px] text-parchment/40">
            Goes through their sheet, so the modifier is the real one.
          </p>
          <div className="flex flex-wrap gap-1">
            {view.abilities.map((a) => (
              <button
                key={a.ability}
                type="button"
                onClick={() => onRollCharacter(a.saveRoll)}
                title={`${a.label} saving throw ${a.save.display}`}
                className="rounded bg-white/5 px-2 py-1 text-[11px] uppercase tracking-wide text-parchment/60 transition hover:bg-white/10 hover:text-parchment"
              >
                {a.ability} save
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {view.skills.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onRollCharacter(s.roll)}
                title={`${s.roll.label} ${s.roll.modifierDisplay}`}
                className="rounded bg-white/5 px-2 py-1 text-[11px] text-parchment/60 transition hover:bg-white/10 hover:text-parchment"
              >
                {s.roll.label.replace(/\s[+-]\d+$/, '')}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
