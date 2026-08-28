// The two archetypes the vertical slice was missing.
//
// Chosen for what they stress, not for coverage of the SRD. The rogue is the
// bonus-action and expertise test: Cunning Action is three actions on one
// resource-free budget, and Expertise is the only place `proficiency` is
// multiplied. The cleric is the preparation test: unlike the wizard's
// spellbook, a cleric prepares from an entire class list, and domain spells are
// always prepared on top of it — two grants that had better not need a third
// mechanism.

import type {
  ClassDefinition, ClassFeatureDefinition, EffectSource, ItemDefinition, Modifier,
  ProficiencyGrant, SpeciesDefinition, SubclassDefinition
} from '../rules/types.js'
import {
  abilityModifierPath, abilityScorePath, declareResourceMax, HP_MAX, JUMP_LONG,
  movementCostPath, PROFICIENCY_BONUS, SPELL_ATTACK, SPELL_SAVE_DC,
  SPELLS_PREPARED_MAX, speedPath
} from '../rules/statPaths.js'
import { SPELL_LISTS } from './spells.js'
import { fullCasterSlots } from './progression.js'

/** The Cleric table's slot columns, 1st through 9th. */
const CLERIC_SLOTS = fullCasterSlots('srd:class.cleric', 'cleric')

// ---------------------------------------------------------------------------
// The Cleric table (SRD p15), transcribed
// ---------------------------------------------------------------------------

/** Cantrips Known: three, four from 4th, five from 10th. */
const CLERIC_CANTRIPS_KNOWN = [
  3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5
]

/** Channel Divinity: one use per rest from 2nd, two from 6th, three from 18th. */
const CLERIC_CHANNEL_DIVINITY_USES = [
  0, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3
]

/**
 * The Destroy Undead thresholds above the 5th-level row.
 *
 * A challenge rating is a string because 1/2 is not a number the way the
 * others are, and nothing computes with it — there are no creatures in the
 * content set for it to be compared against.
 */
const DESTROY_UNDEAD_THRESHOLDS: [number, string][] = [
  [8, '1'], [11, '2'], [14, '3'], [17, '4']
]

/** The top of the slot ladder, which is as high as a cleric can prepare. */
const CLERIC_MAX_SPELL_LEVEL = [
  1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 9
]

/** The cleric takes the standard five Ability Score Improvements. */
const CLERIC_ASI_LEVELS = [4, 8, 12, 16, 19]

/**
 * Cleric cantrips in the content set, all on the SRD cleric cantrip list
 * (docs/srd/08-spell-lists.md). Four of the six were authored alongside this
 * class: the column asks for three at 1st and the set held two, and a
 * selection asking for more than its pool holds is an integrity error — as it
 * should be.
 */
const CLERIC_CANTRIP_POOL = [
  'srd:spell.sacred-flame', 'srd:spell.guidance', 'srd:spell.light',
  'srd:spell.resistance', 'srd:spell.spare-the-dying', 'srd:spell.mending'
]

// ---------------------------------------------------------------------------
// The Rogue table (SRD p39), transcribed
// ---------------------------------------------------------------------------

/** Sneak Attack dice: 1d6 at 1st, rising by one at every odd level to 10d6. */
const ROGUE_SNEAK_ATTACK_DICE = [
  1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10
]

/** The rogue takes six Ability Score Improvements — one more than most. */
const ROGUE_ASI_LEVELS = [4, 8, 10, 12, 16, 19]

/** The eleven the rogue chooses four of, and doubles two of. */
const ROGUE_SKILLS = [
  'acrobatics', 'athletics', 'deception', 'insight', 'intimidation',
  'investigation', 'perception', 'performance', 'persuasion',
  'sleight-of-hand', 'stealth'
]

const STROKE_OF_LUCK_MAX = declareResourceMax('rogue.stroke-of-luck')

const CHANNEL_DIVINITY_MAX = declareResourceMax('cleric.channel-divinity')
const DIVINE_INTERVENTION_MAX = declareResourceMax('cleric.divine-intervention')

/** One level's worth of the Cantrips Known column, as an increase. */
function clericCantripsAtLevel(
  level: number, cantrips: number
): ClassFeatureDefinition | undefined {
  if (cantrips <= 0) return undefined
  const fid = `srd:class.cleric.cantrips-known-${level}`
  return {
    id: fid, name: `Cantrips Known (level ${level})`,
    provenance: 'srd', contentVersion: 1, grantedAtLevel: level,
    effects: source({
      id: fid, name: `Cantrips Known (level ${level})`,
      selections: [{
        id: 'cantrips', prompt: `Learn ${cantrips} more cleric cantrip${cantrips === 1 ? '' : 's'}`,
        kind: 'spellList', count: cantrips, from: CLERIC_CANTRIP_POOL
      }],
      spells: [{ selectionId: 'cantrips', availability: 'always', ability: 'wis' }]
    })
  }
}

