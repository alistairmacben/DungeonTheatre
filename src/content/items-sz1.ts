// Magic items, catalogue section S-Z, part 1 (docs/srd/10-magic-items.md §11).
//
// Scarab of Protection through Talisman of the Sphere — including the
// twelve-item Staffs sub-table and the ten-tier Spell Scroll table. Wands,
// and everything from Trident of Fish Command onward, are part 2.
//
// Shield +1/+2/+3 is the first tiered armor item that is fully `complete`:
// unlike the generic Armor +N (which names no base armor and stays
// partial), `armor()` deliberately emits no base-AC modifier for a shield,
// so a shield's own +2 plus a flat magic bonus is the entire item with
// nothing left dangling. The Staffs are quarterstaffs and spellcasting
// foci at once: their passive weapon/AC/save bonuses are real, gated the
// same way every other magic-weapon overlay is; their charge-costed spell
// menus have no `SpellGrant.costs` precedent anywhere in the catalogue yet
// and, across twelve staffs, are left as narrative describing what the
// dawn-recharged charge track pays for — consistent with Scarab of
// Protection and Rod of Lordly Might already doing the same for a single
// finite resource. Class-specific attunement lists (six different classes
// per staff) are approximated with the existing `canCastSpells` predicate
// and spelled out in narrative.
//
// Checked against docs/srd/10-magic-items.md §11 (Catalogue: S-Z, part 1).

import type { ArmorProfile, DiceExpr, EffectSource, ItemDefinition, Modifier } from '../rules/types.js'
import {
  ARMOR_CLASS, ATTACK_ROLL, CHECK_ROLL, DAMAGE_WEAPON, resistancePath,
  RESISTANCE_RESISTANT, SAVE_ROLL, SPELL_ATTACK, speedPath
} from '../rules/statPaths.js'
import { armor } from './srd.js'

const V = '2014'
let n = 0
const id = () => `isz1${++n}`

function source(o: Partial<EffectSource> & { id: string; name: string }): EffectSource {
  return {
    provenance: 'srd', contentVersion: 1, kind: 'item',
    activation: { always: true }, modifiers: [], completeness: 'complete',
    ...o
  }
}

const add = (target: string, value: Modifier['value'], extra: Partial<Modifier> = {}): Modifier =>
  ({ id: id(), channel: 'value', target, op: 'add', value, permanence: 'persistent', ...extra })

const AGAINST_SPELLS_ADVANTAGE: Modifier = {
  id: id(), channel: 'roll', rollOp: 'advantage',
  scope: { kinds: ['save'], againstTags: ['spell'] },
  permanence: 'persistent'
}

// ===========================================================================
// Real modifiers, fully resolved
// ===========================================================================

export const SCARAB_OF_PROTECTION: ItemDefinition = {
  id: 'srd:item.scarab-of-protection', name: 'Scarab of Protection',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'legendary', requiresAttunement: true,
  charges: { id: 'item.scarab-of-protection.charges', name: 'Scarab of Protection', max: 12, refresh: { kind: 'never' }, display: 'uses' },
  effects: source({
    id: 'srd:item.scarab-of-protection', name: 'Scarab of Protection',
    // The advantage on saves against spells is real. Spending a charge as a
    // reaction to turn a failed necromancy/undead save into a success has
    // no interception point on the save pipeline yet.
    completeness: 'partial',
    modifiers: [{ ...AGAINST_SPELLS_ADVANTAGE, note: 'scarab of protection' }],
    narrative: [{
      text: 'Reaction and 1 charge: turn a failed saving throw against a '
        + "necromancy spell or a harmful undead effect into a success. The "
        + 'scarab crumbles to dust when the last charge is spent.',
      dmPromptable: true
    }]
  })
}

export const SCIMITAR_OF_SPEED: ItemDefinition = {
  id: 'srd:item.scimitar-of-speed', name: 'Scimitar of Speed',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'weapon', rarity: 'veryRare', slot: 'mainHand', requiresAttunement: true,
  effects: source({
    id: 'srd:item.scimitar-of-speed', name: 'Scimitar of Speed',
    // The attack and damage bonus are real. The extra bonus-action attack
    // has no action-economy channel here.
    completeness: 'partial',
    modifiers: [
      add(ATTACK_ROLL, 2, { condition: { playerToggle: 'item.scimitar-of-speed' }, note: 'scimitar of speed: turn off when not using it' }),
      add(DAMAGE_WEAPON, 2, { condition: { playerToggle: 'item.scimitar-of-speed' }, note: 'scimitar of speed: turn off when not using it' })
    ],
    narrative: [{ text: 'You can make one attack with it as a bonus action on each of your turns.', dmPromptable: true }]
  })
}

