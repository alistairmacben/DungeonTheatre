// Magic items, catalogue section D-I, part 2 (docs/srd/10-magic-items.md §9).
//
// Second half of the SRD's largest catalogue letter, running Gem of Seeing
// through Ioun Stone. Ioun Stone is printed as one entry with a
// fourteen-row table — expanded into fourteen real items, the same
// treatment Dragon Scale Mail and Belt of Giant Strength already got.
//
// Ioun Stone of Mastery is the only thing in the SRD that modifies the
// proficiency bonus itself (the source doc calls this out explicitly),
// confirming `PROFICIENCY_BONUS` needed to exist as a real stat rather than
// a table lookup — and it already did. Holy Avenger is the first item whose
// attunement prerequisite reads the wearer's class level
// (`{ classLevelAtLeast: ['srd:class.paladin', 1] }`), the same predicate
// class levels already use, just aimed at attunement instead of a feature
// gate. Glamoured Studded Leather is the second item (after Dragon Scale
// Mail) built on the exported `armor()` helper for a real base AC.
//
// Checked against docs/srd/10-magic-items.md §9 (Catalogue: D-I).

import type { EffectSource, ItemDefinition, Modifier } from '../rules/types.js'
import {
  abilityScorePath, ARMOR_CLASS, ATTACK_ROLL, DAMAGE_WEAPON, movementCostPath,
  PROFICIENCY_BONUS, skillPath, speedPath
} from '../rules/statPaths.js'
import { armor } from './srd.js'

const V = '2014'
let n = 0
const id = () => `id2${++n}`

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

export const HEADBAND_OF_INTELLECT: ItemDefinition = {
  id: 'srd:item.headband-of-intellect', name: 'Headband of Intellect',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon', slot: 'head', requiresAttunement: true,
  effects: source({
    id: 'srd:item.headband-of-intellect', name: 'Headband of Intellect',
    modifiers: [{
      id: id(), channel: 'value', target: abilityScorePath('int'), op: 'min',
      value: 19, permanence: 'persistent', note: 'headband of intellect'
    }],
    narrative: [{
      text: 'While worn, your Intelligence score is 19. No effect if it is already 19 or higher.',
      dmPromptable: false
    }]
  })
}

export const HORSESHOES_OF_SPEED: ItemDefinition = {
  id: 'srd:item.horseshoes-of-speed', name: 'Horseshoes of Speed',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare',
  effects: source({
    id: 'srd:item.horseshoes-of-speed', name: 'Horseshoes of Speed',
    // A set of four, all of which must be affixed — the same beyond-a-pair
    // rule Horseshoes of a Zephyr uses, tracked by narrative rather than a
    // partial-set gate this content set has no mechanism for.
    modifiers: [add(speedPath('walk'), 30, { note: 'horseshoes of speed' })],
    narrative: [{ text: 'A set of four; all must be affixed to a mount for this to apply.', dmPromptable: false }]
  })
}

export const HAT_OF_DISGUISE: ItemDefinition = {
  id: 'srd:item.hat-of-disguise', name: 'Hat of Disguise',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon', slot: 'head', requiresAttunement: true,
  effects: source({
    id: 'srd:item.hat-of-disguise', name: 'Hat of Disguise',
    spells: [{ spellIds: ['srd:spell.disguise-self'], availability: 'always', ability: 'int' }],
    narrative: [{
      text: 'While worn, cast disguise self at will, at no cost and '
        + 'requiring no components. Ends if the hat is removed.',
      dmPromptable: false
    }]
  })
}

export const HELM_OF_COMPREHENDING_LANGUAGES: ItemDefinition = {
  id: 'srd:item.helm-of-comprehending-languages', name: 'Helm of Comprehending Languages',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon', slot: 'head',
  effects: source({
    id: 'srd:item.helm-of-comprehending-languages', name: 'Helm of Comprehending Languages',
    spells: [{ spellIds: ['srd:spell.comprehend-languages'], availability: 'always', ability: 'int' }],
    narrative: [{
      text: 'While worn, cast comprehend languages at will, at no cost '
        + 'and requiring no components.',
      dmPromptable: false
    }]
  })
}

