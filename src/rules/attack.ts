// The generic attack resolver.
//
// The weapon does not calculate the attack. The character does not calculate
// the attack. This module resolves the interaction between
// Actor + Action + Item + Target + Context, and everything it uses arrives
// through the ordinary effect vocabulary — including the target's conditions,
// which reach the attacker's roll as `appliesTo: 'attackersAgainstSelf'`
// modifiers rather than through the attacker knowing any condition by name.

import type {
  Ability, DamageType, DiceExpr, ExternalModifier, ItemDefinition, Modifier,
  ResistanceState, RollOutcome, Term
} from './types.js'
import type { Resolution } from './resolve.js'
import { resolveRoll, applyOutcome } from './roll.js'
import { sortTerms } from './operations.js'
import { abilityModifierPath, resistancePath, resistanceBypassPath, damageReductionPath, DAMAGE_TYPE_PATHS } from './statPaths.js'
import { applyDamage, type RolledComponent } from './damage.js'

export type CoverDegree = 'none' | 'half' | 'threeQuarters' | 'total'

export interface AttackContext {
  /** Distance band. Drives the within-5-feet clauses and the long-range penalty. */
  range?: 'melee' | 'normal' | 'long'
  /** Cover the target benefits from. Enters as a tagged modifier so `suppress` can remove it. */
  cover?: CoverDegree
  /** The attacker cannot see the target, or vice versa. */
  attackerUnseen?: boolean
  targetUnseen?: boolean
  /** Ids of ActionOptions the attacker elected — Great Weapon Master's -5/+10. */
  electedOptions?: string[]
  /** Two-handed use of a versatile weapon. */
  twoHanded?: boolean
  dmAdvantage?: 'advantage' | 'disadvantage' | 'normal'
}

export interface AttackRequest {
  weapon: ItemDefinition
  /** Resolution for the defender. Omitted for an attack against a bare AC number. */
  target?: Resolution
  targetAc?: number
  targetTags?: string[]
  context?: AttackContext
}

export interface AttackResolution {
  weapon: ItemDefinition
  /** Which ability the attack uses, and why. */
  ability: Ability
  abilityReason: string
  proficient: boolean
  attackRoll: ReturnType<typeof resolveRoll>
  damage: {
    components: { type: DamageType; dice: DiceExpr; flatTerms: Term[]; flat: number }[]
    terms: Term[]
  }
  targetAc?: number
  notes: string[]
}

const COVER_AC: Record<CoverDegree, number> = {
  none: 0, half: 2, threeQuarters: 5, total: 0
}

/**
 * Which ability a weapon attack uses.
 *
 * Melee uses Strength, ranged uses Dexterity, and finesse lets the wielder
 * choose — but the SRD requires the *same* modifier for attack and damage, so
 * the choice is made once here and reused. Thrown inherits the melee ability,
 * which is why a thrown dagger may use Dexterity.
 */
export function attackAbility(
  resolution: Resolution,
  weapon: ItemDefinition
): { ability: Ability; reason: string } {
  const profile = weapon.weapon
  if (!profile) return { ability: 'str', reason: 'not a weapon; defaulting to Strength' }

  const finesse = profile.properties.includes('finesse')
  if (finesse) {
    const str = resolution.stat(abilityModifierPath('str')).total
    const dex = resolution.stat(abilityModifierPath('dex')).total
    return dex >= str
      ? { ability: 'dex', reason: `finesse: Dexterity ${dex} is at least Strength ${str}` }
      : { ability: 'str', reason: `finesse: Strength ${str} exceeds Dexterity ${dex}` }
  }
  return profile.reach === 'ranged'
    ? { ability: 'dex', reason: 'ranged weapon' }
    : { ability: 'str', reason: 'melee weapon' }
}

/** Is the attacker proficient with this weapon? Category or specific item. */
export function weaponProficient(resolution: Resolution, weapon: ItemDefinition): boolean {
  const profile = weapon.weapon
  if (!profile) return false
  return (
    resolution.hasProficiency({ kind: 'weapon', itemId: weapon.id }) ||
    resolution.hasProficiency({ kind: 'weaponCategory', category: profile.category })
  )
}

/**
 * Situational penalties enter as **tagged modifiers** rather than inline
 * arithmetic, so a feat that says "you ignore X" can remove them with the
 * `suppress` operation that already exists. Sharpshooter, Crossbow Expert,
 * Skulker and Alert all work this way, and so does every future item or spell
 * with the same shape.
 */
