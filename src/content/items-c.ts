// Magic items, catalogue section C (docs/srd/10-magic-items.md §8).
//
// Third batch of the SRD's ~347-item catalogue. Cloak of Protection was
// already authored in an earlier pass (src/content/srd.ts) and isn't
// repeated here.
//
// This section is the first to lean on finite, non-recharging charge pools
// (Chime of Opening's ten uses, Deck of Illusions' thirty-four cards) via
// `refresh: { kind: 'never' }`, and the first to use a dice-valued dawn
// refresh (Cube of Force's 1d20, Cubic Gate's 1d3) — `RefreshRule`'s
// `amount?: number | DiceExpr` existed for exactly this and had gone unused.
//
// The Avatar of Death statblock under Deck of Many Things' Skull card is the
// only creature statblock anywhere in the SRD (the doc source calls this
// out explicitly) — skipped entirely, the same as every other monster/beast
// reference, per this project's scope.
//
// Checked against docs/srd/10-magic-items.md §8 (Catalogue: C).

import type { EffectSource, ItemDefinition, Modifier } from '../rules/types.js'
import {
  ATTACK_ROLL, DAMAGE_WEAPON, resistancePath, RESISTANCE_RESISTANT, speedPath
} from '../rules/statPaths.js'

const V = '2014'
let n = 0
const id = () => `ic${++n}`

function source(o: Partial<EffectSource> & { id: string; name: string }): EffectSource {
  return {
    provenance: 'srd', contentVersion: 1, kind: 'item',
    activation: { always: true }, modifiers: [], completeness: 'complete',
    ...o
  }
}

const add = (target: string, value: Modifier['value'], extra: Partial<Modifier> = {}): Modifier =>
  ({ id: id(), channel: 'value', target, op: 'add', value, permanence: 'persistent', ...extra })

// ===========================================================================
// Real modifiers with a rider the resolver can't carry
// ===========================================================================

export const CLOAK_OF_ARACHNIDA: ItemDefinition = {
  id: 'srd:item.cloak-of-arachnida', name: 'Cloak of Arachnida',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'veryRare', slot: 'cloak', requiresAttunement: true,
  effects: source({
    id: 'srd:item.cloak-of-arachnida', name: 'Cloak of Arachnida',
    // Poison resistance and the climbing speed (read live from whatever the
    // walking speed currently is) are real. Immunity to being caught in webs
    // and the action to cast web at double area aren't stats this set tracks.
    completeness: 'partial',
    modifiers: [
      { id: id(), channel: 'value', target: resistancePath('poison'), op: 'set', value: RESISTANCE_RESISTANT, permanence: 'persistent', note: 'cloak of arachnida' },
      { id: id(), channel: 'value', target: speedPath('climb'), op: 'base', value: { stat: speedPath('walk') }, permanence: 'persistent', note: 'cloak of arachnida: climbing speed equal to walking speed, hands free' }
    ],
    narrative: [{
      text: "Also can't be caught in webs (you treat them as difficult "
        + 'terrain instead), and action to cast web (save DC 13) at twice '
        + 'its normal area, once per dawn.',
      dmPromptable: true
    }]
  })
}

export const CLOAK_OF_DISPLACEMENT: ItemDefinition = {
  id: 'srd:item.cloak-of-displacement', name: 'Cloak of Displacement',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare', slot: 'cloak', requiresAttunement: true,
  effects: source({
    id: 'srd:item.cloak-of-displacement', name: 'Cloak of Displacement',
    // The disadvantage-for-attackers is Blur's exact modifier; the
    // self-disabling state machine (suspended after damage until your next
    // turn, and again while incapacitated or restrained) has no clock here.
    completeness: 'partial',
    modifiers: [{
      id: id(), channel: 'roll', rollOp: 'disadvantage', scope: { kinds: ['attack'] },
      appliesTo: 'attackersAgainstSelf', permanence: 'persistent', note: 'cloak of displacement'
    }],
    narrative: [{
      text: 'Stops working the instant you take damage, resuming at the '
        + 'start of your next turn, and is suppressed entirely while you '
        + "are incapacitated, restrained, or otherwise can't move — turn "
        + 'the modifier off by hand whenever one of those applies.',
      dmPromptable: true
    }]
  })
}

