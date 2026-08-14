// The conditions, expressed in the common vocabulary.
//
// Source: docs/srd/11-conditions.md — the appendix supplied as conditions.pdf.
// Nothing here is inferred. Four conditions lost text to the print's page
// breaks; they are marked `completeness: 'partial'` and carry a narrative
// clause naming what is missing, rather than being filled in from memory.
//
// These are the reference content set for the foundation: they are the smallest
// body of real content that exercises every channel — value, roll and
// capability — and they prove a condition affects a character through exactly
// the same EffectSource path as a weapon or a DM-authored item.

import type { ConditionDefinition, EffectSource, Modifier } from './types.js'
import { speedPath } from './statPaths.js'

let counter = 0
const mid = (): string => `cond-mod-${++counter}`

const revoke = (capability: Modifier['capability']): Modifier => ({
  id: mid(), channel: 'capability', capability, capOp: 'revoke', permanence: 'temporary'
})

const disadvantage = (scope: Modifier['scope'], note?: string): Modifier => ({
  id: mid(), channel: 'roll', rollOp: 'disadvantage', scope, permanence: 'temporary',
  ...(note ? { note } : {})
})

const autoFail = (scope: Modifier['scope'], note?: string): Modifier => ({
  id: mid(), channel: 'roll', rollOp: 'autoFail', scope, permanence: 'temporary',
  ...(note ? { note } : {})
})

function source(
  id: string,
  name: string,
  modifiers: Modifier[],
  completeness: EffectSource['completeness'] = 'complete',
  narrative?: EffectSource['narrative']
): EffectSource {
  return {
    id, name, provenance: 'srd', contentVersion: 1,
    sourceRef: 'SRD conditions appendix',
    kind: 'condition',
    activation: { always: true },
    modifiers,
    completeness,
    ...(narrative ? { narrative } : {})
  }
}

function condition(
  id: string,
  name: string,
  modifiers: Modifier[],
  opts: { implies?: string[]; completeness?: EffectSource['completeness']; narrative?: EffectSource['narrative'] } = {}
): ConditionDefinition {
  return {
    id, name, provenance: 'srd', contentVersion: 1,
    effects: source(id, name, modifiers, opts.completeness ?? 'complete', opts.narrative),
    ...(opts.implies ? { implies: opts.implies } : {})
  }
}

// Note on modelling: "attack rolls against the creature have advantage" is a
// property of rolls made *by others against this creature*, not of this
// character's own rolls. It is recorded here as a modifier tagged
// `against-self` so the attacker's roll resolution can pick it up from the
// target's resolution. The foundation stores it faithfully; wiring the
// attacker-side lookup belongs to the action pipeline, not to this layer.
const grantsAdvantageToAttackers = (): Modifier => ({
  id: mid(), channel: 'roll', rollOp: 'advantage',
  scope: { kinds: ['attack'] },
  tags: ['against-self'],
  permanence: 'temporary',
  note: 'attack rolls against this creature have advantage'
})

const grantsDisadvantageToAttackers = (): Modifier => ({
  id: mid(), channel: 'roll', rollOp: 'disadvantage',
  scope: { kinds: ['attack'] },
  tags: ['against-self'],
  permanence: 'temporary',
  note: 'attack rolls against this creature have disadvantage'
})

// ---------------------------------------------------------------------------

export const BLINDED = condition('srd:condition.blinded', 'Blinded', [
  revoke('see'),
  autoFail({ kinds: ['check'], requiresSenses: ['sight'] },
    'automatically fails any ability check that requires sight'),
  disadvantage({ kinds: ['attack'] }),
  grantsAdvantageToAttackers()
])

export const DEAFENED = condition('srd:condition.deafened', 'Deafened', [
  revoke('hear'),
  autoFail({ kinds: ['check'], requiresSenses: ['hearing'] },
    'automatically fails any ability check that requires hearing')
])

export const FRIGHTENED = condition('srd:condition.frightened', 'Frightened', [
  // Both are gated on the source of fear being in line of sight, which is a
  // spatial fact the foundation does not model — so it is a toggle, visible in
  // every breakdown, rather than an invented rule.
  {
    ...disadvantage({ kinds: ['check'] }, 'while the source of its fear is in line of sight'),
    condition: { playerToggle: 'frightened.sourceInSight' }
  },
  {
    ...disadvantage({ kinds: ['attack'] }, 'while the source of its fear is in line of sight'),
    condition: { playerToggle: 'frightened.sourceInSight' }
  }
], {
  narrative: [{
    text: "The creature can't willingly move closer to the source of its fear.",
    dmPromptable: true
  }]
})

