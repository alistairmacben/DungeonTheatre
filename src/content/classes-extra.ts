// Sorcerer and Paladin — proof that resources are data, not class knowledge.
//
// Neither class needs a line of code anywhere in the engine or the view model.
// Each declares resources carrying a `display` hint, and the player view
// renders whatever it is given. The UI never learns that sorcery points exist.

import type { ClassDefinition, EffectSource, ItemDefinition, Modifier, ProficiencyGrant } from '../rules/types.js'
import {
  abilityModifierPath, ARMOR_CLASS, declareResourceMax, HP_MAX, passivePath
} from '../rules/statPaths.js'
import { fullCasterSlots } from './progression.js'

// Resource maxima are ordinary derived stats, declared once and then fed by
// modifiers like anything else — which is why the view can explain where a
// sorcerer's point total came from.
const SORCERY_POINTS_MAX = declareResourceMax('sorceryPoints')
const LAY_ON_HANDS_MAX = declareResourceMax('layOnHands')
const DIVINE_SENSE_MAX = declareResourceMax('divineSense')

/** The Sorcerer table's slot columns, 1st through 9th — identical to the
 *  wizard's; the two classes share one progression, not a coincidence. */
const SORCERER_SLOTS = fullCasterSlots('srd:class.sorcerer', 'sorcerer')

const V = '2014'
let n = 0
const id = () => `x${++n}`

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

// ---------------------------------------------------------------------------

/**
 * KNOWN GAP, found while converting this class's slots to the level ladder:
 * the sorcerer has no `spells` grant at all — no cantrips, no known-spells
 * selection, nothing on either the Sorcerer Cantrips Known or Spells Known
 * columns of the class table. It now has real slots with correct spellSlot
 * tags, and nothing to spend them on. Fixing this needs those two columns
 * transcribed from docs/srd-source/classes.pdf and a `spellList`-kind
 * selection sized off them (the same shape wizard.ts's spellbook grant uses,
 * but "known" rather than "prepared") — deliberately not attempted here,
 * since it is content authoring rather than the mechanical slot conversion
 * this pass was scoped to.
 */
export const SORCERER: ClassDefinition = {
  id: 'srd:class.sorcerer', name: 'Sorcerer', provenance: 'srd', contentVersion: 1,
  hitDie: 6, savingThrowProficiencies: ['con', 'cha'],
  features: [
    {
      id: 'srd:class.sorcerer.spellcasting', name: 'Sorcerer Spellcasting',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:class.sorcerer.spellcasting', name: 'Sorcerer Spellcasting',
        modifiers: [
          add(HP_MAX, {
            sum: [
              { product: [{ characterLevel: true }, 4] },
              { product: [{ characterLevel: true }, { stat: abilityModifierPath('con') }] },
              2
            ]
          }, { note: 'd6 hit die' }),
          // Granting this capability is what satisfies "the ability to cast at
          // least one spell" for Elemental Adept, Spell Sniper and War Caster —
          // the same predicate, no class check.
          {
            id: id(), channel: 'capability', capability: 'castSpells',
            capOp: 'grant', permanence: 'persistent'
          },
          ...SORCERER_SLOTS.modifiers
        ],
        proficiencies: [
          prof({ kind: 'save', ability: 'con' }),
          prof({ kind: 'save', ability: 'cha' }),
          prof({ kind: 'weaponCategory', category: 'simple' }),
          prof({ kind: 'skill', id: 'arcana' }),
          prof({ kind: 'skill', id: 'persuasion' })
        ],
        // The full ladder, 1st through 9th, off the same slot table the
        // wizard uses. Previously three slots with no `spellSlot` tag at
        // all — undiscoverable by resolveSpellcasting, and frozen at the
        // level-5 row. A sorcerer still has no spells to spend them on; see
        // the note on SORCERER below.
        resources: SORCERER_SLOTS.resources
      })
    },
    {
      id: 'srd:class.sorcerer.font-of-magic', name: 'Font of Magic',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 2,
      effects: source({
        id: 'srd:class.sorcerer.font-of-magic', name: 'Font of Magic',
        modifiers: [
          // The maximum equals the sorcerer level — a formula, so it stays
          // correct as the character levels without ever being stored.
          add(SORCERY_POINTS_MAX, { classLevel: 'srd:class.sorcerer' },
            { note: 'sorcery points equal your sorcerer level' })
        ],
        resources: [{
          id: 'sorcerer.sorceryPoints', name: 'Sorcery Points',
          max: SORCERY_POINTS_MAX,
          refresh: { kind: 'longRest' }, display: 'pips', order: 10
        }],
        actions: [{
          id: 'sorcerer.create-slot', name: 'Create Spell Slot', kind: 'ability',
          description: 'Convert sorcery points into a spell slot.',
          cost: 'bonusAction',
          requirements: { resourceAtLeast: ['sorcerer.sorceryPoints', 2] },
          costs: { 'sorcerer.sorceryPoints': 2 }
        }]
      })
    }
  ]
}

