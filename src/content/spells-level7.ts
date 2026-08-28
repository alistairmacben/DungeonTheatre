// 7th-level spells.
//
// Twenty of them — the full union of every class's 7th-level column
// (docs/srd/08-spell-lists.md). Ranger and paladin have had nothing since
// 5th; this batch adds nothing for them either.
//
// Arcane Sword is the first spell in the set to use `delivery: 'attack'`
// rather than 'save' — a summoned weapon making a melee spell attack at the
// caster's own bonus, the same shape a cantrip attack already resolves.
//
// Finger of Death and Regenerate are the second and third spells (after
// Disintegrate) to use DiceExpr's flat `modifier` for a fixed addend outside
// the caster's spellcasting modifier — 7d8+30 necrotic and 4d8+15 healing,
// both numbers fixed by the spell itself rather than derived from anything
// on the caster's sheet.
//
// Checked against docs/srd-source/spells.pdf via docs/srd/08b-spell-descriptions.md
// and docs/srd/08-spell-lists.md.

import type { EffectSource, SpellDefinition } from '../rules/types.js'

const V = '2014'

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

export const ARCANE_SWORD = spell({
  id: 'srd:spell.arcane-sword', name: 'Arcane Sword', level: 7, school: 'evocation',
  rangeFeet: 60, concentration: true, durationSeconds: 60,
  components: {
    verbal: true, somatic: true,
    material: 'a platinum sword worth at least 250 gp'
  },
  effect: {
    delivery: 'attack',
    damage: [{ dice: { count: 3, sides: 10 }, type: 'force' }]
  },
  effects: effects({
    id: 'srd:spell.arcane-sword', name: 'Arcane Sword',
    narrative: [{
      text: 'A spectral sword appears and attacks on your turn. Bonus '
        + 'action each turn to move it 20 feet and attack again.',
      dmPromptable: true
    }]
  })
})