const CLERIC_CANTRIP_FEATURES = CLERIC_CANTRIPS_KNOWN
  .map((known, i) => {
    const level = i + 1
    if (level === 1) return undefined // Granted by Spellcasting itself.
    return clericCantripsAtLevel(level, known - CLERIC_CANTRIPS_KNOWN[i - 1]!)
  })
  .filter((f): f is ClassFeatureDefinition => f !== undefined)

const V = '2014'
let n = 0
const id = () => `pt${++n}`

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
 * into as many held proficiencies as the answer names; the `as never` matches
 * how bard.ts and the Resilient feat already author it.
 */
const chosenProf = (
  kind: 'skill' | 'tool',
  selectionId: string,
  level: ProficiencyGrant['level'] = 'proficient'
): ProficiencyGrant => ({
  id: id(),
  category: { kind, selection: selectionId } as never,
  level,
  rounding: 'floor',
  // Expertise multiplies a proficiency; it does not confer one. Saying
  // otherwise makes doubling a skill you lack grant it outright, which is
  // exactly what "choose two of your proficiencies" forbids. The resolver
  // already multiplies a term that is 0 when not proficient — this is the half
  // of that rule the content has to hold up.
  grantsProficiency: level === 'proficient'
})

// ===========================================================================
// Species — Lightfoot Halfling, and Human
// ===========================================================================

export const HALFLING: SpeciesDefinition = {
  id: 'srd:species.halfling', name: 'Halfling', provenance: 'srd', contentVersion: 1,
  size: 'small', baseWalkSpeed: 25,
  effects: source({
    id: 'srd:species.halfling', name: 'Halfling', kind: 'species',
    modifiers: [
      add(abilityScorePath('dex'), 2),
      { id: id(), channel: 'value', target: speedPath('walk'), op: 'base', value: 25, permanence: 'persistent' },
      {
        id: id(), channel: 'roll', rollOp: 'advantage',
        scope: { kinds: ['save'], againstTags: ['frightened'] },
        permanence: 'persistent', note: 'Brave'
      },
      // Lucky rerolls a natural 1 on attacks, checks and saves. `rerollOn` is
      // already part of RollResolution, so this is data.
      {
        id: id(), channel: 'roll', rollOp: 'reroll', rollValue: 1,
        scope: { kinds: ['attack', 'check', 'save'] },
        permanence: 'persistent', note: 'Lucky'
      }
    ],
    narrative: [{
      text: 'Halfling Nimbleness lets you move through the space of any '
        + 'creature larger than you.',
      dmPromptable: false
    }]
  }),
  subspecies: [{
    id: 'srd:species.halfling.lightfoot', name: 'Lightfoot Halfling',
    effects: source({
      id: 'srd:species.halfling.lightfoot', name: 'Lightfoot Halfling', kind: 'species',
      modifiers: [add(abilityScorePath('cha'), 1)],
      narrative: [{
        text: 'Naturally Stealthy: you can hide even when obscured only by a '
          + 'creature at least one size larger than you.',
        dmPromptable: true
      }]
    })
  }]
}

