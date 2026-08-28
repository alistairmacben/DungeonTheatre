// Magic items, catalogue section D-I, part 1 (docs/srd/10-magic-items.md §9).
//
// Catalogue D-I is the largest section in the SRD by a wide margin, so it's
// split across several batches the way no earlier catalogue letter needed to
// be. Part 1 runs Defender through Gem of Brightness.
//
// Dragon Scale Mail is printed as one entry naming ten dragon colours, each
// with its own fixed resistance — expanded into ten real items the way Belt
// of Giant Strength and Ammunition's tiers already were, rather than left as
// a single generic "pick a colour" entry. Dwarven Thrower is the first item
// whose attunement prerequisite reads the wearer's species
// (`{ speciesIs: 'srd:species.dwarf' }`) rather than a class or capability.
//
// A recurring gap worth naming once: `DAMAGE_WEAPON` only ever adds a flat
// number, so "+2d6 fire on every hit" (Flame Tongue) or "+1d6 cold on every
// hit" (Frost Brand) has no channel to preview — only a flat weapon bonus
// like Dagger of Venom's +1 does.
//
// Checked against docs/srd/10-magic-items.md §9 (Catalogue: D-I).

import type { EffectSource, ItemDefinition, Modifier } from '../rules/types.js'
import {
  abilityScorePath, ARMOR_CLASS, ATTACK_ROLL, DAMAGE_WEAPON, resistancePath, RESISTANCE_RESISTANT
} from '../rules/statPaths.js'
import { armor } from './srd.js'

const V = '2014'
let n = 0
const id = () => `id1${++n}`

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
// Real modifiers, fully resolved
// ===========================================================================

const DRAGON_COLORS = [
  { color: 'Black', type: 'acid' }, { color: 'Blue', type: 'lightning' },
  { color: 'Brass', type: 'fire' }, { color: 'Bronze', type: 'lightning' },
  { color: 'Copper', type: 'acid' }, { color: 'Gold', type: 'fire' },
  { color: 'Green', type: 'poison' }, { color: 'Red', type: 'fire' },
  { color: 'Silver', type: 'cold' }, { color: 'White', type: 'cold' }
]

export const DRAGON_SCALE_MAILS: ItemDefinition[] = DRAGON_COLORS.map(({ color, type }) => {
  const key = color.toLowerCase()
  const aid = `srd:item.dragon-scale-mail-${key}`
  // Scale mail's own base AC (13) and Dexterity cap (2), not a bare `add`
  // stacked on nothing — the same real-armor-profile shape Leather and
  // Chain Mail already use, plus the +1 enhancement and the fixed resistance.
  const base = armor(aid, `${color} Dragon Scale Mail`,
    { category: 'medium', baseAc: 13, dexCap: 2, stealthDisadvantage: true },
    [
      add(ARMOR_CLASS, 1, { note: `${key} dragon scale mail` }),
      { id: id(), channel: 'value', target: resistancePath(type), op: 'set', value: RESISTANCE_RESISTANT, permanence: 'persistent', note: `${key} dragon scale mail` }
    ])
  return {
    ...base, rarity: 'veryRare', requiresAttunement: true,
    effects: {
      ...base.effects,
      // The AC and the fixed resistance are real. Advantage against a
      // dragon's Frightful Presence and breath weapons has no scope for
      // "abilities used by dragons specifically," and sensing the nearest
      // dragon is a utility ability with nothing to preview.
      completeness: 'partial',
      narrative: [{
        text: 'Also advantage on saves against a dragon\'s Frightful '
          + 'Presence and breath weapons, and once per dawn, action to '
          + 'sense the distance and direction to the nearest dragon of '
          + 'this color within 30 miles.',
        dmPromptable: true
      }]
    }
  }
})

const DWARVEN_PLATE_BASE = armor('srd:item.dwarven-plate', 'Dwarven Plate',
  { category: 'heavy', baseAc: 18, dexCap: 0, strengthRequirement: 15, stealthDisadvantage: true },
  [add(ARMOR_CLASS, 2)])

