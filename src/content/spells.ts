// Spells.
//
// Twelve of them, chosen the way the weapons and feats were: for coverage, not
// volume. Between them they exercise every axis the spell model has —
// cantrip/slotted, instantaneous/duration, concentration/not, ritual, attack
// roll/save/no roll, self/touch/ranged, and a buff that has to reach the same
// stat pipeline armour uses.
//
// The load-bearing property, as everywhere else: none of these contains
// calculation logic. `mage armor` competes with chain mail through the ordinary
// highest-wins `base` rule, and *shield* stacks on top of it with `add`,
// because that is what the operations already mean.

import type { EffectSource, Modifier, SpellDefinition } from '../rules/types.js'
import { ARMOR_CLASS, resistancePath, speedPath } from '../rules/statPaths.js'

const V = '2014'
let n = 0
const id = () => `sp${++n}`

function effects(o: Partial<EffectSource> & { id: string; name: string }): EffectSource {
  return {
    provenance: 'srd', contentVersion: 1, kind: 'spell',
    activation: { always: true }, modifiers: [], completeness: 'complete',
    ...o
  }
}

const add = (target: string, value: Modifier['value'], extra: Partial<Modifier> = {}): Modifier =>
  ({ id: id(), channel: 'value', target, op: 'add', value, permanence: 'temporary', ...extra })

function spell(o: Partial<SpellDefinition> & {
  id: string; name: string; level: number; school: string; effects: EffectSource
}): SpellDefinition {
  return {
    provenance: 'srd', contentVersion: 1, rulesetVersion: V,
    ritual: false, castingTime: 'action', rangeKind: 'ranged',
    components: { verbal: true, somatic: true },
    concentration: false,
    ...o
  } as SpellDefinition
}

const WIZARD = 'srd:list.wizard'
const CLERIC = 'srd:list.cleric'
const SORCERER = 'srd:list.sorcerer'

// ===========================================================================
// Cantrips — no slot, so `slotGroup` never comes into it
// ===========================================================================

export const FIRE_BOLT = spell({
  id: 'srd:spell.fire-bolt', name: 'Fire Bolt', level: 0, school: 'evocation',
  rangeFeet: 120,
  effects: effects({
    id: 'srd:spell.fire-bolt', name: 'Fire Bolt',
    narrative: [{
      text: 'A mote of fire. Make a ranged spell attack; on a hit the target '
        + 'takes 1d10 fire damage. The damage increases at 5th, 11th and 17th level.',
      dmPromptable: false
    }]
  })
})

export const RAY_OF_FROST = spell({
  id: 'srd:spell.ray-of-frost', name: 'Ray of Frost', level: 0, school: 'evocation',
  rangeFeet: 60,
  effects: effects({
    id: 'srd:spell.ray-of-frost', name: 'Ray of Frost',
    narrative: [{
      text: 'A ranged spell attack for 1d8 cold damage. On a hit the target’s '
        + 'speed is reduced by 10 feet until the start of your next turn.',
      dmPromptable: false
    }]
  })
})

export const PRESTIDIGITATION = spell({
  id: 'srd:spell.prestidigitation', name: 'Prestidigitation', level: 0,
  school: 'transmutation', rangeFeet: 10, durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.prestidigitation', name: 'Prestidigitation',
    narrative: [{
      text: 'A minor magical trick: a shower of sparks, a puff of wind, a faint '
        + 'sound, a small mark or a trinket. Whatever the table agrees it does.',
      dmPromptable: true
    }]
  })
})

/**
 * The druid's cantrip pool was a selection with nowhere to choose from — no
 * `from:` list, because the agent who wrote it believed `SelectionDefinition`
 * had no spell-list kind. It does (`'spellList'`, already in the vocabulary,
 * used correctly by the bard next to it). This and Mending below give that
 * pool two real, quote-checked cantrips so a level-1 druid's "choose two" is
 * finally answerable.
 */
export const DRUIDCRAFT = spell({
  id: 'srd:spell.druidcraft', name: 'Druidcraft', level: 0,
  school: 'transmutation', rangeFeet: 30,
  effects: effects({
    id: 'srd:spell.druidcraft', name: 'Druidcraft',
    narrative: [{
      text: 'One of: a 24-hour weather prediction; make a flower bloom or a '
        + 'seed pod open; a harmless sensory effect in a 5-foot cube — falling '
        + 'leaves, a puff of wind, an animal sound, an odour; light or snuff a '
        + 'candle, torch or small campfire.',
      dmPromptable: true
    }]
  })
})

