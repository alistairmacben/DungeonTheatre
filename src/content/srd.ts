// Reference content, authored entirely in the layer-1 vocabulary.
//
// Deliberately small: one species, one class, five weapons, three armours, a
// shield, an accessory, a DM-authored weapon and eleven feats. Chosen for
// coverage rather than volume — between them they exercise every operation,
// every channel and every primitive added in this phase.
//
// Nothing here contains calculation logic. If a definition needed code, that
// would be a bug in the vocabulary, not a reason to write the code.

import type {
  ArmorProfile, ClassDefinition, EffectSource, FeatDefinition, ItemDefinition,
  Modifier, ProficiencyGrant, SpeciesDefinition, WeaponProfile
} from '../rules/types.js'
import {
  abilityModifierPath, abilityScorePath, ARMOR_CLASS, ARMOR_DEX_CAP,
  damageReductionPath, HP_MAX, INITIATIVE, movementCostPath, passivePath,
  resistancePath, resistanceBypassPath, speedPath
} from '../rules/statPaths.js'

const V = '2014'
let n = 0
const id = () => `m${++n}`

function source(o: Partial<EffectSource> & { id: string; name: string }): EffectSource {
  return {
    provenance: 'srd', contentVersion: 1, kind: 'feature',
    activation: { always: true }, modifiers: [], completeness: 'complete',
    ...o
  }
}

const add = (target: string, value: Modifier['value'], extra: Partial<Modifier> = {}): Modifier =>
  ({ id: id(), channel: 'value', target, op: 'add', value, permanence: 'persistent', ...extra })

const setTo = (target: string, value: Modifier['value'], extra: Partial<Modifier> = {}): Modifier =>
  ({ id: id(), channel: 'value', target, op: 'set', value, permanence: 'persistent', ...extra })

const prof = (
  category: ProficiencyGrant['category'],
  level: ProficiencyGrant['level'] = 'proficient',
  extra: Partial<ProficiencyGrant> = {}
): ProficiencyGrant =>
  ({ id: id(), category, level, rounding: 'floor', grantsProficiency: true, ...extra })

// ===========================================================================
// Baseline — the rules that belong to no piece of content
// ===========================================================================

/**
 * Unarmoured AC and the Dexterity contribution.
 *
 * Both are ordinary modifiers so armour competes with them through the normal
 * highest-wins `base` rule, and so heavy armour can remove the Dexterity
 * contribution with `suppress` rather than a special case. The Dex term is
 * capped by `armorDexCap`, which is itself a stat — which is what lets Medium
 * Armor Master raise it from 2 to 3 without touching this code.
 */
export const BASELINE: EffectSource = source({
  id: 'system:baseline', name: 'Baseline', provenance: 'system', kind: 'environment',
  modifiers: [
    { id: id(), channel: 'value', target: ARMOR_CLASS, op: 'base', value: 10, permanence: 'persistent', note: 'unarmoured' },
    {
      id: id(), channel: 'value', target: ARMOR_CLASS, op: 'add',
      value: { min: [{ stat: abilityModifierPath('dex') }, { stat: ARMOR_DEX_CAP }] },
      tags: ['ac-dex'], permanence: 'persistent', note: 'Dexterity, up to the armour cap'
    }
  ]
})

// ===========================================================================
// Species — Hill Dwarf
// ===========================================================================

export const HILL_DWARF: SpeciesDefinition = {
  id: 'srd:species.dwarf', name: 'Dwarf', provenance: 'srd', contentVersion: 1,
  size: 'medium', baseWalkSpeed: 25,
  effects: source({
    id: 'srd:species.dwarf', name: 'Dwarf', kind: 'species',
    modifiers: [
      add(abilityScorePath('con'), 2),
      { id: id(), channel: 'value', target: speedPath('walk'), op: 'base', value: 25, permanence: 'persistent' },
      // "Your speed is not reduced by wearing heavy armour" — a suppression of
      // a specific penalty, not a bonus.
      {
        id: id(), channel: 'value', op: 'suppress', permanence: 'persistent',
        suppresses: { tags: ['armor-strength-penalty'] },
        note: 'dwarven speed is not reduced by heavy armour'
      },
      {
        id: id(), channel: 'roll', rollOp: 'advantage',
        scope: { kinds: ['save'], againstTags: ['poison'] },
        permanence: 'persistent', note: 'Dwarven Resilience'
      },
      setTo(resistancePath('poison'), 1, { note: 'Dwarven Resilience' })
    ],
    proficiencies: [
      prof({ kind: 'weapon', itemId: 'srd:weapon.battleaxe' }),
      prof({ kind: 'weapon', itemId: 'srd:weapon.handaxe' }),
      // Stonecunning grants History proficiency *and* doubles it, but only for
      // stonework — a judgement the engine cannot make, so it is a toggle that
      // appears in every breakdown rather than an invented rule.
      prof({ kind: 'skill', id: 'history' }, 'expertise', {
        condition: { playerToggle: 'dwarf.stonecunning' }
      })
    ],
    narrative: [{
      text: 'Stonecunning applies only to History checks related to the origin '
        + 'of stonework. Toggle it when the DM agrees it applies.',
      toggleId: 'dwarf.stonecunning', dmPromptable: true
    }]
  }),
  subspecies: [{
    id: 'srd:species.dwarf.hill', name: 'Hill Dwarf',
    effects: source({
      id: 'srd:species.dwarf.hill', name: 'Hill Dwarf', kind: 'species',
      modifiers: [
        add(abilityScorePath('wis'), 1),
        // Dwarven Toughness: +1 hit point per level. A formula, not a constant,
        // so it stays correct as the character levels.
        add(HP_MAX, { characterLevel: true }, { note: 'Dwarven Toughness: +1 per level' })
      ]
    })
  }]
}

