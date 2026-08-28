// 4th-level spells.
//
// Thirty-one of them — the full union of every class's 4th-level column
// (docs/srd/08-spell-lists.md). Nothing existed at this level before this
// file; every previously-authored spell in the set is 3rd level or lower.
//
// Ice Storm is the first spell with two damage types in one resolved effect —
// `effect.damage` is already an array, and upcasting only ever scaled
// `damage[0]` (91-effect-vocabulary.md's rule, proven true again): the
// bludgeoning term grows with the slot and the cold term does not, which is
// exactly what the SRD says and needed no new mechanism to say it.
//
// Stoneskin and Greater Invisibility both resolve completely. Stoneskin sets
// resistance on three damage types at once — the same `set` op Protection
// from Poison already uses, just three times. Greater Invisibility needs
// nothing beyond what Invisibility already proved: point at the existing
// Invisible condition and the mechanics are already correct.

import type { EffectSource, SpellDefinition } from '../rules/types.js'
import { movementCostPath, resistancePath, RESISTANCE_RESISTANT } from '../rules/statPaths.js'

const V = '2014'
let n = 0
const id = () => `s4${++n}`

function effects(o: Partial<EffectSource> & { id: string; name: string }): EffectSource {
  return {
    provenance: 'srd', contentVersion: 1, kind: 'spell',
    activation: { always: true }, modifiers: [], completeness: 'complete',
    ...o
  }
}

function spell(o: Partial<SpellDefinition> & {
  id: string; name: string; level: number; school: string; effects: EffectSource
}): SpellDefinition {
  return {
    provenance: 'srd', contentVersion: 1, rulesetVersion: V,
    ritual: false, castingTime: 'action', rangeKind: 'ranged',
    components: { verbal: true, somatic: true },
    concentration: false,
    ...o
  } as SpellDefinition
}

// ===========================================================================
// Damage
// ===========================================================================

export const BLIGHT = spell({
  id: 'srd:spell.blight', name: 'Blight', level: 4, school: 'necromancy',
  rangeFeet: 30,
  effect: {
    delivery: 'save', save: { ability: 'con', onSuccess: 'half' },
    damage: [{ dice: { count: 8, sides: 8 }, type: 'necrotic' }],
    perSlotAbove: { damageDice: { count: 1, sides: 8 } }
  },
  effects: effects({
    id: 'srd:spell.blight', name: 'Blight',
    // Undead and constructs are immune; a plant creature saves with
    // disadvantage and takes maximum damage; a nonmagical plant that is not a
    // creature simply dies with no save. None of those exceptions is
    // something the resolved 8d8 knows to apply.
    completeness: 'partial',
    narrative: [{
      text: 'One creature you can see withers. It makes a Constitution save, '
        + 'taking 8d8 necrotic damage on a failure and half on a success — no '
        + 'effect on undead or constructs. A plant creature saves with '
        + 'disadvantage and takes maximum damage regardless; an ordinary plant '
        + 'that is not a creature simply dies. Neither exception is applied '
        + 'here.',
      dmPromptable: true
    }]
  })
})

export const ICE_STORM = spell({
  id: 'srd:spell.ice-storm', name: 'Ice Storm', level: 4, school: 'evocation',
  rangeFeet: 300,
  // Two damage types from one save — `damage` is already an array, and
  // upcasting only ever scales the first component. The bludgeoning term
  // grows with the slot; the cold term does not, exactly as the SRD says.
  effect: {
    delivery: 'save', save: { ability: 'dex', onSuccess: 'half' },
    damage: [
      { dice: { count: 2, sides: 8 }, type: 'bludgeoning' },
      { dice: { count: 4, sides: 6 }, type: 'cold' }
    ],
    perSlotAbove: { damageDice: { count: 1, sides: 8 } }
  },
  effects: effects({
    id: 'srd:spell.ice-storm', name: 'Ice Storm',
    narrative: [{
      text: 'Hail hammers a 20-foot-radius, 40-foot-tall cylinder. Every '
        + 'creature there makes a Dexterity save, taking 2d8 bludgeoning and '
        + '4d6 cold damage on a failure, half on a success. The ground there '
        + 'becomes difficult terrain until the end of your next turn.',
      dmPromptable: false
    }]
  })
})

