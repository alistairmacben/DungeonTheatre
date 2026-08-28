// Magic items, catalogue section A (docs/srd/10-magic-items.md §6).
//
// The first batch of the SRD's ~347-item magic-item catalogue, batched by the
// SRD's own alphabetical sections the way the spell list was batched by
// level. The vocabulary here needs nothing new: `ItemDefinition.effects` is
// the same `EffectSource` every class feature and spell already uses, and
// `ARMOR_CLASS` / `resistancePath` / `abilityScorePath` already exist.
//
// Items differ from spells in one structural way worth naming: there is no
// `effect` field on ItemDefinition the way there is on SpellDefinition, so an
// item's one-shot ability (Arrow of Slaying's save-for-damage, most
// activated effects) has nowhere to produce a computed preview — only a
// passive, ongoing `modifiers` array does. That makes the complete/partial
// split for items mostly "is this an always-on stat, or does it require a
// roll/choice/trigger the resolver can't preview."
//
// Amulet of Health is the first `min` op on an ability score itself, not a
// derived stat — and per 03-progression.md's retroactive rule, raising CON
// changes hit point maximum for every level already attained, which is
// exactly the case that rule exists for. Armor of Resistance reuses Fire
// Shield's toggle-gated `set` pattern, but for a choice made once when the
// item is identified rather than once per cast. Apparatus of the Crab is the
// SRD doc's own flagged example of a stateful machine no
// `{modifier, value}` vocabulary can express.
//
// Checked against docs/srd/10-magic-items.md §6 (Catalogue: A).

import type { EffectSource, ItemDefinition, Modifier } from '../rules/types.js'
import {
  abilityScorePath, ARMOR_CLASS, resistancePath, RESISTANCE_RESISTANT, RESISTANCE_VULNERABLE
} from '../rules/statPaths.js'

const V = '2014'
let n = 0
const id = () => `ia${++n}`

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

export const AMULET_OF_HEALTH: ItemDefinition = {
  id: 'srd:item.amulet-of-health', name: 'Amulet of Health',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare', slot: 'amulet', requiresAttunement: true,
  effects: source({
    id: 'srd:item.amulet-of-health', name: 'Amulet of Health',
    // A floor, not an assignment — a lower Constitution is unaffected, and
    // per the retroactive CON rule this raises hit point maximum for every
    // level already attained, not just future ones.
    modifiers: [{
      id: id(), channel: 'value', target: abilityScorePath('con'), op: 'min',
      value: 19, permanence: 'persistent', note: 'amulet of health'
    }],
    narrative: [{
      text: 'While worn, your Constitution score is 19. No effect if it is already 19 or higher.',
      dmPromptable: false
    }]
  })
}

export const AMULET_OF_PROOF_AGAINST_DETECTION_AND_LOCATION: ItemDefinition = {
  id: 'srd:item.amulet-of-proof-against-detection-and-location',
  name: 'Amulet of Proof against Detection and Location',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon', slot: 'amulet', requiresAttunement: true,
  effects: source({
    id: 'srd:item.amulet-of-proof-against-detection-and-location',
    name: 'Amulet of Proof against Detection and Location',
    narrative: [{
      text: 'While worn, you are hidden from divination magic, cannot be '
        + 'targeted by it, and cannot be perceived through magical scrying sensors.',
      dmPromptable: false
    }]
  })
}

const ARMOR_BONUS_TIERS = [
  { tier: 1, rarity: 'rare' as const },
  { tier: 2, rarity: 'veryRare' as const },
  { tier: 3, rarity: 'legendary' as const }
]

