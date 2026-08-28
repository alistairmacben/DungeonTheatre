// Tiefling Warlock — the slot model that is not a ladder.
//
// Chosen because pact magic is the one casting model whose slots do not stack
// up level by level: a warlock holds one or two slots, *all* of them at the
// highest level they have reached, and gets them back on a short rest. Three
// separate parts of ResourceDefinition are under test at once — `max` as a
// derived stat, `refresh` as a cadence rather than a duration, and `spellSlot`
// as an explicit declaration rather than something inferred from the id.
//
// Two of the three generalised without argument. The third did not: a slot's
// *level* is a literal `number` on the definition, and the warlock's rises with
// their level. What that forced is documented on PACT SLOTS below, and it is
// the single most useful thing in this file.
//
// The tiefling is here for the same reason in miniature: innate racial magic on
// a per-day budget rather than slots, unlocking in stages by character level.

import type {
  ClassDefinition, ClassFeatureDefinition, EffectSource, FeatDefinition,
  ItemDefinition, Modifier, ProficiencyGrant, SpellDefinition, SpeciesDefinition,
  SubclassDefinition
} from '../rules/types.js'
import {
  abilityModifierPath, abilityScorePath, DAMAGE_WEAPON, declareResourceMax,
  HP_MAX, PROFICIENCY_BONUS, RESISTANCE_RESISTANT, resistancePath, SPELL_ATTACK,
  SPELL_SAVE_DC, speedPath
} from '../rules/statPaths.js'

const V = '2014'
let n = 0
const id = () => `wl${++n}`

const WARLOCK = 'srd:class.warlock'

function source(o: Partial<EffectSource> & { id: string; name: string }): EffectSource {
  return {
    provenance: 'srd', contentVersion: 1, kind: 'feature',
    activation: { always: true }, modifiers: [], completeness: 'complete',
    ...o
  }
}

const add = (target: string, value: Modifier['value'], extra: Partial<Modifier> = {}): Modifier =>
  ({ id: id(), channel: 'value', target, op: 'add', value, permanence: 'persistent', ...extra })

const setTo = (target: string, value: Modifier['value'], extra: Partial<Modifier> = {}): Modifier =>
  ({ id: id(), channel: 'value', target, op: 'set', value, permanence: 'persistent', ...extra })

const prof = (
  category: ProficiencyGrant['category'],
  level: ProficiencyGrant['level'] = 'proficient'
): ProficiencyGrant =>
  ({ id: id(), category, level, rounding: 'floor', grantsProficiency: true })

/**
 * A proficiency the player picks. `expandSelections` turns one authored grant
 * into as many held proficiencies as the answer names.
 */
const chosenProf = (kind: 'skill' | 'tool', selectionId: string): ProficiencyGrant => ({
  id: id(),
  category: { kind, selection: selectionId } as never,
  level: 'proficient', rounding: 'floor', grantsProficiency: true
})

// ===========================================================================
// Spells
// ===========================================================================
//
// Seven, and no more: the warlock is a *known* caster, so its spell grants are
// selections over a candidate set, and a candidate set of one would not have
// tested anything. Everything the tiefling needs innately is here too, which
// is deliberate — *hellish rebuke* and *darkness* are reachable both as racial
// magic and as warlock spells known, and the two grants have to agree.

const WARLOCK_LIST = 'srd:list.warlock'
const DRUID_LIST = 'srd:list.druid'
const CLERIC_LIST = 'srd:list.cleric'
const SORCERER_LIST = 'srd:list.sorcerer'

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

function spellEffects(o: Partial<EffectSource> & { id: string; name: string }): EffectSource {
  return {
    provenance: 'srd', contentVersion: 1, kind: 'spell',
    activation: { always: true }, modifiers: [], completeness: 'complete',
    ...o
  }
}

/**
 * Eldritch Blast.
 *
 * The one cantrip in the SRD that scales by *number of attack rolls* rather
 * than by damage dice, so what a cast produces is a variable-length list of
 * attacks. No part of the vocabulary describes a spell's roll shape — spells
 * carry narrative and modifiers, never a dice request — so the beam count is
 * prose here exactly as *fire bolt*'s damage progression is prose in spells.ts.
 */
export const ELDRITCH_BLAST = spell({
  id: 'srd:spell.eldritch-blast', name: 'Eldritch Blast', level: 0,
  school: 'evocation', rangeFeet: 120,
  effects: spellEffects({
    id: 'srd:spell.eldritch-blast', name: 'Eldritch Blast',
    narrative: [{
      text: 'A beam of crackling energy. Make a ranged spell attack for 1d10 '
        + 'force damage. You create two beams at 5th level, three at 11th and '
        + 'four at 17th, each with its own attack roll, at the same or '
        + 'different targets.',
      dmPromptable: false
    }]
  })
})

export const CHILL_TOUCH = spell({
  id: 'srd:spell.chill-touch', name: 'Chill Touch', level: 0,
  school: 'necromancy', rangeFeet: 120, durationSeconds: 6,
  effects: spellEffects({
    id: 'srd:spell.chill-touch', name: 'Chill Touch',
    narrative: [{
      text: 'A ranged spell attack for 1d8 necrotic damage. The target cannot '
        + 'regain hit points until the start of your next turn, and an undead '
        + 'target also has disadvantage on attacks against you until the end '
        + 'of your next turn.',
      dmPromptable: false
    }]
  })
})

export const POISON_SPRAY = spell({
  id: 'srd:spell.poison-spray', name: 'Poison Spray', level: 0,
  school: 'conjuration', rangeFeet: 10,
  // Never had a resolved effect at all — narrative only, the one cantrip in
  // the set with a save and damage that never reached `effect`. A save spell
  // in the Sacred Flame shape: the target rolls, the caster does not.
  effect: {
    delivery: 'save',
    save: { ability: 'con', onSuccess: 'none' },
    damage: [{ dice: { count: 1, sides: 12 }, type: 'poison' }],
    cantripScaling: true
  },
  effects: spellEffects({
    id: 'srd:spell.poison-spray', name: 'Poison Spray',
    narrative: [{
      text: 'A puff of noxious gas. The target must succeed on a Constitution '
        + 'saving throw or take 1d12 poison damage.',
      dmPromptable: false
    }]
  })
})

