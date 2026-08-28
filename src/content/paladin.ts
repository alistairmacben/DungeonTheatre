// Paladin, levels 1 to 20, and the Oath of Devotion.
//
// It lived in classes-extra.ts as three features and stopped at 1st level, with
// no spellcasting at all and no subclass slot — the largest single hole left in
// the class list. It is the first half caster the content set has: no slots at
// 1st, never past 5th, and everything prepared from the class list with
// Charisma.
//
// Two things here are worth naming because neither was obvious:
//
// 1. The auras are the first features whose *self* half is fully expressible
//    while their *ally* half is not. Aura of Protection adds Charisma to the
//    paladin's own saves as an ordinary modifier and says the rest; Aura of
//    Courage and Aura of Devotion suppress the frightened and charmed
//    conditions on the paladin the same way Mindless Rage does. Marking them
//    wholly narrative would have thrown away the half that works.
//
// 2. Divine Smite is the fourth feature in the set to want "add N dice to a
//    damage roll" and the fourth not to get it. Sneak Attack, Brutal Critical
//    and Savage Attacks are the others. That is now a queue, not an anecdote.
//
// Checked against docs/srd-source/classes.pdf p30-34.

import type {
  ClassDefinition, ClassFeatureDefinition, EffectSource, Modifier,
  ProficiencyGrant, SubclassDefinition
} from '../rules/types.js'
import {
  abilityModifierPath, ARMOR_CLASS, ATTACK_ROLL, DAMAGE_WEAPON,
  declareResourceMax, HP_MAX, PROFICIENCY_BONUS, SAVE_ROLL, SPELL_ATTACK,
  SPELL_SAVE_DC, SPELLS_PREPARED_MAX
} from '../rules/statPaths.js'
import { halfCasterSlots, HALF_CASTER_MAX_SPELL_LEVEL, ordinal } from './progression.js'

const PALADIN_ID = 'srd:class.paladin'

let n = 0
const id = (): string => `pl${++n}`

function source(o: Partial<EffectSource> & { id: string; name: string }): EffectSource {
  return {
    provenance: 'srd', contentVersion: 1, kind: 'feature',
    activation: { always: true }, modifiers: [], completeness: 'complete',
    ...o
  }
}

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

// ---------------------------------------------------------------------------
// The Paladin table (SRD p30), transcribed
// ---------------------------------------------------------------------------

/** The paladin is a half caster: no slots at 1st, never past 5th. */
const PALADIN_SLOTS = halfCasterSlots(PALADIN_ID, 'paladin')

/** The paladin takes the standard five Ability Score Improvements. */
const PALADIN_ASI_LEVELS = [4, 8, 12, 16, 19]

/** "Choose two from" — six skills, and the player picks which two. */
const PALADIN_SKILLS = [
  'athletics', 'insight', 'intimidation', 'medicine', 'persuasion', 'religion'
]

/**
 * The four Fighting Styles a paladin may take.
 *
 * The fighter's six minus Archery and Two-Weapon Fighting. The toggles are the
 * fighter's own `fighter.style.<id>` on purpose: a paladin who multiclasses
 * into fighter must not end up with two switches for one decision, the same
 * reason the barbarian reuses `wearing-heavy-armor`.
 */
const PALADIN_STYLES = ['defense', 'dueling', 'great-weapon', 'protection']

const styleToggle = (styleId: string): string => `fighter.style.${styleId}`

const LAY_ON_HANDS_MAX = declareResourceMax('layOnHands')
const DIVINE_SENSE_MAX = declareResourceMax('divineSense')
const CLEANSING_TOUCH_MAX = declareResourceMax('paladin.cleansing-touch')
const CHANNEL_DIVINITY_MAX = declareResourceMax('paladin.channel-divinity')
const HOLY_NIMBUS_MAX = declareResourceMax('paladin.holy-nimbus')

/** "your Charisma modifier (with a minimum bonus of +1)", as a formula. */
const CHA_MIN_ONE = { max: [1, { stat: abilityModifierPath('cha') }] }

// ===========================================================================
// Class — Paladin
// ===========================================================================

