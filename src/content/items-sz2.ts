// Magic items, catalogue section S-Z, part 2 (docs/srd/10-magic-items.md §11).
//
// Trident of Fish Command through Wings of Flying — closing out the
// catalogue with the thirteen-item Wands sub-table (Wand of the War Mage
// +1 already exists from the starter wizard kit in wizard.ts and isn't
// repeated; +2 and +3 are new here). The SRD's own parenthetical on this
// table draws a real distinction this batch honours: "(attunement)" alone
// takes anyone, "(spellcaster)" gates attunement on `canCastSpells`.
//
// Weapon +1/+2/+3 is the mirror image of Armor +1/+2/+3's partial status:
// a magic weapon bonus is already modeled everywhere in this catalogue as
// a toggle-gated overlay on the character's own weapon (Dagger of Venom,
// Dragon Slayer, Holy Avenger's core bonus), never as a full replacement
// weapon profile the way armor is — so the generic tiered item has nothing
// left dangling and is `complete`.
//
// Checked against docs/srd/10-magic-items.md §11 (Catalogue: S-Z, part 2).

import type { DiceExpr, EffectSource, ItemDefinition, Modifier } from '../rules/types.js'
import { ATTACK_ROLL, DAMAGE_WEAPON, SPELL_ATTACK, speedPath } from '../rules/statPaths.js'

const V = '2014'
let n = 0
const id = () => `isz2${++n}`

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

const WEAPON_BONUS_TIERS = [
  { tier: 1, rarity: 'uncommon' as const },
  { tier: 2, rarity: 'rare' as const },
  { tier: 3, rarity: 'veryRare' as const }
]

export const WEAPON_PLUS: ItemDefinition[] = WEAPON_BONUS_TIERS.map(({ tier, rarity }) => ({
  id: `srd:item.weapon-plus-${tier}`, name: `Weapon, +${tier}`,
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'weapon' as const, rarity, slot: 'mainHand' as const,
  effects: source({
    id: `srd:item.weapon-plus-${tier}`, name: `Weapon, +${tier}`,
    modifiers: [
      add(ATTACK_ROLL, tier, { condition: { playerToggle: `item.weapon-plus-${tier}` }, note: `weapon +${tier}: turn off when not using it` }),
      add(DAMAGE_WEAPON, tier, { condition: { playerToggle: `item.weapon-plus-${tier}` }, note: `weapon +${tier}: turn off when not using it` })
    ]
  })
}))

export const WAND_OF_THE_WAR_MAGE_2: ItemDefinition = {
  id: 'srd:item.wand-of-the-war-mage-2', name: 'Wand of the War Mage +2',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare', slot: 'offHand',
  requiresAttunement: true, attunementPrerequisite: { canCastSpells: true },
  effects: source({
    id: 'srd:item.wand-of-the-war-mage-2', name: 'Wand of the War Mage +2',
    // The spell attack bonus is real. Ignoring half cover on spell attacks
    // has no cover-state channel here.
    completeness: 'partial',
    modifiers: [add(SPELL_ATTACK, 2)],
    narrative: [{ text: 'You ignore half cover when making a spell attack.', dmPromptable: true }]
  })
}

export const WAND_OF_THE_WAR_MAGE_3: ItemDefinition = {
  id: 'srd:item.wand-of-the-war-mage-3', name: 'Wand of the War Mage +3',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'veryRare', slot: 'offHand',
  requiresAttunement: true, attunementPrerequisite: { canCastSpells: true },
  effects: source({
    id: 'srd:item.wand-of-the-war-mage-3', name: 'Wand of the War Mage +3',
    completeness: 'partial',
    modifiers: [add(SPELL_ATTACK, 3)],
    narrative: [{ text: 'You ignore half cover when making a spell attack.', dmPromptable: true }]
  })
}

export const VORPAL_SWORD: ItemDefinition = {
  id: 'srd:item.vorpal-sword', name: 'Vorpal Sword',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'weapon', rarity: 'legendary', slot: 'mainHand', requiresAttunement: true,
  effects: source({
    id: 'srd:item.vorpal-sword', name: 'Vorpal Sword',
    // The attack and damage bonus are real. Ignoring resistance to
    // slashing damage and the natural-20 decapitation both have no channel
    // here.
    completeness: 'partial',
    modifiers: [
      add(ATTACK_ROLL, 3, { condition: { playerToggle: 'item.vorpal-sword' }, note: 'vorpal sword: turn off when not using it' }),
      add(DAMAGE_WEAPON, 3, { condition: { playerToggle: 'item.vorpal-sword' }, note: 'vorpal sword: turn off when not using it' })
    ],
    narrative: [{
      text: 'Ignores resistance to slashing damage. On a natural 20 '
        + 'against a creature with at least one head (that is not immune '
        + 'to slashing, headless, or possessed of legendary actions, and '
        + 'not GM-ruled too large), you cut off one of its heads and it '
        + 'dies if it cannot survive without that head; otherwise the '
        + 'attack instead deals an extra 6d8 slashing damage.',
      dmPromptable: true
    }]
  })
}

