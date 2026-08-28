// Wood Elf Druid — the shape-changer, and the first class the vocabulary
// cannot finish.
//
// Everything a druid does with numbers is already ordinary: a d8 hit die, a
// WIS save DC, prepared casting from a whole class list, a two-use resource
// that comes back on a short rest. That part of this file looks exactly like
// the cleric's, which is the point.
//
// Wild Shape is the part that does not fit, and it does not fit in a way no
// amount of careful authoring repairs. The SRD replaces the character's
// statistics with a beast's; the pipeline in this codebase modifies a
// character's statistics. Those are different operations. Rather than
// approximate it — a `set` on Strength and a hopeful note — the feature below
// declares the resource and the action it genuinely has, hands the DM the
// substitution rules as narrative, and marks itself partial. See
// docs/srd/90-vocabulary-findings.md ("Wild Shape is entity substitution, not
// modification") and docs/srd/99-open-questions.md Q6, where the user already
// resolved this as v3, DM-supplied statblocks.

import type {
  ClassDefinition, ClassFeatureDefinition, EffectSource, ItemDefinition, Modifier, ProficiencyGrant,
  SpeciesDefinition, WeaponProfile, SubclassDefinition
} from '../rules/types.js'
import {
  abilityModifierPath, HP_MAX, PROFICIENCY_BONUS,
  SPELL_ATTACK, SPELL_SAVE_DC, SPELLS_PREPARED_MAX,
  movementCostPath, resistancePath, RESISTANCE_IMMUNE
} from '../rules/statPaths.js'
import { fullCasterSlots } from './progression.js'

/** The Druid table's slot columns, 1st through 9th. */
const DRUID_SLOTS = fullCasterSlots('srd:class.druid', 'druid')

const V = '2014'
let n = 0
const id = () => `dr${++n}`

function source(o: Partial<EffectSource> & { id: string; name: string }): EffectSource {
  return {
    provenance: 'srd', contentVersion: 1, kind: 'feature',
    activation: { always: true }, modifiers: [], completeness: 'complete',
    ...o
  }
}

const setTo = (target: string, value: Modifier['value'], extra: Partial<Modifier> = {}): Modifier =>
  ({ id: id(), channel: 'value', target, op: 'set', value, permanence: 'persistent', ...extra })

const add = (target: string, value: Modifier['value'], extra: Partial<Modifier> = {}): Modifier =>
  ({ id: id(), channel: 'value', target, op: 'add', value, permanence: 'persistent', ...extra })

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

/**
 * The druid spell list.
 *
 * Declared here rather than imported because `SPELL_LISTS` in spells.ts carries
 * only wizard, cleric and sorcerer, and this file may not edit that one. The
 * grant below is therefore mechanically correct and currently empty: four
 * spells already in the content set — *cure wounds*, *detect magic*,
 * *longstrider* and *protection from energy* — are on the SRD druid list
 * (docs/srd/08-spell-lists.md) but do not carry this id in their `lists` array.
 * Adding it there is a one-word data edit, not an engine change.
 */
const DRUID_ID = 'srd:class.druid'
const DRUID_LIST = 'srd:list.druid'

// ---------------------------------------------------------------------------
// The Druid table (SRD p19), transcribed
// ---------------------------------------------------------------------------

/** Cantrips Known: two, three from 4th, four from 10th. */
const DRUID_CANTRIPS_KNOWN = [
  2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4
]

/** The top of the slot ladder, which is as high as a druid can prepare. */
const DRUID_MAX_SPELL_LEVEL = [
  1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 9
]

/** The druid takes the standard five Ability Score Improvements. */
const DRUID_ASI_LEVELS = [4, 8, 12, 16, 19]

/** "Choose two from" — eight skills, and the player picks which two. */
const DRUID_SKILLS = [
  'arcana', 'animal-handling', 'insight', 'medicine', 'nature', 'perception',
  'religion', 'survival'
]

/**
 * The Beast Shapes table (SRD p20), which is three rows and not one sentence.
 *
 * Which beast a druid may become is the DM's to adjudicate — SRD 5.1 ships no
 * bestiary, so neither the statblocks nor the challenge ratings these rows key
 * off exist here. What the sheet can do is say which row the druid is on, and
 * that changes twice.
 */
const BEAST_SHAPES = [
  { level: 2, cr: '1/4', limits: 'no flying or swimming speed', example: 'a wolf' },
  { level: 4, cr: '1/2', limits: 'no flying speed', example: 'a crocodile' },
  { level: 8, cr: '1', limits: 'none', example: 'a giant eagle' }
] as const