const GLAMOURED_STUDDED_LEATHER_BASE = armor('srd:item.glamoured-studded-leather', 'Glamoured Studded Leather',
  { category: 'light', baseAc: 12, dexCap: null },
  [add(ARMOR_CLASS, 1)])

export const GLAMOURED_STUDDED_LEATHER: ItemDefinition = {
  ...GLAMOURED_STUDDED_LEATHER_BASE, rarity: 'rare',
  effects: {
    ...GLAMOURED_STUDDED_LEATHER_BASE.effects,
    completeness: 'partial',
    narrative: [{
      text: 'Bonus action and a command word to make it look like '
        + 'ordinary clothing or any other armor (bulk and weight '
        + 'unchanged), lasting until reused or removed.',
      dmPromptable: true
    }]
  }
}

// ===========================================================================
// Real modifiers with a rider the resolver can't carry
// ===========================================================================

export const GIANT_SLAYER: ItemDefinition = {
  id: 'srd:item.giant-slayer', name: 'Giant Slayer',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'weapon', rarity: 'rare', slot: 'mainHand',
  effects: source({
    id: 'srd:item.giant-slayer', name: 'Giant Slayer',
    completeness: 'partial',
    modifiers: [
      add(ATTACK_ROLL, 1, { condition: { playerToggle: 'item.giant-slayer' }, note: 'giant slayer: turn off when not using it' }),
      add(DAMAGE_WEAPON, 1, { condition: { playerToggle: 'item.giant-slayer' }, note: 'giant slayer: turn off when not using it' })
    ],
    narrative: [{
      text: 'Against a giant-type creature (including ettins and '
        + 'trolls), deals an extra 2d6 of the weapon\'s type and forces a '
        + 'DC 15 Strength save or the target is knocked prone. No '
        + 'creature-type tagging exists here — apply it by hand.',
      dmPromptable: true
    }]
  })
}

export const GLOVES_OF_SWIMMING_AND_CLIMBING: ItemDefinition = {
  id: 'srd:item.gloves-of-swimming-and-climbing', name: 'Gloves of Swimming and Climbing',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon', slot: 'gloves', requiresAttunement: true,
  effects: source({
    id: 'srd:item.gloves-of-swimming-and-climbing', name: 'Gloves of Swimming and Climbing',
    // The no-extra-movement-cost is Freedom of Movement's exact shape,
    // applied to climbing and swimming rather than difficult terrain. The
    // +5 Athletics bonus has no scope narrower than "every Athletics
    // check," broader than RAW's "to climb or swim."
    completeness: 'partial',
    modifiers: [
      { id: id(), channel: 'value', target: movementCostPath('climb'), op: 'set', value: 1, permanence: 'persistent', note: 'gloves of swimming and climbing' },
      { id: id(), channel: 'value', target: movementCostPath('swim'), op: 'set', value: 1, permanence: 'persistent', note: 'gloves of swimming and climbing' },
      add(skillPath('athletics'), 5, { note: 'gloves of swimming and climbing' })
    ],
    narrative: [{
      text: 'RAW scopes the +5 to Athletics checks made to climb or swim '
        + 'specifically — this grants it on every Athletics check, since '
        + 'this vocabulary has no narrower cut.',
      dmPromptable: true
    }]
  })
}