export const GRAPPLED = condition('srd:condition.grappled', 'Grappled', [
  { id: mid(), channel: 'value', target: speedPath('walk'), op: 'set', value: 0, permanence: 'temporary' },
  // "and it can't benefit from any bonus to its speed" — a suppression scoped
  // to the stat, distinct from setting it to 0. Both are stated, so both exist.
  {
    id: mid(), channel: 'value', op: 'suppress', permanence: 'temporary',
    suppresses: { paths: [speedPath('walk')], ops: ['add', 'multiply'] },
    note: "can't benefit from any bonus to its speed"
  },
  revoke('benefitFromSpeedBonus')
], {
  narrative: [{
    text: 'Ends if the grappler is incapacitated, or if an effect removes the '
      + 'grappled creature from the reach of the grappler or grappling effect.',
    dmPromptable: true
  }]
})

export const INCAPACITATED = condition('srd:condition.incapacitated', 'Incapacitated', [
  revoke('takeActions'),
  revoke('takeReactions'),
  revoke('takeBonusActions')
])

export const PARALYZED = condition('srd:condition.paralyzed', 'Paralyzed', [
  revoke('move'),
  revoke('speak'),
  autoFail({ kinds: ['save'], abilities: ['str'] }),
  autoFail({ kinds: ['save'], abilities: ['dex'] }),
  grantsAdvantageToAttackers()
], {
  implies: ['srd:condition.incapacitated'],
  narrative: [{
    text: 'Any attack that hits the creature is a critical hit if the attacker '
      + 'is within 5 feet of the creature.',
    dmPromptable: true
  }]
})

export const PETRIFIED = condition('srd:condition.petrified', 'Petrified', [
  revoke('move'),
  revoke('speak'),
  revoke('ageNormally'),
  autoFail({ kinds: ['save'], abilities: ['str'] }),
  autoFail({ kinds: ['save'], abilities: ['dex'] }),
  grantsAdvantageToAttackers()
  // "Resistance to all damage" and "immune to poison and disease" are recorded
  // on the resistance paths by the damage pipeline's resistance table rather
  // than as stat modifiers; see damage.ts.
], {
  implies: ['srd:condition.incapacitated'],
  narrative: [
    {
      text: 'Weight increases by a factor of ten and the creature ceases aging. '
        + 'Resistance to all damage. Immune to poison and disease, although a '
        + 'poison or disease already in its system is suspended, not neutralized.',
      dmPromptable: false
    }
  ]
})

export const PRONE = condition('srd:condition.prone', 'Prone', [
  disadvantage({ kinds: ['attack'] }),
  // "Advantage if the attacker is within 5 feet, otherwise disadvantage" is a
  // distance-dependent pair. Distance is not modelled at this layer, so both
  // are recorded with their condition stated and neither is silently chosen.
  {
    ...grantsAdvantageToAttackers(),
    note: 'attack rolls against this creature have advantage if the attacker is within 5 feet'
  },
  {
    ...grantsDisadvantageToAttackers(),
    note: 'attack rolls against this creature have disadvantage beyond 5 feet'
  }
], {
  narrative: [{
    text: "The creature's only movement option is to crawl, unless it stands up "
      + 'and thereby ends the condition.',
    dmPromptable: true
  }]
})

export const RESTRAINED = condition('srd:condition.restrained', 'Restrained', [
  { id: mid(), channel: 'value', target: speedPath('walk'), op: 'set', value: 0, permanence: 'temporary' },
  {
    id: mid(), channel: 'value', op: 'suppress', permanence: 'temporary',
    suppresses: { paths: [speedPath('walk')], ops: ['add', 'multiply'] },
    note: "can't benefit from any bonus to its speed"
  },
  revoke('benefitFromSpeedBonus'),
  disadvantage({ kinds: ['attack'] }),
  disadvantage({ kinds: ['save'], abilities: ['dex'] }),
  grantsAdvantageToAttackers()
])

export const STUNNED = condition('srd:condition.stunned', 'Stunned', [
  revoke('move'),
  autoFail({ kinds: ['save'], abilities: ['str'] }),
  autoFail({ kinds: ['save'], abilities: ['dex'] }),
  grantsAdvantageToAttackers()
], {
  implies: ['srd:condition.incapacitated'],
  narrative: [{ text: 'The creature can speak only falteringly.', dmPromptable: false }]
})

// --- the four the supplied print did not fully define ----------------------

const MISSING = (what: string) => [{
  text: `The supplied conditions appendix lost this condition's ${what} to a `
    + 'page break. The condition is tracked and reported, but its mechanical '
    + 'effects are not defined in the loaded content.',
  dmPromptable: true
}]