export const WINGED_BOOTS: ItemDefinition = {
  id: 'srd:item.winged-boots', name: 'Winged Boots',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon', slot: 'boots', requiresAttunement: true,
  effects: source({
    id: 'srd:item.winged-boots', name: 'Winged Boots',
    // A flying speed equal to walking speed, while toggled on, is real.
    // The 4-hour cumulative budget, spendable in 1-minute chunks, the
    // forced descent when it runs out mid-air, and the 2-hours-per-12
    // regeneration are a resource shape (`cumulativeDuration`) this
    // catalogue has deliberately never exercised — see items-ir3.ts.
    completeness: 'partial',
    modifiers: [{
      id: id(), channel: 'value', target: speedPath('fly'), op: 'base',
      value: { stat: speedPath('walk') }, permanence: 'persistent',
      condition: { playerToggle: 'item.winged-boots' },
      note: 'winged boots: flying speed equal to walking speed while active'
    }],
    narrative: [{
      text: 'Usable for up to 4 hours total per day, spendable in chunks '
        + 'of 1 minute or more; running out mid-air means you descend 30 '
        + 'feet per round until you land. You regain 2 hours of flight for '
        + 'every 12 hours the boots go unused. Toggle them on only while '
        + 'actually flying and track the 4-hour budget by hand.',
      dmPromptable: true
    }]
  })
}

export const WINGS_OF_FLYING: ItemDefinition = {
  id: 'srd:item.wings-of-flying', name: 'Wings of Flying',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare', requiresAttunement: true,
  effects: source({
    id: 'srd:item.wings-of-flying', name: 'Wings of Flying',
    completeness: 'partial',
    modifiers: [{
      id: id(), channel: 'value', target: speedPath('fly'), op: 'base', value: 60,
      permanence: 'persistent', condition: { playerToggle: 'item.wings-of-flying' },
      note: 'wings of flying: 60-foot flying speed while active'
    }],
    narrative: [{
      text: 'Action and a command word for 60-foot flying speed, lasting '
        + '1 hour or until dismissed as a bonus action, followed by a '
        + '1d12-hour cooldown. Toggle them on only while actually flying '
        + 'and track the duration and cooldown by hand.',
      dmPromptable: true
    }]
  })
}

export const TRIDENT_OF_FISH_COMMAND: ItemDefinition = {
  id: 'srd:item.trident-of-fish-command', name: 'Trident of Fish Command',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'weapon', rarity: 'uncommon', slot: 'mainHand', requiresAttunement: true,
  charges: { id: 'item.trident-of-fish-command.charges', name: 'Trident of Fish Command', max: 3, refresh: { kind: 'dawn', amount: { count: 1, sides: 3 } }, display: 'uses' },
  effects: source({
    id: 'srd:item.trident-of-fish-command', name: 'Trident of Fish Command',
    completeness: 'partial',
    narrative: [{
      text: 'Action and 1 charge to cast dominate beast (DC 15) on a beast '
        + 'with an innate swimming speed.',
      dmPromptable: true
    }]
  })
}

// ===========================================================================
// Pure narrative — nothing numeric left partially modeled
// ===========================================================================

export const UNIVERSAL_SOLVENT: ItemDefinition = {
  id: 'srd:item.universal-solvent', name: 'Universal Solvent',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'legendary',
  effects: source({
    id: 'srd:item.universal-solvent', name: 'Universal Solvent',
    narrative: [{
      text: 'Action to pour it on a bonded or adhered surface (up to 1 '
        + 'square foot): dissolves the bond instantly, including sovereign glue.',
      dmPromptable: true
    }]
  })
}

export const VICIOUS_WEAPON: ItemDefinition = {
  id: 'srd:item.vicious-weapon', name: 'Vicious Weapon',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'weapon', rarity: 'rare', slot: 'mainHand',
  effects: source({
    id: 'srd:item.vicious-weapon', name: 'Vicious Weapon',
    narrative: [{
      text: 'On a natural 20 against a creature, the critical hit deals an '
        + "extra 2d6 of the weapon's damage type.",
      dmPromptable: true
    }]
  })
}

