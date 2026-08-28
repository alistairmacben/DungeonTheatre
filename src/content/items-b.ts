// Magic items, catalogue section B (docs/srd/10-magic-items.md §7).
//
// Second batch of the SRD's ~347-item catalogue. Belt of Giant Strength is
// printed as one entry with a five-row table, but names six real items in
// play (stone and frost giant strength share a Strength score and rarity,
// not an identity) — expanded here the way Ammunition and Armor's +1/+2/+3
// families already were.
//
// Belt of Giant Strength and Belt of Dwarvenkind's Constitution bonus are the
// first uses of the `max` op as a ceiling — the same value pipeline stage
// `min` uses as a floor, just capping upward instead. Boots of Levitation is
// the first item to grant a spell through `EffectSource.spells` rather than
// a modifier: the same `spellIds` + `availability: 'always'` shape a racial
// innate spell already uses, with no `slotGroup` so it costs nothing to cast.
// Unarmored Defense's established `wearing-armor` / `wielding-shield` toggles
// give Bracers of Defense a real, accurate condition for free.
//
// Checked against docs/srd/10-magic-items.md §7 (Catalogue: B).

import type { EffectSource, ItemDefinition, Modifier } from '../rules/types.js'
import {
  abilityMaxPath, abilityScorePath, ARMOR_CLASS, ATTACK_ROLL, DAMAGE_WEAPON, resistancePath,
  RESISTANCE_RESISTANT, speedPath, JUMP_LONG, JUMP_HIGH
} from '../rules/statPaths.js'

const V = '2014'
let n = 0
const id = () => `ib${++n}`

function source(o: Partial<EffectSource> & { id: string; name: string }): EffectSource {
  return {
    provenance: 'srd', contentVersion: 1, kind: 'item',
    activation: { always: true }, modifiers: [], completeness: 'complete',
    ...o
  }
}

const add = (target: string, value: Modifier['value'], extra: Partial<Modifier> = {}): Modifier =>
  ({ id: id(), channel: 'value', target, op: 'add', value, permanence: 'persistent', ...extra })

// ===========================================================================
// Real modifiers, fully resolved
// ===========================================================================

const GIANT_STRENGTH_TYPES = [
  { type: 'Hill', str: 21, rarity: 'rare' as const },
  { type: 'Stone', str: 23, rarity: 'veryRare' as const },
  { type: 'Frost', str: 23, rarity: 'veryRare' as const },
  { type: 'Fire', str: 25, rarity: 'veryRare' as const },
  { type: 'Cloud', str: 27, rarity: 'legendary' as const },
  { type: 'Storm', str: 29, rarity: 'legendary' as const }
]

export const BELTS_OF_GIANT_STRENGTH: ItemDefinition[] = GIANT_STRENGTH_TYPES.map(({ type, str, rarity }) => {
  const key = type.toLowerCase()
  return {
    id: `srd:item.belt-of-giant-strength-${key}`, name: `Belt of ${type} Giant Strength`,
    provenance: 'srd', contentVersion: 1, rulesetVersion: V,
    category: 'wondrous' as const, rarity, slot: 'belt' as const, requiresAttunement: true,
    effects: source({
      id: `srd:item.belt-of-giant-strength-${key}`, name: `Belt of ${type} Giant Strength`,
      // A floor, not an assignment, and one that exceeds the normal ability
      // score cap of 20 for the higher tiers — the cap is itself overridable,
      // so the ceiling (ability.str.max) needs its own floor raised too, or
      // the resolver's separate clamp stage would silently pull the score
      // back down to 20 for every tier above Hill.
      modifiers: [
        {
          id: id(), channel: 'value', target: abilityScorePath('str'), op: 'min',
          value: str, permanence: 'persistent', note: `belt of ${key} giant strength`
        },
        {
          id: id(), channel: 'value', target: abilityMaxPath('str'), op: 'min',
          value: str, permanence: 'persistent', note: `belt of ${key} giant strength: raises the ceiling`
        }
      ],
      narrative: [{
        text: `While worn, your Strength score is ${str}. No effect if it is already ${str} or higher.`,
        dmPromptable: false
      }]
    })
  }
})