export const DWARVEN_PLATE: ItemDefinition = {
  ...DWARVEN_PLATE_BASE, rarity: 'veryRare',
  effects: {
    ...DWARVEN_PLATE_BASE.effects,
    completeness: 'partial',
    narrative: [{
      text: 'Also a reaction to reduce forced movement along the ground '
        + 'against you by up to 10 feet.',
      dmPromptable: true
    }]
  }
}

const ELVEN_CHAIN_BASE = armor('srd:item.elven-chain', 'Elven Chain',
  { category: 'medium', baseAc: 13, dexCap: 2 },
  [add(ARMOR_CLASS, 1)])

export const ELVEN_CHAIN: ItemDefinition = {
  ...ELVEN_CHAIN_BASE, rarity: 'rare',
  effects: {
    ...ELVEN_CHAIN_BASE.effects,
    // The AC is real. Waiving its own proficiency requirement isn't a stat
    // — this content set doesn't gate armor's AC bonus on proficiency in
    // the first place, so there's nothing for the waiver to override.
    completeness: 'partial',
    narrative: [{
      text: 'You count as proficient with it even without medium armor proficiency.',
      dmPromptable: false
    }]
  }
}

const DEMON_ARMOR_BASE = armor('srd:item.demon-armor', 'Demon Armor',
  { category: 'heavy', baseAc: 18, dexCap: 0, strengthRequirement: 15, stealthDisadvantage: true },
  [add(ARMOR_CLASS, 1)])

export const DEMON_ARMOR: ItemDefinition = {
  ...DEMON_ARMOR_BASE, rarity: 'veryRare', requiresAttunement: true,
  effects: {
    ...DEMON_ARMOR_BASE.effects,
    // The AC is real. Unarmed strikes becoming magic weapons with their
    // own attack/damage bonus and die, and the disadvantage curse scoped
    // to "demons," have no channel — weapon-shape isn't a stat, and
    // there's no creature-type scope for a roll modifier.
    completeness: 'partial',
    narrative: [{
      text: 'Also understand and speak Abyssal, and your unarmed strikes '
        + 'become magic weapons dealing 1d8 slashing with +1 to attack and '
        + "damage. Curse: can't be removed without remove curse; "
        + 'disadvantage on attack rolls against demons and on saves '
        + 'against their spells and abilities.',
      dmPromptable: true
    }]
  }
}

export const DRAGON_SLAYER: ItemDefinition = {
  id: 'srd:item.dragon-slayer', name: 'Dragon Slayer',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'weapon', rarity: 'rare', slot: 'mainHand',
  effects: source({
    id: 'srd:item.dragon-slayer', name: 'Dragon Slayer',
    completeness: 'partial',
    modifiers: [
      add(ATTACK_ROLL, 1, { condition: { playerToggle: 'item.dragon-slayer' }, note: 'dragon slayer: turn off when not using it' }),
      add(DAMAGE_WEAPON, 1, { condition: { playerToggle: 'item.dragon-slayer' }, note: 'dragon slayer: turn off when not using it' })
    ],
    narrative: [{
      text: "Against a creature of the dragon type (including dragon "
        + "turtles and wyverns), deals an extra 3d6 of the weapon's damage "
        + 'type. No creature-type tagging exists here — apply it by hand.',
      dmPromptable: true
    }]
  })
}

export const DWARVEN_THROWER: ItemDefinition = {
  id: 'srd:item.dwarven-thrower', name: 'Dwarven Thrower',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'weapon', rarity: 'veryRare', slot: 'mainHand',
  requiresAttunement: true, attunementPrerequisite: { speciesIs: 'srd:species.dwarf' },
  effects: source({
    id: 'srd:item.dwarven-thrower', name: 'Dwarven Thrower',
    completeness: 'partial',
    modifiers: [
      add(ATTACK_ROLL, 3, { condition: { playerToggle: 'item.dwarven-thrower' }, note: 'dwarven thrower: turn off when not using it' }),
      add(DAMAGE_WEAPON, 3, { condition: { playerToggle: 'item.dwarven-thrower' }, note: 'dwarven thrower: turn off when not using it' })
    ],
    narrative: [{
      text: 'Also gains the thrown property (20/60) and returns to your '
        + 'hand immediately after a ranged hit, which deals an extra 1d8, '
        + 'or 2d8 against giants.',
      dmPromptable: true
    }]
  })
}

