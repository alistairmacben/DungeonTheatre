// Smoke test for the four classes authored by the content-expansion workflow.
//
// Compiling proves nothing about resolution: a definition can typecheck and
// still resolve to a wrong number, or throw when a real character is built from
// it. This stands in for the adversarial verifier that ran out of budget. It
// does not check SRD accuracy line by line — it checks that each class produces
// a coherent, playable character through the same one contract every other
// class uses, and that the features flagged partial actually degrade to
// narrative rather than resolving to nonsense.

import { loadContent, playerViewOf, applyCommand } from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()

const base = (o) => ({
  campaignId: 'camp-1', playerId: 'p', buildChoices: [],
  hitPointsTemp: 0, hitDiceSpent: {}, resourcesSpent: {}, conditions: [],
  effectInstances: [], exhaustionLevel: 0,
  deathSaves: { successes: 0, failures: 0 }, toggles: {},
  inventory: { instances: [], equipped: {}, attunedInstanceIds: [] },
  ...o
})

// The content is loaded; confirm each new definition is actually in the index
// before building a character from it, so a missing registration fails loudly.
const REGISTRATIONS = [
  ['species', 'srd:species.half-orc'],
  ['species', 'srd:species.half-elf'],
  ['species', 'srd:species.tiefling'],
  ['species', 'srd:species.elf'], // wood elf subspecies lives under elf
  ['classes', 'srd:class.barbarian'],
  ['classes', 'srd:class.bard'],
  ['classes', 'srd:class.warlock'],
  ['classes', 'srd:class.druid']
]
for (const [map, id] of REGISTRATIONS) {
  check(`registered: ${id}`, content[map].has(id), `${id} not in content.${map}`)
}

// ---------------------------------------------------------------------------
// Every new class produces a coherent character
// ---------------------------------------------------------------------------