const SHIELD_PROFILE: ArmorProfile = { category: 'shield', baseAc: 0, dexCap: null }
const SHIELD_TIERS = [
  { tier: 1, rarity: 'uncommon' as const },
  { tier: 2, rarity: 'rare' as const },
  { tier: 3, rarity: 'veryRare' as const }
]

export const SHIELD_PLUS: ItemDefinition[] = SHIELD_TIERS.map(({ tier, rarity }) => ({
  ...armor(`srd:item.shield-plus-${tier}`, `Shield, +${tier}`, SHIELD_PROFILE, [
    add(ARMOR_CLASS, 2, { note: 'shield' }),
    add(ARMOR_CLASS, tier, { note: `+${tier} magic bonus` })
  ]),
  rarity
}))

export const SHIELD_OF_MISSILE_ATTRACTION: ItemDefinition = (() => {
  const base = armor('srd:item.shield-of-missile-attraction', 'Shield of Missile Attraction', SHIELD_PROFILE,
    [add(ARMOR_CLASS, 2, { note: 'shield' })])
  return {
    ...base, rarity: 'rare', requiresAttunement: true,
    effects: {
      ...base.effects,
      // The shield's own AC is real. Resistance scoped to "ranged weapon
      // attacks" (an attack shape, not a damage type) and the curse that
      // redirects nearby ranged attacks to you have no channel here.
      completeness: 'partial',
      narrative: [{
        text: 'While holding it, you have resistance to damage from ranged '
          + 'weapon attacks. Curse: once you touch it you become the target '
          + 'of any ranged weapon attack made against any creature within '
          + '10 feet of you, if the attacker can see you; removing the '
          + 'shield does not end the curse.',
        dmPromptable: true
      }]
    }
  }
})()

export const SLIPPERS_OF_SPIDER_CLIMBING: ItemDefinition = {
  id: 'srd:item.slippers-of-spider-climbing', name: 'Slippers of Spider Climbing',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon', slot: 'boots', requiresAttunement: true,
  effects: source({
    id: 'srd:item.slippers-of-spider-climbing', name: 'Slippers of Spider Climbing',
    // A climbing speed equal to walking speed, hands free, is real. The
    // "not on ice, oil or other slippery surfaces" carve-out is a terrain
    // judgment call the resolver has no notion of.
    completeness: 'partial',
    modifiers: [{
      id: id(), channel: 'value', target: speedPath('climb'), op: 'base',
      value: { stat: speedPath('walk') }, permanence: 'persistent',
      note: 'slippers of spider climbing: climbing speed equal to walking speed, hands free'
    }],
    narrative: [{ text: 'Does not work on slippery surfaces such as ice or oil.', dmPromptable: true }]
  })
}

export const STONE_OF_GOOD_LUCK: ItemDefinition = {
  id: 'srd:item.stone-of-good-luck', name: 'Stone of Good Luck (Luckstone)',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon', requiresAttunement: true,
  effects: source({
    id: 'srd:item.stone-of-good-luck', name: 'Stone of Good Luck (Luckstone)',
    modifiers: [
      add(CHECK_ROLL, 1, { note: 'stone of good luck' }),
      add(SAVE_ROLL, 1, { note: 'stone of good luck' })
    ]
  })
}

// ===========================================================================
// Pure narrative — nothing numeric left partially modeled
// ===========================================================================

export const SOVEREIGN_GLUE: ItemDefinition = {
  id: 'srd:item.sovereign-glue', name: 'Sovereign Glue',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'legendary',
  effects: source({
    id: 'srd:item.sovereign-glue', name: 'Sovereign Glue',
    narrative: [{
      text: 'A gooey substance, 1d6 + 1 ounces per container. One ounce '
        + 'covers one square foot and sets in 1 minute, bonding any two '
        + 'objects permanently. Must be stored in a container coated inside '
        + 'with oil of slipperiness. The bond it creates is broken only by '
        + 'universal solvent, oil of etherealness, or a wish spell.',
      dmPromptable: true
    }]
  })
}

