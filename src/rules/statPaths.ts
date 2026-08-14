// The stat path registry. Every path a modifier can target is declared here
// with its dependencies, rounding and multiply-composition policy.
//
// Content never invents a path: an unknown path is a validation error, not a
// silently-ignored modifier.

import type { Ability, StatPath, StatPathDefinition } from './types.js'
import { ABILITIES } from './types.js'

const registry = new Map<StatPath, StatPathDefinition>()

function declare(def: StatPathDefinition): StatPathDefinition {
  if (registry.has(def.path)) throw new Error(`duplicate stat path: ${def.path}`)
  registry.set(def.path, def)
  return def
}

// --- ability scores and modifiers ------------------------------------------

export const abilityScorePath = (a: Ability): StatPath => `ability.${a}.score`
export const abilityModifierPath = (a: Ability): StatPath => `ability.${a}.modifier`
export const abilityMaxPath = (a: Ability): StatPath => `ability.${a}.max`

for (const a of ABILITIES) {
  // The cap is itself a stat, because the SRD raises it: 20 by default, 24 via
  // the Star card, 30 via hammer of thunderbolts, and permanently by the manuals.
  declare({
    path: abilityMaxPath(a),
    dependsOn: [],
    rounding: 'none',
    multiplyComposition: 'product',
    intrinsicBase: 20
  })

  declare({
    path: abilityScorePath(a),
    dependsOn: [abilityMaxPath(a)],
    rounding: 'floor',
    multiplyComposition: 'product'
    // The clamp to ability.<a>.max is applied by the resolver, which reads the
    // max path — see resolveStat's clamp stage.
  })

  declare({
    path: abilityModifierPath(a),
    dependsOn: [abilityScorePath(a)],
    rounding: 'floor',
    multiplyComposition: 'product',
    compute: (ctx) => Math.floor((ctx.get(abilityScorePath(a)) - 10) / 2)
  })
}

// --- proficiency -----------------------------------------------------------

export const PROFICIENCY_BONUS: StatPath = 'proficiencyBonus'

declare({
  path: PROFICIENCY_BONUS,
  dependsOn: [],
  rounding: 'floor',
  // The SRD's "you still add it only once and multiply or divide it only once"
  // is stated specifically about the proficiency bonus. Every other stat uses
  // the product default.
  multiplyComposition: 'single-highest',
  intrinsicBase: 2
})

// --- defence and vitality --------------------------------------------------

export const ARMOR_CLASS: StatPath = 'armorClass'
export const HP_MAX: StatPath = 'hitPoints.max'
export const INITIATIVE: StatPath = 'initiative'

declare({
  path: ARMOR_CLASS,
  dependsOn: [abilityModifierPath('dex')],
  rounding: 'floor',
  multiplyComposition: 'product'
  // No intrinsicBase: unarmoured 10 + Dex is itself a `base` provider so it
  // competes with armour, Unarmoured Defense, mage armor and robe of the
  // archmagi through the ordinary highest-wins rule.
})

declare({
  path: HP_MAX,
  dependsOn: [abilityModifierPath('con')],
  rounding: 'floor',
  multiplyComposition: 'product'
})

declare({
  path: INITIATIVE,
  dependsOn: [abilityModifierPath('dex')],
  rounding: 'floor',
  multiplyComposition: 'product',
  compute: (ctx) => ctx.get(abilityModifierPath('dex'))
})

// --- movement --------------------------------------------------------------

export type SpeedMode = 'walk' | 'fly' | 'swim' | 'climb' | 'burrow'
export const speedPath = (m: SpeedMode): StatPath => `speed.${m}`

for (const m of ['walk', 'fly', 'swim', 'climb', 'burrow'] as SpeedMode[]) {
  declare({
    path: speedPath(m),
    dependsOn: [],
    rounding: 'floor',
    multiplyComposition: 'product',
    notes: m === 'walk'
      // Exhaustion level 2 halves speed. The SRD does not state rounding for a
      // halved odd speed (a dwarf's 25 becomes 12.5). We floor, and say so.
      ? ['speed halving rounds down (SRD does not state; engine assumption)']
      : undefined
  })
}

// --- C1: movement costs ----------------------------------------------------
// Expressed as the number of feet of movement one foot of travel costs, so
// "climbing doesn't cost you extra movement" is a `set` to 1 rather than a
// bespoke flag. Difficult terrain, crawling and squeezing all live here too.

export type MovementCostKind = 'climb' | 'swim' | 'crawl' | 'difficultTerrain' | 'standUp'
export const movementCostPath = (k: MovementCostKind): StatPath => `movementCost.${k}`

for (const k of ['climb', 'swim', 'crawl', 'difficultTerrain'] as MovementCostKind[]) {
  declare({
    path: movementCostPath(k),
    dependsOn: [],
    rounding: 'none',
    multiplyComposition: 'product',
    intrinsicBase: 2
  })
}
// Standing up costs half your speed; Athlete reduces it to a flat 5 feet.
declare({
  path: movementCostPath('standUp'),
  dependsOn: [speedPath('walk')],
  rounding: 'floor',
  multiplyComposition: 'product',
  compute: (ctx) => Math.floor(ctx.get(speedPath('walk')) / 2)
})

