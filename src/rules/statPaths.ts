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

/**
 * Resistance paths are open-ended (a DM may invent a damage type), so they are
 * declared on demand rather than up front.
 */
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
