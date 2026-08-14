// Structural validation and the runtime invariants.
//
// These run over content at load time and over resolution output in tests and
// in development, so a malformed DM-authored item fails loudly at the point of
// authoring rather than producing a quietly wrong number in play.

import type {
  Character, EffectSource, Modifier, StatValue, RollResolution
} from './types.js'
import { CAPABILITY_KEYS, VALUE_OPS } from './types.js'
import { isDeclaredStatPath } from './statPaths.js'

export interface Problem {
  severity: 'error' | 'warning'
  where: string
  message: string
}

// ---------------------------------------------------------------------------
// Content validation
// ---------------------------------------------------------------------------

export function validateModifier(m: Modifier, where: string): Problem[] {
  const problems: Problem[] = []
  const err = (message: string) => problems.push({ severity: 'error', where, message })

  const valueFields = m.target !== undefined || m.op !== undefined || m.suppresses !== undefined
  const rollFields = m.scope !== undefined || m.rollOp !== undefined
  const capFields = m.capability !== undefined || m.capOp !== undefined

  // Invariant 3: no modifier sets fields outside its declared channel.
  if (m.channel === 'value') {
    if (rollFields || capFields) err('value-channel modifier sets roll or capability fields')
    if (!m.op) err('value-channel modifier has no op')
    else if (!VALUE_OPS.includes(m.op)) err(`unknown value op "${m.op}"`)
    if (m.op === 'suppress') {
      if (!m.suppresses) err('suppress modifier declares no suppression target')
      else if (
        !m.suppresses.tags?.length && !m.suppresses.sourceIds?.length &&
        !m.suppresses.ops?.length && !m.suppresses.paths?.length
      ) {
        err('suppress modifier has an empty target and would match nothing')
      }
    } else {
      // Invariant 1: every stat path a modifier targets exists in the registry.
      if (!m.target) err(`value op "${m.op}" has no target stat path`)
      else if (!isDeclaredStatPath(m.target)) err(`unknown stat path "${m.target}"`)
      if (m.value === undefined) err(`value op "${m.op}" has no value`)
    }
  } else if (m.channel === 'roll') {
    if (capFields) err('roll-channel modifier sets capability fields')
    if (m.target !== undefined || m.op !== undefined) {
      err('roll-channel modifier sets value fields')
    }
    if (!m.rollOp) err('roll-channel modifier has no rollOp')
  } else if (m.channel === 'capability') {
    if (valueFields || rollFields) err('capability-channel modifier sets value or roll fields')
    if (!m.capability) err('capability-channel modifier names no capability')
    else if (!CAPABILITY_KEYS.includes(m.capability)) err(`unknown capability "${m.capability}"`)
    if (m.capOp !== 'grant' && m.capOp !== 'revoke') err('capability modifier has no grant/revoke op')
  } else {
    err(`unknown channel "${(m as { channel: string }).channel}"`)
  }

  return problems
}

export function validateEffectSource(source: EffectSource): Problem[] {
  const problems: Problem[] = []
  const where = source.id

  if (!source.id) problems.push({ severity: 'error', where: '(anonymous)', message: 'source has no id' })
  if (!source.name) problems.push({ severity: 'error', where, message: 'source has no name' })
  if (source.contentVersion === undefined) {
    problems.push({ severity: 'error', where, message: 'source has no contentVersion' })
  }
  if (source.provenance === 'dm' && !source.campaignId) {
    problems.push({ severity: 'warning', where, message: 'DM content has no campaignId' })
  }

  const seen = new Set<string>()
  for (const m of source.modifiers) {
    if (seen.has(m.id)) {
      problems.push({ severity: 'error', where, message: `duplicate modifier id "${m.id}"` })
    }
    seen.add(m.id)
    problems.push(...validateModifier(m, `${where}#${m.id}`))
  }

  if (source.completeness === 'partial' && !source.narrative?.length) {
    problems.push({
      severity: 'warning', where,
      message: 'source is marked partial but does not say what is missing'
    })
  }

  return problems
}

export function validateContent(sources: EffectSource[]): Problem[] {
  const problems: Problem[] = []
  const byKey = new Map<string, EffectSource>()
  for (const s of sources) {
    // Invariant 4: content ids are unique within (provenance, campaignId).
    const key = `${s.provenance}:${s.campaignId ?? ''}:${s.id}`
    if (byKey.has(key)) {
      problems.push({ severity: 'error', where: s.id, message: 'duplicate content id in the same scope' })
    }
    byKey.set(key, s)
    problems.push(...validateEffectSource(s))
  }
  return problems
}

// ---------------------------------------------------------------------------
// Character state validation
// ---------------------------------------------------------------------------

