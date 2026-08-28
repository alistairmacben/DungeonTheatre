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

/**
 * Maeve Thornwood, Human Druid 10 (Circle of the Land, forest) — the seat for
 * a feature the app deliberately does not run.
 *
 * Wild Shape is the one class feature in the SRD whose whole point is that the
 * character stops being this character: the druid's statistics are stood down
 * and a beast's are stood up. There is no bestiary in SRD 5.1 and no engine
 * here for running a sheet from a second statblock, so the app tracks the uses
 * and names which row of the Beast Shapes table applies, and the DM keeps the
 * form. That is the design, not a gap waiting to close.
 *
 * Tenth so both Wild Shape improvements have landed, the Cantrips Known column
 * has reached four, and Nature's Ward's poison immunity is in play.
 */
export const MAEVE_THORNWOOD: Character = {
  id: 'char:maeve',
  campaignId: 'camp-1',
  name: 'Maeve Thornwood',
  playerId: 'player-8',
  speciesId: 'srd:species.human',
  classLevels: [{
    classId: 'srd:class.druid', level: 10, subclassId: 'srd:subclass.circle-of-the-land'
  }],
  abilityScoreBase: { str: 10, dex: 14, con: 14, int: 12, wis: 16, cha: 10 },
  buildChoices: [],
  // Human raises CON to 15 (+2): 8 + 2 at 1st, then 5 + 2 per level after
  // (7 x 9 = 63): 73.
  hitPointsCurrent: 73,
  hitPointsTemp: 0,
  hitDiceSpent: {},
  resourcesSpent: {},
  conditions: [],
  effectInstances: [],
  exhaustionLevel: 0,
  selections: {
    'srd:class.druid.proficiencies': { skills: ['nature', 'perception'] },
    'srd:class.druid.cantrips': {
      'cantrips-known': ['srd:spell.druidcraft', 'srd:spell.guidance']
    },
    'srd:class.druid.cantrips-known.4': { 'cantrips-known': ['srd:spell.resistance'] },
    'srd:class.druid.cantrips-known.10': { 'cantrips-known': ['srd:spell.poison-spray'] },
    'srd:subclass.circle-of-the-land.bonus-cantrip': {
      'bonus-cantrip': ['srd:spell.mending']
    },
    'srd:subclass.circle-of-the-land.circle-spells.3': { land: ['forest'] }
  },
  inventory: {
    instances: [
      { instanceId: 'd-scimitar', definitionId: 'srd:weapon.scimitar', contentVersion: 1, identified: true },
      { instanceId: 'd-leather', definitionId: 'srd:armor.leather', contentVersion: 1, identified: true },
      { instanceId: 'd-focus', definitionId: 'srd:item.druidic-focus', contentVersion: 1, identified: true },
      { instanceId: 'd-potion', definitionId: 'srd:item.potion-of-healing', contentVersion: 1, quantity: 2, identified: true }
    ],
    equipped: { mainHand: 'd-scimitar', armor: 'd-leather' },
    attunedInstanceIds: []
  },
  deathSaves: { successes: 0, failures: 0 },
  toggles: { 'wearing-armor': true },
  spellsPrepared: ['srd:spell.cure-wounds', 'srd:spell.longstrider']
}

/**
 * Ser Bryn Halloway, Human Paladin 11 (Oath of Devotion) — the half caster.
 *
 * Every other caster on this roster is a full caster or the warlock. The
 * paladin is the first with the half-caster table: no slots at all at 1st
 * level, and never a slot above 5th no matter how far they climb.
 *
 * Eleventh so the Aura of Protection is bolstering her own saves, Aura of
 * Courage and Aura of Devotion are both suppressing conditions, and Improved
 * Divine Smite has arrived.
 */