export const HUMAN: SpeciesDefinition = {
  id: 'srd:species.human', name: 'Human', provenance: 'srd', contentVersion: 1,
  size: 'medium', baseWalkSpeed: 30,
  effects: source({
    id: 'srd:species.human', name: 'Human', kind: 'species',
    modifiers: [
      ...(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map((a) =>
        add(abilityScorePath(a), 1)),
      { id: id(), channel: 'value', target: speedPath('walk'), op: 'base', value: 30, permanence: 'persistent' }
    ]
  })
}

// ===========================================================================
// Class — Rogue, levels 1-5
// ===========================================================================

export const ROGUE: ClassDefinition = {
  id: 'srd:class.rogue', name: 'Rogue', provenance: 'srd', contentVersion: 1,
  hitDie: 8, savingThrowProficiencies: ['dex', 'int'],
  subclassSlot: { grantedAtLevel: 3, options: ['srd:subclass.thief'] },
  features: [
    {
      id: 'srd:class.rogue.proficiencies', name: 'Rogue Proficiencies',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:class.rogue.proficiencies', name: 'Rogue Proficiencies',
        modifiers: [
          add(HP_MAX, {
            sum: [
              8, { product: [5, { sum: [{ characterLevel: true }, -1] }] },
              { product: [{ stat: abilityModifierPath('con') }, { characterLevel: true }] }
            ]
          }, { note: 'd8 hit die: 5 per level after the first, +8 at 1st, + CON per level' })
        ],
        proficiencies: [
          prof({ kind: 'save', ability: 'dex' }),
          prof({ kind: 'save', ability: 'int' }),
          prof({ kind: 'armor', category: 'light' }),
          prof({ kind: 'weaponCategory', category: 'simple' }),
          // "simple weapons, hand crossbows, longswords, rapiers, shortswords"
          // — the four martial exceptions are named individually, so they need
          // naming here too. A category grant does not reach them.
          prof({ kind: 'weapon', itemId: 'srd:weapon.shortsword' }),
          prof({ kind: 'weapon', itemId: 'srd:weapon.longsword' }),
          prof({ kind: 'tool', id: 'thieves-tools' }),
          // "Choose four from…" — four, not the four this file happened to
          // name. The rogue picks more skills than any other class, which is
          // most of what makes it a rogue.
          chosenProf('skill', 'skills')
        ],
        selections: [{
          id: 'skills', prompt: 'Choose four rogue skills', kind: 'skill', count: 4,
          from: [
            'acrobatics', 'athletics', 'deception', 'insight', 'intimidation',
            'investigation', 'perception', 'performance', 'persuasion',
            'sleight-of-hand', 'stealth'
          ]
        }]
      })
    },
    {
      id: 'srd:class.rogue.expertise', name: 'Expertise',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:class.rogue.expertise', name: 'Expertise',
        // The only place in the SRD where the proficiency bonus is multiplied.
        // "You add it only once and multiply it only once" is enforced by the
        // stat's `single-highest` multiply composition, not by anything here.
        //
        // Chosen rather than named: Stealth and Perception were hardcoded for
        // every rogue that would ever exist.
        proficiencies: [chosenProf('skill', 'expertise', 'expertise')],
        selections: [{
          id: 'expertise', prompt: 'Choose two proficiencies to double',
          kind: 'skill', count: 2, from: ROGUE_SKILLS
        }],
        narrative: [{
          text: 'Both must be proficiencies you already have — a skill, or your '
            + 'proficiency with thieves\' tools. Doubling one you lack doubles '
            + 'nothing, which is what the engine will show.',
          dmPromptable: false
        }]
      })
    },
    {
      id: 'srd:class.rogue.expertise-6', name: 'Expertise (6th level)',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 6,
      effects: source({
        id: 'srd:class.rogue.expertise-6', name: 'Expertise (6th level)',
        proficiencies: [chosenProf('skill', 'expertise-6', 'expertise')],
        selections: [{
          id: 'expertise-6', prompt: 'Choose two more proficiencies to double',
          kind: 'skill', count: 2, from: ROGUE_SKILLS
        }]
      })
    },
    {
      id: 'srd:class.rogue.thieves-cant', name: 'Thieves\' Cant',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:class.rogue.thieves-cant', name: 'Thieves\' Cant',
        // Purely a language. Not partial: nothing mechanical is missing, there
        // is simply nothing mechanical to express.
        narrative: [{
          text: 'You know thieves\' cant, a secret mix of dialect, jargon and code. '
            + 'It takes four times longer to convey a message this way, and you can '
            + 'hide messages in apparently normal conversation.',
          dmPromptable: false
        }]
      })
    },
    {
      id: 'srd:class.rogue.sneak-attack', name: 'Sneak Attack',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:class.rogue.sneak-attack', name: 'Sneak Attack',
        completeness: 'partial',
        // The dice were written as a flat "3d6" — the level-5 row. Whether the
        // condition is met is still a judgement no engine can make, but the
        // number of dice is a table and now reads as one.
        narrative: [{
          text: 'Once per turn you deal extra damage to a target you hit with a '
            + 'finesse or ranged weapon, if you had advantage on the attack or if '
            + 'an ally is within 5 feet of it and you did not have disadvantage. '
            + 'The extra damage is 1d6 at 1st level, rising by 1d6 at every odd '
            + 'level to 10d6 at 19th. Whether the condition is met is a judgement '
            + 'the engine cannot make — declare it at the table.',
          toggleId: 'rogue.sneak-attack', dmPromptable: true
        }]
      })
    },
    {
      id: 'srd:class.rogue.cunning-action', name: 'Cunning Action',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 2,
      effects: source({
        id: 'srd:class.rogue.cunning-action', name: 'Cunning Action',
        // Three actions, one budget, no resource. The bonus-action test: the
        // action economy is a cost type, so these need nothing new.
        actions: [
          {
            id: 'rogue.cunning-action.dash', name: 'Cunning Dash', cost: 'bonusAction',
            kind: 'movement', description: 'Dash as a bonus action.',
            requirements: { always: true }
          },
          {
            id: 'rogue.cunning-action.disengage', name: 'Cunning Disengage', cost: 'bonusAction',
            kind: 'movement', description: 'Disengage as a bonus action.',
            requirements: { always: true }
          },
          {
            id: 'rogue.cunning-action.hide', name: 'Cunning Hide', cost: 'bonusAction',
            kind: 'ability', description: 'Hide as a bonus action.',
            requirements: { always: true }
          }
        ]
      })
    },
    {
      id: 'srd:class.rogue.uncanny-dodge', name: 'Uncanny Dodge',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 5,
      effects: source({
        id: 'srd:class.rogue.uncanny-dodge', name: 'Uncanny Dodge',
        completeness: 'partial',
        actions: [{
          id: 'rogue.uncanny-dodge.use', name: 'Uncanny Dodge', cost: 'reaction',
          description: 'Halve the damage from one attack you can see.',
          requirements: { always: true }
        }],
        // The reaction is offerable; the halving is not applicable. Incoming
        // damage arrives through dmDamage, which the DM issues.
        narrative: [{
          text: 'Halve the damage of one attack you can see hitting you. Tell the '
            + 'DM before they apply it — the app does not halve incoming damage.',
          dmPromptable: true
        }]
      })
    },

    // --- 7th ---------------------------------------------------------------
    {
      id: 'srd:class.rogue.evasion', name: 'Evasion',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 7,
      effects: source({
        id: 'srd:class.rogue.evasion', name: 'Evasion',
        completeness: 'partial',
        // Identical to the monk's Evasion at the same level, and partial for
        // the same reason: it is a rule about how an incoming effect resolves.
        narrative: [{
          text: 'When an effect lets you make a Dexterity save for half damage, you '
            + 'take none on a success and half on a failure. Tell the DM — the app '
            + 'does not halve incoming damage for you.',
          dmPromptable: true
        }]
      })
    },

    // --- 11th --------------------------------------------------------------
    {
      id: 'srd:class.rogue.reliable-talent', name: 'Reliable Talent',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 11,
      effects: source({
        id: 'srd:class.rogue.reliable-talent', name: 'Reliable Talent',
        completeness: 'partial',
        // A floor on the d20 itself, not on the total — the roll pipeline has
        // `rerollOn` for named faces but nothing that raises a die to a
        // minimum. Adding to the total would give the wrong answer whenever
        // the natural roll was already 10 or more.
        narrative: [{
          text: 'On any ability check that adds your proficiency bonus, treat a d20 '
            + 'of 9 or lower as a 10. The die itself is floored, not the total — '
            + 'read the roll and raise it yourself.',
          dmPromptable: true
        }]
      })
    },

    // --- 14th --------------------------------------------------------------
    {
      id: 'srd:class.rogue.blindsense', name: 'Blindsense',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 14,
      effects: source({
        id: 'srd:class.rogue.blindsense', name: 'Blindsense',
        narrative: [{
          text: 'While you can hear, you are aware of the location of any hidden or '
            + 'invisible creature within 10 feet of you.',
          dmPromptable: true
        }]
      })
    },

    // --- 15th --------------------------------------------------------------
    {
      id: 'srd:class.rogue.slippery-mind', name: 'Slippery Mind',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 15,
      effects: source({
        id: 'srd:class.rogue.slippery-mind', name: 'Slippery Mind',
        // Wholly expressible: one more saving throw proficiency, and the
        // proficiency machinery does the rest.
        proficiencies: [prof({ kind: 'save', ability: 'wis' })]
      })
    },

    // --- 18th --------------------------------------------------------------
    {
      id: 'srd:class.rogue.elusive', name: 'Elusive',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 18,
      effects: source({
        id: 'srd:class.rogue.elusive', name: 'Elusive',
        completeness: 'partial',
        // "No attack roll has advantage against you" would be a roll modifier
        // with `appliesTo: 'attackersAgainstSelf'` — which exists — except that
        // there is no rollOp that *cancels* advantage. Granting disadvantage
        // is a different rule and would be wrong.
        narrative: [{
          text: 'No attack roll has advantage against you while you are not '
            + 'incapacitated. Cancelling advantage is not the same as imposing '
            + 'disadvantage, and only the latter is expressible — so this one is '
            + 'the DM\'s to honour.',
          dmPromptable: true
        }]
      })
    },

    // --- 20th --------------------------------------------------------------
    {
      id: 'srd:class.rogue.stroke-of-luck', name: 'Stroke of Luck',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 20,
      effects: source({
        id: 'srd:class.rogue.stroke-of-luck', name: 'Stroke of Luck',
        completeness: 'partial',
        modifiers: [add(STROKE_OF_LUCK_MAX, 1, { note: 'once per short or long rest' })],
        resources: [{
          id: 'rogue.stroke-of-luck', name: 'Stroke of Luck',
          max: STROKE_OF_LUCK_MAX,
          refresh: { kind: 'shortRest' }, display: 'uses', order: 10
        }],
        actions: [{
          id: 'rogue.stroke-of-luck.use', name: 'Stroke of Luck',
          kind: 'ability', cost: 'free',
          description: 'Turn a miss into a hit, or treat a failed ability check as a 20.',
          requirements: { resourceAtLeast: ['rogue.stroke-of-luck', 1] },
          costs: { 'rogue.stroke-of-luck': 1 }
        }],
        narrative: [{
          text: 'Turn one missed attack into a hit, or treat one failed ability '
            + 'check as though you rolled a 20. Both rewrite a roll that has '
            + 'already resolved — the use is tracked, the outcome is yours.',
          dmPromptable: true
        }]
      })
    }
  ]
}