// ===========================================================================
// Class — Fighter
// ===========================================================================
//
// Moved to fighter.ts when it was authored to level 20 with its Champion
// archetype. It lived here as a levels-1-to-2 reference sketch while this
// file was the whole content set; keeping a second, shallower Fighter here
// would have been two classes with one id.

// ===========================================================================
// Weapons
// ===========================================================================

function weapon(
  wid: string, name: string, profile: WeaponProfile, extra: Partial<ItemDefinition> = {}
): ItemDefinition {
  return {
    id: wid, name, provenance: 'srd', contentVersion: 1, rulesetVersion: V,
    category: 'weapon', slot: 'mainHand', weapon: profile,
    effects: source({ id: wid, name, kind: 'item' }),
    ...extra
  }
}

export const LONGSWORD = weapon('srd:weapon.longsword', 'Longsword', {
  category: 'martial', reach: 'melee',
  damage: { count: 1, sides: 8 }, damageType: 'slashing',
  properties: ['versatile'], versatileDamage: { count: 1, sides: 10 }
})

// Dwarven Combat Training has granted proficiency with this since the dwarf
// was written, against a weapon nobody had defined — so every dwarf carried a
// proficiency that silently did nothing. Found by the content integrity check
// on its first run, which is the entire argument for having one.
export const BATTLEAXE = weapon('srd:weapon.battleaxe', 'Battleaxe', {
  category: 'martial', reach: 'melee',
  damage: { count: 1, sides: 8 }, damageType: 'slashing',
  properties: ['versatile'], versatileDamage: { count: 1, sides: 10 }
})

export const GREATSWORD = weapon('srd:weapon.greatsword', 'Greatsword', {
  category: 'martial', reach: 'melee',
  damage: { count: 2, sides: 6 }, damageType: 'slashing',
  properties: ['heavy', 'two-handed']
})

export const DAGGER = weapon('srd:weapon.dagger', 'Dagger', {
  category: 'simple', reach: 'melee',
  damage: { count: 1, sides: 4 }, damageType: 'piercing',
  properties: ['finesse', 'light', 'thrown'],
  normalRangeFeet: 20, longRangeFeet: 60
})

export const LONGBOW = weapon('srd:weapon.longbow', 'Longbow', {
  category: 'martial', reach: 'ranged',
  damage: { count: 1, sides: 8 }, damageType: 'piercing',
  properties: ['heavy', 'two-handed', 'ammunition'],
  normalRangeFeet: 150, longRangeFeet: 600
})

export const HANDAXE = weapon('srd:weapon.handaxe', 'Handaxe', {
  category: 'simple', reach: 'melee',
  damage: { count: 1, sides: 6 }, damageType: 'slashing',
  properties: ['light', 'thrown'],
  normalRangeFeet: 20, longRangeFeet: 60
})

// ===========================================================================
// Armour and shields
// ===========================================================================