export const BOOTS_OF_STRIDING_AND_SPRINGING: ItemDefinition = {
  id: 'srd:item.boots-of-striding-and-springing', name: 'Boots of Striding and Springing',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon', slot: 'boots', requiresAttunement: true,
  effects: source({
    id: 'srd:item.boots-of-striding-and-springing', name: 'Boots of Striding and Springing',
    modifiers: [
      { id: id(), channel: 'value', target: speedPath('walk'), op: 'min', value: 30, permanence: 'persistent', note: 'boots of striding and springing' },
      { id: id(), channel: 'value', target: JUMP_LONG, op: 'multiply', value: 3, permanence: 'persistent', note: 'boots of striding and springing: triple jump distance' },
      { id: id(), channel: 'value', target: JUMP_HIGH, op: 'multiply', value: 3, permanence: 'persistent', note: 'boots of striding and springing: triple jump distance' }
    ],
    narrative: [{
      text: "Your walking speed becomes 30 feet unless already higher — the floor applies after every other speed modifier, "
        + 'so encumbrance and heavy armor never bring it below 30 while worn. Jump distance is tripled, still bounded by remaining movement.',
      dmPromptable: false
    }]
  })
}

export const BRACERS_OF_DEFENSE: ItemDefinition = {
  id: 'srd:item.bracers-of-defense', name: 'Bracers of Defense',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare', slot: 'bracers', requiresAttunement: true,
  effects: source({
    id: 'srd:item.bracers-of-defense', name: 'Bracers of Defense',
    modifiers: [add(ARMOR_CLASS, 2, {
      condition: { all: [{ not: { playerToggle: 'wearing-armor' } }, { not: { playerToggle: 'wielding-shield' } }] },
      note: 'bracers of defense: +2 AC while wearing no armor and using no shield'
    })],
    narrative: [{
      text: 'Turn off the "wearing armour" and "wielding shield" toggles to receive the bonus.',
      toggleId: 'wearing-armor', dmPromptable: false
    }]
  })
}

export const BOOTS_OF_LEVITATION: ItemDefinition = {
  id: 'srd:item.boots-of-levitation', name: 'Boots of Levitation',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare', slot: 'boots', requiresAttunement: true,
  effects: source({
    id: 'srd:item.boots-of-levitation', name: 'Boots of Levitation',
    spells: [{
      spellIds: ['srd:spell.levitate'], availability: 'always', ability: 'int'
    }],
    narrative: [{
      text: 'While worn, cast levitate on yourself at will, at no cost and '
        + 'requiring no components. The ability listed for it is arbitrary — '
        + 'the spell only ever targets you.',
      dmPromptable: false
    }]
  })
}

// ===========================================================================
// Real modifiers with a rider the resolver can't carry
// ===========================================================================

export const BELT_OF_DWARVENKIND: ItemDefinition = {
  id: 'srd:item.belt-of-dwarvenkind', name: 'Belt of Dwarvenkind',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare', slot: 'belt', requiresAttunement: true,
  effects: source({
    id: 'srd:item.belt-of-dwarvenkind', name: 'Belt of Dwarvenkind',
    // The Constitution bonus, capped at 20, is real. Everything else branches
    // on the wearer's species — a CHA (Persuasion) bonus with dwarves, a
    // beard, and for a non-dwarf wearer an entire second bundle of poison
    // resistance, darkvision and languages — which this content set has no
    // conditional-by-species channel for on an item.
    completeness: 'partial',
    modifiers: [
      add(abilityScorePath('con'), 2, { note: 'belt of dwarvenkind' }),
      { id: id(), channel: 'value', target: abilityScorePath('con'), op: 'max', value: 20, permanence: 'persistent', note: 'belt of dwarvenkind: capped at 20' }
    ],
    narrative: [{
      text: 'Also: advantage on Charisma (Persuasion) checks with dwarves, a '
        + '50% chance each dawn of growing a beard (if you can), and, if you '
        + "are not a dwarf, advantage on saves against poison, resistance to "
        + 'poison damage, darkvision 60 feet, and Dwarvish.',
      dmPromptable: true
    }]
  })
}

export const BOOTS_OF_ELVENKIND: ItemDefinition = {
  id: 'srd:item.boots-of-elvenkind', name: 'Boots of Elvenkind',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon', slot: 'boots',
  effects: source({
    id: 'srd:item.boots-of-elvenkind', name: 'Boots of Elvenkind',
    // Real advantage on Stealth checks — broader than RAW, which scopes it
    // to checks that rely on moving silently rather than every Stealth check.
    completeness: 'partial',
    modifiers: [{
      id: id(), channel: 'roll', rollOp: 'advantage', scope: { kinds: ['check'], skills: ['stealth'] },
      permanence: 'persistent', note: 'boots of elvenkind'
    }],
    narrative: [{
      text: 'Your steps are silent on any surface. RAW scopes the advantage '
        + 'to Stealth checks that rely on moving silently — this grants it '
        + 'on every Stealth check, since this vocabulary has no narrower cut.',
      dmPromptable: true
    }]
  })
}