// --- C2/C3: damage reduction and resistance bypass -------------------------

export const damageReductionPath = (t: string): StatPath => `damageReduction.${t}`
export const resistanceBypassPath = (t: string): StatPath => `resistanceBypass.${t}`

// --- C4: how much Dexterity armour admits ----------------------------------

export const ARMOR_DEX_CAP: StatPath = 'armorDexCap'
declare({
  path: ARMOR_DEX_CAP,
  dependsOn: [],
  rounding: 'floor',
  multiplyComposition: 'product',
  intrinsicBase: 99
})

// --- skills, saves, passives ----------------------------------------------

export const skillPath = (id: string): StatPath => `skill.${id}`
export const savePath = (a: Ability): StatPath => `save.${a}`
export const passivePath = (id: string): StatPath => `passive.${id}`

for (const a of ABILITIES) {
  declare({
    path: savePath(a),
    dependsOn: [abilityModifierPath(a), PROFICIENCY_BONUS],
    rounding: 'floor',
    multiplyComposition: 'product'
  })
}

/**
 * Skills are declared lazily because the skill list is content, not vocabulary
 * — and because a check may pair any skill with any ability.
 */
export function declareSkill(id: string, defaultAbility: Ability): void {
  if (registry.has(skillPath(id))) return
  declare({
    path: skillPath(id),
    dependsOn: [abilityModifierPath(defaultAbility), PROFICIENCY_BONUS],
    rounding: 'floor',
    multiplyComposition: 'product'
  })
  declare({
    path: passivePath(id),
    dependsOn: [skillPath(id)],
    rounding: 'floor',
    multiplyComposition: 'product',
    compute: (ctx) => 10 + ctx.get(skillPath(id))
  })
}

// --- spellcasting ----------------------------------------------------------

/**
 * Spell save DC and spell attack bonus are stats, not a formula living inside
 * a caster.
 *
 * The whole point: a Rod of the Pact Keeper raising the DC by 1 is `add`, and
 * needs no code. The class feature declaring `base(SPELL_SAVE_DC, 8)` plus its
 * ability modifier plus the proficiency bonus is the SRD formula expressed in
 * the ordinary vocabulary, so there is nothing spell-specific to resolve.
 *
 * Multiclassing has one DC per class. v1 is single-class and this is one stat;
 * see architecture.md §14 for the debt.
 */
export const SPELL_SAVE_DC: StatPath = 'spell.saveDc'
export const SPELL_ATTACK: StatPath = 'spell.attack'
/** How many spells may be prepared. Class features add to it; feats can too. */
export const SPELLS_PREPARED_MAX: StatPath = 'spell.preparedMax'

declare({
  path: SPELL_SAVE_DC,
  dependsOn: [PROFICIENCY_BONUS],
  rounding: 'floor',
  multiplyComposition: 'product'
})

declare({
  path: SPELL_ATTACK,
  dependsOn: [PROFICIENCY_BONUS],
  rounding: 'floor',
  multiplyComposition: 'product'
})

declare({
  path: SPELLS_PREPARED_MAX,
  dependsOn: [],
  rounding: 'floor',
  multiplyComposition: 'product'
})

// --- carrying, jumping -----------------------------------------------------

export const CARRYING_CAPACITY: StatPath = 'carryingCapacity'
export const PUSH_DRAG_LIFT: StatPath = 'pushDragLift'
export const JUMP_LONG: StatPath = 'jump.long'
export const JUMP_HIGH: StatPath = 'jump.high'

declare({
  path: CARRYING_CAPACITY,
  dependsOn: [abilityScorePath('str')],
  rounding: 'floor',
  multiplyComposition: 'product',
  compute: (ctx) => ctx.get(abilityScorePath('str')) * 15
})

declare({
  path: PUSH_DRAG_LIFT,
  dependsOn: [abilityScorePath('str')],
  rounding: 'floor',
  multiplyComposition: 'product',
  compute: (ctx) => ctx.get(abilityScorePath('str')) * 30
})

// Long jump uses the score; high jump uses the modifier. Not a typo — the SRD
// really does mix them.
declare({
  path: JUMP_LONG,
  dependsOn: [abilityScorePath('str')],
  rounding: 'floor',
  multiplyComposition: 'product',
  compute: (ctx) => ctx.get(abilityScorePath('str'))
})

declare({
  path: JUMP_HIGH,
  dependsOn: [abilityModifierPath('str')],
  rounding: 'floor',
  multiplyComposition: 'product',
  compute: (ctx) => 3 + ctx.get(abilityModifierPath('str'))
})

// --- spellcasting ----------------------------------------------------------

export const spellSaveDcPath = (classId: string): StatPath => `spell.${classId}.saveDC`
export const spellAttackPath = (classId: string): StatPath => `spell.${classId}.attackBonus`