/**
 * The Circle Spells tables (SRD p21-22), one land per row.
 *
 * These were previously recorded as "not listed in SRD 5.1 as extracted here",
 * which was true of the extraction and not of the document. They are here now
 * so the narrative can name a druid's actual spells rather than gesture at
 * them — none of these spells is in the content set yet, so naming them is all
 * that can be done, but naming them is a great deal more than not.
 */
const CIRCLE_SPELLS: Record<string, Record<number, string>> = {
  arctic: {
    3: 'hold person, spike growth', 5: 'sleet storm, slow',
    7: 'freedom of movement, ice storm', 9: 'commune with nature, cone of cold'
  },
  coast: {
    3: 'mirror image, misty step', 5: 'water breathing, water walk',
    7: 'control water, freedom of movement', 9: 'conjure elemental, scrying'
  },
  desert: {
    3: 'blur, silence', 5: 'create food and water, protection from energy',
    7: 'blight, hallucinatory terrain', 9: 'insect plague, wall of stone'
  },
  forest: {
    3: 'barkskin, spider climb', 5: 'call lightning, plant growth',
    7: 'divination, freedom of movement', 9: 'commune with nature, tree stride'
  },
  grassland: {
    3: 'invisibility, pass without trace', 5: 'daylight, haste',
    7: 'divination, freedom of movement', 9: 'dream, insect plague'
  },
  mountain: {
    3: 'spider climb, spike growth', 5: 'lightning bolt, meld into stone',
    7: 'stone shape, stoneskin', 9: 'passwall, wall of stone'
  },
  swamp: {
    3: 'acid arrow, darkness', 5: 'water walk, stinking cloud',
    7: 'freedom of movement, locate creature', 9: 'insect plague, scrying'
  }
}

const LANDS = Object.keys(CIRCLE_SPELLS)

// The pool a level-1 druid's "choose two cantrips" actually offers. Both
// spells are quote-checked and registered in spells.ts, tagged for this list.
// Every cantrip in the content set that is on the SRD druid list
// (docs/srd/08-spell-lists.md). Guidance and Resistance were authored for the
// cleric and correctly tagged for both lists; Poison Spray was tagged warlock
// and sorcerer and was missing the druid tag entirely, so a druid could not
// pick two of the four cantrips it already had access to. The Cantrips Known
// column asks for four by 10th level, and a Circle of the Land druid for five.
const DRUID_CANTRIP_POOL = [
  'srd:spell.druidcraft', 'srd:spell.mending', 'srd:spell.guidance',
  'srd:spell.resistance', 'srd:spell.poison-spray'
]

// ===========================================================================
// Class — Druid, levels 1-5
// ===========================================================================

/** One level-up's worth of new cantrips, from the Cantrips Known column. */
function cantripsKnownAt(level: number, count: number): ClassFeatureDefinition {
  const fid = `srd:class.druid.cantrips-known.${level}`
  const name = `Cantrips Known (level ${level})`
  return {
    id: fid, name, provenance: 'srd', contentVersion: 1, grantedAtLevel: level,
    effects: source({
      id: fid, name,
      selections: [{
        id: 'cantrips-known',
        prompt: `Learn ${count} more druid cantrip${count === 1 ? '' : 's'}`,
        kind: 'spellList', count, from: DRUID_CANTRIP_POOL
      }],
      spells: [{ selectionId: 'cantrips-known', availability: 'always', ability: 'wis' }]
    })
  }
}

const CANTRIP_FEATURES = DRUID_CANTRIPS_KNOWN
  .map((known, i) => {
    const level = i + 1
    if (level === 1) return undefined // Granted by the Cantrips feature itself.
    const delta = known - DRUID_CANTRIPS_KNOWN[i - 1]!
    return delta > 0 ? cantripsKnownAt(level, delta) : undefined
  })
  .filter((f): f is ClassFeatureDefinition => f !== undefined)

/**
 * The two Wild Shape improvements, at 4th and 8th.
 *
 * The SRD lists them in the Features column as "Wild Shape improvement", and
 * what improves is which row of the Beast Shapes table applies. Which beast is
 * the DM's call — there is no bestiary here and no engine for running a
 * character from a second statblock — but the sheet can say which row the
 * druid is on, and it changes twice.
 */