export const GAUNTLETS_OF_OGRE_POWER: ItemDefinition = {
  id: 'srd:item.gauntlets-of-ogre-power', name: 'Gauntlets of Ogre Power',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon', slot: 'gloves', requiresAttunement: true,
  effects: source({
    id: 'srd:item.gauntlets-of-ogre-power', name: 'Gauntlets of Ogre Power',
    modifiers: [{
      id: id(), channel: 'value', target: abilityScorePath('str'), op: 'min',
      value: 19, permanence: 'persistent', note: 'gauntlets of ogre power'
    }],
    narrative: [{
      text: 'While worn, your Strength score is 19. No effect if it is already 19 or higher.',
      dmPromptable: false
    }]
  })
}

export const FROST_BRAND: ItemDefinition = {
  id: 'srd:item.frost-brand', name: 'Frost Brand',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'weapon', rarity: 'veryRare', slot: 'mainHand', requiresAttunement: true,
  effects: source({
    id: 'srd:item.frost-brand', name: 'Frost Brand',
    // Fire resistance while held is real. The extra 1d6 cold on every hit
    // has no channel, and the light/flame-extinguishing utility has nothing
    // to preview either.
    completeness: 'partial',
    modifiers: [{
      id: id(), channel: 'value', target: resistancePath('fire'), op: 'set',
      value: RESISTANCE_RESISTANT, permanence: 'persistent', note: 'frost brand: while held'
    }],
    narrative: [{
      text: 'Deals an extra 1d6 cold on every hit. In freezing '
        + 'temperatures it sheds light. Drawing it extinguishes all '
        + 'nonmagical flames within 30 feet, once per hour.',
      dmPromptable: true
    }]
  })
}

export const EYES_OF_MINUTE_SEEING: ItemDefinition = {
  id: 'srd:item.eyes-of-minute-seeing', name: 'Eyes of Minute Seeing',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon',
  effects: source({
    id: 'srd:item.eyes-of-minute-seeing', name: 'Eyes of Minute Seeing',
    // Advantage on the Investigation check is real, broader than RAW's
    // "that rely on sight within 1 foot" scope, the same trade-off Boots
    // of Elvenkind already makes.
    completeness: 'partial',
    modifiers: [{
      id: id(), channel: 'roll', rollOp: 'advantage', scope: { kinds: ['check'], skills: ['investigation'] },
      permanence: 'persistent', note: 'eyes of minute seeing'
    }],
    narrative: [{
      text: 'RAW scopes the advantage to Investigation checks that rely on '
        + 'sight within one foot — this grants it on every Investigation '
        + 'check, since this vocabulary has no narrower cut.',
      dmPromptable: true
    }]
  })
}

export const EYES_OF_THE_EAGLE: ItemDefinition = {
  id: 'srd:item.eyes-of-the-eagle', name: 'Eyes of the Eagle',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon', slot: 'amulet', requiresAttunement: true,
  effects: source({
    id: 'srd:item.eyes-of-the-eagle', name: 'Eyes of the Eagle',
    completeness: 'partial',
    modifiers: [{
      id: id(), channel: 'roll', rollOp: 'advantage', scope: { kinds: ['check'], skills: ['perception'] },
      permanence: 'persistent', note: 'eyes of the eagle'
    }],
    narrative: [{
      text: 'RAW scopes the advantage to Perception checks that rely on '
        + 'sight — this grants it on every Perception check. In clear '
        + 'conditions, also make out details as small as 2 feet across at extreme distance.',
      dmPromptable: true
    }]
  })
}

// ===========================================================================
// A real charge pool, everything else narrative
// ===========================================================================

