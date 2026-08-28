// 6th-level spells.
//
// Thirty-one of them — the full union of every class's 6th-level column
// (docs/srd/08-spell-lists.md). This is the first level with no ranger or
// paladin entries at all: both half-casters cap at 5th.
//
// Irresistible Dance is the first target-facing spell in the set to get real
// modifiers rather than pure narrative — its three clauses (disadvantage on
// the target's Dexterity saves, disadvantage on its attack rolls, advantage
// for everyone attacking it) are exactly Haste's and Blur's vocabulary, just
// aimed at whichever creature the DM applies the effect instance to rather
// than the caster. It stays partial anyway: the fourth clause, forced
// movement that wastes the target's turn, has no mechanism here, the same
// gap Haste's own extra action leaves behind.
//
// Sunbeam, Harm and the two walls are real save+damage spells with a rider
// the resolver can't carry — a blindness condition, a max-HP reduction, a
// second triggered damage type — so they keep their effect block (the
// numbers are right) but stay partial for what rides along with them.
//
// Checked against docs/srd-source/spells.pdf via docs/srd/08b-spell-descriptions.md
// and docs/srd/08-spell-lists.md.

import type { EffectSource, SpellDefinition } from '../rules/types.js'

const V = '2014'
let n = 0
const id = () => `s6${++n}`

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

export const BLADE_BARRIER = spell({
  id: 'srd:spell.blade-barrier', name: 'Blade Barrier', level: 6, school: 'evocation',
  rangeFeet: 90, concentration: true, durationSeconds: 600,
  effect: {
    delivery: 'save', save: { ability: 'dex', onSuccess: 'half' },
    damage: [{ dice: { count: 6, sides: 10 }, type: 'slashing' }]
  },
  effects: effects({
    id: 'srd:spell.blade-barrier', name: 'Blade Barrier',
    narrative: [{
      text: 'A wall or ring of whirling blades up to 100 feet long, 20 feet '
        + 'high and 5 feet thick. Provides three-quarters cover, and its '
        + 'space is difficult terrain. This damage triggers on entering it '
        + 'first time on a turn or starting there.',
      dmPromptable: true
    }]
  })
})

export const CIRCLE_OF_DEATH = spell({
  id: 'srd:spell.circle-of-death', name: 'Circle of Death', level: 6, school: 'necromancy',
  rangeFeet: 150,
  components: {
    verbal: true, somatic: true,
    material: 'a crushed black pearl worth at least 500 gp'
  },
  effect: {
    delivery: 'save', save: { ability: 'con', onSuccess: 'half' },
    damage: [{ dice: { count: 8, sides: 6 }, type: 'necrotic' }],
    perSlotAbove: { damageDice: { count: 2, sides: 6 } }
  },
  effects: effects({
    id: 'srd:spell.circle-of-death', name: 'Circle of Death',
    narrative: [{ text: 'A 60-foot-radius sphere of negative energy.', dmPromptable: true }]
  })
})

export const DISINTEGRATE = spell({
  id: 'srd:spell.disintegrate', name: 'Disintegrate', level: 6, school: 'transmutation',
  rangeFeet: 60,
  effect: {
    delivery: 'save', save: { ability: 'dex', onSuccess: 'none' },
    damage: [{ dice: { count: 10, sides: 6, modifier: 40 }, type: 'force' }],
    perSlotAbove: { damageDice: { count: 3, sides: 6 } }
  },
  effects: effects({
    id: 'srd:spell.disintegrate', name: 'Disintegrate',
    narrative: [{
      text: 'A creature, object, or creation of magical force. A target '
        + 'reduced to 0 hit points is disintegrated — it and everything it '
        + 'wears and carries except magic items become dust, restorable '
        + 'only by true resurrection or wish. Automatically disintegrates a '
        + 'Large or smaller nonmagical object.',
      dmPromptable: true
    }]
  })
})