const WILD_SHAPE_IMPROVEMENTS = BEAST_SHAPES
  .filter((row) => row.level > 2)
  .map((row): ClassFeatureDefinition => {
    const fid = `srd:class.druid.wild-shape-improvement.${row.level}`
    const name = `Wild Shape Improvement (level ${row.level})`
    return {
      id: fid, name, provenance: 'srd', contentVersion: 1, grantedAtLevel: row.level,
      effects: source({
        id: fid, name,
        completeness: 'partial',
        narrative: [{
          text: `Your Wild Shape may now take the form of a beast of challenge `
            + `rating ${row.cr} or lower, with ${row.limits === 'none' ? 'no restriction on its speeds' : row.limits}`
            + ` — ${row.example}, for example.`,
          dmPromptable: true
        }]
      })
    }
  })

/**
 * Circle Spells, at 3rd, 5th, 7th and 9th.
 *
 * The land is a selection and the spells depend on it, which is the exact
 * thing a SpellGrant cannot say: it has no `condition`, and `spellIds` is a
 * fixed array with no way to branch on an answer. The mechanism the spells
 * themselves need does exist and is proven — the cleric's domain spells are
 * `availability: 'always'` with a slot group, which is precisely "always
 * prepared and not counted against the limit". It is only the
 * selection-dependent membership that is missing, and none of these
 * twenty-eight spells is in the content set yet regardless.
 *
 * What changed is that the sets are no longer unknown. A previous note here
 * read "not listed in SRD 5.1 as extracted here", which was true of the
 * extraction and not of the document — so each level now names the actual
 * spells for every land instead of gesturing at them.
 */
const CIRCLE_SPELL_FEATURES = ([3, 5, 7, 9] as const).map(
  (level): ClassFeatureDefinition => {
    const fid = `srd:subclass.circle-of-the-land.circle-spells.${level}`
    const name = `Circle Spells (level ${level})`
    const byLand = LANDS.map((land) => `${land}: ${CIRCLE_SPELLS[land]![level]}`).join('; ')
    return {
      id: fid, name, provenance: 'srd', contentVersion: 1, grantedAtLevel: level,
      effects: source({
        id: fid, name,
        completeness: 'partial',
        ...(level === 3
          ? {
            selections: [{
              id: 'land', prompt: 'Which land is your circle bound to?',
              kind: 'other' as const, count: 1, from: [...LANDS]
            }]
          }
          : {}),
        narrative: [{
          text: `Your land grants you two spells at ${level}th level. They are `
            + 'always prepared and do not count against the number you can '
            + `prepare. ${byLand}. A spell grant cannot yet vary with a chosen `
            + 'option and none of these spells is in the content set, so add '
            + 'yours as always-prepared by hand.',
          dmPromptable: true
        }]
      })
    }
  })