export const WELL_OF_MANY_WORLDS: ItemDefinition = {
  id: 'srd:item.well-of-many-worlds', name: 'Well of Many Worlds',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'legendary',
  effects: source({
    id: 'srd:item.well-of-many-worlds', name: 'Well of Many Worlds',
    narrative: [{
      text: 'A black cloth that unfolds into a 6-foot circle, creating a '
        + 'two-way portal to another world or plane chosen by the GM. '
        + 'Action to close it. Usable once every 1d8 hours.',
      dmPromptable: true
    }]
  })
}

export const WIND_FAN: ItemDefinition = {
  id: 'srd:item.wind-fan', name: 'Wind Fan',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon',
  effects: source({
    id: 'srd:item.wind-fan', name: 'Wind Fan',
    narrative: [{
      text: 'Action to cast gust of wind (DC 13). Nominally recharges at '
        + 'dawn, but can be used again before then at a cumulative 20% '
        + 'chance per early use of failing and tearing into useless tatters.',
      dmPromptable: true
    }]
  })
}

// ===========================================================================
// Wands — dawn-recharged charge tracks are real; each wand's spell menu, at
// its per-charge cost, stays narrative (see file header note on Staffs).
// ===========================================================================

function wand(wid: string, name: string, opts: {
  rarity: ItemDefinition['rarity']
  attunement?: 'any' | 'spellcaster'
  charges?: { max: number; amount?: number | DiceExpr }
  narrative: string
}): ItemDefinition {
  return {
    id: wid, name,
    provenance: 'srd', contentVersion: 1, rulesetVersion: V,
    category: 'wondrous', rarity: opts.rarity, slot: 'offHand',
    ...(opts.attunement
      ? {
          requiresAttunement: true,
          ...(opts.attunement === 'spellcaster' ? { attunementPrerequisite: { canCastSpells: true } } : {})
        }
      : {}),
    ...(opts.charges
      ? { charges: { id: `${wid}.charges`, name, max: opts.charges.max, refresh: { kind: 'dawn' as const, amount: opts.charges.amount ?? opts.charges.max }, display: 'uses' as const } }
      : {}),
    effects: source({
      id: wid, name,
      completeness: 'partial',
      narrative: [{ text: opts.narrative, dmPromptable: true }]
    })
  }
}

export const WAND_OF_BINDING = wand('srd:item.wand-of-binding', 'Wand of Binding', {
  rarity: 'rare', attunement: 'spellcaster', charges: { max: 7, amount: { count: 1, sides: 6, modifier: 1 } },
  narrative: 'Action and charges to cast hold monster (5) or hold person '
    + '(2), DC 17. Reaction and 1 charge for advantage on a saving throw '
    + 'against being paralyzed or restrained, or on a check to escape a grapple.'
})

export const WAND_OF_ENEMY_DETECTION = wand('srd:item.wand-of-enemy-detection', 'Wand of Enemy Detection', {
  rarity: 'rare', attunement: 'any', charges: { max: 7, amount: { count: 1, sides: 6, modifier: 1 } },
  narrative: '1 charge for 1 minute of knowing the direction, but not '
    + 'distance, of the nearest hostile creature within 60 feet, including '
    + 'ethereal, invisible, disguised, or hidden ones.'
})

export const WAND_OF_FEAR = wand('srd:item.wand-of-fear', 'Wand of Fear', {
  rarity: 'rare', attunement: 'any', charges: { max: 7, amount: { count: 1, sides: 6, modifier: 1 } },
  narrative: '1 charge to cast command (only to flee or grovel), DC 15. 2 '
    + 'charges for a 60-foot cone: DC 15 Wisdom save or frightened for 1 '
    + 'minute, fleeing by the safest route and unable to willingly move '
    + 'closer than 30 feet to you.'
})

export const WAND_OF_FIREBALLS = wand('srd:item.wand-of-fireballs', 'Wand of Fireballs', {
  rarity: 'rare', attunement: 'spellcaster', charges: { max: 7, amount: { count: 1, sides: 6, modifier: 1 } },
  narrative: 'Action and charges to cast fireball, DC 15: 3rd level for 1 '
    + 'charge, +1 spell level per additional charge spent, up to 7 charges at once.'
})