export const HAMMER_OF_THUNDERBOLTS: ItemDefinition = {
  id: 'srd:item.hammer-of-thunderbolts', name: 'Hammer of Thunderbolts',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'weapon', rarity: 'legendary', slot: 'mainHand',
  charges: { id: 'item.hammer-of-thunderbolts.charges', name: 'Hammer of Thunderbolts', max: 5, refresh: { kind: 'dawn', amount: { count: 1, sides: 4, modifier: 1 } }, display: 'uses' },
  effects: source({
    id: 'srd:item.hammer-of-thunderbolts', name: 'Hammer of Thunderbolts',
    // The base attack and damage bonus are real. Giant's Bane — an
    // attunement prerequisite that references two *other* attuned items,
    // a Strength bonus that can exceed 20 but not 30, and a natural-20
    // death effect against giants — has no channel here.
    completeness: 'partial',
    modifiers: [
      add(ATTACK_ROLL, 1, { condition: { playerToggle: 'item.hammer-of-thunderbolts' }, note: 'hammer of thunderbolts: turn off when not using it' }),
      add(DAMAGE_WEAPON, 1, { condition: { playerToggle: 'item.hammer-of-thunderbolts' }, note: 'hammer of thunderbolts: turn off when not using it' })
    ],
    narrative: [{
      text: 'Giant\'s Bane (requires attunement, and requires wearing a '
        + 'belt of giant strength of any variety and gauntlets of ogre '
        + "power; attunement ends if either is removed): Strength +4, "
        + 'which may exceed 20 but not 30, and a natural 20 against a '
        + 'giant forces a DC 17 Constitution save or death. 1 charge to '
        + 'throw it (returns after the attack): a thunderclap forces the '
        + 'target and everything within 30 feet to save Constitution (DC '
        + '17) or be stunned until the end of your next turn.',
      dmPromptable: true
    }]
  })
}

export const HOLY_AVENGER: ItemDefinition = {
  id: 'srd:item.holy-avenger', name: 'Holy Avenger',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'weapon', rarity: 'legendary', slot: 'mainHand',
  requiresAttunement: true, attunementPrerequisite: { classLevelAtLeast: ['srd:class.paladin', 1] },
  effects: source({
    id: 'srd:item.holy-avenger', name: 'Holy Avenger',
    completeness: 'partial',
    modifiers: [
      add(ATTACK_ROLL, 3, { condition: { playerToggle: 'item.holy-avenger' }, note: 'holy avenger: turn off when not using it' }),
      add(DAMAGE_WEAPON, 3, { condition: { playerToggle: 'item.holy-avenger' }, note: 'holy avenger: turn off when not using it' })
    ],
    narrative: [{
      text: 'Against fiends and undead, deals an extra 2d10 radiant. '
        + 'While drawn, you and friendly creatures within 10 feet (30 '
        + 'feet at paladin level 17+) have advantage on saves against '
        + 'spells and other magical effects.',
      dmPromptable: true
    }]
  })
}

export const HORSESHOES_OF_A_ZEPHYR: ItemDefinition = {
  id: 'srd:item.horseshoes-of-a-zephyr', name: 'Horseshoes of a Zephyr',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'veryRare',
  effects: source({
    id: 'srd:item.horseshoes-of-a-zephyr', name: 'Horseshoes of a Zephyr',
    // Freedom of Movement's exact difficult-terrain floor. Floating above
    // the ground, leaving no tracks, and travelling 12 hours without
    // exhaustion aren't stats this set tracks.
    completeness: 'partial',
    modifiers: [{
      id: id(), channel: 'value', target: movementCostPath('difficultTerrain'), op: 'set',
      value: 1, permanence: 'persistent', note: 'horseshoes of a zephyr'
    }],
    narrative: [{
      text: 'A set of four; all must be affixed. The wearer floats 4 '
        + 'inches above the ground, crossing nonsolid or unstable '
        + 'surfaces, leaving no tracks, and can travel at normal speed for '
        + '12 hours a day without forced-march exhaustion.',
      dmPromptable: true
    }]
  })
}

// ===========================================================================
// A real charge pool, everything else narrative
// ===========================================================================

export const GEM_OF_SEEING: ItemDefinition = {
  id: 'srd:item.gem-of-seeing', name: 'Gem of Seeing',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare', requiresAttunement: true,
  charges: { id: 'item.gem-of-seeing.charges', name: 'Gem of Seeing', max: 3, refresh: { kind: 'dawn', amount: { count: 1, sides: 3 } }, display: 'uses' },
  effects: source({
    id: 'srd:item.gem-of-seeing', name: 'Gem of Seeing',
    completeness: 'partial',
    narrative: [{
      text: 'Action and 1 charge: truesight 120 feet for 10 minutes while '
        + 'peering through the gem.',
      dmPromptable: true
    }]
  })
}

