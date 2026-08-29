// Magic items, catalogue section I-R, part 1 (docs/srd/10-magic-items.md §10).
//
// Catalogue I-R is even larger than D-I (the Rings and Potions sub-tables
// alone are each their own small catalogue), so it's split across several
// batches too. Part 1 runs Iron Bands of Binding through Pearl of Power.
//
// Mithral Armor is the first item that *removes* a property rather than
// granting one — `op: 'suppress'` targeting the `armor-strength-penalty` and
// `armor-stealth-penalty` tags the `armor()` helper already declares, so it
// applies correctly to whichever base armor a DM decides it re-forges,
// without needing a base AC of its own. Oil of Slipperiness reuses Freedom
// of Movement's exact modifier shape for a consumable rather than a spell.
// Necklace of Prayer Beads is the first attunement prerequisite that reads
// "any of these classes" via `{ any: [...] }` around three
// `classLevelAtLeast` checks.
//
// Checked against docs/srd/10-magic-items.md §10 (Catalogue: I-R).

import type { EffectSource, ItemDefinition, Modifier } from '../rules/types.js'
import { ATTACK_ROLL, DAMAGE_WEAPON, movementCostPath } from '../rules/statPaths.js'

const V = '2014'
let n = 0
const id = () => `iir1${++n}`

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

export const MITHRAL_ARMOR: ItemDefinition = {
  id: 'srd:item.mithral-armor', name: 'Mithral Armor',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'armor', rarity: 'uncommon', slot: 'armor',
  effects: source({
    id: 'srd:item.mithral-armor', name: 'Mithral Armor',
    // The suppression is real and applies to whichever base armor it
    // re-forges, wherever that armor already tags its own penalty. It
    // carries no base AC of its own — the SRD names no specific base armor
    // — so a DM still combines it with a chosen armor's real stats by hand.
    completeness: 'partial',
    modifiers: [{
      id: id(), channel: 'value', op: 'suppress', permanence: 'persistent',
      suppresses: { tags: ['armor-strength-penalty', 'armor-stealth-penalty'] },
      note: 'mithral armor: removes the Strength requirement and Stealth disadvantage, if the base armor had them'
    }],
    narrative: [{
      text: 'Medium or heavy armor, but not hide. Track its base AC and '
        + "Dex cap against whichever real armor it re-forges — this "
        + 'generic entry names none.',
      dmPromptable: true
    }]
  })
}

export const OIL_OF_SLIPPERINESS: ItemDefinition = {
  id: 'srd:item.oil-of-slipperiness', name: 'Oil of Slipperiness',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'consumable', rarity: 'uncommon',
  effects: source({
    id: 'srd:item.oil-of-slipperiness', name: 'Oil of Slipperiness',
    // Freedom of Movement's exact shape, applied via a consumable's
    // 10-minute application rather than a spell. Automatic escape from a
    // nonmagical restraint and underwater attack penalties still aren't
    // stats this set tracks, the same gap the spell leaves.
    completeness: 'partial',
    modifiers: [
      {
        id: id(), channel: 'value', target: movementCostPath('difficultTerrain'),
        op: 'set', value: 1, permanence: 'temporary', note: 'oil of slipperiness: unaffected by difficult terrain'
      },
      {
        id: id(), channel: 'value', op: 'suppress', permanence: 'temporary',
        suppresses: { sourceIds: ['srd:condition.paralyzed', 'srd:condition.restrained'] },
        note: 'oil of slipperiness: immune to being paralyzed or restrained'
      }
    ],
    narrative: [{
      text: 'Takes 10 minutes to apply, granting the effect of freedom of '
        + 'movement for 8 hours. Alternatively, poured on the ground as an '
        + 'action for a 10-foot square of grease lasting 8 hours.',
      dmPromptable: true
    }]
  })
}

// ===========================================================================
// Real modifiers with a rider the resolver can't carry
// ===========================================================================