function sane(label, character, expect = {}) {
  let view
  try {
    view = playerViewOf(character, content, { detail: 'inspect' })
  } catch (e) {
    check(`${label}: resolves without throwing`, false, String(e))
    return null
  }
  check(`${label}: resolves without throwing`, true)
  check(`${label}: has a positive hit point maximum`,
    view.vitals.hitPoints.max.value > 0, view.vitals.hitPoints.max.value)
  check(`${label}: has a sane armour class`,
    view.vitals.armorClass.value >= 10 && view.vitals.armorClass.value <= 30,
    view.vitals.armorClass.value)
  check(`${label}: exposes all six abilities and eighteen skills`,
    view.abilities.length === 6 && view.skills.length === 18)
  check(`${label}: has at least one available action`,
    view.actions.some((a) => a.available))
  // The load-bearing invariant across the whole project: no class name in a
  // structural position of the serialised view.
  check(`${label}: nothing class-shaped in the contract`,
    !/"(barbarian|bard|warlock|druid)[A-Z]/.test(JSON.stringify(view)))
  if (expect.spellcasting !== undefined) {
    check(`${label}: spellcasting ${expect.spellcasting ? 'present' : 'absent'}`,
      (view.spellcasting !== undefined) === expect.spellcasting)
  }
  return view
}

// --- Barbarian: rage, unarmoured defence, the engine-change flags ----------
{
  const barb = base({
    id: 'c:barb', name: 'Ograk',
    speciesId: 'srd:species.half-orc',
    classLevels: [{ classId: 'srd:class.barbarian', level: 5 }],
    abilityScoreBase: { str: 16, dex: 14, con: 15, int: 8, wis: 10, cha: 8 },
    hitPointsCurrent: 45,
    inventory: {
      instances: [{ instanceId: 'axe', definitionId: 'srd:weapon.greataxe', contentVersion: 1, identified: true }],
      equipped: { mainHand: 'axe' }, attunedInstanceIds: []
    }
  })
  const view = sane('barbarian', barb, { spellcasting: false })

  // Unarmoured Defense: 10 + DEX + CON while wearing no armour. Half-Orc is
  // CON +1, so CON 16 (+3), DEX 14 (+2) ⇒ 15. It must WIN as a base op, not
  // stack on the plain 10 + DEX baseline — 16+ would mean DEX double-counted.
  if (view) {
    check('barbarian: unarmoured defence is 10 + DEX + CON, base op winning',
      view.vitals.armorClass.value === 15, view.vitals.armorClass.value)
  }

  // A flagged-partial feature must degrade to something visible, not vanish.
  // Extra Attack was reported as needing a stat path; whatever the file did
  // with it, the character must still be coherent, which `sane` already checked.
}

// --- Warlock: pact magic, the different slot semantics ---------------------
{
  const lock = base({
    id: 'c:lock', name: 'Vaeric',
    speciesId: 'srd:species.tiefling',
    classLevels: [{ classId: 'srd:class.warlock', level: 5 }],
    abilityScoreBase: { str: 8, dex: 14, con: 14, int: 10, wis: 12, cha: 16 },
    hitPointsCurrent: 32,
    inventory: {
      instances: [{ instanceId: 'dag', definitionId: 'srd:weapon.dagger', contentVersion: 1, identified: true }],
      equipped: { mainHand: 'dag' }, attunedInstanceIds: []
    },
    spellsPrepared: []
  })
  const view = sane('warlock', lock, { spellcasting: true })

  if (view && view.spellcasting) {
    // Pact magic gives few slots; the exact number depends on how the file
    // modelled the level problem, but there must be at least one. Tiefling is
    // CHA +2, so CHA 18 (+4): DC = 8 + prof 3 + 4 = 15.
    check('warlock: has spell slots',
      view.spellcasting.slots.length > 0, JSON.stringify(view.spellcasting.slots))
    check('warlock: save DC is Charisma-based',
      view.spellcasting.saveDc.value === 15, view.spellcasting.saveDc.value)
    // Tiefling innate spells should be castable without preparation.
    check('warlock: has at least one always-available spell',
      view.spellcasting.spells.some((s) => s.alwaysAvailable),
      view.spellcasting.spells.map((s) => s.label).join(', '))
  }
}

// --- Bard: expertise, Jack of All Trades, and a pool with something in it --
{
  // Bard's spellcasting is entirely selection-based — it never asks `lists`,
  // it asks `character.selections`. A hand-built fixture answers it the same
  // way `createCharacter`'s auto-selection now does, to prove the pool itself
  // (fixed by adding Mending) is usable independent of who is answering it.
  const bard = base({
    id: 'c:bard', name: 'Lireael',
    speciesId: 'srd:species.half-elf',
    classLevels: [{ classId: 'srd:class.bard', level: 5 }],
    abilityScoreBase: { str: 8, dex: 14, con: 12, int: 10, wis: 10, cha: 16 },
    hitPointsCurrent: 33,
    inventory: {
      instances: [{ instanceId: 'rap', definitionId: 'srd:weapon.rapier', contentVersion: 1, identified: true }],
      equipped: { mainHand: 'rap' }, attunedInstanceIds: []
    },
    spellsPrepared: [],
    selections: {
      'srd:class.bard.spellcasting': {
        cantrips: ['srd:spell.prestidigitation', 'srd:spell.mending'],
        spells: ['srd:spell.cure-wounds', 'srd:spell.detect-magic', 'srd:spell.identify', 'srd:spell.longstrider']
      }
    }
  })
  const view = sane('bard', bard, { spellcasting: true })

  if (view && view.spellcasting) {
    check('bard: an answered selection produces real castable spells',
      view.spellcasting.spells.some((s) => s.available),
      view.spellcasting.spells.map((s) => `${s.label}:${s.available}`).join(', '))
    check('bard: cantrips need no slot',
      view.spellcasting.spells.find((s) => s.label === 'Mending').slotOptions.length === 0)
    check('bard: known spells are always available, never needing preparation',
      view.spellcasting.spells.find((s) => s.label === 'Cure Wounds').alwaysAvailable === true)
  }
}

// --- Druid: prepared casting, Wild Shape as the honest gap -----------------
{
  const druid = base({
    id: 'c:druid', name: 'Thornwren',
    speciesId: 'srd:species.elf', subspeciesId: 'srd:species.elf.wood',
    classLevels: [{ classId: 'srd:class.druid', level: 5 }],
    abilityScoreBase: { str: 10, dex: 14, con: 14, int: 10, wis: 16, cha: 10 },
    hitPointsCurrent: 38,
    inventory: {
      instances: [{ instanceId: 'staff', definitionId: 'srd:weapon.quarterstaff', contentVersion: 1, identified: true }],
      equipped: { mainHand: 'staff' }, attunedInstanceIds: []
    },
    spellsPrepared: []
  })
  const view = sane('druid', druid, { spellcasting: true })

  // Cure Wounds, Detect Magic and Longstrider are all now tagged for
  // srd:list.druid, so a druid's `fromList` grant surfaces them with no
  // selection needed — prepared casters draw from the whole list.
  if (view && view.spellcasting) {
    check('druid: the class spell list produces real castable spells',
      view.spellcasting.spells.some((s) => s.label === 'Cure Wounds'),
      view.spellcasting.spells.map((s) => s.label).join(', '))
  }
  // Wild Shape is the feature nobody could implement. It must appear as a
  // narrative effect or an unavailable action, never as something that silently
  // does nothing while claiming to work. `sane` already proved the character is
  // coherent; this asserts the gap is at least visible somewhere.
  if (view) {
    const mentionsWildShape =
      view.effects.some((e) => /wild shape/i.test(e.label + ' ' + (e.effects || []).join(' ')))
      || view.actions.some((a) => /wild shape/i.test(a.label))
    check('druid: Wild Shape is surfaced somewhere, not silently dropped',
      mentionsWildShape,
      'no Wild Shape effect or action found in the view')
  }
}

// ---------------------------------------------------------------------------
// A whole-content sweep: nothing in the index resolves to a broken character
// ---------------------------------------------------------------------------

{
  // Every class at level 5 with a stock ability array. The point is breadth:
  // if any registered class throws or produces a non-positive HP maximum, this
  // finds it without a hand-written fixture per class.
  const classes = [...content.classes.keys()].filter((id) => id.startsWith('srd:class.'))
  let coherent = 0
  const broken = []
  for (const classId of classes) {
    // Pick a species that certainly exists.
    const c = base({
      id: `sweep:${classId}`, name: 'Sweep',
      speciesId: 'srd:species.human',
      classLevels: [{ classId, level: 5 }],
      abilityScoreBase: { str: 12, dex: 12, con: 12, int: 12, wis: 12, cha: 12 },
      hitPointsCurrent: 30
    })
    try {
      const v = playerViewOf(c, content)
      if (v.vitals.hitPoints.max.value > 0) coherent++
      else broken.push(`${classId}: hp ${v.vitals.hitPoints.max.value}`)
    } catch (e) {
      broken.push(`${classId}: threw ${String(e).slice(0, 60)}`)
    }
  }
  check(`sweep: all ${classes.length} classes build a coherent human`,
    broken.length === 0, broken.join(' | '))
}

check.report()
