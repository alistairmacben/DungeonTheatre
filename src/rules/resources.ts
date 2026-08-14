// The generic resource primitive.
//
// One shape for spell slots, sorcery points, rage, ki, superiority dice, luck
// points, ammunition, item charges and limited-use abilities. The distinction
// that matters is DEFINITION (what the resource is, and how big it gets) versus
// STATE (how much of it has been spent), because the maximum is derived from
// character progression and must never be stored.

import type { RefreshRule, ResourceDefinition, Term } from './types.js'
import type { Resolution } from './resolve.js'

export interface ResourceValue {
  id: string
  name: string
  maximum: number
  spent: number
  remaining: number
  refresh: RefreshRule
  sourceId: string
  sourceName: string
  /** How the maximum was arrived at. */
  terms: Term[]
}

/** Every resource the character currently has, with its live maximum. */
export function resolveResources(resolution: Resolution): ResourceValue[] {
  const out: ResourceValue[] = []
  for (const source of resolution.sources.active) {
    for (const def of source.resources ?? []) {
      out.push(resolveResource(resolution, source.id, source.name, def))
    }
  }
  return out
}

export function resolveResource(
  resolution: Resolution,
  sourceId: string,
  sourceName: string,
  def: ResourceDefinition
): ResourceValue {
  const terms: Term[] = []
  let maximum: number

  if (typeof def.max === 'number') {
    maximum = def.max
    terms.push({
      sourceId, sourceName, provenance: 'system',
      op: 'base', value: maximum, applied: true, stage: 'base'
    })
  } else {
    // The maximum is a stat path, so it is derived and explainable like any
    // other number — a warlock's slots follow their level without being stored.
    const stat = resolution.stat(def.max)
    maximum = stat.total
    terms.push(...stat.terms)
  }

  const spent = resolution.character.resourcesSpent[def.id] ?? 0
  return {
    id: def.id,
    name: def.name,
    maximum,
    spent,
    remaining: Math.max(0, maximum - spent),
    refresh: def.refresh,
    sourceId,
    sourceName,
    terms
  }
}

/**
 * How much of a resource a rest restores. Returns the new spent value, so the
 * authority applies it as a state transition and the resolver stays pure.
 */
export function applyRest(
  value: ResourceValue,
  rest: 'short' | 'long'
): { spent: number; restored: number; note: string } {
  const r = value.refresh
  const full = () => ({ spent: 0, restored: value.spent, note: `${value.name} fully restored` })
  const none = () => ({ spent: value.spent, restored: 0, note: `${value.name} does not refresh on a ${rest} rest` })

  switch (r.kind) {
    case 'shortRest':
      return full()
    case 'longRest':
      return rest === 'long' ? full() : none()
    case 'longRestFraction': {
      if (rest !== 'long') return none()
      // Hit Dice: you regain half your total, minimum one — not all of them.
      const back = Math.max(r.minimum, Math.floor(value.maximum * r.numerator / r.denominator))
      const restored = Math.min(back, value.spent)
      return {
        spent: value.spent - restored,
        restored,
        note: `${value.name}: regained ${restored} of ${value.spent} spent`
      }
    }
    default:
      return none()
  }
}
