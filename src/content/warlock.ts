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
  ItemDefinition, Modifier, ProficiencyGrant, SpellDefinition, SpeciesDefinition
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
const CLERIC_LIST = 'srd:list.cleric'

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

// PACT SLOTS.
//
// The SRD warlock has ONE pool of slots whose *level* rises with them: 1st at
// warlock 1-2, 2nd at 3-4, 3rd at 5-6. `ResourceDefinition.spellSlot.level` is
// a literal number, so one definition cannot say that. What it can say is that
// three pools exist and that two of them are always empty, because the
// *maximum* is a stat path and a stat path takes a formula and a predicate.
//
// So the counts below are the warlock table read sideways: at any level exactly
// one band's condition holds, and the other two pools resolve to a maximum of
// zero. The numbers a player sees are right at every level from 1 to 5, and the
// short-rest cadence, the slot group and the ability all come out of the
// existing vocabulary untouched.
//
// It is still three rows where the SRD has one, and the honest fix is one line
// in types.ts: `spellSlot?: { group: string; level: number | ValueExpr }`.
// Reported rather than made, because the file that would change is not mine.
const PACT_SLOTS_1_MAX = declareResourceMax('warlock.pact-slots.1')
const PACT_SLOTS_2_MAX = declareResourceMax('warlock.pact-slots.2')
const PACT_SLOTS_3_MAX = declareResourceMax('warlock.pact-slots.3')

/**
 * The warlock's candidate spells, level by level.
 *
 * A known caster's grant is a selection, and a selection needs candidates. The
 * two arrays are the warlock spell list as it exists in this content set — not
 * the whole SRD list, which is the same restriction the wizard's `fromList`
 * grant already lives under.
 */
const WARLOCK_CANTRIP_IDS = [
  'srd:spell.eldritch-blast', 'srd:spell.chill-touch', 'srd:spell.poison-spray'
]

