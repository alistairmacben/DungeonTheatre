// Roll resolution.
//
// Three stages, deliberately separated:
//   resolveRoll   pure — decides the dice and the modifiers, rolls nothing
//   (authority)   the only place randomness exists
//   applyOutcome  pure — turns faces into a result
//
// This is what lets the identical module run on the client for prediction and
// on the server for truth, and it is why every test here is deterministic.

import type {
  AdvantageState, DiceExpr, Modifier, RollOutcome, RollRequest,
  RollResolution, RollResult, RollScope, Term, StatPath
} from './types.js'
import type { Resolution } from './resolve.js'
import { scopeMatches } from './resolve.js'
import { sortTerms } from './operations.js'
import {
  abilityModifierPath, CRIT_RANGE, savePath, skillPath, PROFICIENCY_BONUS,
  rollTargetPath
} from './statPaths.js'


function requestScope(request: RollRequest): RollScope {
  const scope: RollScope = { kinds: [request.kind] }
  if (request.ability) scope.abilities = [request.ability]
  if (request.skill) scope.skills = [request.skill]
  if (request.tool) scope.tools = [request.tool]
  if (request.againstTags) scope.againstTags = request.againstTags
  if (request.targetTags) scope.targetTags = request.targetTags
  if (request.activityTags) scope.activityTags = request.activityTags
  if (request.requiresSenses) scope.requiresSenses = request.requiresSenses
  return scope
}

/**
 * Resolves everything about a roll except the randomness.
 *
 * Note the roll's modifier total is built from the ability modifier and the
 * proficiency term directly rather than from a precomputed `skill.<id>` stat,
 * because a check names its own ability: the SRD explicitly sanctions
 * Constitution (Athletics) and Strength (Intimidation), so the skill's usual
 * ability is a default and not a constraint.
 */
