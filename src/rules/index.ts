// Layer 1 — the rules engine.
//
// Pure: no I/O, no clock, no randomness. Import this module on the client for
// optimistic prediction and on the server for authority; there is one
// implementation and two call sites, which is the property that keeps the two
// from diverging.

export * from './types.js'
export * from './statPaths.js'
export * from './predicates.js'
export * from './operations.js'
export * from './collect.js'
export * from './resolve.js'
export * from './roll.js'
export * from './damage.js'
export * from './conditions.js'
export * from './validate.js'

import type { ContentIndex } from './types.js'
import { conditionIndex } from './conditions.js'
import { declareSkill } from './statPaths.js'
import type { SkillDefinition } from './types.js'

/**
 * The 18 SRD skills. Kept here rather than in a dataset because the *list* is
 * vocabulary — checks and proficiencies reference these ids — while everything
 * else about skills is content. `defaultAbility` is a default, never a
 * constraint: the SRD explicitly sanctions Constitution (Athletics) and
 * Strength (Intimidation).
 */
export const SRD_SKILLS: SkillDefinition[] = [
  { id: 'acrobatics', name: 'Acrobatics', defaultAbility: 'dex' },
  { id: 'animal-handling', name: 'Animal Handling', defaultAbility: 'wis' },
  { id: 'arcana', name: 'Arcana', defaultAbility: 'int' },
  { id: 'athletics', name: 'Athletics', defaultAbility: 'str' },
  { id: 'deception', name: 'Deception', defaultAbility: 'cha' },
  { id: 'history', name: 'History', defaultAbility: 'int' },
  { id: 'insight', name: 'Insight', defaultAbility: 'wis' },
  { id: 'intimidation', name: 'Intimidation', defaultAbility: 'cha' },
  { id: 'investigation', name: 'Investigation', defaultAbility: 'int' },
  { id: 'medicine', name: 'Medicine', defaultAbility: 'wis' },
  { id: 'nature', name: 'Nature', defaultAbility: 'int' },
  { id: 'perception', name: 'Perception', defaultAbility: 'wis' },
  { id: 'performance', name: 'Performance', defaultAbility: 'cha' },
  { id: 'persuasion', name: 'Persuasion', defaultAbility: 'cha' },
  { id: 'religion', name: 'Religion', defaultAbility: 'int' },
  { id: 'sleight-of-hand', name: 'Sleight of Hand', defaultAbility: 'dex' },
  { id: 'stealth', name: 'Stealth', defaultAbility: 'dex' },
  { id: 'survival', name: 'Survival', defaultAbility: 'wis' }
]

/** Declares the skill stat paths. Call once before resolving. */
export function registerSrdSkills(): void {
  for (const s of SRD_SKILLS) declareSkill(s.id, s.defaultAbility)
}

/**
 * An empty content index seeded with the conditions and skills. Content is
 * loaded into it later; layers 2 and 3 go into the same maps, because SRD and
 * DM-authored definitions are the same type.
 */
export function createContentIndex(): ContentIndex {
  registerSrdSkills()
  return {
    species: new Map(),
    classes: new Map(),
    feats: new Map(),
    items: new Map(),
    spells: new Map(),
    conditions: conditionIndex(),
    skills: new Map(SRD_SKILLS.map((s) => [s.id, s])),
    ambient: []
  }
}