export const ARMOR_PLUS: ItemDefinition[] = ARMOR_BONUS_TIERS.map(({ tier, rarity }) => ({
  id: `srd:item.armor-plus-${tier}`, name: `Armor, +${tier}`,
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'armor' as const, rarity, slot: 'armor' as const,
  effects: source({
    id: `srd:item.armor-plus-${tier}`, name: `Armor, +${tier}`,
    // The SRD entry is generic across light, medium or heavy armor and
    // names no base armor of its own. Equipping this instead of the
    // character's real armor gives the +N bonus but loses that armor's own
    // base AC and Dexterity cap — for a specific magic armor (a +2 chain
    // mail), track the combined total by hand, or author a DM item that
    // carries both a real `armor` profile and this modifier.
    completeness: 'partial',
    modifiers: [add(ARMOR_CLASS, tier)],
    narrative: [{
      text: `Adds ${tier} to AC, on top of whatever armor this represents.`,
      dmPromptable: true
    }]
  })
}))

const RESISTANCE_TOGGLE_TYPES = [
  'acid', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'poison', 'psychic', 'radiant', 'thunder'
]

export const ARMOR_OF_RESISTANCE: ItemDefinition = {
  id: 'srd:item.armor-of-resistance', name: 'Armor of Resistance',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'armor', rarity: 'rare', slot: 'armor', requiresAttunement: true,
  effects: source({
    id: 'srd:item.armor-of-resistance', name: 'Armor of Resistance',
    // The type is fixed once — by the GM or a d10 roll — when the item is
    // identified, not chosen per encounter the way Fire Shield's toggle is.
    // The toggle here stands in for that one-time roll: turn on the matching
    // type and leave it on.
    modifiers: RESISTANCE_TOGGLE_TYPES.map((t) => ({
      id: id(), channel: 'value', target: resistancePath(t), op: 'set',
      value: RESISTANCE_RESISTANT, condition: { playerToggle: `item.armor-of-resistance.${t}` },
      permanence: 'persistent', note: `armor of resistance: ${t}`
    })),
    narrative: [{
      text: 'Grants resistance to one damage type, chosen by the GM or '
        + 'rolled (d10: acid, cold, fire, force, lightning, necrotic, '
        + 'poison, psychic, radiant, thunder) when the armor is identified. '
        + 'Turn on the matching toggle once that is decided.',
      dmPromptable: true
    }]
  })
}

export const ARMOR_OF_VULNERABILITY: ItemDefinition = {
  id: 'srd:item.armor-of-vulnerability', name: 'Armor of Vulnerability',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'armor', rarity: 'rare', slot: 'armor', requiresAttunement: true,
  effects: source({
    id: 'srd:item.armor-of-vulnerability', name: 'Armor of Vulnerability',
    // The resistance and its paired vulnerabilities are real modifiers, one
    // toggle set per choice of physical type. What isn't modeled: the curse
    // is hidden until identify or attuning reveals it, and removing the
    // armor doesn't end the curse — only remove curse or similar does.
    completeness: 'partial',
    modifiers: (['bludgeoning', 'piercing', 'slashing'] as const).flatMap((chosen) => {
      const others = (['bludgeoning', 'piercing', 'slashing'] as const).filter((t) => t !== chosen)
      return [
        {
          id: id(), channel: 'value', target: resistancePath(chosen), op: 'set',
          value: RESISTANCE_RESISTANT, condition: { playerToggle: `item.armor-of-vulnerability.${chosen}` },
          permanence: 'persistent', note: `armor of vulnerability: resistant to ${chosen}`
        },
        ...others.map((t) => ({
          id: id(), channel: 'value', target: resistancePath(t), op: 'set',
          value: RESISTANCE_VULNERABLE, condition: { playerToggle: `item.armor-of-vulnerability.${chosen}` },
          permanence: 'persistent', note: `armor of vulnerability: vulnerable to ${t}`
        } satisfies Modifier))
      ]
    }),
    narrative: [{
      text: 'Grants resistance to one of bludgeoning, piercing or slashing '
        + '— turn on the matching toggle. Cursed: this also grants '
        + 'vulnerability to the other two, hidden until identify or '
        + 'attuning reveals it, and removing the armor does not end the '
        + 'curse.',
      dmPromptable: true
    }]
  })
}