export const SER_BRYN: Character = {
  id: 'char:bryn',
  campaignId: 'camp-1',
  name: 'Ser Bryn',
  playerId: 'player-9',
  speciesId: 'srd:species.human',
  classLevels: [{
    classId: 'srd:class.paladin', level: 11, subclassId: 'srd:subclass.devotion'
  }],
  abilityScoreBase: { str: 16, dex: 10, con: 14, int: 8, wis: 10, cha: 15 },
  buildChoices: [],
  // Human raises CON to 15 (+2): 10 + 2 at 1st, then 6 + 2 per level after
  // (8 x 10 = 80): 92.
  hitPointsCurrent: 92,
  hitPointsTemp: 0,
  hitDiceSpent: {},
  resourcesSpent: {},
  conditions: [],
  effectInstances: [],
  exhaustionLevel: 0,
  selections: {
    'srd:class.paladin.core': { skills: ['athletics', 'persuasion'] },
    'srd:class.paladin.fighting-style': { 'fighting-style': ['defense'] }
  },
  inventory: {
    instances: [
      { instanceId: 'p-sword', definitionId: 'srd:weapon.longsword', contentVersion: 1, identified: true },
      { instanceId: 'p-shield', definitionId: 'srd:armor.shield', contentVersion: 1, identified: true },
      { instanceId: 'p-plate', definitionId: 'srd:armor.chain-mail', contentVersion: 1, identified: true },
      { instanceId: 'p-potion', definitionId: 'srd:item.potion-of-healing', contentVersion: 1, quantity: 2, identified: true }
    ],
    equipped: { mainHand: 'p-sword', shield: 'p-shield', armor: 'p-plate' },
    attunedInstanceIds: []
  },
  deathSaves: { successes: 0, failures: 0 },
  // Defense is the style she chose, and the toggle is the fighter's own — one
  // switch per decision, even for a paladin who never took a fighter level.
  toggles: { 'wearing-armor': true, 'fighter.style.defense': true },
  spellsPrepared: ['srd:spell.bless', 'srd:spell.cure-wounds']
}

/**
 * Vessa Emberline, Human Sorcerer 14 (Draconic Bloodline, red) — the last
 * class in the SRD, and the one whose numbers were most wrong.
 *
 * Until the paladin arrived, this character had a spell save DC of 0: the
 * sorcerer never declared one, and nothing noticed because the spell panel was
 * withheld whenever the Spells Known selections were unanswered.
 *
 * Fourteenth so Draconic Resilience's unarmoured AC and hit points are both
 * carrying, three Metamagic options are in hand, and Dragon Wings are
 * available to toggle.
 */
export const VESSA_EMBERLINE: Character = {
  id: 'char:vessa',
  campaignId: 'camp-1',
  name: 'Vessa Emberline',
  playerId: 'player-10',
  speciesId: 'srd:species.human',
  classLevels: [{
    classId: 'srd:class.sorcerer', level: 14, subclassId: 'srd:subclass.draconic-bloodline'
  }],
  abilityScoreBase: { str: 8, dex: 14, con: 12, int: 12, wis: 10, cha: 15 },
  buildChoices: [],
  // Human raises CON to 13 (+1): 6 + 1 at 1st, then 4 + 1 per level after
  // (5 x 13 = 65): 72. Draconic Resilience adds one per sorcerer level: 86.
  hitPointsCurrent: 86,
  hitPointsTemp: 0,
  hitDiceSpent: {},
  resourcesSpent: {},
  conditions: [],
  effectInstances: [],
  exhaustionLevel: 0,
  selections: {
    'srd:class.sorcerer.spellcasting': { skills: ['arcana', 'persuasion'] },
    'srd:class.sorcerer.known-1': {
      cantrips: [
        'srd:spell.fire-bolt', 'srd:spell.ray-of-frost',
        'srd:spell.prestidigitation', 'srd:spell.chill-touch'
      ],
      spells: ['srd:spell.magic-missile', 'srd:spell.shield']
    },
    'srd:class.sorcerer.known-4': { cantrips: ['srd:spell.poison-spray'] },
    'srd:class.sorcerer.metamagic.3': { metamagic: ['quickened', 'twinned'] },
    'srd:class.sorcerer.metamagic.10': { metamagic: ['empowered'] },
    'srd:subclass.draconic-bloodline.dragon-ancestor': { ancestry: ['red'] }
  },
  inventory: {
    instances: [
      { instanceId: 's-dagger', definitionId: 'srd:weapon.dagger', contentVersion: 1, quantity: 2, identified: true },
      { instanceId: 's-crossbow', definitionId: 'srd:weapon.light-crossbow', contentVersion: 1, identified: true },
      { instanceId: 's-potion', definitionId: 'srd:item.potion-of-healing', contentVersion: 1, quantity: 2, identified: true }
    ],
    // No armour at all — the sorcerer is the only SRD class with no armour
    // proficiency, which is what makes Draconic Resilience's 13 + Dex worth
    // having.
    equipped: { mainHand: 's-dagger' },
    attunedInstanceIds: []
  },
  deathSaves: { successes: 0, failures: 0 },
  toggles: {}
}

/** The party. One entry per archetype the content can express today. */
export const PARTY: Character[] = [
  SIR_ALDREN, ILYANA_VESS, PIP_UNDERBOUGH, BROTHER_ALDWIN, WEN_SHAO,
  GROG_IRONJAW, NYX_VAELTHORNE, MAEVE_THORNWOOD, SER_BRYN, VESSA_EMBERLINE
]