export const CLOAK_OF_ELVENKIND: ItemDefinition = {
  id: 'srd:item.cloak-of-elvenkind', name: 'Cloak of Elvenkind',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon', slot: 'cloak', requiresAttunement: true,
  effects: source({
    id: 'srd:item.cloak-of-elvenkind', name: 'Cloak of Elvenkind',
    // The Stealth advantage is real, gated on the hood being up. Imposing
    // disadvantage on *other creatures'* Perception checks made to find you
    // has no channel — every modifier here scopes to a roll you make or an
    // attack against you, never a check someone else makes.
    completeness: 'partial',
    modifiers: [{
      id: id(), channel: 'roll', rollOp: 'advantage', scope: { kinds: ['check'], skills: ['stealth'] },
      condition: { playerToggle: 'item.cloak-of-elvenkind.hood-up' },
      permanence: 'persistent', note: 'cloak of elvenkind: hood up'
    }],
    narrative: [{
      text: 'With the hood up, Wisdom (Perception) checks made to see you '
        + 'also have disadvantage. Raising or lowering the hood is an action.',
      dmPromptable: true
    }]
  })
}

export const CLOAK_OF_THE_BAT: ItemDefinition = {
  id: 'srd:item.cloak-of-the-bat', name: 'Cloak of the Bat',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare', slot: 'cloak', requiresAttunement: true,
  effects: source({
    id: 'srd:item.cloak-of-the-bat', name: 'Cloak of the Bat',
    // The Stealth advantage is real and unconditional. Gripping it for a
    // flying speed in darkness, and casting polymorph into a bat, are both
    // interaction sequences with no stat to preview.
    completeness: 'partial',
    modifiers: [{
      id: id(), channel: 'roll', rollOp: 'advantage', scope: { kinds: ['check'], skills: ['stealth'] },
      permanence: 'persistent', note: 'cloak of the bat'
    }],
    narrative: [{
      text: 'In dim light or darkness, gripping the edges with both hands '
        + 'grants a flying speed of 40 feet, lost the moment you let go or '
        + 'leave the darkness. Also, once per dawn, action to cast '
        + 'polymorph on yourself into a bat, keeping your Intelligence, '
        + 'Wisdom and Charisma.',
      dmPromptable: true
    }]
  })
}

export const CLOAK_OF_THE_MANTA_RAY: ItemDefinition = {
  id: 'srd:item.cloak-of-the-manta-ray', name: 'Cloak of the Manta Ray',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon', slot: 'cloak',
  effects: source({
    id: 'srd:item.cloak-of-the-manta-ray', name: 'Cloak of the Manta Ray',
    // The swimming speed is real, gated on the hood. Breathing underwater
    // is a binary capability this content set doesn't carry a stat for.
    completeness: 'partial',
    modifiers: [{
      id: id(), channel: 'value', target: speedPath('swim'), op: 'base', value: 60,
      condition: { playerToggle: 'item.cloak-of-the-manta-ray.hood-up' },
      permanence: 'persistent', note: 'cloak of the manta ray: hood up'
    }],
    narrative: [{
      text: 'With the hood up, also breathe underwater. Raising or '
        + 'lowering the hood is an action.',
      dmPromptable: true
    }]
  })
}

export const DAGGER_OF_VENOM: ItemDefinition = {
  id: 'srd:item.dagger-of-venom', name: 'Dagger of Venom',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'weapon', rarity: 'rare', slot: 'mainHand',
  charges: { id: 'item.dagger-of-venom.coating', name: 'Venom Coating', max: 1, refresh: { kind: 'dawn' }, display: 'uses' },
  effects: source({
    id: 'srd:item.dagger-of-venom', name: 'Dagger of Venom',
    // The attack and damage bonus are real, gated the same way a fighting
    // style is. The coated-blade ability (its own save-for-damage-and-
    // condition) has no `effect` field on items to carry it.
    completeness: 'partial',
    modifiers: [
      add(ATTACK_ROLL, 1, { condition: { playerToggle: 'item.dagger-of-venom' }, note: 'dagger of venom: turn off when not using it' }),
      add(DAMAGE_WEAPON, 1, { condition: { playerToggle: 'item.dagger-of-venom' }, note: 'dagger of venom: turn off when not using it' })
    ],
    narrative: [{
      text: 'Action to coat the blade — usable once per dawn — for 1 minute '
        + 'or until it hits: the target makes a DC 15 Constitution save or '
        + 'takes 2d10 poison and is poisoned for 1 minute.',
      dmPromptable: true
    }]
  })
}