export const LUCK_BLADE: ItemDefinition = {
  id: 'srd:item.luck-blade', name: 'Luck Blade',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'weapon', rarity: 'legendary', slot: 'mainHand', requiresAttunement: true,
  // Found with 1d4-1 charges and never recharging — the wish property is
  // permanently lost at 0, the same finite shape Chime of Opening uses.
  charges: { id: 'item.luck-blade.wish-charges', name: 'Luck Blade (Wish)', max: 3, refresh: { kind: 'never' }, display: 'uses' },
  effects: source({
    id: 'srd:item.luck-blade', name: 'Luck Blade',
    // The attack/damage bonus and the saving-throw bonus are real. The
    // Luck property — reroll any roll you dislike, no action required,
    // once per dawn — is a player choice with no fixed trigger value,
    // unlike Lucky's automatic reroll-on-a-1.
    completeness: 'partial',
    modifiers: [
      add(ATTACK_ROLL, 1, { condition: { playerToggle: 'item.luck-blade' }, note: 'luck blade: turn off when not using it' }),
      add(DAMAGE_WEAPON, 1, { condition: { playerToggle: 'item.luck-blade' }, note: 'luck blade: turn off when not using it' }),
      ...(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map((a) => add(`save.${a}`, 1, { note: 'luck blade: while on your person' }))
    ],
    narrative: [{
      text: 'Luck: once per dawn, no action required, reroll one attack '
        + 'roll, ability check or saving throw you dislike — you must use '
        + 'the second roll. Wish: action and 1 charge to cast wish; the '
        + 'property is lost permanently at 0 charges.',
      dmPromptable: true
    }]
  })
}

export const MACE_OF_SMITING: ItemDefinition = {
  id: 'srd:item.mace-of-smiting', name: 'Mace of Smiting',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'weapon', rarity: 'rare', slot: 'mainHand',
  effects: source({
    id: 'srd:item.mace-of-smiting', name: 'Mace of Smiting',
    // The base +1 is real. The higher bonus against constructs, the
    // natural-20 bonus damage, and the construct-destruction threshold all
    // need creature-type and crit-specific scoping this vocabulary lacks.
    completeness: 'partial',
    modifiers: [
      add(ATTACK_ROLL, 1, { condition: { playerToggle: 'item.mace-of-smiting' }, note: 'mace of smiting: turn off when not using it' }),
      add(DAMAGE_WEAPON, 1, { condition: { playerToggle: 'item.mace-of-smiting' }, note: 'mace of smiting: turn off when not using it' })
    ],
    narrative: [{
      text: "Rises to +3 to attack and damage against constructs. On a "
        + 'natural 20: an extra 2d6 bludgeoning, or 4d6 against a '
        + 'construct, and a construct left at 25 HP or fewer is destroyed.',
      dmPromptable: true
    }]
  })
}

export const PEARL_OF_POWER: ItemDefinition = {
  id: 'srd:item.pearl-of-power', name: 'Pearl of Power',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon',
  requiresAttunement: true, attunementPrerequisite: { canCastSpells: true },
  charges: { id: 'item.pearl-of-power.uses', name: 'Pearl of Power', max: 1, refresh: { kind: 'dawn' }, display: 'uses' },
  effects: source({
    id: 'srd:item.pearl-of-power', name: 'Pearl of Power',
    completeness: 'partial',
    narrative: [{
      text: 'Action and a command word to regain one expended spell slot; '
        + 'a 4th-level or higher slot comes back as 3rd level.',
      dmPromptable: true
    }]
  })
}

export const NECKLACE_OF_PRAYER_BEADS: ItemDefinition = {
  id: 'srd:item.necklace-of-prayer-beads', name: 'Necklace of Prayer Beads',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare', requiresAttunement: true,
  attunementPrerequisite: {
    any: [
      { classLevelAtLeast: ['srd:class.cleric', 1] },
      { classLevelAtLeast: ['srd:class.druid', 1] },
      { classLevelAtLeast: ['srd:class.paladin', 1] }
    ]
  },
  effects: source({
    id: 'srd:item.necklace-of-prayer-beads', name: 'Necklace of Prayer Beads',
    completeness: 'partial',
    narrative: [{
      text: '1d4+2 magic beads; removing one destroys its magic. Each '
        + 'casts a spell as a bonus action using your spell save DC, then '
        + 'recharges at the next dawn — rolled per bead (d20): Blessing '
        + '(bless), Curing (cure wounds at 2nd level, or lesser '
        + 'restoration), Favor (greater restoration), Smiting (branding '
        + 'smite), Summons (planar ally), or Wind Walking (wind walk).',
      dmPromptable: true
    }]
  })
}

// ===========================================================================
// A real charge pool, everything else narrative
// ===========================================================================

export const IRON_BANDS_OF_BINDING: ItemDefinition = {
  id: 'srd:item.iron-bands-of-binding', name: 'Iron Bands of Binding',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare',
  charges: { id: 'item.iron-bands-of-binding.uses', name: 'Iron Bands of Binding', max: 1, refresh: { kind: 'dawn' }, display: 'uses' },
  effects: source({
    id: 'srd:item.iron-bands-of-binding', name: 'Iron Bands of Binding',
    completeness: 'partial',
    narrative: [{
      text: 'Action and a command word, thrown at a Huge or smaller '
        + 'creature within 60 feet: a ranged attack at your Dexterity '
        + 'modifier plus proficiency bonus; on a hit the target is '
        + 'restrained until you release it. Escape: DC 20 Strength check '
        + '— success destroys the item, failure means that creature '
        + 'auto-fails for 24 hours.',
      dmPromptable: true
    }]
  })
}

export const MACE_OF_TERROR: ItemDefinition = {
  id: 'srd:item.mace-of-terror', name: 'Mace of Terror',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'weapon', rarity: 'rare', slot: 'mainHand', requiresAttunement: true,
  charges: { id: 'item.mace-of-terror.charges', name: 'Mace of Terror', max: 3, refresh: { kind: 'dawn', amount: { count: 1, sides: 3 } }, display: 'uses' },
  effects: source({
    id: 'srd:item.mace-of-terror', name: 'Mace of Terror',
    completeness: 'partial',
    narrative: [{
      text: 'Action and 1 charge: chosen creatures in a 30-foot radius '
        + 'save Wisdom (DC 15) or be frightened for 1 minute, unable to '
        + 'approach within 30 feet, repeating the save each turn.',
      dmPromptable: true
    }]
  })
}

export const MEDALLION_OF_THOUGHTS: ItemDefinition = {
  id: 'srd:item.medallion-of-thoughts', name: 'Medallion of Thoughts',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon', requiresAttunement: true,
  charges: { id: 'item.medallion-of-thoughts.charges', name: 'Medallion of Thoughts', max: 3, refresh: { kind: 'dawn', amount: { count: 1, sides: 3 } }, display: 'uses' },
  effects: source({
    id: 'srd:item.medallion-of-thoughts', name: 'Medallion of Thoughts',
    completeness: 'partial',
    narrative: [{ text: 'Action and 1 charge to cast detect thoughts (DC 13).', dmPromptable: true }]
  })
}

export const NINE_LIVES_STEALER: ItemDefinition = {
  id: 'srd:item.nine-lives-stealer', name: 'Nine Lives Stealer',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'weapon', rarity: 'veryRare', slot: 'mainHand', requiresAttunement: true,
  // Found with 1d8+1 charges and never recharging — the property is lost
  // permanently at 0.
  charges: { id: 'item.nine-lives-stealer.charges', name: 'Nine Lives Stealer', max: 9, refresh: { kind: 'never' }, display: 'uses' },
  effects: source({
    id: 'srd:item.nine-lives-stealer', name: 'Nine Lives Stealer',
    completeness: 'partial',
    modifiers: [
      add(ATTACK_ROLL, 2, { condition: { playerToggle: 'item.nine-lives-stealer' }, note: 'nine lives stealer: turn off when not using it' }),
      add(DAMAGE_WEAPON, 2, { condition: { playerToggle: 'item.nine-lives-stealer' }, note: 'nine lives stealer: turn off when not using it' })
    ],
    narrative: [{
      text: 'On a critical hit against a creature with fewer than 100 HP '
        + '(constructs and undead immune), it saves Constitution (DC 15) '
        + 'or dies instantly, spending a charge. Lost permanently at 0 charges.',
      dmPromptable: true
    }]
  })
}

// ===========================================================================
// No roll, or a roll with no effect field to carry it — narrative only
// ===========================================================================

export const IRON_FLASK: ItemDefinition = {
  id: 'srd:item.iron-flask', name: 'Iron Flask',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'legendary',
  effects: source({
    id: 'srd:item.iron-flask', name: 'Iron Flask',
    completeness: 'partial',
    narrative: [{
      text: 'Action and a command word at a visible creature within 60 '
        + 'feet native to another plane: DC 17 Wisdom save or trapped '
        + '(advantage if it has been trapped before). One creature at a '
        + 'time. Releasing it makes it friendly for an hour, then it '
        + 'reverts to its own disposition. This content set carries no '
        + 'creature statblocks — narrate any found contents by hand.',
      dmPromptable: true
    }]
  })
}

export const JAVELIN_OF_LIGHTNING: ItemDefinition = {
  id: 'srd:item.javelin-of-lightning', name: 'Javelin of Lightning',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'weapon', rarity: 'uncommon',
  effects: source({
    id: 'srd:item.javelin-of-lightning', name: 'Javelin of Lightning',
    completeness: 'partial',
    narrative: [{
      text: 'Once per dawn, hurl it with a command word: a 5-foot-wide '
        + 'line to a target within 120 feet; everyone else in it saves '
        + 'Dexterity (DC 13) for 4d6 lightning, half on success. It '
        + 'reverts to a javelin at the target: a ranged weapon attack for '
        + "javelin damage plus 4d6 lightning. Usable as a plain magic "
        + 'weapon meanwhile.',
      dmPromptable: true
    }]
  })
}

export const LANTERN_OF_REVEALING: ItemDefinition = {
  id: 'srd:item.lantern-of-revealing', name: 'Lantern of Revealing',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon',
  effects: source({
    id: 'srd:item.lantern-of-revealing', name: 'Lantern of Revealing',
    narrative: [{
      text: 'A hooded lantern, 6 hours of light per pint of oil, bright '
        + '30 feet / dim 30 feet more. Invisible creatures and objects '
        + 'are visible while in the bright light. Action to hood it down '
        + 'to dim light 5 feet.',
      dmPromptable: false
    }]
  })
}

export const MACE_OF_DISRUPTION: ItemDefinition = {
  id: 'srd:item.mace-of-disruption', name: 'Mace of Disruption',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'weapon', rarity: 'rare', slot: 'mainHand', requiresAttunement: true,
  effects: source({
    id: 'srd:item.mace-of-disruption', name: 'Mace of Disruption',
    completeness: 'partial',
    narrative: [{
      text: 'Against fiends and undead, deals an extra 2d6 radiant; if '
        + 'this leaves the target at 25 HP or fewer, it saves Wisdom (DC '
        + '15) or is destroyed, and on a success is frightened of you '
        + 'until the end of your next turn.',
      dmPromptable: true
    }]
  })
}

const ABILITY_BOOKS = [
  { name: 'Manual of Bodily Health', ability: 'Constitution' },
  { name: 'Manual of Gainful Exercise', ability: 'Strength' },
  { name: 'Manual of Quickness of Action', ability: 'Dexterity' },
  { name: 'Tome of Clear Thought', ability: 'Intelligence' },
  { name: 'Tome of Leadership and Influence', ability: 'Charisma' },
  { name: 'Tome of Understanding', ability: 'Wisdom' }
]

export const ABILITY_BOOKS_ITEMS: ItemDefinition[] = ABILITY_BOOKS.map(({ name, ability }) => {
  const bid = `srd:item.${name.toLowerCase().replace(/ /g, '-')}`
  return {
    id: bid, name,
    provenance: 'srd', contentVersion: 1, rulesetVersion: V,
    category: 'wondrous' as const, rarity: 'veryRare' as const,
    effects: source({
      id: bid, name,
      // A downtime activity that permanently rewrites the character's own
      // base ability score and its cap, consuming the book — not a worn or
      // wielded effect this content set's item-modifier channel expresses.
      completeness: 'partial',
      narrative: [{
        text: `48 hours of study over 6 days or fewer permanently raises `
          + `your ${ability} score by 2, and raises that score's maximum `
          + 'by 2. The book loses its magic and regains it in a century.',
        dmPromptable: true
      }]
    })
  }
})

export const MANUAL_OF_GOLEMS: ItemDefinition = {
  id: 'srd:item.manual-of-golems', name: 'Manual of Golems',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'veryRare',
  effects: source({
    id: 'srd:item.manual-of-golems', name: 'Manual of Golems',
    completeness: 'partial',
    narrative: [{
      text: 'Requires a spellcaster with at least two 5th-level spell '
        + 'slots; anyone else attempting to read it takes 6d6 psychic. '
        + 'Building a golem requires uninterrupted work and supplies '
        + '(clay, flesh, iron or stone, rolled by material). The book is '
        + 'consumed. This content set carries no golem statblock — narrate '
        + 'the result by hand.',
      dmPromptable: true
    }]
  })
}

export const MARVELOUS_PIGMENTS: ItemDefinition = {
  id: 'srd:item.marvelous-pigments', name: 'Marvelous Pigments',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'veryRare',
  effects: source({
    id: 'srd:item.marvelous-pigments', name: 'Marvelous Pigments',
    completeness: 'partial',
    narrative: [{
      text: '1d4 pots; each covers 1,000 square feet, creating up to '
        + '10,000 cubic feet of inanimate objects or terrain, 10 minutes '
        + 'per 100 square feet. Painted things become real and '
        + 'nonmagical. Nothing painted may be worth more than 25 gp.',
      dmPromptable: true
    }]
  })
}

export const MANTLE_OF_SPELL_RESISTANCE: ItemDefinition = {
  id: 'srd:item.mantle-of-spell-resistance', name: 'Mantle of Spell Resistance',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare', requiresAttunement: true,
  effects: source({
    id: 'srd:item.mantle-of-spell-resistance', name: 'Mantle of Spell Resistance',
    // Advantage scoped to "saves against spells specifically" has no
    // narrower cut than "every save" — too broad an approximation for a
    // defensive power at this rarity, so left for the DM rather than
    // silently granted on everything.
    completeness: 'partial',
    narrative: [{ text: 'Advantage on saving throws against spells.', dmPromptable: true }]
  })
}

export const MIRROR_OF_LIFE_TRAPPING: ItemDefinition = {
  id: 'srd:item.mirror-of-life-trapping', name: 'Mirror of Life Trapping',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'veryRare',
  effects: source({
    id: 'srd:item.mirror-of-life-trapping', name: 'Mirror of Life Trapping',
    completeness: 'partial',
    narrative: [{
      text: 'Activated with an action while hanging on a vertical '
        + 'surface. Any creature other than you seeing its reflection '
        + 'within 30 feet saves Charisma (DC 15) or is trapped in one of '
        + 'twelve extradimensional cells (constructs succeed '
        + 'automatically). A thirteenth capture frees a random prisoner. '
        + 'Shattering the mirror (AC 11, 10 HP) frees everyone.',
      dmPromptable: true
    }]
  })
}

export const NECKLACE_OF_ADAPTATION: ItemDefinition = {
  id: 'srd:item.necklace-of-adaptation', name: 'Necklace of Adaptation',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon', requiresAttunement: true,
  effects: source({
    id: 'srd:item.necklace-of-adaptation', name: 'Necklace of Adaptation',
    completeness: 'partial',
    narrative: [{
      text: 'Breathe normally in any environment, and advantage on saves '
        + 'against harmful gases and vapours (cloudkill, stinking cloud, '
        + 'inhaled poisons, some dragon breath).',
      dmPromptable: true
    }]
  })
}

export const NECKLACE_OF_FIREBALLS: ItemDefinition = {
  id: 'srd:item.necklace-of-fireballs', name: 'Necklace of Fireballs',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare',
  effects: source({
    id: 'srd:item.necklace-of-fireballs', name: 'Necklace of Fireballs',
    completeness: 'partial',
    narrative: [{
      text: '1d6+3 beads. Action to detach and throw one up to 60 feet: '
        + 'it detonates as a 3rd-level fireball (DC 15). Throwing '
        + 'multiple beads as one action raises the level by 1 per extra bead.',
      dmPromptable: true
    }]
  })
}

export const OATHBOW: ItemDefinition = {
  id: 'srd:item.oathbow', name: 'Oathbow',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'weapon', rarity: 'veryRare', slot: 'mainHand', requiresAttunement: true,
  effects: source({
    id: 'srd:item.oathbow', name: 'Oathbow',
    // Every clause is scoped to "your declared sworn enemy," a per-target
    // designation this vocabulary has no concept of.
    completeness: 'partial',
    narrative: [{
      text: 'Declaring a sworn enemy (one at a time, until it dies or '
        + 'seven days later) grants advantage on ranged attacks against '
        + 'it, ignores all cover but total cover, no disadvantage at long '
        + 'range, and an extra 3d6 piercing on a hit — but disadvantage '
        + 'on attacks with every other weapon while it lives.',
      dmPromptable: true
    }]
  })
}

export const OIL_OF_ETHEREALNESS: ItemDefinition = {
  id: 'srd:item.oil-of-etherealness', name: 'Oil of Etherealness',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'consumable', rarity: 'rare',
  effects: source({
    id: 'srd:item.oil-of-etherealness', name: 'Oil of Etherealness',
    completeness: 'partial',
    narrative: [{
      text: '10 minutes to apply, covering a Medium or smaller creature '
        + 'and its gear (one extra vial per size category above Medium). '
        + 'Grants etherealness for 1 hour.',
      dmPromptable: true
    }]
  })
}

export const OIL_OF_SHARPNESS: ItemDefinition = {
  id: 'srd:item.oil-of-sharpness', name: 'Oil of Sharpness',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'consumable', rarity: 'veryRare',
  effects: source({
    id: 'srd:item.oil-of-sharpness', name: 'Oil of Sharpness',
    // A consumable bonus applied to whichever weapon or ammunition it's
    // used on for a limited time, the same per-application gap Ammunition
    // +1/+2/+3 leaves rather than a permanently-equipped modifier.
    completeness: 'partial',
    narrative: [{
      text: '1 minute to apply to one slashing or piercing weapon, or 5 '
        + 'pieces of ammunition: magical and +3 to attack and damage for 1 hour.',
      dmPromptable: true
    }]
  })
}

// ===========================================================================
// Registration
// ===========================================================================

export const ALL_ITEMS_IR1: ItemDefinition[] = [
  MITHRAL_ARMOR, OIL_OF_SLIPPERINESS,
  LUCK_BLADE, MACE_OF_SMITING, PEARL_OF_POWER, NECKLACE_OF_PRAYER_BEADS,
  IRON_BANDS_OF_BINDING, MACE_OF_TERROR, MEDALLION_OF_THOUGHTS, NINE_LIVES_STEALER,
  IRON_FLASK, JAVELIN_OF_LIGHTNING, LANTERN_OF_REVEALING, MACE_OF_DISRUPTION,
  ...ABILITY_BOOKS_ITEMS, MANUAL_OF_GOLEMS, MARVELOUS_PIGMENTS,
  MANTLE_OF_SPELL_RESISTANCE, MIRROR_OF_LIFE_TRAPPING, NECKLACE_OF_ADAPTATION,
  NECKLACE_OF_FIREBALLS, OATHBOW, OIL_OF_ETHEREALNESS, OIL_OF_SHARPNESS
]