/**
 * Thaumaturgy.
 *
 * The tiefling's cantrip, and a cleric spell rather than a warlock one — which
 * is the point of tagging lists on the export rather than on the definition.
 * Racial access does not put a spell on the class list.
 */
export const THAUMATURGY = spell({
  id: 'srd:spell.thaumaturgy', name: 'Thaumaturgy', level: 0,
  school: 'transmutation', rangeFeet: 30, durationSeconds: 60,
  components: { verbal: true, somatic: false },
  effects: spellEffects({
    id: 'srd:spell.thaumaturgy', name: 'Thaumaturgy',
    narrative: [{
      text: 'A minor wonder: your voice booms three times as loud, flames '
        + 'flicker or change colour, the ground trembles harmlessly, a sound '
        + 'issues from a point you choose, an unlocked door flies open or '
        + 'slams shut, or your eyes change. Up to three one-minute effects at '
        + 'once, dismissible as an action.',
      dmPromptable: true
    }]
  })
})

export const CHARM_PERSON = spell({
  id: 'srd:spell.charm-person', name: 'Charm Person', level: 1,
  school: 'enchantment', rangeFeet: 30, durationSeconds: 3600,
  effects: spellEffects({
    id: 'srd:spell.charm-person', name: 'Charm Person',
    narrative: [{
      text: 'A humanoid you can see must succeed on a Wisdom saving throw — '
        + 'with advantage if you or your companions are fighting it — or be '
        + 'charmed for an hour, regarding you as a friendly acquaintance. It '
        + 'ends if you or a companion harms it, and the creature knows it was '
        + 'charmed afterwards. One extra target per slot level above 1st.',
      dmPromptable: false
    }]
  })
})

export const HELLISH_REBUKE = spell({
  id: 'srd:spell.hellish-rebuke', name: 'Hellish Rebuke', level: 1,
  school: 'evocation', castingTime: 'reaction', rangeFeet: 60,
  effects: spellEffects({
    id: 'srd:spell.hellish-rebuke', name: 'Hellish Rebuke',
    narrative: [{
      text: 'Taken as a reaction when a creature within 60 feet that you can '
        + 'see damages you. It is wreathed in flame and must make a Dexterity '
        + 'saving throw, taking 2d10 fire damage on a failure and half as much '
        + 'on a success. Add 1d10 per slot level above 1st.',
      dmPromptable: false
    }]
  })
})