export const PALADIN: ClassDefinition = {
  id: PALADIN_ID, name: 'Paladin', provenance: 'srd', contentVersion: 1,
  hitDie: 10, savingThrowProficiencies: ['wis', 'cha'],
  subclassSlot: { grantedAtLevel: 3, options: ['srd:subclass.devotion'] },
  features: [
    {
      id: 'srd:class.paladin.core', name: 'Paladin Training',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:class.paladin.core', name: 'Paladin Training',
        modifiers: [
          add(HP_MAX, {
            sum: [
              10, { product: [6, { sum: [{ characterLevel: true }, -1] }] },
              { product: [{ stat: abilityModifierPath('con') }, { characterLevel: true }] }
            ]
          }, { note: 'd10 hit die: 6 per level after the first, +10 at 1st, + CON per level' })
        ],
        proficiencies: [
          prof({ kind: 'save', ability: 'wis' }),
          prof({ kind: 'save', ability: 'cha' }),
          prof({ kind: 'armor', category: 'light' }),
          prof({ kind: 'armor', category: 'medium' }),
          prof({ kind: 'armor', category: 'heavy' }),
          prof({ kind: 'armor', category: 'shield' }),
          prof({ kind: 'weaponCategory', category: 'simple' }),
          prof({ kind: 'weaponCategory', category: 'martial' }),
          // "Choose two from" — six of them, and which two is the player's.
          // This used to be Religion and Athletics for every paladin the
          // content could produce.
          chosenProf('skill', 'skills')
        ],
        selections: [{
          id: 'skills', prompt: 'Choose two paladin skills', kind: 'skill', count: 2,
          from: PALADIN_SKILLS
        }]
      })
    },
    {
      id: 'srd:class.paladin.divine-sense', name: 'Divine Sense',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:class.paladin.divine-sense', name: 'Divine Sense',
        // The uses are exact. What the sense detects is information about the
        // world, which the app does not hold.
        completeness: 'partial',
        modifiers: [
          add(DIVINE_SENSE_MAX, { sum: [1, { stat: abilityModifierPath('cha') }] },
            { note: '1 + your Charisma modifier' })
        ],
        resources: [{
          id: 'paladin.divineSense', name: 'Divine Sense', max: DIVINE_SENSE_MAX,
          refresh: { kind: 'longRest' }, display: 'uses', order: 6
        }],
        actions: [{
          id: 'paladin.divine-sense.use', name: 'Divine Sense', kind: 'ability',
          cost: 'action',
          description: 'Sense celestials, fiends and undead within 60 feet.',
          requirements: { resourceAtLeast: ['paladin.divineSense', 1] },
          costs: { 'paladin.divineSense': 1 }
        }],
        narrative: [{
          text: 'Until the end of your next turn you know the location and type '
            + 'of any celestial, fiend or undead within 60 feet that is not '
            + 'behind total cover, and of any consecrated or desecrated place or '
            + 'object. Ask the DM what you sense.',
          dmPromptable: true
        }]
      })
    },
    {
      id: 'srd:class.paladin.lay-on-hands', name: 'Lay on Hands',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:class.paladin.lay-on-hands', name: 'Lay on Hands',
        // A pool measured in hit points rather than uses, which `display:
        // 'pool'` already renders. Spending it heals someone else, so the
        // amount restored is the DM's to apply.
        completeness: 'partial',
        modifiers: [
          add(LAY_ON_HANDS_MAX, { product: [{ classLevel: PALADIN_ID }, 5] },
            { note: 'five hit points per paladin level' })
        ],
        resources: [{
          id: 'paladin.layOnHands', name: 'Lay on Hands', max: LAY_ON_HANDS_MAX,
          refresh: { kind: 'longRest' }, display: 'pool', order: 5
        }],
        actions: [{
          id: 'paladin.lay-on-hands.use', name: 'Lay on Hands', kind: 'ability',
          description: 'Touch a creature and restore hit points from your pool.',
          cost: 'action',
          requirements: { resourceAtLeast: ['paladin.layOnHands', 1] },
          costs: { 'paladin.layOnHands': 1 },
          targets: { selector: 'creature', count: 1, rangeFeet: 5 }
        }],
        narrative: [{
          text: 'Spend any amount from the pool to restore that many hit points, '
            + 'or 5 points to cure one disease or neutralise one poison. Spending '
            + 'here deducts one point at a time — deduct the rest by hand. No '
            + 'effect on undead or constructs.',
          dmPromptable: true
        }]
      })
    },

    // --- 2nd -----------------------------------------------------------------
    {
      id: 'srd:class.paladin.fighting-style', name: 'Fighting Style',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 2,
      effects: source({
        id: 'srd:class.paladin.fighting-style', name: 'Fighting Style',
        // Complete, and deliberately so, for the same reason the fighter's is:
        // Defense and Dueling are fully expressed, and the two that are not
        // live in their own gated source below. Marking this partial would
        // flag a Defense paladin's AC as unreliable when it is exactly right.
        modifiers: [
          add(ARMOR_CLASS, 1, {
            condition: {
              all: [
                { playerToggle: styleToggle('defense') },
                { playerToggle: 'wearing-armor' }
              ]
            },
            note: 'Defense: +1 AC while wearing armour'
          }),
          add(DAMAGE_WEAPON, 2, {
            condition: { playerToggle: styleToggle('dueling') },
            note: 'Dueling: +2 damage with a single one-handed melee weapon'
          })
        ],
        selections: [{
          id: 'fighting-style', prompt: 'Choose a Fighting Style',
          kind: 'other', count: 1, from: PALADIN_STYLES
        }],
        // One narrative entry per style, each carrying its own toggle — a
        // notice carries one `toggleId`, so a single paragraph could name the
        // switch but not offer it, and the switches were unreachable from the
        // app entirely.
        narrative: [
          {
            text: 'Defense: +1 AC while you are wearing armour. Turn this on if '
              + 'it is the style you chose.',
            toggleId: styleToggle('defense'), dmPromptable: false
          },
          {
            text: 'Dueling: +2 damage while wielding one melee weapon in one hand '
              + 'and nothing in the other.',
            toggleId: styleToggle('dueling'), dmPromptable: false
          },
          {
            text: 'Great Weapon Fighting: reroll a 1 or 2 on a damage die for a '
              + 'two-handed or versatile melee weapon.',
            toggleId: styleToggle('great-weapon'), dmPromptable: false
          },
          {
            text: 'Protection: while wielding a shield, impose disadvantage on an '
              + 'attack against someone within 5 feet of you.',
            toggleId: styleToggle('protection'), dmPromptable: false
          },
          {
            text: 'A paladin may not take Archery or Two-Weapon Fighting. The '
              + 'engine cannot check that the toggle you turn on matches the style '
              + 'you chose, or that only one is on.',
            dmPromptable: true
          }
        ]
      })
    },
    {
      id: 'srd:class.paladin.fighting-style-manual', name: 'Fighting Style (manual)',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 2,
      effects: source({
        id: 'srd:class.paladin.fighting-style-manual', name: 'Fighting Style (manual)',
        completeness: 'partial',
        // Active only for a paladin who took one of the two styles the
        // vocabulary cannot express. `partial` propagates into every stat the
        // character's sources touch, so it has to be earned.
        activation: {
          any: [
            { playerToggle: styleToggle('great-weapon') },
            { playerToggle: styleToggle('protection') }
          ]
        },
        narrative: [
          {
            text: 'Great Weapon Fighting: when you roll a 1 or 2 on a damage die '
              + 'for a two-handed or versatile melee weapon, reroll it and take '
              + 'the new roll. Damage dice have no reroll rule in the engine — '
              + 'reroll it yourself.',
            dmPromptable: true
          },
          {
            text: 'Protection: while wielding a shield, use your reaction to '
              + 'impose disadvantage on an attack against someone within 5 feet '
              + 'of you. A modifier cannot reach a third party\'s attacker — '
              + 'tell the DM.',
            dmPromptable: true
          }
        ]
      })
    },
    {
      id: 'srd:class.paladin.spellcasting', name: 'Spellcasting',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 2,
      effects: source({
        id: 'srd:class.paladin.spellcasting', name: 'Spellcasting',
        modifiers: [
          // The same three modifiers every caster's DC is built from, with
          // Charisma in place of Wisdom or Intelligence. Half casting changes
          // the slot table and nothing else about how a spell resolves.
          { id: id(), channel: 'value', target: SPELL_SAVE_DC, op: 'base', value: 8, permanence: 'persistent' },
          add(SPELL_SAVE_DC, { stat: PROFICIENCY_BONUS }),
          add(SPELL_SAVE_DC, { stat: abilityModifierPath('cha') }, { note: 'Charisma' }),
          add(SPELL_ATTACK, { stat: PROFICIENCY_BONUS }),
          add(SPELL_ATTACK, { stat: abilityModifierPath('cha') }, { note: 'Charisma' }),
          // "your Charisma modifier + half your paladin level, rounded down
          // (minimum of one spell)". `floor` is in the value language, so this
          // is the formula and not an approximation of it.
          add(SPELLS_PREPARED_MAX, {
            max: [1, {
              sum: [
                { stat: abilityModifierPath('cha') },
                { floor: { product: [{ classLevel: PALADIN_ID }, 0.5] } }
              ]
            }]
          }, { note: 'Charisma modifier + half your paladin level, minimum 1' }),
          {
            id: id(), channel: 'capability', capability: 'castSpells',
            capOp: 'grant', permanence: 'persistent'
          },
          ...PALADIN_SLOTS.modifiers
        ],
        resources: PALADIN_SLOTS.resources,
        // Prepared casting from the whole class list, as the cleric and druid
        // do. No paladin spell is in the content set yet, so the grant resolves
        // to nothing — correctly, rather than by being left out.
        spells: [{
          fromList: {
            listId: 'srd:list.paladin',
            maxLevel: {
              classLevelTable: { classId: PALADIN_ID, values: HALF_CASTER_MAX_SPELL_LEVEL }
            }
          },
          availability: 'prepared', slotGroup: 'paladin', ability: 'cha'
        }],
        narrative: [{
          text: 'You have no spell slots at 1st level — a paladin begins casting '
            + 'at 2nd, and never gains a slot above 5th level. You prepare from '
            + 'the whole paladin list and may change the list on a long rest.',
          dmPromptable: false
        }]
      })
    },
    {
      id: 'srd:class.paladin.divine-smite', name: 'Divine Smite',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 2,
      effects: source({
        id: 'srd:class.paladin.divine-smite', name: 'Divine Smite',
        // The fourth feature in the set to want "add N dice to a damage roll
        // you already made", and the fourth not to get it. Sneak Attack,
        // Brutal Critical and the half-orc's Savage Attacks are the others.
        // The slot is spent from the ordinary slot track.
        completeness: 'partial',
        narrative: [{
          text: 'When you hit with a melee weapon attack you may expend a spell '
            + 'slot to deal extra radiant damage: 2d8 for a 1st-level slot, plus '
            + '1d8 per slot level above 1st, to a maximum of 5d8 — and 1d8 more '
            + 'if the target is an undead or a fiend. Spend the slot from your '
            + 'slot track and roll the dice alongside your damage.',
          dmPromptable: true
        }]
      })
    },

    // --- 3rd -----------------------------------------------------------------
    {
      id: 'srd:class.paladin.divine-health', name: 'Divine Health',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 3,
      effects: source({
        id: 'srd:class.paladin.divine-health', name: 'Divine Health',
        // Disease is not modelled at all — there is no disease vocabulary, the
        // same wall the monk's Purity of Body and the Circle of the Land's
        // Nature's Ward hit with their own second halves.
        completeness: 'partial',
        narrative: [{
          text: 'You are immune to disease. Disease is not modelled here, so '
            + 'nothing on the sheet changes — tell the DM.',
          dmPromptable: true
        }]
      })
    },

    // --- 5th -----------------------------------------------------------------
    {
      id: 'srd:class.paladin.extra-attack', name: 'Extra Attack',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 5,
      effects: source({
        id: 'srd:class.paladin.extra-attack', name: 'Extra Attack',
        // There is no stat for how many attacks the Attack action buys, so
        // there is nothing to add 1 to. The fighter, monk and barbarian say the
        // same thing in the same words.
        completeness: 'partial',
        narrative: [{
          text: 'You can attack twice, instead of once, whenever you take the '
            + 'Attack action on your turn. Roll the second attack from the same '
            + 'weapon entry.',
          dmPromptable: false
        }]
      })
    },

    // --- 6th -----------------------------------------------------------------
    {
      id: 'srd:class.paladin.aura-of-protection', name: 'Aura of Protection',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 6,
      effects: source({
        id: 'srd:class.paladin.aura-of-protection', name: 'Aura of Protection',
        // Half of this is exact and half of it is unreachable, and both halves
        // are worth having. The paladin's own saves take the bonus as an
        // ordinary modifier on SAVE_ROLL; the allies within 10 feet cannot,
        // because no modifier reaches another creature's sheet.
        completeness: 'partial',
        modifiers: [
          add(SAVE_ROLL, CHA_MIN_ONE, {
            note: 'Aura of Protection: Charisma modifier, minimum +1'
          })
        ],
        narrative: [{
          text: 'Friendly creatures within 10 feet of you gain the same bonus to '
            + 'their saving throws, and lose it if you fall unconscious. Their '
            + 'sheets cannot be reached from yours — tell them the number. The '
            + 'range grows to 30 feet at 18th level.',
          dmPromptable: true
        }]
      })
    },

    // --- 10th ----------------------------------------------------------------
    {
      id: 'srd:class.paladin.aura-of-courage', name: 'Aura of Courage',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 10,
      effects: source({
        id: 'srd:class.paladin.aura-of-courage', name: 'Aura of Courage',
        // Suppression by source id, exactly as Mindless Rage suspends charmed
        // and frightened — every modifier the condition applies stops applying
        // and says why. The condition chip stays on the sheet, which is the
        // honest reading of an immunity the engine cannot prevent being
        // applied in the first place.
        completeness: 'partial',
        modifiers: [{
          id: id(), channel: 'value', op: 'suppress', permanence: 'persistent',
          suppresses: { sourceIds: ['srd:condition.frightened'] },
          note: 'Aura of Courage: you cannot be frightened'
        }],
        narrative: [{
          text: 'You and friendly creatures within 10 feet of you cannot be '
            + 'frightened while you are conscious. Yours is applied; theirs is '
            + 'not, because no modifier reaches another creature\'s sheet. The '
            + 'range grows to 30 feet at 18th level.',
          dmPromptable: true
        }]
      })
    },

    // --- 11th ----------------------------------------------------------------
    {
      id: 'srd:class.paladin.improved-divine-smite', name: 'Improved Divine Smite',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 11,
      effects: source({
        id: 'srd:class.paladin.improved-divine-smite', name: 'Improved Divine Smite',
        completeness: 'partial',
        narrative: [{
          text: 'Every melee weapon hit deals an extra 1d8 radiant damage, with '
            + 'no slot spent — and it stacks onto a Divine Smite. Roll it '
            + 'alongside your damage; extra damage dice are not something a '
            + 'feature can yet add to a roll.',
          dmPromptable: true
        }]
      })
    },

    // --- 14th ----------------------------------------------------------------
    {
      id: 'srd:class.paladin.cleansing-touch', name: 'Cleansing Touch',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 14,
      effects: source({
        id: 'srd:class.paladin.cleansing-touch', name: 'Cleansing Touch',
        // The uses are exact. Ending a spell is not: there is no vocabulary
        // for dispelling an effect instance by touch.
        completeness: 'partial',
        modifiers: [
          add(CLEANSING_TOUCH_MAX, CHA_MIN_ONE,
            { note: 'your Charisma modifier, minimum 1' })
        ],
        resources: [{
          id: 'paladin.cleansing-touch', name: 'Cleansing Touch',
          max: CLEANSING_TOUCH_MAX, refresh: { kind: 'longRest' },
          display: 'uses', order: 14
        }],
        actions: [{
          id: 'paladin.cleansing-touch.use', name: 'Cleansing Touch',
          kind: 'ability', cost: 'action',
          description: 'End one spell on yourself or on a willing creature you touch.',
          requirements: { resourceAtLeast: ['paladin.cleansing-touch', 1] },
          costs: { 'paladin.cleansing-touch': 1 },
          targets: { selector: 'creature', count: 1, rangeFeet: 5 }
        }]
      })
    },

    // --- 18th ----------------------------------------------------------------
    {
      id: 'srd:class.paladin.aura-improvements', name: 'Aura Improvements',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 18,
      effects: source({
        id: 'srd:class.paladin.aura-improvements', name: 'Aura Improvements',
        // Range is a property of an effect on other creatures, and those are
        // narrative here — so the improvement to them is too. Nothing on the
        // paladin's own sheet changes, which is exactly what this says.
        completeness: 'partial',
        narrative: [{
          text: 'Every aura you have now reaches 30 feet instead of 10. Nothing '
            + 'on your own sheet changes — your auras always applied to you.',
          dmPromptable: true
        }]
      })
    }
  ]
}