// ===========================================================================
// Subclass — Thief (SRD p40-41)
// ===========================================================================

export const THIEF: SubclassDefinition = {
  id: 'srd:subclass.thief', name: 'Thief',
  provenance: 'srd', contentVersion: 1,
  classId: 'srd:class.rogue',
  features: [
    {
      id: 'srd:subclass.thief.fast-hands', name: 'Fast Hands',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 3,
      effects: source({
        id: 'srd:subclass.thief.fast-hands', name: 'Fast Hands',
        // Three more things to spend Cunning Action's bonus action on. The
        // bonus action itself is already a Cunning Action offering; these are
        // extra options for it rather than a new resource.
        actions: [
          {
            id: 'rogue.thief.fast-hands.sleight', name: 'Fast Hands: Sleight of Hand',
            kind: 'ability', cost: 'bonusAction',
            description: 'Make a Dexterity (Sleight of Hand) check with your Cunning Action.',
            requirements: { always: true }
          },
          {
            id: 'rogue.thief.fast-hands.tools', name: 'Fast Hands: Use Thieves\' Tools',
            kind: 'ability', cost: 'bonusAction',
            description: 'Disarm a trap or open a lock with your Cunning Action.',
            requirements: { always: true }
          },
          {
            id: 'rogue.thief.fast-hands.use-object', name: 'Fast Hands: Use an Object',
            kind: 'ability', cost: 'bonusAction',
            description: 'Take the Use an Object action with your Cunning Action.',
            requirements: { always: true }
          }
        ]
      })
    },
    {
      id: 'srd:subclass.thief.second-story-work', name: 'Second-Story Work',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 3,
      effects: source({
        id: 'srd:subclass.thief.second-story-work', name: 'Second-Story Work',
        // Both halves are real. Climbing cost is a declared stat path, and the
        // jump bonus is an ordinary add — the same two the Athlete feat and
        // Remarkable Athlete already use.
        modifiers: [
          {
            id: id(), channel: 'value', target: movementCostPath('climb'), op: 'set', value: 1,
            permanence: 'persistent', note: 'climbing costs no extra movement'
          },
          add(JUMP_LONG, { stat: abilityModifierPath('dex') },
            { note: 'Second-Story Work: running jump' })
        ]
      })
    },
    {
      id: 'srd:subclass.thief.supreme-sneak', name: 'Supreme Sneak',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 9,
      effects: source({
        id: 'srd:subclass.thief.supreme-sneak', name: 'Supreme Sneak',
        // Advantage on Stealth, conditional on how far you moved this turn.
        // Movement is not tracked, so the toggle is the player's honesty —
        // the same shape the fighter's Archery style uses.
        modifiers: [{
          id: id(), channel: 'roll', rollOp: 'advantage',
          scope: { kinds: ['check'], skills: ['stealth'] },
          condition: { playerToggle: 'rogue.supreme-sneak' },
          permanence: 'persistent',
          note: 'Supreme Sneak: moved no more than half your speed'
        }],
        narrative: [{
          text: 'Turn this on for a turn in which you moved no more than half your '
            + 'speed. The app does not track movement.',
          toggleId: 'rogue.supreme-sneak', dmPromptable: true
        }]
      })
    },
    {
      id: 'srd:subclass.thief.use-magic-device', name: 'Use Magic Device',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 13,
      effects: source({
        id: 'srd:subclass.thief.use-magic-device', name: 'Use Magic Device',
        // Ignoring item requirements would be a capability the attunement and
        // equip gates read. Items in the content set carry no class, race or
        // level requirements yet, so there is nothing here to ignore.
        narrative: [{
          text: 'You ignore all class, race and level requirements on the use of '
            + 'magic items. No item in the content set carries such a requirement '
            + 'yet, so this currently changes nothing.',
          dmPromptable: false
        }]
      })
    },
    {
      id: 'srd:subclass.thief.thiefs-reflexes', name: 'Thief\'s Reflexes',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 17,
      effects: source({
        id: 'srd:subclass.thief.thiefs-reflexes', name: 'Thief\'s Reflexes',
        completeness: 'partial',
        // Two turns in a round. There is no initiative order and no round
        // structure to take a second turn in.
        narrative: [{
          text: 'You take two turns during the first round of any combat: one at '
            + 'your initiative, one at your initiative minus 10. Not available if '
            + 'you are surprised. The app has no turn order to insert this into.',
          dmPromptable: true
        }]
      })
    }
  ]
}

