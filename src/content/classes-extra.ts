// Items the vertical slice needs and no class file owns.
//
// This began as the sorcerer and paladin, both of which have since grown into
// files of their own. What is left is the kit those classes and the scenario
// need: a disguised potion, a ring, and the DM-authored helmet from the brief.

import type { EffectSource, ItemDefinition, Modifier } from '../rules/types.js'
import { ARMOR_CLASS, passivePath } from '../rules/statPaths.js'

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

/** No classes live here any more — every one has a file of its own. */
export const EXTRA_CLASSES = []
export const EXTRA_ITEMS = [POTION_OF_HEALING, POTION_OF_POISON, RING_OF_PROTECTION, DM_HELM]