// Exported so magic-armor items (Dragon Scale Mail, Dwarven Plate, and
// similar entries whose SRD name is a real base armor type, not a generic
// enhancement) can build a real base AC and Dexterity cap instead of
// stacking a bare `add` on top of nothing.
export function armor(
  aid: string, name: string, profile: ArmorProfile, modifiers: Modifier[] = []
): ItemDefinition {
  // A shield sets no base AC — it adds to whatever the body armour established.
  // Emitting base 0 would be inert in the resolver but would still surface as a
  // meaningless "AC 0" line wherever the item explains itself.
  const mods: Modifier[] = [
    ...(profile.category === 'shield'
      ? []
      : [{ id: id(), channel: 'value', target: ARMOR_CLASS, op: 'base', value: profile.baseAc, permanence: 'persistent' } as Modifier]),
    ...modifiers
  ]

  if (profile.dexCap === 0) {
    // Heavy armour admits no Dexterity at all — and, crucially, a negative
    // Dexterity modifier is not applied either. Suppressing the contribution
    // expresses both halves; capping it at 0 would wrongly subtract.
    mods.push({
      id: id(), channel: 'value', op: 'suppress', permanence: 'persistent',
      suppresses: { tags: ['ac-dex'] },
      note: 'heavy armour: Dexterity does not apply'
    })
  } else if (profile.dexCap !== null) {
    mods.push(setTo(ARMOR_DEX_CAP, profile.dexCap, { note: `${profile.category} armour Dex cap` }))
  }

  if (profile.stealthDisadvantage) {
    mods.push({
      id: id(), channel: 'roll', rollOp: 'disadvantage',
      scope: { kinds: ['check'], skills: ['stealth'] },
      tags: ['armor-stealth-penalty'], permanence: 'persistent',
      note: `${name}: disadvantage on Stealth`
    })
  }

  if (profile.strengthRequirement) {
    mods.push(add(speedPath('walk'), -10, {
      condition: { statAtMost: [abilityScorePath('str'), profile.strengthRequirement - 1] },
      tags: ['armor-strength-penalty'],
      note: `requires Strength ${profile.strengthRequirement}`
    }))
  }

  return {
    id: aid, name, provenance: 'srd', contentVersion: 1, rulesetVersion: V,
    category: profile.category === 'shield' ? 'shield' : 'armor',
    slot: profile.category === 'shield' ? 'shield' : 'armor',
    armor: profile,
    effects: source({ id: aid, name, kind: 'item', modifiers: mods })
  }
}

export const LEATHER = armor('srd:armor.leather', 'Leather Armor',
  { category: 'light', baseAc: 11, dexCap: null })

export const HALF_PLATE = armor('srd:armor.half-plate', 'Half Plate',
  { category: 'medium', baseAc: 15, dexCap: 2, stealthDisadvantage: true })

export const CHAIN_MAIL = armor('srd:armor.chain-mail', 'Chain Mail',
  { category: 'heavy', baseAc: 16, dexCap: 0, strengthRequirement: 13, stealthDisadvantage: true })

export const SHIELD = armor('srd:armor.shield', 'Shield',
  { category: 'shield', baseAc: 0, dexCap: null },
  [add(ARMOR_CLASS, 2, { note: 'shield' })])

// ===========================================================================
// Accessories
// ===========================================================================

export const CLOAK_OF_PROTECTION: ItemDefinition = {
  id: 'srd:item.cloak-of-protection', name: 'Cloak of Protection',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon', slot: 'cloak', requiresAttunement: true,
  effects: source({
    id: 'srd:item.cloak-of-protection', name: 'Cloak of Protection', kind: 'item',
    modifiers: [
      add(ARMOR_CLASS, 1),
      add('save.str', 1), add('save.dex', 1), add('save.con', 1),
      add('save.int', 1), add('save.wis', 1), add('save.cha', 1)
    ]
  })
}

/**
 * DM-authored content, resolved by exactly the same code as everything above.
 * The only difference is `provenance` and `campaignId`.
 */
export const FLAMEFANG: ItemDefinition = {
  id: 'dm:weapon.flamefang', name: 'Flamefang',
  provenance: 'dm', contentVersion: 1, campaignId: 'camp-1', rulesetVersion: V,
  category: 'weapon', slot: 'mainHand', rarity: 'rare', requiresAttunement: true,
  weapon: {
    category: 'martial', reach: 'melee',
    damage: { count: 1, sides: 8 }, damageType: 'slashing',
    properties: ['versatile'], versatileDamage: { count: 1, sides: 10 }
  },
  effects: source({
    id: 'dm:weapon.flamefang', name: 'Flamefang', kind: 'item',
    provenance: 'dm', campaignId: 'camp-1',
    modifiers: [
      add(ARMOR_CLASS, 0, { note: 'no defensive property' }),
      // The DM wrote a fire-resistance bypass using the same primitive
      // Elemental Adept uses. No custom code was needed to make it work.
      setTo(resistanceBypassPath('fire'), 1, { note: 'Flamefang ignores fire resistance' })
    ]
  })
}