export const DARKNESS = spell({
  id: 'srd:spell.darkness', name: 'Darkness', level: 2,
  school: 'evocation', rangeFeet: 60, concentration: true, durationSeconds: 600,
  components: { verbal: true, somatic: false, material: 'bat fur and a drop of pitch or piece of coal' },
  effects: spellEffects({
    id: 'srd:spell.darkness', name: 'Darkness',
    narrative: [{
      text: 'A 15-foot-radius sphere of magical darkness spreads around '
        + 'corners for the duration. Darkvision cannot see through it and '
        + 'nonmagical light cannot illuminate it. Cast on an object, it moves '
        + 'with the object and is blocked by covering the object. It dispels '
        + 'any light created by a spell of 2nd level or lower.',
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Species — Tiefling
// ===========================================================================

// Infernal Legacy hands out two spells on a per-day budget rather than on
// slots, and the budget does not exist until the character reaches 3rd and 5th
// level. A resource maximum is an ordinary derived stat, so "you do not have
// this yet" and "you have used it" are the same number reached two different
// ways — and the level gate is a predicate on the modifier that feeds it.
const HELLISH_REBUKE_USES_MAX = declareResourceMax('tiefling.hellish-rebuke')
const DARKNESS_USES_MAX = declareResourceMax('tiefling.darkness')

export const TIEFLING: SpeciesDefinition = {
  id: 'srd:species.tiefling', name: 'Tiefling', provenance: 'srd', contentVersion: 1,
  size: 'medium', baseWalkSpeed: 30,
  effects: source({
    id: 'srd:species.tiefling', name: 'Tiefling', kind: 'species',
    modifiers: [
      add(abilityScorePath('int'), 1),
      add(abilityScorePath('cha'), 2),
      { id: id(), channel: 'value', target: speedPath('walk'), op: 'base', value: 30, permanence: 'persistent' },
      setTo(resistancePath('fire'), RESISTANCE_RESISTANT, { note: 'Hellish Resistance' }),
      // Infernal Legacy's staged unlocks. `characterLevel`, not warlock level:
      // the SRD ties a racial trait to the character, and a tiefling wizard
      // reaches 3rd level on the same schedule.
      add(HELLISH_REBUKE_USES_MAX, 1, {
        condition: { characterLevelAtLeast: 3 },
        note: 'Infernal Legacy: hellish rebuke from 3rd level'
      }),
      add(DARKNESS_USES_MAX, 1, {
        condition: { characterLevelAtLeast: 5 },
        note: 'Infernal Legacy: darkness from 5th level'
      })
    ],
    resources: [
      {
        id: 'tiefling.hellish-rebuke', name: 'Hellish Rebuke (Infernal Legacy)',
        max: HELLISH_REBUKE_USES_MAX, refresh: { kind: 'longRest' },
        display: 'uses', group: 'Infernal Legacy', order: 1
      },
      {
        id: 'tiefling.darkness', name: 'Darkness (Infernal Legacy)',
        max: DARKNESS_USES_MAX, refresh: { kind: 'longRest' },
        display: 'uses', group: 'Infernal Legacy', order: 2
      }
    ],
    // Three grants, three budgets, one type. The cantrip costs nothing, and the
    // other two name a resource instead of a slot group — which is the whole of
    // what "once per long rest without expending a spell slot" means.
    //
    // A tiefling warlock is the case where two grants reach one spell by
    // different currencies: *darkness* and *hellish rebuke* are on the warlock
    // list too. resolveSpellcasting keeps one grant per spell and breaks the
    // tie on prepared-versus-always only, so this one shadows the slot-paid
    // one. Deliberately left as it is — the collision is real and belongs in
    // the gap report, not papered over by dropping the spells from the warlock
    // list they are genuinely on. The narrative below tells the table.
    spells: [
      { spellIds: ['srd:spell.thaumaturgy'], availability: 'always', ability: 'cha' },
      {
        spellIds: ['srd:spell.hellish-rebuke'], availability: 'always', ability: 'cha',
        costs: { 'tiefling.hellish-rebuke': 1 }
      },
      {
        spellIds: ['srd:spell.darkness'], availability: 'always', ability: 'cha',
        costs: { 'tiefling.darkness': 1 }
      }
    ],
    narrative: [
      {
        text: 'Infernal Legacy unlocks in stages: thaumaturgy from 1st level, '
          + 'hellish rebuke once per long rest from 3rd level, darkness once '
          + 'per long rest from 5th. Charisma is the spellcasting ability for '
          + 'all three. Below those levels the two spells are listed with no '
          + 'uses remaining rather than hidden — a SpellGrant cannot yet carry '
          + 'a level gate of its own, so read "0 remaining" as "not yet yours".',
        dmPromptable: false
      },
      {
        text: 'Your hellish rebuke is cast as a 2nd-level spell, so it deals '
          + '3d10 fire damage rather than 2d10. Nothing in a spell grant fixes '
          + 'the level a spell is cast at, so apply the extra die at the table.',
        dmPromptable: true
      },
      {
        text: 'If you are also a warlock who knows darkness or hellish rebuke, '
          + 'you can cast it with a pact slot as well as with the once-a-day '
          + 'use. Only one route is shown per spell and the racial one wins, '
          + 'so read "no uses remaining" as applying to the free cast only.',
        dmPromptable: true
      },
      {
        text: 'Darkvision reaches 60 feet, in shades of grey. Your languages '
          + 'are Common and Infernal.',
        dmPromptable: false
      }
    ],
    // Partial for the two clauses above and nothing else: the ability scores,
    // fire resistance and the per-day budgets are exact.
    completeness: 'partial'
  })
}

// ===========================================================================
// Class — Warlock, levels 1-5
// ===========================================================================

// ---------------------------------------------------------------------------
// The Warlock table (SRD p46), transcribed
// ---------------------------------------------------------------------------

/** Spell Slots: 1, then 2 from 2nd, 3 from 11th, 4 from 17th. */
const PACT_SLOT_COUNT = [
  1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4
]

/**
 * Slot Level: 1st, rising every two levels to 5th at warlock 9 and staying.
 *
 * This is the column that makes the warlock the warlock — one pool whose level
 * climbs — and until now it could not be said at all. `spellSlot.level` was a
 * literal number, so the class was modelled as three pools with two of them
 * always empty, and a previous author left a note naming the one-line fix in
 * types.ts. Extending the class past 5th would have made it five pools with
 * four empty, so the fix was made: the level is a ValueExpr now, a number is
 * still a valid ValueExpr, and every other caster is untouched.
 */
const PACT_SLOT_LEVEL = [
  1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5
]

/** Cantrips Known: two, three from 4th, four from 10th. */
const WARLOCK_CANTRIPS_KNOWN = [
  2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4
]

/** Spells Known: 2 at 1st, rising to 15 — and flat on every even level from 10th. */
const WARLOCK_SPELLS_KNOWN = [
  2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15
]

/** Invocations Known: none at 1st, two at 2nd, rising to eight. */
const WARLOCK_INVOCATIONS_KNOWN = [
  0, 2, 2, 2, 3, 3, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8
]

/** The warlock takes the standard five Ability Score Improvements. */
const WARLOCK_ASI_LEVELS = [4, 8, 12, 16, 19]

/** "Choose two skills from" — seven, and the player picks which two. */
const WARLOCK_SKILLS = [
  'arcana', 'deception', 'history', 'intimidation', 'investigation',
  'nature', 'religion'
]

const PACT_SLOTS_MAX = declareResourceMax('warlock.pact-slots')

/**
 * The warlock's candidate spells, level by level.
 *
 * A known caster's grant is a selection, and a selection needs candidates. The
 * two arrays are the warlock spell list as it exists in this content set — not
 * the whole SRD list, which is the same restriction the wizard's `fromList`
 * grant already lives under.
 */
const WARLOCK_CANTRIP_IDS = [
  'srd:spell.eldritch-blast', 'srd:spell.chill-touch', 'srd:spell.poison-spray',
  'srd:spell.mage-hand', 'srd:spell.minor-illusion', 'srd:spell.prestidigitation',
  'srd:spell.true-strike'
]

const WARLOCK_SPELL_IDS = [
  'srd:spell.charm-person', 'srd:spell.hellish-rebuke', 'srd:spell.darkness',
  'srd:spell.comprehend-languages', 'srd:spell.expeditious-retreat',
  'srd:spell.illusory-script', 'srd:spell.protection-from-evil-and-good',
  'srd:spell.unseen-servant',
  'srd:spell.enthrall', 'srd:spell.hold-person', 'srd:spell.invisibility',
  'srd:spell.mirror-image', 'srd:spell.misty-step', 'srd:spell.ray-of-enfeeblement',
  'srd:spell.shatter', 'srd:spell.suggestion',
  'srd:spell.counterspell', 'srd:spell.dispel-magic', 'srd:spell.fear', 'srd:spell.fly',
  'srd:spell.gaseous-form', 'srd:spell.hypnotic-pattern', 'srd:spell.magic-circle',
  'srd:spell.major-image', 'srd:spell.remove-curse', 'srd:spell.tongues',
  'srd:spell.vampiric-touch'
]

/**
 * One level-up's worth of new spells known.
 *
 * `SelectionDefinition.count` is a number, and the warlock's spells known rises
 * 2/3/4/5/6 across levels 1-5. Rather than pick one count and be wrong at four
 * levels out of five, each level-up is the feature the SRD table says it is:
 * `grantedAtLevel` already gates it, and the selections accumulate. Selection
 * answers are keyed by source id, so every one of these is a separate question.
 */
const ORDINAL: Record<number, string> = {
  1: '1st', 2: '2nd', 3: '3rd', 4: '4th', 5: '5th', 6: '6th', 7: '7th',
  8: '8th', 9: '9th', 10: '10th', 11: '11th', 12: '12th', 13: '13th',
  14: '14th', 15: '15th', 16: '16th', 17: '17th', 18: '18th', 19: '19th',
  20: '20th'
}

function spellsKnownAt(level: number, count: number): ClassFeatureDefinition {
  const fid = `srd:class.warlock.spells-known.${level}`
  const name = `Warlock Spells Known (${ORDINAL[level]} level)`
  return {
    id: fid, name, provenance: 'srd', contentVersion: 1, grantedAtLevel: level,
    effects: source({
      id: fid, name,
      selections: [{
        id: 'spells-known',
        prompt: `Choose ${count} warlock spell${count === 1 ? '' : 's'} of a level you can cast`,
        kind: 'spellList', count, from: WARLOCK_SPELL_IDS
      }],
      spells: [{
        selectionId: 'spells-known', availability: 'always',
        slotGroup: 'pact', ability: 'cha'
      }]
    })
  }
}

/** One level-up's worth of new cantrips, from the Cantrips Known column. */
function cantripsKnownAt(level: number, count: number): ClassFeatureDefinition {
  const fid = `srd:class.warlock.cantrips-known.${level}`
  const name = `Warlock Cantrips Known (${ORDINAL[level]} level)`
  return {
    id: fid, name, provenance: 'srd', contentVersion: 1, grantedAtLevel: level,
    effects: source({
      id: fid, name,
      selections: [{
        id: 'cantrips',
        prompt: `Choose ${count} more warlock cantrip${count === 1 ? '' : 's'}`,
        kind: 'spellList', count, from: WARLOCK_CANTRIP_IDS
      }],
      spells: [{ selectionId: 'cantrips', availability: 'always', ability: 'cha' }]
    })
  }
}

const CANTRIP_FEATURES = WARLOCK_CANTRIPS_KNOWN
  .map((known, i) => {
    const level = i + 1
    if (level === 1) return undefined // Granted by Pact Magic itself.
    const delta = known - WARLOCK_CANTRIPS_KNOWN[i - 1]!
    return delta > 0 ? cantripsKnownAt(level, delta) : undefined
  })
  .filter((f): f is ClassFeatureDefinition => f !== undefined)

const SPELLS_KNOWN_FEATURES = WARLOCK_SPELLS_KNOWN
  .map((known, i) => {
    const level = i + 1
    if (level === 1) return undefined // Granted by Pact Magic itself.
    const delta = known - WARLOCK_SPELLS_KNOWN[i - 1]!
    return delta > 0 ? spellsKnownAt(level, delta) : undefined
  })
  .filter((f): f is ClassFeatureDefinition => f !== undefined)

/**
 * Mystic Arcanum: one 6th-level spell at 11th, and one more a tier higher at
 * 13th, 15th and 17th, each castable once per long rest without a slot.
 *
 * The use is a resource and reads correctly. The *spell* is not offered as a
 * selection, because the content set holds no spell above 3rd level and a
 * selection whose pool cannot answer it is an integrity error — correctly so.
 * Naming the tier in the narrative is the honest version of "choose one 6th-
 * level warlock spell" when there are none to choose from yet.
 */
const MYSTIC_ARCANA = ([[11, 6], [13, 7], [15, 8], [17, 9]] as const)
  .map(([level, spellLevel]): ClassFeatureDefinition => {
    const fid = `srd:class.warlock.mystic-arcanum.${spellLevel}`
    const name = `Mystic Arcanum (${ORDINAL[spellLevel]} level)`
    const rid = `warlock.mystic-arcanum.${spellLevel}`
    return {
      id: fid, name, provenance: 'srd', contentVersion: 1, grantedAtLevel: level,
      effects: source({
        id: fid, name,
        completeness: 'partial',
        modifiers: [add(declareResourceMax(rid), 1, { note: 'once per long rest' })],
        resources: [{
          id: rid, name, max: declareResourceMax(rid),
          refresh: { kind: 'longRest' }, display: 'uses',
          group: 'Pact Magic', order: 10 + spellLevel
        }],
        narrative: [{
          text: `Choose one ${ORDINAL[spellLevel]}-level spell from the warlock `
            + 'spell list. You can cast it once without expending a spell slot, '
            + 'and regain the use on a long rest. The spell is not offered as a '
            + 'choice here because no spell of that level is in the content set '
            + 'yet — write it down and cast it against the use below.',
          dmPromptable: true
        }]
      })
    }
  })

const ELDRITCH_MASTER_MAX = declareResourceMax('warlock.eldritch-master')

export const WARLOCK_CLASS: ClassDefinition = {
  id: WARLOCK, name: 'Warlock', provenance: 'srd', contentVersion: 1,
  hitDie: 8, savingThrowProficiencies: ['wis', 'cha'],
  subclassSlot: { grantedAtLevel: 1, options: ['srd:subclass.fiend'] },
  features: [
    {
      id: 'srd:class.warlock.proficiencies', name: 'Warlock Proficiencies',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:class.warlock.proficiencies', name: 'Warlock Proficiencies',
        modifiers: [
          add(HP_MAX, {
            sum: [
              8, { product: [5, { sum: [{ characterLevel: true }, -1] }] },
              { product: [{ stat: abilityModifierPath('con') }, { characterLevel: true }] }
            ]
          }, { note: 'd8 hit die: 5 per level after the first, +8 at 1st, + CON per level' })
        ],
        proficiencies: [
          prof({ kind: 'save', ability: 'wis' }),
          prof({ kind: 'save', ability: 'cha' }),
          prof({ kind: 'armor', category: 'light' }),
          prof({ kind: 'weaponCategory', category: 'simple' }),
          // "Choose two skills from" — seven of them, and which two is the
          // player's. This used to be Arcana and Deception for every warlock
          // the content could produce.
          chosenProf('skill', 'skills')
        ],
        selections: [{
          id: 'skills', prompt: 'Choose two warlock skills', kind: 'skill', count: 2,
          from: WARLOCK_SKILLS
        }]
      })
    },
    {
      id: 'srd:class.warlock.pact-magic', name: 'Pact Magic',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:class.warlock.pact-magic', name: 'Pact Magic',
        modifiers: [
          // Same three ordinary modifiers the wizard's DC is built from, with
          // Charisma in place of Intelligence. Nothing about pact magic reaches
          // the DC, which is the result the design wanted.
          { id: id(), channel: 'value', target: SPELL_SAVE_DC, op: 'base', value: 8, permanence: 'persistent' },
          add(SPELL_SAVE_DC, { stat: PROFICIENCY_BONUS }),
          add(SPELL_SAVE_DC, { stat: abilityModifierPath('cha') }, { note: 'Charisma' }),
          add(SPELL_ATTACK, { stat: PROFICIENCY_BONUS }),
          add(SPELL_ATTACK, { stat: abilityModifierPath('cha') }, { note: 'Charisma' }),
          // What satisfies "the ability to cast at least one spell" for War
          // Caster and friends. No class check anywhere.
          {
            id: id(), channel: 'capability', capability: 'castSpells',
            capOp: 'grant', permanence: 'persistent'
          },
          // One pool, one column. No conditions and no empty rows.
          add(PACT_SLOTS_MAX,
            { classLevelTable: { classId: WARLOCK, values: PACT_SLOT_COUNT } },
            { note: 'Spell Slots column of the Warlock table' })
        ],
        // `refresh: shortRest` already means "a short *or* a long rest" —
        // applyRest restores a short-rest resource on either. The cadence that
        // makes the warlock the warlock needed no new refresh rule.
        resources: [{
          id: 'warlock.pact-slots', name: 'Pact Slots',
          max: PACT_SLOTS_MAX, refresh: { kind: 'shortRest' },
          display: 'slots', group: 'Pact Magic', order: 1,
          spellSlot: {
            group: 'pact',
            level: { classLevelTable: { classId: WARLOCK, values: PACT_SLOT_LEVEL } }
          }
        }],
        // A known caster prepares nothing: everything chosen is `always`
        // available. The difference from the wizard is one field, exactly as
        // the difference between the wizard and the cleric was one field.
        selections: [
          {
            id: 'cantrips', prompt: 'Choose 2 warlock cantrips',
            kind: 'spellList', count: 2, from: WARLOCK_CANTRIP_IDS
          },
          {
            id: 'spells-known', prompt: 'Choose 2 warlock spells of 1st level',
            kind: 'spellList', count: 2, from: WARLOCK_SPELL_IDS
          }
        ],
        spells: [
          { selectionId: 'cantrips', availability: 'always', ability: 'cha' },
          {
            selectionId: 'spells-known', availability: 'always',
            slotGroup: 'pact', ability: 'cha'
          }
        ],
        narrative: [{
          text: 'Every pact slot is the same level and a spell is always cast '
            + 'at that level — there is no casting a warlock spell down. Your '
            + 'slots are 1st level, and rise to 2nd at 3rd level, 3rd at 5th, '
            + '4th at 7th and 5th at 9th, where they stay.',
          dmPromptable: false
        }, {
          text: 'On each level-up you may replace one warlock spell you know '
            + 'with another you could learn. Re-answer the selection for the '
            + 'level whose spell you are trading away.',
          dmPromptable: false
        }]
      })
    },
    {
      id: 'srd:class.warlock.eldritch-invocations', name: 'Eldritch Invocations',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 2,
      effects: source({
        id: 'srd:class.warlock.eldritch-invocations', name: 'Eldritch Invocations',
        // The invocations themselves are feats — see WARLOCK_INVOCATIONS below,
        // and docs/srd/90-vocabulary-findings.md, which reached the same
        // conclusion from the other direction. Each carries its own
        // prerequisite predicate, so a non-warlock who somehow acquires one is
        // told why it is inactive.
        //
        // What no feature can say is how many you may hold: two at 2nd level,
        // three at 5th. A feat is taken through a build choice and build
        // choices have no per-source budget, so the count is a table rule for
        // the table to keep.
        narrative: [{
          text: 'You know two eldritch invocations at 2nd level, three at 5th, '
            + 'four at 7th, five at 9th, six at 12th, seven at 15th and eight '
            + 'at 18th, and may swap one whenever you gain a warlock level. '
            + 'Invocations are taken as feats; nothing counts them for you, so '
            + 'check the number against your level when you take one.',
          dmPromptable: true
        }],
        completeness: 'partial'
      })
    },
    {
      id: 'srd:class.warlock.pact-boon', name: 'Pact Boon',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 3,
      effects: source({
        id: 'srd:class.warlock.pact-boon', name: 'Pact Boon',
        // The choice is recorded; the consequences of the choice are not.
        // Modifiers can be gated on a Predicate, but no Predicate reads a
        // selection's answer — which is the same wall `protection from energy`
        // hit in spells.ts and the reason Resilient gates on a dmFlag rather
        // than on its own selection. One new Predicate arm would let all three
        // boons be authored here as ordinary gated grants.
        selections: [{
          id: 'boon', prompt: 'Choose a Pact Boon', kind: 'other', count: 1,
          from: ['pact-of-the-chain', 'pact-of-the-blade', 'pact-of-the-tome']
        }],
        narrative: [{
          text: 'Pact of the Chain: you learn find familiar, may cast it as a '
            + 'ritual, and your familiar may take an imp, pseudodragon, quasit '
            + 'or sprite form. You can forgo one of your own attacks to let it '
            + 'attack. Pact of the Blade: you create a melee pact weapon of '
            + 'any form as an action, are proficient with it while you wield '
            + 'it, and it counts as magical. Pact of the Tome: three cantrips '
            + 'from any class list, cast at will, not counted against your '
            + 'cantrips known. Record the choice here; apply its effects at '
            + 'the table.',
          dmPromptable: true
        }],
        completeness: 'partial'
      })
    },
    // The Cantrips Known and Spells Known columns, one level-up per row that
    // rises. `SelectionDefinition.count` is a number and both columns move, so
    // each increase is the feature the table says it is — and a level where a
    // column is flat produces nothing, which is why 10th, 12th, 14th, 16th,
    // 18th and 20th learn no new spell.
    ...CANTRIP_FEATURES,
    ...SPELLS_KNOWN_FEATURES,

    // --- 11th, 13th, 15th, 17th --------------------------------------------
    ...MYSTIC_ARCANA,

    // --- 20th --------------------------------------------------------------
    {
      id: 'srd:class.warlock.eldritch-master', name: 'Eldritch Master',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 20,
      effects: source({
        id: 'srd:class.warlock.eldritch-master', name: 'Eldritch Master',
        // The use is a resource and the action is an action; what neither can
        // say is "and now refill that other pool". No ActionDefinition field
        // restores a resource — costs go one way — so the refill is the
        // player's to apply.
        completeness: 'partial',
        modifiers: [add(ELDRITCH_MASTER_MAX, 1, { note: 'once per long rest' })],
        resources: [{
          id: 'warlock.eldritch-master', name: 'Eldritch Master',
          max: ELDRITCH_MASTER_MAX, refresh: { kind: 'longRest' },
          display: 'uses', group: 'Pact Magic', order: 20
        }],
        actions: [{
          id: 'warlock.eldritch-master.entreat', name: 'Entreat Your Patron',
          kind: 'ability', cost: 'action',
          description: 'Spend 1 minute entreating your patron to regain all expended '
            + 'pact slots.',
          requirements: { resourceAtLeast: ['warlock.eldritch-master', 1] },
          costs: { 'warlock.eldritch-master': 1 }
        }],
        narrative: [{
          text: 'Spending this use does not refill your pact slots for you — '
            + 'nothing can yet restore one resource by spending another. Reset '
            + 'the slot track by hand.',
          dmPromptable: false
        }]
      })
    }
  ]
}

// ===========================================================================
// Subclass — The Fiend (SRD p50-51)
// ===========================================================================
//
// It was authored as five class features every warlock received whether or not
// they had made that pact, while the class *also* declared a subclass slot
// pointing at a `srd:subclass.fiend` nobody had defined. The cleric's Life
// Domain, the bard's College of Lore, the rogue's Thief and the barbarian's
// Berserker were all in the same shape.

const DARK_ONES_LUCK_MAX = declareResourceMax('warlock.dark-ones-own-luck')
const HURL_THROUGH_HELL_MAX = declareResourceMax('warlock.hurl-through-hell')

export const FIEND: SubclassDefinition = {
  id: 'srd:subclass.fiend', name: 'The Fiend',
  provenance: 'srd', contentVersion: 1,
  classId: WARLOCK,
  features: [
    {
      id: 'srd:subclass.fiend.expanded-spells', name: 'Expanded Spell List',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:subclass.fiend.expanded-spells', name: 'Expanded Spell List',
        // "These spells are added to the warlock spell list for you" — it
        // widens the candidate set of a selection someone else declared, and
        // grants nothing. `SelectionDefinition.from` is a fixed array on the
        // declaring source, so there is no vocabulary for widening it from
        // outside. A grant would be the wrong shape: an expanded-list spell
        // still has to be learned, and still costs a spell known.
        completeness: 'partial',
        narrative: [{
          text: 'Burning hands and command (1st), blindness/deafness and '
            + 'scorching ray (2nd), fireball and stinking cloud (3rd), fire '
            + 'shield and wall of fire (4th), flame strike and hallow (5th) '
            + 'count as warlock spells for you. They are not granted — you '
            + 'still learn them as spells known.',
          dmPromptable: true
        }]
      })
    },
    {
      id: 'srd:subclass.fiend.dark-ones-blessing', name: "Dark One's Blessing",
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:subclass.fiend.dark-ones-blessing', name: "Dark One's Blessing",
        // The trigger declares the window; nothing can declare what happens in
        // it. Temporary hit points are character state with no stat path and
        // no modifier op, so the amount — a perfectly ordinary ValueExpr — has
        // nowhere to be written down. It is stated in the narrative instead of
        // being approximated onto hitPoints.max, which would be a different
        // rule wearing this one's name.
        completeness: 'partial',
        triggers: [{
          id: 'warlock.dark-ones-blessing',
          event: { types: ['creature.reducedToZeroHitPoints'], subject: 'other' },
          window: 'immediate', authored: false
        }],
        narrative: [{
          text: 'When you reduce a hostile creature to 0 hit points you gain '
            + 'temporary hit points equal to your Charisma modifier plus your '
            + 'warlock level, minimum 1. Add them by hand — temporary hit '
            + 'points are not yet something a feature can grant.',
          dmPromptable: false
        }]
      })
    },
    {
      id: 'srd:subclass.fiend.dark-ones-own-luck', name: "Dark One's Own Luck",
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 6,
      effects: source({
        id: 'srd:subclass.fiend.dark-ones-own-luck', name: "Dark One's Own Luck",
        // The use is a resource and reads correctly. Adding a d10 to a roll
        // already made is not a `rollOp` — the pipeline can reroll a face and
        // can take the higher of two d20s, but it cannot introduce a second
        // die of a different size after the fact.
        completeness: 'partial',
        modifiers: [add(DARK_ONES_LUCK_MAX, 1, { note: 'once per short or long rest' })],
        resources: [{
          id: 'warlock.dark-ones-own-luck', name: "Dark One's Own Luck",
          max: DARK_ONES_LUCK_MAX, refresh: { kind: 'shortRest' },
          display: 'uses', group: 'The Fiend', order: 6
        }],
        actions: [{
          id: 'warlock.dark-ones-own-luck.use', name: "Dark One's Own Luck",
          kind: 'ability', cost: 'free',
          description: 'Add a d10 to an ability check or saving throw, after seeing '
            + 'the roll but before its effects.',
          requirements: { resourceAtLeast: ['warlock.dark-ones-own-luck', 1] },
          costs: { 'warlock.dark-ones-own-luck': 1 }
        }],
        narrative: [{
          text: 'Spend the use, roll a d10 yourself and add it to the check or '
            + 'save you just made. You may decide after seeing the d20 and '
            + 'before the roll takes effect.',
          dmPromptable: true
        }]
      })
    },
    {
      id: 'srd:subclass.fiend.fiendish-resilience', name: 'Fiendish Resilience',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 10,
      effects: source({
        id: 'srd:subclass.fiend.fiendish-resilience', name: 'Fiendish Resilience',
        // The choice is recorded; the resistance it grants is not. A resistance
        // modifier needs a concrete `resistance.<type>` path, and the type here
        // lives in the player's answer — no Predicate reads a selection, which
        // is the same wall Pact Boon and Resilient are already behind. The
        // alternative, thirteen toggled modifiers the player must keep mutually
        // exclusive, would be worse than saying so.
        completeness: 'partial',
        selections: [{
          id: 'resistance', prompt: 'Choose a damage type to resist', kind: 'other',
          count: 1,
          from: [
            'acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning',
            'necrotic', 'piercing', 'poison', 'psychic', 'radiant',
            'slashing', 'thunder'
          ]
        }],
        narrative: [{
          text: 'You gain resistance to the damage type you choose here until '
            + 'you choose a different one on a later rest. Damage from magical '
            + 'or silver weapons ignores it. The choice is recorded but the '
            + 'resistance is not applied — tell the DM.',
          dmPromptable: true
        }]
      })
    },
    {
      id: 'srd:subclass.fiend.hurl-through-hell', name: 'Hurl Through Hell',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 14,
      effects: source({
        id: 'srd:subclass.fiend.hurl-through-hell', name: 'Hurl Through Hell',
        // Everything this does happens to another creature, which is the wall
        // the whole theatre-of-the-mind design sits behind. The use is real.
        completeness: 'partial',
        modifiers: [add(HURL_THROUGH_HELL_MAX, 1, { note: 'once per long rest' })],
        resources: [{
          id: 'warlock.hurl-through-hell', name: 'Hurl Through Hell',
          max: HURL_THROUGH_HELL_MAX, refresh: { kind: 'longRest' },
          display: 'uses', group: 'The Fiend', order: 14
        }],
        actions: [{
          id: 'warlock.hurl-through-hell.use', name: 'Hurl Through Hell',
          kind: 'ability', cost: 'free',
          description: 'When you hit a creature, transport it through the lower planes.',
          requirements: { resourceAtLeast: ['warlock.hurl-through-hell', 1] },
          costs: { 'warlock.hurl-through-hell': 1 },
          targets: { selector: 'creature', count: 1 }
        }],
        narrative: [{
          text: 'The target vanishes and returns at the end of your next turn, '
            + 'taking 10d10 psychic damage unless it is a fiend. The DM rolls '
            + 'and applies that.',
          dmPromptable: true
        }]
      })
    }
  ]
}