export const WALL_OF_FIRE = spell({
  id: 'srd:spell.wall-of-fire', name: 'Wall of Fire', level: 4, school: 'evocation',
  rangeFeet: 120, concentration: true, durationSeconds: 60,
  effect: {
    delivery: 'save', save: { ability: 'dex', onSuccess: 'half' },
    damage: [{ dice: { count: 5, sides: 8 }, type: 'fire' }],
    perSlotAbove: { damageDice: { count: 1, sides: 8 } }
  },
  effects: effects({
    id: 'srd:spell.wall-of-fire', name: 'Wall of Fire',
    narrative: [{
      text: 'A wall of fire up to 60 feet long, 20 feet high and 1 foot thick, '
        + 'or a 20-foot-diameter ring. On appearing, every creature there makes '
        + 'a Dexterity save, taking 5d8 fire damage on a failure and half on a '
        + 'success — resolve this again for anyone who ends a turn within 10 '
        + 'feet of the side you chose, or enters the wall for the first time on '
        + 'a turn.',
      dmPromptable: true
    }]
  })
})

export const BLACK_TENTACLES = spell({
  id: 'srd:spell.black-tentacles', name: 'Black Tentacles', level: 4, school: 'conjuration',
  rangeFeet: 90, concentration: true, durationSeconds: 60,
  effect: {
    delivery: 'save', save: { ability: 'dex', onSuccess: 'none' },
    damage: [{ dice: { count: 3, sides: 6 }, type: 'bludgeoning' }]
  },
  effects: effects({
    id: 'srd:spell.black-tentacles', name: 'Black Tentacles',
    // The damage and save are exact; the restrained condition it applies on a
    // failure has nowhere to attach without a target.
    completeness: 'partial',
    narrative: [{
      text: 'Squirming tentacles fill a 20-foot square, becoming difficult '
        + 'terrain. A creature entering it for the first time on a turn, or '
        + 'starting there, makes a Dexterity save, taking 3d6 bludgeoning '
        + 'damage and becoming restrained on a failure. An already-restrained '
        + 'creature that starts its turn there takes 3d6 automatically. Escape '
        + 'with an action and a Strength or Dexterity check against your spell '
        + 'save DC.',
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Buffs that install real modifiers
// ===========================================================================

export const STONESKIN = spell({
  id: 'srd:spell.stoneskin', name: 'Stoneskin', level: 4, school: 'abjuration',
  rangeKind: 'touch',
  components: { verbal: true, somatic: true, material: 'diamond dust worth at least 100 gp, which the spell consumes', materialCostCp: 10000, consumed: true },
  concentration: true, durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.stoneskin', name: 'Stoneskin',
    // The same `set` op Protection from Poison already uses, three times over
    // — resistance is resistance whether the source is poison or a stony hide.
    modifiers: (['bludgeoning', 'piercing', 'slashing'] as const).map((t) => ({
      id: id(), channel: 'value', target: resistancePath(t), op: 'set',
      value: RESISTANCE_RESISTANT, permanence: 'temporary', note: 'stoneskin'
    })),
    narrative: [{
      text: 'A willing creature you touch has resistance to nonmagical '
        + 'bludgeoning, piercing and slashing damage for up to an hour. The '
        + 'resolver does not distinguish a magical source of those types from a '
        + 'nonmagical one, so the resistance applies to both here.',
      dmPromptable: true
    }]
  })
})

export const GREATER_INVISIBILITY = spell({
  id: 'srd:spell.greater-invisibility', name: 'Greater Invisibility', level: 4,
  school: 'illusion', rangeKind: 'touch', concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.greater-invisibility', name: 'Greater Invisibility',
    narrative: [{
      text: 'A creature you touch, and its gear, turns invisible for up to a '
        + 'minute — unlike Invisibility, attacking or casting does not end it. '
        + 'Apply the existing Invisible condition, which already carries the '
        + 'correct advantage and disadvantage.',
      dmPromptable: true
    }]
  })
})

export const FREEDOM_OF_MOVEMENT = spell({
  id: 'srd:spell.freedom-of-movement', name: 'Freedom of Movement', level: 4,
  school: 'abjuration', rangeKind: 'touch', durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.freedom-of-movement', name: 'Freedom of Movement',
    // Two of the four clauses are real: Land's Stride's difficult-terrain
    // path, and Mindless Rage's suppress-by-source-id shape applied to
    // paralyzed and restrained instead of charmed and frightened. Automatic
    // escape from a restraint and underwater attack penalties are both about
    // an event rather than a standing stat.
    completeness: 'partial',
    modifiers: [
      {
        id: id(), channel: 'value', target: movementCostPath('difficultTerrain'),
        op: 'set', value: 1, permanence: 'temporary',
        note: 'freedom of movement: unaffected by difficult terrain'
      },
      {
        id: id(), channel: 'value', op: 'suppress', permanence: 'temporary',
        suppresses: { sourceIds: ['srd:condition.paralyzed', 'srd:condition.restrained'] },
        note: 'freedom of movement: immune to being paralyzed or restrained'
      }
    ],
    narrative: [{
      text: 'A creature you touch is unaffected by difficult terrain for an '
        + 'hour, and magic cannot reduce its speed or paralyze or restrain it — '
        + 'an existing instance of either condition is suspended, the way '
        + 'Mindless Rage suspends charmed and frightened. It also automatically '
        + 'escapes a nonmagical restraint using 5 feet of movement, and suffers '
        + 'no underwater penalties, neither of which is applied.',
      dmPromptable: true
    }]
  })
})