export const WAND_OF_LIGHTNING_BOLTS = wand('srd:item.wand-of-lightning-bolts', 'Wand of Lightning Bolts', {
  rarity: 'rare', attunement: 'spellcaster', charges: { max: 7, amount: { count: 1, sides: 6, modifier: 1 } },
  narrative: 'Action and charges to cast lightning bolt, DC 15: 3rd level '
    + 'for 1 charge, +1 spell level per additional charge spent, up to 7 charges at once.'
})

export const WAND_OF_MAGIC_DETECTION = wand('srd:item.wand-of-magic-detection', 'Wand of Magic Detection', {
  rarity: 'uncommon', charges: { max: 3, amount: { count: 1, sides: 3 } },
  narrative: 'Action and 1 charge to cast detect magic.'
})

export const WAND_OF_MAGIC_MISSILES = wand('srd:item.wand-of-magic-missiles', 'Wand of Magic Missiles', {
  rarity: 'uncommon', charges: { max: 7, amount: { count: 1, sides: 6, modifier: 1 } },
  narrative: 'Action and charges to cast magic missile: 1st level for 1 '
    + 'charge, +1 spell level per additional charge spent, up to 7 charges at once.'
})

export const WAND_OF_PARALYSIS = wand('srd:item.wand-of-paralysis', 'Wand of Paralysis', {
  rarity: 'rare', attunement: 'spellcaster', charges: { max: 7, amount: { count: 1, sides: 6, modifier: 1 } },
  narrative: 'Action and 1 charge for a ray at a creature within 60 feet: '
    + 'DC 15 Constitution save or paralyzed for 1 minute, repeating the '
    + 'save at the end of each of its turns.'
})

export const WAND_OF_POLYMORPH = wand('srd:item.wand-of-polymorph', 'Wand of Polymorph', {
  rarity: 'veryRare', attunement: 'spellcaster', charges: { max: 7, amount: { count: 1, sides: 6, modifier: 1 } },
  narrative: 'Action and 1 charge to cast polymorph, DC 15.'
})

export const WAND_OF_SECRETS = wand('srd:item.wand-of-secrets', 'Wand of Secrets', {
  rarity: 'uncommon', charges: { max: 3, amount: { count: 1, sides: 3 } },
  narrative: 'Action and 1 charge: points at the nearest secret door or '
    + 'trap within 30 feet.'
})

export const WAND_OF_WEB = wand('srd:item.wand-of-web', 'Wand of Web', {
  rarity: 'uncommon', attunement: 'spellcaster', charges: { max: 7, amount: { count: 1, sides: 6, modifier: 1 } },
  narrative: 'Action and 1 charge to cast web, DC 15.'
})

export const WAND_OF_WONDER = wand('srd:item.wand-of-wonder', 'Wand of Wonder', {
  rarity: 'rare', attunement: 'spellcaster', charges: { max: 7, amount: { count: 1, sides: 6, modifier: 1 } },
  narrative: 'Action and 1 charge at a target within 120 feet, then roll '
    + 'd100 on the wand\'s wild-magic table (spell save DC 15; spell '
    + 'ranges become 120 feet): outcomes range from useful spells (slow, '
    + 'lightning bolt, fireball, invisibility, darkness, enlarge) through '
    + 'inconvenient ones (you are stunned, you shrink, heavy rain, an '
    + 'uncontrolled rhinoceros/elephant/rat appears, a swarm of butterflies '
    + 'obscures the area) to a small chance of petrifying whatever the '
    + 'ray hits, on you if no creature was targeted. See '
    + 'docs/srd/10-magic-items.md §11 for the full table; a DM roll helper, '
    + 'not this resolver, is the right place to represent it.'
})

export const ALL_ITEMS_SZ2: ItemDefinition[] = [
  ...WEAPON_PLUS, WAND_OF_THE_WAR_MAGE_2, WAND_OF_THE_WAR_MAGE_3, VORPAL_SWORD,
  WINGED_BOOTS, WINGS_OF_FLYING, TRIDENT_OF_FISH_COMMAND,
  UNIVERSAL_SOLVENT, VICIOUS_WEAPON, WELL_OF_MANY_WORLDS, WIND_FAN,
  WAND_OF_BINDING, WAND_OF_ENEMY_DETECTION, WAND_OF_FEAR, WAND_OF_FIREBALLS,
  WAND_OF_LIGHTNING_BOLTS, WAND_OF_MAGIC_DETECTION, WAND_OF_MAGIC_MISSILES,
  WAND_OF_PARALYSIS, WAND_OF_POLYMORPH, WAND_OF_SECRETS, WAND_OF_WEB, WAND_OF_WONDER
]
