// Level tables — the SRD's columns of numbers, read as columns of numbers.
//
// The claim: a progression that has no closed form (a wizard's slots, a
// barbarian's rages) can be transcribed from the page and resolves correctly
// at every level from 1 to 20 and beyond, including for a character with no
// levels in that class at all.
//
// These are the numbers a character sheet is wrong about if this is wrong, so
// the tables here are checked against docs/srd-source/classes.pdf row by row
// rather than spot-checked.

import { evaluateValue, describeValue, isDynamic, loadContent, playerViewOf } from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()

/** A ValueEnv standing in for a character at the given levels. */
const envAt = (levels) => ({
  stat: () => 0,
  characterLevel: () => Object.values(levels).reduce((a, b) => a + b, 0),
  classLevel: (id) => levels[id] ?? 0,
  selection: () => undefined
})

// ---------------------------------------------------------------------------
// Reading a class column
// ---------------------------------------------------------------------------

{
  // The Rages column, barbarian: 2 2 3 3 3 4 4 4 4 4 4 5 5 5 5 5 6 6 6 —
  // with "unlimited" at 20, which this table cannot say and does not try to.
  const rages = {
    classLevelTable: {
      classId: 'srd:class.barbarian',
      values: [2, 2, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6, 6]
    }
  }
  const at = (n) => evaluateValue(rages, envAt({ 'srd:class.barbarian': n }))

  check.eq('class table: 2 rages at level 1', at(1), 2)
  check.eq('class table: still 2 at level 2', at(2), 2)
  check.eq('class table: 3 at level 3', at(3), 3)
  check.eq('class table: 4 at level 6', at(6), 4)
  check.eq('class table: still 4 at level 11', at(11), 4)
  check.eq('class table: 5 at level 12', at(12), 5)
  check.eq('class table: 6 at level 17', at(17), 6)
  check.eq('class table: 6 at level 20', at(20), 6)

  // The case that matters for multiclassing: no levels in the class, no value.
  check.eq('class table: a character with no barbarian levels gets nothing', at(0), 0)

  // A wizard 5 / barbarian 3 reads the barbarian column at 3, not at 8.
  check.eq('class table: it reads the class level, not the character level',
    evaluateValue(rages, envAt({ 'srd:class.barbarian': 3, 'srd:class.wizard': 5 })), 3)
}

// ---------------------------------------------------------------------------
// Reading a character-level column
// ---------------------------------------------------------------------------

{
  // Dragonborn breath weapon dice: 2d6, rising at 6th, 11th and 16th. This one
  // is character level, not class level — a dragonborn wizard 3 / rogue 3
  // breathes as a 6th-level character.
  const breath = { characterLevelTable: [2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5] }
  const at = (n) => evaluateValue(breath, envAt({ 'srd:class.sorcerer': n }))

  check.eq('character table: 2 dice at level 1', at(1), 2)
  check.eq('character table: 3 dice at level 6', at(6), 3)
  check.eq('character table: 4 dice at level 11', at(11), 4)
  check.eq('character table: 5 dice at level 16', at(16), 5)
  check.eq('character table: and it holds past the end of the column', at(20), 5)

  check.eq('character table: a multiclass character sums its levels',
    evaluateValue(breath, envAt({ 'srd:class.wizard': 3, 'srd:class.rogue': 3 })), 3)
}

// ---------------------------------------------------------------------------
// Edges the resolver must not be surprised by
// ---------------------------------------------------------------------------

{
  const empty = { characterLevelTable: [] }
  check.eq('edge: an empty table is 0, not a crash',
    evaluateValue(empty, envAt({ 'srd:class.wizard': 5 })), 0)

  const short = { classLevelTable: { classId: 'srd:class.wizard', values: [7] } }
  check.eq('edge: a one-entry table holds that entry for every level',
    evaluateValue(short, envAt({ 'srd:class.wizard': 20 })), 7)

  check('edge: a level table is dynamic — it cannot be folded before resolve',
    isDynamic({ characterLevelTable: [1, 2] })
      && isDynamic({ classLevelTable: { classId: 'x', values: [1] } }))

  check('edge: it describes itself for the breakdown',
    describeValue({ classLevelTable: { classId: 'srd:class.wizard', values: [1] } })
      === 'by srd:class.wizard level',
    describeValue({ classLevelTable: { classId: 'srd:class.wizard', values: [1] } }))
}

// ---------------------------------------------------------------------------
// End to end: the numbers that appear on a real character sheet
// ---------------------------------------------------------------------------

const item = (instanceId, definitionId) =>
  ({ instanceId, definitionId, contentVersion: 1, identified: true })