export const FIRE_SHIELD = spell({
  id: 'srd:spell.fire-shield', name: 'Fire Shield', level: 4, school: 'evocation',
  rangeKind: 'self', durationSeconds: 600,
  effects: effects({
    id: 'srd:spell.fire-shield', name: 'Fire Shield',
    // The resistance half is real, gated on which shield was chosen; the
    // retaliation damage fires on being hit, an event this content set has
    // no trigger window for on the defender's own turn.
    completeness: 'partial',
    modifiers: [
      {
        id: id(), channel: 'value', target: resistancePath('cold'), op: 'set',
        value: RESISTANCE_RESISTANT,
        condition: { playerToggle: 'spell.fire-shield.warm' },
        permanence: 'temporary', note: 'fire shield: warm shield'
      },
      {
        id: id(), channel: 'value', target: resistancePath('fire'), op: 'set',
        value: RESISTANCE_RESISTANT,
        condition: { playerToggle: 'spell.fire-shield.chill' },
        permanence: 'temporary', note: 'fire shield: chill shield'
      }
    ],
    narrative: [{
      text: 'Choose warm shield (resistance to cold) or chill shield '
        + '(resistance to fire) for 10 minutes, and turn on the matching '
        + 'toggle. A creature that hits you with a melee attack from within 5 '
        + 'feet takes 2d8 fire (warm) or cold (chill) damage — not applied here, '
        + 'roll it yourself.',
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Save spells with a condition rather than damage
// ===========================================================================

export const BANISHMENT = spell({
  id: 'srd:spell.banishment', name: 'Banishment', level: 4, school: 'abjuration',
  rangeFeet: 60, concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.banishment', name: 'Banishment',
    completeness: 'partial',
    narrative: [{
      text: 'One creature you can see makes a Charisma save or is banished: a '
        + 'native of this plane is shunted to a harmless demiplane and '
        + 'incapacitated until the spell ends; a native of another plane is '
        + 'sent home, permanently if the spell lasts the full minute.',
      dmPromptable: true
    }]
  })
})

export const COMPULSION = spell({
  id: 'srd:spell.compulsion', name: 'Compulsion', level: 4, school: 'enchantment',
  rangeFeet: 30, concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.compulsion', name: 'Compulsion',
    completeness: 'partial',
    narrative: [{
      text: 'Creatures that can hear you make a Wisdom save, automatically '
        + 'succeeding if immune to being charmed. Use a bonus action each turn '
        + 'to name a direction; a creature that failed uses as much of its '
        + 'movement as possible that way, provoking opportunity attacks but not '
        + 'walking into obvious danger, and repeats the save afterward to end '
        + 'the effect.',
      dmPromptable: true
    }]
  })
})

export const CONFUSION = spell({
  id: 'srd:spell.confusion', name: 'Confusion', level: 4, school: 'enchantment',
  rangeFeet: 90, concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.confusion', name: 'Confusion',
    completeness: 'partial',
    narrative: [{
      text: 'Every creature in a 10-foot-radius sphere makes a Wisdom save. On '
        + 'a failure it cannot take reactions and rolls a d10 at the start of '
        + 'each of its turns to determine its behaviour: wandering off, doing '
        + 'nothing, attacking the nearest creature, or acting normally.',
      dmPromptable: true
    }]
  })
})