// ===========================================================================
// A real charge pool, everything else narrative
// ===========================================================================

export const CHIME_OF_OPENING: ItemDefinition = {
  id: 'srd:item.chime-of-opening', name: 'Chime of Opening',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare',
  // Finite and never recharging — it cracks and is useless once spent.
  charges: { id: 'item.chime-of-opening.uses', name: 'Chime of Opening', max: 10, refresh: { kind: 'never' }, display: 'uses' },
  effects: source({
    id: 'srd:item.chime-of-opening', name: 'Chime of Opening',
    completeness: 'partial',
    narrative: [{
      text: 'Action to strike it at an openable object within 120 feet, '
        + 'unless the sound cannot reach it: one lock or latch opens, or '
        + 'the object itself if none remain. After ten uses it cracks and is useless.',
      dmPromptable: true
    }]
  })
}

export const CUBE_OF_FORCE: ItemDefinition = {
  id: 'srd:item.cube-of-force', name: 'Cube of Force',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare', requiresAttunement: true,
  charges: { id: 'item.cube-of-force.charges', name: 'Cube of Force', max: 36, refresh: { kind: 'dawn', amount: { count: 1, sides: 20 } }, display: 'pool' },
  effects: source({
    id: 'srd:item.cube-of-force', name: 'Cube of Force',
    completeness: 'partial',
    narrative: [{
      text: 'Action to press a face and spend its charges (1-5, the sixth '
        + 'deactivates): a 15-foot barrier centred on and moving with you '
        + 'lasts a minute, blocking progressively more (gases, then '
        + 'nonliving matter, then living matter, then spell effects, then '
        + 'everything). You cannot move the barrier into an impassable '
        + 'object. Charges are also lost when the barrier is struck by '
        + 'certain spells, tracked by hand.',
      dmPromptable: true
    }]
  })
}

export const CUBIC_GATE: ItemDefinition = {
  id: 'srd:item.cubic-gate', name: 'Cubic Gate',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'legendary',
  charges: { id: 'item.cubic-gate.charges', name: 'Cubic Gate', max: 3, refresh: { kind: 'dawn', amount: { count: 1, sides: 3 } }, display: 'pool' },
  effects: source({
    id: 'srd:item.cubic-gate', name: 'Cubic Gate',
    completeness: 'partial',
    narrative: [{
      text: 'Six sides, each keyed to a plane (one is the Material Plane). '
        + 'Press once to cast gate; press twice to cast plane shift (DC 17).',
      dmPromptable: true
    }]
  })
}

export const DECK_OF_ILLUSIONS: ItemDefinition = {
  id: 'srd:item.deck-of-illusions', name: 'Deck of Illusions',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon',
  // Finite and never recharging — a found deck is usually missing some
  // already; a full deck is the ceiling this tracks.
  charges: { id: 'item.deck-of-illusions.cards', name: 'Deck of Illusions', max: 34, refresh: { kind: 'never' }, display: 'uses' },
  effects: source({
    id: 'srd:item.deck-of-illusions', name: 'Deck of Illusions',
    // No beast statblocks are carried here to draw — the same gap Animal
    // Shapes and Bag of Tricks leave.
    completeness: 'partial',
    narrative: [{
      text: 'Action to draw a random card and throw it within 30 feet: a '
        + 'harmless, real-seeming illusory creature forms, matching the '
        + 'card (a red dragon, a beholder, a lich, an iron golem, and '
        + 'thirty more). This content set carries no creature statblocks — '
        + 'narrate the illusion by hand.',
      dmPromptable: true
    }]
  })
}

// ===========================================================================
// No roll, or a roll with no effect field to carry it — narrative only
// ===========================================================================