export const DRUID: ClassDefinition = {
  id: 'srd:class.druid', name: 'Druid', provenance: 'srd', contentVersion: 1,
  hitDie: 8, savingThrowProficiencies: ['int', 'wis'],
  subclassSlot: { grantedAtLevel: 2, options: ['srd:subclass.circle-of-the-land'] },
  features: [
    {
      id: 'srd:class.druid.proficiencies', name: 'Druid Proficiencies',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:class.druid.proficiencies', name: 'Druid Proficiencies',
        modifiers: [
          add(HP_MAX, {
            sum: [
              8, { product: [5, { sum: [{ characterLevel: true }, -1] }] },
              { product: [{ stat: abilityModifierPath('con') }, { characterLevel: true }] }
            ]
          }, { note: 'd8 hit die: 5 per level after the first, +8 at 1st, + CON per level' })
        ],
        proficiencies: [
          prof({ kind: 'save', ability: 'int' }),
          prof({ kind: 'save', ability: 'wis' }),
          prof({ kind: 'armor', category: 'light' }),
          prof({ kind: 'armor', category: 'medium' }),
          prof({ kind: 'armor', category: 'shield' }),
          // Ten weapons named one by one, and deliberately not
          // `weaponCategory: 'simple'`. The SRD gives the druid a *list*, not a
          // category: the scimitar on it is martial, and four simple weapons
          // that are not on it (greatclub, handaxe, light hammer, light
          // crossbow, shortbow) would arrive free with a category grant. The
          // rogue's four named martial exceptions are the same problem read
          // from the other end.
          prof({ kind: 'weapon', itemId: 'srd:weapon.club' }),
          prof({ kind: 'weapon', itemId: 'srd:weapon.dagger' }),
          prof({ kind: 'weapon', itemId: 'srd:weapon.dart' }),
          prof({ kind: 'weapon', itemId: 'srd:weapon.javelin' }),
          prof({ kind: 'weapon', itemId: 'srd:weapon.mace' }),
          prof({ kind: 'weapon', itemId: 'srd:weapon.quarterstaff' }),
          prof({ kind: 'weapon', itemId: 'srd:weapon.scimitar' }),
          prof({ kind: 'weapon', itemId: 'srd:weapon.sickle' }),
          prof({ kind: 'weapon', itemId: 'srd:weapon.sling' }),
          prof({ kind: 'weapon', itemId: 'srd:weapon.spear' }),
          prof({ kind: 'tool', id: 'herbalism-kit' }),
          // "Choose two from" — eight of them, and which two is the player's.
          // This used to be Nature and Animal Handling for every druid the
          // content could produce.
          chosenProf('skill', 'skills')
        ],
        selections: [{
          id: 'skills', prompt: 'Choose two druid skills', kind: 'skill', count: 2,
          from: DRUID_SKILLS
        }],
        narrative: [{
          // The SRD states the taboo and states no penalty for breaking it. A
          // modifier here would be a house rule wearing SRD provenance.
          text: 'Druids will not wear armour or use shields made of metal. The '
            + 'SRD attaches no mechanical penalty to doing so, so none is applied '
            + 'here — it is a matter for the table.',
          dmPromptable: true
        }]
      })
    },
    {
      id: 'srd:class.druid.druidic', name: 'Druidic',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:class.druid.druidic', name: 'Druidic',
        // A language is the one thing on a race or class entry that
        // ProficiencyCategory has no kind for — skill, tool, save, armour and
        // weapon are the whole list. So Druidic cannot be granted, only
        // described, and the DC 15 check to spot a hidden message has no
        // proficiency to hang off.
        narrative: [{
          text: 'You know Druidic, the secret language of druids, and can leave '
            + 'hidden messages in it. Another creature spots that a message is '
            + 'there only on a DC 15 Wisdom (Perception) check, and cannot read '
            + 'it without magic.',
          dmPromptable: true
        }],
        completeness: 'partial'
      })
    },
    {
      id: 'srd:class.druid.spellcasting', name: 'Spellcasting',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:class.druid.spellcasting', name: 'Spellcasting',
        modifiers: [
          // Identical in shape to the cleric's and the wizard's, differing only
          // in which ability modifier feeds it. That it is three modifiers on an
          // ordinary stat rather than a formula inside a caster is what lets an
          // item raise it later.
          { id: id(), channel: 'value', target: SPELL_SAVE_DC, op: 'base', value: 8, permanence: 'persistent' },
          add(SPELL_SAVE_DC, { stat: PROFICIENCY_BONUS }),
          add(SPELL_SAVE_DC, { stat: abilityModifierPath('wis') }, { note: 'Wisdom' }),
          add(SPELL_ATTACK, { stat: PROFICIENCY_BONUS }),
          add(SPELL_ATTACK, { stat: abilityModifierPath('wis') }, { note: 'Wisdom' }),
          add(SPELLS_PREPARED_MAX, {
            max: [1, {
              sum: [
                { stat: abilityModifierPath('wis') },
                { classLevel: 'srd:class.druid' }
              ]
            }]
          }, { note: 'Wisdom modifier + druid level, minimum 1' }),
          {
            id: id(), channel: 'capability', capability: 'castSpells',
            capOp: 'grant', permanence: 'persistent'
          },
          ...DRUID_SLOTS.modifiers
        ],
        // The full ladder, 1st through 9th, read off the Druid table rather
        // than frozen at one row.
        resources: DRUID_SLOTS.resources,
        // Prepared casting from the whole class list, which is the cleric's
        // grant with one identifier changed. The druid's spellbook is the list
        // itself; nothing about "prepared" is class knowledge.
        // As high as the slot ladder reaches, not frozen at 3rd — the same
        // column the cleric's grant already reads.
        spells: [{
          fromList: {
            listId: DRUID_LIST,
            maxLevel: { classLevelTable: { classId: DRUID_ID, values: DRUID_MAX_SPELL_LEVEL } }
          },
          availability: 'prepared', slotGroup: 'druid', ability: 'wis'
        }]
      })
    },
    {
      id: 'srd:class.druid.cantrips', name: 'Cantrips',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:class.druid.cantrips', name: 'Cantrips',
        // Split out of Spellcasting on purpose. Marking a source partial flags
        // every stat it touches as incomplete, and the save DC above is exact —
        // it must not inherit this feature's doubts.
        //
        // 'spellList' is a real SelectionDefinition kind — the bard grant next
        // door already uses it correctly. This used 'other' with no pool at
        // all, which made "choose two" unanswerable by construction.
        //
        // `count` is a plain number and the Cantrips Known column moves, which
        // was recorded here as a gap. It is not one: the column is authored as
        // one feature per level-up that raises it, the way the cleric's, the
        // bard's and the warlock's already are. See CANTRIP_FEATURES below.
        selections: [{
          id: 'cantrips-known',
          prompt: 'Which two druid cantrips do you know?',
          kind: 'spellList', count: 2, from: DRUID_CANTRIP_POOL
        }],
        spells: [{
          selectionId: 'cantrips-known', availability: 'always', ability: 'wis'
        }],
        narrative: [{
          text: 'Five druid cantrips are in this content set so far, which is '
            + 'the full choice on offer; more arriving later widens it without '
            + 'touching this file.',
          dmPromptable: false
        }],
        completeness: 'partial'
      })
    },
    {
      id: 'srd:class.druid.wild-shape', name: 'Wild Shape',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 2,
      effects: source({
        id: 'srd:class.druid.wild-shape', name: 'Wild Shape',
        // What is genuinely expressible: a resource and two actions. Both uses
        // return on a short *or* long rest, which is the same wording Channel
        // Divinity already carries, and `shortRest` is how this file set spells
        // it — the shorter rest is the binding one.
        resources: [{
          id: 'druid.wild-shape', name: 'Wild Shape', max: 2,
          refresh: { kind: 'shortRest' }, display: 'uses', order: 20
        }],
        actions: [
          {
            id: 'druid.wild-shape.transform', name: 'Wild Shape', cost: 'action',
            kind: 'ability',
            description: 'Assume the form of a beast you have seen before.',
            requirements: { resourceAtLeast: ['druid.wild-shape', 1] },
            costs: { 'druid.wild-shape': 1 }
          },
          {
            // Reverting is free of the resource: the SRD spends a use on
            // entering the form, never on leaving it.
            id: 'druid.wild-shape.revert', name: 'Revert to Your True Form',
            cost: 'bonusAction', kind: 'ability',
            description: 'Return to your normal form.',
            requirements: { always: true }
          }
        ],
        // Everything below is narrative because the alternative is fiction.
        //
        // The pipeline in this codebase answers "what modifies this character's
        // statistics". Wild Shape asks "whose statistics are these" — the
        // druid's numbers are not adjusted, they are stood down and a beast's
        // are stood up in their place, with a named list of things that carry
        // across. That needs a form stack the engine does not have: a true form,
        // an active form, and fall-through rules per stat. `op: 'replace'`
        // overrides one declared path at the end of one resolution; it cannot
        // swap hit points, Hit Dice, size, senses and a set of attacks at once,
        // and hit points are character state rather than a stat path anyway, so
        // "excess damage carries over" has nowhere to live.
        //
        // And there is no beast to become: SRD 5.1 ships no bestiary, so both
        // the statblock and the challenge rating the level limits key off are
        // absent. docs/srd/99-open-questions.md Q6 settles this — the feature
        // spends its uses here and points at a DM-supplied statblock.
        narrative: [
          {
            text: 'You take on the form of a beast you have seen before. At 2nd '
              + 'level the beast may be challenge rating 1/4 or lower and may have '
              + 'neither a flying nor a swimming speed; at 4th level, CR 1/2 or '
              + 'lower with no flying speed. You stay in the form for hours equal '
              + 'to half your druid level rounded down, then revert — or revert '
              + 'earlier as a bonus action, and automatically if you fall '
              + 'unconscious, drop to 0 hit points, or die.',
            dmPromptable: true
          },
          {
            text: 'In the form your game statistics are replaced by the beast\'s, '
              + 'except that you keep your alignment, personality, Intelligence, '
              + 'Wisdom and Charisma. You keep all your skill and saving throw '
              + 'proficiencies as well as the beast\'s, and use whichever bonus is '
              + 'higher. You take on the beast\'s hit points and Hit Dice; when you '
              + 'revert you return to the hit points you had before, and any damage '
              + 'beyond what the beast\'s form could take carries over to you.',
            dmPromptable: true
          },
          {
            text: 'You cannot cast spells while transformed, though concentration '
              + 'on a spell already cast continues. You keep the benefit of any '
              + 'class, racial or other feature the new form is physically capable '
              + 'of using, and lose special senses such as darkvision unless the '
              + 'form has them. Your equipment falls to the ground, merges into the '
              + 'form, or is worn by it if the form can wear it; merged equipment '
              + 'has no effect until you revert.',
            dmPromptable: true
          },
          {
            text: 'The beast\'s statistics are not modelled. SRD 5.1 contains no '
              + 'bestiary, so neither the statblocks nor the challenge ratings the '
              + 'limits above key off exist in this content set, and the engine has '
              + 'no way to run a character from a second statblock. Run the form '
              + 'from a statblock at the table; the uses are tracked here.',
            dmPromptable: true
          }
        ],
        completeness: 'partial'
      })
    },
    // The Cantrips Known column, one level-up per row that rises.
    ...CANTRIP_FEATURES,

    // --- 4th and 8th -------------------------------------------------------
    ...WILD_SHAPE_IMPROVEMENTS,

    // --- 18th --------------------------------------------------------------
    {
      id: 'srd:class.druid.timeless-body', name: 'Timeless Body',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 18,
      effects: source({
        id: 'srd:class.druid.timeless-body', name: 'Timeless Body',
        // Ageing is not modelled and does not need to be. Nothing mechanical
        // is missing here — there is simply nothing mechanical to express — so
        // this is complete, not partial.
        narrative: [{
          text: 'For every 10 years that pass, your body ages only 1 year.',
          dmPromptable: false
        }]
      })
    },
    {
      id: 'srd:class.druid.beast-spells', name: 'Beast Spells',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 18,
      effects: source({
        id: 'srd:class.druid.beast-spells', name: 'Beast Spells',
        // "You cannot cast spells while transformed" was never a revoke — Wild
        // Shape is run from a statblock at the table, not by the engine — so
        // lifting it is not a modifier either. It is a rule about a state the
        // app does not hold.
        completeness: 'partial',
        narrative: [{
          text: 'You can cast druid spells while in a beast shape, performing '
            + 'the verbal and somatic components — but not material ones.',
          dmPromptable: true
        }]
      })
    },

    // --- 20th --------------------------------------------------------------
    {
      id: 'srd:class.druid.archdruid', name: 'Archdruid',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 20,
      effects: source({
        id: 'srd:class.druid.archdruid', name: 'Archdruid',
        // The uses become unlimited, which a resource maximum cannot say — the
        // same wall the barbarian's Rages column hits at 20th. The component
        // half is not modelled either: spell components are descriptive text on
        // a SpellDefinition, not something a modifier can waive.
        completeness: 'partial',
        narrative: [{
          text: 'Your Wild Shape is now unlimited — the use track still shows '
            + 'two, which is the 19th-level answer, so ignore it from here. You '
            + 'may also ignore the verbal and somatic components of your druid '
            + 'spells, and any material component that has no cost and is not '
            + 'consumed, in either shape.',
          dmPromptable: false
        }]
      })
    }
  ]
}