export const BOOTS_OF_THE_WINTERLANDS: ItemDefinition = {
  id: 'srd:item.boots-of-the-winterlands', name: 'Boots of the Winterlands',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon', slot: 'boots', requiresAttunement: true,
  effects: source({
    id: 'srd:item.boots-of-the-winterlands', name: 'Boots of the Winterlands',
    // The cold resistance is real. Ignoring difficult terrain is scoped to
    // ice and snow specifically, and this content set's terrain-cost
    // modifiers (Freedom of Movement's floor) have no such per-cause scope.
    completeness: 'partial',
    modifiers: [{
      id: id(), channel: 'value', target: resistancePath('cold'), op: 'set',
      value: RESISTANCE_RESISTANT, permanence: 'persistent', note: 'boots of the winterlands'
    }],
    narrative: [{
      text: 'Also ignore difficult terrain caused by ice or snow, and '
        + 'tolerate temperatures as low as -50°F unprotected, or -100°F in heavy clothes.',
      dmPromptable: true
    }]
  })
}

export const BRACERS_OF_ARCHERY: ItemDefinition = {
  id: 'srd:item.bracers-of-archery', name: 'Bracers of Archery',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon', slot: 'bracers', requiresAttunement: true,
  effects: source({
    id: 'srd:item.bracers-of-archery', name: 'Bracers of Archery',
    // The damage bonus is real, gated the same way Ranger's Archery fighting
    // style is — no ranged-only scope exists, so the toggle stands in for
    // "currently attacking with a bow." The proficiency grant this item
    // makes has no channel: proficiencies are fixed at character creation,
    // not grantable by an effect source.
    completeness: 'partial',
    modifiers: [add(DAMAGE_WEAPON, 2, {
      condition: { playerToggle: 'item.bracers-of-archery' },
      note: 'bracers of archery: +2 damage with a longbow or shortbow — turn off when not using one'
    })],
    narrative: [{
      text: 'Also grants proficiency with the longbow and shortbow, if you lack it.',
      dmPromptable: true
    }]
  })
}

export const BROOCH_OF_SHIELDING: ItemDefinition = {
  id: 'srd:item.brooch-of-shielding', name: 'Brooch of Shielding',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon', slot: 'amulet', requiresAttunement: true,
  effects: source({
    id: 'srd:item.brooch-of-shielding', name: 'Brooch of Shielding',
    // Force resistance is real. Immunity to one specific spell's damage
    // isn't a damage type this vocabulary can scope to.
    completeness: 'partial',
    modifiers: [{
      id: id(), channel: 'value', target: resistancePath('force'), op: 'set',
      value: RESISTANCE_RESISTANT, permanence: 'persistent', note: 'brooch of shielding'
    }],
    narrative: [{
      text: 'Also immune to damage from the spell magic missile specifically.',
      dmPromptable: true
    }]
  })
}

export const BROOM_OF_FLYING: ItemDefinition = {
  id: 'srd:item.broom-of-flying', name: 'Broom of Flying',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon',
  effects: source({
    id: 'srd:item.broom-of-flying', name: 'Broom of Flying',
    // The flying speed is real. Carrying capacity, hovering-on-landing and
    // the send/recall-by-command-word logistics aren't stats this set tracks.
    completeness: 'partial',
    modifiers: [{
      id: id(), channel: 'value', target: speedPath('fly'), op: 'base', value: 50,
      permanence: 'persistent', note: 'broom of flying'
    }],
    narrative: [{
      text: 'Carries up to 400 lb (at 30 ft above 200 lb) and stops hovering '
        + 'when you land. Can be sent to or recalled from a familiar '
        + 'destination within 1 mile by command word.',
      dmPromptable: true
    }]
  })
}