// ===========================================================================
// Eldritch Invocations — feats, because that is what they are
// ===========================================================================
//
// A pool of options, each with its own prerequisite, chosen when you level and
// swappable later: that is FeatDefinition exactly. Authoring them as feats
// means the prerequisite is re-evaluated on every resolve, so an invocation
// whose requirement lapses reports itself inactive rather than silently
// applying — which is the behaviour the SRD asks for and which nothing here
// had to implement.
//
// Five of them, chosen to cover the four kinds the SRD digest identifies rather
// than to cover the list.

function invocation(
  iid: string, name: string, requiredLevel: number, effects: Partial<EffectSource>
): FeatDefinition {
  return {
    id: iid, name, provenance: 'srd', contentVersion: 1,
    sourceRef: 'SRD 5.1 Eldritch Invocations',
    prerequisite: { classLevelAtLeast: [WARLOCK, requiredLevel] },
    effects: source({ id: iid, name, kind: 'feat', ...effects })
  }
}

/** *Cast a spell at will without a slot* — a grant with no slot group and no cost. */
export const ARMOR_OF_SHADOWS = invocation(
  'srd:invocation.armor-of-shadows', 'Armor of Shadows', 2, {
    spells: [{
      spellIds: ['srd:spell.mage-armor'], availability: 'always', ability: 'cha'
    }],
    narrative: [{
      text: 'You can cast mage armor on yourself at will, without expending a '
        + 'spell slot or material components.',
      dmPromptable: false
    }]
  })

