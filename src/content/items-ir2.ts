// Magic items, catalogue section I-R, part 2 (docs/srd/10-magic-items.md §10).
//
// Runs Periapt of Health through Restorative Ointment, including every
// named Potion. Potion of Poison already exists (src/content/classes-extra.ts)
// and isn't repeated. Potion of Giant Strength is printed as one entry with
// a five-row table naming six real strengths — expanded the same way the
// Belt of Giant Strength family already was, just temporary instead of
// permanent. Potion of Speed reuses Haste's exact three modifiers (the spell
// and the potion produce the identical mechanical effect); Potion of
// Resistance reuses Armor of Resistance's toggle-per-type shape.
//
// Checked against docs/srd/10-magic-items.md §10 (Catalogue: I-R).

import type { EffectSource, ItemDefinition, Modifier } from '../rules/types.js'
import {
  abilityMaxPath, abilityScorePath, ARMOR_CLASS, resistancePath, RESISTANCE_IMMUNE,
  RESISTANCE_RESISTANT, speedPath
} from '../rules/statPaths.js'
import { armor } from './srd.js'

const V = '2014'
let n = 0
const id = () => `iir2${++n}`

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

export const PERIAPT_OF_PROOF_AGAINST_POISON: ItemDefinition = {
  id: 'srd:item.periapt-of-proof-against-poison', name: 'Periapt of Proof against Poison',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare', slot: 'amulet',
  effects: source({
    id: 'srd:item.periapt-of-proof-against-poison', name: 'Periapt of Proof against Poison',
    // Immunity to poison damage is real. The poisoned condition itself
    // (disadvantage on attacks and checks) has no per-condition immunity
    // channel — the DM simply never applies it while this is worn.
    completeness: 'partial',
    modifiers: [{
      id: id(), channel: 'value', target: resistancePath('poison'), op: 'set',
      value: RESISTANCE_IMMUNE, permanence: 'persistent', note: 'periapt of proof against poison'
    }],
    narrative: [{ text: 'Also immune to the poisoned condition — never apply it while worn.', dmPromptable: true }]
  })
}

const PLATE_ARMOR_OF_ETHEREALNESS_BASE = armor('srd:item.plate-armor-of-etherealness', 'Plate Armor of Etherealness',
  { category: 'heavy', baseAc: 18, dexCap: 0, strengthRequirement: 15, stealthDisadvantage: true })

export const PLATE_ARMOR_OF_ETHEREALNESS: ItemDefinition = {
  ...PLATE_ARMOR_OF_ETHEREALNESS_BASE, rarity: 'legendary', requiresAttunement: true,
  charges: { id: 'item.plate-armor-of-etherealness.uses', name: 'Plate Armor of Etherealness', max: 1, refresh: { kind: 'dawn' }, display: 'uses' },
  effects: {
    ...PLATE_ARMOR_OF_ETHEREALNESS_BASE.effects,
    completeness: 'partial',
    narrative: [{
      text: 'Action and a command word for etherealness for 10 minutes, '
        + 'ending early if removed or on another command word.',
      dmPromptable: true
    }]
  }
}

const GIANT_STRENGTH_POTION_TYPES = [
  { type: 'Hill', str: 21, rarity: 'uncommon' as const },
  { type: 'Stone', str: 23, rarity: 'rare' as const },
  { type: 'Frost', str: 23, rarity: 'rare' as const },
  { type: 'Fire', str: 25, rarity: 'rare' as const },
  { type: 'Cloud', str: 27, rarity: 'veryRare' as const },
  { type: 'Storm', str: 29, rarity: 'legendary' as const }
]

export const POTIONS_OF_GIANT_STRENGTH: ItemDefinition[] = GIANT_STRENGTH_POTION_TYPES.map(({ type, str, rarity }) => {
  const key = type.toLowerCase()
  const pid = `srd:item.potion-of-${key}-giant-strength`
  return {
    id: pid, name: `Potion of ${type} Giant Strength`,
    provenance: 'srd', contentVersion: 1, rulesetVersion: V,
    category: 'consumable' as const, rarity,
    effects: source({
      id: pid, name: `Potion of ${type} Giant Strength`,
      modifiers: [
        { id: id(), channel: 'value', target: abilityScorePath('str'), op: 'min', value: str, permanence: 'temporary', note: `potion of ${key} giant strength` },
        { id: id(), channel: 'value', target: abilityMaxPath('str'), op: 'min', value: str, permanence: 'temporary', note: `potion of ${key} giant strength: raises the ceiling` }
      ],
      narrative: [{ text: `Your Strength score is ${str} for 1 hour. No effect if it is already ${str} or higher.`, dmPromptable: false }]
    })
  }
})

