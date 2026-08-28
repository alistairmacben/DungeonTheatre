// Sorcerer — proof that resources are data, not class knowledge.
//
// Neither class needs a line of code anywhere in the engine or the view model.
// Each declares resources carrying a `display` hint, and the player view
// renders whatever it is given. The UI never learns that sorcery points exist.

import type {
  ClassDefinition, ClassFeatureDefinition, EffectSource, ItemDefinition, Modifier,
  ProficiencyGrant, SelectionDefinition
} from '../rules/types.js'
import {
  abilityModifierPath, ARMOR_CLASS, declareResourceMax, HP_MAX, passivePath,
  SPELL_SAVE_DC, SPELL_ATTACK, PROFICIENCY_BONUS
} from '../rules/statPaths.js'
import { fullCasterSlots } from './progression.js'

// Resource maxima are ordinary derived stats, declared once and then fed by
// modifiers like anything else — which is why the view can explain where a
// sorcerer's point total came from.
const SORCERY_POINTS_MAX = declareResourceMax('sorceryPoints')

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
 * Cantrips Known and Spells Known, transcribed from the Sorcerer table
 * (docs/srd-source/classes.pdf p42, "The Sorcerer"). `values[0]` is level 1.
 *
 * Neither column is a formula — cantrips sit at 4 for three levels, jump to 5,
 * hold six levels, then settle at 6; spells known climbs by exactly one most
 * levels but flatlines at 12, 13, 14 and 15 on the levels an Ability Score
 * Improvement lands instead. A table is the only honest way to say that.
 */
const SORCERER_CANTRIPS_KNOWN = [4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6]
const SORCERER_SPELLS_KNOWN = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15]

/**
 * The sorcerer's cantrip and spell candidates.
 *
 * Genuinely on the SRD sorcerer list (docs/srd/08-spell-lists.md) and already
 * in the content set — nothing here is invented to fill the pool. Short for
 * the same reason the bard's is short: five spells is what the content set
 * currently has tagged, not a ceiling the mechanism imposes. It grows the
 * moment more spells carry `srd:list.sorcerer`.
 */
const SORCERER_CANTRIP_POOL = [
  'srd:spell.fire-bolt', 'srd:spell.ray-of-frost', 'srd:spell.prestidigitation',
  'srd:spell.chill-touch', 'srd:spell.poison-spray'
]
const SORCERER_SPELL_POOL = [
  'srd:spell.magic-missile', 'srd:spell.mage-armor', 'srd:spell.shield',
  'srd:spell.detect-magic', 'srd:spell.charm-person'
]

/**
 * One level's worth of the Cantrips/Spells Known columns, as the increase
 * over the level before — the same shape bard.ts's spellsKnownAtLevel uses,
 * generalised to skip a column that does not move. Four levels in twenty
 * (12th, 14th, 16th, 18th+) add no new spell at all, and a selection asking
 * for zero of anything is not a choice — the content integrity check already
 * rejects one, correctly, so this never builds one.
 */
function sorcererKnownAtLevel(
  level: number, cantrips: number, spells: number
): ClassFeatureDefinition | undefined {
  if (cantrips === 0 && spells === 0) return undefined

  const fid = `srd:class.sorcerer.known-${level}`
  const selections: SelectionDefinition[] = []
  const grants: EffectSource['spells'] = []

  if (cantrips > 0) {
    selections.push({
      id: 'cantrips', prompt: `Learn ${cantrips} more sorcerer cantrip${cantrips === 1 ? '' : 's'}`,
      kind: 'spellList', count: cantrips, from: SORCERER_CANTRIP_POOL
    })
    grants.push({ selectionId: 'cantrips', availability: 'always', ability: 'cha' })
  }

  if (spells > 0) {
    selections.push({
      id: 'spells', prompt: `Learn ${spells} more sorcerer spell${spells === 1 ? '' : 's'}`,
      kind: 'spellList', count: spells, from: SORCERER_SPELL_POOL
    })
    // 'always', not 'prepared': a sorcerer knows a fixed repertoire and casts
    // any of it at will, spending only the slot — there is no daily choice of
    // which known spells are active the way a cleric or wizard has.
    grants.push({
      selectionId: 'spells', availability: 'always', slotGroup: 'sorcerer', ability: 'cha'
    })
  }

  return {
    id: fid, name: `Spells Known (level ${level})`,
    provenance: 'srd', contentVersion: 1, grantedAtLevel: level,
    effects: source({ id: fid, name: `Spells Known (level ${level})`, selections, spells: grants })
  }
}

/** One feature per level with a nonzero delta, in the order the table has them. */
const SORCERER_KNOWN_FEATURES = SORCERER_CANTRIPS_KNOWN
  .map((cantrips, i) => {
    const level = i + 1
    const spells = SORCERER_SPELLS_KNOWN[i]! - (SORCERER_SPELLS_KNOWN[i - 1] ?? 0)
    const cantripDelta = level === 1 ? cantrips : cantrips - SORCERER_CANTRIPS_KNOWN[i - 1]!
    return sorcererKnownAtLevel(level, cantripDelta, spells)
  })
  .filter((f): f is ClassFeatureDefinition => f !== undefined)

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
          // The same three modifiers every other caster's DC is built from,
          // with Charisma. They were missing entirely, so a 5th-level
          // sorcerer's spell save DC was 0 and its attack bonus was +0 — which
          // nothing noticed, because the spell panel was withheld whenever the
          // Spells Known selections were unanswered.
          { id: id(), channel: 'value', target: SPELL_SAVE_DC, op: 'base', value: 8, permanence: 'persistent' },
          add(SPELL_SAVE_DC, { stat: PROFICIENCY_BONUS }),
          add(SPELL_SAVE_DC, { stat: abilityModifierPath('cha') }, { note: 'Charisma' }),
          add(SPELL_ATTACK, { stat: PROFICIENCY_BONUS }),
          add(SPELL_ATTACK, { stat: abilityModifierPath('cha') }, { note: 'Charisma' }),
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
        // level-5 row.
        resources: SORCERER_SLOTS.resources
      })
    },
    // One feature per level the Cantrips/Spells Known columns actually move,
    // built above from the transcribed table.
    ...SORCERER_KNOWN_FEATURES,
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

export const EXTRA_CLASSES = [SORCERER]
export const EXTRA_ITEMS = [POTION_OF_HEALING, POTION_OF_POISON, RING_OF_PROTECTION, DM_HELM]