function character(classId, level, overrides = {}) {
  return {
    id: 'c:t', campaignId: 'camp-1', name: 'Subject', playerId: 'p',
    speciesId: 'srd:species.human',
    classLevels: [{ classId, level }],
    abilityScoreBase: { str: 14, dex: 14, con: 14, int: 14, wis: 14, cha: 14 },
    buildChoices: [], hitPointsCurrent: 30, hitPointsTemp: 0,
    hitDiceSpent: {}, resourcesSpent: {}, conditions: [], effectInstances: [],
    exhaustionLevel: 0,
    inventory: { instances: [item('w', 'srd:weapon.dagger')], equipped: {}, attunedInstanceIds: [] },
    deathSaves: { successes: 0, failures: 0 }, toggles: {},
    spellsPrepared: [],
    ...overrides
  }
}

const resourceMax = (view, id) =>
  view.resources.find((r) => r.id === id)?.maximum

{
  // Rages, straight off the sheet. Level 1 and 5 were already right before
  // the table existed; 6 and 17 are the ones the old clamp could not reach.
  const rageAt = (n) => resourceMax(
    playerViewOf(character('srd:class.barbarian', n), content, { detail: 'inspect' }),
    'barbarian.rages')

  check.eq('sheet: a level 1 barbarian has 2 rages', rageAt(1), 2)
  check.eq('sheet: a level 3 barbarian has 3', rageAt(3), 3)
  check.eq('sheet: a level 6 barbarian has 4', rageAt(6), 4)
  check.eq('sheet: a level 12 barbarian has 5', rageAt(12), 5)
  check.eq('sheet: a level 17 barbarian has 6', rageAt(17), 6)
}

{
  // The wizard's slot ladder, which is the actual blocker for levels 1-20:
  // before this, every caster's slots were the level-5 row hardcoded.
  const slotsAt = (level, slotLevel) => resourceMax(
    playerViewOf(character('srd:class.wizard', level), content, { detail: 'inspect' }),
    `wizard.slots.${slotLevel}`)

  check.eq('sheet: a level 1 wizard has two 1st-level slots', slotsAt(1, 1), 2)
  // Not "0" — absent. The tier is declared in content so the ladder can be one
  // table, but a sheet listing "0/0 2nd-level Slots" is showing a row of a
  // table rather than something the wizard has.
  check.eq('sheet: and no 2nd-level slots at all', slotsAt(1, 2), undefined)
  check.eq('sheet: a level 3 wizard has 4 / 2', slotsAt(3, 1), 4)
  check.eq('sheet: a level 3 wizard has two 2nd-level slots', slotsAt(3, 2), 2)
  check.eq('sheet: a level 5 wizard has two 3rd-level slots', slotsAt(5, 3), 2)

  // Past 5 is the whole point — none of this was reachable before.
  check.eq('sheet: a level 9 wizard reaches 5th-level slots', slotsAt(9, 5), 1)
  check.eq('sheet: a level 11 wizard reaches 6th-level slots', slotsAt(11, 6), 1)
  check.eq('sheet: a level 13 wizard reaches 7th-level slots', slotsAt(13, 7), 1)
  check.eq('sheet: a level 15 wizard reaches 8th-level slots', slotsAt(15, 8), 1)
  check.eq('sheet: a level 17 wizard reaches 9th-level slots', slotsAt(17, 9), 1)
  check.eq('sheet: a level 20 wizard has four 1st-level slots', slotsAt(20, 1), 4)
  check.eq('sheet: and three 5th-level slots', slotsAt(20, 5), 3)

  check.eq('sheet: an unearned tier does not reach the sheet at all', slotsAt(4, 9), undefined)

  // The tier is still declared — it has to be, or the table would have nothing
  // to fill in — so the same wizard four levels later simply has it.
  check.eq('sheet: and the same wizard has it once the table says so', slotsAt(17, 9), 1)
}

// ---------------------------------------------------------------------------
// The ladder is declared in full but only shown as far as it has been climbed
// ---------------------------------------------------------------------------

{
  const tiersAt = (level) => playerViewOf(
    character('srd:class.wizard', level), content, { detail: 'inspect' }
  ).spellcasting.slots.map((s) => s.level).join(',')

  check.eq('view: a level 1 wizard is offered one tier', tiersAt(1), '1')
  check.eq('view: a level 5 wizard, three', tiersAt(5), '1,2,3')
  check.eq('view: a level 20 wizard, all nine', tiersAt(20), '1,2,3,4,5,6,7,8,9')

  // The distinction that matters: an unearned tier is hidden, but a tier whose
  // slots are all spent is still yours and still shown.
  const spent = character('srd:class.wizard', 5, {
    resourcesSpent: { 'wizard.slots.1': 4 }
  })
  const view = playerViewOf(spent, content, { detail: 'inspect' })
  check.eq('view: a tier burned to nothing is still listed',
    view.spellcasting.slots.map((s) => s.level).join(','), '1,2,3')
  check.eq('view: with nothing left in it',
    view.spellcasting.slots.find((s) => s.level === 1).remaining, 0)
}

check.report()
