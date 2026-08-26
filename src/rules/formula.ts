// Evaluating ValueExpr.
//
// Several real effects are formulas rather than constants — Tough raises the
// hit point maximum by twice your level, Durable floors a Hit Die roll at twice
// your Constitution modifier, Inspiring Leader grants temporary hit points equal
// to level + Charisma modifier. Without a value language each of those would
// need bespoke code, which is the thing the architecture exists to prevent.

import type { DiceExpr, ValueExpr } from './types.js'

export interface ValueEnv {
  stat(path: string): number
  characterLevel(): number
  classLevel(classId: string): number
  /** The player's answer to a selection on the owning source, if any. */
  selection(id: string): string | undefined
  /** Numeric interpretation of a selection answer, where one exists. */
  selectionValue?(id: string): number | undefined
}

export function isDiceExpr(v: unknown): v is DiceExpr {
  return typeof v === 'object' && v !== null && 'count' in v && 'sides' in v
}

/** A dice expression contributes its average to a derived stat. */
export function averageOfDice(expr: DiceExpr): number {
  return expr.count * ((expr.sides + 1) / 2) + (expr.modifier ?? 0)
}

/**
 * Reads a level column: `values[0]` is the value at level 1.
 *
 * Below level 1 the answer is 0 — a class contributes nothing until it has a
 * level in it, which is what makes a multiclass character's tables behave.
 * Past the end of the array the last entry holds, because a book that stops
 * printing at 20 means "and it stays there", not "and then it is undefined".
 */
function fromLevelTable(values: number[], level: number): number {
  if (level < 1 || values.length === 0) return 0
  return values[Math.min(level, values.length) - 1] ?? 0
}

export function evaluateValue(expr: ValueExpr | undefined, env: ValueEnv): number {
  if (expr === undefined) return 0
  if (typeof expr === 'number') return expr
  if (isDiceExpr(expr)) return averageOfDice(expr)

  if ('stat' in expr) return env.stat(expr.stat)
  if ('characterLevel' in expr) return env.characterLevel()
  if ('classLevel' in expr) return env.classLevel(expr.classLevel)
  if ('characterLevelTable' in expr) {
    return fromLevelTable(expr.characterLevelTable, env.characterLevel())
  }
  if ('classLevelTable' in expr) {
    return fromLevelTable(
      expr.classLevelTable.values, env.classLevel(expr.classLevelTable.classId))
  }
  if ('sum' in expr) return expr.sum.reduce<number>((n, e) => n + evaluateValue(e, env), 0)
  if ('product' in expr) return expr.product.reduce<number>((n, e) => n * evaluateValue(e, env), 1)
  if ('min' in expr) return Math.min(...expr.min.map((e) => evaluateValue(e, env)))
  if ('max' in expr) return Math.max(...expr.max.map((e) => evaluateValue(e, env)))
  if ('floor' in expr) return Math.floor(evaluateValue(expr.floor, env))
  if ('ceil' in expr) return Math.ceil(evaluateValue(expr.ceil, env))
  if ('selection' in expr) return env.selectionValue?.(expr.selection) ?? 0

  return 0
}

/** Human-readable form, used in breakdown notes so a formula explains itself. */
export function describeValue(expr: ValueExpr | undefined): string {
  if (expr === undefined) return '0'
  if (typeof expr === 'number') return String(expr)
  if (isDiceExpr(expr)) {
    return `${expr.count}d${expr.sides}${expr.modifier ? (expr.modifier > 0 ? `+${expr.modifier}` : expr.modifier) : ''}`
  }
  if ('stat' in expr) return expr.stat
  if ('characterLevel' in expr) return 'character level'
  if ('classLevel' in expr) return `${expr.classLevel} level`
  if ('characterLevelTable' in expr) return 'by character level'
  if ('classLevelTable' in expr) return `by ${expr.classLevelTable.classId} level`
  if ('sum' in expr) return expr.sum.map(describeValue).join(' + ')
  if ('product' in expr) return expr.product.map(describeValue).join(' × ')
  if ('min' in expr) return `min(${expr.min.map(describeValue).join(', ')})`
  if ('max' in expr) return `max(${expr.max.map(describeValue).join(', ')})`
  if ('floor' in expr) return `floor(${describeValue(expr.floor)})`
  if ('ceil' in expr) return `ceil(${describeValue(expr.ceil)})`
  if ('selection' in expr) return `your choice for "${expr.selection}"`
  return '0'
}

/** True when the expression reads character state and so cannot be folded early. */
export function isDynamic(expr: ValueExpr | undefined): boolean {
  if (expr === undefined || typeof expr === 'number' || isDiceExpr(expr)) return false
  if ('stat' in expr || 'characterLevel' in expr || 'classLevel' in expr || 'selection' in expr) return true
  if ('characterLevelTable' in expr || 'classLevelTable' in expr) return true
  if ('sum' in expr) return expr.sum.some(isDynamic)
  if ('product' in expr) return expr.product.some(isDynamic)
  if ('min' in expr) return expr.min.some(isDynamic)
  if ('max' in expr) return expr.max.some(isDynamic)
  if ('floor' in expr) return isDynamic(expr.floor)
  if ('ceil' in expr) return isDynamic(expr.ceil)
  return false
}