export const BERSERKER_AXE: ItemDefinition = {
  id: 'srd:item.berserker-axe', name: 'Berserker Axe',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'weapon', rarity: 'rare', slot: 'mainHand', requiresAttunement: true,
  effects: source({
    id: 'srd:item.berserker-axe', name: 'Berserker Axe',
    // The attack and damage bonus are real, gated the same way a fighting
    // style is. Growing hit point maximum with the wielder's level has no
    // stat path for "character level" to read, and the curse's forced-attack
    // behaviour and unremovable grip are outside the vocabulary entirely.
    completeness: 'partial',
    modifiers: [
      add(ATTACK_ROLL, 1, { condition: { playerToggle: 'item.berserker-axe' }, note: 'berserker axe: turn off when not using it' }),
      add(DAMAGE_WEAPON, 1, { condition: { playerToggle: 'item.berserker-axe' }, note: 'berserker axe: turn off when not using it' })
    ],
    narrative: [{
      text: 'Your hit point maximum increases by 1 for each level you have '
        + "attained. Curse: you're unwilling to part with it, have "
        + 'disadvantage on attacks with any other weapon unless no foe is '
        + 'within 60 feet you can see or hear, and whenever a hostile '
        + 'creature damages you, a DC 15 Wisdom save or you go berserk — '
        + 'attacking the nearest creature each round until none remain within 60 feet.',
      dmPromptable: true
    }]
  })
}

// ===========================================================================
// No roll, nothing to compute — narrative only
// ===========================================================================

export const BAG_OF_BEANS: ItemDefinition = {
  id: 'srd:item.bag-of-beans', name: 'Bag of Beans',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare',
  effects: source({
    id: 'srd:item.bag-of-beans', name: 'Bag of Beans',
    completeness: 'partial',
    narrative: [{
      text: '3d4 magic beans. Dumping them out: 10-foot radius, DC 15 '
        + 'Dexterity save, 5d4 fire, igniting flammables. Planting and '
        + 'watering one produces an effect a minute later, rolled on a d100 '
        + 'table (poisonous toadstools, a geyser, a treant, a hungry '
        + 'bulette, a fruit tree bearing random potions, a mummy lord\'s '
        + 'lair, a beanstalk to wherever the GM chooses, and more) — roll on '
        + 'the SRD table by hand.',
      dmPromptable: true
    }]
  })
}

export const BAG_OF_DEVOURING: ItemDefinition = {
  id: 'srd:item.bag-of-devouring', name: 'Bag of Devouring',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'veryRare',
  effects: source({
    id: 'srd:item.bag-of-devouring', name: 'Bag of Devouring',
    completeness: 'partial',
    narrative: [{
      text: 'Looks like a bag of holding. Animal or vegetable matter placed '
        + 'wholly inside is destroyed forever. Reaching in: 50% chance of '
        + 'being pulled in; anything starting its turn inside is devoured. '
        + 'Holds 1 cubic foot of inanimate objects, swallowed into another '
        + 'plane once a day. Piercing or tearing it destroys it and scatters '
        + 'the contents on the Astral Plane.',
      dmPromptable: true
    }]
  })
}

export const BAG_OF_HOLDING: ItemDefinition = {
  id: 'srd:item.bag-of-holding', name: 'Bag of Holding',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon',
  effects: source({
    id: 'srd:item.bag-of-holding', name: 'Bag of Holding',
    // A container with its own capacity, a weight override, a retrieval
    // cost and destruction consequences — this content set's inventory
    // model tracks weight and containment but has no capacity-limit or
    // weight-override field on an item to carry these numbers.
    completeness: 'partial',
    narrative: [{
      text: 'Holds 500 lb / 64 cubic feet of nonliving matter while always '
        + 'weighing 15 lb itself. Retrieving a specific item costs an '
        + 'action. Overloading, piercing or tearing it destroys it and '
        + 'scatters the contents on the Astral Plane; turning it inside out '
        + 'spills them unharmed instead. Placing it inside another '
        + 'extradimensional space destroys both and opens a one-way gate to '
        + 'the Astral Plane.',
      dmPromptable: true
    }]
  })
}

export const BAG_OF_TRICKS: ItemDefinition = {
  id: 'srd:item.bag-of-tricks', name: 'Bag of Tricks',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon',
  charges: { id: 'item.bag-of-tricks.uses', name: 'Bag of Tricks', max: 3, refresh: { kind: 'dawn' }, display: 'uses' },
  effects: source({
    id: 'srd:item.bag-of-tricks', name: 'Bag of Tricks',
    // The three-uses-per-day resource is real and trackable; which beast
    // appears has no statblock to summon, the same gap Animal Shapes leaves.
    completeness: 'partial',
    narrative: [{
      text: 'Action to pull out and throw a fuzzy object up to 20 feet: it '
        + 'becomes a friendly beast (determined by the bag\'s colour and a '
        + 'roll of a d8) acting on your turn, commanded with a bonus action, '
        + 'vanishing at the next dawn or at 0 HP. This content set carries '
        + 'no beast statblocks to summon — narrate the result by hand.',
      dmPromptable: true
    }]
  })
}