// ===========================================================================
// Class — Cleric, levels 1-5
// ===========================================================================

export const CLERIC: ClassDefinition = {
  id: 'srd:class.cleric', name: 'Cleric', provenance: 'srd', contentVersion: 1,
  hitDie: 8, savingThrowProficiencies: ['wis', 'cha'],
  subclassSlot: { grantedAtLevel: 1, options: ['srd:subclass.life-domain'] },
  features: [
    {
      id: 'srd:class.cleric.proficiencies', name: 'Cleric Proficiencies',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:class.cleric.proficiencies', name: 'Cleric Proficiencies',
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
          prof({ kind: 'armor', category: 'medium' }),
          prof({ kind: 'armor', category: 'shield' }),
          prof({ kind: 'weaponCategory', category: 'simple' }),
          prof({ kind: 'skill', id: 'religion' }),
          prof({ kind: 'skill', id: 'medicine' })
        ]
      })
    },
    {
      id: 'srd:class.cleric.spellcasting', name: 'Spellcasting',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:class.cleric.spellcasting', name: 'Spellcasting',
        modifiers: [
          { id: id(), channel: 'value', target: SPELL_SAVE_DC, op: 'base', value: 8, permanence: 'persistent' },
          add(SPELL_SAVE_DC, { stat: PROFICIENCY_BONUS }),
          add(SPELL_SAVE_DC, { stat: abilityModifierPath('wis') }, { note: 'Wisdom' }),
          add(SPELL_ATTACK, { stat: PROFICIENCY_BONUS }),
          add(SPELL_ATTACK, { stat: abilityModifierPath('wis') }, { note: 'Wisdom' }),
          add(SPELLS_PREPARED_MAX, {
            max: [1, {
              sum: [
                { stat: abilityModifierPath('wis') },
                { classLevel: 'srd:class.cleric' }
              ]
            }]
          }, { note: 'Wisdom modifier + cleric level, minimum 1' }),
          ...CLERIC_SLOTS.modifiers
        ],
        // The full ladder, 1st through 9th, read off the Cleric table rather
        // than frozen at one row.
        resources: CLERIC_SLOTS.resources,
        selections: [{
          id: 'cantrips', prompt: 'Choose three cleric cantrips',
          kind: 'spellList', count: 3, from: CLERIC_CANTRIP_POOL
        }],
        spells: [
          // Chosen, not named. Sacred Flame was handed to every cleric before.
          { selectionId: 'cantrips', availability: 'always', ability: 'wis' },
          // The difference from the wizard is one word: a cleric prepares from
          // the whole list rather than from a book. Same grant type — and as
          // high as the slot ladder reaches, not frozen at 3rd.
          {
            fromList: {
              listId: SPELL_LISTS.CLERIC,
              maxLevel: {
                classLevelTable: {
                  classId: 'srd:class.cleric', values: CLERIC_MAX_SPELL_LEVEL
                }
              }
            },
            availability: 'prepared', slotGroup: 'cleric', ability: 'wis'
          }
        ]
      })
    },

    // One feature per level the Cantrips Known column moves.
    ...CLERIC_CANTRIP_FEATURES,

    // --- 2nd ---------------------------------------------------------------
    {
      id: 'srd:class.cleric.channel-divinity', name: 'Channel Divinity',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 2,
      effects: source({
        id: 'srd:class.cleric.channel-divinity', name: 'Channel Divinity',
        completeness: 'partial',
        modifiers: [
          add(CHANNEL_DIVINITY_MAX,
            { classLevelTable: { classId: 'srd:class.cleric', values: CLERIC_CHANNEL_DIVINITY_USES } },
            { note: 'once per rest, twice from 6th, three times from 18th' })
        ],
        resources: [{
          id: 'cleric.channel-divinity', name: 'Channel Divinity',
          max: CHANNEL_DIVINITY_MAX,
          // Order 10+ so the class's own resources sort after the nine slot
          // tiers, which take orders 1-9 from fullCasterSlots. At order 1 this
          // landed between the 1st- and 2nd-level slots on the HUD.
          refresh: { kind: 'shortRest' }, display: 'uses', order: 10
        }],
        actions: [{
          id: 'cleric.channel-divinity.turn-undead', name: 'Turn Undead', cost: 'action',
          description: 'Undead within 30 feet must save or be turned for a minute.',
          requirements: { resourceAtLeast: ['cleric.channel-divinity', 1] },
          costs: { 'cleric.channel-divinity': 1 }
        }],
        // The use is spent; the undead are the DM's. Domains add their own
        // Channel Divinity options — Preserve Life comes from Life Domain, not
        // from here, which is why it moved out of this feature.
        narrative: [{
          text: 'Each undead within 30 feet that can see or hear you makes a Wisdom '
            + 'save against your spell save DC, or is turned for a minute or until '
            + 'it takes damage. The DM rolls those saves.',
          dmPromptable: true
        }]
      })
    },

    // --- 5th ---------------------------------------------------------------
    {
      id: 'srd:class.cleric.destroy-undead', name: 'Destroy Undead',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 5,
      effects: source({
        id: 'srd:class.cleric.destroy-undead', name: 'Destroy Undead',
        completeness: 'partial',
        // A threshold on somebody else's challenge rating. There are no
        // creatures in the content set, let alone their CRs.
        narrative: [{
          text: 'An undead that fails its save against your Turn Undead is instantly '
            + 'destroyed if its challenge rating is 1/2 or lower.',
          dmPromptable: true
        }]
      })
    },
    // The Features column names Destroy Undead again at 8th, 11th, 14th and
    // 17th, each time with a higher threshold. One row per improvement, so a
    // cleric levelling into one sees something happen — the same shape the
    // barbarian's Brutal Critical rows use.
    ...DESTROY_UNDEAD_THRESHOLDS.map(([level, cr]): ClassFeatureDefinition => {
      const fid = `srd:class.cleric.destroy-undead-${level}`
      const name = `Destroy Undead (CR ${cr})`
      return {
        id: fid, name, provenance: 'srd', contentVersion: 1, grantedAtLevel: level,
        effects: source({
          id: fid, name,
          completeness: 'partial',
          narrative: [{
            text: `Your Destroy Undead threshold rises to challenge rating ${cr}.`,
            dmPromptable: true
          }]
        })
      }
    }),

    // --- 20th --------------------------------------------------------------
    {
      id: 'srd:class.cleric.divine-intervention-20',
      name: 'Divine Intervention (improvement)',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 20,
      effects: source({
        id: 'srd:class.cleric.divine-intervention-20',
        name: 'Divine Intervention (improvement)',
        // The roll goes away entirely, which is a rule about a d100 the engine
        // never rolled — Divine Intervention has always been a use tracked here
        // and an outcome decided at the table.
        completeness: 'partial',
        narrative: [{
          text: 'Your call for Divine Intervention succeeds automatically — no roll '
            + 'is needed. The use is still spent, and you still wait seven days '
            + 'before calling again.',
          dmPromptable: true
        }]
      })
    },

    // --- 10th --------------------------------------------------------------
    {
      id: 'srd:class.cleric.divine-intervention', name: 'Divine Intervention',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 10,
      effects: source({
        id: 'srd:class.cleric.divine-intervention', name: 'Divine Intervention',
        completeness: 'partial',
        modifiers: [add(DIVINE_INTERVENTION_MAX, 1, { note: 'once, then a long rest — or seven days if it worked' })],
        resources: [{
          id: 'cleric.divine-intervention', name: 'Divine Intervention',
          max: DIVINE_INTERVENTION_MAX,
          refresh: { kind: 'longRest' }, display: 'uses', order: 11
        }],
        actions: [{
          id: 'cleric.divine-intervention.use', name: 'Divine Intervention',
          kind: 'ability', cost: 'action',
          description: 'Roll percentile dice; on a roll at or below your cleric level, your deity intervenes.',
          requirements: { resourceAtLeast: ['cleric.divine-intervention', 1] },
          costs: { 'cleric.divine-intervention': 1 }
        }],
        // The percentile roll has no d100 in the dice vocabulary, and the
        // seven-day lockout on success is a refresh rule conditional on an
        // outcome — neither is expressible.
        narrative: [{
          text: 'Roll percentile dice. On a roll equal to or lower than your cleric '
            + 'level, your deity intervenes and the DM chooses how. If it works you '
            + 'cannot use this again for seven days; otherwise it returns after a '
            + 'long rest. The app tracks the use, not the roll or the seven days.',
          dmPromptable: true
        }]
      })
    }
  ]
}