// ===========================================================================
// Subclass — Circle of the Land (SRD p21-22)
// ===========================================================================
//
// It was authored as three class features every druid received whether or not
// they had joined the circle, while the class *also* declared a subclass slot
// pointing at a `srd:subclass.circle-of-the-land` nobody had defined. The
// cleric's Life Domain, the bard's College of Lore, the rogue's Thief, the
// barbarian's Berserker and the warlock's Fiend were all in the same shape.
// This is the last of them.

export const CIRCLE_OF_THE_LAND: SubclassDefinition = {
  id: 'srd:subclass.circle-of-the-land', name: 'Circle of the Land',
  provenance: 'srd', contentVersion: 1,
  classId: DRUID_ID,
  features: [
    {
      id: 'srd:subclass.circle-of-the-land.bonus-cantrip', name: 'Bonus Cantrip',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 2,
      effects: source({
        id: 'srd:subclass.circle-of-the-land.bonus-cantrip', name: 'Bonus Cantrip',
        // A subclass granting an extra cantrip is the Cantrips feature again
        // with a count of one. It used `kind: 'other'` with no pool, which made
        // the question unanswerable; it draws from the same pool as the class.
        selections: [{
          id: 'bonus-cantrip', prompt: 'Learn one more druid cantrip',
          kind: 'spellList', count: 1, from: DRUID_CANTRIP_POOL
        }],
        spells: [{
          selectionId: 'bonus-cantrip', availability: 'always', ability: 'wis'
        }]
      })
    },
    {
      id: 'srd:subclass.circle-of-the-land.natural-recovery', name: 'Natural Recovery',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 2,
      effects: source({
        id: 'srd:subclass.circle-of-the-land.natural-recovery', name: 'Natural Recovery',
        // A resource whose spending restores another resource, and a choice of
        // which. Arcane Recovery and the warlock's Eldritch Master have the
        // identical shape and the identical gap: `costs` names what an action
        // spends, never what it gives back, so the slots are restored by hand.
        completeness: 'partial',
        resources: [{
          id: 'druid.natural-recovery', name: 'Natural Recovery', max: 1,
          refresh: { kind: 'longRest' }, display: 'uses', order: 21
        }],
        actions: [{
          id: 'druid.natural-recovery.use', name: 'Natural Recovery',
          cost: { minutes: 1 }, kind: 'ability',
          description: 'On a short rest, recover expended spell slots totalling half '
            + 'your druid level, rounded up.',
          requirements: { resourceAtLeast: ['druid.natural-recovery', 1] },
          costs: { 'druid.natural-recovery': 1 }
        }],
        narrative: [{
          text: 'Choose expended spell slots to recover with a combined level '
            + 'equal to or less than half your druid level rounded up, none of '
            + 'them 6th level or higher. Restore them from the resource list. '
            + 'Once per long rest.',
          dmPromptable: true
        }]
      })
    },
    ...CIRCLE_SPELL_FEATURES,
    {
      id: 'srd:subclass.circle-of-the-land.lands-stride', name: "Land's Stride",
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 6,
      effects: source({
        id: 'srd:subclass.circle-of-the-land.lands-stride', name: "Land's Stride",
        // Two of the three halves are ordinary. Difficult terrain has a
        // declared movement-cost path, and "advantage on saves against plants
        // that impede movement" is a roll scope with a tag — the same shape the
        // halfling's advantage against frightened already uses.
        completeness: 'partial',
        modifiers: [
          {
            id: id(), channel: 'value', target: movementCostPath('difficultTerrain'),
            op: 'set', value: 1, permanence: 'persistent',
            note: 'nonmagical difficult terrain costs no extra movement'
          },
          {
            id: id(), channel: 'roll', rollOp: 'advantage',
            scope: { kinds: ['save'], againstTags: ['plant'] },
            permanence: 'persistent',
            note: "Land's Stride: against plants that impede movement"
          }
        ],
        narrative: [{
          text: 'You also pass through nonmagical plants without being slowed '
            + 'and without taking damage from thorns or spines. The movement '
            + 'saving applies to nonmagical difficult terrain only; the engine '
            + 'does not distinguish magical terrain from mundane, so turn it off '
            + 'at the table if it matters.',
          dmPromptable: true
        }]
      })
    },
    {
      id: 'srd:subclass.circle-of-the-land.natures-ward', name: "Nature's Ward",
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 10,
      effects: source({
        id: 'srd:subclass.circle-of-the-land.natures-ward', name: "Nature's Ward",
        // Poison immunity is a resistance path and resolves, exactly as the
        // monk's Purity of Body does. Disease is not modelled at all — there is
        // no disease vocabulary — and "cannot be charmed or frightened *by
        // elementals or fey*" is a condition immunity conditioned on who
        // applied it, which nothing records.
        completeness: 'partial',
        modifiers: [
          setTo(resistancePath('poison'), RESISTANCE_IMMUNE, { note: "Nature's Ward" })
        ],
        narrative: [{
          text: 'You are also immune to disease, and cannot be charmed or '
            + 'frightened by elementals or fey. Disease is not modelled, and '
            + 'nothing records which kind of creature applied a condition — so '
            + 'those two are the DM\'s to honour. The poison immunity is real.',
          dmPromptable: true
        }]
      })
    },
    {
      id: 'srd:subclass.circle-of-the-land.natures-sanctuary', name: "Nature's Sanctuary",
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 14,
      effects: source({
        id: 'srd:subclass.circle-of-the-land.natures-sanctuary', name: "Nature's Sanctuary",
        // The DC is the druid's own spell save DC, which already resolves and
        // is already on the sheet. Everything else happens to another creature.
        completeness: 'partial',
        narrative: [{
          text: 'When a beast or plant attacks you it must make a Wisdom saving '
            + 'throw against your spell save DC. On a failure it must choose a '
            + 'different target or the attack misses; on a success it is immune '
            + 'for 24 hours. The creature knows this before it attacks. The DM '
            + 'rolls the save against the DC on your sheet.',
          dmPromptable: true
        }]
      })
    }
  ]
}