function contextModifiers(request: AttackRequest): ExternalModifier[] {
  const ctx = request.context ?? {}
  const out: ExternalModifier[] = []
  const push = (id: string, name: string, modifier: Modifier) =>
    out.push({ sourceId: id, sourceName: name, provenance: 'system', modifier })

  if (ctx.range === 'long') {
    push('context:long-range', 'long range', {
      id: 'ctx-long-range', channel: 'roll', rollOp: 'disadvantage',
      scope: { kinds: ['attack'] }, tags: ['long-range'], permanence: 'temporary',
      note: 'attacking beyond normal range'
    })
  }
  if (ctx.attackerUnseen) {
    push('context:unseen-target', 'target cannot be seen', {
      id: 'ctx-unseen-target', channel: 'roll', rollOp: 'disadvantage',
      scope: { kinds: ['attack'] }, tags: ['unseen-target'], permanence: 'temporary'
    })
  }
  if (ctx.targetUnseen) {
    push('context:unseen-attacker', 'attacker cannot be seen', {
      id: 'ctx-unseen-attacker', channel: 'roll', rollOp: 'advantage',
      scope: { kinds: ['attack'] }, tags: ['unseen-attacker'], permanence: 'temporary'
    })
  }
  return out
}

/**
 * The defender's own modifiers that apply to *incoming* attacks. This is how
 * "attack rolls against the creature have advantage" reaches the attacker
 * without the attacker knowing what `prone` or `paralyzed` mean.
 */
function targetModifiers(request: AttackRequest): ExternalModifier[] {
  const target = request.target
  if (!target) return []
  const rangeTag = request.context?.range === 'melee' ? 'within-5-feet' : 'beyond-5-feet'
  const out: ExternalModifier[] = []

  for (const entry of target.entries) {
    const m = entry.modifier
    if (m.appliesTo !== 'attackersAgainstSelf') continue
    if (!entry.gatePassed) continue
    if (target.isSuppressed(entry)) continue
    // A modifier scoped to a distance band only applies in that band.
    const activity = m.scope?.activityTags
    if (activity && activity.length > 0 && !activity.includes(rangeTag)) continue
    out.push({
      sourceId: entry.sourceId,
      sourceName: `${entry.sourceName} (target)`,
      provenance: entry.provenance,
      modifier: { ...m, scope: { ...(m.scope ?? {}), activityTags: undefined } }
    })
  }
  return out
}

export function resolveAttack(
  attacker: Resolution,
  request: AttackRequest
): AttackResolution {
  const ctx = request.context ?? {}
  const profile = request.weapon.weapon
  const notes: string[] = []
  const { ability, reason } = attackAbility(attacker, request.weapon)
  const proficient = weaponProficient(attacker, request.weapon)

  if (!proficient) {
    // Weapon non-proficiency is simply the absence of the bonus; unlike armour
    // there is no additional penalty.
    notes.push('not proficient with this weapon: the proficiency bonus does not apply')
  }

  const externalModifiers = [...contextModifiers(request), ...targetModifiers(request)]

  // Cover raises the target's AC rather than penalising the attacker, and only
  // the most protective degree applies — cover never adds up.
  let targetAc = request.targetAc
  if (targetAc === undefined && request.target) {
    targetAc = request.target.stat('armorClass').total
  }
  const coverBonus = COVER_AC[ctx.cover ?? 'none']
  if (targetAc !== undefined && coverBonus > 0) {
    targetAc += coverBonus
    notes.push(`${ctx.cover} cover raises the target's AC by ${coverBonus}`)
  }
  if (ctx.cover === 'total') {
    notes.push('the target has total cover and cannot be targeted directly')
  }

  const attackRoll = resolveRoll(attacker, {
    kind: 'attack',
    ability,
    ...(request.targetTags ? { targetTags: request.targetTags } : {}),
    activityTags: [ctx.range === 'melee' ? 'within-5-feet' : 'beyond-5-feet'],
    ...(targetAc !== undefined ? { target: { kind: 'ac' as const, value: targetAc } } : {}),
    ...(ctx.dmAdvantage ? { dmAdvantage: ctx.dmAdvantage } : {}),
    ...(ctx.electedOptions ? { electedOptions: ctx.electedOptions } : {}),
    externalModifiers,
    // The weapon's proficiency reaches the roll through the ordinary
    // proficiency machinery. Naming the categories here is what keeps the
    // attack resolver free of a proficiency rule of its own.
    ...(profile
      ? {
        proficiencyCategories: [
          { kind: 'weapon' as const, itemId: request.weapon.id },
          { kind: 'weaponCategory' as const, category: profile.category }
        ]
      }
      : {})
  })

  // --- damage ---------------------------------------------------------------
  const damageTerms: Term[] = []
  const components: AttackResolution['damage']['components'] = []

  if (profile) {
    const dice = ctx.twoHanded && profile.versatileDamage
      ? profile.versatileDamage
      : profile.damage
    const abilityMod = attacker.stat(abilityModifierPath(ability)).total

    const flatTerms: Term[] = [{
      sourceId: abilityModifierPath(ability),
      sourceName: `${ability.toUpperCase()} modifier`,
      provenance: 'system', op: 'add', value: abilityMod, applied: true, stage: 'add'
    }]
    let flat = abilityMod

    // Elected options and item bonuses that target damage.
    for (const source of attacker.sources.active) {
      for (const option of source.options ?? []) {
        if (!(ctx.electedOptions ?? []).includes(option.id)) continue
        for (const m of option.modifiers) {
          if (m.channel !== 'value' || m.op !== 'add' || m.target !== 'damage.weapon') continue
          const v = attacker.evaluateValue(m.value)
          flat += v
          flatTerms.push({
            sourceId: option.id, sourceName: `${source.name}: ${option.label}`,
            provenance: source.provenance, op: 'add', value: v, applied: true, stage: 'add'
          })
        }
      }
    }

    components.push({ type: profile.damageType, dice, flatTerms, flat })
    damageTerms.push(...flatTerms)
    if (ctx.twoHanded && profile.versatileDamage) {
      notes.push('versatile: wielded two-handed')
    }
  }

  return {
    weapon: request.weapon,
    ability,
    abilityReason: reason,
    proficient,
    attackRoll,
    damage: { components, terms: sortTerms(damageTerms) },
    ...(targetAc !== undefined ? { targetAc } : {}),
    notes
  }
}

