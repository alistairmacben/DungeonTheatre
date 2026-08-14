// Predicate evaluation. One language, used by source activation, action
// requirements, feat prerequisites, attunement gates and situational modifier
// conditions alike — so a DM-authored item's gate is the same machinery as a
// class feature's.

import type {
  CapabilityKey, ConditionId, Predicate, ProficiencyCategory, StatPath
} from './types.js'

/**
 * Everything a predicate can read. Deliberately small: if a predicate needs
 * something not on here, that is a vocabulary decision, not an ad-hoc lookup.
 */
export interface PredicateEnv {
  getStat(path: StatPath): number
  hasCondition(id: ConditionId): boolean
  hasCapability(key: CapabilityKey): boolean
  /** Armour, weapon, skill, tool or save proficiency. Gates Heavily Armored and friends. */
  hasProficiency(category: ProficiencyCategory): boolean
  /** Whether the character can cast at least one spell from its own features. */
  canCastSpells(): boolean
  characterLevel(): number
  classLevel(classId: string): number
  speciesId(): string
  isEquipped(definitionId: string): boolean
  isAttunedTo(definitionId: string): boolean
  resourceRemaining(resourceId: string): number
  toggle(id: string): boolean
  dmFlag(id: string): boolean
}

export interface PredicateResult {
  value: boolean
  /** Human-readable explanation of why it failed. Empty when value is true. */
  reason: string
}

export function describeProficiency(c: ProficiencyCategory): string {
  switch (c.kind) {
    case 'skill': return `the ${c.id} skill`
    case 'tool': return `${c.id}`
    case 'save': return `${c.ability.toUpperCase()} saving throws`
    case 'armor': return `${c.category} armour`
    case 'weaponCategory': return `${c.category} weapons`
    case 'weapon': return `the ${c.itemId} weapon`
  }
}

const ok: PredicateResult = { value: true, reason: '' }
const fail = (reason: string): PredicateResult => ({ value: false, reason })

export function evaluate(pred: Predicate | undefined, env: PredicateEnv): PredicateResult {
  if (!pred) return ok

  if ('always' in pred) return ok

  if ('all' in pred) {
    for (const p of pred.all) {
      const r = evaluate(p, env)
      if (!r.value) return r
    }
    return ok
  }

  if ('any' in pred) {
    if (pred.any.length === 0) return ok
    const reasons: string[] = []
    for (const p of pred.any) {
      const r = evaluate(p, env)
      if (r.value) return ok
      reasons.push(r.reason)
    }
    return fail(`none of: ${reasons.join('; ')}`)
  }

  if ('not' in pred) {
    const r = evaluate(pred.not, env)
    return r.value ? fail('excluded by a "not" condition') : ok
  }

  if ('statAtLeast' in pred) {
    const [path, min] = pred.statAtLeast
    const actual = env.getStat(path)
    return actual >= min ? ok : fail(`${path} is ${actual}, below the required ${min}`)
  }

  if ('statAtMost' in pred) {
    const [path, max] = pred.statAtMost
    const actual = env.getStat(path)
    return actual <= max ? ok : fail(`${path} is ${actual}, above the permitted ${max}`)
  }

  if ('hasCapability' in pred) {
    return env.hasCapability(pred.hasCapability)
      ? ok
      : fail(`cannot ${pred.hasCapability}`)
  }

  if ('hasProficiency' in pred) {
    return env.hasProficiency(pred.hasProficiency)
      ? ok
      : fail(`not proficient with ${describeProficiency(pred.hasProficiency)}`)
  }

  if ('canCastSpells' in pred) {
    return env.canCastSpells() ? ok : fail('cannot cast at least one spell')
  }

  if ('hasCondition' in pred) {
    return env.hasCondition(pred.hasCondition)
      ? ok
      : fail(`not ${pred.hasCondition}`)
  }

  if ('characterLevelAtLeast' in pred) {
    const lvl = env.characterLevel()
    return lvl >= pred.characterLevelAtLeast
      ? ok
      : fail(`character level ${lvl}, below the required ${pred.characterLevelAtLeast}`)
  }

  if ('classLevelAtLeast' in pred) {
    const [classId, min] = pred.classLevelAtLeast
    const lvl = env.classLevel(classId)
    return lvl >= min ? ok : fail(`${classId} level ${lvl}, below the required ${min}`)
  }

  if ('speciesIs' in pred) {
    return env.speciesId() === pred.speciesIs
      ? ok
      : fail(`species is ${env.speciesId()}, not ${pred.speciesIs}`)
  }

  if ('isEquipped' in pred) {
    return env.isEquipped(pred.isEquipped) ? ok : fail(`${pred.isEquipped} is not equipped`)
  }

  if ('isAttunedTo' in pred) {
    return env.isAttunedTo(pred.isAttunedTo) ? ok : fail(`not attuned to ${pred.isAttunedTo}`)
  }

  if ('resourceAtLeast' in pred) {
    const [resourceId, min] = pred.resourceAtLeast
    const left = env.resourceRemaining(resourceId)
    return left >= min ? ok : fail(`${resourceId}: ${left} remaining, needs ${min}`)
  }

  if ('playerToggle' in pred) {
    // The narrative escape hatch. Not a failure of the engine — a decision the
    // engine is not entitled to make.
    return env.toggle(pred.playerToggle)
      ? ok
      : fail(`"${pred.playerToggle}" is not switched on`)
  }

  if ('dmFlag' in pred) {
    return env.dmFlag(pred.dmFlag) ? ok : fail(`DM flag "${pred.dmFlag}" is not set`)
  }

  // Exhaustive above; anything reaching here is malformed content.
  return fail('malformed predicate')
}

/**
 * Stat paths a predicate reads. Used to decide whether a source's activation
 * participates in the fixed-point loop, so sources that cannot feed back are
 * resolved once and never re-evaluated.
 */
export function statDependencies(pred: Predicate | undefined, out: Set<StatPath> = new Set()): Set<StatPath> {
  if (!pred) return out
  if ('all' in pred) pred.all.forEach((p) => statDependencies(p, out))
  else if ('any' in pred) pred.any.forEach((p) => statDependencies(p, out))
  else if ('not' in pred) statDependencies(pred.not, out)
  else if ('statAtLeast' in pred) out.add(pred.statAtLeast[0])
  else if ('statAtMost' in pred) out.add(pred.statAtMost[0])
  return out
}
