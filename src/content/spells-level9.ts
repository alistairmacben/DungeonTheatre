// 9th-level spells — the last of them.
//
// Fifteen spells, the full union of every class's 9th-level column
// (docs/srd/08-spell-lists.md). This closes out the SRD spell list: every
// spell from cantrip through 9th level the SRD names now exists in this
// content set.
//
// Foresight is the cleanest spell in the whole set to model this late — four
// ordinary roll modifiers (advantage on attacks, checks and saves;
// disadvantage for attackers) covering nearly everything it does. It stays
// partial for one clause only: "cannot be surprised" has no mechanism here,
// since this engine has no surprise-round concept to suppress.
//
// Meteor Swarm is the third two-damage-type spell (after Ice Storm and Flame
// Strike) and the largest damage roll in the set — 20d6 fire and 20d6
// bludgeoning in one resolved effect.
//
// Power Word Kill closes the Power Word family exactly like Power Word Stun:
// no roll at all, just an HP threshold the DM reads off the target's sheet.
//
// Checked against docs/srd-source/spells.pdf via docs/srd/08b-spell-descriptions.md
// and docs/srd/08-spell-lists.md.

import type { EffectSource, SpellDefinition } from '../rules/types.js'

const V = '2014'
let n = 0
const id = () => `s9${++n}`

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

