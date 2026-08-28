// 8th-level spells.
//
// Sixteen of them — the full union of every class's 8th-level column
// (docs/srd/08-spell-lists.md). Nothing for ranger or paladin, same as the
// last two levels.
//
// Animal Shapes is the one spell in the whole SRD spell list explicitly
// flagged inert by the source material itself: it turns willing creatures
// into beast statblocks, and this content set was told from the start to
// exclude monsters and beasts entirely. There is nothing to author.
//
// Mind Blank and Holy Aura are the first spells since Stoneskin to reach for
// RESISTANCE_IMMUNE rather than RESISTANT — a real, correct modifier for the
// one clause each spell states as absolute (psychic immunity; advantage on
// every save), with the rest of what each spell does left for the DM.
//
// Checked against docs/srd-source/spells.pdf via docs/srd/08b-spell-descriptions.md
// and docs/srd/08-spell-lists.md.

import type { EffectSource, SpellDefinition } from '../rules/types.js'
import { resistancePath, RESISTANCE_IMMUNE } from '../rules/statPaths.js'

const V = '2014'
let n = 0
const id = () => `s8${++n}`

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

export const INCENDIARY_CLOUD = spell({
  id: 'srd:spell.incendiary-cloud', name: 'Incendiary Cloud', level: 8, school: 'conjuration',
  rangeFeet: 150, concentration: true, durationSeconds: 60,
  effect: {
    delivery: 'save', save: { ability: 'dex', onSuccess: 'half' },
    damage: [{ dice: { count: 10, sides: 8 }, type: 'fire' }]
  },
  effects: effects({
    id: 'srd:spell.incendiary-cloud', name: 'Incendiary Cloud',
    narrative: [{
      text: 'A 20-foot-radius sphere of roiling smoke and embers, heavily '
        + 'obscured, dispersed by wind of 10 mph or more. This damage '
        + 'triggers on appearing, entering first time on a turn, and ending '
        + 'a turn there. Moves 10 feet directly away from you each of your '
        + 'turns, your choice of direction.',
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Real damage or a real modifier with a rider the resolver can't carry
// ===========================================================================

export const SUNBURST = spell({
  id: 'srd:spell.sunburst', name: 'Sunburst', level: 8, school: 'evocation',
  rangeFeet: 150,
  effect: {
    delivery: 'save', save: { ability: 'con', onSuccess: 'half' },
    damage: [{ dice: { count: 12, sides: 6 }, type: 'radiant' }]
  },
  effects: effects({
    id: 'srd:spell.sunburst', name: 'Sunburst',
    // The same shape as Sunbeam a level down: the damage resolves, the
    // blindness rider and the undead/ooze disadvantage don't.
    completeness: 'partial',
    narrative: [{
      text: 'A 60-foot radius. On a failed save the target is also '
        + 'blinded for a minute, repeating a Constitution save each of its '
        + 'turns to end it; undead and oozes have disadvantage on this '
        + 'save. Dispels any spell-created darkness in the area.',
      dmPromptable: true
    }]
  })
})

export const HOLY_AURA = spell({
  id: 'srd:spell.holy-aura', name: 'Holy Aura', level: 8, school: 'abjuration',
  rangeKind: 'self', concentration: true, durationSeconds: 60,
  components: {
    verbal: true, somatic: true,
    material: 'a reliquary worth at least 1,000 gp containing a sacred relic'
  },
  effects: effects({
    id: 'srd:spell.holy-aura', name: 'Holy Aura',
    // Advantage on saves and disadvantage for attackers are ordinary
    // modifiers, applied to whichever creatures the DM chose at cast time.
    // The blinding rider against a fiend or undead that lands a melee hit
    // is a target-facing trigger this resolver has no slot for.
    completeness: 'partial',
    modifiers: [
      {
        id: id(), channel: 'roll', rollOp: 'advantage', scope: { kinds: ['save'] },
        permanence: 'temporary', note: 'holy-aura'
      },
      {
        id: id(), channel: 'roll', rollOp: 'disadvantage', scope: { kinds: ['attack'] },
        appliesTo: 'attackersAgainstSelf', permanence: 'temporary', note: 'holy-aura'
      }
    ],
    narrative: [{
      text: 'Chosen creatures within 30 feet at cast time shed dim light '
        + 'and gain the above for the duration. When a fiend or undead '
        + 'hits an affected creature with a melee attack, it saves '
        + 'Constitution or is blinded until the spell ends.',
      dmPromptable: true
    }]
  })
})

export const MIND_BLANK = spell({
  id: 'srd:spell.mind-blank', name: 'Mind Blank', level: 8, school: 'abjuration',
  rangeKind: 'touch', durationSeconds: 86400,
  effects: effects({
    id: 'srd:spell.mind-blank', name: 'Mind Blank',
    // Psychic immunity is the one clause with a matching stat path. Immunity
    // to divination, thought-reading and the charmed condition, plus wish
    // resistance, have no equivalent here.
    completeness: 'partial',
    modifiers: [{
      id: id(), channel: 'value', target: resistancePath('psychic'), op: 'set',
      value: RESISTANCE_IMMUNE, permanence: 'temporary', note: 'mind-blank'
    }],
    narrative: [{
      text: 'For 24 hours, also immune to any emotion-sensing or thought- '
        + 'reading effect, to divination spells, and to the charmed '
        + "condition. Explicitly foils wish and comparable effects aimed "
        + "at the target's mind or information about them.",
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Pure information and utility — nothing to compute, only to narrate
// ===========================================================================

export const DEMIPLANE = spell({
  id: 'srd:spell.demiplane', name: 'Demiplane', level: 8, school: 'conjuration',
  rangeFeet: 60, durationSeconds: 3600,
  components: { verbal: false, somatic: true },
  effects: effects({
    id: 'srd:spell.demiplane', name: 'Demiplane',
    narrative: [{
      text: 'A shadowy door to an empty 30-foot cube room. Anything inside '
        + 'when the spell ends is trapped there. Later castings can '
        + 'reconnect to a demiplane you made before, or another caster\'s '
        + 'if you know its nature and contents.',
      dmPromptable: false
    }]
  })
})

export const CONTROL_WEATHER = spell({
  id: 'srd:spell.control-weather', name: 'Control Weather', level: 8, school: 'transmutation',
  castingTime: { minutes: 10 }, rangeKind: 'self', concentration: true, durationSeconds: 28800,
  effects: effects({
    id: 'srd:spell.control-weather', name: 'Control Weather',
    narrative: [{
      text: 'Must be outdoors, with a clear path to the sky. Change '
        + 'precipitation, temperature and wind by one stage each along a '
        + 'fixed scale, taking 1d4 x 10 minutes to take effect and then '
        + 'changeable again. Weather returns to normal gradually when the '
        + 'spell ends.',
      dmPromptable: true
    }]
  })
})

export const ANTIMAGIC_FIELD = spell({
  id: 'srd:spell.antimagic-field', name: 'Antimagic Field', level: 8, school: 'abjuration',
  rangeKind: 'self', concentration: true, durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.antimagic-field', name: 'Antimagic Field',
    narrative: [{
      text: 'A 10-foot-radius sphere around you where spells cannot be '
        + 'cast, summoned creatures wink out, and magic items become '
        + 'mundane for as long as they remain fully inside. Dispel magic '
        + "has no effect on it, and two antimagic fields don't cancel "
        + 'each other.',
      dmPromptable: true
    }]
  })
})

export const POWER_WORD_STUN = spell({
  id: 'srd:spell.power-word-stun', name: 'Power Word Stun', level: 8, school: 'enchantment',
  rangeFeet: 60,
  components: { verbal: true, somatic: false },
  effects: effects({
    id: 'srd:spell.power-word-stun', name: 'Power Word Stun',
    narrative: [{
      text: 'No save. If the target has 150 hit points or fewer, it is '
        + 'stunned; otherwise nothing happens. A Constitution save at the '
        + 'end of each of its turns ends the effect.',
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Everything else — a target-facing save, a novel roll mechanic, a
// multi-effect area, a summon or a duplicate this content set has no
// vocabulary for
// ===========================================================================

export const ANIMAL_SHAPES = spell({
  id: 'srd:spell.animal-shapes', name: 'Animal Shapes', level: 8, school: 'transmutation',
  rangeFeet: 30, concentration: true, durationSeconds: 86400,
  effects: effects({
    id: 'srd:spell.animal-shapes', name: 'Animal Shapes',
    // Inert by the SRD source's own admission (docs/srd/08b-spell-descriptions.md):
    // it turns willing creatures into beast statblocks, and this content
    // set was scoped from the start to exclude monsters and beasts.
    completeness: 'partial',
    narrative: [{
      text: 'Any number of willing creatures transform into a Large or '
        + 'smaller beast of CR 4 or lower, retaining alignment and mental '
        + 'scores. This content set carries no beast statblocks, so there '
        + 'is nothing here to transform into — narrate it and track the '
        + "form's hit points by hand.",
      dmPromptable: true
    }]
  })
})

export const ANTIPATHY_SYMPATHY = spell({
  id: 'srd:spell.antipathy-sympathy', name: 'Antipathy/Sympathy', level: 8, school: 'enchantment',
  castingTime: { hours: 1 }, rangeFeet: 60, durationSeconds: 864000,
  effects: effects({
    id: 'srd:spell.antipathy-sympathy', name: 'Antipathy/Sympathy',
    completeness: 'partial',
    narrative: [{
      text: 'Target an object, creature or 200-foot cube, and name a kind '
        + 'of intelligent creature. Antipathy: that kind saves Wisdom or is '
        + 'frightened and must move out of sight. Sympathy: it saves '
        + 'Wisdom or must approach and stay near. A new save is allowed '
        + 'each time it ends a turn out of range, and every 24 hours.',
      dmPromptable: true
    }]
  })
})

export const CLONE = spell({
  id: 'srd:spell.clone', name: 'Clone', level: 8, school: 'necromancy',
  castingTime: { hours: 1 }, rangeKind: 'touch',
  components: {
    verbal: true, somatic: true,
    material: 'a diamond worth at least 1,000 gp and a cubic inch of the '
      + "creature's flesh, both consumed, sealed in a vessel worth at least 2,000 gp",
    materialCostCp: 300000, consumed: true
  },
  effects: effects({
    id: 'srd:spell.clone', name: 'Clone',
    completeness: 'partial',
    narrative: [{
      text: "Grows an inert duplicate of a living creature, mature after "
        + "120 days. On the original's death, its soul transfers into the "
        + 'clone if free and willing — same personality and memories, no '
        + "equipment. The original's remains become permanently "
        + 'unrestorable.',
      dmPromptable: true
    }]
  })
})

export const DOMINATE_MONSTER = spell({
  id: 'srd:spell.dominate-monster', name: 'Dominate Monster', level: 8, school: 'enchantment',
  rangeFeet: 60, concentration: true, durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.dominate-monster', name: 'Dominate Monster',
    completeness: 'partial',
    narrative: [{
      text: 'Any creature you can see makes a Wisdom save (with advantage '
        + 'if you or your allies are fighting it) or is charmed. '
        + 'Telepathic link on the same plane; general commands need no '
        + 'action, and spending your action grants precise control until '
        + 'the end of your next turn. A new save each time it takes '
        + 'damage. 8 hours at a 9th-level slot.',
      dmPromptable: true
    }]
  })
})

export const EARTHQUAKE = spell({
  id: 'srd:spell.earthquake', name: 'Earthquake', level: 8, school: 'evocation',
  rangeFeet: 500, concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.earthquake', name: 'Earthquake',
    completeness: 'partial',
    narrative: [{
      text: 'A 100-foot-radius circle of difficult terrain. Every '
        + 'concentrating creature on the ground saves Constitution or '
        + 'loses concentration; every creature on the ground saves '
        + 'Dexterity or falls prone, on casting and at the end of each '
        + 'turn you concentrate. Optionally opens 1d6 fissures (Dexterity '
        + 'save or fall in) and deals 50 bludgeoning to structures, which '
        + 'can collapse onto anyone nearby for 5d6 bludgeoning and being '
        + 'buried.',
      dmPromptable: true
    }]
  })
})

export const FEEBLEMIND = spell({
  id: 'srd:spell.feeblemind', name: 'Feeblemind', level: 8, school: 'enchantment',
  rangeFeet: 150,
  effects: effects({
    id: 'srd:spell.feeblemind', name: 'Feeblemind',
    // The 4d6 psychic damage is unconditional and the Intelligence save
    // decides a separate stat-drain outcome — a shape SpellEffect's
    // save.onSuccess (which always gates the damage itself) can't express.
    completeness: 'partial',
    narrative: [{
      text: 'Deals 4d6 psychic damage, and the target saves Intelligence '
        + 'or its Intelligence and Charisma both become 1: it cannot cast '
        + 'spells, use magic items, understand language or communicate, '
        + 'though it still recognises and protects friends. Repeats the '
        + 'save every 30 days; also ended by greater restoration, heal or '
        + 'wish.',
      dmPromptable: true
    }]
  })
})

export const GLIBNESS = spell({
  id: 'srd:spell.glibness', name: 'Glibness', level: 8, school: 'transmutation',
  rangeKind: 'self', durationSeconds: 3600,
  components: { verbal: true, somatic: false },
  effects: effects({
    id: 'srd:spell.glibness', name: 'Glibness',
    // A roll replacement — "treat this check as a 15" — is a different
    // kind of modification from advantage, a bonus, or a reroll, and this
    // content set has no channel for substituting a result outright.
    completeness: 'partial',
    narrative: [{
      text: 'For an hour, any Charisma check you make may be treated as a '
        + '15 instead of rolled. Magic that detects lies always reports '
        + 'you as truthful.',
      dmPromptable: true
    }]
  })
})

export const MAZE = spell({
  id: 'srd:spell.maze', name: 'Maze', level: 8, school: 'conjuration',
  rangeFeet: 60, concentration: true, durationSeconds: 600,
  effects: effects({
    id: 'srd:spell.maze', name: 'Maze',
    // No saving throw at all — resisted only by escaping, a shape none of
    // this set's damage/save/heal vocabulary applies to.
    completeness: 'partial',
    narrative: [{
      text: 'Banish a creature you can see to a labyrinthine demiplane. '
        + 'Its action to attempt escape is a DC 20 Intelligence check '
        + '(minotaurs and goristro demons succeed automatically). On '
        + 'ending, it reappears in the space it left, or the nearest free '
        + 'one.',
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Registration
// ===========================================================================

export const ALL_LEVEL8_SPELLS: SpellDefinition[] = [
  { ...INCENDIARY_CLOUD, lists: ['srd:list.sorcerer', 'srd:list.wizard'] },
  { ...SUNBURST, lists: ['srd:list.druid', 'srd:list.sorcerer', 'srd:list.wizard'] },
  { ...HOLY_AURA, lists: ['srd:list.cleric'] },
  { ...MIND_BLANK, lists: ['srd:list.bard', 'srd:list.wizard'] },
  { ...DEMIPLANE, lists: ['srd:list.warlock', 'srd:list.wizard'] },
  { ...CONTROL_WEATHER, lists: ['srd:list.cleric', 'srd:list.druid', 'srd:list.wizard'] },
  { ...ANTIMAGIC_FIELD, lists: ['srd:list.cleric', 'srd:list.wizard'] },
  { ...POWER_WORD_STUN, lists: [
    'srd:list.bard', 'srd:list.sorcerer', 'srd:list.warlock', 'srd:list.wizard'
  ] },
  { ...ANIMAL_SHAPES, lists: ['srd:list.druid'] },
  { ...ANTIPATHY_SYMPATHY, lists: ['srd:list.druid', 'srd:list.wizard'] },
  { ...CLONE, lists: ['srd:list.wizard'] },
  { ...DOMINATE_MONSTER, lists: [
    'srd:list.bard', 'srd:list.sorcerer', 'srd:list.warlock', 'srd:list.wizard'
  ] },
  { ...EARTHQUAKE, lists: ['srd:list.cleric', 'srd:list.druid', 'srd:list.sorcerer', 'srd:list.wizard'] },
  { ...FEEBLEMIND, lists: ['srd:list.bard', 'srd:list.druid', 'srd:list.warlock', 'srd:list.wizard'] },
  { ...GLIBNESS, lists: ['srd:list.bard', 'srd:list.warlock'] },
  { ...MAZE, lists: ['srd:list.wizard'] }
]
