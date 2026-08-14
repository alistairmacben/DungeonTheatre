// The eight value operations and the deterministic order in which they combine.
//
// Stage order, fixed and asserted by tests:
//   0 suppress  (removes modifiers from the whole pipeline, all channels)
//   1 gate      (each modifier's situational predicate)
//   2 base      highest wins
//   3 add       sum, after stackKey dedup
//   4 multiply  product, or single-highest where the path declares it
//   5 set       highest priority wins
//   6 clamp     min floors, max ceilings
//   7 replace   highest priority wins, overrides everything
//   8 round     per the path's declared rounding
//
// Every discarded modifier survives into the breakdown with a reason. That is
// the whole point: a HUD that cannot say *why* a number is what it is degrades
// into a spreadsheet.

import type {
  Modifier, Provenance, RoundingMode, StatPath, Term, MultiplyComposition,
  SuppressionTarget, RollOp, ValueOp
} from './types.js'

export interface ModifierEntry {
  modifier: Modifier
  sourceId: string
  sourceName: string
  provenance: Provenance
  /** Whether the modifier's own `condition` predicate passed. */
  gatePassed: boolean
  gateReason: string
  /** True when the owning source has completeness 'partial'. */
  incomplete: boolean
}

// ---------------------------------------------------------------------------
// Stage 0 — suppression
// ---------------------------------------------------------------------------

export interface Suppression {
  by: ModifierEntry
  target: SuppressionTarget
}

export interface SuppressionSet {
  /** Returns the suppressing entry, or undefined if the modifier survives. */
  find(entry: ModifierEntry): ModifierEntry | undefined
  all: Suppression[]
}

function matchesSuppression(target: SuppressionTarget, entry: ModifierEntry): boolean {
  const m = entry.modifier
  // An empty target matches nothing — content must say what it suppresses.
  let constrained = false

  if (target.tags && target.tags.length > 0) {
    constrained = true
    const tags = m.tags ?? []
    if (!target.tags.some((t) => tags.includes(t))) return false
  }
  if (target.sourceIds && target.sourceIds.length > 0) {
    constrained = true
    if (!target.sourceIds.includes(entry.sourceId)) return false
  }
  if (target.ops && target.ops.length > 0) {
    constrained = true
    const op = (m.op ?? m.rollOp) as ValueOp | RollOp | undefined
    if (!op || !target.ops.includes(op)) return false
  }
  if (target.paths && target.paths.length > 0) {
    constrained = true
    if (!m.target || !target.paths.includes(m.target)) return false
  }
  return constrained
}

/**
 * Built once per resolution over every active modifier in every channel, so a
 * value-channel `suppress` can remove a roll-channel disadvantage — which is
 * exactly what mithral armour does to half plate's Stealth penalty.
 */
export function collectSuppressions(entries: ModifierEntry[]): SuppressionSet {
  const all: Suppression[] = []
  for (const e of entries) {
    if (e.modifier.channel !== 'value' || e.modifier.op !== 'suppress') continue
    if (!e.gatePassed) continue
    if (!e.modifier.suppresses) continue
    all.push({ by: e, target: e.modifier.suppresses })
  }

  return {
    all,
    find(entry) {
      if (entry.modifier.op === 'suppress') return undefined // no recursive suppression
      for (const s of all) {
        if (s.by === entry) continue
        if (matchesSuppression(s.target, entry)) return s.by
      }
      return undefined
    }
  }
}

// ---------------------------------------------------------------------------
// Rounding
// ---------------------------------------------------------------------------

export function applyRounding(value: number, mode: RoundingMode): number {
  switch (mode) {
    case 'floor': return Math.floor(value)
    case 'ceil': return Math.ceil(value)
    case 'round': return Math.round(value)
    case 'none': return value
  }
}

// ---------------------------------------------------------------------------
// The value pipeline
// ---------------------------------------------------------------------------

export interface ValuePipelineInput {
  path: StatPath
  entries: ModifierEntry[]
  suppressions: SuppressionSet
  intrinsicBase?: number
  /** Pre-computed value for paths that derive from other paths. */
  computed?: number
  rounding: RoundingMode
  multiplyComposition: MultiplyComposition
  /** Resolved from another stat path (ability score cap), not a modifier. */
  externalMax?: { value: number; sourceId: string; sourceName: string }
}