export const POTION_OF_CLIMBING: ItemDefinition = {
  id: 'srd:item.potion-of-climbing', name: 'Potion of Climbing',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'consumable', rarity: 'common',
  effects: source({
    id: 'srd:item.potion-of-climbing', name: 'Potion of Climbing',
    // The climbing speed is Cloak of Arachnida's exact dynamic-value shape.
    // The +5-ish "advantage on Athletics checks to climb" is broader here
    // (this vocabulary can't scope to climbing checks specifically), the
    // same trade-off Boots of Elvenkind makes.
    completeness: 'partial',
    modifiers: [
      { id: id(), channel: 'value', target: speedPath('climb'), op: 'base', value: { stat: speedPath('walk') }, permanence: 'temporary', note: 'potion of climbing' },
      { id: id(), channel: 'roll', rollOp: 'advantage', scope: { kinds: ['check'], skills: ['athletics'] }, permanence: 'temporary', note: 'potion of climbing' }
    ],
    narrative: [{ text: 'Lasts 1 hour.', dmPromptable: false }]
  })
}

export const POTION_OF_FLYING: ItemDefinition = {
  id: 'srd:item.potion-of-flying', name: 'Potion of Flying',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'consumable', rarity: 'veryRare',
  effects: source({
    id: 'srd:item.potion-of-flying', name: 'Potion of Flying',
    completeness: 'partial',
    modifiers: [{
      id: id(), channel: 'value', target: speedPath('fly'), op: 'base',
      value: { stat: speedPath('walk') }, permanence: 'temporary', note: 'potion of flying'
    }],
    narrative: [{ text: 'Also hover. Lasts 1 hour.', dmPromptable: true }]
  })
}

const RESISTANCE_TOGGLE_TYPES = [
  'acid', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'poison', 'psychic', 'radiant', 'thunder'
]

export const POTION_OF_RESISTANCE: ItemDefinition = {
  id: 'srd:item.potion-of-resistance', name: 'Potion of Resistance',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'consumable', rarity: 'uncommon',
  effects: source({
    id: 'srd:item.potion-of-resistance', name: 'Potion of Resistance',
    // Armor of Resistance's exact toggle-per-type shape, fixed once when
    // the potion is identified rather than a per-drink choice.
    completeness: 'partial',
    modifiers: RESISTANCE_TOGGLE_TYPES.map((t) => ({
      id: id(), channel: 'value', target: resistancePath(t), op: 'set',
      value: RESISTANCE_RESISTANT, condition: { playerToggle: `item.potion-of-resistance.${t}` },
      permanence: 'temporary', note: `potion of resistance: ${t}`
    })),
    narrative: [{
      text: 'Resistance to one damage type for 1 hour, chosen by the GM '
        + 'or rolled (d10: acid, cold, fire, force, lightning, necrotic, '
        + 'poison, psychic, radiant, thunder) — turn on the matching toggle.',
      dmPromptable: true
    }]
  })
}

export const POTION_OF_SPEED: ItemDefinition = {
  id: 'srd:item.potion-of-speed', name: 'Potion of Speed',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'consumable', rarity: 'veryRare',
  effects: source({
    id: 'srd:item.potion-of-speed', name: 'Potion of Speed',
    // Haste's own three real modifiers — the potion and the spell produce
    // the identical mechanical effect. The extra action Haste grants is
    // the same gap left here.
    completeness: 'partial',
    modifiers: [
      { id: id(), channel: 'value', target: speedPath('walk'), op: 'multiply', value: 2, permanence: 'temporary', note: 'potion of speed' },
      add(ARMOR_CLASS, 2, { permanence: 'temporary', note: 'potion of speed' }),
      { id: id(), channel: 'roll', rollOp: 'advantage', scope: { kinds: ['save'], abilities: ['dex'] }, permanence: 'temporary', note: 'potion of speed' }
    ],
    narrative: [{
      text: 'As haste, for 1 minute, no concentration required. Grants '
        + 'no extra action here — apply it by hand.',
      dmPromptable: true
    }]
  })
}

// ===========================================================================
// A real charge pool, everything else narrative
// ===========================================================================