const SPELL_SCROLL_TIERS = [
  { level: 0, name: 'Spell Scroll (Cantrip)', rarity: 'common' as const, dc: 13, attack: 5 },
  { level: 1, name: 'Spell Scroll (1st Level)', rarity: 'common' as const, dc: 13, attack: 5 },
  { level: 2, name: 'Spell Scroll (2nd Level)', rarity: 'uncommon' as const, dc: 13, attack: 5 },
  { level: 3, name: 'Spell Scroll (3rd Level)', rarity: 'uncommon' as const, dc: 15, attack: 7 },
  { level: 4, name: 'Spell Scroll (4th Level)', rarity: 'rare' as const, dc: 15, attack: 7 },
  { level: 5, name: 'Spell Scroll (5th Level)', rarity: 'rare' as const, dc: 17, attack: 9 },
  { level: 6, name: 'Spell Scroll (6th Level)', rarity: 'veryRare' as const, dc: 17, attack: 9 },
  { level: 7, name: 'Spell Scroll (7th Level)', rarity: 'veryRare' as const, dc: 18, attack: 10 },
  { level: 8, name: 'Spell Scroll (8th Level)', rarity: 'veryRare' as const, dc: 18, attack: 10 },
  { level: 9, name: 'Spell Scroll (9th Level)', rarity: 'legendary' as const, dc: 19, attack: 11 }
]

export const SPELL_SCROLLS: ItemDefinition[] = SPELL_SCROLL_TIERS.map(({ level, name, rarity, dc, attack }) => ({
  id: `srd:item.spell-scroll-${level}`, name,
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'consumable', rarity,
  effects: source({
    id: `srd:item.spell-scroll-${level}`, name,
    narrative: [{
      text: `Castable only if the spell is on your class's spell list; `
        + 'otherwise the writing is unintelligible. No material components '
        + `required, normal casting time, and the scroll crumbles once cast `
        + '(an interrupted casting does not lose it). Fixed statistics, '
        + `overriding your own: save DC ${dc}, spell attack bonus +${attack}. `
        + 'Casting a spell above your normal maximum level requires an '
        + `ability check with your spellcasting ability, DC = 10 + the `
        + "spell's level; failure loses the spell with no other effect. A "
        + "wizard spell can be copied into a spellbook with an Intelligence "
        + "(Arcana) check, DC = 10 + the spell's level — the scroll is "
        + 'destroyed either way.',
      dmPromptable: true
    }]
  })
}))

export const SPELLGUARD_SHIELD: ItemDefinition = (() => {
  const base = armor('srd:item.spellguard-shield', 'Spellguard Shield', SHIELD_PROFILE,
    [add(ARMOR_CLASS, 2, { note: 'shield' }), { ...AGAINST_SPELLS_ADVANTAGE, note: 'spellguard shield' }])
  return {
    ...base, rarity: 'veryRare', requiresAttunement: true,
    effects: {
      ...base.effects,
      // The shield's AC and the advantage on saves against spells are real.
      // Imposing disadvantage on spell attacks made against you is an
      // attacker-side effect this resolver has no channel to apply.
      completeness: 'partial',
      narrative: [{ text: 'Spell attack rolls against you have disadvantage.', dmPromptable: true }]
    }
  }
})()

export const SPHERE_OF_ANNIHILATION: ItemDefinition = {
  id: 'srd:item.sphere-of-annihilation', name: 'Sphere of Annihilation',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'legendary',
  effects: source({
    id: 'srd:item.sphere-of-annihilation', name: 'Sphere of Annihilation',
    narrative: [{
      text: 'A 2-foot-diameter black sphere that obliterates all matter it '
        + 'touches (artifacts excepted); anyone touching it without being '
        + 'engulfed takes 4d10 force damage. Stationary until controlled: '
        + 'from within 60 feet, an action and a DC 25 Intelligence (Arcana) '
        + 'check moves it 5 x your Intelligence modifier feet (minimum 5) in '
        + 'a chosen direction, failure moves it 10 feet toward you instead. '
        + "Entering a creature's space forces a DC 13 Dexterity save or 4d10 "
        + 'force. Wresting control from another creature is an Intelligence '
        + '(Arcana) contest. Contact with a planar portal or extradimensional '
        + 'space rolls d100: 01-50 the sphere is destroyed, 51-85 it passes '
        + 'through unaffected, 86-00 a spatial rift sends everything within '
        + '180 feet, including the sphere, to a random plane.',
      dmPromptable: true
    }]
  })
}

