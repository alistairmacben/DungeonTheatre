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
  ClassDefinition, EffectSource, ItemDefinition, Modifier, ProficiencyGrant,
  SpeciesDefinition
} from '../rules/types.js'
import {
  abilityModifierPath, abilityScorePath, HP_MAX, PROFICIENCY_BONUS,
  SPELL_ATTACK, SPELL_SAVE_DC, SPELLS_PREPARED_MAX, speedPath
} from '../rules/statPaths.js'
import { SPELL_LISTS } from './spells.js'

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
          }, { note: 'Wisdom modifier + cleric level, minimum 1' })
        ],
        resources: [
          {
            id: 'cleric.slots.1', name: '1st-level Slots', max: 4,
            refresh: { kind: 'longRest' }, display: 'slots', group: 'Spell Slots',
            order: 1, spellSlot: { group: 'cleric', level: 1 }
          },
          {
            id: 'cleric.slots.2', name: '2nd-level Slots', max: 3,
            refresh: { kind: 'longRest' }, display: 'slots', group: 'Spell Slots',
            order: 2, spellSlot: { group: 'cleric', level: 2 }
          },
          {
            id: 'cleric.slots.3', name: '3rd-level Slots', max: 2,
            refresh: { kind: 'longRest' }, display: 'slots', group: 'Spell Slots',
            order: 3, spellSlot: { group: 'cleric', level: 3 }
          }
        ],
        spells: [
          {
            spellIds: ['srd:spell.sacred-flame'],
            availability: 'always', ability: 'wis'
          },
          // The difference from the wizard is one word: a cleric prepares from
          // the whole list rather than from a book. Same grant type.
          {
            fromList: { listId: SPELL_LISTS.CLERIC, maxLevel: 3 },
            availability: 'prepared', slotGroup: 'cleric', ability: 'wis'
          }
        ]
      })
    },
    {
      id: 'srd:class.cleric.life-domain', name: 'Life Domain',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:class.cleric.life-domain', name: 'Life Domain',
        proficiencies: [prof({ kind: 'armor', category: 'heavy' })],
        // Domain spells are always prepared and do not count against the limit.
        // Third grant, still no third mechanism.
        spells: [{
          spellIds: ['srd:spell.bless', 'srd:spell.cure-wounds'],
          availability: 'always', slotGroup: 'cleric', ability: 'wis'
        }],
        narrative: [{
          text: 'Disciple of Life: a healing spell of 1st level or higher '
            + 'restores an extra 2 + the spell’s level hit points.',
          dmPromptable: false
        }]
      })
    },
    {
      id: 'srd:class.cleric.channel-divinity', name: 'Channel Divinity',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 2,
      effects: source({
        id: 'srd:class.cleric.channel-divinity', name: 'Channel Divinity',
        resources: [{
          id: 'cleric.channel-divinity', name: 'Channel Divinity', max: 1,
          refresh: { kind: 'shortRest' }, display: 'uses'
        }],
        actions: [
          {
            id: 'cleric.channel-divinity.turn-undead', name: 'Turn Undead', cost: 'action',
            description: 'Undead within 30 feet must save or be turned for a minute.',
            requirements: { resourceAtLeast: ['cleric.channel-divinity', 1] },
            costs: { 'cleric.channel-divinity': 1 }
          },
          {
            id: 'cleric.channel-divinity.preserve-life', name: 'Preserve Life', cost: 'action',
            description: 'Restore hit points equal to five times your cleric level, divided among creatures.',
            requirements: { resourceAtLeast: ['cleric.channel-divinity', 1] },
            costs: { 'cleric.channel-divinity': 1 }
          }
        ]
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
export const PARTY_ITEMS: ItemDefinition[] = [SHORTSWORD, MACE]