export const METEOR_SWARM = spell({
  id: 'srd:spell.meteor-swarm', name: 'Meteor Swarm', level: 9, school: 'evocation',
  rangeFeet: 5280,
  effect: {
    delivery: 'save', save: { ability: 'dex', onSuccess: 'half' },
    damage: [
      { dice: { count: 20, sides: 6 }, type: 'fire' },
      { dice: { count: 20, sides: 6 }, type: 'bludgeoning' }
    ]
  },
  effects: effects({
    id: 'srd:spell.meteor-swarm', name: 'Meteor Swarm',
    narrative: [{
      text: 'Four separate 40-foot-radius spheres, spreading around '
        + 'corners, placed anywhere within a mile. A creature caught in '
        + 'more than one sphere is affected only once. Ignites unattended '
        + 'flammables.',
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Real modifiers with one uncaptured clause
// ===========================================================================

export const FORESIGHT = spell({
  id: 'srd:spell.foresight', name: 'Foresight', level: 9, school: 'divination',
  castingTime: { minutes: 1 }, rangeKind: 'touch', durationSeconds: 28800,
  effects: effects({
    id: 'srd:spell.foresight', name: 'Foresight',
    // Every roll clause the spell states is a plain modifier here. The one
    // clause without a mechanism is "cannot be surprised" — this engine has
    // no surprise-round concept to suppress.
    completeness: 'partial',
    modifiers: [
      {
        id: id(), channel: 'roll', rollOp: 'advantage', scope: { kinds: ['attack'] },
        permanence: 'temporary', note: 'foresight'
      },
      {
        id: id(), channel: 'roll', rollOp: 'advantage', scope: { kinds: ['check'] },
        permanence: 'temporary', note: 'foresight'
      },
      {
        id: id(), channel: 'roll', rollOp: 'advantage', scope: { kinds: ['save'] },
        permanence: 'temporary', note: 'foresight'
      },
      {
        id: id(), channel: 'roll', rollOp: 'disadvantage', scope: { kinds: ['attack'] },
        appliesTo: 'attackersAgainstSelf', permanence: 'temporary', note: 'foresight'
      }
    ],
    narrative: [{
      text: "The target also can't be surprised for 8 hours. Ends "
        + 'immediately if you cast this spell again.',
      dmPromptable: false
    }]
  })
})

// ===========================================================================
// Pure information and utility — nothing to compute, only to narrate
// ===========================================================================

export const POWER_WORD_KILL = spell({
  id: 'srd:spell.power-word-kill', name: 'Power Word Kill', level: 9, school: 'enchantment',
  rangeFeet: 60,
  components: { verbal: true, somatic: false },
  effects: effects({
    id: 'srd:spell.power-word-kill', name: 'Power Word Kill',
    narrative: [{
      text: 'No save, no attack roll. If the target has 100 hit points or '
        + 'fewer, it dies. Otherwise nothing happens.',
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Everything else — a random or scripted table, a summon, a transformation,
// a binary state change, or magic explicitly left to GM adjudication
// ===========================================================================

export const ASTRAL_PROJECTION = spell({
  id: 'srd:spell.astral-projection', name: 'Astral Projection', level: 9, school: 'necromancy',
  castingTime: { hours: 1 }, rangeFeet: 10,
  components: {
    verbal: true, somatic: true,
    material: 'per creature, a jacinth worth at least 1,000 gp and a carved '
      + 'silver bar worth at least 100 gp, both consumed',
    materialCostCp: 110000, consumed: true
  },
  effects: effects({
    id: 'srd:spell.astral-projection', name: 'Astral Projection',
    completeness: 'partial',
    narrative: [{
      text: 'You and up to eight willing creatures project into the Astral '
        + 'Plane; your bodies fall into suspended animation, needing no '
        + 'food or air. A silver cord tethers each of you — cutting it '
        + 'kills instantly. Damage to the astral form does not persist. '
        + 'Ends by your action, dispel magic on either body, or either '
        + 'body dropping to 0 HP.',
      dmPromptable: true
    }]
  })
})

export const GATE = spell({
  id: 'srd:spell.gate', name: 'Gate', level: 9, school: 'conjuration',
  rangeFeet: 60, concentration: true, durationSeconds: 60,
  components: {
    verbal: true, somatic: true,
    material: 'a diamond worth at least 5,000 gp'
  },
  effects: effects({
    id: 'srd:spell.gate', name: 'Gate',
    completeness: 'partial',
    narrative: [{
      text: 'A 5-to-20-foot portal to a precise location on another '
        + 'plane, passable only through the front. Deities and planar '
        + 'rulers can bar it from opening in their domains. Naming a '
        + 'specific creature on the far side draws it through, with no '
        + 'power gained over it.',
      dmPromptable: true
    }]
  })
})

export const IMPRISONMENT = spell({
  id: 'srd:spell.imprisonment', name: 'Imprisonment', level: 9, school: 'abjuration',
  castingTime: { minutes: 1 }, rangeFeet: 30,
  components: {
    verbal: true, somatic: true,
    material: "a likeness of the target plus a version-specific component "
      + 'worth at least 500 gp per Hit Die of the target'
  },
  effects: effects({
    id: 'srd:spell.imprisonment', name: 'Imprisonment',
    completeness: 'partial',
    narrative: [{
      text: 'The target saves Wisdom or is bound in one of five versions '
        + '(buried in force, chained and restrained, hidden in a demiplane, '
        + 'shrunk into a gemstone, or asleep) — success grants permanent '
        + 'immunity to your future castings of this spell. An ending '
        + 'condition is authored at cast time, subject to the GM\'s '
        + 'agreement. Only a 9th-level dispel magic on the prison ends it.',
      dmPromptable: true
    }]
  })
})

export const MASS_HEAL = spell({
  id: 'srd:spell.mass-heal', name: 'Mass Heal', level: 9, school: 'evocation',
  rangeFeet: 60,
  effects: effects({
    id: 'srd:spell.mass-heal', name: 'Mass Heal',
    // A divisible pool the caster allocates across any number of targets,
    // not a fixed per-creature roll — a different shape from Mass Cure
    // Wounds, which heals every target for the same amount.
    completeness: 'partial',
    narrative: [{
      text: 'Restore up to 700 hit points, divided as you choose among any '
        + 'number of creatures in range, and cure all diseases and any '
        + 'blindness or deafness among them. No effect on undead or '
        + 'constructs.',
      dmPromptable: true
    }]
  })
})

export const PRISMATIC_WALL = spell({
  id: 'srd:spell.prismatic-wall', name: 'Prismatic Wall', level: 9, school: 'abjuration',
  rangeFeet: 60, durationSeconds: 600,
  effects: effects({
    id: 'srd:spell.prismatic-wall', name: 'Prismatic Wall',
    completeness: 'partial',
    narrative: [{
      text: 'A wall or 30-foot sphere of seven layers, each its own '
        + 'colour with its own Dexterity save and effect (10d6 of a '
        + 'different damage type per layer for the first five; restrain- '
        + 'then-petrify for the sixth; blind-then-banish for the seventh), '
        + 'destroyed one at a time from red to violet by a specific means '
        + "each. Fails entirely if it would pass through a creature's "
        + 'space.',
      dmPromptable: true
    }]
  })
})

export const SHAPECHANGE = spell({
  id: 'srd:spell.shapechange', name: 'Shapechange', level: 9, school: 'transmutation',
  rangeKind: 'self', concentration: true, durationSeconds: 3600,
  components: {
    verbal: true, somatic: true,
    material: 'a jade circlet worth at least 1,500 gp, worn before casting'
  },
  effects: effects({
    id: 'srd:spell.shapechange', name: 'Shapechange',
    // Needs a statblock for whatever creature is chosen, the same gap
    // Animal Shapes leaves for beasts — this content set carries none.
    completeness: 'partial',
    narrative: [{
      text: 'Become any creature of CR up to your level that you have '
        + 'seen, not a construct or undead. Statistics replaced, keeping '
        + 'your alignment, mental scores, and the better of your and the '
        + "form's proficiency bonuses. This content set carries no "
        + 'creature statblocks, so there is nothing here to transform '
        + 'into — narrate it and track the form by hand.',
      dmPromptable: true
    }]
  })
})

export const STORM_OF_VENGEANCE = spell({
  id: 'srd:spell.storm-of-vengeance', name: 'Storm of Vengeance', level: 9, school: 'conjuration',
  rangeKind: 'sight', concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.storm-of-vengeance', name: 'Storm of Vengeance',
    // A scripted sequence keyed to the round counter — a different damage
    // type and mechanic on nearly every round of concentration, not a
    // single resolved effect.
    completeness: 'partial',
    narrative: [{
      text: 'A 360-foot-radius storm cloud. On appearing: Constitution '
        + 'save or 2d6 thunder and deafened 5 minutes. Then, on each '
        + 'later round you concentrate: round 2 deals 1d6 acid to '
        + 'everyone beneath with no save, round 3 fires six lightning '
        + 'bolts (10d6 each, Dexterity save for half), round 4 deals 2d6 '
        + 'bludgeoning hail, and rounds 5-10 turn the area into difficult, '
        + 'obscured terrain with 1d6 cold per round.',
      dmPromptable: true
    }]
  })
})

export const TIME_STOP = spell({
  id: 'srd:spell.time-stop', name: 'Time Stop', level: 9, school: 'transmutation',
  rangeKind: 'self',
  components: { verbal: true, somatic: false },
  effects: effects({
    id: 'srd:spell.time-stop', name: 'Time Stop',
    // An action-economy grant across an unrolled number of extra turns —
    // the same category of gap Haste's own extra action leaves.
    completeness: 'partial',
    narrative: [{
      text: 'Take 1d4 + 1 turns in a row while no time passes for anyone '
        + 'else. Ends immediately if any action or effect you create '
        + 'affects another creature or something it wears or carries, or '
        + 'if you move more than 1,000 feet from where you cast it.',
      dmPromptable: true
    }]
  })
})

export const TRUE_POLYMORPH = spell({
  id: 'srd:spell.true-polymorph', name: 'True Polymorph', level: 9, school: 'transmutation',
  rangeFeet: 30, concentration: true, durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.true-polymorph', name: 'True Polymorph',
    completeness: 'partial',
    narrative: [{
      text: 'Transform a creature into another creature, a creature into '
        + 'an object, or an unworn object into a creature. Unwilling '
        + 'creatures save Wisdom. Concentrating for the full hour makes it '
        + 'permanent until dispelled. No effect on a shapechanger or a '
        + 'creature at 0 HP.',
      dmPromptable: true
    }]
  })
})

export const TRUE_RESURRECTION = spell({
  id: 'srd:spell.true-resurrection', name: 'True Resurrection', level: 9, school: 'necromancy',
  castingTime: { hours: 1 }, rangeKind: 'touch',
  components: {
    verbal: true, somatic: true,
    material: 'holy water and diamonds worth at least 25,000 gp, which the spell consumes',
    materialCostCp: 2500000, consumed: true
  },
  effects: effects({
    id: 'srd:spell.true-resurrection', name: 'True Resurrection',
    // A binary state change, the same gap Raise Dead and Resurrection
    // share — plus no ordeal penalty to model even if it could.
    completeness: 'partial',
    narrative: [{
      text: 'A creature dead no longer than 200 years, not of old age, '
        + 'returns to full hit points with wounds closed, poison '
        + 'neutralised, diseases cured, curses lifted, and missing organs '
        + 'or limbs restored — a wholly new body if the original is gone, '
        + 'so long as you speak its name. No ordeal penalty, unlike Raise '
        + 'Dead or Resurrection.',
      dmPromptable: true
    }]
  })
})

export const WEIRD = spell({
  id: 'srd:spell.weird', name: 'Weird', level: 9, school: 'illusion',
  rangeFeet: 120, concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.weird', name: 'Weird',
    // The mass version of Phantasmal Killer, and the same gap: the real
    // damage is delayed to a later trigger, not resolved at cast time.
    completeness: 'partial',
    narrative: [{
      text: 'A 30-foot-radius sphere. Every creature inside saves Wisdom '
        + 'or is frightened. At the end of each frightened turn, a '
        + 'further Wisdom save or 4d10 psychic — success on that later '
        + 'save ends the spell for that creature.',
      dmPromptable: true
    }]
  })
})

export const WISH = spell({
  id: 'srd:spell.wish', name: 'Wish', level: 9, school: 'conjuration',
  rangeKind: 'self',
  components: { verbal: true, somatic: false },
  effects: effects({
    id: 'srd:spell.wish', name: 'Wish',
    // Explicitly open-ended in the SRD text itself — anything beyond its
    // defined menu is GM adjudication by design, not a modelling gap.
    completeness: 'partial',
    narrative: [{
      text: 'Duplicate any spell of 8th level or lower with no cost and no '
        + 'stress, or choose one of: create a nonmagical object worth up '
        + 'to 25,000 gp; restore up to twenty creatures to full hit points '
        + 'and end every greater restoration effect on them; grant up to '
        + 'ten creatures resistance to a damage type or 8-hour immunity to '
        + 'a spell; or force a reroll of any roll made in the last round, '
        + 'imposing advantage or disadvantage and choosing which result to '
        + 'keep. Anything beyond this list is GM adjudication. Any use '
        + 'other than duplicating a spell costs 1d10 necrotic per spell '
        + 'level cast until your next long rest, drops your Strength to 3 '
        + 'for 2d4 days, and carries a 33% chance you can never cast wish '
        + 'again.',
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Registration
// ===========================================================================

export const ALL_LEVEL9_SPELLS: SpellDefinition[] = [
  { ...METEOR_SWARM, lists: ['srd:list.sorcerer', 'srd:list.wizard'] },
  { ...FORESIGHT, lists: ['srd:list.bard', 'srd:list.druid', 'srd:list.warlock', 'srd:list.wizard'] },
  { ...POWER_WORD_KILL, lists: [
    'srd:list.bard', 'srd:list.sorcerer', 'srd:list.warlock', 'srd:list.wizard'
  ] },
  { ...ASTRAL_PROJECTION, lists: ['srd:list.cleric', 'srd:list.warlock', 'srd:list.wizard'] },
  { ...GATE, lists: ['srd:list.cleric', 'srd:list.sorcerer', 'srd:list.wizard'] },
  { ...IMPRISONMENT, lists: ['srd:list.warlock', 'srd:list.wizard'] },
  { ...MASS_HEAL, lists: ['srd:list.cleric'] },
  { ...PRISMATIC_WALL, lists: ['srd:list.wizard'] },
  { ...SHAPECHANGE, lists: ['srd:list.druid', 'srd:list.wizard'] },
  { ...STORM_OF_VENGEANCE, lists: ['srd:list.druid'] },
  { ...TIME_STOP, lists: ['srd:list.sorcerer', 'srd:list.wizard'] },
  { ...TRUE_POLYMORPH, lists: ['srd:list.bard', 'srd:list.warlock', 'srd:list.wizard'] },
  { ...TRUE_RESURRECTION, lists: ['srd:list.cleric', 'srd:list.druid'] },
  { ...WEIRD, lists: ['srd:list.wizard'] },
  { ...WISH, lists: ['srd:list.sorcerer', 'srd:list.wizard'] }
]