export const STONE_OF_CONTROLLING_EARTH_ELEMENTALS: ItemDefinition = {
  id: 'srd:item.stone-of-controlling-earth-elementals', name: 'Stone of Controlling Earth Elementals',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare',
  charges: { id: 'item.stone-of-controlling-earth-elementals.charges', name: 'Stone of Controlling Earth Elementals', max: 1, refresh: { kind: 'dawn' }, display: 'uses' },
  effects: source({
    id: 'srd:item.stone-of-controlling-earth-elementals', name: 'Stone of Controlling Earth Elementals',
    narrative: [{
      text: 'While touching the ground, action and a command word summon '
        + 'an earth elemental as if you had cast conjure elemental, which '
        + 'ends when the elemental drops to 0 hit points or after 1 hour.',
      dmPromptable: true
    }]
  })
}

export const SUN_BLADE: ItemDefinition = {
  id: 'srd:item.sun-blade', name: 'Sun Blade',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'weapon', rarity: 'rare', slot: 'mainHand', requiresAttunement: true,
  effects: source({
    id: 'srd:item.sun-blade', name: 'Sun Blade',
    // The attack and damage bonus are real. Finesse, the shortsword/
    // longsword proficiency substitution, the slashing-to-radiant damage
    // type swap, the bonus against undead, and the adjustable light all
    // have no channel here.
    completeness: 'partial',
    modifiers: [
      add(ATTACK_ROLL, 2, { condition: { playerToggle: 'item.sun-blade' }, note: 'sun blade: turn off when not using it' }),
      add(DAMAGE_WEAPON, 2, { condition: { playerToggle: 'item.sun-blade' }, note: 'sun blade: turn off when not using it' })
    ],
    narrative: [{
      text: 'A hilt; a bonus action creates or dismisses a blade of pure '
        + 'radiance. Finesse; proficiency with a shortsword or longsword '
        + 'confers proficiency with it. Deals radiant instead of slashing '
        + 'damage, plus an extra 1d8 radiant against undead. Emits bright '
        + 'light in a 15-foot radius and dim light for an additional 15 '
        + 'feet, as sunlight; an action adjusts each radius by 5 feet, '
        + 'between 10 and 30 feet.',
      dmPromptable: true
    }]
  })
}

export const SWORD_OF_LIFE_STEALING: ItemDefinition = {
  id: 'srd:item.sword-of-life-stealing', name: 'Sword of Life Stealing',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'weapon', rarity: 'rare', slot: 'mainHand', requiresAttunement: true,
  effects: source({
    id: 'srd:item.sword-of-life-stealing', name: 'Sword of Life Stealing',
    narrative: [{
      text: 'On a natural 20 against a creature (not a construct or '
        + 'undead), the target takes an extra 3d6 necrotic damage and you '
        + 'gain temporary hit points equal to the necrotic damage dealt.',
      dmPromptable: true
    }]
  })
}

export const SWORD_OF_SHARPNESS: ItemDefinition = {
  id: 'srd:item.sword-of-sharpness', name: 'Sword of Sharpness',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'weapon', rarity: 'veryRare', slot: 'mainHand', requiresAttunement: true,
  effects: source({
    id: 'srd:item.sword-of-sharpness', name: 'Sword of Sharpness',
    narrative: [{
      text: 'Against an object, you maximise the weapon damage dice. On a '
        + 'natural 20 against a creature, it takes an extra 4d6 slashing '
        + 'damage, then you roll another d20 — on a 20 you sever one of its '
        + 'limbs (GM discretion for a creature with none). A command word '
        + 'makes it shed bright light in a 10-foot radius and dim light for '
        + 'an additional 10 feet.',
      dmPromptable: true
    }]
  })
}

export const SWORD_OF_WOUNDING: ItemDefinition = {
  id: 'srd:item.sword-of-wounding', name: 'Sword of Wounding',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'weapon', rarity: 'rare', slot: 'mainHand', requiresAttunement: true,
  effects: source({
    id: 'srd:item.sword-of-wounding', name: 'Sword of Wounding',
    narrative: [{
      text: 'Hit points lost to this weapon can be regained only through a '
        + 'short or long rest, not through regeneration, magic, or any '
        + 'other means. Once per turn on a hit, you can wound the target: '
        + 'at the start of each of its turns it takes 1d4 necrotic damage '
        + 'per wound, then it can make a DC 15 Constitution save to end all '
        + 'of them; alternatively it or an adjacent creature can spend an '
        + 'action on a DC 15 Wisdom (Medicine) check to end them.',
      dmPromptable: true
    }]
  })
}