/** The same shape again, on a ritual spell. Two invocations, one mechanism. */
export const ELDRITCH_SIGHT = invocation(
  'srd:invocation.eldritch-sight', 'Eldritch Sight', 2, {
    spells: [{
      spellIds: ['srd:spell.detect-magic'], availability: 'always', ability: 'cha'
    }],
    narrative: [{
      text: 'You can cast detect magic at will, without expending a spell slot.',
      dmPromptable: false
    }]
  })

/** *Grant proficiency* — the plainest kind, and completely expressible. */
export const BEGUILING_INFLUENCE = invocation(
  'srd:invocation.beguiling-influence', 'Beguiling Influence', 2, {
    proficiencies: [
      { id: id(), category: { kind: 'skill', id: 'deception' }, level: 'proficient', rounding: 'floor', grantsProficiency: true },
      { id: id(), category: { kind: 'skill', id: 'persuasion' }, level: 'proficient', rounding: 'floor', grantsProficiency: true }
    ]
  })

/**
 * *Modify a specific cantrip* — Agonizing Blast.
 *
 * "Add your Charisma modifier to the damage it deals" is a real, exact number
 * on a real stat, so the modifier is real. What cannot be written is *which
 * damage*: a value-channel modifier carries no RollScope (the validator
 * rejects one), so there is no way to say "only eldritch blast". The modifier
 * is therefore gated on a player toggle, the same escape hatch Stonecunning
 * uses — it appears in every damage breakdown as not-applied-because-not-
 * toggled rather than being quietly absent or quietly always on.
 *
 * The SRD prerequisite is the eldritch blast cantrip rather than a level. No
 * Predicate asks whether a character knows a spell, so the gate here is the
 * level at which the invocation first becomes available, and the cantrip
 * requirement is stated in the narrative.
 */