// ===========================================================================
// No roll, nothing to compute — narrative only
// ===========================================================================

export const ADAMANTINE_ARMOR: ItemDefinition = {
  id: 'srd:item.adamantine-armor', name: 'Adamantine Armor',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'armor', rarity: 'uncommon', slot: 'armor',
  effects: source({
    id: 'srd:item.adamantine-armor', name: 'Adamantine Armor',
    // A roll-outcome rewrite (crit becomes a normal hit), not a stat this
    // content set has a channel for.
    completeness: 'partial',
    narrative: [{
      text: 'Medium or heavy armor, but not hide. Any critical hit against '
        + 'you while wearing it becomes a normal hit instead.',
      dmPromptable: true
    }]
  })
}

const AMMUNITION_BONUS_TIERS = [
  { tier: 1, rarity: 'uncommon' as const },
  { tier: 2, rarity: 'rare' as const },
  { tier: 3, rarity: 'veryRare' as const }
]

export const AMMUNITION_PLUS: ItemDefinition[] = AMMUNITION_BONUS_TIERS.map(({ tier, rarity }) => ({
  id: `srd:item.ammunition-plus-${tier}`, name: `Ammunition, +${tier}`,
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'weapon' as const, rarity,
  effects: source({
    id: `srd:item.ammunition-plus-${tier}`, name: `Ammunition, +${tier}`,
    // Ammunition is consumed per shot rather than equipped, and this
    // content set tracks inventory quantities, not which individual arrow
    // in a quiver is about to be fired — no way to scope the bonus to one
    // shot among many.
    completeness: 'partial',
    narrative: [{
      text: `+${tier} to the attack and damage roll of the shot it's used `
        + 'in. Loses its magic once it hits a target.',
      dmPromptable: true
    }]
  })
}))

export const AMULET_OF_THE_PLANES: ItemDefinition = {
  id: 'srd:item.amulet-of-the-planes', name: 'Amulet of the Planes',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'veryRare', slot: 'amulet', requiresAttunement: true,
  effects: source({
    id: 'srd:item.amulet-of-the-planes', name: 'Amulet of the Planes',
    completeness: 'partial',
    narrative: [{
      text: 'Action to name a familiar location on another plane, then a '
        + 'DC 15 Intelligence check: success casts plane shift there; '
        + 'failure sends you and everything within 15 feet to a random '
        + 'destination (d100: 1-60 a random spot on the named plane, '
        + '61-100 a random plane entirely).',
      dmPromptable: true
    }]
  })
}

export const ANIMATED_SHIELD: ItemDefinition = {
  id: 'srd:item.animated-shield', name: 'Animated Shield',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'shield', rarity: 'veryRare', slot: 'shield', requiresAttunement: true,
  effects: source({
    id: 'srd:item.animated-shield', name: 'Animated Shield',
    completeness: 'partial',
    narrative: [{
      text: "Bonus action and a command word: the shield hovers and "
        + "protects you with your hands free for 1 minute, ending early on "
        + "a bonus action or if you're incapacitated or dying.",
      dmPromptable: true
    }]
  })
}

export const APPARATUS_OF_THE_CRAB: ItemDefinition = {
  id: 'srd:item.apparatus-of-the-crab', name: 'Apparatus of the Crab',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'legendary',
  effects: source({
    id: 'srd:item.apparatus-of-the-crab', name: 'Apparatus of the Crab',
    // Flagged explicitly by the SRD source material as a stateful machine —
    // a ten-lever control surface, each returning to neutral — that no
    // {modifier, value} vocabulary can express. Out of scope by design.
    completeness: 'partial',
    narrative: [{
      text: 'A 500 lb sealed iron barrel that opens into a submersible '
        + 'crab-shaped vehicle for two Medium or smaller creatures (AC 20, '
        + 'HP 200, speed 30 ft/swim 30 ft), operated by ten independent '
        + 'levers controlling legs, windows, claws, movement, lights and '
        + 'the hatch. Run it as a vehicle with a control panel, not as a '
        + "character effect — there's no stat here to preview.",
      dmPromptable: true
    }]
  })
}