export const TALISMAN_OF_THE_SPHERE: ItemDefinition = {
  id: 'srd:item.talisman-of-the-sphere', name: 'Talisman of the Sphere',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'legendary', requiresAttunement: true,
  effects: source({
    id: 'srd:item.talisman-of-the-sphere', name: 'Talisman of the Sphere',
    narrative: [{
      text: 'Double your proficiency bonus on Intelligence (Arcana) checks '
        + 'made to control a sphere of annihilation. While controlling one, '
        + 'an action lets you move it up to 10 feet plus 10 feet per point '
        + 'of your Intelligence modifier.',
      dmPromptable: true
    }]
  })
}

export const TALISMAN_OF_PURE_GOOD: ItemDefinition = {
  id: 'srd:item.talisman-of-pure-good', name: 'Talisman of Pure Good',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'legendary',
  requiresAttunement: true, attunementPrerequisite: { playerToggle: 'good-creature' },
  charges: { id: 'item.talisman-of-pure-good.charges', name: 'Talisman of Pure Good', max: 7, refresh: { kind: 'never' }, display: 'uses' },
  effects: source({
    id: 'srd:item.talisman-of-pure-good', name: 'Talisman of Pure Good',
    // The +2 to spell attack rolls while used as a holy symbol is real,
    // gated on the class/alignment condition the SRD names. The radiant
    // aura against non-good creatures and the charge-fuelled destroy-evil
    // effect have no channel here.
    completeness: 'partial',
    modifiers: [add(SPELL_ATTACK, 2, { condition: { playerToggle: 'item.talisman-of-pure-good' }, note: 'talisman of pure good: used as a holy symbol by a good cleric or paladin' })],
    narrative: [{
      text: 'Only a good creature can attune to it. A neutral creature that '
        + 'touches it takes 6d6 radiant damage; an evil creature takes 8d6; '
        + 'this repeats at the end of each turn it holds or carries the '
        + 'talisman. A good cleric or paladin can use it as a holy symbol. 7 '
        + 'charges: action and 1 charge against a visible creature on the '
        + 'ground within 120 feet — if it is evil, DC 20 Dexterity save or '
        + 'it falls into a flaming fissure and is destroyed, leaving no '
        + 'remains. Destroyed when the last charge is spent.',
      dmPromptable: true
    }]
  })
}

export const TALISMAN_OF_ULTIMATE_EVIL: ItemDefinition = {
  id: 'srd:item.talisman-of-ultimate-evil', name: 'Talisman of Ultimate Evil',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'legendary',
  requiresAttunement: true, attunementPrerequisite: { playerToggle: 'evil-creature' },
  charges: { id: 'item.talisman-of-ultimate-evil.charges', name: 'Talisman of Ultimate Evil', max: 6, refresh: { kind: 'never' }, display: 'uses' },
  effects: source({
    id: 'srd:item.talisman-of-ultimate-evil', name: 'Talisman of Ultimate Evil',
    completeness: 'partial',
    modifiers: [add(SPELL_ATTACK, 2, { condition: { playerToggle: 'item.talisman-of-ultimate-evil' }, note: 'talisman of ultimate evil: used as a holy symbol by an evil cleric or paladin' })],
    narrative: [{
      text: 'The mirror image of the Talisman of Pure Good: only an evil '
        + 'creature can attune to it, it deals necrotic damage, it targets '
        + 'good creatures instead, and it has 6 charges instead of 7.',
      dmPromptable: true
    }]
  })
}

// ===========================================================================
// Staffs — quarterstaffs and spellcasting foci at once. Passive weapon, AC,
// save and spell-attack bonuses are real; the dawn-recharged charge track
// that pays for each staff's spell menu is real state; which spells a
// charge buys, at what cost, stays narrative (see file header).
// ===========================================================================

