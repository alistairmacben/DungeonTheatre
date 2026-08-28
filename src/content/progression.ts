// The class tables, transcribed as tables.
//
// Every column here is copied from docs/srd-source/classes.pdf, index 0 being
// level 1. They live in one file rather than in each class because the slot
// ladders are genuinely shared — the bard, cleric, druid, sorcerer and wizard
// all print the identical block of numbers — and five transcriptions of the
// same column is five chances to fat-finger a 3 into a 2 in a way no test
// would catch and no player would notice until the wrong number cost them a
// spell mid-session.
//
// Verify these by reading down a column against the page. That is the whole
// reason they are shaped like the page.

import type { Modifier, ResourceDefinition } from '../rules/types.js'
import { declareResourceMax } from '../rules/statPaths.js'

/**
 * Slots per spell level for a full caster: bard, cleric, druid, sorcerer,
 * wizard. `FULL_CASTER_SLOTS[n]` is the column for (n+1)-level spell slots,
 * so `FULL_CASTER_SLOTS[0][4]` is "how many 1st-level slots at character
 * level 5" — four.
 *
 * A 0 means the caster has not reached that tier yet. The row is still
 * declared, because a resource that appears from nowhere at 17th level is
 * harder to reason about than one that reads 0 until it doesn't.
 */
export const FULL_CASTER_SLOTS: readonly (readonly number[])[] = [
  // 1st                                                       10                  15              20
  [2, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  // 2nd
  [0, 0, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  // 3rd
  [0, 0, 0, 0, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  // 4th
  [0, 0, 0, 0, 0, 0, 1, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  // 5th
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3],
  // 6th
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2],
  // 7th
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 2],
  // 8th
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1],
  // 9th
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1]
]

/** How many spell levels a full caster's ladder ever reaches. */
export const MAX_SPELL_LEVEL = FULL_CASTER_SLOTS.length

/** "1st", "2nd", "3rd"… for slot names, so no class spells them out by hand. */
export function ordinal(n: number): string {
  const suffix = n % 100 >= 11 && n % 100 <= 13
    ? 'th'
    : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'
  return `${n}${suffix}`
}

/**
 * The Paladin and Ranger slot columns, 1st through 5th (SRD p30 and p37).
 *
 * A half caster gets no slots at 1st level at all, and never climbs past 5th.
 * The two classes share the identical table, which is why this lives here
 * rather than in either file.
 */
export const HALF_CASTER_SLOTS: readonly (readonly number[])[] = [
  //   1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20
  [0, 2, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4], // 1st
  [0, 0, 0, 0, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3], // 2nd
  [0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3], // 3rd
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 3, 3], // 4th
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2]  // 5th
]

/** The top of a half caster's ladder, which is as high as they can prepare. */
export const HALF_CASTER_MAX_SPELL_LEVEL = [
  0, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5
]

/**
 * The five slot resources a half caster has.
 *
 * Identical in shape to `fullCasterSlots` and deliberately a separate function
 * rather than a parameter: the two tables are different data, and a single
 * function taking "how many columns" would invite passing the wrong one.
 */
export function halfCasterSlots(classId: string, group: string): {
  resources: ResourceDefinition[]
  modifiers: Modifier[]
} {
  return slotsFromTable(HALF_CASTER_SLOTS, classId, group)
}

/**
 * The nine slot resources a full caster has, and the modifiers that fill them
 * in from the table above.
 *
 * Each maximum is a stat path rather than a constant, which is what lets the
 * table reach it: `resource.<id>.max` accumulates modifiers like any other
 * stat, so a Ring of Spell Storing or a homebrew feature could add to it
 * later without this function knowing. The class file supplies only its own
 * id and slot group.
 */
export function fullCasterSlots(classId: string, group: string): {
  resources: ResourceDefinition[]
  modifiers: Modifier[]
} {
  return slotsFromTable(FULL_CASTER_SLOTS, classId, group)
}

function slotsFromTable(
  table: readonly (readonly number[])[], classId: string, group: string
): { resources: ResourceDefinition[]; modifiers: Modifier[] } {
  const resources: ResourceDefinition[] = []
  const modifiers: Modifier[] = []

  table.forEach((column, index) => {
    const level = index + 1
    const resourceId = `${group}.slots.${level}`
    const max = declareResourceMax(resourceId)

    resources.push({
      id: resourceId,
      name: `${ordinal(level)}-level Slots`,
      max,
      refresh: { kind: 'longRest' },
      display: 'slots',
      group: 'Spell Slots',
      order: level,
      spellSlot: { group, level }
    })

    modifiers.push({
      // Deterministic rather than counter-generated: the id says which slot of
      // which caster it is, which matters when it turns up in a breakdown.
      id: `slots:${group}:${level}`,
      channel: 'value',
      target: max,
      op: 'add',
      value: { classLevelTable: { classId, values: [...column] } },
      permanence: 'persistent',
      note: `${ordinal(level)}-level slots by ${group} level`
    })
  })

  return { resources, modifiers }
}