export const ARMOR_OF_INVULNERABILITY: ItemDefinition = {
  id: 'srd:item.armor-of-invulnerability', name: 'Armor of Invulnerability',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'armor', rarity: 'legendary', slot: 'armor', requiresAttunement: true,
  effects: source({
    id: 'srd:item.armor-of-invulnerability', name: 'Armor of Invulnerability',
    // The passive resistance is real, the same approximation Stoneskin
    // already makes (a flat resistance, not scoped to "nonmagical"
    // specifically). The activated 10-minute full immunity, gated on a
    // dawn-recharging use, is a real activated ability this batch leaves
    // narrative rather than build a one-off resource for a single item.
    completeness: 'partial',
    modifiers: (['bludgeoning', 'piercing', 'slashing'] as const).map((t) => ({
      id: id(), channel: 'value', target: resistancePath(t), op: 'set',
      value: RESISTANCE_RESISTANT, permanence: 'persistent', note: 'armor of invulnerability'
    })),
    narrative: [{
      text: 'Resistant to nonmagical bludgeoning, piercing and slashing '
        + 'while worn. Once per dawn, use an action to become immune to '
        + 'nonmagical damage for 10 minutes or until the armor is removed.',
      dmPromptable: true
    }]
  })
}

export const ARROW_CATCHING_SHIELD: ItemDefinition = {
  id: 'srd:item.arrow-catching-shield', name: 'Arrow-Catching Shield',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'shield', rarity: 'rare', slot: 'shield', requiresAttunement: true,
  effects: source({
    id: 'srd:item.arrow-catching-shield', name: 'Arrow-Catching Shield',
    // An AC bonus scoped to one attack category (ranged only), plus a
    // target-redirection reaction — neither has a channel in this
    // vocabulary, which treats Armor Class as one flat total.
    completeness: 'partial',
    narrative: [{
      text: "+2 AC against ranged attacks, on top of the shield's normal "
        + 'bonus. Reaction to become the target of a ranged attack aimed '
        + 'at anyone within 5 feet of you.',
      dmPromptable: true
    }]
  })
}

export const ARROW_OF_SLAYING: ItemDefinition = {
  id: 'srd:item.arrow-of-slaying', name: 'Arrow of Slaying',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'weapon', rarity: 'veryRare',
  effects: source({
    id: 'srd:item.arrow-of-slaying', name: 'Arrow of Slaying',
    // A one-shot save-for-damage ability with no `effect` field on items to
    // carry it — items only ever preview passive modifiers.
    completeness: 'partial',
    narrative: [{
      text: 'Bound to a type, race or group (arrows of dragon slaying, of '
        + 'blue dragon slaying). A matching creature hit by it makes a DC '
        + '17 Constitution save for an extra 6d10 piercing, half on '
        + 'success. Becomes nonmagical once it deals that damage.',
      dmPromptable: true
    }]
  })
}

// ===========================================================================
// Registration
// ===========================================================================

export const ALL_ITEMS_A: ItemDefinition[] = [
  AMULET_OF_HEALTH, AMULET_OF_PROOF_AGAINST_DETECTION_AND_LOCATION,
  ...ARMOR_PLUS, ARMOR_OF_RESISTANCE, ARMOR_OF_VULNERABILITY,
  ADAMANTINE_ARMOR, ...AMMUNITION_PLUS, AMULET_OF_THE_PLANES, ANIMATED_SHIELD,
  APPARATUS_OF_THE_CRAB, ARMOR_OF_INVULNERABILITY, ARROW_CATCHING_SHIELD, ARROW_OF_SLAYING
]