export const MENDING = spell({
  id: 'srd:spell.mending', name: 'Mending', level: 0,
  school: 'transmutation', castingTime: { minutes: 1 }, rangeKind: 'touch',
  // A plain "M" with no listed cost is met by an ordinary component pouch or
  // spellcasting focus under the core rules — the specific object is flavour,
  // not a mechanical fact this extraction records, so none is claimed here.
  components: { verbal: true, somatic: true, material: 'a component pouch or spellcasting focus' },
  effects: effects({
    id: 'srd:spell.mending', name: 'Mending',
    narrative: [{
      text: 'Repairs one break or tear no longer than a foot in any dimension, '
        + 'leaving no trace. Can physically repair a magic item or construct '
        + 'but cannot restore its magic.',
      dmPromptable: false
    }]
  })
})

export const SACRED_FLAME = spell({
  id: 'srd:spell.sacred-flame', name: 'Sacred Flame', level: 0, school: 'evocation',
  rangeFeet: 60, components: { verbal: true, somatic: true },
  effects: effects({
    id: 'srd:spell.sacred-flame', name: 'Sacred Flame',
    narrative: [{
      text: 'Radiance falls on a target you can see. It must succeed on a '
        + 'Dexterity saving throw or take 1d8 radiant damage. Cover does not help it.',
      dmPromptable: false
    }]
  })
})

// ===========================================================================
// Buffs — the interesting ones, because they meet armour in the AC pipeline
// ===========================================================================

/**
 * Mage armor.
 *
 * `base` 13, so it competes with chain mail's 16 by the ordinary highest-wins
 * rule and loses — which is exactly the SRD outcome, reached without anyone
 * writing "if wearing armour". The Dexterity term is the baseline's, untouched.
 */
export const MAGE_ARMOR = spell({
  id: 'srd:spell.mage-armor', name: 'Mage Armor', level: 1, school: 'abjuration',
  rangeKind: 'touch', durationSeconds: 28800,
  components: { verbal: true, somatic: true, material: 'a piece of cured leather' },
  effects: effects({
    id: 'srd:spell.mage-armor', name: 'Mage Armor',
    modifiers: [{
      id: id(), channel: 'value', target: ARMOR_CLASS, op: 'base', value: 13,
      permanence: 'temporary', note: 'mage armor'
    }],
    narrative: [{
      text: 'A protective magical force surrounds an unarmoured creature. Its '
        + 'base AC becomes 13 + its Dexterity modifier for 8 hours.',
      dmPromptable: false
    }]
  })
})

/**
 * Shield.
 *
 * `add` rather than `base`, so it stacks on top of whatever established the
 * base — armour, mage armor or nothing. The two spells sitting side by side is
 * the clearest demonstration in the content that the operations carry the
 * meaning.
 */
export const SHIELD_SPELL = spell({
  id: 'srd:spell.shield', name: 'Shield', level: 1, school: 'abjuration',
  castingTime: 'reaction', rangeKind: 'self', durationSeconds: 6,
  effects: effects({
    id: 'srd:spell.shield', name: 'Shield',
    modifiers: [add(ARMOR_CLASS, 5, { note: 'shield spell' })],
    narrative: [{
      text: 'An invisible barrier springs into being. You gain +5 AC until the '
        + 'start of your next turn, including against the triggering attack.',
      dmPromptable: false
    }]
  })
})

export const BLESS = spell({
  id: 'srd:spell.bless', name: 'Bless', level: 1, school: 'enchantment',
  rangeFeet: 30, concentration: true, durationSeconds: 60,
  components: { verbal: true, somatic: true, material: 'a sprinkling of holy water' },
  effects: effects({
    id: 'srd:spell.bless', name: 'Bless',
    narrative: [{
      text: 'Up to three creatures add 1d4 to each attack roll and saving throw '
        + 'they make for the duration. Party-wide effects are not modelled yet — '
        + 'apply the die at the table.',
      dmPromptable: true
    }],
    completeness: 'partial'
  })
})

export const LONGSTRIDER = spell({
  id: 'srd:spell.longstrider', name: 'Longstrider', level: 1,
  school: 'transmutation', rangeKind: 'touch', durationSeconds: 3600,
  components: { verbal: true, somatic: true, material: 'a pinch of dirt' },
  effects: effects({
    id: 'srd:spell.longstrider', name: 'Longstrider',
    modifiers: [add(speedPath('walk'), 10, { note: 'longstrider' })],
    narrative: [{ text: 'The target’s speed increases by 10 feet for an hour.', dmPromptable: false }]
  })
})

