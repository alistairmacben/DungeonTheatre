// High Elf Wizard — the first caster.
//
// The reason this file is short is the point of the phase. Spellcasting added
// two pieces of character state and three stat paths; everything else a wizard
// needs already existed. The save DC below is three ordinary modifiers on an
// ordinary stat, which is why the wand further down raises it without anyone
// touching the resolver.

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
const id = () => `wz${++n}`

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
// Species — High Elf
// ===========================================================================

export const ELF: SpeciesDefinition = {
  id: 'srd:species.elf', name: 'Elf', provenance: 'srd', contentVersion: 1,
  size: 'medium', baseWalkSpeed: 30,
  effects: source({
    id: 'srd:species.elf', name: 'Elf', kind: 'species',
    modifiers: [
      add(abilityScorePath('dex'), 2),
      { id: id(), channel: 'value', target: speedPath('walk'), op: 'base', value: 30, permanence: 'persistent' },
      {
        id: id(), channel: 'roll', rollOp: 'advantage',
        scope: { kinds: ['save'], againstTags: ['charm'] },
        permanence: 'persistent', note: 'Fey Ancestry'
      }
    ],
    proficiencies: [prof({ kind: 'skill', id: 'perception' })],
    narrative: [{
      text: 'Fey Ancestry also makes you immune to magical sleep, and Trance '
        + 'means you meditate for four hours rather than sleeping. Darkvision '
        + 'reaches 60 feet.',
      dmPromptable: false
    }]
  }),
  subspecies: [{
    id: 'srd:species.elf.high', name: 'High Elf',
    effects: source({
      id: 'srd:species.elf.high', name: 'High Elf', kind: 'species',
      modifiers: [add(abilityScorePath('int'), 1)],
      // An innate cantrip arrives through the same SpellGrant a whole class
      // list uses: a fixed id, always available, no slot group. Nothing about
      // the shape is racial.
      spells: [{
        spellIds: ['srd:spell.prestidigitation'],
        availability: 'always',
        ability: 'int'
      }],
      proficiencies: [prof({ kind: 'weapon', itemId: 'srd:weapon.longsword' })]
    })
  }]
}

// ===========================================================================
// Class — Wizard, levels 1-5
// ===========================================================================