export const CANDLE_OF_INVOCATION: ItemDefinition = {
  id: 'srd:item.candle-of-invocation', name: 'Candle of Invocation',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'veryRare', requiresAttunement: true,
  effects: source({
    id: 'srd:item.candle-of-invocation', name: 'Candle of Invocation',
    completeness: 'partial',
    narrative: [{
      text: 'Dedicated to a deity and shares its alignment. Lighting it '
        + '(an action) burns 4 hours total before it is destroyed, snuffed '
        + 'and resumed in 1-minute increments. While lit, in its 30-foot '
        + 'dim light: a creature of matching alignment has advantage on '
        + 'attacks, saves and checks, and a matching cleric or druid casts '
        + 'prepared 1st-level spells without a slot. Lighting it for the '
        + 'first time can instead cast gate, destroying the candle.',
      dmPromptable: true
    }]
  })
}

export const CAPE_OF_THE_MOUNTEBANK: ItemDefinition = {
  id: 'srd:item.cape-of-the-mountebank', name: 'Cape of the Mountebank',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare',
  charges: { id: 'item.cape-of-the-mountebank.uses', name: 'Cape of the Mountebank', max: 1, refresh: { kind: 'dawn' }, display: 'uses' },
  effects: source({
    id: 'srd:item.cape-of-the-mountebank', name: 'Cape of the Mountebank',
    completeness: 'partial',
    narrative: [{
      text: 'Action to cast dimension door, leaving and arriving in '
        + 'clouds of smoke that lightly obscure both spaces until the end '
        + 'of your next turn.',
      dmPromptable: true
    }]
  })
}

export const CARPET_OF_FLYING: ItemDefinition = {
  id: 'srd:item.carpet-of-flying', name: 'Carpet of Flying',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'veryRare',
  effects: source({
    id: 'srd:item.carpet-of-flying', name: 'Carpet of Flying',
    // Size, capacity and flying speed are rolled once on a d100 table when
    // the carpet is found, not a fixed stat this entry can carry generically.
    completeness: 'partial',
    narrative: [{
      text: 'Action and a command word: obeys your spoken directions while '
        + 'you stay within 30 feet. Size (3x5 to 6x9 ft), capacity (200 to '
        + '800 lb) and flying speed (80 to 30 ft) are rolled once on a d100 '
        + 'table when found — roll by hand. Can carry double the listed '
        + 'weight at half speed.',
      dmPromptable: true
    }]
  })
}

export const CENSER_OF_CONTROLLING_AIR_ELEMENTALS: ItemDefinition = {
  id: 'srd:item.censer-of-controlling-air-elementals', name: 'Censer of Controlling Air Elementals',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare',
  charges: { id: 'item.censer-of-controlling-air-elementals.uses', name: 'Censer of Controlling Air Elementals', max: 1, refresh: { kind: 'dawn' }, display: 'uses' },
  effects: source({
    id: 'srd:item.censer-of-controlling-air-elementals', name: 'Censer of Controlling Air Elementals',
    completeness: 'partial',
    narrative: [{
      text: 'While incense burns in it, action and a command word to '
        + 'summon an air elemental. No creature statblock is carried here '
        + 'to summon — narrate the result by hand.',
      dmPromptable: true
    }]
  })
}

export const CIRCLET_OF_BLASTING: ItemDefinition = {
  id: 'srd:item.circlet-of-blasting', name: 'Circlet of Blasting',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon',
  charges: { id: 'item.circlet-of-blasting.uses', name: 'Circlet of Blasting', max: 1, refresh: { kind: 'dawn' }, display: 'uses' },
  effects: source({
    id: 'srd:item.circlet-of-blasting', name: 'Circlet of Blasting',
    // The spell it casts uses a fixed +5 attack bonus of its own, not the
    // wearer's — an item-supplied override this content set's spell grant
    // has no field for (only "which of the wearer's abilities powers it").
    completeness: 'partial',
    narrative: [{
      text: 'Once per dawn, action to cast scorching ray at a fixed +5 '
        + 'attack bonus, regardless of your own spellcasting or attack '
        + 'bonus.',
      dmPromptable: true
    }]
  })
}