// ===========================================================================
// Kit
//
// The dagger already exists in srd.ts and the mace in party.ts. The other eight
// weapons on the druid's list do not, so they are defined here from the
// docs/srd/04-equipment.md weapons table.
// ===========================================================================

function weapon(wid: string, name: string, profile: WeaponProfile): ItemDefinition {
  return {
    id: wid, name, provenance: 'srd', contentVersion: 1, rulesetVersion: V,
    category: 'weapon', slot: 'mainHand', weapon: profile,
    effects: source({ id: wid, name, kind: 'item' })
  }
}

export const CLUB = weapon('srd:weapon.club', 'Club', {
  category: 'simple', reach: 'melee',
  damage: { count: 1, sides: 4 }, damageType: 'bludgeoning',
  properties: ['light']
})

export const DART = weapon('srd:weapon.dart', 'Dart', {
  // A ranged weapon with finesse, which reads oddly until you notice that
  // finesse is what lets a thrown dart use Dexterity at all.
  category: 'simple', reach: 'ranged',
  damage: { count: 1, sides: 4 }, damageType: 'piercing',
  properties: ['finesse', 'thrown'],
  normalRangeFeet: 20, longRangeFeet: 60
})

// Javelin lives in barbarian.ts, which registers an identical definition;
// duplicating it here would be a second source of truth for one SRD weapon.
export const QUARTERSTAFF = weapon('srd:weapon.quarterstaff', 'Quarterstaff', {
  category: 'simple', reach: 'melee',
  damage: { count: 1, sides: 6 }, damageType: 'bludgeoning',
  properties: ['versatile'], versatileDamage: { count: 1, sides: 8 }
})