export const AGONIZING_BLAST = invocation(
  'srd:invocation.agonizing-blast', 'Agonizing Blast', 2, {
    modifiers: [
      add(DAMAGE_WEAPON, { stat: abilityModifierPath('cha') }, {
        condition: { playerToggle: 'warlock.agonizing-blast' },
        note: 'Agonizing Blast: Charisma to eldritch blast damage'
      })
    ],
    narrative: [{
      text: 'Requires the eldritch blast cantrip. Toggle this on when rolling '
        + 'eldritch blast damage — once per beam — and off for everything '
        + 'else. Damage bonuses cannot yet name the spell they belong to.',
      toggleId: 'warlock.agonizing-blast', dmPromptable: true
    }]
  })

/**
 * *Grant a sense* — Devil's Sight.
 *
 * Nothing in the vocabulary describes vision: darkvision is narrative on every
 * species that has it, and "you can see normally in magical darkness" is a
 * statement about the world's lighting rather than about this character's
 * numbers. Narrative, and marked partial, rather than invented.
 */
export const DEVILS_SIGHT = invocation(
  'srd:invocation.devils-sight', "Devil's Sight", 2, {
    narrative: [{
      text: 'You can see normally in darkness, both magical and nonmagical, to '
        + 'a distance of 120 feet. Sight and lighting are not modelled.',
      dmPromptable: true
    }],
    completeness: 'partial'
  })