export const PROTECTION_FROM_ENERGY = spell({
  id: 'srd:spell.protection-from-energy', name: 'Protection from Energy', level: 3,
  school: 'abjuration', rangeKind: 'touch', concentration: true, durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.protection-from-energy', name: 'Protection from Energy',
    modifiers: [{
      id: id(), channel: 'value', target: resistancePath('fire'), op: 'set', value: 1,
      permanence: 'temporary', note: 'chosen energy type'
    }],
    selections: [{
      id: 'energy-type', prompt: 'Which damage type?', kind: 'damageType', count: 1,
      from: ['acid', 'cold', 'fire', 'lightning', 'thunder']
    }],
    narrative: [{
      text: 'The target gains resistance to one damage type of your choice for '
        + 'the duration. Modelled as fire until the selection drives the target path.',
      dmPromptable: true
    }],
    completeness: 'partial'
  })
})

// ===========================================================================
// Utility and ritual
// ===========================================================================

export const DETECT_MAGIC = spell({
  id: 'srd:spell.detect-magic', name: 'Detect Magic', level: 1, school: 'divination',
  ritual: true, rangeKind: 'self', concentration: true, durationSeconds: 600,
  effects: effects({
    id: 'srd:spell.detect-magic', name: 'Detect Magic',
    narrative: [{
      text: 'You sense the presence of magic within 30 feet, and on a spare '
        + 'action can see a faint aura around anything magical and learn its school.',
      dmPromptable: false
    }]
  })
})

export const IDENTIFY = spell({
  id: 'srd:spell.identify', name: 'Identify', level: 1, school: 'divination',
  ritual: true, rangeKind: 'touch', castingTime: { minutes: 1 },
  components: { verbal: true, somatic: true, material: 'a pearl worth 100 gp', materialCostCp: 10000 },
  effects: effects({
    id: 'srd:spell.identify', name: 'Identify',
    narrative: [{
      text: 'You learn an item’s properties, how to use them, whether it '
        + 'requires attunement and how many charges it has.',
      dmPromptable: true
    }]
  })
})

export const CURE_WOUNDS = spell({
  id: 'srd:spell.cure-wounds', name: 'Cure Wounds', level: 1, school: 'evocation',
  rangeKind: 'touch',
  effects: effects({
    id: 'srd:spell.cure-wounds', name: 'Cure Wounds',
    narrative: [{
      text: 'A creature you touch regains 1d8 + your spellcasting ability '
        + 'modifier hit points. Upcasting adds 1d8 per slot level above 1st.',
      dmPromptable: false
    }]
  })
})

export const MAGIC_MISSILE = spell({
  id: 'srd:spell.magic-missile', name: 'Magic Missile', level: 1, school: 'evocation',
  rangeFeet: 120,
  effects: effects({
    id: 'srd:spell.magic-missile', name: 'Magic Missile',
    narrative: [{
      text: 'Three darts of force, each hitting automatically for 1d4 + 1. '
        + 'One more dart per slot level above 1st.',
      dmPromptable: false
    }]
  })
})

// ===========================================================================
// Lists
// ===========================================================================

/** Every spell, with the class lists it appears on. */
const DRUID = 'srd:list.druid'

export const ALL_SPELLS: SpellDefinition[] = [
  { ...FIRE_BOLT, lists: [WIZARD, SORCERER] },
  { ...RAY_OF_FROST, lists: [WIZARD, SORCERER] },
  { ...PRESTIDIGITATION, lists: [WIZARD, SORCERER] },
  { ...SACRED_FLAME, lists: [CLERIC] },
  { ...MAGE_ARMOR, lists: [WIZARD, SORCERER] },
  { ...SHIELD_SPELL, lists: [WIZARD, SORCERER] },
  { ...BLESS, lists: [CLERIC] },
  // Longstrider, Detect Magic and Cure Wounds are all genuinely on the SRD
  // druid list (docs/srd/08-spell-lists.md) — the druid's own content file
  // said adding this tag was "a one-word data edit, not an engine change."
  { ...LONGSTRIDER, lists: [WIZARD, DRUID] },
  { ...PROTECTION_FROM_ENERGY, lists: [WIZARD, SORCERER, CLERIC] },
  { ...DETECT_MAGIC, lists: [WIZARD, SORCERER, CLERIC, DRUID] },
  { ...IDENTIFY, lists: [WIZARD] },
  { ...CURE_WOUNDS, lists: [CLERIC, DRUID] },
  { ...MAGIC_MISSILE, lists: [WIZARD, SORCERER] },
  { ...DRUIDCRAFT, lists: [DRUID] },
  // Also genuinely on the bard cantrip list. Bard's own grant draws from a
  // fixed pool rather than `lists` (see bard.ts), so this tag is accurate
  // bookkeeping today rather than something anything currently reads — but a
  // future fromList-based bard grant should find it already correct.
  { ...MENDING, lists: [DRUID, 'srd:list.bard'] }
]

export const SPELL_LISTS = { WIZARD, CLERIC, SORCERER, DRUID }