function staff(sid: string, name: string, opts: {
  rarity: ItemDefinition['rarity']
  charges?: { max: number; amount?: number | DiceExpr }
  modifiers?: Modifier[]
  narrative: string
}): ItemDefinition {
  return {
    id: sid, name,
    provenance: 'srd', contentVersion: 1, rulesetVersion: V,
    category: 'weapon', rarity: opts.rarity, slot: 'mainHand',
    requiresAttunement: true, attunementPrerequisite: { canCastSpells: true },
    ...(opts.charges
      ? { charges: { id: `${sid}.charges`, name, max: opts.charges.max, refresh: { kind: 'dawn' as const, amount: opts.charges.amount ?? opts.charges.max }, display: 'uses' as const } }
      : {}),
    effects: source({
      id: sid, name,
      completeness: 'partial',
      modifiers: opts.modifiers ?? [],
      narrative: [{ text: opts.narrative, dmPromptable: true }]
    })
  }
}

const staffToggle = (sid: string, tier: number) => [
  add(ATTACK_ROLL, tier, { condition: { playerToggle: sid }, note: `${sid}: turn off when not using it` }),
  add(DAMAGE_WEAPON, tier, { condition: { playerToggle: sid }, note: `${sid}: turn off when not using it` })
]

export const STAFF_OF_CHARMING = staff('srd:item.staff-of-charming', 'Staff of Charming', {
  rarity: 'rare', charges: { max: 10, amount: { count: 1, sides: 8, modifier: 2 } },
  narrative: 'Bard, cleric, druid, sorcerer, warlock or wizard only. Action and '
    + '1 charge each to cast charm person, command, or comprehend languages '
    + '(your spell save DC). While holding it, once per dawn you can turn a '
    + 'failed saving throw against an enchantment spell that targets only '
    + 'you into a success. Reaction and 1 charge to reflect an enchantment '
    + 'spell you successfully saved against back at its caster, if within '
    + 'range. On a 1 on the burnout d20 when the last charge is spent, it '
    + 'becomes a plain quarterstaff.'
})

export const STAFF_OF_FIRE = staff('srd:item.staff-of-fire', 'Staff of Fire', {
  rarity: 'veryRare', charges: { max: 10, amount: { count: 1, sides: 6, modifier: 4 } },
  modifiers: [{ id: id(), channel: 'value', target: resistancePath('fire'), op: 'set', value: RESISTANCE_RESISTANT, permanence: 'persistent', note: 'staff of fire' }],
  narrative: 'Druid, sorcerer, warlock or wizard only. While holding it you '
    + 'have resistance to fire damage. Action and charges to cast burning '
    + 'hands (1), fireball (3), or wall of fire (4), your spell save DC. On '
    + 'a 1 on the burnout d20 when the last charge is spent, it crumbles to '
    + 'cinders.'
})

export const STAFF_OF_FROST = staff('srd:item.staff-of-frost', 'Staff of Frost', {
  rarity: 'veryRare', charges: { max: 10, amount: { count: 1, sides: 6, modifier: 4 } },
  modifiers: [{ id: id(), channel: 'value', target: resistancePath('cold'), op: 'set', value: RESISTANCE_RESISTANT, permanence: 'persistent', note: 'staff of frost' }],
  narrative: 'Druid, sorcerer, warlock or wizard only. While holding it you '
    + 'have resistance to cold damage. Action and charges to cast cone of '
    + 'cold (5), fog cloud (1), ice storm (4), or wall of ice (4), your '
    + 'spell save DC. On a 1 on the burnout d20 when the last charge is '
    + 'spent, it turns to water and is destroyed.'
})

export const STAFF_OF_HEALING = staff('srd:item.staff-of-healing', 'Staff of Healing', {
  rarity: 'rare', charges: { max: 10, amount: { count: 1, sides: 6, modifier: 4 } },
  narrative: 'Bard, cleric or druid only. Action and charges to cast cure '
    + 'wounds (1 charge per spell level, up to 4th), lesser restoration (2), '
    + 'or mass cure wounds at 5th level (5), no spellcasting ability '
    + 'required. On a 1 on the burnout d20 when the last charge is spent, '
    + 'it vanishes in a flash of light, forever lost.'
})

export const STAFF_OF_STRIKING = staff('srd:item.staff-of-striking', 'Staff of Striking', {
  rarity: 'veryRare', charges: { max: 10, amount: { count: 1, sides: 6, modifier: 4 } },
  modifiers: staffToggle('item.staff-of-striking', 3),
  narrative: 'A +3 quarterstaff. On a hit, you can expend up to 3 charges '
    + 'to deal an extra 1d6 force damage per charge. On a 1 on the burnout '
    + 'd20 when the last charge is spent, it becomes a plain quarterstaff.'
})