export const PIPES_OF_HAUNTING: ItemDefinition = {
  id: 'srd:item.pipes-of-haunting', name: 'Pipes of Haunting',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon',
  charges: { id: 'item.pipes-of-haunting.charges', name: 'Pipes of Haunting', max: 3, refresh: { kind: 'dawn', amount: { count: 1, sides: 3 } }, display: 'uses' },
  effects: source({
    id: 'srd:item.pipes-of-haunting', name: 'Pipes of Haunting',
    completeness: 'partial',
    narrative: [{
      text: 'Requires proficiency with wind instruments. Action and 1 '
        + 'charge: creatures within 30 feet that hear it save Wisdom (DC '
        + '15) or be frightened for 1 minute (you may exempt all '
        + 'non-hostile creatures), repeatable save, a success granting '
        + '24-hour immunity.',
      dmPromptable: true
    }]
  })
}

export const PIPES_OF_THE_SEWERS: ItemDefinition = {
  id: 'srd:item.pipes-of-the-sewers', name: 'Pipes of the Sewers',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon', requiresAttunement: true,
  charges: { id: 'item.pipes-of-the-sewers.charges', name: 'Pipes of the Sewers', max: 3, refresh: { kind: 'dawn', amount: { count: 1, sides: 3 } }, display: 'uses' },
  effects: source({
    id: 'srd:item.pipes-of-the-sewers', name: 'Pipes of the Sewers',
    completeness: 'partial',
    narrative: [{
      text: 'Requires proficiency with wind instruments; rats are '
        + 'indifferent to you. Action to play, then a bonus action to '
        + 'spend 1-3 charges summoning one rat swarm each, if enough rats '
        + 'are within half a mile. This content set carries no creature '
        + 'statblocks — narrate the result by hand.',
      dmPromptable: true
    }]
  })
}

// ===========================================================================
// No roll, or a roll with no effect field to carry it — narrative only
// ===========================================================================

export const PERIAPT_OF_HEALTH: ItemDefinition = {
  id: 'srd:item.periapt-of-health', name: 'Periapt of Health',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon', slot: 'amulet',
  effects: source({
    id: 'srd:item.periapt-of-health', name: 'Periapt of Health',
    narrative: [{ text: 'Immune to contracting disease; any current disease is suppressed while worn.', dmPromptable: false }]
  })
}

export const PERIAPT_OF_WOUND_CLOSURE: ItemDefinition = {
  id: 'srd:item.periapt-of-wound-closure', name: 'Periapt of Wound Closure',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon', slot: 'amulet', requiresAttunement: true,
  effects: source({
    id: 'srd:item.periapt-of-wound-closure', name: 'Periapt of Wound Closure',
    completeness: 'partial',
    narrative: [{
      text: 'You stabilise automatically whenever you are dying at the '
        + 'start of your turn, and Hit Dice spent to regain hit points restore double.',
      dmPromptable: true
    }]
  })
}

export const PHILTER_OF_LOVE: ItemDefinition = {
  id: 'srd:item.philter-of-love', name: 'Philter of Love',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'consumable', rarity: 'uncommon',
  effects: source({
    id: 'srd:item.philter-of-love', name: 'Philter of Love',
    completeness: 'partial',
    narrative: [{
      text: 'The next creature you see within 10 minutes charms you for '
        + 'an hour; if it matches what you find attractive, you regard it '
        + 'as your true love while charmed.',
      dmPromptable: true
    }]
  })
}

export const PORTABLE_HOLE: ItemDefinition = {
  id: 'srd:item.portable-hole', name: 'Portable Hole',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare',
  effects: source({
    id: 'srd:item.portable-hole', name: 'Portable Hole',
    // A container with capacity — the same gap Bag of Holding leaves.
    completeness: 'partial',
    narrative: [{
      text: 'Unfolds into a 6-foot circle creating a 10-foot-deep '
        + 'extradimensional hole; folding it shut traps the contents. '
        + 'Breathing creatures survive 10 minutes. Nesting with a bag of '
        + 'holding or handy haversack destroys both and opens a one-way '
        + 'Astral gate.',
      dmPromptable: true
    }]
  })
}