export function validateCharacter(character: Character): Problem[] {
  const problems: Problem[] = []
  const where = character.id
  const err = (message: string) => problems.push({ severity: 'error', where, message })

  // Invariant 15
  if (character.exhaustionLevel < 0 || character.exhaustionLevel > 6) {
    err(`exhaustionLevel ${character.exhaustionLevel} is outside 0..6`)
  }

  // Invariant 16
  const attuned = character.inventory.attunedInstanceIds
  if (attuned.length > 3) err(`attuned to ${attuned.length} items; the limit is 3`)
  const attunedDefs = new Set<string>()
  for (const instanceId of attuned) {
    const inst = character.inventory.instances.find((i) => i.instanceId === instanceId)
    if (!inst) { err(`attuned to unknown instance "${instanceId}"`); continue }
    if (attunedDefs.has(inst.definitionId)) {
      err(`attuned to two copies of "${inst.definitionId}"`)
    }
    attunedDefs.add(inst.definitionId)
  }

  // Invariant 5
  const instanceIds = new Set(character.inventory.instances.map((i) => i.instanceId))
  for (const [slot, instanceId] of Object.entries(character.inventory.equipped)) {
    if (instanceId && !instanceIds.has(instanceId)) {
      err(`slot "${slot}" holds unknown instance "${instanceId}"`)
    }
  }

  // Invariant 20 — no derived value is ever stored on the character. Enforced
  // structurally by the Character type, and asserted here for JSON-loaded data.
  for (const forbidden of ['armorClass', 'hitPointsMax', 'initiative', 'spellSaveDC']) {
    if (forbidden in (character as unknown as Record<string, unknown>)) {
      err(`character stores derived value "${forbidden}"; derived values are computed, never stored`)
    }
  }

  if (character.deathSaves.successes < 0 || character.deathSaves.successes > 3) {
    err('deathSaves.successes is outside 0..3')
  }
  if (character.deathSaves.failures < 0 || character.deathSaves.failures > 3) {
    err('deathSaves.failures is outside 0..3')
  }

  return problems
}

// ---------------------------------------------------------------------------
// Resolution invariants — asserted in tests and in development builds
// ---------------------------------------------------------------------------

export function checkStatValueInvariants(value: StatValue): Problem[] {
  const problems: Problem[] = []
  const where = value.path

  // Invariant 6: every not-applied term explains itself. This is the one that
  // keeps the HUD honest, so it is an error rather than a warning.
  for (const t of value.terms) {
    if (!t.applied && !t.reason) {
      problems.push({
        severity: 'error', where,
        message: `term from "${t.sourceId}" is not applied but gives no reason`
      })
    }
  }

  // Invariant 11: terms are stably ordered.
  const stageRank: Record<string, number> = {
    compute: 0, base: 1, proficiency: 2, add: 3, multiply: 4,
    set: 5, clamp: 6, replace: 7, suppressed: 8
  }
  for (let i = 1; i < value.terms.length; i++) {
    const a = value.terms[i - 1]!
    const b = value.terms[i]!
    if ((stageRank[a.stage] ?? 0) > (stageRank[b.stage] ?? 0)) {
      problems.push({
        severity: 'error', where,
        message: `terms are out of stage order: ${a.stage} appears before ${b.stage}`
      })
      break
    }
  }

  return problems
}

export function checkRollInvariants(roll: RollResolution): Problem[] {
  const problems: Problem[] = []
  const where = `${roll.request.kind} roll`

  // Invariant 12
  if (roll.advantage === 'normal' && roll.dice.count !== 1) {
    problems.push({ severity: 'error', where, message: 'a normal roll must throw exactly one d20' })
  }
  if (roll.advantage !== 'normal' && roll.dice.count !== 2) {
    problems.push({
      severity: 'error', where,
      message: 'advantage and disadvantage throw exactly one extra d20, never more'
    })
  }

  // Invariant 13
  const pbTerms = roll.modifierTerms.filter(
    (t) => t.applied && t.sourceId === 'proficiencyBonus'
  )
  if (pbTerms.length > 1) {
    problems.push({
      severity: 'error', where,
      message: 'the proficiency bonus appears more than once in a roll breakdown'
    })
  }

  for (const t of [...roll.advantageSources, ...roll.disadvantageSources]) {
    if (!t.applied && !t.reason) {
      problems.push({
        severity: 'error', where,
        message: `advantage source "${t.sourceId}" was discarded without a reason`
      })
    }
  }

  return problems
}

export function errorsOnly(problems: Problem[]): Problem[] {
  return problems.filter((p) => p.severity === 'error')
}

export function formatProblems(problems: Problem[]): string {
  return problems.map((p) => `[${p.severity}] ${p.where}: ${p.message}`).join('\n')
}