export const STAFF_OF_SWARMING_INSECTS = staff('srd:item.staff-of-swarming-insects', 'Staff of Swarming Insects', {
  rarity: 'rare', charges: { max: 10, amount: { count: 1, sides: 6, modifier: 4 } },
  narrative: 'Bard, cleric, druid, sorcerer, warlock or wizard only. Action '
    + 'and charges to cast giant insect (4) or insect plague (5), your '
    + 'spell save DC. Action and 1 charge for Insect Cloud: a 30-foot-radius '
    + 'cloud of biting, buzzing insects follows you for 10 minutes, heavily '
    + "obscuring the area for everyone but you; a 10 mph wind disperses it. "
    + 'On a 1 on the burnout d20 when the last charge is spent, insects '
    + 'consume the staff.'
})

export const STAFF_OF_THE_PYTHON = staff('srd:item.staff-of-the-python', 'Staff of the Python', {
  rarity: 'uncommon',
  narrative: 'Cleric, druid or warlock only. Action and a command word to '
    + 'throw it within 10 feet: it becomes a giant constrictor snake on its '
    + 'own initiative count, mentally commanded by you within 60 feet. At 0 '
    + 'hit points it dies and the staff shatters. Reverting to staff form '
    + 'early restores it to full hit points.'
})

export const STAFF_OF_THE_WOODLANDS = staff('srd:item.staff-of-the-woodlands', 'Staff of the Woodlands', {
  rarity: 'rare', charges: { max: 10, amount: { count: 1, sides: 6, modifier: 4 } },
  modifiers: [
    ...staffToggle('item.staff-of-the-woodlands', 2),
    add(SPELL_ATTACK, 2, { note: 'staff of the woodlands' })
  ],
  narrative: 'Druid only. A +2 quarterstaff. You can cast pass without '
    + 'trace at no charge cost. Action and charges to cast animal '
    + 'friendship (1), awaken (5), barkskin (2), locate animals or plants '
    + '(2), speak with animals (1), speak with plants (3), or wall of thorns '
    + '(6), your spell save DC. Action and 1 charge for Tree Form: become a '
    + '60-foot-tall tree for up to 8 hours, reverting early on a command '
    + 'word and dropping anyone climbing it. On a 1 on the burnout d20 when '
    + 'the last charge is spent, it becomes a plain quarterstaff.'
})

export const STAFF_OF_THUNDER_AND_LIGHTNING = staff('srd:item.staff-of-thunder-and-lightning', 'Staff of Thunder and Lightning', {
  rarity: 'veryRare',
  modifiers: staffToggle('item.staff-of-thunder-and-lightning', 2),
  narrative: 'A +2 quarterstaff, with five properties that each recharge '
    + 'separately at dawn rather than sharing one charge track: Lightning '
    + '(an extra 2d6 lightning damage on a hit), Thunder (target within 10 '
    + 'feet, DC 17 Constitution save or stunned until the end of your next '
    + 'turn, audible 300 feet), Lightning Strike (a 5-by-120-foot line, DC '
    + '17 Dexterity save, 9d6 lightning), Thunderclap (60 feet, DC 17 '
    + 'Constitution save, 2d6 thunder and deafened 1 minute, audible 600 '
    + 'feet), and Thunder and Lightning (both Lightning and Thunderclap at '
    + 'once, spending only that one property\'s use).'
})

export const STAFF_OF_WITHERING = staff('srd:item.staff-of-withering', 'Staff of Withering', {
  rarity: 'rare', charges: { max: 3, amount: { count: 1, sides: 3 } },
  narrative: 'Cleric, druid or warlock only. A magic quarterstaff. On a '
    + 'hit, 1 charge deals an extra 2d10 necrotic damage, and the target '
    + 'must succeed on a DC 15 Constitution save or have disadvantage for 1 '
    + 'hour on any Strength- or Constitution-based ability check or saving '
    + 'throw.'
})