export const EYES_OF_CHARMING: ItemDefinition = {
  id: 'srd:item.eyes-of-charming', name: 'Eyes of Charming',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon', requiresAttunement: true,
  charges: { id: 'item.eyes-of-charming.charges', name: 'Eyes of Charming', max: 3, refresh: { kind: 'dawn' }, display: 'uses' },
  effects: source({
    id: 'srd:item.eyes-of-charming', name: 'Eyes of Charming',
    completeness: 'partial',
    narrative: [{
      text: 'Action and 1 charge to cast charm person (DC 13) on a '
        + 'humanoid within 30 feet you can mutually see.',
      dmPromptable: true
    }]
  })
}

export const GEM_OF_BRIGHTNESS: ItemDefinition = {
  id: 'srd:item.gem-of-brightness', name: 'Gem of Brightness',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon',
  charges: { id: 'item.gem-of-brightness.charges', name: 'Gem of Brightness', max: 50, refresh: { kind: 'never' }, display: 'pool' },
  effects: source({
    id: 'srd:item.gem-of-brightness', name: 'Gem of Brightness',
    completeness: 'partial',
    narrative: [{
      text: 'Command words: bright/dim light (no charge); 1 charge for a '
        + 'beam at one creature within 60 feet (DC 15 Constitution save or '
        + 'blinded 1 minute, repeatable save); 5 charges for the same '
        + 'save on everyone in a 30-foot cone. Spent, it becomes a '
        + 'nonmagical jewel worth 50 gp.',
      dmPromptable: true
    }]
  })
}

// ===========================================================================
// No roll, or a roll with no effect field to carry it — narrative only
// ===========================================================================

export const DEFENDER: ItemDefinition = {
  id: 'srd:item.defender', name: 'Defender',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'weapon', rarity: 'legendary', slot: 'mainHand', requiresAttunement: true,
  effects: source({
    id: 'srd:item.defender', name: 'Defender',
    // A player-allocated bonus pool split across attack and AC, re-declared
    // every turn — nothing this content set's fixed modifiers can express.
    completeness: 'partial',
    narrative: [{
      text: '+3 to attack and damage. On your first attack each turn, '
        + 'transfer any part of that bonus to AC instead (for example +1 '
        + 'attack / +2 AC), lasting until the start of your next turn and '
        + 'only while you hold the sword.',
      dmPromptable: true
    }]
  })
}

export const DIMENSIONAL_SHACKLES: ItemDefinition = {
  id: 'srd:item.dimensional-shackles', name: 'Dimensional Shackles',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare',
  effects: source({
    id: 'srd:item.dimensional-shackles', name: 'Dimensional Shackles',
    completeness: 'partial',
    narrative: [{
      text: 'Action to place on an incapacitated creature (Small to '
        + 'Large): blocks all extradimensional movement, though not '
        + 'passing through a portal. You and designated creatures remove '
        + 'them as an action. Once every 30 days the prisoner may attempt '
        + 'a DC 30 Strength (Athletics) check to break free and destroy them.',
      dmPromptable: true
    }]
  })
}

export const DUST_OF_DISAPPEARANCE: ItemDefinition = {
  id: 'srd:item.dust-of-disappearance', name: 'Dust of Disappearance',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon',
  effects: source({
    id: 'srd:item.dust-of-disappearance', name: 'Dust of Disappearance',
    completeness: 'partial',
    narrative: [{
      text: 'Single use. Action to throw: you and everything within 10 '
        + 'feet become invisible for 2d4 minutes (the same roll for '
        + 'everyone). Attacking or casting a spell ends it for that creature.',
      dmPromptable: true
    }]
  })
}

export const DUST_OF_DRYNESS: ItemDefinition = {
  id: 'srd:item.dust-of-dryness', name: 'Dust of Dryness',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon',
  charges: { id: 'item.dust-of-dryness.pinches', name: 'Dust of Dryness', max: 10, refresh: { kind: 'never' }, display: 'uses' },
  effects: source({
    id: 'srd:item.dust-of-dryness', name: 'Dust of Dryness',
    completeness: 'partial',
    narrative: [{
      text: '1d6+4 pinches (this tracks the maximum, 10 — roll the actual '
        + 'find by hand). A pinch turns a 15-foot cube of water into a '
        + 'marble-sized pellet; smashing it releases the water. A '
        + 'mostly-water elemental exposed to a pinch saves Constitution '
        + '(DC 13) for 10d6 necrotic, half on success.',
      dmPromptable: true
    }]
  })
}

