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
  toggles: { 'wearing-armor': true, 'fighter.style.defense': true },
  // Fighting Style and the two skills are choices now, not defaults.
  selections: { 'srd:class.fighter.proficiencies': { skills: ['athletics', 'perception'] } }
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
  // Cantrips are chosen from the Cantrips Known column now, not named by the
  // class for every wizard alike. Three at 5th level.
  selections: {
    'srd:class.wizard.spellcasting': {
      cantrips: [
        'srd:spell.fire-bolt', 'srd:spell.ray-of-frost', 'srd:spell.prestidigitation'
      ]
    }
  },
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
  classLevels: [{
    classId: 'srd:class.rogue', level: 5, subclassId: 'srd:subclass.thief'
  }],
  selections: {
    'srd:class.rogue.proficiencies': {
      skills: ['acrobatics', 'perception', 'sleight-of-hand', 'stealth']
    },
    'srd:class.rogue.expertise': { expertise: ['perception', 'stealth'] }
  },
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
  classLevels: [{
    classId: 'srd:class.cleric', level: 5, subclassId: 'srd:subclass.life-domain'
  }],
  // Life Domain is a subclass now, not something every cleric is handed, and
  // cantrips are chosen from the Cantrips Known column.
  selections: {
    'srd:class.cleric.spellcasting': {
      cantrips: ['srd:spell.sacred-flame', 'srd:spell.guidance', 'srd:spell.light']
    }
  },
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
  classLevels: [{
    classId: 'srd:class.monk', level: 10, subclassId: 'srd:subclass.open-hand'
  }],
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

/**
 * Grog Ironjaw, Half-Orc Barbarian 12 (Path of the Berserker) — the
 * activated-state seat, which the roster did not have.
 *
 * Rage is one switch driving five unrelated mechanics, and none of them could
 * be looked at until a barbarian sat here: the advantage it grants on Strength
 * checks and saves had nowhere to appear on the ability panel at all, which is
 * the sort of thing only a rendered sheet finds.
 *
 * Twelfth rather than fifth so the Rage Damage column has moved off its first
 * row (+3 from 9th) and Mindless Rage and Relentless Rage are both in play.
 */
export const GROG_IRONJAW: Character = {
  id: 'char:grog',
  campaignId: 'camp-1',
  name: 'Grog Ironjaw',
  playerId: 'player-6',
  speciesId: 'srd:species.half-orc',
  classLevels: [{
    classId: 'srd:class.barbarian', level: 12, subclassId: 'srd:subclass.berserker'
  }],
  abilityScoreBase: { str: 16, dex: 14, con: 16, int: 8, wis: 12, cha: 10 },
  buildChoices: [],
  // 12 + CON at 1st (15), then 7 + CON per level after (10 x 11 = 110): 125.
  hitPointsCurrent: 125,
  hitPointsTemp: 0,
  hitDiceSpent: {},
  resourcesSpent: {},
  conditions: [],
  effectInstances: [],
  exhaustionLevel: 0,
  // Two of six skills, chosen — this used to be Athletics and Intimidation for
  // every barbarian the content could produce.
  selections: {
    'srd:class.barbarian.proficiencies': { skills: ['athletics', 'survival'] }
  },
  inventory: {
    instances: [
      { instanceId: 'b-greataxe', definitionId: 'srd:weapon.greataxe', contentVersion: 1, identified: true },
      { instanceId: 'b-javelins', definitionId: 'srd:weapon.javelin', contentVersion: 1, quantity: 4, identified: true },
      { instanceId: 'b-potion', definitionId: 'srd:item.potion-of-healing', contentVersion: 1, quantity: 2, identified: true }
    ],
    // No armour: Unarmored Defense is 10 + DEX + CON, which at CON 16 and
    // DEX 14 beats the hide armour a barbarian would otherwise wear.
    equipped: { mainHand: 'b-greataxe' },
    attunedInstanceIds: []
  },
  deathSaves: { successes: 0, failures: 0 },
  toggles: {}
}

/**
 * Nyx Vaelthorne, Tiefling Warlock 11 (the Fiend) — the odd caster.
 *
 * Every other spellcaster on this roster has a ladder of slots. The warlock
 * has one pool whose *level* climbs, which the engine could not express at all
 * until this character needed it: `spellSlot.level` was a literal number, so
 * the class was three pools with two of them permanently empty.
 *
 * Eleventh so the pool has reached its ceiling of 5th-level slots, the count
 * has just risen to three, and the first Mystic Arcanum is in play.
 */
export const NYX_VAELTHORNE: Character = {
  id: 'char:nyx',
  campaignId: 'camp-1',
  name: 'Nyx Vaelthorne',
  playerId: 'player-7',
  speciesId: 'srd:species.tiefling',
  classLevels: [{
    classId: 'srd:class.warlock', level: 11, subclassId: 'srd:subclass.fiend'
  }],
  abilityScoreBase: { str: 8, dex: 14, con: 14, int: 12, wis: 10, cha: 16 },
  buildChoices: [],
  // 8 + CON at 1st (10), then 5 + CON per level after (7 x 10 = 70): 80.
  hitPointsCurrent: 80,
  hitPointsTemp: 0,
  hitDiceSpent: {},
  resourcesSpent: {},
  conditions: [],
  effectInstances: [],
  exhaustionLevel: 0,
  // Two of seven skills, chosen — this used to be Arcana and Deception for
  // every warlock the content could produce.
  selections: {
    'srd:class.warlock.proficiencies': { skills: ['arcana', 'deception'] },
    'srd:class.warlock.pact-magic': {
      cantrips: ['srd:spell.eldritch-blast', 'srd:spell.chill-touch'],
      'spells-known': ['srd:spell.hellish-rebuke', 'srd:spell.charm-person']
    },
    'srd:class.warlock.pact-boon': { boon: ['pact-of-the-tome'] }
  },
  inventory: {
    instances: [
      { instanceId: 'w-dagger', definitionId: 'srd:weapon.dagger', contentVersion: 1, quantity: 2, identified: true },
      { instanceId: 'w-leather', definitionId: 'srd:armor.leather', contentVersion: 1, identified: true },
      { instanceId: 'w-potion', definitionId: 'srd:item.potion-of-healing', contentVersion: 1, quantity: 2, identified: true }
    ],
    equipped: { mainHand: 'w-dagger', armor: 'w-leather' },
    attunedInstanceIds: []
  },
  deathSaves: { successes: 0, failures: 0 },
  toggles: { 'wearing-armor': true }
}

/** The party. One entry per archetype the content can express today. */
export const PARTY: Character[] = [
  SIR_ALDREN, ILYANA_VESS, PIP_UNDERBOUGH, BROTHER_ALDWIN, WEN_SHAO,
  GROG_IRONJAW, NYX_VAELTHORNE
]