export const FIRE_STORM = spell({
  id: 'srd:spell.fire-storm', name: 'Fire Storm', level: 7, school: 'evocation',
  rangeFeet: 150,
  effect: {
    delivery: 'save', save: { ability: 'dex', onSuccess: 'half' },
    damage: [{ dice: { count: 7, sides: 10 }, type: 'fire' }]
  },
  effects: effects({
    id: 'srd:spell.fire-storm', name: 'Fire Storm',
    narrative: [{
      text: 'Up to ten 10-foot cubes, freely arranged as long as each '
        + 'shares a face with another. Ignites unattended flammables; you '
        + 'may leave plant life unaffected.',
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Real damage with a rider the resolver can't carry
// ===========================================================================

export const FINGER_OF_DEATH = spell({
  id: 'srd:spell.finger-of-death', name: 'Finger of Death', level: 7, school: 'necromancy',
  rangeFeet: 60,
  effect: {
    delivery: 'save', save: { ability: 'con', onSuccess: 'half' },
    damage: [{ dice: { count: 7, sides: 8, modifier: 30 }, type: 'necrotic' }]
  },
  effects: effects({
    id: 'srd:spell.finger-of-death', name: 'Finger of Death',
    // The damage resolves correctly; the humanoid-killed-by-this rises as
    // your zombie is a target-facing rider outside the resolver's reach.
    completeness: 'partial',
    narrative: [{
      text: 'A humanoid killed by this damage rises at the start of your '
        + 'next turn as a zombie permanently under your command.',
      dmPromptable: true
    }]
  })
})

export const REGENERATE = spell({
  id: 'srd:spell.regenerate', name: 'Regenerate', level: 7, school: 'transmutation',
  castingTime: { minutes: 1 }, rangeKind: 'touch', durationSeconds: 3600,
  effect: {
    delivery: 'auto',
    healing: { dice: { count: 4, sides: 8, modifier: 15 } }
  },
  effects: effects({
    id: 'srd:spell.regenerate', name: 'Regenerate',
    // The immediate healing resolves correctly; the ongoing 1 HP per turn
    // for the full hour, and severed-limb regrowth, are outside what a
    // single resolved roll can carry.
    completeness: 'partial',
    narrative: [{
      text: 'After the immediate healing, the target also regains 1 hit '
        + 'point at the start of each of its turns for the full hour (10 '
        + 'per minute). Severed body parts regrow after 2 minutes, or '
        + 'reattach instantly if held to the stump.',
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Pure information and utility — nothing to compute, only to narrate
// ===========================================================================

export const MAGNIFICENT_MANSION = spell({
  id: 'srd:spell.magnificent-mansion', name: 'Magnificent Mansion', level: 7, school: 'conjuration',
  castingTime: { minutes: 1 }, rangeFeet: 300, durationSeconds: 86400,
  components: {
    verbal: true, somatic: true,
    material: 'three trinkets worth at least 5 gp each'
  },
  effects: effects({
    id: 'srd:spell.magnificent-mansion', name: 'Magnificent Mansion',
    narrative: [{
      text: 'An extradimensional dwelling with one shimmering entrance, '
        + 'invisible while closed. Up to fifty 10-foot cubes, furnished as '
        + 'you choose, with a banquet for a hundred and a hundred obedient '
        + "servants who can't attack, directly harm anyone, or leave.",
      dmPromptable: false
    }]
  })
})

export const PROJECT_IMAGE = spell({
  id: 'srd:spell.project-image', name: 'Project Image', level: 7, school: 'illusion',
  rangeKind: 'special', concentration: true, durationSeconds: 86400,
  components: {
    verbal: true, somatic: true,
    material: 'a replica of yourself worth at least 5 gp'
  },
  effects: effects({
    id: 'srd:spell.project-image', name: 'Project Image',
    narrative: [{
      text: 'An intangible illusory copy of you, up to 500 miles away, at '
        + 'any spot you have seen before. Any damage destroys it and ends '
        + 'the spell. Action to move it twice your speed and act through '
        + 'it; bonus action to switch which senses you use.',
      dmPromptable: false
    }]
  })
})

export const DIVINE_WORD = spell({
  id: 'srd:spell.divine-word', name: 'Divine Word', level: 7, school: 'evocation',
  castingTime: 'bonusAction', rangeFeet: 30,
  components: { verbal: true, somatic: false },
  effects: effects({
    id: 'srd:spell.divine-word', name: 'Divine Word',
    narrative: [{
      text: 'Any number of creatures that can hear you save Charisma. The '
        + "effect on a failure depends on the target's current hit points: "
        + '50 or fewer deafened a minute, 40 or fewer also blinded ten '
        + 'minutes, 30 or fewer also stunned an hour, 20 or fewer killed '
        + 'instantly. A failing celestial, elemental, fey or fiend is also '
        + 'forced to its home plane for 24 hours regardless of HP.',
      dmPromptable: true
    }]
  })
})

export const MIRAGE_ARCANE = spell({
  id: 'srd:spell.mirage-arcane', name: 'Mirage Arcane', level: 7, school: 'illusion',
  castingTime: { minutes: 10 }, rangeKind: 'sight', durationSeconds: 864000,
  effects: effects({
    id: 'srd:spell.mirage-arcane', name: 'Mirage Arcane',
    narrative: [{
      text: 'Terrain up to a mile square looks, sounds, smells and feels '
        + 'like other terrain, general shape unchanged. Structures may be '
        + 'altered or added; creatures are never disguised or added. '
        + 'Because it includes tactile elements it can genuinely create or '
        + 'remove difficult terrain.',
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Everything else — a target-facing save with no damage, a random table, a
// summon, a transformation or a binary state change this content set has no
// vocabulary for
// ===========================================================================

export const CONJURE_CELESTIAL = spell({
  id: 'srd:spell.conjure-celestial', name: 'Conjure Celestial', level: 7, school: 'conjuration',
  castingTime: { minutes: 1 }, rangeFeet: 90, concentration: true, durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.conjure-celestial', name: 'Conjure Celestial',
    completeness: 'partial',
    narrative: [{
      text: 'A celestial of CR 4 or lower appears and obeys commands that '
        + "don't violate its alignment. CR 5 if cast with a 9th-level slot.",
      dmPromptable: true
    }]
  })
})

export const DELAYED_BLAST_FIREBALL = spell({
  id: 'srd:spell.delayed-blast-fireball', name: 'Delayed Blast Fireball', level: 7, school: 'evocation',
  rangeFeet: 150, concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.delayed-blast-fireball', name: 'Delayed Blast Fireball',
    // The damage accumulates as state across turns rather than resolving
    // once at cast time — nothing here to preview until it detonates.
    completeness: 'partial',
    narrative: [{
      text: 'A lingering bead explodes in a 20-foot-radius sphere when the '
        + 'spell ends. Base 12d6 fire (Dexterity save for half), +1d6 for '
        + 'every one of your turns it goes undetonated, +1d6 more per slot '
        + 'above 7th. Touching it forces a Dexterity save: failure '
        + 'detonates it immediately.',
      dmPromptable: true
    }]
  })
})

export const ETHEREALNESS = spell({
  id: 'srd:spell.etherealness', name: 'Etherealness', level: 7, school: 'transmutation',
  rangeKind: 'self', durationSeconds: 28800,
  effects: effects({
    id: 'srd:spell.etherealness', name: 'Etherealness',
    completeness: 'partial',
    narrative: [{
      text: 'Step into the Border Ethereal for up to 8 hours, seeing the '
        + 'origin plane in grey out to 60 feet and interacting only with '
        + 'ethereal creatures. Returning into a solid object shunts you to '
        + 'the nearest free space and deals force damage equal to twice '
        + 'the distance moved.',
      dmPromptable: true
    }]
  })
})

export const FORCECAGE = spell({
  id: 'srd:spell.forcecage', name: 'Forcecage', level: 7, school: 'evocation',
  rangeFeet: 100, durationSeconds: 3600,
  components: {
    verbal: true, somatic: true,
    material: 'ruby dust worth at least 1,500 gp'
  },
  effects: effects({
    id: 'srd:spell.forcecage', name: 'Forcecage',
    completeness: 'partial',
    narrative: [{
      text: 'A cage of bars (up to 20 feet per side) or a solid, matter- '
        + 'and spell-blocking box (up to 10 feet per side). Creatures '
        + 'fully inside are trapped; escaping by teleport or planar travel '
        + 'needs a Charisma save, and failure wastes the attempt entirely. '
        + "Can't be dispelled by dispel magic.",
      dmPromptable: true
    }]
  })
})

export const PLANE_SHIFT = spell({
  id: 'srd:spell.plane-shift', name: 'Plane Shift', level: 7, school: 'conjuration',
  rangeKind: 'touch',
  components: {
    verbal: true, somatic: true,
    material: 'a forked metal rod worth at least 250 gp, attuned to a particular plane'
  },
  effects: effects({
    id: 'srd:spell.plane-shift', name: 'Plane Shift',
    completeness: 'partial',
    narrative: [{
      text: 'You and up to eight willing creatures linking hands travel to '
        + 'a named plane, arriving near it at the GM\'s discretion — or to '
        + 'a teleportation circle whose sigil you know. Offensively: melee '
        + 'spell attack; on a hit, a Charisma save or the target is '
        + 'banished to a random spot on a plane you name.',
      dmPromptable: true
    }]
  })
})

export const PRISMATIC_SPRAY = spell({
  id: 'srd:spell.prismatic-spray', name: 'Prismatic Spray', level: 7, school: 'evocation',
  rangeKind: 'self',
  effects: effects({
    id: 'srd:spell.prismatic-spray', name: 'Prismatic Spray',
    completeness: 'partial',
    narrative: [{
      text: 'A 60-foot cone. Every creature saves Dexterity, then roll a '
        + 'd8 per target for which colour ray strikes it: 1-5 are 10d6 '
        + 'damage of a different type each (fire, acid, lightning, poison, '
        + 'cold), half on success; 6 restrains then petrifies on a '
        + 'three-strike counter; 7 blinds then may banish to another '
        + 'plane; 8 means two rays, rerolling further 8s.',
      dmPromptable: true
    }]
  })
})

export const RESURRECTION = spell({
  id: 'srd:spell.resurrection', name: 'Resurrection', level: 7, school: 'necromancy',
  castingTime: { hours: 1 }, rangeKind: 'touch',
  components: {
    verbal: true, somatic: true,
    material: 'a diamond worth at least 1,000 gp, which the spell consumes',
    materialCostCp: 100000, consumed: true
  },
  effects: effects({
    id: 'srd:spell.resurrection', name: 'Resurrection',
    // A binary state change, the same gap Raise Dead and Revivify share.
    completeness: 'partial',
    narrative: [{
      text: 'A creature dead no longer than a century, not of old age, '
        + 'returns to life at full hit points with poisons and normal '
        + 'diseases cured and all missing body parts restored. The same '
        + '-4 ordeal penalty as Raise Dead applies, improving by 1 per '
        + 'long rest. If dead a year or more, you also cannot cast spells '
        + 'and have disadvantage on attacks, checks and saves until your '
        + 'next long rest.',
      dmPromptable: true
    }]
  })
})

export const REVERSE_GRAVITY = spell({
  id: 'srd:spell.reverse-gravity', name: 'Reverse Gravity', level: 7, school: 'transmutation',
  rangeFeet: 100, concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.reverse-gravity', name: 'Reverse Gravity',
    completeness: 'partial',
    narrative: [{
      text: 'A 50-foot-radius, 100-foot-high cylinder. Everything '
        + 'unanchored falls upward; a Dexterity save grabs a fixed object '
        + 'to avoid it. Anything reaching the top hangs there until the '
        + 'spell ends, then falls back down.',
      dmPromptable: true
    }]
  })
})

export const SEQUESTER = spell({
  id: 'srd:spell.sequester', name: 'Sequester', level: 7, school: 'transmutation',
  rangeKind: 'touch',
  components: {
    verbal: true, somatic: true,
    material: 'gem-dust powder worth at least 5,000 gp, which the spell consumes',
    materialCostCp: 500000, consumed: true
  },
  effects: effects({
    id: 'srd:spell.sequester', name: 'Sequester',
    completeness: 'partial',
    narrative: [{
      text: 'A willing creature or object becomes invisible and '
        + 'undetectable by divination or scrying. A creature falls into '
        + 'suspended animation, not aging, until a condition you set at '
        + 'casting occurs — or until it takes any damage.',
      dmPromptable: true
    }]
  })
})

export const SIMULACRUM = spell({
  id: 'srd:spell.simulacrum', name: 'Simulacrum', level: 7, school: 'illusion',
  castingTime: { hours: 12 }, rangeKind: 'touch',
  components: {
    verbal: true, somatic: true,
    material: 'snow or ice for a life-size copy, a piece of the creature\'s '
      + 'body, and powdered ruby worth at least 1,500 gp, all of which the spell consumes',
    materialCostCp: 150000, consumed: true
  },
  effects: effects({
    id: 'srd:spell.simulacrum', name: 'Simulacrum',
    completeness: 'partial',
    narrative: [{
      text: 'A real, actable duplicate of one beast or humanoid, at half '
        + 'its hit point maximum and with no equipment, otherwise '
        + "identical. Friendly and obedient; can't learn, level, or "
        + 'regain expended spell slots. Recasting destroys any active '
        + 'duplicate.',
      dmPromptable: true
    }]
  })
})

export const SYMBOL = spell({
  id: 'srd:spell.symbol', name: 'Symbol', level: 7, school: 'abjuration',
  castingTime: { minutes: 1 }, rangeKind: 'touch',
  components: {
    verbal: true, somatic: true,
    material: 'mercury, phosphorus, powdered diamond and opal worth at '
      + 'least 1,000 gp total, which the spell consumes',
    materialCostCp: 100000, consumed: true
  },
  effects: effects({
    id: 'srd:spell.symbol', name: 'Symbol',
    completeness: 'partial',
    narrative: [{
      text: 'An inscribed glyph, discovered with an Investigation check '
        + 'against your spell save DC, that fills a 60-foot sphere with '
        + 'dim light and one chosen effect when triggered: Death (10d10 '
        + 'necrotic, Constitution save for half), Discord, Fear, '
        + 'Hopelessness, Insanity, Pain, Sleep, or Stunning, each its own '
        + 'save and duration.',
      dmPromptable: true
    }]
  })
})

export const TELEPORT = spell({
  id: 'srd:spell.teleport', name: 'Teleport', level: 7, school: 'conjuration',
  rangeFeet: 10,
  components: { verbal: true, somatic: false },
  effects: effects({
    id: 'srd:spell.teleport', name: 'Teleport',
    completeness: 'partial',
    narrative: [{
      text: 'You and up to eight willing creatures, or one object, to a '
        + 'destination known to you on the same plane. The GM rolls d100 '
        + 'against your familiarity with the destination to determine '
        + 'on-target arrival, an off-target arrival, a similar area, or a '
        + 'mishap.',
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Registration
// ===========================================================================

export const ALL_LEVEL7_SPELLS: SpellDefinition[] = [
  { ...ARCANE_SWORD, lists: ['srd:list.bard', 'srd:list.wizard'] },
  { ...FIRE_STORM, lists: ['srd:list.cleric', 'srd:list.druid', 'srd:list.sorcerer'] },
  { ...FINGER_OF_DEATH, lists: ['srd:list.sorcerer', 'srd:list.warlock', 'srd:list.wizard'] },
  { ...REGENERATE, lists: ['srd:list.bard', 'srd:list.cleric', 'srd:list.druid'] },
  { ...MAGNIFICENT_MANSION, lists: ['srd:list.bard', 'srd:list.wizard'] },
  { ...PROJECT_IMAGE, lists: ['srd:list.bard', 'srd:list.wizard'] },
  { ...DIVINE_WORD, lists: ['srd:list.cleric'] },
  { ...MIRAGE_ARCANE, lists: ['srd:list.bard', 'srd:list.druid', 'srd:list.wizard'] },
  { ...CONJURE_CELESTIAL, lists: ['srd:list.cleric'] },
  { ...DELAYED_BLAST_FIREBALL, lists: ['srd:list.sorcerer', 'srd:list.wizard'] },
  { ...ETHEREALNESS, lists: [
    'srd:list.bard', 'srd:list.cleric', 'srd:list.sorcerer', 'srd:list.warlock', 'srd:list.wizard'
  ] },
  { ...FORCECAGE, lists: ['srd:list.bard', 'srd:list.warlock', 'srd:list.wizard'] },
  { ...PLANE_SHIFT, lists: [
    'srd:list.cleric', 'srd:list.druid', 'srd:list.sorcerer', 'srd:list.warlock', 'srd:list.wizard'
  ] },
  { ...PRISMATIC_SPRAY, lists: ['srd:list.sorcerer', 'srd:list.wizard'] },
  { ...RESURRECTION, lists: ['srd:list.bard', 'srd:list.cleric'] },
  { ...REVERSE_GRAVITY, lists: ['srd:list.druid', 'srd:list.sorcerer', 'srd:list.wizard'] },
  { ...SEQUESTER, lists: ['srd:list.wizard'] },
  { ...SIMULACRUM, lists: ['srd:list.wizard'] },
  { ...SYMBOL, lists: ['srd:list.bard', 'srd:list.cleric', 'srd:list.wizard'] },
  { ...TELEPORT, lists: ['srd:list.bard', 'srd:list.sorcerer', 'srd:list.wizard'] }
]