/**
 * Declared per spellcasting source, because the ability is a property of the
 * granting source rather than of the character — a high elf's cantrip uses INT
 * regardless of class, and a dragonborn's breath DC uses CON.
 */
export function declareSpellcasting(classId: string, ability: Ability): void {
  if (registry.has(spellSaveDcPath(classId))) return
  declare({
    path: spellSaveDcPath(classId),
    dependsOn: [abilityModifierPath(ability), PROFICIENCY_BONUS],
    rounding: 'floor',
    multiplyComposition: 'product',
    compute: (ctx) => 8 + ctx.get(abilityModifierPath(ability)) + ctx.get(PROFICIENCY_BONUS)
  })
  declare({
    path: spellAttackPath(classId),
    dependsOn: [abilityModifierPath(ability), PROFICIENCY_BONUS],
    rounding: 'floor',
    multiplyComposition: 'product',
    compute: (ctx) => ctx.get(abilityModifierPath(ability)) + ctx.get(PROFICIENCY_BONUS)
  })
}

// --- crit range and resistances -------------------------------------------

export const CRIT_RANGE: StatPath = 'critRange'
export const resistancePath = (t: string): StatPath => `resistance.${t}`

declare({
  path: CRIT_RANGE,
  dependsOn: [],
  rounding: 'floor',
  multiplyComposition: 'product',
  intrinsicBase: 20
})

/**
 * Resistance is a ternary carried as a number so it flows through the ordinary
 * value pipeline: 0 none, 1 resistant, 2 immune, -1 vulnerable. `resistance.all`
 * is the blanket form petrification grants.
 */
export const RESISTANCE_NONE = 0
export const RESISTANCE_RESISTANT = 1
export const RESISTANCE_IMMUNE = 2
export const RESISTANCE_VULNERABLE = -1

export const DAMAGE_TYPE_PATHS = [
  'all', 'acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning',
  'necrotic', 'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder'
]

for (const t of DAMAGE_TYPE_PATHS) {
  declare({
    path: resistancePath(t),
    dependsOn: [],
    rounding: 'none',
    multiplyComposition: 'product',
    intrinsicBase: RESISTANCE_NONE
  })
  declare({
    path: damageReductionPath(t),
    dependsOn: [],
    rounding: 'floor',
    multiplyComposition: 'product',
    intrinsicBase: 0
  })
  declare({
    path: resistanceBypassPath(t),
    dependsOn: [],
    rounding: 'none',
    multiplyComposition: 'product',
    intrinsicBase: 0
  })
}

// --- the roll itself -------------------------------------------------------
// Elected options and situational effects that modify a roll's total target
// these paths, so "-5 to hit" is an ordinary modifier rather than a special
// case inside the attack resolver.

export const ATTACK_ROLL: StatPath = 'attack.roll'
export const CHECK_ROLL: StatPath = 'check.roll'
export const SAVE_ROLL: StatPath = 'save.roll'
export const DAMAGE_WEAPON: StatPath = 'damage.weapon'

for (const path of [ATTACK_ROLL, CHECK_ROLL, SAVE_ROLL, DAMAGE_WEAPON]) {
  declare({ path, dependsOn: [], rounding: 'floor', multiplyComposition: 'product', intrinsicBase: 0 })
}

/** Which roll-total path a roll of this kind reads. */
export function rollTargetPath(kind: string): StatPath | undefined {
  switch (kind) {
    case 'attack': return ATTACK_ROLL
    case 'save': return SAVE_ROLL
    case 'check':
    case 'initiative': return CHECK_ROLL
    case 'damage': return DAMAGE_WEAPON
    default: return undefined
  }
}

// --- resource maxima -------------------------------------------------------
// A resource maximum is an ordinary derived stat, so it is explainable like any
// other number and a class never stores it. Font of Magic adds its level to
// resource.sorceryPoints.max through the same modifier machinery as anything
// else.

export const resourceMaxPath = (resourceId: string): StatPath => `resource.${resourceId}.max`

export function declareResourceMax(resourceId: string): StatPath {
  const path = resourceMaxPath(resourceId)
  if (!registry.has(path)) {
    declare({
      path, dependsOn: [], rounding: 'floor', multiplyComposition: 'product', intrinsicBase: 0
    })
  }
  return path
}

// --- registry access -------------------------------------------------------

export function getStatPathDefinition(path: StatPath): StatPathDefinition | undefined {
  return registry.get(path)
}

export function requireStatPathDefinition(path: StatPath): StatPathDefinition {
  const def = registry.get(path)
  if (!def) throw new Error(`unknown stat path: ${path}`)
  return def
}

export function isDeclaredStatPath(path: StatPath): boolean {
  return registry.has(path)
}

export function allStatPaths(): StatPath[] {
  return [...registry.keys()]
}

/** A DM may invent a damage type, so resistance paths can be added on demand. */
export function declareResistance(damageType: string): void {
  if (registry.has(resistancePath(damageType))) return
  declare({
    path: resistancePath(damageType),
    dependsOn: [],
    rounding: 'none',
    multiplyComposition: 'product',
    intrinsicBase: 0
  })
}
