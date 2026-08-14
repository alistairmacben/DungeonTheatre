// The conditions, expressed in the common vocabulary.
//
// Source: docs/srd/11-conditions.md, now complete — the earlier print's page
// breaks lost Charmed, Poisoned, Unconscious and part of Invisible, and the
// supplied replacement text defines all four. Nothing here is inferred.
//
// These are the reference content set for the engine: the smallest body of real
// content that exercises every channel — value, roll and capability — and proof
// that a condition affects a character through exactly the same EffectSource
// path as a weapon, a feat or a DM-authored item.

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

/**
 * "Attack rolls against the creature have advantage" lives on the *defender*
 * and is picked up by the attacker's roll resolution. Without `appliesTo` every
 * such clause would need the attacker to know each condition by name.
 */
const attackersAgainstSelf = (rollOp: 'advantage' | 'disadvantage', note: string): Modifier => ({
  id: mid(), channel: 'roll', rollOp,
  scope: { kinds: ['attack'] },
  appliesTo: 'attackersAgainstSelf',
  permanence: 'temporary',
  note
})

function condition(
  id: string,
  name: string,
  modifiers: Modifier[],
  opts: {
    implies?: string[]
    narrative?: EffectSource['narrative']
  } = {}
): ConditionDefinition {
  const effects: EffectSource = {
    id, name, provenance: 'srd', contentVersion: 1,
    sourceRef: 'D&D 5E conditions (2014-style), supplied reference text',
    kind: 'condition',
    activation: { always: true },
    modifiers,
    completeness: 'complete',
    ...(opts.narrative ? { narrative: opts.narrative } : {})
  }
  return {
    id, name, provenance: 'srd', contentVersion: 1, effects,
    ...(opts.implies ? { implies: opts.implies } : {})
  }
}

// ---------------------------------------------------------------------------

export const BLINDED = condition('srd:condition.blinded', 'Blinded', [
  revoke('see'),
  autoFail({ kinds: ['check'], requiresSenses: ['sight'] },
    'automatically fails ability checks that require sight'),
  disadvantage({ kinds: ['attack'] }),
  attackersAgainstSelf('advantage', 'attack rolls against a blinded creature have advantage')
])

export const CHARMED = condition('srd:condition.charmed', 'Charmed', [
  // The charmer gets advantage on social checks against the charmed creature.
  // Modelled on the charmed creature, target-relative, so the charmer's own
  // resolution picks it up the same way an attacker picks up advantage.
  {
    id: mid(), channel: 'roll', rollOp: 'advantage',
    scope: { kinds: ['check'], activityTags: ['social'] },
    appliesTo: 'attackersAgainstSelf',
    permanence: 'temporary',
    note: 'the charmer has advantage on ability checks to interact socially with this creature'
  }
], {
  narrative: [{
    text: 'The creature cannot attack the charmer, and cannot target the charmer '
      + 'with harmful abilities or magical effects. Enforcing this requires '
      + 'knowing who the charmer is and what is being targeted, which is a '
      + 'targeting-time decision rather than a stat.',
    dmPromptable: true
  }]
})

export const DEAFENED = condition('srd:condition.deafened', 'Deafened', [
  revoke('hear'),
  autoFail({ kinds: ['check'], requiresSenses: ['hearing'] },
    'automatically fails ability checks that require hearing')
])

export const FRIGHTENED = condition('srd:condition.frightened', 'Frightened', [
  // Both are gated on the source of fear being in line of sight, which is a
  // spatial fact the engine does not model — so it is a toggle, visible in
  // every breakdown, rather than an invented rule.
  {
    ...disadvantage({ kinds: ['check'] }, 'while the source of fear is in line of sight'),
    condition: { playerToggle: 'frightened.sourceInSight' }
  },
  {
    ...disadvantage({ kinds: ['attack'] }, 'while the source of fear is in line of sight'),
    condition: { playerToggle: 'frightened.sourceInSight' }
  }
], {
  narrative: [{
    text: 'The creature cannot willingly move closer to the source of its fear.',
    dmPromptable: true
  }]
})