const WARLOCK_SPELL_IDS = [
  'srd:spell.charm-person', 'srd:spell.hellish-rebuke', 'srd:spell.darkness'
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
const ORDINAL: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd', 4: '4th', 5: '5th' }

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
          prof({ kind: 'skill', id: 'arcana' }),
          prof({ kind: 'skill', id: 'deception' })
        ]
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
          // One slot at 1st level, two from 2nd — and the band ends at warlock
          // 3, where the pool's level rises and this pool ceases to exist.
          add(PACT_SLOTS_1_MAX, { min: [2, { classLevel: WARLOCK }] }, {
            condition: { not: { classLevelAtLeast: [WARLOCK, 3] } },
            note: '1 pact slot at 1st level, 2 from 2nd'
          }),
          add(PACT_SLOTS_2_MAX, 2, {
            condition: {
              all: [
                { classLevelAtLeast: [WARLOCK, 3] },
                { not: { classLevelAtLeast: [WARLOCK, 5] } }
              ]
            },
            note: 'pact slots become 2nd level at warlock 3'
          }),
          add(PACT_SLOTS_3_MAX, 2, {
            condition: { classLevelAtLeast: [WARLOCK, 5] },
            note: 'pact slots become 3rd level at warlock 5'
          })
        ],
        // `refresh: shortRest` already means "a short *or* a long rest" —
        // applyRest restores a short-rest resource on either. The cadence that
        // makes the warlock the warlock needed no new refresh rule.
        resources: [
          {
            id: 'warlock.pact-slots.1', name: 'Pact Slots (1st level)',
            max: PACT_SLOTS_1_MAX, refresh: { kind: 'shortRest' },
            display: 'slots', group: 'Pact Magic', order: 1,
            spellSlot: { group: 'pact', level: 1 }
          },
          {
            id: 'warlock.pact-slots.2', name: 'Pact Slots (2nd level)',
            max: PACT_SLOTS_2_MAX, refresh: { kind: 'shortRest' },
            display: 'slots', group: 'Pact Magic', order: 2,
            spellSlot: { group: 'pact', level: 2 }
          },
          {
            id: 'warlock.pact-slots.3', name: 'Pact Slots (3rd level)',
            max: PACT_SLOTS_3_MAX, refresh: { kind: 'shortRest' },
            display: 'slots', group: 'Pact Magic', order: 3,
            spellSlot: { group: 'pact', level: 3 }
          }
        ],
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
            + 'at that level — there is no casting a warlock spell down. The '
            + 'slot list offers the higher pools as choices because that is '
            + 'what upcasting means everywhere else; for you there is only '
            + 'ever one pool with anything in it.',
          dmPromptable: false
        }, {
          text: 'On each level-up you may replace one warlock spell you know '
            + 'with another you could learn. Re-answer the selection for the '
            + 'level whose spell you are trading away.',
          dmPromptable: false
        }]
      })
    },
    spellsKnownAt(2, 1),
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
          text: 'You know two eldritch invocations at 2nd level and three at '
            + '5th, and may swap one whenever you gain a warlock level. '
            + 'Invocations are taken as feats; nothing counts them for you, so '
            + 'check the number against your level when you take one.',
          dmPromptable: true
        }],
        completeness: 'partial'
      })
    },
    spellsKnownAt(3, 1),
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
    {
      id: 'srd:class.warlock.cantrip-3', name: 'Warlock Cantrips Known (4th level)',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 4,
      effects: source({
        id: 'srd:class.warlock.cantrip-3', name: 'Warlock Cantrips Known (4th level)',
        selections: [{
          id: 'cantrips', prompt: 'Choose 1 more warlock cantrip',
          kind: 'spellList', count: 1, from: WARLOCK_CANTRIP_IDS
        }],
        spells: [{ selectionId: 'cantrips', availability: 'always', ability: 'cha' }]
      })
    },
    spellsKnownAt(4, 1),
    spellsKnownAt(5, 1),
    // -----------------------------------------------------------------------
    // The Fiend — a subclass authored as ordinary class features, the way the
    // Life Domain and the School of Evocation already are.
    // -----------------------------------------------------------------------
    {
      id: 'srd:class.warlock.fiend.expanded-spells', name: 'The Fiend: Expanded Spell List',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:class.warlock.fiend.expanded-spells', name: 'The Fiend: Expanded Spell List',
        // "These spells are added to the warlock spell list for you" — it
        // widens the candidate set of a selection someone else declared, and
        // does not grant anything. `SelectionDefinition.from` is a fixed array
        // on the declaring source, so there is no vocabulary for widening it
        // from outside. A grant would be the wrong shape: an expanded-list
        // spell still has to be learned, and still costs a spell known.
        narrative: [{
          text: 'Burning hands and command (1st), blindness/deafness and '
            + 'scorching ray (2nd), fireball and stinking cloud (3rd), fire '
            + 'shield and wall of fire (4th), flame strike and hallow (5th) '
            + 'count as warlock spells for you. They are not granted — you '
            + 'still learn them as spells known.',
          dmPromptable: true
        }],
        completeness: 'partial'
      })
    },
    {
      id: 'srd:class.warlock.fiend.dark-ones-blessing', name: "Dark One's Blessing",
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:class.warlock.fiend.dark-ones-blessing', name: "Dark One's Blessing",
        // The trigger declares the window; nothing can declare what happens in
        // it. Temporary hit points are character state with no stat path and
        // no modifier op, so the amount — a perfectly ordinary ValueExpr — has
        // nowhere to be written down. It is stated in the narrative instead of
        // being approximated onto hitPoints.max, which would be a different
        // rule wearing this one's name.
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
        }],
        completeness: 'partial'
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

export const WARLOCK_SPECIES: SpeciesDefinition[] = [TIEFLING]
export const WARLOCK_CLASSES: ClassDefinition[] = [WARLOCK_CLASS]
export const WARLOCK_ITEMS: ItemDefinition[] = []
export const WARLOCK_FEATS: FeatDefinition[] = [
  AGONIZING_BLAST, ARMOR_OF_SHADOWS, BEGUILING_INFLUENCE, DEVILS_SIGHT, ELDRITCH_SIGHT
]

/** Tagged with their class lists on the way out, as ALL_SPELLS does. */
export const WARLOCK_SPELLS: SpellDefinition[] = [
  { ...ELDRITCH_BLAST, lists: [WARLOCK_LIST] },
  { ...CHILL_TOUCH, lists: [WARLOCK_LIST] },
  { ...POISON_SPRAY, lists: [WARLOCK_LIST] },
  { ...THAUMATURGY, lists: [CLERIC_LIST] },
  { ...CHARM_PERSON, lists: [WARLOCK_LIST] },
  { ...HELLISH_REBUKE, lists: [WARLOCK_LIST] },
  { ...DARKNESS, lists: [WARLOCK_LIST] }
]
