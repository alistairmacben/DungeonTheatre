// Rolling damage, after the to-hit roll already landed.
//
// The rulebook is explicit and unambiguous on the one rule that matters here:
// "Roll all of the attack's damage dice twice and add them together, then add
// modifiers once. Extra dice from features are also doubled. Modifiers are
// not." (docs/srd/07-combat-spellcasting.md). So a crit doubles DICE COUNT,
// never the flat bonus — this file is built around that one line.
//
// Same split as every other roll in this project: the caller supplies faces
// (rolled by the authority — the server in real play, the local roller in
// #solo), this turns them into a total. Nothing here decides whether the
// attack hit; that already happened. Nothing here applies the damage to
// anyone either — theatre-of-the-mind means the DM decides what it hits and
// applies it through the existing dmDamage command, same as always.

import type { DamageType, DiceExpr } from './types.js'

/** One damage component's dice and flat bonus, already reduced to "roll this once". */
export interface DamagePool {
  type: DamageType
  dice: DiceExpr
  /** Never doubles on a crit — only the dice above do. */
  flat: number
}

/** How many dice of what size each pool needs, crit already folded in. */
export interface DiceNeed {
  type: DamageType
  sides: number
  count: number
}

export function diceNeededFor(pools: DamagePool[], critical: boolean): DiceNeed[] {
  return pools.map((p) => ({
    type: p.type,
    sides: p.dice.sides,
    count: p.dice.count * (critical ? 2 : 1)
  }))
}

export interface RolledDamagePool {
  type: DamageType
  rolls: number[]
  total: number
}

export interface RolledDamage {
  pools: RolledDamagePool[]
  /** Sum across every pool, every type. */
  total: number
  critical: boolean
  /** "12 fire" or "8 slashing + 3 fire" — what the DM reads to apply it. */
  label: string
}

/**
 * Turns the authority's dice results into a total.
 *
 * `faces[i]` must line up with `pools[i]` and contain exactly
 * `diceNeededFor(pools, critical)[i].count` values — the reducer that calls
 * this is responsible for checking that before trusting the result.
 */
export function totalDamageRoll(
  pools: DamagePool[], faces: number[][], critical: boolean
): RolledDamage {
  const rolledPools: RolledDamagePool[] = pools.map((p, i) => {
    const rolls = faces[i] ?? []
    const total = rolls.reduce((a, b) => a + b, 0) + p.flat
    return { type: p.type, rolls, total }
  })
  const total = rolledPools.reduce((a, p) => a + p.total, 0)
  return {
    pools: rolledPools,
    total,
    critical,
    label: rolledPools.map((p) => `${p.total} ${p.type}`).join(' + ')
  }
}

/** True when `faces` has the right shape for `pools` under this crit state. */
export function diceMismatch(
  pools: DamagePool[], faces: number[][], critical: boolean
): string | undefined {
  const need = diceNeededFor(pools, critical)
  if (faces.length !== need.length) {
    return `needs ${need.length} damage pool${need.length === 1 ? '' : 's'}, not ${faces.length}`
  }
  for (let i = 0; i < need.length; i++) {
    const n = need[i]!
    const got = faces[i] ?? []
    if (got.length !== n.count) {
      return `${n.type} needs ${n.count} d${n.sides}, not ${got.length}`
    }
    if (got.some((f) => !Number.isInteger(f) || f < 1 || f > n.sides)) {
      return `a d${n.sides} cannot show that`
    }
  }
  return undefined
}