export const STAFF_OF_POWER = staff('srd:item.staff-of-power', 'Staff of Power', {
  rarity: 'veryRare', charges: { max: 20, amount: { count: 2, sides: 8, modifier: 4 } },
  modifiers: [
    ...staffToggle('item.staff-of-power', 2),
    add(ARMOR_CLASS, 2, { note: 'staff of power' }),
    add(SAVE_ROLL, 2, { note: 'staff of power' }),
    add(SPELL_ATTACK, 2, { note: 'staff of power' })
  ],
  narrative: 'Sorcerer, warlock or wizard only. A +2 quarterstaff, and +2 '
    + 'to Armour Class, saving throws and spell attack rolls while held. '
    + 'Power Strike: 1 charge on a hit for an extra 1d6 force damage. '
    + 'Action and charges to cast cone of cold (5), fireball at 5th level '
    + '(5), globe of invulnerability (6), hold monster (5), levitate (2), '
    + 'lightning bolt at 5th level (5), magic missile (1), ray of '
    + 'enfeeblement (1), or wall of force (5), your spell save DC. On a 1 '
    + 'on the burnout d20 when the last charge is spent, it keeps only the '
    + '+2 to attack and damage rolls and loses everything else; on a 20 it '
    + 'regains 1d8 + 2 charges.'
})

export const STAFF_OF_THE_MAGI = staff('srd:item.staff-of-the-magi', 'Staff of the Magi', {
  rarity: 'legendary', charges: { max: 50, amount: { count: 4, sides: 6, modifier: 2 } },
  modifiers: [
    ...staffToggle('item.staff-of-the-magi', 2),
    add(SPELL_ATTACK, 2, { note: 'staff of the magi' }),
    { ...AGAINST_SPELLS_ADVANTAGE, note: 'staff of the magi' }
  ],
  narrative: 'Sorcerer, warlock or wizard only. A +2 quarterstaff, and +2 '
    + 'to spell attack rolls while held. Spell Absorption gives advantage '
    + 'on saves against spells, and a reaction to absorb a spell targeting '
    + 'only you, gaining charges equal to its level — but exceeding 50 '
    + 'charges triggers the retributive strike. Action and charges to cast '
    + 'conjure elemental (7), dispel magic (3), fireball at 7th level (7), '
    + 'flaming sphere (2), ice storm (4), invisibility (2), knock (2), '
    + 'lightning bolt at 7th level (7), passwall (5), plane shift (7), '
    + 'telekinesis (5), wall of fire (4), or web (2), your spell save DC; '
    + 'arcane lock, detect magic, enlarge/reduce, light, mage hand, and '
    + 'protection from evil and good cost no charges. On a 20 on the '
    + 'burnout d20 when the last charge is spent, it regains 1d12 + 1 '
    + 'charges. Retributive Strike (staff of power and staff of the magi '
    + 'alike): action to break it in a 30-foot-radius explosion. You have '
    + 'a 50% chance of being transported to a random plane and avoiding it; '
    + 'otherwise you take force damage equal to 16 times the remaining '
    + 'charges. Everyone else makes a DC 17 Dexterity save, taking 8x/6x/4x '
    + 'the charge count at 10 feet or less / 11-20 feet / 21-30 feet, '
    + 'halved on a success.'
})

export const ALL_ITEMS_SZ1: ItemDefinition[] = [
  SCARAB_OF_PROTECTION, SCIMITAR_OF_SPEED, ...SHIELD_PLUS, SHIELD_OF_MISSILE_ATTRACTION,
  SLIPPERS_OF_SPIDER_CLIMBING, STONE_OF_GOOD_LUCK,
  SOVEREIGN_GLUE, ...SPELL_SCROLLS, SPELLGUARD_SHIELD, SPHERE_OF_ANNIHILATION,
  STONE_OF_CONTROLLING_EARTH_ELEMENTALS, SUN_BLADE, SWORD_OF_LIFE_STEALING,
  SWORD_OF_SHARPNESS, SWORD_OF_WOUNDING, TALISMAN_OF_THE_SPHERE,
  TALISMAN_OF_PURE_GOOD, TALISMAN_OF_ULTIMATE_EVIL,
  STAFF_OF_CHARMING, STAFF_OF_FIRE, STAFF_OF_FROST, STAFF_OF_HEALING,
  STAFF_OF_STRIKING, STAFF_OF_SWARMING_INSECTS, STAFF_OF_THE_PYTHON,
  STAFF_OF_THE_WOODLANDS, STAFF_OF_THUNDER_AND_LIGHTNING, STAFF_OF_WITHERING,
  STAFF_OF_POWER, STAFF_OF_THE_MAGI
]
