// Damage application.
//
// Damage is a list of typed components, never a scalar — flame strike deals
// 4d6 fire *and* 4d6 radiant, and each is resisted independently.
//
// Stage order, from srd/91-effect-vocabulary.md §6:
//   1 roll typed components
//   2 crit rule          dice only, including feature dice; modifiers never
//   3 flat modifiers
//   4 flat reductions
//   5 resistance / vulnerability   AFTER everything else, deduped by type,
//                                  at most one halving and one doubling
//   6 damage threshold   objects only; sub-threshold damage is wholly ignored
//   7 temporary hit points
//   8 hit points

import type { DamagePacket, DamageType, ResistanceState, Term } from './types.js'

export interface RolledComponent {
  sourceId: string
  sourceName: string
  type: DamageType
  /** The dice result the authority produced, before modifiers. */
  diceTotal: number
  flat: number
  doublesOnCrit: boolean
  /** The extra dice rolled for a critical hit, if any. */
  critDiceTotal?: number
}

export interface DamageApplication {
  packet: DamagePacket
  rolled: RolledComponent[]
  critical: boolean
  /** Flat reductions applied before resistance, e.g. a protective aura. */
  flatReductions: { sourceId: string; sourceName: string; amount: number }[]
  resistances: Partial<Record<DamageType, ResistanceState>>
  /** Objects only. Sub-threshold damage does not reduce hit points at all. */
  damageThreshold?: number
  temporaryHitPoints: number
  hitPointsCurrent: number
}

export interface DamageResult {
  byType: { type: DamageType; amount: number; terms: Term[] }[]
  totalBeforeAbsorption: number
  absorbedByTemporary: number
  appliedToHitPoints: number
  temporaryHitPointsRemaining: number
  hitPointsRemaining: number
  terms: Term[]
  notes: string[]
}

export function applyDamage(input: DamageApplication): DamageResult {
  const terms: Term[] = []
  const notes: string[] = []
  const totals = new Map<DamageType, number>()

  for (const c of input.rolled) {
    let amount = c.diceTotal
    terms.push({
      sourceId: c.sourceId, sourceName: c.sourceName, provenance: 'system',
      op: 'add', value: c.diceTotal, applied: true, stage: 'base',
      note: `${c.type} dice`
    })

    // Roll all of the attack's damage dice twice; extra feature dice double
    // too. Modifiers are added once and never doubled.
    if (input.critical && c.doublesOnCrit) {
      const extra = c.critDiceTotal ?? c.diceTotal
      amount += extra
      terms.push({
        sourceId: c.sourceId, sourceName: c.sourceName, provenance: 'system',
        op: 'add', value: extra, applied: true, stage: 'add',
        note: 'critical hit: damage dice rolled twice'
      })
    } else if (input.critical && !c.doublesOnCrit && c.flat !== 0) {
      terms.push({
        sourceId: c.sourceId, sourceName: c.sourceName, provenance: 'system',
        op: 'add', value: 0, applied: false,
        reason: 'modifiers are not doubled on a critical hit', stage: 'add'
      })
    }

    if (c.flat !== 0) {
      amount += c.flat
      terms.push({
        sourceId: c.sourceId, sourceName: c.sourceName, provenance: 'system',
        op: 'add', value: c.flat, applied: true, stage: 'add', note: 'flat modifier'
      })
    }

    totals.set(c.type, (totals.get(c.type) ?? 0) + amount)
  }

  // Flat reductions apply before resistance. The SRD's worked example: 25
  // bludgeoning, a −5 aura, resistance ⇒ (25 − 5) / 2 = 10, not 25/2 − 5.
  let reductionLeft = input.flatReductions.reduce((n, r) => n + r.amount, 0)
  for (const r of input.flatReductions) {
    terms.push({
      sourceId: r.sourceId, sourceName: r.sourceName, provenance: 'system',
      op: 'add', value: -r.amount, applied: true, stage: 'add',
      note: 'reduction applied before resistance'
    })
  }

  const byType: DamageResult['byType'] = []
  let total = 0

  for (const [type, rawAmount] of totals) {
    let amount = rawAmount
    if (reductionLeft > 0) {
      const used = Math.min(reductionLeft, amount)
      amount -= used
      reductionLeft -= used
    }

    const state = input.resistances[type] ?? 'none'
    const typeTerms: Term[] = []
    if (state === 'immune') {
      typeTerms.push({
        sourceId: `resistance.${type}`, sourceName: `immunity to ${type}`,
        provenance: 'system', op: 'multiply', value: 0, applied: true, stage: 'multiply'
      })
      amount = 0
    } else if (state === 'resistant') {
      // At most one halving, regardless of how many sources grant resistance.
      typeTerms.push({
        sourceId: `resistance.${type}`, sourceName: `resistance to ${type}`,
        provenance: 'system', op: 'multiply', value: 0.5, applied: true, stage: 'multiply'
      })
      amount = Math.floor(amount / 2)
    } else if (state === 'vulnerable') {
      typeTerms.push({
        sourceId: `resistance.${type}`, sourceName: `vulnerability to ${type}`,
        provenance: 'system', op: 'multiply', value: 2, applied: true, stage: 'multiply'
      })
      amount = amount * 2
    }

    byType.push({ type, amount, terms: typeTerms })
    terms.push(...typeTerms)
    total += amount
  }

  // An object with a damage threshold ignores anything below it entirely —
  // sub-threshold damage is superficial and does not reduce hit points.
  if (input.damageThreshold !== undefined && total < input.damageThreshold) {
    terms.push({
      sourceId: 'system:damage-threshold', sourceName: 'damage threshold',
      provenance: 'system', op: 'set', value: 0, applied: true, stage: 'set',
      note: `${total} is below the threshold of ${input.damageThreshold}`
    })
    notes.push(`damage of ${total} did not meet the damage threshold of ${input.damageThreshold}`)
    total = 0
  }

  const absorbedByTemporary = Math.min(input.temporaryHitPoints, total)
  const appliedToHitPoints = total - absorbedByTemporary

  if (absorbedByTemporary > 0) {
    terms.push({
      sourceId: 'system:temp-hp', sourceName: 'temporary hit points',
      provenance: 'system', op: 'add', value: -absorbedByTemporary, applied: true,
      stage: 'add', note: 'temporary hit points are lost first'
    })
  }

  return {
    byType,
    totalBeforeAbsorption: total,
    absorbedByTemporary,
    appliedToHitPoints,
    temporaryHitPointsRemaining: input.temporaryHitPoints - absorbedByTemporary,
    hitPointsRemaining: input.hitPointsCurrent - appliedToHitPoints,
    terms,
    notes
  }
}

/**
 * Temporary hit points never stack: "you decide whether to keep the ones you
 * have or gain the new ones". A choice, not a sum — so the caller must supply
 * the decision rather than the engine guessing.
 */
export function assignTemporaryHitPoints(
  current: number,
  incoming: number,
  choice: 'keep' | 'replace'
): { value: number; note: string } {
  if (current === 0) return { value: incoming, note: 'no existing temporary hit points' }
  return choice === 'replace'
    ? { value: incoming, note: `replaced ${current} temporary hit points with ${incoming}` }
    : { value: current, note: `kept ${current} temporary hit points instead of ${incoming}` }
}