/** The resistance table for a defender, read from the ordinary stat paths. */
export function resistancesOf(target: Resolution): Partial<Record<DamageType, ResistanceState>> {
  const out: Partial<Record<DamageType, ResistanceState>> = {}
  const blanket = target.stat(resistancePath('all')).total
  for (const t of DAMAGE_TYPE_PATHS) {
    if (t === 'all') continue
    const own = target.stat(resistancePath(t)).total
    // A blanket effect (petrification's resistance to everything) only
    // overrides the type's own value when it is actually present — taking
    // Math.max unconditionally would let the default "no blanket" value of 0
    // silently erase a genuine vulnerability (a negative `own`) whenever
    // nothing granted blanket protection, which is the common case.
    const value = blanket !== 0 ? Math.max(own, blanket) : own
    out[t as DamageType] =
      value >= 2 ? 'immune' : value === 1 ? 'resistant' : value < 0 ? 'vulnerable' : 'none'
  }
  return out
}

export interface AttackOutcomeInput {
  attack: AttackResolution
  attacker: Resolution
  outcome: RollOutcome
  /** Dice results the authority produced for the damage roll. */
  damageDiceTotals: number[]
  critDiceTotals?: number[]
  target?: Resolution
  targetTemporaryHitPoints?: number
  targetHitPoints?: number
}

/** Applies dice the authority produced. Still pure. */
export function applyAttackOutcome(input: AttackOutcomeInput) {
  const roll = applyOutcome(input.attack.attackRoll, input.outcome)
  if (roll.success !== true) {
    return { roll, hit: false as const, damage: undefined }
  }

  const rolled: RolledComponent[] = input.attack.damage.components.map((c, i) => ({
    sourceId: input.attack.weapon.id,
    sourceName: input.attack.weapon.name,
    type: c.type,
    diceTotal: input.damageDiceTotals[i] ?? 0,
    flat: c.flat,
    doublesOnCrit: true,
    ...(input.critDiceTotals?.[i] !== undefined ? { critDiceTotal: input.critDiceTotals[i] } : {})
  }))

  const target = input.target
  const resistances = target ? resistancesOf(target) : {}

  // Elemental Adept and magic weapons bypass resistance by damage type, read
  // from the ordinary stat path rather than a bespoke flag.
  for (const c of input.attack.damage.components) {
    if (input.attacker.stat(resistanceBypassPath(c.type)).total > 0) {
      if (resistances[c.type] === 'resistant') {
        resistances[c.type] = 'none'
      }
    }
  }

  const flatReductions = target
    ? input.attack.damage.components
      .map((c) => ({
        sourceId: damageReductionPath(c.type),
        sourceName: `damage reduction (${c.type})`,
        amount: target.stat(damageReductionPath(c.type)).total
      }))
      .filter((r) => r.amount > 0)
    : []

  const damage = applyDamage({
    packet: { components: [] },
    rolled,
    critical: roll.critical === true,
    flatReductions,
    resistances,
    temporaryHitPoints: input.targetTemporaryHitPoints ?? 0,
    hitPointsCurrent: input.targetHitPoints ?? 0
  })

  return { roll, hit: true as const, damage }
}