export const SCIMITAR = weapon('srd:weapon.scimitar', 'Scimitar', {
  // The only martial weapon on the druid's list, and the reason that list is
  // ten named grants instead of one category grant.
  category: 'martial', reach: 'melee',
  damage: { count: 1, sides: 6 }, damageType: 'slashing',
  properties: ['finesse', 'light']
})

export const SICKLE = weapon('srd:weapon.sickle', 'Sickle', {
  category: 'simple', reach: 'melee',
  damage: { count: 1, sides: 4 }, damageType: 'slashing',
  properties: ['light']
})

export const SLING = weapon('srd:weapon.sling', 'Sling', {
  category: 'simple', reach: 'ranged',
  damage: { count: 1, sides: 4 }, damageType: 'bludgeoning',
  properties: ['ammunition'],
  normalRangeFeet: 30, longRangeFeet: 120
})

export const SPEAR = weapon('srd:weapon.spear', 'Spear', {
  category: 'simple', reach: 'melee',
  damage: { count: 1, sides: 6 }, damageType: 'piercing',
  properties: ['thrown', 'versatile'], versatileDamage: { count: 1, sides: 8 },
  normalRangeFeet: 20, longRangeFeet: 60
})

/**
 * A druidic focus.
 *
 * Carries no modifiers, and that is not an oversight. What a focus does is
 * stand in for the material components of a spell, and nothing in the
 * vocabulary models components at all: `SpellDefinition.components` records
 * them, but no effect can satisfy or waive one. So the item exists to be
 * carried and named, and says as much.
 */