// ===========================================================================
// Subclass — Life Domain (SRD p17)
// ===========================================================================

/**
 * Life Domain was a class feature on the cleric itself, granted to every
 * cleric at 1st level whether or not they had chosen it — while the class
 * *also* declared a subclass slot pointing at a `srd:subclass.life-domain`
 * that did not exist. One domain, defined twice, neither of them a choice.
 *
 * Preserve Life moves here too: it is a Channel Divinity option the domain
 * grants, not something every cleric has.
 */
export const LIFE_DOMAIN: SubclassDefinition = {
  id: 'srd:subclass.life-domain', name: 'Life Domain',
  provenance: 'srd', contentVersion: 1,
  classId: 'srd:class.cleric',
  features: [
    {
      id: 'srd:subclass.life-domain.bonus-proficiency', name: 'Bonus Proficiency',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:subclass.life-domain.bonus-proficiency', name: 'Bonus Proficiency',
        proficiencies: [prof({ kind: 'armor', category: 'heavy' })]
      })
    },
    {
      id: 'srd:subclass.life-domain.spells', name: 'Life Domain Spells',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:subclass.life-domain.spells', name: 'Life Domain Spells',
        completeness: 'partial',
        // Domain spells are always prepared and do not count against the
        // limit. Only the 1st-level pair exists in the content set; the six
        // above it name spells nobody has authored, and a grant naming a
        // missing spell is an integrity error rather than a silent gap.
        spells: [{
          spellIds: ['srd:spell.bless', 'srd:spell.cure-wounds'],
          availability: 'always', slotGroup: 'cleric', ability: 'wis'
        }],
        narrative: [{
          text: 'Your domain also grants lesser restoration and spiritual weapon at '
            + '3rd level, beacon of hope and revivify at 5th, death ward and '
            + 'guardian of faith at 7th, and mass cure wounds and raise dead at '
            + '9th. None of those eight is in the content set yet, so only bless '
            + 'and cure wounds are granted here.',
          dmPromptable: true
        }]
      })
    },
    {
      id: 'srd:subclass.life-domain.disciple-of-life', name: 'Disciple of Life',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:subclass.life-domain.disciple-of-life', name: 'Disciple of Life',
        completeness: 'partial',
        // A rider on healing done to somebody else, scaled by the slot spent.
        // Healing is not applied by the engine at all, so neither is its rider.
        narrative: [{
          text: 'Whenever you use a spell of 1st level or higher to restore hit '
            + 'points, the creature regains an extra 2 + the spell level. Add it '
            + 'when you roll the healing.',
          dmPromptable: false
        }]
      })
    },
    {
      id: 'srd:subclass.life-domain.preserve-life', name: 'Preserve Life',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 2,
      effects: source({
        id: 'srd:subclass.life-domain.preserve-life', name: 'Preserve Life',
        completeness: 'partial',
        actions: [{
          id: 'cleric.channel-divinity.preserve-life', name: 'Preserve Life',
          kind: 'ability', cost: 'action',
          description: 'Spend Channel Divinity to restore five times your cleric level in hit points, divided as you choose.',
          requirements: { resourceAtLeast: ['cleric.channel-divinity', 1] },
          costs: { 'cleric.channel-divinity': 1 }
        }],
        narrative: [{
          text: 'Divide five times your cleric level in hit points among creatures '
            + 'within 30 feet. It cannot take a creature above half its maximum, '
            + 'and does nothing to undead or constructs. Ask the DM to apply it.',
          dmPromptable: true
        }]
      })
    },
    {
      id: 'srd:subclass.life-domain.blessed-healer', name: 'Blessed Healer',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 6,
      effects: source({
        id: 'srd:subclass.life-domain.blessed-healer', name: 'Blessed Healer',
        completeness: 'partial',
        narrative: [{
          text: 'When you cast a spell of 1st level or higher that restores hit '
            + 'points to someone else, you regain 2 + the spell level yourself.',
          dmPromptable: true
        }]
      })
    },
    {
      id: 'srd:subclass.life-domain.divine-strike', name: 'Divine Strike',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 8,
      effects: source({
        id: 'srd:subclass.life-domain.divine-strike', name: 'Divine Strike',
        completeness: 'partial',
        // Extra damage of a named type, once per turn, on a weapon hit. Damage
        // riders cannot yet be limited to once a turn, and "your turn" is not
        // a thing the engine tracks.
        narrative: [{
          text: 'Once on each of your turns when you hit with a weapon attack, the '
            + 'attack deals an extra 1d8 radiant damage — 2d8 from 14th level. '
            + 'Roll it with your damage.',
          dmPromptable: false
        }]
      })
    },
    {
      id: 'srd:subclass.life-domain.supreme-healing', name: 'Supreme Healing',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 17,
      effects: source({
        id: 'srd:subclass.life-domain.supreme-healing', name: 'Supreme Healing',
        completeness: 'partial',
        narrative: [{
          text: 'When you would roll dice to restore hit points with a spell, use '
            + 'the highest number each die can show instead. The healing roller '
            + 'does not take a maximise flag — take the maximum yourself.',
          dmPromptable: false
        }]
      })
    }
  ]
}