export function resolveRoll(resolution: Resolution, request: RollRequest): RollResolution {
  const scope = requestScope(request)
  const modifierTerms: Term[] = []
  const notes: string[] = []
  let modifierTotal = 0
  // A source whose rules text we do not have could affect anything, so its mere
  // presence flags the result rather than being silently under-reported.
  let incomplete = resolution.partialSources.length > 0

  // --- ability modifier -----------------------------------------------------
  if (request.ability && request.kind !== 'damage') {
    const path: StatPath = abilityModifierPath(request.ability)
    const v = resolution.stat(path)
    modifierTotal += v.total
    incomplete ||= v.incomplete
    modifierTerms.push({
      sourceId: path,
      sourceName: `${request.ability.toUpperCase()} modifier`,
      provenance: 'system',
      op: 'add', value: v.total, applied: true, stage: 'add'
    })
  }

  // --- proficiency ----------------------------------------------------------
  if (request.kind !== 'damage' && request.kind !== 'death') {
    const prof = resolution.proficiency(scope, request.proficiencyCategories)
    if (prof.term !== 0 || prof.terms.length > 0) {
      modifierTotal += prof.term
      modifierTerms.push({
        sourceId: PROFICIENCY_BONUS,
        sourceName: 'proficiency bonus',
        provenance: 'system',
        op: 'add', value: prof.term, applied: true, stage: 'proficiency',
        ...(prof.proficient
          ? { note: `PB × ${prof.multiplier}` }
          : { note: 'not proficient' })
      })
      modifierTerms.push(...prof.terms)
    }
  }

  // --- flat modifiers targeting the roll's own stat path --------------------
  // skill.<id> and save.<ability> accumulate their own modifiers (a cloak of
  // protection's +1 to saves, pass without trace's +10 to Stealth).
  const extraPath = request.kind === 'save' && request.ability
    ? savePath(request.ability)
    : request.skill
      ? skillPath(request.skill)
      : undefined
  if (extraPath) {
    const v = resolution.stat(extraPath)
    // The stat's own ability and proficiency contributions were added above, so
    // only modifiers explicitly targeting the path are taken here.
    for (const t of v.terms) {
      if (t.stage === 'compute' || t.sourceId === 'system:intrinsic') continue
      if (t.applied && typeof t.value === 'number' && t.stage === 'add') {
        modifierTotal += t.value
      }
      modifierTerms.push(t)
    }
    incomplete ||= v.incomplete
  }

  // --- roll-channel modifiers ----------------------------------------------
  const advantageSources: Term[] = []
  const disadvantageSources: Term[] = []
  const autoFail: Term[] = []
  const autoSucceed: Term[] = []
  const autoCritical: Term[] = []
  const rerollOn: number[] = []
  const pendingDice: RollResolution['pendingDice'] = []

  // Elected options and the other side's modifiers join the same list as the
  // character's own, so there is exactly one place where roll-channel effects
  // are interpreted.
  const extra: { modifier: Modifier; sourceId: string; sourceName: string; provenance: Term['provenance']; gatePassed: boolean; gateReason: string; incomplete: boolean }[] = []

  for (const source of resolution.sources.active) {
    for (const option of source.options ?? []) {
      if (!(request.electedOptions ?? []).includes(option.id)) continue
      if (option.scope && !scopeMatches(option.scope, scope)) continue
      for (const m of option.modifiers) {
        extra.push({
          modifier: m, sourceId: option.id, sourceName: `${source.name}: ${option.label}`,
          provenance: source.provenance, gatePassed: true, gateReason: '', incomplete: false
        })
      }
    }
  }

  for (const ext of request.externalModifiers ?? []) {
    extra.push({
      modifier: ext.modifier, sourceId: ext.sourceId, sourceName: ext.sourceName,
      provenance: ext.provenance, gatePassed: true, gateReason: '', incomplete: false
    })
  }

  // Flat value-channel modifiers carried by options apply to the roll total,
  // but only those aimed at this kind of roll — Great Weapon Master's -5 is on
  // attack.roll and its +10 is on damage.weapon, so the attack roll takes one
  // and the damage calculation takes the other.
  const rollPath = rollTargetPath(request.kind)
  for (const e of extra) {
    const m = e.modifier
    if (m.channel !== 'value' || m.op !== 'add') continue
    if (m.target !== rollPath) continue
    const value = resolution.evaluateValue(m.value)
    modifierTotal += value
    modifierTerms.push({
      sourceId: e.sourceId, sourceName: e.sourceName, provenance: e.provenance,
      op: 'add', value, applied: true, stage: 'add',
      ...(m.note ? { note: m.note } : {})
    })
  }

  for (const entry of [...resolution.entries, ...extra]) {
    const m = entry.modifier
    if (entry.incomplete) incomplete = true
    if (m.channel !== 'roll' || !m.rollOp) continue
    if (!scopeMatches(m.scope, scope)) continue

    const base: Term = {
      sourceId: entry.sourceId,
      sourceName: entry.sourceName,
      provenance: entry.provenance,
      op: m.rollOp,
      applied: true,
      stage: 'compute',
      ...(m.note ? { note: m.note } : {})
    }

    // A value-channel `suppress` can remove a roll-channel modifier. One
    // mechanism, both channels — no parallel suppression system.
    const suppressedBy = resolution.isSuppressed(entry as never)
    if (suppressedBy) {
      const removed = {
        ...base, applied: false, stage: 'suppressed' as const,
        reason: `suppressed by ${suppressedBy.sourceName}`
      }
      if (m.rollOp === 'advantage') advantageSources.push(removed)
      else if (m.rollOp === 'disadvantage') disadvantageSources.push(removed)
      continue
    }

    if (!entry.gatePassed) {
      const skipped = { ...base, applied: false, reason: entry.gateReason }
      if (m.rollOp === 'advantage') advantageSources.push(skipped)
      else if (m.rollOp === 'disadvantage') disadvantageSources.push(skipped)
      continue
    }

    switch (m.rollOp) {
      case 'advantage': advantageSources.push(base); break
      case 'disadvantage': disadvantageSources.push(base); break
      case 'autoFail': autoFail.push(base); break
      case 'autoSucceed': autoSucceed.push(base); break
      case 'autoCritical': autoCritical.push(base); break
      case 'reroll': if (typeof m.rollValue === 'number') rerollOn.push(m.rollValue); break
      case 'critRange': break // handled via the critRange stat path
      case 'replaceRoll': break
    }
  }

  if (request.dmAdvantage === 'advantage') {
    advantageSources.push({
      sourceId: 'dm', sourceName: 'DM ruling', provenance: 'system',
      op: 'advantage', applied: true, stage: 'compute'
    })
  } else if (request.dmAdvantage === 'disadvantage') {
    disadvantageSources.push({
      sourceId: 'dm', sourceName: 'DM ruling', provenance: 'system',
      op: 'disadvantage', applied: true, stage: 'compute'
    })
  }

  const advantage = reduceAdvantage(advantageSources, disadvantageSources)

  return {
    request,
    dice: {
      count: advantage === 'normal' ? 1 : 2,
      sides: 20,
      keep: advantage === 'advantage' ? 'highest' : advantage === 'disadvantage' ? 'lowest' : 'all'
    },
    modifierTotal,
    modifierTerms: sortTerms(modifierTerms),
    pendingDice,
    advantage,
    advantageSources: sortTerms(advantageSources),
    disadvantageSources: sortTerms(disadvantageSources),
    autoFail: sortTerms(autoFail),
    autoSucceed: sortTerms(autoSucceed),
    autoCritical: sortTerms(autoCritical),
    rerollOn: [...new Set(rerollOn)].sort((a, b) => a - b),
    critRange: resolution.stat(CRIT_RANGE).total,
    incomplete,
    notes
  }
}