export const BEAD_OF_FORCE: ItemDefinition = {
  id: 'srd:item.bead-of-force', name: 'Bead of Force',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare',
  effects: source({
    id: 'srd:item.bead-of-force', name: 'Bead of Force',
    completeness: 'partial',
    narrative: [{
      text: 'Usually found in a group of 1d4+4. Action to throw up to 60 '
        + 'feet: 10-foot radius, DC 15 Dexterity save, 5d4 force, then a '
        + 'transparent force sphere encloses the area for a minute, trapping '
        + 'anyone who failed and was wholly inside. Only breathable air '
        + 'passes through it.',
      dmPromptable: true
    }]
  })
}

export const BOOTS_OF_SPEED: ItemDefinition = {
  id: 'srd:item.boots-of-speed', name: 'Boots of Speed',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare', slot: 'boots', requiresAttunement: true,
  effects: source({
    id: 'srd:item.boots-of-speed', name: 'Boots of Speed',
    // A cumulative-duration resource — 10 minutes of total use, spent in any
    // increment, refilling on a long rest — rather than a charge count or a
    // simple per-day use, and this content set has no worked example of
    // that refresh shape to build against yet. Left for the DM to track.
    completeness: 'partial',
    narrative: [{
      text: 'Bonus action to click the heels: walking speed doubles and '
        + 'opportunity attacks against you have disadvantage; click again '
        + 'to end. 10 minutes of total use, tracked across the whole day, '
        + 'then inert until you finish a long rest.',
      dmPromptable: true
    }]
  })
}

export const BOWL_OF_COMMANDING_WATER_ELEMENTALS: ItemDefinition = {
  id: 'srd:item.bowl-of-commanding-water-elementals', name: 'Bowl of Commanding Water Elementals',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare',
  charges: {
    id: 'item.bowl-of-commanding-water-elementals.uses', name: 'Bowl of Commanding Water Elementals',
    max: 1, refresh: { kind: 'dawn' }, display: 'uses'
  },
  effects: source({
    id: 'srd:item.bowl-of-commanding-water-elementals', name: 'Bowl of Commanding Water Elementals',
    completeness: 'partial',
    narrative: [{
      text: 'While filled with water, action and a command word to summon '
        + 'a water elemental as conjure elemental. No beast statblock is '
        + 'carried here to summon — narrate the result by hand.',
      dmPromptable: true
    }]
  })
}

export const BRAZIER_OF_COMMANDING_FIRE_ELEMENTALS: ItemDefinition = {
  id: 'srd:item.brazier-of-commanding-fire-elementals', name: 'Brazier of Commanding Fire Elementals',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare',
  charges: {
    id: 'item.brazier-of-commanding-fire-elementals.uses', name: 'Brazier of Commanding Fire Elementals',
    max: 1, refresh: { kind: 'dawn' }, display: 'uses'
  },
  effects: source({
    id: 'srd:item.brazier-of-commanding-fire-elementals', name: 'Brazier of Commanding Fire Elementals',
    completeness: 'partial',
    narrative: [{
      text: 'While a fire burns in it, action and a command word to summon '
        + 'a fire elemental. No beast statblock is carried here to summon '
        + '— narrate the result by hand.',
      dmPromptable: true
    }]
  })
}

// ===========================================================================
// Registration
// ===========================================================================

export const ALL_ITEMS_B: ItemDefinition[] = [
  ...BELTS_OF_GIANT_STRENGTH, BOOTS_OF_STRIDING_AND_SPRINGING, BRACERS_OF_DEFENSE,
  BOOTS_OF_LEVITATION, BELT_OF_DWARVENKIND, BOOTS_OF_ELVENKIND, BOOTS_OF_THE_WINTERLANDS,
  BRACERS_OF_ARCHERY, BROOCH_OF_SHIELDING, BROOM_OF_FLYING, BERSERKER_AXE,
  BAG_OF_BEANS, BAG_OF_DEVOURING, BAG_OF_HOLDING, BAG_OF_TRICKS, BEAD_OF_FORCE,
  BOOTS_OF_SPEED, BOWL_OF_COMMANDING_WATER_ELEMENTALS, BRAZIER_OF_COMMANDING_FIRE_ELEMENTALS
]