export const WIZARD: ClassDefinition = {
  id: 'srd:class.wizard', name: 'Wizard', provenance: 'srd', contentVersion: 1,
  hitDie: 6, savingThrowProficiencies: ['int', 'wis'],
  subclassSlot: { grantedAtLevel: 2, options: ['srd:subclass.evocation'] },
  features: [
    {
      id: 'srd:class.wizard.proficiencies', name: 'Wizard Proficiencies',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:class.wizard.proficiencies', name: 'Wizard Proficiencies',
        modifiers: [
          add(HP_MAX, {
            sum: [
              6, { product: [3, { sum: [{ characterLevel: true }, -1] }] },
              { product: [{ stat: abilityModifierPath('con') }, { characterLevel: true }] }
            ]
          }, { note: 'd6 hit die: 3 per level after the first, +6 at 1st, + CON per level' })
        ],
        proficiencies: [
          prof({ kind: 'save', ability: 'int' }),
          prof({ kind: 'save', ability: 'wis' }),
          prof({ kind: 'weapon', itemId: 'srd:weapon.dagger' }),
          prof({ kind: 'skill', id: 'arcana' }),
          prof({ kind: 'skill', id: 'investigation' })
        ]
      })
    },
    {
      id: 'srd:class.wizard.spellcasting', name: 'Spellcasting',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:class.wizard.spellcasting', name: 'Spellcasting',
        modifiers: [
          // "8 + your proficiency bonus + your Intelligence modifier", written
          // as three ordinary modifiers on one ordinary stat. Nothing special
          // resolves this, which is exactly why the wand can raise it.
          { id: id(), channel: 'value', target: SPELL_SAVE_DC, op: 'base', value: 8, permanence: 'persistent' },
          add(SPELL_SAVE_DC, { stat: PROFICIENCY_BONUS }),
          add(SPELL_SAVE_DC, { stat: abilityModifierPath('int') }, { note: 'Intelligence' }),
          add(SPELL_ATTACK, { stat: PROFICIENCY_BONUS }),
          add(SPELL_ATTACK, { stat: abilityModifierPath('int') }, { note: 'Intelligence' }),
          add(SPELLS_PREPARED_MAX, {
            max: [1, {
              sum: [
                { stat: abilityModifierPath('int') },
                { classLevel: 'srd:class.wizard' }
              ]
            }]
          }, { note: 'Intelligence modifier + wizard level, minimum 1' })
        ],
        resources: [
          {
            id: 'wizard.slots.1', name: '1st-level Slots', max: 4,
            refresh: { kind: 'longRest' }, display: 'slots', group: 'Spell Slots',
            order: 1, spellSlot: { group: 'wizard', level: 1 }
          },
          {
            id: 'wizard.slots.2', name: '2nd-level Slots', max: 3,
            refresh: { kind: 'longRest' }, display: 'slots', group: 'Spell Slots',
            order: 2, spellSlot: { group: 'wizard', level: 2 }
          },
          {
            id: 'wizard.slots.3', name: '3rd-level Slots', max: 2,
            refresh: { kind: 'longRest' }, display: 'slots', group: 'Spell Slots',
            order: 3, spellSlot: { group: 'wizard', level: 3 }
          }
        ],
        // Two grants, one type. Cantrips are always available; everything in
        // the spellbook must be prepared. The difference is data.
        spells: [
          {
            spellIds: [
              'srd:spell.fire-bolt', 'srd:spell.ray-of-frost', 'srd:spell.prestidigitation'
            ],
            availability: 'always',
            ability: 'int'
          },
          {
            fromList: { listId: SPELL_LISTS.WIZARD, maxLevel: 3 },
            availability: 'prepared',
            slotGroup: 'wizard',
            ability: 'int'
          }
        ]
      })
    },
    {
      id: 'srd:class.wizard.arcane-recovery', name: 'Arcane Recovery',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:class.wizard.arcane-recovery', name: 'Arcane Recovery',
        resources: [{
          id: 'wizard.arcane-recovery', name: 'Arcane Recovery', max: 1,
          refresh: { kind: 'longRest' }, display: 'uses'
        }],
        actions: [{
          id: 'wizard.arcane-recovery.use', name: 'Arcane Recovery',
          cost: { minutes: 1 },
          description: 'Recover expended spell slots totalling half your wizard level, rounded up.',
          requirements: { resourceAtLeast: ['wizard.arcane-recovery', 1] },
          costs: { 'wizard.arcane-recovery': 1 }
        }],
        narrative: [{
          text: 'Which slots you recover is your choice, up to a total of half '
            + 'your wizard level rounded up, and none above 5th. Restore them '
            + 'from the resource list.',
          dmPromptable: true
        }],
        completeness: 'partial'
      })
    }
  ]
}

// ===========================================================================
// Kit — the dagger already exists in srd.ts; only the wand is new
// ===========================================================================

/**
 * A wizard's staple, and the proof that the DC design paid off: `add` on two
 * stats, no new mechanism, no knowledge of what a spell is.
 */
export const WAND_OF_THE_WAR_MAGE: ItemDefinition = {
  id: 'srd:item.wand-of-the-war-mage', name: 'Wand of the War Mage +1',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon', slot: 'offHand', requiresAttunement: true,
  effects: source({
    id: 'srd:item.wand-of-the-war-mage', name: 'Wand of the War Mage +1', kind: 'item',
    modifiers: [add(SPELL_ATTACK, 1), add(SPELL_SAVE_DC, 1)]
  })
}

export const WIZARD_SPECIES: SpeciesDefinition[] = [ELF]
export const WIZARD_CLASSES: ClassDefinition[] = [WIZARD]
export const WIZARD_ITEMS: ItemDefinition[] = [WAND_OF_THE_WAR_MAGE]