// ===========================================================================
// Kit
// ===========================================================================

export const SHORTSWORD: ItemDefinition = {
  id: 'srd:weapon.shortsword', name: 'Shortsword',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'weapon', rarity: 'common', slot: 'mainHand',
  weapon: {
    category: 'martial', reach: 'melee', damage: { count: 1, sides: 6 },
    damageType: 'piercing', properties: ['finesse', 'light']
  },
  effects: source({ id: 'srd:weapon.shortsword', name: 'Shortsword', kind: 'item' })
}

export const MACE: ItemDefinition = {
  id: 'srd:weapon.mace', name: 'Mace',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'weapon', rarity: 'common', slot: 'mainHand',
  weapon: {
    category: 'simple', reach: 'melee', damage: { count: 1, sides: 6 },
    damageType: 'bludgeoning', properties: []
  },
  effects: source({ id: 'srd:weapon.mace', name: 'Mace', kind: 'item' })
}

export const PARTY_SPECIES: SpeciesDefinition[] = [HALFLING, HUMAN]
export const PARTY_CLASSES: ClassDefinition[] = [ROGUE, CLERIC]
export const PARTY_SUBCLASSES: SubclassDefinition[] = [LIFE_DOMAIN, THIEF]

/** Columns nothing reads yet. */
export const ROGUE_TABLE = {
  asiLevels: ROGUE_ASI_LEVELS,
  sneakAttackDice: ROGUE_SNEAK_ATTACK_DICE
}

/** Columns nothing reads yet. */
export const CLERIC_TABLE = {
  asiLevels: CLERIC_ASI_LEVELS,
  cantripsKnown: CLERIC_CANTRIPS_KNOWN,
  channelDivinityUses: CLERIC_CHANNEL_DIVINITY_USES,
  maxSpellLevel: CLERIC_MAX_SPELL_LEVEL
}
export const PARTY_ITEMS: ItemDefinition[] = [SHORTSWORD, MACE]