export const HELM_OF_TELEPORTATION: ItemDefinition = {
  id: 'srd:item.helm-of-teleportation', name: 'Helm of Teleportation',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare', slot: 'head', requiresAttunement: true,
  charges: { id: 'item.helm-of-teleportation.charges', name: 'Helm of Teleportation', max: 3, refresh: { kind: 'dawn', amount: { count: 1, sides: 3 } }, display: 'uses' },
  effects: source({
    id: 'srd:item.helm-of-teleportation', name: 'Helm of Teleportation',
    completeness: 'partial',
    narrative: [{ text: 'Action and 1 charge to cast teleport.', dmPromptable: true }]
  })
}

// ===========================================================================
// No roll, or a roll with no effect field to carry it — narrative only
// ===========================================================================

export const GLOVES_OF_MISSILE_SNARING: ItemDefinition = {
  id: 'srd:item.gloves-of-missile-snaring', name: 'Gloves of Missile Snaring',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon', slot: 'gloves', requiresAttunement: true,
  effects: source({
    id: 'srd:item.gloves-of-missile-snaring', name: 'Gloves of Missile Snaring',
    completeness: 'partial',
    narrative: [{
      text: 'Reaction when hit by a ranged weapon attack, with a free '
        + 'hand, to reduce the damage by 1d10 + your Dexterity modifier; '
        + 'reducing it to 0 lets you catch the missile if it fits in that hand.',
      dmPromptable: true
    }]
  })
}

export const GOGGLES_OF_NIGHT: ItemDefinition = {
  id: 'srd:item.goggles-of-night', name: 'Goggles of Night',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon',
  effects: source({
    id: 'srd:item.goggles-of-night', name: 'Goggles of Night',
    // No stat exists for darkvision's actual distance, the same gap the
    // Darkvision spell already leaves — and this item has two different
    // stacking rules (grant if none, extend if some) neither of which a
    // missing stat can express.
    completeness: 'partial',
    narrative: [{
      text: 'Darkvision 60 feet, or +60 feet to existing darkvision.',
      dmPromptable: true
    }]
  })
}

export const HANDY_HAVERSACK: ItemDefinition = {
  id: 'srd:item.handy-haversack', name: 'Handy Haversack',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare',
  effects: source({
    id: 'srd:item.handy-haversack', name: 'Handy Haversack',
    // A container with capacity and a weight override — the same gap Bag
    // of Holding and Efficient Quiver leave.
    completeness: 'partial',
    narrative: [{
      text: 'A central pouch (80 lb / 8 cubic feet) and two side pouches '
        + '(20 lb / 2 cubic feet each), always weighing 5 lb. Retrieval '
        + 'costs an action, and the item you reach for is always on top. '
        + 'Overloading, piercing or tearing destroys it and its contents '
        + 'forever. Nesting with a bag of holding or portable hole '
        + 'destroys both and opens a one-way Astral gate.',
      dmPromptable: true
    }]
  })
}

export const HELM_OF_BRILLIANCE: ItemDefinition = {
  id: 'srd:item.helm-of-brilliance', name: 'Helm of Brilliance',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'veryRare', slot: 'head', requiresAttunement: true,
  effects: source({
    id: 'srd:item.helm-of-brilliance', name: 'Helm of Brilliance',
    // A capability set by a consumable gem inventory it carries, with a
    // failure mode triggered by a specific damage source — no channel for
    // "capabilities that depend on remaining component stock."
    completeness: 'partial',
    narrative: [{
      text: 'Set with gems (diamonds, rubies, fire opals, opals); prying '
        + 'one out destroys it, and losing all of them ends the item. '
        + 'Action to cast a spell (save DC 18) by consuming the matching '
        + 'gem: daylight, fireball, prismatic spray, or wall of fire. With '
        + 'a diamond: undead nearby take 1d6 radiant each turn. With a '
        + 'ruby: resistance to fire. With a fire opal: set a held weapon '
        + 'ablaze for +1d6 fire on hits. Backfire: taking fire damage from '
        + 'a failed save has a 1-in-20 chance of destroying the helm and '
        + 'harming everyone nearby.',
      dmPromptable: true
    }]
  })
}