export const DOMINATE_BEAST = spell({
  id: 'srd:spell.dominate-beast', name: 'Dominate Beast', level: 4, school: 'enchantment',
  rangeFeet: 60, concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.dominate-beast', name: 'Dominate Beast',
    completeness: 'partial',
    narrative: [{
      text: 'One beast you can see makes a Wisdom save, with advantage if you '
        + 'or your allies are fighting it, or is charmed for up to a minute. '
        + 'While charmed you share a telepathic link and can issue commands; '
        + 'spend your action and reaction to take total control until the end '
        + 'of your next turn. It repeats the save whenever it takes damage.',
      dmPromptable: true
    }]
  })
})

export const PHANTASMAL_KILLER = spell({
  id: 'srd:spell.phantasmal-killer', name: 'Phantasmal Killer', level: 4, school: 'illusion',
  rangeFeet: 120, concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.phantasmal-killer', name: 'Phantasmal Killer',
    // Two different saves in sequence — one that applies frightened with no
    // damage, then a second, repeating one that deals damage on a failure —
    // which does not match any single delivery this vocabulary resolves.
    completeness: 'partial',
    narrative: [{
      text: 'One creature you can see makes a Wisdom save or is frightened by '
        + 'a phantasmal beast for up to a minute. At the end of each of its '
        + 'turns it makes another Wisdom save, taking 4d10 psychic damage on a '
        + 'failure — a success on either save ends the spell early.',
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Summons and transformation — the second-statblock wall
// ===========================================================================

export const CONJURE_MINOR_ELEMENTALS = spell({
  id: 'srd:spell.conjure-minor-elementals', name: 'Conjure Minor Elementals', level: 4,
  school: 'conjuration', castingTime: { minutes: 1 }, rangeFeet: 90,
  concentration: true, durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.conjure-minor-elementals', name: 'Conjure Minor Elementals',
    completeness: 'partial',
    narrative: [{
      text: 'Summon elementals: one of CR 2, two of CR 1, four of CR 1/2, or '
        + 'eight of CR 1/4, obeying your commands. Run them from statblocks at '
        + 'the table.',
      dmPromptable: true
    }]
  })
})

export const CONJURE_WOODLAND_BEINGS = spell({
  id: 'srd:spell.conjure-woodland-beings', name: 'Conjure Woodland Beings', level: 4,
  school: 'conjuration', rangeFeet: 60,
  components: { verbal: true, somatic: true, material: 'one holly berry per creature summoned' },
  concentration: true, durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.conjure-woodland-beings', name: 'Conjure Woodland Beings',
    completeness: 'partial',
    narrative: [{
      text: 'Summon fey spirits: one of CR 2, two of CR 1, four of CR 1/2, or '
        + 'eight of CR 1/4, obeying your commands. Run them from statblocks at '
        + 'the table.',
      dmPromptable: true
    }]
  })
})

export const FAITHFUL_HOUND = spell({
  id: 'srd:spell.faithful-hound', name: 'Faithful Hound', level: 4, school: 'conjuration',
  rangeFeet: 30, durationSeconds: 28800,
  effects: effects({
    id: 'srd:spell.faithful-hound', name: 'Faithful Hound',
    // A watchdog with its own attack bonus and damage roll — a second
    // statblock, however small.
    completeness: 'partial',
    narrative: [{
      text: 'An invisible watchdog appears for 8 hours, barking when a Small '
        + 'or larger creature it hasn\'t been told to ignore comes within 30 '
        + 'feet. At the start of each of your turns it bites one hostile '
        + 'creature within 5 feet: attack bonus equal to your spellcasting '
        + 'modifier plus proficiency, 4d8 piercing on a hit.',
      dmPromptable: true
    }]
  })
})

export const GUARDIAN_OF_FAITH = spell({
  id: 'srd:spell.guardian-of-faith', name: 'Guardian of Faith', level: 4, school: 'conjuration',
  rangeFeet: 30, durationSeconds: 28800,
  effects: effects({
    id: 'srd:spell.guardian-of-faith', name: 'Guardian of Faith',
    // A flat, non-dice damage amount whose termination condition is a
    // cumulative output budget — 60 damage dealt, not a duration or a save —
    // which is a shape nothing else in the set has needed.
    completeness: 'partial',
    narrative: [{
      text: 'A Large spectral guardian appears for 8 hours. A hostile creature '
        + 'moving within 10 feet of it for the first time on a turn makes a '
        + 'Dexterity save, taking 20 radiant damage on a failure and half on a '
        + 'success. It vanishes after dealing a total of 60 damage.',
      dmPromptable: true
    }]
  })
})