// ===========================================================================
// Subclass — Oath of Devotion (SRD p32-34)
// ===========================================================================

/** The Oath of Devotion spell table, level by level. */
const DEVOTION_SPELLS: Record<number, string> = {
  3: 'protection from evil and good, sanctuary',
  5: 'lesser restoration, zone of truth',
  9: 'beacon of hope, dispel magic',
  13: 'freedom of movement, guardian of faith',
  17: 'commune, flame strike'
}

const OATH_SPELL_FEATURES = Object.entries(DEVOTION_SPELLS).map(
  ([level, spells]): ClassFeatureDefinition => {
    const at = Number(level)
    const fid = `srd:subclass.devotion.oath-spells.${at}`
    const name = `Oath Spells (${ordinal(at)} level)`
    return {
      id: fid, name, provenance: 'srd', contentVersion: 1, grantedAtLevel: at,
      effects: source({
        id: fid, name,
        // The mechanism these need exists and is proven — the cleric's domain
        // spells are `availability: 'always'` with a slot group, which is
        // exactly "always prepared and not counted against the limit". None of
        // these ten spells is in the content set, so there is nothing to grant
        // yet; the moment they are authored, this becomes two spell ids.
        completeness: 'partial',
        narrative: [{
          text: `You always have ${spells} prepared, and they do not count `
            + 'against the number of spells you can prepare. Neither is in the '
            + 'content set yet — add them by hand.',
          dmPromptable: true
        }]
      })
    }
  })