export const HELM_OF_TELEPATHY: ItemDefinition = {
  id: 'srd:item.helm-of-telepathy', name: 'Helm of Telepathy',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon', slot: 'head', requiresAttunement: true,
  effects: source({
    id: 'srd:item.helm-of-telepathy', name: 'Helm of Telepathy',
    completeness: 'partial',
    narrative: [{
      text: 'Action to cast detect thoughts (DC 13); while concentrating, '
        + 'bonus action to send a telepathic message to the focused '
        + 'creature, who may reply with its own bonus action. Once per '
        + 'dawn, action to cast suggestion (DC 13) on it.',
      dmPromptable: true
    }]
  })
}

export const HORN_OF_BLASTING: ItemDefinition = {
  id: 'srd:item.horn-of-blasting', name: 'Horn of Blasting',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare',
  effects: source({
    id: 'srd:item.horn-of-blasting', name: 'Horn of Blasting',
    completeness: 'partial',
    narrative: [{
      text: 'Action and a command word: a 30-foot cone, DC 15 '
        + 'Constitution save, 5d6 thunder and deafened 1 minute, half '
        + 'and no deafness on success. Glass or crystal creatures and '
        + 'objects save at disadvantage and take 10d6 instead. Each use '
        + 'has a 20% chance of exploding for 10d6 fire to the blower, '
        + 'destroying the horn.',
      dmPromptable: true
    }]
  })
}

export const HORN_OF_VALHALLA: ItemDefinition = {
  id: 'srd:item.horn-of-valhalla', name: 'Horn of Valhalla',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare',
  effects: source({
    id: 'srd:item.horn-of-valhalla', name: 'Horn of Valhalla',
    completeness: 'partial',
    narrative: [{
      text: 'Action to blow: warrior spirits appear within 60 feet for an '
        + 'hour or until 0 HP, on a 7-day cooldown. Type and count depend '
        + 'on the specific horn (silver, brass, bronze, or iron) and a '
        + 'd100 roll, with some types requiring specific proficiencies — '
        + 'failing the requirement makes the summons attack you instead. '
        + 'This content set carries no creature statblocks — narrate the '
        + 'result by hand.',
      dmPromptable: true
    }]
  })
}

export const IMMOVABLE_ROD: ItemDefinition = {
  id: 'srd:item.immovable-rod', name: 'Immovable Rod',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon',
  effects: source({
    id: 'srd:item.immovable-rod', name: 'Immovable Rod',
    completeness: 'partial',
    narrative: [{
      text: 'Action to press the button: fixed in place, defying '
        + 'gravity, holding up to 8,000 lb. A creature can spend an '
        + 'action on a DC 30 Strength check to move it 10 feet.',
      dmPromptable: true
    }]
  })
}

export const INSTANT_FORTRESS: ItemDefinition = {
  id: 'srd:item.instant-fortress', name: 'Instant Fortress',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare',
  effects: source({
    id: 'srd:item.instant-fortress', name: 'Instant Fortress',
    completeness: 'partial',
    narrative: [{
      text: 'Action and a command word: a 1-inch cube becomes a 20-foot- '
        + 'square, 30-foot-high adamantine tower with arrow slits, a '
        + 'battlement, two floors and a roof trapdoor. Creatures in the '
        + 'area save Dexterity (DC 15) for 10d10 bludgeoning, half on '
        + 'success, and are pushed out either way. The structure has 100 '
        + 'HP per wall, immunity to nonmagical weapon damage, and '
        + 'resistance to everything else. Dismissed only while empty.',
      dmPromptable: true
    }]
  })
}

// ===========================================================================
// Ioun Stone — fourteen real items behind one SRD entry
// ===========================================================================