export const POLYMORPH = spell({
  id: 'srd:spell.polymorph', name: 'Polymorph', level: 4, school: 'transmutation',
  rangeFeet: 60, concentration: true, durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.polymorph', name: 'Polymorph',
    // Wild Shape's own wall: every statistic is replaced by a beast's, and
    // there is no bestiary or second-statblock engine to run it from.
    completeness: 'partial',
    narrative: [{
      text: 'A creature you can see becomes a beast of challenge rating at or '
        + 'below its own for up to an hour — an unwilling target saves Wisdom '
        + 'to resist. All statistics except mental ability scores are '
        + 'replaced; run the new form from a statblock at the table.',
      dmPromptable: true
    }]
  })
})

export const GIANT_INSECT = spell({
  id: 'srd:spell.giant-insect', name: 'Giant Insect', level: 4, school: 'transmutation',
  rangeFeet: 30, concentration: true, durationSeconds: 600,
  effects: effects({
    id: 'srd:spell.giant-insect', name: 'Giant Insect',
    completeness: 'partial',
    narrative: [{
      text: 'Transform up to ten centipedes, three spiders, five wasps or one '
        + 'scorpion into giant versions for up to 10 minutes, obeying your '
        + 'verbal commands. Run them from statblocks at the table.',
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// A rule about how damage is applied, rather than about a roll
// ===========================================================================

export const DEATH_WARD = spell({
  id: 'srd:spell.death-ward', name: 'Death Ward', level: 4, school: 'abjuration',
  rangeKind: 'touch', durationSeconds: 28800,
  effects: effects({
    id: 'srd:spell.death-ward', name: 'Death Ward',
    // A pre-emptive interceptor on the moment damage would take a creature to
    // 0 — the damage pipeline here has no hook before that point, only after.
    completeness: 'partial',
    narrative: [{
      text: 'A creature you touch that would be reduced to 0 hit points by '
        + 'damage instead drops to 1, once, and the spell ends. It also '
        + 'negates one instantaneous death effect that deals no damage. Lasts '
        + '8 hours.',
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Pure information and utility
// ===========================================================================

export const DIMENSION_DOOR = spell({
  id: 'srd:spell.dimension-door', name: 'Dimension Door', level: 4, school: 'conjuration',
  rangeFeet: 500, components: { verbal: true, somatic: false },
  effects: effects({
    id: 'srd:spell.dimension-door', name: 'Dimension Door',
    narrative: [{
      text: 'Teleport yourself, and up to one willing creature of your size or '
        + 'smaller within 5 feet, to a spot you can see, visualise, or '
        + 'describe by distance and direction. Arriving in an occupied space '
        + 'deals 4d6 force to each traveller and the teleport fails.',
      dmPromptable: false
    }]
  })
})

export const ARCANE_EYE = spell({
  id: 'srd:spell.arcane-eye', name: 'Arcane Eye', level: 4, school: 'divination',
  rangeFeet: 30, concentration: true, durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.arcane-eye', name: 'Arcane Eye',
    narrative: [{
      text: 'An invisible eye appears and moves 30 feet as an action, seeing '
        + 'normally plus darkvision to 30 feet, for up to an hour. It cannot '
        + 'change planes but has no other range limit.',
      dmPromptable: false
    }]
  })
})

export const DIVINATION = spell({
  id: 'srd:spell.divination', name: 'Divination', level: 4, school: 'divination',
  ritual: true, rangeKind: 'self',
  components: { verbal: true, somatic: true, material: 'incense and an offering together worth at least 25 gp, which the spell consumes', materialCostCp: 2500, consumed: true },
  effects: effects({
    id: 'srd:spell.divination', name: 'Divination',
    narrative: [{
      text: 'Ask one question about a specific goal, event or activity within '
        + '7 days. The DM gives a truthful reply as a short phrase, cryptic '
        + 'rhyme or omen.',
      dmPromptable: true
    }]
  })
})

export const LOCATE_CREATURE = spell({
  id: 'srd:spell.locate-creature', name: 'Locate Creature', level: 4, school: 'divination',
  rangeKind: 'self', concentration: true, durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.locate-creature', name: 'Locate Creature',
    narrative: [{
      text: 'Sense the direction to a familiar creature, or the nearest of a '
        + 'kind you have seen within 30 feet, within 1,000 feet — blocked by '
        + 'running water at least 10 feet wide.',
      dmPromptable: false
    }]
  })
})

export const CONTROL_WATER = spell({
  id: 'srd:spell.control-water', name: 'Control Water', level: 4, school: 'transmutation',
  rangeFeet: 300, concentration: true, durationSeconds: 600,
  effects: effects({
    id: 'srd:spell.control-water', name: 'Control Water',
    narrative: [{
      text: 'Control a 100-foot cube of water for up to 10 minutes — flood it, '
        + 'part it into a trench, redirect its flow, or whip up a whirlpool. '
        + 'Change or repeat the effect as an action on later turns.',
      dmPromptable: true
    }]
  })
})

export const HALLUCINATORY_TERRAIN = spell({
  id: 'srd:spell.hallucinatory-terrain', name: 'Hallucinatory Terrain', level: 4,
  school: 'illusion', castingTime: { minutes: 10 }, rangeFeet: 300, durationSeconds: 86400,
  effects: effects({
    id: 'srd:spell.hallucinatory-terrain', name: 'Hallucinatory Terrain',
    narrative: [{
      text: 'Natural terrain in a 150-foot cube looks, sounds and smells like '
        + 'other natural terrain for 24 hours — structures and creatures are '
        + 'unchanged. An Intelligence (Investigation) check against your spell '
        + 'save DC sees through it.',
      dmPromptable: false
    }]
  })
})

export const FABRICATE = spell({
  id: 'srd:spell.fabricate', name: 'Fabricate', level: 4, school: 'transmutation',
  castingTime: { minutes: 10 }, rangeFeet: 120,
  effects: effects({
    id: 'srd:spell.fabricate', name: 'Fabricate',
    narrative: [{
      text: 'Convert raw materials into a finished product of the same '
        + 'material, up to a 10-foot cube for most materials or a 5-foot cube '
        + 'for metal, stone or mineral. Fine craftsmanship requires the '
        + 'matching tool proficiency.',
      dmPromptable: false
    }]
  })
})

export const STONE_SHAPE = spell({
  id: 'srd:spell.stone-shape', name: 'Stone Shape', level: 4, school: 'transmutation',
  rangeKind: 'touch',
  effects: effects({
    id: 'srd:spell.stone-shape', name: 'Stone Shape',
    narrative: [{
      text: 'Reshape a Medium or smaller stone object, or a section of stone '
        + 'up to 5 feet in any dimension, into any form — a weapon, an idol, a '
        + 'passage through a thin wall.',
      dmPromptable: false
    }]
  })
})

export const PRIVATE_SANCTUM = spell({
  id: 'srd:spell.private-sanctum', name: 'Private Sanctum', level: 4, school: 'abjuration',
  castingTime: { minutes: 10 }, rangeFeet: 120, durationSeconds: 86400,
  effects: effects({
    id: 'srd:spell.private-sanctum', name: 'Private Sanctum',
    narrative: [{
      text: 'Ward a cube from 5 to 100 feet per side, for 24 hours: choose any '
        + 'of blocking sound, blocking sight including darkvision, blocking '
        + 'divination sensors, hiding creatures inside from divination, or '
        + 'blocking teleportation and planar travel.',
      dmPromptable: false
    }]
  })
})

export const RESILIENT_SPHERE = spell({
  id: 'srd:spell.resilient-sphere', name: 'Resilient Sphere', level: 4, school: 'evocation',
  rangeFeet: 30, concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.resilient-sphere', name: 'Resilient Sphere',
    // A containment field that blocks everything in both directions — nothing
    // passing in or out, the sphere immune to all damage — which is a rule
    // about what can reach a target rather than anything the target's own
    // sheet carries.
    completeness: 'partial',
    narrative: [{
      text: 'A Large or smaller creature or object is enclosed in an '
        + 'impenetrable sphere for up to a minute — an unwilling creature '
        + 'saves Dexterity to resist. Nothing passes in or out, though the '
        + 'occupant can breathe, and the sphere is immune to all damage.',
      dmPromptable: true
    }]
  })
})

export const SECRET_CHEST = spell({
  id: 'srd:spell.secret-chest', name: 'Secret Chest', level: 4, school: 'conjuration',
  rangeKind: 'touch',
  components: { verbal: true, somatic: true, material: 'a chest of rare materials worth at least 5,000 gp and a Tiny replica worth at least 50 gp' },
  effects: effects({
    id: 'srd:spell.secret-chest', name: 'Secret Chest',
    narrative: [{
      text: 'A chest holding up to 12 cubic feet of nonliving material '
        + 'vanishes into the Ethereal Plane. Touch the replica to recall it '
        + 'within 5 feet, or touch both to send it back.',
      dmPromptable: false
    }]
  })
})

export const ALL_LEVEL4_SPELLS: SpellDefinition[] = [
  { ...BLIGHT, lists: ['srd:list.druid', 'srd:list.sorcerer', 'srd:list.warlock', 'srd:list.wizard'] },
  { ...ICE_STORM, lists: ['srd:list.druid', 'srd:list.sorcerer', 'srd:list.wizard'] },
  { ...WALL_OF_FIRE, lists: ['srd:list.druid', 'srd:list.sorcerer', 'srd:list.wizard'] },
  { ...BLACK_TENTACLES, lists: ['srd:list.wizard'] },
  { ...STONESKIN, lists: [
    'srd:list.druid', 'srd:list.ranger', 'srd:list.sorcerer', 'srd:list.wizard'
  ] },
  { ...GREATER_INVISIBILITY, lists: [
    'srd:list.bard', 'srd:list.sorcerer', 'srd:list.wizard'
  ] },
  { ...FREEDOM_OF_MOVEMENT, lists: [
    'srd:list.bard', 'srd:list.cleric', 'srd:list.druid', 'srd:list.ranger'
  ] },
  { ...FIRE_SHIELD, lists: ['srd:list.wizard'] },
  { ...BANISHMENT, lists: [
    'srd:list.cleric', 'srd:list.paladin', 'srd:list.sorcerer', 'srd:list.warlock', 'srd:list.wizard'
  ] },
  { ...COMPULSION, lists: ['srd:list.bard'] },
  { ...CONFUSION, lists: ['srd:list.bard', 'srd:list.druid', 'srd:list.sorcerer', 'srd:list.wizard'] },
  { ...DOMINATE_BEAST, lists: ['srd:list.druid', 'srd:list.sorcerer'] },
  { ...PHANTASMAL_KILLER, lists: ['srd:list.wizard'] },
  { ...CONJURE_MINOR_ELEMENTALS, lists: ['srd:list.druid', 'srd:list.wizard'] },
  { ...CONJURE_WOODLAND_BEINGS, lists: ['srd:list.druid', 'srd:list.ranger'] },
  { ...FAITHFUL_HOUND, lists: ['srd:list.wizard'] },
  { ...GUARDIAN_OF_FAITH, lists: ['srd:list.cleric'] },
  { ...POLYMORPH, lists: ['srd:list.bard', 'srd:list.druid', 'srd:list.sorcerer', 'srd:list.wizard'] },
  { ...GIANT_INSECT, lists: ['srd:list.druid', 'srd:list.wizard'] },
  { ...DEATH_WARD, lists: ['srd:list.cleric', 'srd:list.paladin'] },
  { ...DIMENSION_DOOR, lists: ['srd:list.bard', 'srd:list.sorcerer', 'srd:list.warlock', 'srd:list.wizard'] },
  { ...ARCANE_EYE, lists: ['srd:list.wizard'] },
  { ...DIVINATION, lists: ['srd:list.cleric'] },
  { ...LOCATE_CREATURE, lists: [
    'srd:list.bard', 'srd:list.cleric', 'srd:list.druid', 'srd:list.paladin',
    'srd:list.ranger', 'srd:list.wizard'
  ] },
  { ...CONTROL_WATER, lists: ['srd:list.cleric', 'srd:list.druid', 'srd:list.wizard'] },
  { ...HALLUCINATORY_TERRAIN, lists: ['srd:list.bard', 'srd:list.druid', 'srd:list.warlock', 'srd:list.wizard'] },
  { ...FABRICATE, lists: ['srd:list.wizard'] },
  { ...STONE_SHAPE, lists: ['srd:list.cleric', 'srd:list.druid', 'srd:list.wizard'] },
  { ...PRIVATE_SANCTUM, lists: ['srd:list.wizard'] },
  { ...RESILIENT_SPHERE, lists: ['srd:list.wizard'] },
  { ...SECRET_CHEST, lists: ['srd:list.wizard'] }
]