export const CHARMED = condition('srd:condition.charmed', 'Charmed', [], {
  completeness: 'partial',
  narrative: MISSING('rules text entirely')
})

export const POISONED = condition('srd:condition.poisoned', 'Poisoned', [], {
  completeness: 'partial',
  narrative: MISSING('rules text entirely')
})

export const INVISIBLE = condition('srd:condition.invisible', 'Invisible', [
  grantsDisadvantageToAttackers(),
  { id: mid(), channel: 'roll', rollOp: 'advantage', scope: { kinds: ['attack'] }, permanence: 'temporary' }
], {
  completeness: 'partial',
  narrative: [{
    text: 'Only the tail of the first bullet survived the supplied print: '
      + '"…heavily obscured. The creature\'s location can be detected by any '
      + 'noise it makes or any tracks it leaves." The opening clause, which '
      + 'establishes what makes the creature impossible to see, is missing.',
    dmPromptable: true
  }]
})

export const UNCONSCIOUS = condition('srd:condition.unconscious', 'Unconscious', [
  revoke('move'),
  revoke('speak')
], {
  implies: ['srd:condition.incapacitated', 'srd:condition.prone'],
  completeness: 'partial',
  narrative: [{
    text: 'Two bullets survived the supplied print: the creature is '
      + 'incapacitated, unaware of its surroundings, drops what it is holding '
      + 'and falls prone. The remaining bullets — covering saving throws and '
      + 'attacks against it — were lost to a page break.',
    dmPromptable: true
  }]
})

// --- exhaustion ------------------------------------------------------------

/**
 * Exhaustion is the one condition that is a level rather than a set of
 * instances, and its effects are cumulative: a creature at level 2 has both the
 * level 1 and level 2 effects. The source is assembled from levels 1..n, which
 * is why it is generated rather than declared.
 */
export function exhaustionSource(level: number): EffectSource | undefined {
  if (level < 1) return undefined
  const capped = Math.min(level, 6)
  const modifiers: Modifier[] = []

  if (capped >= 1) {
    modifiers.push({
      id: 'exhaustion-1', channel: 'roll', rollOp: 'disadvantage',
      scope: { kinds: ['check'] }, permanence: 'temporary', note: 'exhaustion level 1'
    })
  }
  if (capped >= 2) {
    modifiers.push({
      id: 'exhaustion-2', channel: 'value', target: speedPath('walk'),
      op: 'multiply', value: 0.5, permanence: 'temporary', note: 'exhaustion level 2: speed halved'
    })
  }
  if (capped >= 3) {
    modifiers.push({
      id: 'exhaustion-3a', channel: 'roll', rollOp: 'disadvantage',
      scope: { kinds: ['attack'] }, permanence: 'temporary', note: 'exhaustion level 3'
    })
    modifiers.push({
      id: 'exhaustion-3b', channel: 'roll', rollOp: 'disadvantage',
      scope: { kinds: ['save'] }, permanence: 'temporary', note: 'exhaustion level 3'
    })
  }
  if (capped >= 4) {
    modifiers.push({
      id: 'exhaustion-4', channel: 'value', target: 'hitPoints.max',
      op: 'multiply', value: 0.5, permanence: 'temporary',
      note: 'exhaustion level 4: hit point maximum halved'
    })
  }
  if (capped >= 5) {
    modifiers.push({
      id: 'exhaustion-5', channel: 'value', target: speedPath('walk'),
      op: 'set', value: 0, priority: 10, permanence: 'temporary',
      note: 'exhaustion level 5: speed reduced to 0'
    })
  }

  return {
    id: `system:exhaustion.${capped}`,
    name: `Exhaustion ${capped}`,
    provenance: 'system',
    contentVersion: 1,
    kind: 'condition',
    activation: { always: true },
    modifiers,
    completeness: 'complete',
    ...(capped >= 6
      ? { narrative: [{ text: 'Exhaustion level 6: death.', dmPromptable: false }] }
      : {})
  }
}

export const ALL_CONDITIONS: ConditionDefinition[] = [
  BLINDED, CHARMED, DEAFENED, FRIGHTENED, GRAPPLED, INCAPACITATED, INVISIBLE,
  PARALYZED, PETRIFIED, POISONED, PRONE, RESTRAINED, STUNNED, UNCONSCIOUS
]

export function conditionIndex(): Map<string, ConditionDefinition> {
  return new Map(ALL_CONDITIONS.map((c) => [c.id, c]))
}