export const DUST_OF_SNEEZING_AND_CHOKING: ItemDefinition = {
  id: 'srd:item.dust-of-sneezing-and-choking', name: 'Dust of Sneezing and Choking',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon',
  effects: source({
    id: 'srd:item.dust-of-sneezing-and-choking', name: 'Dust of Sneezing and Choking',
    completeness: 'partial',
    narrative: [{
      text: 'Appears to be dust of disappearance, and identify confirms '
        + 'that false reading. Action to throw: you and every breathing '
        + 'creature within 30 feet save Constitution (DC 15) or become '
        + "unable to breathe, incapacitated and suffocating, repeating the "
        + 'save each turn while conscious. Ended by lesser restoration.',
      dmPromptable: true
    }]
  })
}

export const EFFICIENT_QUIVER: ItemDefinition = {
  id: 'srd:item.efficient-quiver', name: 'Efficient Quiver',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon',
  effects: source({
    id: 'srd:item.efficient-quiver', name: 'Efficient Quiver',
    // A container with its own capacity across three separate compartments
    // and a weight override — the same gap Bag of Holding leaves.
    completeness: 'partial',
    narrative: [{
      text: 'Three extradimensional compartments, always weighing 2 lb: '
        + '60 arrows or bolts, 18 javelins, and 6 long objects (bows, '
        + 'staffs, spears). Items draw as from an ordinary quiver.',
      dmPromptable: true
    }]
  })
}

export const EFREETI_BOTTLE: ItemDefinition = {
  id: 'srd:item.efreeti-bottle', name: 'Efreeti Bottle',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'veryRare',
  effects: source({
    id: 'srd:item.efreeti-bottle', name: 'Efreeti Bottle',
    completeness: 'partial',
    narrative: [{
      text: 'Action to unstopper; an efreeti appears within 30 feet at '
        + 'the end of your turn. First opening, roll d100: 1-10 it '
        + 'attacks you for 5 rounds then the bottle dies; 11-90 it serves '
        + 'for an hour then the bottle is locked for 24 hours (same roll '
        + 'on the next two openings, escaping on a fourth); 91-00 it '
        + 'casts wish three times for you, then the bottle dies.',
      dmPromptable: true
    }]
  })
}

export const ELEMENTAL_GEM: ItemDefinition = {
  id: 'srd:item.elemental-gem', name: 'Elemental Gem',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon',
  effects: source({
    id: 'srd:item.elemental-gem', name: 'Elemental Gem',
    completeness: 'partial',
    narrative: [{
      text: 'Action to break: summons an elemental as conjure elemental; '
        + 'the gem is spent (blue sapphire for air, yellow diamond for '
        + 'earth, red corundum for fire, emerald for water). No creature '
        + 'statblock is carried here to summon — narrate the result by hand.',
      dmPromptable: true
    }]
  })
}

export const EVERSMOKING_BOTTLE: ItemDefinition = {
  id: 'srd:item.eversmoking-bottle', name: 'Eversmoking Bottle',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon',
  effects: source({
    id: 'srd:item.eversmoking-bottle', name: 'Eversmoking Bottle',
    completeness: 'partial',
    narrative: [{
      text: 'Action to unstopper: a heavily obscured 60-foot-radius cloud, '
        + 'growing 10 feet per minute to a maximum of 120 feet while open. '
        + 'Closing takes an action and a command word; the cloud disperses '
        + '10 minutes later. Moderate wind clears it in a minute, strong '
        + 'wind in a round.',
      dmPromptable: true
    }]
  })
}

