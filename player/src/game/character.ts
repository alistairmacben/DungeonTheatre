// The canonical playable character for the vertical slice.
//
// Inputs only — no derived values. Everything the HUD shows about Sir Aldren is
// computed by the resolver from this, which is the point: if the shield comes
// off, nothing here changes except `equipped`.

import type { Character } from '@engine'

export const SIR_ALDREN: Character = {
  id: 'char:aldren',
  campaignId: 'camp-1',
  name: 'Sir Aldren',
  playerId: 'player-1',
  speciesId: 'srd:species.dwarf',
  subspeciesId: 'srd:species.dwarf.hill',
  classLevels: [{ classId: 'srd:class.fighter', level: 5 }],
  abilityScoreBase: { str: 16, dex: 12, con: 13, int: 10, wis: 12, cha: 8 },
  buildChoices: [{ atLevel: 4, kind: 'feat', value: 'srd:feat.tough' }],
  hitPointsCurrent: 47,
  hitPointsTemp: 0,
  hitDiceSpent: {},
  resourcesSpent: {},
  conditions: [],
  effectInstances: [],
  exhaustionLevel: 0,
  inventory: {
    instances: [
      { instanceId: 'i-mail', definitionId: 'srd:armor.chain-mail', contentVersion: 1, identified: true },
      { instanceId: 'i-shield', definitionId: 'srd:armor.shield', contentVersion: 1, identified: true },
      { instanceId: 'i-sword', definitionId: 'srd:weapon.longsword', contentVersion: 1, identified: true },
      { instanceId: 'i-cloak', definitionId: 'srd:item.cloak-of-protection', contentVersion: 1, identified: true },
      { instanceId: 'i-bow', definitionId: 'srd:weapon.longbow', contentVersion: 1, identified: true },
      { instanceId: 'i-helm', definitionId: 'dm:item.helm-of-the-watchful', contentVersion: 1, identified: true },
      { instanceId: 'i-potion', definitionId: 'srd:item.potion-of-healing', contentVersion: 1, quantity: 2, identified: true }
    ],
    equipped: { armor: 'i-mail', shield: 'i-shield', mainHand: 'i-sword', cloak: 'i-cloak' },
    attunedInstanceIds: ['i-cloak']
  },
  deathSaves: { successes: 0, failures: 0 },
  toggles: { 'wearing-armor': true }
}

/**
 * Ilyana Vess, High Elf Wizard 5 — the party's second archetype.
 *
 * Here to be looked at, not to be tested: the tests already assert the wizard's
 * numbers. What she proves on screen is that the same HUD, the same menu and
 * the same disclosure render a caster with no caster-specific component.
 */
export const ILYANA_VESS: Character = {
  id: 'char:ilyana',
  campaignId: 'camp-1',
  name: 'Ilyana Vess',
  playerId: 'player-2',
  speciesId: 'srd:species.elf',
  subspeciesId: 'srd:species.elf.high',
  classLevels: [{ classId: 'srd:class.wizard', level: 5 }],
  abilityScoreBase: { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 },
  buildChoices: [{ atLevel: 4, kind: 'feat', value: 'srd:feat.observant' }],
  // Her maximum is 28: d6, five levels, Constitution 14.
  hitPointsCurrent: 24,
  hitPointsTemp: 0,
  hitDiceSpent: {},
  resourcesSpent: {},
  conditions: [],
  effectInstances: [],
  exhaustionLevel: 0,
  inventory: {
    instances: [
      { instanceId: 'w-dagger', definitionId: 'srd:weapon.dagger', contentVersion: 1, identified: true },
      { instanceId: 'w-wand', definitionId: 'srd:item.wand-of-the-war-mage', contentVersion: 1, identified: true },
      { instanceId: 'w-leather', definitionId: 'srd:armor.leather', contentVersion: 1, identified: true },
      { instanceId: 'w-potion', definitionId: 'srd:item.potion-of-healing', contentVersion: 1, quantity: 1, identified: true }
    ],
    equipped: { mainHand: 'w-dagger', offHand: 'w-wand' },
    attunedInstanceIds: ['w-wand']
  },
  deathSaves: { successes: 0, failures: 0 },
  toggles: {},
  spellsPrepared: [
    'srd:spell.magic-missile',
    'srd:spell.mage-armor',
    'srd:spell.shield',
    'srd:spell.detect-magic',
    'srd:spell.longstrider',
    'srd:spell.protection-from-energy'
  ]
}

/** The party. One entry per archetype the content can express today. */
export const PARTY: Character[] = [SIR_ALDREN, ILYANA_VESS]