// ===========================================================================
// Feats — eleven, chosen to exercise every primitive
// ===========================================================================

function feat(
  fid: string, name: string, prerequisite: FeatDefinition['prerequisite'],
  effects: Partial<EffectSource>
): FeatDefinition {
  return {
    id: fid, name, provenance: 'srd', contentVersion: 1, sourceRef: '2014 feat list',
    prerequisite,
    effects: source({ id: fid, name, kind: 'feat', ...effects })
  }
}

/** Formula-valued modifier: hit point maximum increases by twice your level. */
export const TOUGH = feat('srd:feat.tough', 'Tough', { always: true }, {
  modifiers: [add(HP_MAX, { product: [{ characterLevel: true }, 2] },
    { note: 'twice your level' })]
})

/** Selection-driven: the chosen ability gains +1 and a save proficiency. */
export const RESILIENT = feat('srd:feat.resilient', 'Resilient', { always: true }, {
  selections: [{
    id: 'ability', prompt: 'Choose one ability score', kind: 'ability', count: 1,
    from: ['str', 'dex', 'con', 'int', 'wis', 'cha']
  }],
  // The ability increase is authored per ability and gated on the selection, so
  // the feat needs no code to know which one was chosen.
  modifiers: (['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map((a) =>
    add(abilityScorePath(a), 1, {
      condition: { dmFlag: `resilient.${a}` },
      note: `Resilient: ${a.toUpperCase()}`
    })),
  proficiencies: [
    { id: id(), category: { kind: 'save', ability: 'str', selection: 'ability' } as never,
      level: 'proficient', rounding: 'floor', grantsProficiency: true }
  ]
})

/** Movement-cost primitive (C1) plus a selectable ability increase. */
export const ATHLETE = feat('srd:feat.athlete', 'Athlete', { always: true }, {
  selections: [{ id: 'ability', prompt: 'Strength or Dexterity', kind: 'ability', count: 1, from: ['str', 'dex'] }],
  modifiers: [
    setTo(movementCostPath('climb'), 1, { note: "climbing doesn't cost extra movement" }),
    setTo(movementCostPath('standUp'), 5, { note: 'standing up uses only 5 feet' })
  ]
})

/** Proficiency-category primitive plus a prerequisite over another proficiency. */
export const HEAVILY_ARMORED = feat('srd:feat.heavily-armored', 'Heavily Armored',
  { hasProficiency: { kind: 'armor', category: 'medium' } }, {
  modifiers: [add(abilityScorePath('str'), 1)],
  proficiencies: [prof({ kind: 'armor', category: 'heavy' })]
})

/** Damage-reduction primitive (C2). */
export const HEAVY_ARMOR_MASTER = feat('srd:feat.heavy-armor-master', 'Heavy Armor Master',
  { hasProficiency: { kind: 'armor', category: 'heavy' } }, {
  modifiers: [
    add(abilityScorePath('str'), 1),
    ...(['bludgeoning', 'piercing', 'slashing'] as const).map((t) =>
      add(damageReductionPath(t), 3, {
        condition: { playerToggle: 'wearing-heavy-armor' },
        note: 'nonmagical bludgeoning, piercing and slashing reduced by 3'
      }))
  ],
  narrative: [{
    text: 'The reduction applies only to nonmagical attacks. Toggle it while '
      + 'wearing heavy armour.',
    toggleId: 'wearing-heavy-armor', dmPromptable: true
  }]
})

/** Passive-score paths. */
export const OBSERVANT = feat('srd:feat.observant', 'Observant', { always: true }, {
  selections: [{ id: 'ability', prompt: 'Intelligence or Wisdom', kind: 'ability', count: 1, from: ['int', 'wis'] }],
  modifiers: [
    add(passivePath('perception'), 5),
    add(passivePath('investigation'), 5)
  ]
})

/** Elected option: the -5/+10 gamble, declared before the roll. */
export const GREAT_WEAPON_MASTER = feat('srd:feat.great-weapon-master', 'Great Weapon Master',
  { always: true }, {
  options: [{
    id: 'gwm.power-attack',
    label: 'Power Attack (−5 to hit, +10 damage)',
    scope: { kinds: ['attack'] },
    modifiers: [
      { id: id(), channel: 'value', target: 'attack.roll', op: 'add', value: -5, permanence: 'temporary', note: '−5 to hit' },
      { id: id(), channel: 'value', target: 'damage.weapon', op: 'add', value: 10, permanence: 'temporary', note: '+10 damage' }
    ]
  }]
})

/** The same primitive, ranged — proving the option mechanism is not weapon-specific. */
export const SHARPSHOOTER = feat('srd:feat.sharpshooter', 'Sharpshooter', { always: true }, {
  modifiers: [
    // "Attacking at long range doesn't impose disadvantage" and "ignore half
    // and three-quarters cover" are suppressions of tagged modifiers — the
    // primitive that already existed, reused rather than duplicated.
    {
      id: id(), channel: 'value', op: 'suppress', permanence: 'persistent',
      suppresses: { tags: ['long-range'] },
      note: 'long range does not impose disadvantage'
    }
  ],
  options: [{
    id: 'ss.power-attack',
    label: 'Power Attack (−5 to hit, +10 damage)',
    scope: { kinds: ['attack'] },
    modifiers: [
      { id: id(), channel: 'value', target: 'attack.roll', op: 'add', value: -5, permanence: 'temporary' },
      { id: id(), channel: 'value', target: 'damage.weapon', op: 'add', value: 10, permanence: 'temporary' }
    ]
  }]
})

/** Damage-die roll op. */
export const SAVAGE_ATTACKER = feat('srd:feat.savage-attacker', 'Savage Attacker',
  { always: true }, {
  modifiers: [{
    id: id(), channel: 'roll', rollOp: 'rerollDamageDice',
    scope: { kinds: ['damage'] }, permanence: 'persistent',
    note: 'once per turn, reroll melee weapon damage dice and use either total'
  }]
})

/** Resistance-bypass primitive (C3) plus a damage-die floor, both selection-driven. */
export const ELEMENTAL_ADEPT = feat('srd:feat.elemental-adept', 'Elemental Adept',
  { canCastSpells: true }, {
  selections: [{
    id: 'damageType', prompt: 'Choose a damage type', kind: 'damageType', count: 1,
    from: ['acid', 'cold', 'fire', 'lightning', 'thunder']
  }],
  modifiers: [
    ...(['acid', 'cold', 'fire', 'lightning', 'thunder'] as const).map((t) =>
      setTo(resistanceBypassPath(t), 1, {
        condition: { dmFlag: `elemental-adept.${t}` },
        note: `spells ignore resistance to ${t}`
      })),
    {
      id: id(), channel: 'roll', rollOp: 'minimumDieFace', rollValue: 2,
      scope: { kinds: ['damage'] }, permanence: 'persistent',
      note: 'treat any 1 on a damage die as a 2'
    }
  ]
})

/** Capability key (C6) plus an initiative bonus and a targeted suppression. */
export const ALERT = feat('srd:feat.alert', 'Alert', { always: true }, {
  modifiers: [
    add(INITIATIVE, 5),
    { id: id(), channel: 'capability', capability: 'beSurprised', capOp: 'revoke', permanence: 'persistent' },
    {
      id: id(), channel: 'value', op: 'suppress', permanence: 'persistent',
      suppresses: { tags: ['unseen-attacker'] },
      note: 'others gain no advantage on attacks against you from being unseen'
    }
  ]
})

/** armorDexCap primitive (C4) plus the mithral-style stealth suppression. */
export const MEDIUM_ARMOR_MASTER = feat('srd:feat.medium-armor-master', 'Medium Armor Master',
  { hasProficiency: { kind: 'armor', category: 'medium' } }, {
  modifiers: [
    {
      id: id(), channel: 'value', op: 'suppress', permanence: 'persistent',
      suppresses: { tags: ['armor-stealth-penalty'] },
      note: 'medium armour does not impose disadvantage on Stealth'
    },
    setTo(ARMOR_DEX_CAP, 3, {
      priority: 10,
      condition: { statAtLeast: [abilityScorePath('dex'), 16] },
      note: 'add 3 rather than 2 with Dexterity 16 or higher'
    })
  ]
})

// ===========================================================================

export const ALL_SPECIES = [HILL_DWARF]
export const ALL_CLASSES: ClassDefinition[] = []
export const ALL_ITEMS = [
  LONGSWORD, BATTLEAXE, GREATSWORD, DAGGER, LONGBOW, HANDAXE,
  LEATHER, HALF_PLATE, CHAIN_MAIL, SHIELD,
  CLOAK_OF_PROTECTION, FLAMEFANG
]
export const ALL_FEATS = [
  TOUGH, RESILIENT, ATHLETE, HEAVILY_ARMORED, HEAVY_ARMOR_MASTER, OBSERVANT,
  GREAT_WEAPON_MASTER, SHARPSHOOTER, SAVAGE_ATTACKER, ELEMENTAL_ADEPT, ALERT,
  MEDIUM_ARMOR_MASTER
]