export const FEATHER_TOKEN: ItemDefinition = {
  id: 'srd:item.feather-token', name: 'Feather Token',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare',
  effects: source({
    id: 'srd:item.feather-token', name: 'Feather Token',
    completeness: 'partial',
    narrative: [{
      text: 'Single use, one of six forms rolled on a d100: Anchor (a '
        + "vessel can't move for 24 hours), Bird (a giant rideable bird), "
        + "Fan (fills a ship's sails, +5 mph for 8 hours), Swan Boat (a "
        + '50-foot self-propelled boat for 24 hours), Tree (a nonmagical '
        + '60-foot oak), or Whip (a floating, attacking whip for an hour, '
        + 'melee spell attack +9 for 1d6+5 force). Roll the form by hand.',
      dmPromptable: true
    }]
  })
}

export const FIGURINE_OF_WONDROUS_POWER: ItemDefinition = {
  id: 'srd:item.figurine-of-wondrous-power', name: 'Figurine of Wondrous Power',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare',
  effects: source({
    id: 'srd:item.figurine-of-wondrous-power', name: 'Figurine of Wondrous Power',
    // Every one of the nine figurines becomes a real animal or beast this
    // content set carries no statblock for — the same gap Animal Shapes leaves.
    completeness: 'partial',
    narrative: [{
      text: 'Action, a command word, and a throw within 60 feet turns a '
        + 'figurine into a friendly creature for a fixed duration, then a '
        + 'cooldown measured in days (a bronze griffon, an ebony fly, a '
        + 'pair of golden lions, a marble elephant, an obsidian nightmare, '
        + 'an onyx dog, a serpentine owl, a silver raven, or a set of '
        + 'three ivory goats). This content set carries no creature '
        + 'statblocks — narrate the result and track it by hand.',
      dmPromptable: true
    }]
  })
}

export const FLAME_TONGUE: ItemDefinition = {
  id: 'srd:item.flame-tongue', name: 'Flame Tongue',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'weapon', rarity: 'rare', slot: 'mainHand', requiresAttunement: true,
  effects: source({
    id: 'srd:item.flame-tongue', name: 'Flame Tongue',
    // The extra 2d6 fire on every hit has no channel — DAMAGE_WEAPON only
    // ever adds a flat number, not a die expression.
    completeness: 'partial',
    narrative: [{
      text: 'Bonus action and a command word to ignite: sheds light and '
        + 'deals an extra 2d6 fire on every hit until another bonus '
        + 'action, or if dropped or sheathed.',
      dmPromptable: true
    }]
  })
}

export const FOLDING_BOAT: ItemDefinition = {
  id: 'srd:item.folding-boat', name: 'Folding Boat',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare',
  effects: source({
    id: 'srd:item.folding-boat', name: 'Folding Boat',
    completeness: 'partial',
    narrative: [{
      text: 'A small box that floats and stores items. Three command '
        + 'words, each an action: unfold into a 10x4x2 ft rowboat (4 '
        + 'Medium creatures), unfold into a 24x8x6 ft ship (15 Medium '
        + 'creatures), or fold back if empty.',
      dmPromptable: true
    }]
  })
}

// ===========================================================================
// Registration
// ===========================================================================

export const ALL_ITEMS_D1: ItemDefinition[] = [
  ...DRAGON_SCALE_MAILS, DWARVEN_PLATE, ELVEN_CHAIN, DEMON_ARMOR, DRAGON_SLAYER,
  DWARVEN_THROWER, GAUNTLETS_OF_OGRE_POWER, FROST_BRAND,
  EYES_OF_MINUTE_SEEING, EYES_OF_THE_EAGLE, EYES_OF_CHARMING, GEM_OF_BRIGHTNESS,
  DEFENDER, DIMENSIONAL_SHACKLES, DUST_OF_DISAPPEARANCE, DUST_OF_DRYNESS,
  DUST_OF_SNEEZING_AND_CHOKING, EFFICIENT_QUIVER, EFREETI_BOTTLE, ELEMENTAL_GEM,
  EVERSMOKING_BOTTLE, FEATHER_TOKEN, FIGURINE_OF_WONDROUS_POWER, FLAME_TONGUE,
  FOLDING_BOAT
]
