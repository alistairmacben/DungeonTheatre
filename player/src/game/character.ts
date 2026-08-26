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

/**
 * Pip Underbough, Lightfoot Halfling Rogue 5 — the skill and bonus-action test.
 *
 * Expertise doubles her proficiency in Stealth and Perception, and Cunning
 * Action gives her three bonus actions that cost no resource at all. If the HUD
 * reads well for her it reads well for a character whose turn is not "attack".
 */
export const PIP_UNDERBOUGH: Character = {
  id: 'char:pip',
  campaignId: 'camp-1',
  name: 'Pip Underbough',
  playerId: 'player-3',
  speciesId: 'srd:species.halfling',
  subspeciesId: 'srd:species.halfling.lightfoot',
  classLevels: [{ classId: 'srd:class.rogue', level: 5 }],
  abilityScoreBase: { str: 10, dex: 16, con: 14, int: 13, wis: 12, cha: 14 },
  buildChoices: [{ atLevel: 4, kind: 'feat', value: 'srd:feat.alert' }],
  hitPointsCurrent: 33,
  hitPointsTemp: 0,
  hitDiceSpent: {},
  resourcesSpent: {},
  conditions: [],
  effectInstances: [],
  exhaustionLevel: 0,
  inventory: {
    instances: [
      { instanceId: 'r-short', definitionId: 'srd:weapon.shortsword', contentVersion: 1, identified: true },
      { instanceId: 'r-dagger', definitionId: 'srd:weapon.dagger', contentVersion: 1, identified: true },
      { instanceId: 'r-leather', definitionId: 'srd:armor.leather', contentVersion: 1, identified: true },
      { instanceId: 'r-bow', definitionId: 'srd:weapon.longbow', contentVersion: 1, identified: true },
      { instanceId: 'r-potion', definitionId: 'srd:item.potion-of-healing', contentVersion: 1, quantity: 3, identified: true }
    ],
    equipped: { mainHand: 'r-short', armor: 'r-leather' },
    attunedInstanceIds: []
  },
  deathSaves: { successes: 0, failures: 0 },
  toggles: {}
}

/**
 * Brother Aldwin, Human Cleric 5 — the preparation and resource test.
 *
 * He prepares from an entire class list rather than a book, his domain spells
 * are always prepared on top of that, and Channel Divinity is a short-rest
 * resource with two different things to spend it on.
 */
export const BROTHER_ALDWIN: Character = {
  id: 'char:aldwin',
  campaignId: 'camp-1',
  name: 'Brother Aldwin',
  playerId: 'player-4',
  speciesId: 'srd:species.human',
  classLevels: [{ classId: 'srd:class.cleric', level: 5 }],
  abilityScoreBase: { str: 14, dex: 10, con: 14, int: 10, wis: 16, cha: 12 },
  buildChoices: [{ atLevel: 4, kind: 'feat', value: 'srd:feat.resilient' }],
  hitPointsCurrent: 38,
  hitPointsTemp: 0,
  hitDiceSpent: {},
  resourcesSpent: {},
  conditions: [],
  effectInstances: [],
  exhaustionLevel: 0,
  inventory: {
    instances: [
      { instanceId: 'c-mace', definitionId: 'srd:weapon.mace', contentVersion: 1, identified: true },
      { instanceId: 'c-mail', definitionId: 'srd:armor.chain-mail', contentVersion: 1, identified: true },
      { instanceId: 'c-shield', definitionId: 'srd:armor.shield', contentVersion: 1, identified: true },
      { instanceId: 'c-potion', definitionId: 'srd:item.potion-of-healing', contentVersion: 1, quantity: 2, identified: true }
    ],
    equipped: { mainHand: 'c-mace', armor: 'c-mail', shield: 'c-shield' },
    attunedInstanceIds: []
  },
  deathSaves: { successes: 0, failures: 0 },
  toggles: { 'wearing-armor': true },
  spellsPrepared: [
    'srd:spell.detect-magic',
    'srd:spell.protection-from-energy'
  ]
}

/**
 * Wen Shao, Human Monk 10 — the level-scaling test.
 *
 * Ten rather than five on purpose: the monk was the first class authored past
 * the level-5 ceiling every other file in this party stops at, and 10th level
 * is where that actually shows — a ki pool of 10, +20 feet of Unarmored
 * Movement, and Purity of Body's poison immunity, none of which a level-5
 * character could ever have demonstrated.
 */
export const WEN_SHAO: Character = {
  id: 'char:wen',
  campaignId: 'camp-1',
  name: 'Wen Shao',
  playerId: 'player-5',
  speciesId: 'srd:species.human',
  classLevels: [{ classId: 'srd:class.monk', level: 10 }],
  abilityScoreBase: { str: 10, dex: 16, con: 14, int: 10, wis: 15, cha: 8 },
  buildChoices: [{ atLevel: 4, kind: 'feat', value: 'srd:feat.athlete' }],
  // 8 + CON at 1st (10), then 5 + CON per level after (7 × 9 = 63): 73.
  hitPointsCurrent: 73,
  hitPointsTemp: 0,
  hitDiceSpent: {},
  resourcesSpent: {},
  conditions: [],
  effectInstances: [],
  exhaustionLevel: 0,
  inventory: {
    instances: [
      { instanceId: 'm-shortsword', definitionId: 'srd:weapon.shortsword', contentVersion: 1, identified: true },
      { instanceId: 'm-darts', definitionId: 'srd:weapon.dart', contentVersion: 1, quantity: 10, identified: true },
      { instanceId: 'm-potion', definitionId: 'srd:item.potion-of-healing', contentVersion: 1, quantity: 2, identified: true }
    ],
    // No armour, no shield, nothing in mainHand: Unarmored Defense and
    // Unarmored Movement both gate on it, and a monk fighting bare-handed
    // needs no weapon equipped for Martial Arts to apply.
    equipped: {},
    attunedInstanceIds: []
  },
  deathSaves: { successes: 0, failures: 0 },
  toggles: {}
}

/** The party. One entry per archetype the content can express today. */
export const PARTY: Character[] = [
  SIR_ALDREN, ILYANA_VESS, PIP_UNDERBOUGH, BROTHER_ALDWIN, WEN_SHAO
]