const speedZeroAndNoBonuses = (label: string): Modifier[] => [
  { id: mid(), channel: 'value', target: speedPath('walk'), op: 'set', value: 0, permanence: 'temporary' },
  // "Cannot benefit from bonuses to speed" is a suppression scoped to the stat,
  // distinct from setting it to 0. Both are stated, so both exist.
  {
    id: mid(), channel: 'value', op: 'suppress', permanence: 'temporary',
    suppresses: { paths: [speedPath('walk')], ops: ['add', 'multiply'] },
    note: `${label}: cannot benefit from bonuses to speed`
  },
  revoke('benefitFromSpeedBonus')
]

export const GRAPPLED = condition('srd:condition.grappled', 'Grappled',
  speedZeroAndNoBonuses('grappled'), {
  narrative: [{
    text: 'Ends when the grappler becomes incapacitated, or when an effect '
      + 'removes the grappled creature from the grappler\'s reach or from the '
      + 'grappling effect.',
    dmPromptable: true
  }]
})

export const INCAPACITATED = condition('srd:condition.incapacitated', 'Incapacitated', [
  revoke('takeActions'),
  revoke('takeReactions')
])

export const INVISIBLE = condition('srd:condition.invisible', 'Invisible', [
  attackersAgainstSelf('disadvantage', 'attack rolls against an invisible creature have disadvantage'),
  {
    id: mid(), channel: 'roll', rollOp: 'advantage', scope: { kinds: ['attack'] },
    permanence: 'temporary', note: 'an invisible creature has advantage on its attack rolls'
  }
], {
  narrative: [{
    text: 'Cannot be seen without magic or a special sense. Counts as heavily '
      + 'obscured for hiding. Its location can still be detected by noises it '
      + 'makes or tracks it leaves.',
    dmPromptable: true
  }]
})

export const PARALYZED = condition('srd:condition.paralyzed', 'Paralyzed', [
  revoke('move'),
  revoke('speak'),
  autoFail({ kinds: ['save'], abilities: ['str'] }),
  autoFail({ kinds: ['save'], abilities: ['dex'] }),
  attackersAgainstSelf('advantage', 'attack rolls against a paralyzed creature have advantage'),
  // "Any attack that hits is a critical hit if the attacker is within 5 feet."
  // Distance is a targeting-time fact, so the modifier is real and present but
  // gated on the attacker declaring melee range.
  {
    id: mid(), channel: 'roll', rollOp: 'autoCritical',
    scope: { kinds: ['attack'], activityTags: ['within-5-feet'] },
    appliesTo: 'attackersAgainstSelf',
    permanence: 'temporary',
    note: 'a hit from within 5 feet is a critical hit'
  }
], { implies: ['srd:condition.incapacitated'] })

export const PETRIFIED = condition('srd:condition.petrified', 'Petrified', [
  revoke('move'),
  revoke('speak'),
  revoke('ageNormally'),
  autoFail({ kinds: ['save'], abilities: ['str'] }),
  autoFail({ kinds: ['save'], abilities: ['dex'] }),
  attackersAgainstSelf('advantage', 'attack rolls against a petrified creature have advantage'),
  // Resistance to all damage, and immunity to poison, are resistance-path
  // values consumed by the damage pipeline — not bespoke condition logic.
  { id: mid(), channel: 'value', target: 'resistance.all', op: 'set', value: 1, permanence: 'temporary', note: 'resistance to all damage' },
  { id: mid(), channel: 'value', target: 'resistance.poison', op: 'set', value: 2, priority: 5, permanence: 'temporary', note: 'immune to poison' }
], {
  implies: ['srd:condition.incapacitated'],
  narrative: [{
    text: 'Transformed with nonmagical worn or carried objects into a solid '
      + 'inanimate substance. Weight increases tenfold and it ceases aging. '
      + 'Unaware of its surroundings. Immune to disease; a poison or disease '
      + 'already in its system is suspended rather than neutralized.',
    dmPromptable: false
  }]
})

export const POISONED = condition('srd:condition.poisoned', 'Poisoned', [
  disadvantage({ kinds: ['attack'] }),
  disadvantage({ kinds: ['check'] })
])

export const PRONE = condition('srd:condition.prone', 'Prone', [
  disadvantage({ kinds: ['attack'] }),
  // Advantage within 5 feet, disadvantage beyond. Distance is declared by the
  // attacker at targeting time, so both are present and mutually exclusive
  // rather than one being silently chosen.
  {
    ...attackersAgainstSelf('advantage', 'attackers within 5 feet have advantage'),
    scope: { kinds: ['attack'], activityTags: ['within-5-feet'] }
  },
  {
    ...attackersAgainstSelf('disadvantage', 'attackers more than 5 feet away have disadvantage'),
    scope: { kinds: ['attack'], activityTags: ['beyond-5-feet'] }
  }
], {
  narrative: [{
    text: 'The only movement option is crawling, unless the creature stands up '
      + 'and thereby ends the condition.',
    dmPromptable: true
  }]
})