export const PALADIN: ClassDefinition = {
  id: 'srd:class.paladin', name: 'Paladin', provenance: 'srd', contentVersion: 1,
  hitDie: 10, savingThrowProficiencies: ['wis', 'cha'],
  features: [
    {
      id: 'srd:class.paladin.core', name: 'Paladin Training',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:class.paladin.core', name: 'Paladin Training',
        modifiers: [
          add(HP_MAX, {
            sum: [
              { product: [{ characterLevel: true }, 6] },
              { product: [{ characterLevel: true }, { stat: abilityModifierPath('con') }] },
              4
            ]
          }, { note: 'd10 hit die' })
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
          prof({ kind: 'skill', id: 'religion' }),
          prof({ kind: 'skill', id: 'athletics' })
        ]
      })
    },
    {
      id: 'srd:class.paladin.lay-on-hands', name: 'Lay on Hands',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:class.paladin.lay-on-hands', name: 'Lay on Hands',
        modifiers: [
          add(LAY_ON_HANDS_MAX, { product: [{ classLevel: 'srd:class.paladin' }, 5] },
            { note: 'five hit points per paladin level' })
        ],
        resources: [{
          id: 'paladin.layOnHands', name: 'Lay on Hands',
          max: LAY_ON_HANDS_MAX,
          refresh: { kind: 'longRest' }, display: 'pool', order: 5
        }],
        actions: [{
          id: 'paladin.lay-on-hands.use', name: 'Lay on Hands', kind: 'ability',
          description: 'Touch a creature and restore hit points from your pool.',
          cost: 'action',
          requirements: { resourceAtLeast: ['paladin.layOnHands', 1] },
          costs: { 'paladin.layOnHands': 1 },
          targets: { selector: 'creature', count: 1, rangeFeet: 5 }
        }]
      })
    },
    {
      id: 'srd:class.paladin.divine-sense', name: 'Divine Sense',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:class.paladin.divine-sense', name: 'Divine Sense',
        modifiers: [
          add(DIVINE_SENSE_MAX,
            { sum: [1, { stat: abilityModifierPath('cha') }] },
            { note: '1 + your Charisma modifier' })
        ],
        resources: [{
          id: 'paladin.divineSense', name: 'Divine Sense',
          max: DIVINE_SENSE_MAX,
          refresh: { kind: 'longRest' }, display: 'uses', order: 6
        }],
        actions: [{
          id: 'paladin.divine-sense.use', name: 'Divine Sense', kind: 'ability',
          cost: 'action',
          requirements: { resourceAtLeast: ['paladin.divineSense', 1] },
          costs: { 'paladin.divineSense': 1 }
        }]
      })
    }
  ]
}

// ---------------------------------------------------------------------------
// More items — a consumable, a ring, and the DM helmet from the brief
// ---------------------------------------------------------------------------

/**
 * The disguise test case.
 *
 * The SRD's potion of poison "is indistinguishable from a potion of healing"
 * until identified, which is why ItemInstance carries apparentDefinitionId. It
 * exists here so the projection has something real to hide: the DM sees this,
 * the player sees a Potion of Healing, and neither of them is being lied to
 * about which they are looking at.
 */
export const POTION_OF_POISON: ItemDefinition = {
  id: 'srd:item.potion-of-poison', name: 'Potion of Poison',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'consumable', rarity: 'uncommon',
  effects: source({
    id: 'srd:item.potion-of-poison', name: 'Potion of Poison', kind: 'item',
    narrative: [{
      text: 'Take 3d6 poison damage and become poisoned for an hour. '
        + 'Indistinguishable from a potion of healing until identified.',
      dmPromptable: false
    }]
  })
}

export const POTION_OF_HEALING: ItemDefinition = {
  id: 'srd:item.potion-of-healing', name: 'Potion of Healing',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'consumable', rarity: 'common',
  effects: source({
    id: 'srd:item.potion-of-healing', name: 'Potion of Healing', kind: 'item',
    narrative: [{ text: 'Regain 2d4 + 2 hit points.', dmPromptable: false }]
  })
}

export const RING_OF_PROTECTION: ItemDefinition = {
  id: 'srd:item.ring-of-protection', name: 'Ring of Protection',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare', slot: 'ring1', requiresAttunement: true,
  effects: source({
    id: 'srd:item.ring-of-protection', name: 'Ring of Protection', kind: 'item',
    modifiers: [
      add(ARMOR_CLASS, 1),
      add('save.str', 1), add('save.dex', 1), add('save.con', 1),
      add('save.int', 1), add('save.wis', 1), add('save.cha', 1)
    ]
  })
}

/**
 * The DM-created helmet from the brief. It declares "+1 AC"; the resolver
 * decides whether that +1 applies. No custom code, no special case, and it
 * competes with SRD content through the ordinary rules.
 */
export const DM_HELM: ItemDefinition = {
  id: 'dm:item.helm-of-the-watchful', name: 'Helm of the Watchful',
  provenance: 'dm', contentVersion: 1, campaignId: 'camp-1', rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon', slot: 'head',
  effects: source({
    id: 'dm:item.helm-of-the-watchful', name: 'Helm of the Watchful', kind: 'item',
    provenance: 'dm', campaignId: 'camp-1',
    modifiers: [add(ARMOR_CLASS, 1), add(passivePath('perception'), 2)]
  })
}

export const EXTRA_CLASSES = [SORCERER, PALADIN]
export const EXTRA_ITEMS = [POTION_OF_HEALING, POTION_OF_POISON, RING_OF_PROTECTION, DM_HELM]