/**
 * The tri-state reduction.
 *
 * Advantage never stacks — any number of sources still yields exactly one extra
 * d20 — and any advantage plus any disadvantage yields neither, "even if
 * multiple circumstances impose disadvantage and only one grants advantage".
 *
 * Cancelled sources are mutated in place to carry their reason, because a
 * player looking at the HUD needs to see *why* they are rolling flat.
 */
export function reduceAdvantage(advantageSources: Term[], disadvantageSources: Term[]): AdvantageState {
  const adv = advantageSources.filter((t) => t.applied)
  const dis = disadvantageSources.filter((t) => t.applied)

  if (adv.length > 0 && dis.length > 0) {
    const advNames = adv.map((t) => t.sourceName).join(', ')
    const disNames = dis.map((t) => t.sourceName).join(', ')
    for (const t of adv) { t.applied = false; t.reason = `cancelled by disadvantage from ${disNames}` }
    for (const t of dis) { t.applied = false; t.reason = `cancelled by advantage from ${advNames}` }
    return 'normal'
  }
  if (adv.length > 0) return 'advantage'
  if (dis.length > 0) return 'disadvantage'
  return 'normal'
}

/** The same tri-state, rendered for a passive score: +5 / −5 / 0. */
export function passiveAdvantageBonus(state: AdvantageState): number {
  return state === 'advantage' ? 5 : state === 'disadvantage' ? -5 : 0
}

/** 10 + every modifier that would apply to the active check, ±5 for adv/dis. */
export function resolvePassive(resolution: Resolution, request: RollRequest): {
  total: number
  terms: Term[]
  advantage: AdvantageState
} {
  const r = resolveRoll(resolution, request)
  const bonus = passiveAdvantageBonus(r.advantage)
  const terms = [...r.modifierTerms]
  terms.push({
    sourceId: 'system:passive', sourceName: 'passive base', provenance: 'system',
    op: 'add', value: 10, applied: true, stage: 'base'
  })
  if (bonus !== 0) {
    terms.push({
      sourceId: 'system:passive-advantage', sourceName: `passive ${r.advantage}`,
      provenance: 'system', op: 'add', value: bonus, applied: true, stage: 'add'
    })
  }
  return { total: 10 + r.modifierTotal + bonus, terms: sortTerms(terms), advantage: r.advantage }
}

export function averageOf(expr: DiceExpr): number {
  return expr.count * ((expr.sides + 1) / 2) + (expr.modifier ?? 0)
}

/** Turns faces supplied by the authority into a result. Still pure. */
export function applyOutcome(resolution: RollResolution, outcome: RollOutcome): RollResult {
  const natural = outcome.faces[outcome.keptIndex] ?? 0
  const pending = (outcome.pendingDiceResults ?? []).reduce((n, p) => n + p.total, 0)
  const total = natural + resolution.modifierTotal + pending

  const terms: Term[] = [
    {
      sourceId: 'system:d20', sourceName: 'd20', provenance: 'system',
      op: 'add', value: natural, applied: true, stage: 'base',
      ...(resolution.advantage !== 'normal'
        ? { note: `${resolution.advantage}: rolled ${outcome.faces.join(', ')}` }
        : {})
    },
    ...resolution.modifierTerms
  ]

  const failed = resolution.autoFail.some((t) => t.applied)
  const succeeded = resolution.autoSucceed.some((t) => t.applied)

  let success: boolean | undefined
  let critical = false
  let criticalMiss = false

  const forcedCritical = resolution.autoCritical.some((t) => t.applied)

  if (resolution.request.kind === 'attack') {
    // Natural 20 always hits and natural 1 always misses — attack rolls only.
    // The SRD does not extend this to ability checks or saving throws.
    critical = natural >= resolution.critRange
    criticalMiss = natural === 1
    const target = resolution.request.target
    if (critical) success = true
    else if (criticalMiss) success = false
    else if (target && target.kind === 'ac') success = total >= target.value
    // "Any attack that hits is a critical hit if the attacker is within 5 feet"
    // — paralyzed and unconscious. A forced critical only applies on a hit.
    if (forcedCritical && success === true) critical = true
  } else {
    const target = resolution.request.target
    if (target && target.kind === 'dc') success = total >= target.value
  }

  if (failed) success = false
  else if (succeeded) success = true

  return {
    resolution,
    outcome,
    natural,
    total,
    ...(success !== undefined ? { success } : {}),
    critical,
    criticalMiss,
    terms: sortTerms(terms)
  }
}