export const CRYSTAL_BALL: ItemDefinition = {
  id: 'srd:item.crystal-ball', name: 'Crystal Ball',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'veryRare', requiresAttunement: true,
  effects: source({
    id: 'srd:item.crystal-ball', name: 'Crystal Ball',
    // Casts at a fixed DC of its own (17), not the wearer's spell save DC,
    // and suspends the concentration requirement per cast — neither has a
    // field on this content set's spell grant.
    completeness: 'partial',
    narrative: [{
      text: 'Touching it lets you cast scrying (DC 17) with no '
        + 'concentration required. Legendary variants add one of: Mind '
        + 'Reading (cast detect thoughts DC 17 on creatures near the '
        + 'sensor, no concentration), Telepathy (talk telepathically with '
        + 'creatures near the sensor, plus cast suggestion DC 17 through '
        + 'it once per dawn, no concentration), or True Seeing (truesight '
        + '120 feet centred on the sensor).',
      dmPromptable: true
    }]
  })
}

export const DANCING_SWORD: ItemDefinition = {
  id: 'srd:item.dancing-sword', name: 'Dancing Sword',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'weapon', rarity: 'veryRare', requiresAttunement: true,
  effects: source({
    id: 'srd:item.dancing-sword', name: 'Dancing Sword',
    completeness: 'partial',
    narrative: [{
      text: 'Bonus action and a command word to toss it aloft: it flies 30 '
        + 'feet and attacks a creature within 5 feet of it, using your '
        + 'attack roll and your ability modifier for damage. Bonus action '
        + 'each turn to move it 30 feet (within 30 feet of you) and attack '
        + 'again; after its fourth attack it returns to your hand.',
      dmPromptable: true
    }]
  })
}

export const DECANTER_OF_ENDLESS_WATER: ItemDefinition = {
  id: 'srd:item.decanter-of-endless-water', name: 'Decanter of Endless Water',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon',
  effects: source({
    id: 'srd:item.decanter-of-endless-water', name: 'Decanter of Endless Water',
    completeness: 'partial',
    narrative: [{
      text: 'Action, remove the stopper and speak a command word; water '
        + 'pours until the start of your next turn — Stream (1 gallon), '
        + 'Fountain (5 gallons), or Geyser (30 gallons in a 30-foot jet, '
        + 'aimable as a bonus action at a creature: DC 13 Strength save or '
        + '1d4 bludgeoning and prone).',
      dmPromptable: true
    }]
  })
}

export const DECK_OF_MANY_THINGS: ItemDefinition = {
  id: 'srd:item.deck-of-many-things', name: 'Deck of Many Things',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'legendary',
  effects: source({
    id: 'srd:item.deck-of-many-things', name: 'Deck of Many Things',
    // Every card is a distinct, often permanent, character-altering effect
    // (a level, an ability score, a curse, a summoned enemy) — a random
    // table of one-off narrative consequences, not a repeatable stat.
    completeness: 'partial',
    narrative: [{
      text: 'Declare how many cards you will draw, then draw at random; '
        + 'excess draws have no effect. Twenty-two possible cards, from '
        + 'beneficial (a level, +50,000 XP, +2 to an ability score up to '
        + '24, a wish) to catastrophic (entombment, all wealth lost, every '
        + 'magic item disintegrated, a devil or a monster hunting you). '
        + 'Roll on the SRD table by hand — this content set carries no '
        + 'statblock for what the Skull card summons.',
      dmPromptable: true
    }]
  })
}

// ===========================================================================
// Registration
// ===========================================================================

export const ALL_ITEMS_C: ItemDefinition[] = [
  CLOAK_OF_ARACHNIDA, CLOAK_OF_DISPLACEMENT, CLOAK_OF_ELVENKIND, CLOAK_OF_THE_BAT,
  CLOAK_OF_THE_MANTA_RAY, DAGGER_OF_VENOM,
  CHIME_OF_OPENING, CUBE_OF_FORCE, CUBIC_GATE, DECK_OF_ILLUSIONS,
  CANDLE_OF_INVOCATION, CAPE_OF_THE_MOUNTEBANK, CARPET_OF_FLYING,
  CENSER_OF_CONTROLLING_AIR_ELEMENTALS, CIRCLET_OF_BLASTING, CRYSTAL_BALL,
  DANCING_SWORD, DECANTER_OF_ENDLESS_WATER, DECK_OF_MANY_THINGS
]