export const OATH_OF_DEVOTION: SubclassDefinition = {
  id: 'srd:subclass.devotion', name: 'Oath of Devotion',
  provenance: 'srd', contentVersion: 1,
  classId: PALADIN_ID,
  features: [
    ...OATH_SPELL_FEATURES,
    {
      id: 'srd:subclass.devotion.channel-divinity', name: 'Channel Divinity',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 3,
      effects: source({
        id: 'srd:subclass.devotion.channel-divinity', name: 'Channel Divinity',
        // One use, two things to spend it on — the same shape the cleric's
        // Channel Divinity already has. Sacred Weapon's attack bonus is a real
        // modifier behind a toggle, because the SRD's condition is "for 1
        // minute, with that weapon" and the app runs no clock.
        completeness: 'partial',
        modifiers: [
          add(CHANNEL_DIVINITY_MAX, 1, { note: 'once per short or long rest' }),
          add(ATTACK_ROLL, CHA_MIN_ONE, {
            condition: { playerToggle: 'paladin.sacred-weapon' },
            note: 'Sacred Weapon: Charisma modifier, minimum +1'
          })
        ],
        resources: [{
          id: 'paladin.channel-divinity', name: 'Channel Divinity',
          max: CHANNEL_DIVINITY_MAX, refresh: { kind: 'shortRest' },
          display: 'uses', order: 10
        }],
        actions: [
          {
            id: 'paladin.channel-divinity.sacred-weapon', name: 'Sacred Weapon',
            kind: 'ability', cost: 'action',
            description: 'Imbue a weapon you hold: add your Charisma modifier to attack '
              + 'rolls with it for 1 minute, and it sheds bright light and counts as magical.',
            requirements: { resourceAtLeast: ['paladin.channel-divinity', 1] },
            costs: { 'paladin.channel-divinity': 1 }
          },
          {
            id: 'paladin.channel-divinity.turn-the-unholy', name: 'Turn the Unholy',
            kind: 'ability', cost: 'action',
            description: 'Each fiend or undead within 30 feet that can see or hear you '
              + 'makes a Wisdom save or is turned for 1 minute.',
            requirements: { resourceAtLeast: ['paladin.channel-divinity', 1] },
            costs: { 'paladin.channel-divinity': 1 }
          }
        ],
        narrative: [
          {
            text: 'Turn the Sacred Weapon toggle on while the effect lasts and off '
              + 'after a minute, or when you stop holding the weapon or fall '
              + 'unconscious. The app runs no clock.',
            toggleId: 'paladin.sacred-weapon', dmPromptable: true
          },
          {
            text: 'Turn the Unholy: the save is against your paladin spell save DC, '
              + 'which is on your sheet. What happens to a turned creature is the '
              + 'DM\'s to run.',
            dmPromptable: true
          }
        ]
      })
    },
    {
      id: 'srd:subclass.devotion.aura-of-devotion', name: 'Aura of Devotion',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 7,
      effects: source({
        id: 'srd:subclass.devotion.aura-of-devotion', name: 'Aura of Devotion',
        // Aura of Courage's shape with charmed in place of frightened.
        completeness: 'partial',
        modifiers: [{
          id: id(), channel: 'value', op: 'suppress', permanence: 'persistent',
          suppresses: { sourceIds: ['srd:condition.charmed'] },
          note: 'Aura of Devotion: you cannot be charmed'
        }],
        narrative: [{
          text: 'You and friendly creatures within 10 feet of you cannot be '
            + 'charmed while you are conscious. Yours is applied; theirs is not. '
            + 'The range grows to 30 feet at 18th level.',
          dmPromptable: true
        }]
      })
    },
    {
      id: 'srd:subclass.devotion.purity-of-spirit', name: 'Purity of Spirit',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 15,
      effects: source({
        id: 'srd:subclass.devotion.purity-of-spirit', name: 'Purity of Spirit',
        // "Always under the effects of protection from evil and good" is a
        // permanent spell effect, and that spell is not in the content set. It
        // would be a persistent EffectInstance the moment it is.
        completeness: 'partial',
        narrative: [{
          text: 'You are always under the effects of a protection from evil and '
            + 'good spell: aberrations, celestials, elementals, fey, fiends and '
            + 'undead have disadvantage on attacks against you, and cannot '
            + 'charm, frighten or possess you. The spell is not in the content '
            + 'set — tell the DM.',
          dmPromptable: true
        }]
      })
    },
    {
      id: 'srd:subclass.devotion.holy-nimbus', name: 'Holy Nimbus',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 20,
      effects: source({
        id: 'srd:subclass.devotion.holy-nimbus', name: 'Holy Nimbus',
        // The advantage half is expressible — a roll scope with tags, the same
        // shape the halfling's advantage against frightened uses — and is
        // behind the toggle because the aura lasts a minute and the app runs
        // no clock. The 10 radiant damage happens to other creatures.
        completeness: 'partial',
        modifiers: [
          add(HOLY_NIMBUS_MAX, 1, { note: 'once per long rest' }),
          {
            id: id(), channel: 'roll', rollOp: 'advantage',
            scope: { kinds: ['save'], againstTags: ['spell', 'fiend', 'undead'] },
            condition: { playerToggle: 'paladin.holy-nimbus' },
            permanence: 'persistent',
            note: 'Holy Nimbus: against spells cast by fiends and undead'
          }
        ],
        resources: [{
          id: 'paladin.holy-nimbus', name: 'Holy Nimbus', max: HOLY_NIMBUS_MAX,
          refresh: { kind: 'longRest' }, display: 'uses', order: 20
        }],
        actions: [{
          id: 'paladin.holy-nimbus.use', name: 'Holy Nimbus',
          kind: 'ability', cost: 'action',
          description: 'Emanate sunlight for 1 minute: enemies starting their turn in '
            + 'the bright light take 10 radiant damage.',
          requirements: { resourceAtLeast: ['paladin.holy-nimbus', 1] },
          costs: { 'paladin.holy-nimbus': 1 }
        }],
        narrative: [{
          text: 'Turn the toggle on for the minute the nimbus lasts. Bright light '
            + 'fills a 30-foot radius and dim light 30 feet beyond; an enemy that '
            + 'starts its turn in the bright light takes 10 radiant damage, which '
            + 'the DM applies.',
          toggleId: 'paladin.holy-nimbus', dmPromptable: true
        }]
      })
    }
  ]
}

/**
 * The column nothing reads yet: the levels at which the paladin takes an
 * Ability Score Improvement.
 *
 * Exported for the same reason MONK_TABLE and BARBARIAN_TABLE are — there is
 * no advancement flow to consume it.
 */
export const PALADIN_TABLE = {
  asiLevels: PALADIN_ASI_LEVELS,
  fightingStyles: PALADIN_STYLES,
  oathSpells: DEVOTION_SPELLS
}

export const PALADIN_CLASSES: ClassDefinition[] = [PALADIN]
export const PALADIN_SUBCLASSES: SubclassDefinition[] = [OATH_OF_DEVOTION]