// ===========================================================================
// Kit
// ===========================================================================
//
// Empty on purpose. A warlock is proficient with light armour and simple
// weapons, and leather armour, the dagger and the handaxe already exist in
// srd.ts. The obvious addition would be a Rod of the Pact Keeper — statPaths.ts
// names it as the reason the save DC is a stat — but it is not in the SRD, and
// authoring it here would put non-SRD content behind an `srd:` id.

/**
 * The columns nothing reads yet: the levels at which the warlock takes an
 * Ability Score Improvement, and the Invocations Known column.
 *
 * Exported for the same reason MONK_TABLE and BARBARIAN_TABLE are — there is
 * no advancement flow to consume the ASI levels, and nothing counts how many
 * invocations a warlock is holding, because an invocation is a feat and feats
 * have no per-source budget.
 */
export const WARLOCK_TABLE = {
  asiLevels: WARLOCK_ASI_LEVELS,
  pactSlots: PACT_SLOT_COUNT,
  pactSlotLevel: PACT_SLOT_LEVEL,
  cantripsKnown: WARLOCK_CANTRIPS_KNOWN,
  spellsKnown: WARLOCK_SPELLS_KNOWN,
  invocationsKnown: WARLOCK_INVOCATIONS_KNOWN
}

export const WARLOCK_SUBCLASSES: SubclassDefinition[] = [FIEND]
export const WARLOCK_SPECIES: SpeciesDefinition[] = [TIEFLING]
export const WARLOCK_CLASSES: ClassDefinition[] = [WARLOCK_CLASS]
export const WARLOCK_ITEMS: ItemDefinition[] = []
export const WARLOCK_FEATS: FeatDefinition[] = [
  AGONIZING_BLAST, ARMOR_OF_SHADOWS, BEGUILING_INFLUENCE, DEVILS_SIGHT, ELDRITCH_SIGHT
]