const IOUN_ABILITY_STONES = [
  { name: 'Agility', ability: 'dex' as const }, { name: 'Fortitude', ability: 'con' as const },
  { name: 'Insight', ability: 'wis' as const }, { name: 'Intellect', ability: 'int' as const },
  { name: 'Leadership', ability: 'cha' as const }, { name: 'Strength', ability: 'str' as const }
]

export const IOUN_STONE_ABILITIES: ItemDefinition[] = IOUN_ABILITY_STONES.map(({ name, ability }) => {
  const key = name.toLowerCase()
  return {
    id: `srd:item.ioun-stone-${key}`, name: `Ioun Stone of ${name}`,
    provenance: 'srd', contentVersion: 1, rulesetVersion: V,
    category: 'wondrous' as const, rarity: 'veryRare' as const, requiresAttunement: true,
    effects: source({
      id: `srd:item.ioun-stone-${key}`, name: `Ioun Stone of ${name}`,
      modifiers: [
        add(abilityScorePath(ability), 2, { note: `ioun stone of ${key}` }),
        { id: id(), channel: 'value', target: abilityScorePath(ability), op: 'max', value: 20, permanence: 'persistent', note: `ioun stone of ${key}: capped at 20` }
      ],
      narrative: [{
        text: 'Orbits your head at 1 to 3 feet. Another creature can '
          + 'seize it with an attack roll against AC 24 or a DC 24 '
          + 'Dexterity (Acrobatics) check; you can stow it with an action.',
        dmPromptable: false
      }]
    })
  }
})

export const IOUN_STONE_MASTERY: ItemDefinition = {
  id: 'srd:item.ioun-stone-mastery', name: 'Ioun Stone of Mastery',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'legendary', requiresAttunement: true,
  effects: source({
    id: 'srd:item.ioun-stone-mastery', name: 'Ioun Stone of Mastery',
    modifiers: [add(PROFICIENCY_BONUS, 1)],
    narrative: [{ text: 'Orbits your head; the same seize/stow rules as every Ioun Stone.', dmPromptable: false }]
  })
}

export const IOUN_STONE_PROTECTION: ItemDefinition = {
  id: 'srd:item.ioun-stone-protection', name: 'Ioun Stone of Protection',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare', requiresAttunement: true,
  effects: source({
    id: 'srd:item.ioun-stone-protection', name: 'Ioun Stone of Protection',
    modifiers: [add(ARMOR_CLASS, 1)],
    narrative: [{ text: 'Orbits your head; the same seize/stow rules as every Ioun Stone.', dmPromptable: false }]
  })
}

export const IOUN_STONE_ABSORPTION: ItemDefinition = {
  id: 'srd:item.ioun-stone-absorption', name: 'Ioun Stone of Absorption',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'veryRare', requiresAttunement: true,
  charges: { id: 'item.ioun-stone-absorption.levels', name: 'Ioun Stone of Absorption', max: 20, refresh: { kind: 'never' }, display: 'pool' },
  effects: source({
    id: 'srd:item.ioun-stone-absorption', name: 'Ioun Stone of Absorption',
    completeness: 'partial',
    narrative: [{
      text: 'Reaction to cancel a spell of 4th level or lower cast by a '
        + 'visible creature targeting only you; burns out after 20 '
        + 'levels total, tracked here as a pool. Cannot cancel a spell '
        + 'higher than the levels remaining.',
      dmPromptable: true
    }]
  })
}

export const IOUN_STONE_GREATER_ABSORPTION: ItemDefinition = {
  id: 'srd:item.ioun-stone-greater-absorption', name: 'Ioun Stone of Greater Absorption',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'legendary', requiresAttunement: true,
  charges: { id: 'item.ioun-stone-greater-absorption.levels', name: 'Ioun Stone of Greater Absorption', max: 50, refresh: { kind: 'never' }, display: 'pool' },
  effects: source({
    id: 'srd:item.ioun-stone-greater-absorption', name: 'Ioun Stone of Greater Absorption',
    completeness: 'partial',
    narrative: [{
      text: 'As Absorption, but cancels a spell of 8th level or lower and '
        + 'burns out after 50 levels total.',
      dmPromptable: true
    }]
  })
}

