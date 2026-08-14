// The generic check resolver.
//
// One entry point for ability checks, skill checks and saving throws. There is
// deliberately no per-skill formula and no separate saving-throw system: a
// paralyzed character's Dexterity save resolves through the same condition and
// effect architecture as everything else, with no "paralyzed save" branch
// anywhere.

import type {
  Ability, AdvantageState, RollRequest, RollResolution, SkillId, Term, ToolId
} from './types.js'
import type { Resolution } from './resolve.js'
import { resolveRoll, resolvePassive } from './roll.js'

export type CheckType = 'ability' | 'skill' | 'savingThrow' | 'initiative' | 'death'

export interface CheckContext {
  /** What is being resisted — 'poison', 'magic', 'disease', 'trap'. */
  againstTags?: string[]
  /** What the check is an attempt to do — 'climb', 'swim', 'social'. */
  activityTags?: string[]
  /** Senses the check depends on; blinded auto-fails sight checks. */
  requiresSenses?: ('sight' | 'hearing')[]
  dc?: number
  /** DM fiat, a first-class input rather than an escape hatch. */
  dmAdvantage?: AdvantageState
  /** Ids of ActionOptions the player elected before rolling. */
  electedOptions?: string[]
}

export interface CheckRequest {
  checkType: CheckType
  /**
   * The ability the check uses. Optional for a skill check, where the skill's
   * default is used — but always overridable, because the SRD explicitly
   * sanctions Constitution (Athletics) and Strength (Intimidation).
   */
  ability?: Ability
  skill?: SkillId
  tool?: ToolId
  context?: CheckContext
}

export interface CheckResolution extends RollResolution {
  checkType: CheckType
  /** The ability actually used, after defaults were applied. */
  ability?: Ability
  /** A one-line human summary: "Acrobatics +7". */
  label: string
}

const DEFAULT_ABILITY: Record<string, Ability> = {
  acrobatics: 'dex', 'animal-handling': 'wis', arcana: 'int', athletics: 'str',
  deception: 'cha', history: 'int', insight: 'wis', intimidation: 'cha',
  investigation: 'int', medicine: 'wis', nature: 'int', perception: 'wis',
  performance: 'cha', persuasion: 'cha', religion: 'int',
  'sleight-of-hand': 'dex', stealth: 'dex', survival: 'wis'
}

function abilityFor(request: CheckRequest): Ability | undefined {
  if (request.ability) return request.ability
  if (request.skill) return DEFAULT_ABILITY[request.skill]
  return undefined
}

function toRollRequest(request: CheckRequest): RollRequest {
  const ctx = request.context ?? {}
  const ability = abilityFor(request)
  const kind =
    request.checkType === 'savingThrow' ? 'save'
      : request.checkType === 'initiative' ? 'initiative'
        : request.checkType === 'death' ? 'death'
          : 'check'

  return {
    kind,
    ...(ability ? { ability } : {}),
    ...(request.skill ? { skill: request.skill } : {}),
    ...(request.tool ? { tool: request.tool } : {}),
    ...(ctx.againstTags ? { againstTags: ctx.againstTags } : {}),
    ...(ctx.activityTags ? { activityTags: ctx.activityTags } : {}),
    ...(ctx.requiresSenses ? { requiresSenses: ctx.requiresSenses } : {}),
    ...(ctx.dc !== undefined ? { target: { kind: 'dc' as const, value: ctx.dc } } : {}),
    ...(ctx.dmAdvantage ? { dmAdvantage: ctx.dmAdvantage } : {}),
    ...(ctx.electedOptions ? { electedOptions: ctx.electedOptions } : {})
  }
}

/**
 * Resolves a check without rolling. The caller passes the result to the
 * authority for dice, then back through applyOutcome.
 */
export function resolveCheck(resolution: Resolution, request: CheckRequest): CheckResolution {
  const ability = abilityFor(request)
  const rollRequest = toRollRequest(request)
  const roll = resolveRoll(resolution, rollRequest)

  const name = request.skill
    ? titleCase(request.skill)
    : request.checkType === 'savingThrow'
      ? `${(ability ?? '').toUpperCase()} save`
      : request.checkType === 'initiative'
        ? 'Initiative'
        : `${(ability ?? '').toUpperCase()} check`

  const sign = roll.modifierTotal >= 0 ? '+' : ''
  const advNote =
    roll.advantage === 'advantage' ? ' (advantage)'
      : roll.advantage === 'disadvantage' ? ' (disadvantage)'
        : ''

  return {
    ...roll,
    checkType: request.checkType,
    ...(ability ? { ability } : {}),
    label: `${name} ${sign}${roll.modifierTotal}${advNote}`
  }
}

/** The passive form of the same check — 10 + modifiers, ±5 for advantage. */
export function resolvePassiveCheck(
  resolution: Resolution,
  request: CheckRequest
): { total: number; terms: Term[]; advantage: AdvantageState; label: string } {
  const passive = resolvePassive(resolution, toRollRequest(request))
  const name = request.skill ? titleCase(request.skill) : 'passive check'
  return { ...passive, label: `Passive ${name} ${passive.total}` }
}

function titleCase(id: string): string {
  return id.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}