/** Tagged with their class lists on the way out, as ALL_SPELLS does. */
export const WARLOCK_SPELLS: SpellDefinition[] = [
  { ...ELDRITCH_BLAST, lists: [WARLOCK_LIST] },
  // Chill Touch, Poison Spray and Charm Person are also genuinely on the SRD
  // sorcerer list (docs/srd/08-spell-lists.md), needed for the sorcerer's own
  // known-spells grant in classes-extra.ts — the sorcerer's cantrip pool would
  // otherwise be one spell short of what 1st level requires.
  { ...CHILL_TOUCH, lists: [WARLOCK_LIST, SORCERER_LIST, 'srd:list.wizard'] },
  // And on the druid list, which was missed — the druid cantrip pool held two
  // spells and the Cantrips Known column asks for four.
  { ...POISON_SPRAY, lists: [WARLOCK_LIST, SORCERER_LIST, DRUID_LIST, 'srd:list.wizard'] },
  { ...THAUMATURGY, lists: [CLERIC_LIST] },
  { ...CHARM_PERSON, lists: [WARLOCK_LIST, SORCERER_LIST, 'srd:list.bard', DRUID_LIST] },
  { ...HELLISH_REBUKE, lists: [WARLOCK_LIST] },
  { ...DARKNESS, lists: [WARLOCK_LIST] }
]