export const IOUN_STONE_AWARENESS: ItemDefinition = {
  id: 'srd:item.ioun-stone-awareness', name: 'Ioun Stone of Awareness',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare', requiresAttunement: true,
  effects: source({
    id: 'srd:item.ioun-stone-awareness', name: 'Ioun Stone of Awareness',
    // No surprise-round concept exists here, the same gap Foresight leaves.
    completeness: 'partial',
    narrative: [{ text: 'While worn, you cannot be surprised.', dmPromptable: true }]
  })
}

export const IOUN_STONE_REGENERATION: ItemDefinition = {
  id: 'srd:item.ioun-stone-regeneration', name: 'Ioun Stone of Regeneration',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'legendary', requiresAttunement: true,
  effects: source({
    id: 'srd:item.ioun-stone-regeneration', name: 'Ioun Stone of Regeneration',
    // An hourly trigger with no clock in this content set to fire it.
    completeness: 'partial',
    narrative: [{ text: 'Regain 15 hit points at the end of each hour, provided you have at least 1 HP.', dmPromptable: true }]
  })
}

export const IOUN_STONE_RESERVE: ItemDefinition = {
  id: 'srd:item.ioun-stone-reserve', name: 'Ioun Stone of Reserve',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare', requiresAttunement: true,
  effects: source({
    id: 'srd:item.ioun-stone-reserve', name: 'Ioun Stone of Reserve',
    // A stored-spell container whose casts carry another character's own
    // slot level, save DC, attack bonus and spellcasting ability — a
    // second character's statistics riding inside a cast record.
    completeness: 'partial',
    narrative: [{
      text: 'Stores up to 3 levels of spells (found with 1d4-1 already '
        + 'stored). Any creature can cast a 1st-3rd-level spell into it '
        + 'by touch. You can cast a stored spell using the original '
        + "caster's slot level, save DC, attack bonus and spellcasting ability.",
      dmPromptable: true
    }]
  })
}

export const IOUN_STONE_SUSTENANCE: ItemDefinition = {
  id: 'srd:item.ioun-stone-sustenance', name: 'Ioun Stone of Sustenance',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare', requiresAttunement: true,
  effects: source({
    id: 'srd:item.ioun-stone-sustenance', name: 'Ioun Stone of Sustenance',
    completeness: 'partial',
    narrative: [{ text: 'While worn, you need not eat or drink.', dmPromptable: true }]
  })
}

// ===========================================================================
// Registration
// ===========================================================================

export const ALL_ITEMS_D2: ItemDefinition[] = [
  HEADBAND_OF_INTELLECT, HORSESHOES_OF_SPEED, HAT_OF_DISGUISE, HELM_OF_COMPREHENDING_LANGUAGES,
  GLAMOURED_STUDDED_LEATHER,
  GIANT_SLAYER, GLOVES_OF_SWIMMING_AND_CLIMBING, HAMMER_OF_THUNDERBOLTS, HOLY_AVENGER,
  HORSESHOES_OF_A_ZEPHYR,
  GEM_OF_SEEING, HELM_OF_TELEPORTATION,
  GLOVES_OF_MISSILE_SNARING, GOGGLES_OF_NIGHT, HANDY_HAVERSACK, HELM_OF_BRILLIANCE,
  HELM_OF_TELEPATHY, HORN_OF_BLASTING, HORN_OF_VALHALLA, IMMOVABLE_ROD, INSTANT_FORTRESS,
  ...IOUN_STONE_ABILITIES, IOUN_STONE_MASTERY, IOUN_STONE_PROTECTION,
  IOUN_STONE_ABSORPTION, IOUN_STONE_GREATER_ABSORPTION, IOUN_STONE_AWARENESS,
  IOUN_STONE_REGENERATION, IOUN_STONE_RESERVE, IOUN_STONE_SUSTENANCE
]
