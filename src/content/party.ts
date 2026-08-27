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
  abilityModifierPath, abilityScorePath, declareResourceMax, HP_MAX, PROFICIENCY_BONUS,
  SPELL_ATTACK, SPELL_SAVE_DC, SPELLS_PREPARED_MAX, speedPath
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
          prof({ kind: 'skill', id: 'stealth' }),
          prof({ kind: 'skill', id: 'acrobatics' }),
          prof({ kind: 'skill', id: 'investigation' }),
          prof({ kind: 'skill', id: 'perception' })
        ]
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
        proficiencies: [
          prof({ kind: 'skill', id: 'stealth' }, 'expertise'),
          prof({ kind: 'skill', id: 'perception' }, 'expertise')
        ]
      })
    },
    {
      id: 'srd:class.rogue.sneak-attack', name: 'Sneak Attack',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:class.rogue.sneak-attack', name: 'Sneak Attack',
        narrative: [{
          text: 'Once per turn you deal an extra 3d6 damage to a target you hit '
            + 'with a finesse or ranged weapon, if you had advantage or if an '
            + 'ally is within 5 feet of it. Whether the condition is met is a '
            + 'judgement the engine cannot make — declare it at the table.',
          toggleId: 'rogue.sneak-attack', dmPromptable: true
        }],
        completeness: 'partial'
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
        actions: [{
          id: 'rogue.uncanny-dodge.use', name: 'Uncanny Dodge', cost: 'reaction',
          description: 'Halve the damage from one attack you can see.',
          requirements: { always: true }
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
            + 'destroyed if its challenge rating is at or below your threshold: '
            + 'CR 1/2 at 5th level, 1 at 8th, 2 at 11th, 3 at 14th, 4 at 17th.',
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
export const PARTY_SUBCLASSES: SubclassDefinition[] = [LIFE_DOMAIN]

/** Columns nothing reads yet. */
export const CLERIC_TABLE = {
  asiLevels: CLERIC_ASI_LEVELS,
  cantripsKnown: CLERIC_CANTRIPS_KNOWN,
  channelDivinityUses: CLERIC_CHANNEL_DIVINITY_USES,
  maxSpellLevel: CLERIC_MAX_SPELL_LEVEL
}
export const PARTY_ITEMS: ItemDefinition[] = [SHORTSWORD, MACE]