const SIMPLE_POTIONS: { key: string; name: string; rarity: ItemDefinition['rarity']; text: string }[] = [
  {
    key: 'animal-friendship', name: 'Potion of Animal Friendship', rarity: 'uncommon',
    text: 'Cast animal friendship (DC 13) at will for 1 hour.'
  },
  { key: 'clairvoyance', name: 'Potion of Clairvoyance', rarity: 'rare', text: 'Cast clairvoyance.' },
  {
    key: 'diminution', name: 'Potion of Diminution', rarity: 'rare',
    text: 'The reduce effect for 1d4 hours, no concentration required.'
  },
  {
    key: 'gaseous-form', name: 'Potion of Gaseous Form', rarity: 'rare',
    text: 'Gaseous form for 1 hour, no concentration required, endable as a bonus action.'
  },
  { key: 'growth', name: 'Potion of Growth', rarity: 'uncommon', text: 'The enlarge effect for 1d4 hours.' },
  {
    key: 'heroism', name: 'Potion of Heroism', rarity: 'rare',
    text: '10 temporary hit points and the effect of bless without concentration, for 1 hour.'
  },
  {
    key: 'invisibility', name: 'Potion of Invisibility', rarity: 'veryRare',
    text: 'Invisible for 1 hour, ending early if you attack or cast a spell. Apply the Invisible condition.'
  },
  { key: 'mind-reading', name: 'Potion of Mind Reading', rarity: 'rare', text: 'Cast detect thoughts (DC 13).' },
  {
    key: 'water-breathing', name: 'Potion of Water Breathing', rarity: 'uncommon',
    text: 'Breathe underwater for 1 hour.'
  }
]

export const SIMPLE_POTION_ITEMS: ItemDefinition[] = SIMPLE_POTIONS.map(({ key, name, rarity, text }) => {
  const pid = `srd:item.potion-of-${key}`
  return {
    id: pid, name,
    provenance: 'srd', contentVersion: 1, rulesetVersion: V,
    category: 'consumable' as const, rarity,
    effects: source({
      id: pid, name, completeness: 'partial',
      narrative: [{ text, dmPromptable: true }]
    })
  }
})

const HEALING_TIERS: { key: string; name: string; rarity: ItemDefinition['rarity']; text: string }[] = [
  { key: 'greater', name: 'Potion of Greater Healing', rarity: 'uncommon', text: 'Regain 4d4 + 4 hit points.' },
  { key: 'superior', name: 'Potion of Superior Healing', rarity: 'rare', text: 'Regain 8d4 + 8 hit points.' },
  { key: 'supreme', name: 'Potion of Supreme Healing', rarity: 'veryRare', text: 'Regain 10d4 + 20 hit points.' }
]

export const POTIONS_OF_HEALING_ITEMS: ItemDefinition[] = HEALING_TIERS.map(({ key, name, rarity, text }) => {
  const pid = `srd:item.potion-of-${key}-healing`
  return {
    id: pid, name,
    provenance: 'srd', contentVersion: 1, rulesetVersion: V,
    category: 'consumable' as const, rarity,
    effects: source({
      id: pid, name, completeness: 'partial',
      narrative: [{ text, dmPromptable: false }]
    })
  }
})

export const RESTORATIVE_OINTMENT: ItemDefinition = {
  id: 'srd:item.restorative-ointment', name: 'Restorative Ointment',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'consumable', rarity: 'uncommon',
  charges: { id: 'item.restorative-ointment.doses', name: 'Restorative Ointment', max: 5, refresh: { kind: 'never' }, display: 'uses' },
  effects: source({
    id: 'srd:item.restorative-ointment', name: 'Restorative Ointment',
    completeness: 'partial',
    narrative: [{
      text: '1d4+1 doses. Action to swallow or apply: 2d8+2 hit points, '
        + 'ends the poisoned condition, and cures any disease.',
      dmPromptable: true
    }]
  })
}

// ===========================================================================
// Registration
// ===========================================================================

export const ALL_ITEMS_IR2: ItemDefinition[] = [
  PERIAPT_OF_PROOF_AGAINST_POISON, PLATE_ARMOR_OF_ETHEREALNESS,
  ...POTIONS_OF_GIANT_STRENGTH, POTION_OF_CLIMBING, POTION_OF_FLYING,
  POTION_OF_RESISTANCE, POTION_OF_SPEED,
  PIPES_OF_HAUNTING, PIPES_OF_THE_SEWERS,
  PERIAPT_OF_HEALTH, PERIAPT_OF_WOUND_CLOSURE, PHILTER_OF_LOVE, PORTABLE_HOLE,
  ...SIMPLE_POTION_ITEMS, ...POTIONS_OF_HEALING_ITEMS, RESTORATIVE_OINTMENT
]