export const DRUIDIC_FOCUS: ItemDefinition = {
  id: 'srd:item.druidic-focus', name: 'Druidic Focus (Sprig of Mistletoe)',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'gear', slot: 'offHand',
  effects: source({
    id: 'srd:item.druidic-focus', name: 'Druidic Focus (Sprig of Mistletoe)', kind: 'item',
    narrative: [{
      text: 'A sprig of mistletoe, a totem, a yew wand or a wooden staff. You '
        + 'can use it in place of the material components of a druid spell, '
        + 'except components that have a cost listed. Component substitution is '
        + 'not modelled, so this is a note rather than a rule.',
      dmPromptable: false
    }],
    completeness: 'partial'
  })
}

// Wood Elf lives on srd:species.elf's own subspecies array in wizard.ts —
// merged there rather than duplicated here, once every parallel content agent
// had finished and there was no longer a collision risk in editing that file.
/**
 * The columns nothing reads yet: the levels at which the druid takes an
 * Ability Score Improvement, and the Beast Shapes table.
 *
 * Exported for the same reason MONK_TABLE and BARBARIAN_TABLE are — there is
 * no advancement flow to consume the ASI levels, and no bestiary for the
 * challenge ratings to point at.
 */
export const DRUID_TABLE = {
  asiLevels: DRUID_ASI_LEVELS,
  cantripsKnown: DRUID_CANTRIPS_KNOWN,
  maxSpellLevel: DRUID_MAX_SPELL_LEVEL,
  beastShapes: BEAST_SHAPES,
  circleSpells: CIRCLE_SPELLS
}

export const DRUID_SUBCLASSES: SubclassDefinition[] = [CIRCLE_OF_THE_LAND]
export const DRUID_SPECIES: SpeciesDefinition[] = []
export const DRUID_CLASSES: ClassDefinition[] = [DRUID]
export const DRUID_ITEMS: ItemDefinition[] = [
  CLUB, DART, QUARTERSTAFF, SCIMITAR, SICKLE, SLING, SPEAR, DRUIDIC_FOCUS
]