export const FREEZING_SPHERE = spell({
  id: 'srd:spell.freezing-sphere', name: 'Freezing Sphere', level: 6, school: 'evocation',
  rangeFeet: 300,
  effect: {
    delivery: 'save', save: { ability: 'con', onSuccess: 'half' },
    damage: [{ dice: { count: 10, sides: 6 }, type: 'cold' }],
    perSlotAbove: { damageDice: { count: 1, sides: 6 } }
  },
  effects: effects({
    id: 'srd:spell.freezing-sphere', name: 'Freezing Sphere',
    narrative: [{
      text: 'A 60-foot-radius sphere. Striking water freezes a 30-foot '
        + 'square 6 inches deep for a minute, trapping surface swimmers. '
        + 'You may instead hold the frozen globe and throw or place it '
        + 'later, detonating for the same effect on impact or after a '
        + 'minute — a genuine handoff item, not something this content set '
        + 'tracks as inventory.',
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Real damage with a rider the resolver can't carry
// ===========================================================================

export const HARM = spell({
  id: 'srd:spell.harm', name: 'Harm', level: 6, school: 'necromancy',
  rangeFeet: 60,
  effect: {
    delivery: 'save', save: { ability: 'con', onSuccess: 'half' },
    damage: [{ dice: { count: 14, sides: 6 }, type: 'necrotic' }]
  },
  effects: effects({
    id: 'srd:spell.harm', name: 'Harm',
    // The damage resolves correctly; the "can't drop below 1 HP" floor and
    // the hour-long hit point maximum reduction on a failed save are both
    // outside the resolver's damage/save vocabulary.
    completeness: 'partial',
    narrative: [{
      text: "Can't reduce the target below 1 hit point. On a failed save, "
        + "the target's hit point maximum is also reduced by the damage "
        + 'taken, for 1 hour.',
      dmPromptable: true
    }]
  })
})

export const SUNBEAM = spell({
  id: 'srd:spell.sunbeam', name: 'Sunbeam', level: 6, school: 'evocation',
  rangeKind: 'self', concentration: true, durationSeconds: 60,
  effect: {
    delivery: 'save', save: { ability: 'con', onSuccess: 'half' },
    damage: [{ dice: { count: 6, sides: 8 }, type: 'radiant' }]
  },
  effects: effects({
    id: 'srd:spell.sunbeam', name: 'Sunbeam',
    completeness: 'partial',
    narrative: [{
      text: 'A 5-foot-wide, 60-foot line. On a failed save the target is '
        + 'also blinded until your next turn; undead and oozes have '
        + 'disadvantage on this save. You may fire a new line as an action '
        + 'on any later turn. A mote in your hand sheds true sunlight.',
      dmPromptable: true
    }]
  })
})

export const WALL_OF_ICE = spell({
  id: 'srd:spell.wall-of-ice', name: 'Wall of Ice', level: 6, school: 'evocation',
  rangeFeet: 120, concentration: true, durationSeconds: 600,
  effect: {
    delivery: 'save', save: { ability: 'dex', onSuccess: 'half' },
    damage: [{ dice: { count: 10, sides: 6 }, type: 'cold' }],
    perSlotAbove: { damageDice: { count: 2, sides: 6 } }
  },
  effects: effects({
    id: 'srd:spell.wall-of-ice', name: 'Wall of Ice',
    // This is the damage on appearing. Destroying a section leaves a sheet
    // of frigid air that deals a second, separately-scaling 5d6 cold to
    // anyone moving through it — a second triggered effect this resolver
    // has no slot for. The wall's own AC and HP aren't tracked either.
    completeness: 'partial',
    narrative: [{
      text: 'A hemisphere, sphere or up to ten contiguous 10-foot panels, 1 '
        + 'foot thick, pushing creatures in its path aside. The wall is an '
        + 'object: AC 12, 30 HP per 10-foot section, vulnerable to fire. A '
        + 'destroyed section leaves a sheet of frigid air — moving through '
        + 'it deals a separate 5d6 cold (Constitution save for half), +1d6 '
        + 'per slot above 6th.',
      dmPromptable: true
    }]
  })
})

export const WALL_OF_THORNS = spell({
  id: 'srd:spell.wall-of-thorns', name: 'Wall of Thorns', level: 6, school: 'conjuration',
  rangeFeet: 120, concentration: true, durationSeconds: 600,
  effect: {
    delivery: 'save', save: { ability: 'dex', onSuccess: 'half' },
    damage: [{ dice: { count: 7, sides: 8 }, type: 'piercing' }],
    perSlotAbove: { damageDice: { count: 1, sides: 8 } }
  },
  effects: effects({
    id: 'srd:spell.wall-of-thorns', name: 'Wall of Thorns',
    // This is the damage on appearing. Moving through it afterwards costs 4
    // feet per foot and deals a second, separately-scaling 7d8 slashing —
    // a second triggered effect this resolver has no slot for.
    completeness: 'partial',
    narrative: [{
      text: 'A 60-by-10-by-5-foot wall, or a 20-foot circle up to 20 feet '
        + 'high and 5 feet thick, blocking line of sight. Moving through it '
        + 'afterwards costs 4 feet per foot and deals a separate 7d8 '
        + 'slashing (Dexterity save for half) on first entering it on a '
        + 'turn or ending a turn there, +1d8 per slot above 6th.',
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Chain Lightning — the same roll applies to more than one target
// ===========================================================================

export const CHAIN_LIGHTNING = spell({
  id: 'srd:spell.chain-lightning', name: 'Chain Lightning', level: 6, school: 'evocation',
  rangeFeet: 150,
  effect: {
    delivery: 'save', save: { ability: 'dex', onSuccess: 'half' },
    damage: [{ dice: { count: 10, sides: 8 }, type: 'lightning' }]
  },
  effects: effects({
    id: 'srd:spell.chain-lightning', name: 'Chain Lightning',
    // Up to four targets total, each rolling this same save independently —
    // the same party-wide reach Mass Cure Wounds is behind, just aimed at
    // enemies. The extra-bolt upcast (+1 target per slot above 6th) has no
    // vocabulary here either, since it grows the target count, not the dice.
    completeness: 'partial',
    narrative: [{
      text: 'One target, then three bolts leap to up to three more targets '
        + 'within 30 feet of the first — each target hit by only one bolt. '
        + 'The number resolved here is one bolt\'s — apply it to each '
        + 'target hit. One additional bolt per slot above 6th.',
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Irresistible Dance — real roll modifiers on a target, not the caster
// ===========================================================================

export const IRRESISTIBLE_DANCE = spell({
  id: 'srd:spell.irresistible-dance', name: 'Irresistible Dance', level: 6, school: 'enchantment',
  rangeFeet: 30, concentration: true, durationSeconds: 60,
  components: { verbal: true, somatic: false },
  effects: effects({
    id: 'srd:spell.irresistible-dance', name: 'Irresistible Dance',
    // Three of the four clauses are ordinary modifiers, aimed at the target
    // rather than the caster — apply this effect instance to the target's
    // own sheet. The forced movement each turn, which wastes its action
    // economy, is the one clause with no mechanism here, the same gap
    // Haste's extra action leaves on the other side of the ledger.
    completeness: 'partial',
    modifiers: [
      {
        id: id(), channel: 'roll', rollOp: 'disadvantage',
        scope: { kinds: ['save'], abilities: ['dex'] },
        permanence: 'temporary', note: 'irresistible-dance'
      },
      {
        id: id(), channel: 'roll', rollOp: 'disadvantage', scope: { kinds: ['attack'] },
        permanence: 'temporary', note: 'irresistible-dance'
      },
      {
        id: id(), channel: 'roll', rollOp: 'advantage', scope: { kinds: ['attack'] },
        appliesTo: 'attackersAgainstSelf', permanence: 'temporary', note: 'irresistible-dance'
      }
    ],
    narrative: [{
      text: 'No save on the initial casting. Creatures that can\'t be '
        + 'charmed are immune. The target uses all its movement to dance in '
        + 'place each turn, and may use its action to make a Wisdom save to '
        + 'end the effect.',
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Pure information and utility — nothing to compute, only to narrate
// ===========================================================================

export const FIND_THE_PATH = spell({
  id: 'srd:spell.find-the-path', name: 'Find the Path', level: 6, school: 'divination',
  castingTime: { minutes: 1 }, rangeKind: 'self', concentration: true, durationSeconds: 86400,
  components: {
    verbal: true, somatic: true,
    material: 'a set of divinatory tools worth at least 100 gp and an object from the destination'
  },
  effects: effects({
    id: 'srd:spell.find-the-path', name: 'Find the Path',
    narrative: [{
      text: 'The shortest physical route to a specific fixed location you '
        + 'are familiar with, on the same plane. Fails for another plane, a '
        + 'moving destination, or a non-specific one. You know its distance '
        + 'and direction, and automatically pick the shortest path at every '
        + 'choice — not necessarily the safest.',
      dmPromptable: true
    }]
  })
})

export const TRANSPORT_VIA_PLANTS = spell({
  id: 'srd:spell.transport-via-plants', name: 'Transport via Plants', level: 6, school: 'conjuration',
  rangeFeet: 10, durationSeconds: 6,
  effects: effects({
    id: 'srd:spell.transport-via-plants', name: 'Transport via Plants',
    narrative: [{
      text: 'Links a Large or larger inanimate plant in range to another '
        + 'plant on the same plane that you have seen or touched. Any '
        + 'creature can step through using 5 feet of movement.',
      dmPromptable: false
    }]
  })
})

export const TRUE_SEEING = spell({
  id: 'srd:spell.true-seeing', name: 'True Seeing', level: 6, school: 'divination',
  rangeKind: 'touch', durationSeconds: 3600,
  components: {
    verbal: true, somatic: true,
    material: 'an ointment for the eyes worth at least 25 gp, which the spell consumes',
    materialCostCp: 2500, consumed: true
  },
  effects: effects({
    id: 'srd:spell.true-seeing', name: 'True Seeing',
    narrative: [{
      text: 'A willing creature you touch gains truesight to 120 feet, '
        + 'notices magically hidden secret doors, and sees into the '
        + 'Ethereal Plane, all for an hour.',
      dmPromptable: false
    }]
  })
})

export const WORD_OF_RECALL = spell({
  id: 'srd:spell.word-of-recall', name: 'Word of Recall', level: 6, school: 'conjuration',
  rangeFeet: 5,
  components: { verbal: true, somatic: false },
  effects: effects({
    id: 'srd:spell.word-of-recall', name: 'Word of Recall',
    narrative: [{
      text: 'You and up to five willing creatures within 5 feet teleport '
        + 'to a previously designated sanctuary strongly linked to your '
        + "deity. No effect without one prepared in advance.",
      dmPromptable: false
    }]
  })
})

export const INSTANT_SUMMONS = spell({
  id: 'srd:spell.instant-summons', name: 'Instant Summons', level: 6, school: 'conjuration',
  ritual: true, castingTime: { minutes: 1 }, rangeKind: 'touch',
  components: {
    verbal: true, somatic: true,
    material: 'a sapphire worth at least 1,000 gp, a different one each casting'
  },
  effects: effects({
    id: 'srd:spell.instant-summons', name: 'Instant Summons',
    narrative: [{
      text: 'Mark an object of 10 lb or less and 6 feet or less in its '
        + 'longest dimension. Later, spend your action and crush the '
        + 'sapphire to summon it into your hand across any distance or '
        + "plane. If another creature holds it, it doesn't come — you "
        + 'instead learn who has it and roughly where.',
      dmPromptable: false
    }]
  })
})

export const GLOBE_OF_INVULNERABILITY = spell({
  id: 'srd:spell.globe-of-invulnerability', name: 'Globe of Invulnerability', level: 6, school: 'abjuration',
  rangeKind: 'self', concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.globe-of-invulnerability', name: 'Globe of Invulnerability',
    narrative: [{
      text: 'A 10-foot-radius sphere around you. Any spell of 5th level or '
        + 'lower cast from outside it cannot affect anything inside — the '
        + "comparison is against the spell's own level, not the slot used "
        + 'to cast it. Blocks one level higher per slot above 6th.',
      dmPromptable: false
    }]
  })
})

export const MOVE_EARTH = spell({
  id: 'srd:spell.move-earth', name: 'Move Earth', level: 6, school: 'transmutation',
  rangeFeet: 120, concentration: true, durationSeconds: 7200,
  effects: effects({
    id: 'srd:spell.move-earth', name: 'Move Earth',
    narrative: [{
      text: 'Reshape dirt, sand or clay in an area up to 40 feet on a side, '
        + 'by at most half that dimension — raise or lower elevation, dig a '
        + 'trench, raise a wall. Takes 10 minutes per change, and you may '
        + "pick a new area every 10 minutes. Can't manipulate worked "
        + 'stonework, and it moves too slowly to trap or injure anyone.',
      dmPromptable: true
    }]
  })
})

export const PROGRAMMED_ILLUSION = spell({
  id: 'srd:spell.programmed-illusion', name: 'Programmed Illusion', level: 6, school: 'illusion',
  rangeFeet: 120,
  components: {
    verbal: true, somatic: true,
    material: 'a bit of fleece and jade dust worth at least 25 gp'
  },
  effects: effects({
    id: 'srd:spell.programmed-illusion', name: 'Programmed Illusion',
    narrative: [{
      text: 'An imperceptible illusion up to a 30-foot cube plays a '
        + 'scripted performance of up to 5 minutes, triggered by a visual '
        + 'or audible condition you set within 30 feet, then goes dormant '
        + 'for 10 minutes before it can fire again. An Investigation check '
        + 'against your spell save DC reveals it as illusory.',
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Everything else — a target-facing save, condition, summon, transformation
// or negotiation this content set has no vocabulary for
// ===========================================================================

export const CONJURE_FEY = spell({
  id: 'srd:spell.conjure-fey', name: 'Conjure Fey', level: 6, school: 'conjuration',
  castingTime: { minutes: 1 }, rangeFeet: 90, concentration: true, durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.conjure-fey', name: 'Conjure Fey',
    completeness: 'partial',
    narrative: [{
      text: 'A fey creature of CR 6 or lower (or a fey spirit in beast '
        + 'form) appears and obeys your commands. If your concentration '
        + 'breaks it does not vanish — it turns hostile and cannot be '
        + 'dismissed, disappearing 1 hour later regardless. +1 CR per slot '
        + 'above 6th.',
      dmPromptable: true
    }]
  })
})

export const CREATE_UNDEAD = spell({
  id: 'srd:spell.create-undead', name: 'Create Undead', level: 6, school: 'necromancy',
  castingTime: { minutes: 1 }, rangeFeet: 10,
  components: {
    verbal: true, somatic: true,
    material: 'grave dirt, brackish water, and a black onyx stone worth at '
      + 'least 150 gp per corpse, all of which the spell consumes',
    materialCostCp: 15000, consumed: true
  },
  effects: effects({
    id: 'srd:spell.create-undead', name: 'Create Undead',
    completeness: 'partial',
    narrative: [{
      text: 'Castable only at night. Up to three Medium or Small humanoid '
        + 'corpses become ghouls under your command for 24 hours, '
        + 'reasserted by recasting. More and stronger undead at higher '
        + 'slots.',
      dmPromptable: true
    }]
  })
})

export const CONTINGENCY = spell({
  id: 'srd:spell.contingency', name: 'Contingency', level: 6, school: 'evocation',
  castingTime: { minutes: 10 }, rangeKind: 'self', durationSeconds: 864000,
  components: {
    verbal: true, somatic: true,
    material: 'a statuette of yourself worth at least 1,500 gp'
  },
  effects: effects({
    id: 'srd:spell.contingency', name: 'Contingency',
    completeness: 'partial',
    narrative: [{
      text: 'Store a spell of 5th level or lower, with a casting time of 1 '
        + 'action, that can target you — both slots are spent now. It '
        + 'fires automatically the first time your described circumstance '
        + 'occurs, whether you want it to or not, and only on you. Only '
        + 'one contingency at a time.',
      dmPromptable: true
    }]
  })
})

export const EYEBITE = spell({
  id: 'srd:spell.eyebite', name: 'Eyebite', level: 6, school: 'necromancy',
  rangeKind: 'self', concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.eyebite', name: 'Eyebite',
    completeness: 'partial',
    narrative: [{
      text: 'One creature within 60 feet makes a Wisdom save or is, your '
        + 'choice: Asleep (unconscious until damaged or shaken awake), '
        + 'Panicked (frightened of you, must Dash away each turn), or '
        + 'Sickened (disadvantage on attacks and checks, Wisdom save each '
        + 'turn to end). You may target a new creature each turn, never one '
        + 'that already saved against this casting.',
      dmPromptable: true
    }]
  })
})

export const FLESH_TO_STONE = spell({
  id: 'srd:spell.flesh-to-stone', name: 'Flesh to Stone', level: 6, school: 'transmutation',
  rangeFeet: 60, concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.flesh-to-stone', name: 'Flesh to Stone',
    completeness: 'partial',
    narrative: [{
      text: 'A flesh-bodied creature saves Constitution or is restrained. '
        + 'It repeats the save at the end of each of its turns: three '
        + 'successes end the spell, three failures petrify it for the '
        + 'duration (non-consecutive; track both). Concentrating for the '
        + 'full duration makes the petrification permanent.',
      dmPromptable: true
    }]
  })
})

export const FORBIDDANCE = spell({
  id: 'srd:spell.forbiddance', name: 'Forbiddance', level: 6, school: 'abjuration',
  ritual: true, castingTime: { minutes: 10 }, rangeKind: 'touch', durationSeconds: 86400,
  components: {
    verbal: true, somatic: true,
    material: 'holy water, rare incense, and powdered ruby worth at least 1,000 gp'
  },
  effects: effects({
    id: 'srd:spell.forbiddance', name: 'Forbiddance',
    completeness: 'partial',
    narrative: [{
      text: 'Wards up to 40,000 square feet of floor against teleportation '
        + 'and planar travel. Choose one or more of celestials, elementals, '
        + 'fey, fiends and undead: they take 5d10 radiant or necrotic (your '
        + 'choice at cast time) on entering first time on a turn or '
        + 'starting there. A password exempts a speaker from the damage.',
      dmPromptable: true
    }]
  })
})

export const GUARDS_AND_WARDS = spell({
  id: 'srd:spell.guards-and-wards', name: 'Guards and Wards', level: 6, school: 'abjuration',
  castingTime: { minutes: 10 }, rangeKind: 'touch', durationSeconds: 86400,
  components: {
    verbal: true, somatic: true,
    material: 'various minor items and a silver rod worth at least 10 gp'
  },
  effects: effects({
    id: 'srd:spell.guards-and-wards', name: 'Guards and Wards',
    completeness: 'partial',
    narrative: [{
      text: 'Wards 2,500 square feet of floor, up to 20 feet tall, with a '
        + 'menu of effects across corridors, doors and stairs (obscuring '
        + 'fog, arcane-locked doors, webbed stairs) plus one bound spell '
        + 'effect from a fixed list. Designate exempt individuals and a '
        + 'password. Cast daily for a year to make it permanent.',
      dmPromptable: true
    }]
  })
})

export const HEAL = spell({
  id: 'srd:spell.heal', name: 'Heal', level: 6, school: 'evocation',
  rangeFeet: 60,
  effects: effects({
    id: 'srd:spell.heal', name: 'Heal',
    // A flat 70 hit points, not a die roll — the same gap Guardian of
    // Faith's flat damage leaves on the other side of the ledger.
    completeness: 'partial',
    narrative: [{
      text: 'The target regains 70 hit points and is cured of blindness, '
        + 'deafness and any disease. No effect on constructs or undead. '
        + '+10 per slot above 6th.',
      dmPromptable: true
    }]
  })
})

export const HEROES_FEAST = spell({
  id: 'srd:spell.heroes-feast', name: "Heroes' Feast", level: 6, school: 'conjuration',
  castingTime: { minutes: 10 }, rangeFeet: 30,
  components: {
    verbal: true, somatic: true,
    material: 'a gem-encrusted bowl worth at least 1,000 gp, which the spell consumes',
    materialCostCp: 100000, consumed: true
  },
  effects: effects({
    id: 'srd:spell.heroes-feast', name: "Heroes' Feast",
    completeness: 'partial',
    narrative: [{
      text: 'A feast that takes an hour to eat, benefits beginning only '
        + 'once it is finished. Up to twelve other creatures each: cured of '
        + 'disease and poison, immune to poison and fright, advantage on '
        + 'Wisdom saves, and hit point maximum +2d10 (with the same number '
        + 'of hit points gained), all lasting 24 hours.',
      dmPromptable: true
    }]
  })
})

export const MAGIC_JAR = spell({
  id: 'srd:spell.magic-jar', name: 'Magic Jar', level: 6, school: 'necromancy',
  castingTime: { minutes: 1 }, rangeKind: 'self',
  components: {
    verbal: true, somatic: true,
    material: 'an ornamental container worth at least 500 gp'
  },
  effects: effects({
    id: 'srd:spell.magic-jar', name: 'Magic Jar',
    completeness: 'partial',
    narrative: [{
      text: 'Your body falls catatonic and your soul enters the container. '
        + 'Your only action is to project up to 100 feet, either home '
        + '(ending the spell) or into a humanoid (Charisma save; success '
        + 'grants it 24-hour immunity). While possessing: their statistics, '
        + 'your alignment and mental scores, your class features. If the '
        + "host dies, so do you unless you save to return to the "
        + 'container.',
      dmPromptable: true
    }]
  })
})

export const MASS_SUGGESTION = spell({
  id: 'srd:spell.mass-suggestion', name: 'Mass Suggestion', level: 6, school: 'enchantment',
  rangeFeet: 60, durationSeconds: 86400,
  components: { verbal: true, somatic: false },
  effects: effects({
    id: 'srd:spell.mass-suggestion', name: 'Mass Suggestion',
    completeness: 'partial',
    narrative: [{
      text: 'Up to twelve creatures that can hear and understand you save '
        + 'Wisdom or pursue a one-or-two-sentence course of action you '
        + 'suggest, which must sound reasonable — an obviously harmful '
        + 'command negates the spell entirely. Immune if they can\'t be '
        + 'charmed. Damage from you or your allies ends it for that '
        + 'creature.',
      dmPromptable: true
    }]
  })
})

export const PLANAR_ALLY = spell({
  id: 'srd:spell.planar-ally', name: 'Planar Ally', level: 6, school: 'conjuration',
  castingTime: { minutes: 10 }, rangeFeet: 60,
  effects: effects({
    id: 'srd:spell.planar-ally', name: 'Planar Ally',
    // Explicitly a negotiation in the SRD text, not a mechanic — the
    // engine can track the gold, not the bargain.
    completeness: 'partial',
    narrative: [{
      text: 'Beseech a known cosmic entity for a celestial, elemental or '
        + 'fiend ally. It is under no compulsion — you must bargain and be '
        + 'able to communicate. Rule of thumb: 100 gp per minute of aid, up '
        + 'to 10,000 gp per day, halved or waived for tasks matching its '
        + 'ethos. Failure to agree terms sends it home immediately.',
      dmPromptable: true
    }]
  })
})

export const WIND_WALK = spell({
  id: 'srd:spell.wind-walk', name: 'Wind Walk', level: 6, school: 'transmutation',
  castingTime: { minutes: 1 }, rangeFeet: 30, durationSeconds: 28800,
  effects: effects({
    id: 'srd:spell.wind-walk', name: 'Wind Walk',
    completeness: 'partial',
    narrative: [{
      text: 'You and up to ten willing creatures become clouds: flying '
        + 'speed 300 feet and resistance to nonmagical weapon damage, able '
        + 'only to Dash or revert. Reverting takes a minute, during which '
        + 'you are incapacitated and immobile.',
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Registration
// ===========================================================================

export const ALL_LEVEL6_SPELLS: SpellDefinition[] = [
  { ...BLADE_BARRIER, lists: ['srd:list.cleric'] },
  { ...CIRCLE_OF_DEATH, lists: ['srd:list.sorcerer', 'srd:list.warlock', 'srd:list.wizard'] },
  { ...DISINTEGRATE, lists: ['srd:list.sorcerer', 'srd:list.wizard'] },
  { ...FREEZING_SPHERE, lists: ['srd:list.wizard'] },
  { ...HARM, lists: ['srd:list.cleric'] },
  { ...SUNBEAM, lists: ['srd:list.druid', 'srd:list.sorcerer', 'srd:list.wizard'] },
  { ...WALL_OF_ICE, lists: ['srd:list.wizard'] },
  { ...WALL_OF_THORNS, lists: ['srd:list.druid'] },
  { ...CHAIN_LIGHTNING, lists: ['srd:list.sorcerer', 'srd:list.wizard'] },
  { ...IRRESISTIBLE_DANCE, lists: ['srd:list.bard', 'srd:list.wizard'] },
  { ...FIND_THE_PATH, lists: ['srd:list.bard', 'srd:list.cleric', 'srd:list.druid'] },
  { ...TRANSPORT_VIA_PLANTS, lists: ['srd:list.druid'] },
  { ...TRUE_SEEING, lists: [
    'srd:list.bard', 'srd:list.cleric', 'srd:list.sorcerer', 'srd:list.warlock', 'srd:list.wizard'
  ] },
  { ...WORD_OF_RECALL, lists: ['srd:list.cleric'] },
  { ...INSTANT_SUMMONS, lists: ['srd:list.wizard'] },
  { ...GLOBE_OF_INVULNERABILITY, lists: ['srd:list.sorcerer', 'srd:list.wizard'] },
  { ...MOVE_EARTH, lists: ['srd:list.druid', 'srd:list.sorcerer', 'srd:list.wizard'] },
  { ...PROGRAMMED_ILLUSION, lists: ['srd:list.bard', 'srd:list.wizard'] },
  { ...CONJURE_FEY, lists: ['srd:list.druid', 'srd:list.warlock'] },
  { ...CREATE_UNDEAD, lists: ['srd:list.cleric', 'srd:list.warlock', 'srd:list.wizard'] },
  { ...CONTINGENCY, lists: ['srd:list.wizard'] },
  { ...EYEBITE, lists: [
    'srd:list.bard', 'srd:list.sorcerer', 'srd:list.warlock', 'srd:list.wizard'
  ] },
  { ...FLESH_TO_STONE, lists: ['srd:list.warlock', 'srd:list.wizard'] },
  { ...FORBIDDANCE, lists: ['srd:list.cleric'] },
  { ...GUARDS_AND_WARDS, lists: ['srd:list.bard', 'srd:list.wizard'] },
  { ...HEAL, lists: ['srd:list.cleric', 'srd:list.druid'] },
  { ...HEROES_FEAST, lists: ['srd:list.cleric', 'srd:list.druid'] },
  { ...MAGIC_JAR, lists: ['srd:list.wizard'] },
  { ...MASS_SUGGESTION, lists: [
    'srd:list.bard', 'srd:list.sorcerer', 'srd:list.warlock', 'srd:list.wizard'
  ] },
  { ...PLANAR_ALLY, lists: ['srd:list.cleric'] },
  { ...WIND_WALK, lists: ['srd:list.druid'] }
]
