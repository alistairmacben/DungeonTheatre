// The character, and everything on them.
//
// BG3 puts the model in the middle and the worn slots down either side, with
// the weapons and Armour Class along the bottom. That arrangement is doing
// real work: "what am I wearing" and "what am I holding" are different
// questions, and a flat grid of thirteen identical boxes answers neither at a
// glance. This is that layout, with an uploaded picture standing in for the
// model we have no way to render.
//
// Pure presentation. The slot vocabulary is the engine's own `EquipmentSlotId`
// and the only commands sent are the `equipItem`/`unequipItem` the inventory
// list already sent — nothing here decides a rule.

import React from 'react'
import type { PlayerView } from '@engine'
import { Inspect, InspectPanel } from './Inspect'
import { itemIcon } from './icons'

/**
 * Which slot sits where — worn on the body down the left, accessories down the
 * right, held things along the bottom. The split BG3 uses.
 *
 * The ids and labels are repeated here rather than read from the view because
 * `view.equipment` reports only *occupied* slots (build.ts filters on the
 * instance id). A paper doll is mostly empty frames — that is what makes it
 * readable at a glance — so it has to know the full set independently. These
 * are `EquipmentSlotId` values and their display names: presentation, not a
 * rule, and the engine stays untouched.
 */
const LEFT_COLUMN: SlotSpec[] = [
  { id: 'head', label: 'Head' },
  { id: 'cloak', label: 'Cloak' },
  { id: 'armor', label: 'Armour' },
  { id: 'gloves', label: 'Gloves' },
  { id: 'boots', label: 'Boots' }
]
const RIGHT_COLUMN: SlotSpec[] = [
  { id: 'amulet', label: 'Amulet' },
  { id: 'bracers', label: 'Bracers' },
  { id: 'belt', label: 'Belt' },
  { id: 'ring1', label: 'Ring' },
  { id: 'ring2', label: 'Ring' }
]
const HELD: SlotSpec[] = [
  { id: 'mainHand', label: 'Main Hand' },
  { id: 'offHand', label: 'Off Hand' },
  { id: 'shield', label: 'Shield' }
]

interface SlotSpec { id: string; label: string }

type Slot = PlayerView['equipment'][number]

export function EquipmentDoll({ view, portraitUrl, onEditPortrait, onUnequip }: {
  view: PlayerView
  portraitUrl?: string
  onEditPortrait(): void
  onUnequip(slot: Slot): void
}): React.JSX.Element {
  const bySlot = new Map(view.equipment.map((s) => [s.slot, s]))
  // Every frame is drawn; an unoccupied one stands in for itself.
  const column = (specs: SlotSpec[]): Slot[] =>
    specs.map((spec) => bySlot.get(spec.id) ?? { slot: spec.id, label: spec.label, effectSummary: [] })

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-stretch justify-center gap-3">
        <div className="flex flex-col gap-2">
          {column(LEFT_COLUMN).map((s) => (
            <SlotBox key={s.slot} slot={s} onUnequip={onUnequip} />
          ))}
        </div>

        {/* The figure. Clicking it is how a picture gets set or replaced —
            the same affordance the character tab uses. */}
        <button
          type="button"
          onClick={onEditPortrait}
          className="group relative w-44 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent"
        >
          {portraitUrl ? (
            <img src={portraitUrl} alt={view.meta.name} className="h-full w-full object-cover object-top" />
          ) : (
            <span className="grid h-full min-h-[15rem] w-full place-items-center px-3 text-center text-[11px] text-parchment/35">
              No picture yet — click to add one
            </span>
          )}
          <span className="absolute inset-x-0 bottom-0 bg-ink/85 py-1 text-center text-[10px] text-parchment/0 backdrop-blur transition group-hover:text-parchment/80">
            {portraitUrl ? 'Change picture' : 'Add a picture'}
          </span>
        </button>

        <div className="flex flex-col gap-2">
          {column(RIGHT_COLUMN).map((s) => (
            <SlotBox key={s.slot} slot={s} onUnequip={onUnequip} />
          ))}
        </div>
      </div>

      {/* Held, and what it all adds up to. AC sits between the weapons for the
          same reason BG3 puts it there: it is the number the equip loop moves. */}
      <div className="mt-3 flex items-center justify-center gap-3 border-t border-white/10 pt-3">
        {column(HELD).map((s) => (
          <SlotBox key={s.slot} slot={s} onUnequip={onUnequip} />
        ))}
        <div className="ml-2 flex flex-col items-center">
          <span className="grid h-11 w-11 place-items-center rounded-full border border-arcane/50 bg-arcane/10 text-base font-semibold tabular-nums text-parchment">
            {view.vitals.armorClass.display}
          </span>
          <span className="mt-0.5 text-[9px] uppercase tracking-widest text-parchment/40">AC</span>
        </div>
      </div>
    </div>
  )
}

/** "Chain Mail" -> "CH". What a slot shows when no icon matches the item. */
function initialsOf(label: string): string {
  return label.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase()
}

function SlotBox({ slot, onUnequip }: { slot: Slot; onUnequip(slot: Slot): void }): React.JSX.Element {
  const filled = Boolean(slot.itemLabel)
  const icon = slot.itemLabel ? itemIcon({ label: slot.itemLabel, slot: slot.slot }) : undefined

  const box = (
    <button
      type="button"
      disabled={!filled}
      onClick={() => onUnequip(slot)}
      title={filled ? `${slot.label}: ${slot.itemLabel} — click to unequip` : slot.label}
      className={`grid h-14 w-14 place-items-center rounded-lg text-[10px] transition ${
        filled
          ? 'border border-white/15 bg-white/[0.05] text-parchment/80 hover:border-arcane/60 hover:bg-arcane/10'
          // An empty slot is a dashed outline rather than a filled box, so the
          // eye can count what is missing without reading every label.
          : 'cursor-default border border-dashed border-white/10 text-parchment/25'
      }`}
    >
      {filled
        ? (icon
          ? <img src={icon} alt="" className="h-9 w-9 opacity-90" />
          : <span className="font-display text-sm">{initialsOf(slot.itemLabel!)}</span>)
        : <span className="px-1 text-center leading-tight">{slot.label}</span>}
    </button>
  )

  if (!filled) return box

  return (
    <Inspect
      panel={(
        <InspectPanel
          title={slot.itemLabel!}
          subtitle={slot.label}
          lines={slot.effectSummary}
          footer={slot.attuned ? ['Attuned'] : undefined}
        />
      )}
    >
      {box}
    </Inspect>
  )
}