export const RESTRAINED = condition('srd:condition.restrained', 'Restrained', [
  ...speedZeroAndNoBonuses('restrained'),
  disadvantage({ kinds: ['attack'] }),
  disadvantage({ kinds: ['save'], abilities: ['dex'] }),
  attackersAgainstSelf('advantage', 'attack rolls against a restrained creature have advantage')
])

export const STUNNED = condition('srd:condition.stunned', 'Stunned', [
  revoke('move'),
  autoFail({ kinds: ['save'], abilities: ['str'] }),
  autoFail({ kinds: ['save'], abilities: ['dex'] }),
  attackersAgainstSelf('advantage', 'attack rolls against a stunned creature have advantage')
], {
  implies: ['srd:condition.incapacitated'],
  narrative: [{ text: 'The creature can speak only falteringly.', dmPromptable: false }]
})

export const UNCONSCIOUS = condition('srd:condition.unconscious', 'Unconscious', [
  revoke('move'),
  revoke('speak'),
  autoFail({ kinds: ['save'], abilities: ['str'] }),
  autoFail({ kinds: ['save'], abilities: ['dex'] }),
  attackersAgainstSelf('advantage', 'attack rolls against an unconscious creature have advantage'),
  {
    id: mid(), channel: 'roll', rollOp: 'autoCritical',
    scope: { kinds: ['attack'], activityTags: ['within-5-feet'] },
    appliesTo: 'attackersAgainstSelf',
    permanence: 'temporary',
    note: 'a hit from within 5 feet is a critical hit'
  }
], {
  implies: ['srd:condition.incapacitated', 'srd:condition.prone'],
  narrative: [{
    text: 'Unaware of its surroundings. Drops whatever it is holding and falls prone.',
    dmPromptable: true
  }]
})

// --- exhaustion ------------------------------------------------------------

/**
 * Exhaustion is a level rather than a set of instances, and its effects are
 * cumulative: a creature suffers its current level and all lower ones. That is
 * why the source is assembled from levels 1..n instead of being declared.
 */
export function exhaustionSource(level: number): EffectSource | undefined {
  if (level < 1) return undefined
  const capped = Math.min(level, 6)
  const modifiers: Modifier[] = []

  if (capped >= 1) {
    modifiers.push({
      id: 'exhaustion-1', channel: 'roll', rollOp: 'disadvantage',
      scope: { kinds: ['check'] }, permanence: 'temporary',
      note: 'exhaustion 1: disadvantage on ability checks'
    })
  }
  if (capped >= 2) {
    modifiers.push({
      id: 'exhaustion-2', channel: 'value', target: speedPath('walk'),
      op: 'multiply', value: 0.5, permanence: 'temporary',
      note: 'exhaustion 2: speed halved'
    })
  }
  if (capped >= 3) {
    modifiers.push({
      id: 'exhaustion-3a', channel: 'roll', rollOp: 'disadvantage',
      scope: { kinds: ['attack'] }, permanence: 'temporary',
      note: 'exhaustion 3: disadvantage on attack rolls'
    })
    modifiers.push({
      id: 'exhaustion-3b', channel: 'roll', rollOp: 'disadvantage',
      scope: { kinds: ['save'] }, permanence: 'temporary',
      note: 'exhaustion 3: disadvantage on saving throws'
    })
  }
  if (capped >= 4) {
    modifiers.push({
      id: 'exhaustion-4', channel: 'value', target: 'hitPoints.max',
      op: 'multiply', value: 0.5, permanence: 'temporary',
      note: 'exhaustion 4: hit point maximum halved'
    })
  }
  if (capped >= 5) {
    modifiers.push({
      id: 'exhaustion-5', channel: 'value', target: speedPath('walk'),
      op: 'set', value: 0, priority: 10, permanence: 'temporary',
      note: 'exhaustion 5: speed reduced to 0'
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
      ? { narrative: [{ text: 'Exhaustion 6: death.', dmPromptable: false }] }
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