export interface ValuePipelineResult {
  total: number
  terms: Term[]
  incomplete: boolean
}

function numericValue(m: Modifier): number {
  const v = m.value
  if (typeof v === 'number') return v
  // Dice-valued modifiers contribute their average to a derived stat; the dice
  // themselves are carried separately on rolls, where they are actually thrown.
  if (v && typeof v === 'object') {
    return v.count * ((v.sides + 1) / 2) + (v.modifier ?? 0)
  }
  return 0
}

function term(
  e: ModifierEntry,
  stage: Term['stage'],
  applied: boolean,
  reason?: string,
  valueOverride?: number
): Term {
  return {
    sourceId: e.sourceId,
    sourceName: e.sourceName,
    provenance: e.provenance,
    op: (e.modifier.op ?? e.modifier.rollOp ?? e.modifier.capOp ?? 'compute') as Term['op'],
    value: valueOverride ?? numericValue(e.modifier),
    applied,
    ...(reason ? { reason } : {}),
    stage,
    ...(e.modifier.note ? { note: e.modifier.note } : {})
  }
}

export function applyValuePipeline(input: ValuePipelineInput): ValuePipelineResult {
  const terms: Term[] = []
  let incomplete = false

  // ---- stage 0/1: suppression and gating -----------------------------------
  const live: ModifierEntry[] = []
  for (const e of input.entries) {
    if (e.modifier.channel !== 'value') continue
    if (e.modifier.target !== input.path && e.modifier.op !== 'suppress') continue
    if (e.incomplete) incomplete = true

    if (e.modifier.op === 'suppress') continue // acts on others, contributes no value

    const suppressedBy = input.suppressions.find(e)
    if (suppressedBy) {
      terms.push(term(e, 'suppressed', false,
        `suppressed by ${suppressedBy.sourceName}`))
      continue
    }
    if (!e.gatePassed) {
      terms.push(term(e, stageOf(e.modifier.op!), false, e.gateReason))
      continue
    }
    live.push(e)
  }

  const of = (op: ValueOp) => live.filter((e) => e.modifier.op === op)

  // ---- stage 2: base — highest wins ---------------------------------------
  let value: number
  const bases = of('base')
  if (bases.length > 0) {
    let winner = bases[0]!
    for (const e of bases) {
      if (numericValue(e.modifier) > numericValue(winner.modifier)) winner = e
    }
    for (const e of bases) {
      if (e === winner) terms.push(term(e, 'base', true))
      else {
        terms.push(term(e, 'base', false,
          `lower base than ${winner.sourceName} (${numericValue(winner.modifier)})`))
      }
    }
    value = numericValue(winner.modifier)
  } else if (input.computed !== undefined) {
    value = input.computed
    terms.push({
      sourceId: 'system:computed', sourceName: input.path, provenance: 'system',
      op: 'compute', value, applied: true, stage: 'compute'
    })
  } else {
    value = input.intrinsicBase ?? 0
    if (input.intrinsicBase !== undefined) {
      terms.push({
        sourceId: 'system:intrinsic', sourceName: 'base value', provenance: 'system',
        op: 'base', value, applied: true, stage: 'base'
      })
    }
  }

  // ---- stage 3: add — sum after stackKey dedup -----------------------------
  const adds = of('add')
  const bestByStackKey = new Map<string, ModifierEntry>()
  for (const e of adds) {
    const key = e.modifier.stackKey
    if (!key) continue
    const cur = bestByStackKey.get(key)
    if (!cur || numericValue(e.modifier) > numericValue(cur.modifier)) bestByStackKey.set(key, e)
  }
  for (const e of adds) {
    const key = e.modifier.stackKey
    if (key && bestByStackKey.get(key) !== e) {
      const winner = bestByStackKey.get(key)!
      terms.push(term(e, 'add', false,
        `does not stack with ${winner.sourceName} (same effect "${key}")`))
      continue
    }
    value += numericValue(e.modifier)
    terms.push(term(e, 'add', true))
  }

  // ---- stage 4: multiply ---------------------------------------------------
  const multiplies = of('multiply')
  if (multiplies.length > 0) {
    if (input.multiplyComposition === 'single-highest') {
      let winner = multiplies[0]!
      for (const e of multiplies) {
        if (numericValue(e.modifier) > numericValue(winner.modifier)) winner = e
      }
      for (const e of multiplies) {
        if (e === winner) {
          value *= numericValue(e.modifier)
          terms.push(term(e, 'multiply', true))
        } else {
          terms.push(term(e, 'multiply', false,
            `${input.path} multiplies only once; ${winner.sourceName} is higher`))
        }
      }
    } else {
      for (const e of multiplies) {
        value *= numericValue(e.modifier)
        terms.push(term(e, 'multiply', true))
      }
    }
  }

  // ---- stage 5: set — highest priority wins --------------------------------
  const sets = of('set')
  if (sets.length > 0) {
    let winner = sets[0]!
    for (const e of sets) {
      const p = e.modifier.priority ?? 0
      const wp = winner.modifier.priority ?? 0
      if (p > wp) winner = e
    }
    for (const e of sets) {
      if (e === winner) {
        value = numericValue(e.modifier)
        terms.push(term(e, 'set', true))
      } else {
        terms.push(term(e, 'set', false, `overridden by ${winner.sourceName} (higher priority)`))
      }
    }
  }

  // ---- stage 6: clamp ------------------------------------------------------
  for (const e of of('min')) {
    const floor = numericValue(e.modifier)
    if (value < floor) {
      value = floor
      terms.push(term(e, 'clamp', true, undefined, floor))
    } else {
      terms.push(term(e, 'clamp', false, `value ${value} already at or above the floor ${floor}`, floor))
    }
  }
  for (const e of of('max')) {
    const ceiling = numericValue(e.modifier)
    if (value > ceiling) {
      value = ceiling
      terms.push(term(e, 'clamp', true, undefined, ceiling))
    } else {
      terms.push(term(e, 'clamp', false, `value ${value} already at or below the ceiling ${ceiling}`, ceiling))
    }
  }
  if (input.externalMax) {
    const { value: ceiling, sourceId, sourceName } = input.externalMax
    const applied = value > ceiling
    if (applied) value = ceiling
    terms.push({
      sourceId, sourceName, provenance: 'system', op: 'max', value: ceiling,
      applied, stage: 'clamp',
      ...(applied ? {} : { reason: `value is at or below the cap ${ceiling}` })
    })
  }

  // ---- stage 7: replace ----------------------------------------------------
  const replaces = of('replace')
  if (replaces.length > 0) {
    let winner = replaces[0]!
    for (const e of replaces) {
      if ((e.modifier.priority ?? 0) > (winner.modifier.priority ?? 0)) winner = e
    }
    for (const e of replaces) {
      if (e === winner) {
        value = numericValue(e.modifier)
        terms.push(term(e, 'replace', true))
      } else {
        terms.push(term(e, 'replace', false, `overridden by ${winner.sourceName} (higher priority)`))
      }
    }
  }

  // ---- stage 8: rounding ---------------------------------------------------
  const total = applyRounding(value, input.rounding)

  return { total, terms: sortTerms(terms), incomplete }
}

const STAGE_ORDER: Record<Term['stage'], number> = {
  compute: 0, base: 1, proficiency: 2, add: 3, multiply: 4,
  set: 5, clamp: 6, replace: 7, suppressed: 8
}

/** Stable ordering so identical inputs always produce identical output. */
export function sortTerms(terms: Term[]): Term[] {
  return [...terms].sort((a, b) => {
    const s = STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage]
    if (s !== 0) return s
    if (a.applied !== b.applied) return a.applied ? -1 : 1
    return a.sourceId < b.sourceId ? -1 : a.sourceId > b.sourceId ? 1 : 0
  })
}

function stageOf(op: ValueOp): Term['stage'] {
  switch (op) {
    case 'base': return 'base'
    case 'add': return 'add'
    case 'multiply': return 'multiply'
    case 'set': return 'set'
    case 'min':
    case 'max': return 'clamp'
    case 'replace': return 'replace'
    case 'suppress': return 'suppressed'
  }
}
