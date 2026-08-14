// The resolution engine.
//
// One entry point — createResolution — produces a context that can answer
// stat, proficiency, capability and roll questions about a character. Every
// answer carries its own explanation.
//
// Purity: no I/O, no clock, no randomness. The same (character, content) always
// produces byte-identical output, which is what lets this module run unchanged
// on the client for prediction and on the server for truth.

import type {
  Ability, CapabilityKey, CapabilityValue, Character, CollectedSources,
  ConditionId, ContentIndex, EffectSource, ProficiencyCategory, ProficiencyGrant,
  ProficiencyValue, RollScope, StatPath, StatValue, Term, Modifier, ValueExpr
} from './types.js'
import { evaluateValue } from './formula.js'
import { PROFICIENCY_MULTIPLIER } from './types.js'
import { evaluate, statDependencies, type PredicateEnv } from './predicates.js'
import {
  applyRounding, applyValuePipeline, collectSuppressions, sortTerms,
  type ModifierEntry, type SuppressionSet
} from './operations.js'
import { collectCandidates, activate } from './collect.js'
import {
  abilityMaxPath, abilityScorePath, getStatPathDefinition, PROFICIENCY_BONUS
} from './statPaths.js'

/** Passes of the activation fixed point before the configuration is called cyclic. */
export const MAX_PASSES = 3

export interface ResolutionOptions {
  /** Throw on a cycle instead of degrading to the last stable set. Default false. */
  strict?: boolean
}

export interface Resolution {
  character: Character
  sources: CollectedSources
  /**
   * Every modifier from every active source, already carrying its owner, its
   * gate result and whether it survived suppression. Roll resolution consumes
   * this rather than walking sources itself, so a value-channel `suppress` can
   * remove a roll-channel disadvantage — which is what mithral armour does to
   * half plate's Stealth penalty.
   */
  entries: ModifierEntry[]
  isSuppressed(entry: ModifierEntry): ModifierEntry | undefined
  /** Every proficiency the character holds, with the source that granted it. */
  proficiencies(): HeldProficiency[]
  hasProficiency(category: ProficiencyCategory): boolean
  /** The player's answer to a selection offered by a source. */
  selection(sourceId: string, selectionId: string): string[]
  /** Evaluates a formula-valued expression against live character state. */
  evaluateValue(expr: ValueExpr | undefined, sourceId?: string): number
  /**
   * Active sources whose loaded content is known to be missing mechanics.
   * While any of these is in play every resolution is flagged `incomplete`,
   * because a source whose rules text we do not have could affect anything —
   * under-reporting silently would be worse than reporting loudly.
   */
  partialSources: EffectSource[]
  stat(path: StatPath): StatValue
  proficiency(scope: RollScope, categories?: ProficiencyCategory[]): ProficiencyValue
  capability(key: CapabilityKey): CapabilityValue
  hasCondition(id: ConditionId): boolean
  /** Non-fatal problems: cycles, unknown paths, content version drift. */
  diagnostics: string[]
}

// ---------------------------------------------------------------------------
// Proficiency bonus by character level (SRD progression)
// ---------------------------------------------------------------------------

export function proficiencyBonusForLevel(level: number): number {
  if (level < 1) return 2
  return 2 + Math.floor((Math.min(level, 20) - 1) / 4)
}

export function characterLevel(character: Character): number {
  return character.classLevels.reduce((n, c) => n + c.level, 0)
}

// ---------------------------------------------------------------------------

function entriesFor(sources: EffectSource[], env: PredicateEnv): ModifierEntry[] {
  const out: ModifierEntry[] = []
  for (const source of sources) {
    for (const modifier of source.modifiers) {
      const gate = evaluate(modifier.condition, env)
      out.push({
        modifier,
        sourceId: modifier.sourceId ?? source.id,
        sourceName: source.name,
        provenance: source.provenance,
        gatePassed: gate.value,
        gateReason: gate.reason,
        incomplete: source.completeness === 'partial'
      })
    }
  }
  return out
}

function scopeMatches(scope: RollScope | undefined, query: RollScope): boolean {
  if (!scope) return true
  const overlaps = <T>(a: T[] | undefined, b: T[] | undefined): boolean => {
    if (!a || a.length === 0) return true
    if (!b || b.length === 0) return false
    return a.some((x) => b.includes(x))
  }
  return (
    overlaps(scope.kinds, query.kinds) &&
    overlaps(scope.abilities, query.abilities) &&
    overlaps(scope.skills, query.skills) &&
    overlaps(scope.tools, query.tools) &&
    overlaps(scope.againstTags, query.againstTags) &&
    overlaps(scope.targetTags, query.targetTags) &&
    overlaps(scope.activityTags, query.activityTags) &&
    overlaps(scope.requiresSenses, query.requiresSenses)
  )
}

export { scopeMatches }

export interface HeldProficiency {
  category: ProficiencyCategory
  level: string
  sourceId: string
  sourceName: string
}

/**
 * The roll scope a proficiency category implies. Armour and weapon-category
 * proficiencies gate item use rather than modifying a roll, so they imply no
 * scope and never match a check.
 */
export function scopeOfCategory(category: ProficiencyCategory): RollScope | undefined {
  switch (category.kind) {
    case 'skill': return { kinds: ['check'], skills: [category.id] }
    case 'tool': return { kinds: ['check'], tools: [category.id] }
    case 'save': return { kinds: ['save'], abilities: [category.ability] }
    default: return undefined
  }
}

export function sameCategory(a: ProficiencyCategory, b: ProficiencyCategory): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'skill' && b.kind === 'skill') return a.id === b.id
  if (a.kind === 'tool' && b.kind === 'tool') return a.id === b.id
  if (a.kind === 'save' && b.kind === 'save') return a.ability === b.ability
  if (a.kind === 'armor' && b.kind === 'armor') return a.category === b.category
  if (a.kind === 'weaponCategory' && b.kind === 'weaponCategory') return a.category === b.category
  if (a.kind === 'weapon' && b.kind === 'weapon') return a.itemId === b.itemId
  return false
}

// ---------------------------------------------------------------------------
// createResolution
// ---------------------------------------------------------------------------

export function createResolution(
  character: Character,
  content: ContentIndex,
  options: ResolutionOptions = {}
): Resolution {
  const diagnostics: string[] = []
  const candidates = collectCandidates(character, content)

  // Sources whose activation reads a derived stat participate in the fixed
  // point; everything else is settled on the first pass.
  const statDependent = candidates.filter((c) => statDependencies(c.source.activation).size > 0)

  let sources: CollectedSources = { active: [], inactive: [] }
  let entries: ModifierEntry[] = []
  let suppressions: SuppressionSet = collectSuppressions([])
  let memo = new Map<StatPath, StatValue>()
  const inProgress = new Set<StatPath>()

  // --- the environment predicates see ---------------------------------------
  const env: PredicateEnv = {
    getStat: (path) => stat(path).total,
    hasCondition: (id) => hasCondition(id),
    hasCapability: (key) => capabilityFrom(entries, key).allowed,
    characterLevel: () => characterLevel(character),
    classLevel: (classId) =>
      character.classLevels.find((c) => c.classId === classId)?.level ?? 0,
    speciesId: () => character.speciesId,
    isEquipped: (definitionId) =>
      Object.values(character.inventory.equipped).some((instanceId) => {
        const inst = character.inventory.instances.find((i) => i.instanceId === instanceId)
        return inst?.definitionId === definitionId
      }),
    isAttunedTo: (definitionId) =>
      character.inventory.attunedInstanceIds.some((instanceId) => {
        const inst = character.inventory.instances.find((i) => i.instanceId === instanceId)
        return inst?.definitionId === definitionId
      }),
    resourceRemaining: (resourceId) => {
      const spent = character.resourcesSpent[resourceId] ?? 0
      const max = resourceMax(resourceId)
      return max - spent
    },
    toggle: (id) => character.toggles[id] === true,
    dmFlag: (id) => character.dmFlags?.[id] === true,
    hasProficiency: (category) => hasProficiency(category),
    canCastSpells: () => canCastSpells(),
    nameOf: (id) => nameOf(id)
  }

  // "The ability to cast at least one spell" is the prerequisite shared by
  // Elemental Adept, Spell Sniper and War Caster. The SRD is specific that it
  // must come from the character's own traits or features, never from an item.
  function canCastSpells(): boolean {
    return sources.active.some((s) =>
      s.kind !== 'item' &&
      s.modifiers.some((m) => m.capability === 'castSpells' && m.capOp === 'grant'))
  }

  function heldProficiencies(): HeldProficiency[] {
    const out: HeldProficiency[] = []
    for (const source of sources.active) {
      for (const g of source.proficiencies ?? []) {
        if (!evaluate(g.condition, env).value) continue
        for (const category of expandSelections(source, g)) {
          out.push({
            category, level: g.level,
            sourceId: g.sourceId ?? source.id, sourceName: source.name
          })
        }
      }
    }
    return out
  }

  // A grant may name a selection instead of a concrete value: Resilient's
  // chosen ability, Skilled's three skills. The player's answer turns one
  // authored grant into the proficiencies they actually hold, with no
  // feat-specific code anywhere.
  function expandSelections(source: EffectSource, g: ProficiencyGrant): ProficiencyCategory[] {
    const c = g.category as (ProficiencyCategory & { selection?: string }) | undefined
    if (!c) return []
    if (!c.selection) return [g.category]
    const answers = selection(source.id, c.selection)
    return answers.map((answer) => {
      switch (g.category.kind) {
        case 'skill': return { kind: 'skill', id: answer } as ProficiencyCategory
        case 'tool': return { kind: 'tool', id: answer } as ProficiencyCategory
        case 'save': return { kind: 'save', ability: answer as Ability } as ProficiencyCategory
        case 'weapon': return { kind: 'weapon', itemId: answer } as ProficiencyCategory
        default: return g.category
      }
    })
  }

  function hasProficiency(category: ProficiencyCategory): boolean {
    return heldProficiencies().some((p) => sameCategory(p.category, category))
  }

  function selection(sourceId: string, selectionId: string): string[] {
    return character.selections?.[sourceId]?.[selectionId] ?? []
  }

  function evalValue(expr: ValueExpr | undefined, sourceId?: string): number {
    return evaluateValue(expr, {
      stat: (path) => stat(path).total,
      characterLevel: () => characterLevel(character),
      classLevel: (classId) =>
        character.classLevels.find((c) => c.classId === classId)?.level ?? 0,
      selection: (id) => (sourceId ? selection(sourceId, id)[0] : undefined),
      selectionValue: (id) => {
        const answer = sourceId ? selection(sourceId, id)[0] : undefined
        if (answer === undefined) return undefined
        const n = Number(answer)
        return Number.isNaN(n) ? undefined : n
      }
    })
  }

  /**
   * The player-facing name behind a content id.
   *
   * Requirement failures are read by players, so an id in one is a leak. Items,
   * declared resources and effect sources all share one id space here, which is
   * why one lookup answers for all three.
   */
  function nameOf(id: string): string {
    const item = content.items.get(id)
    if (item) return item.name
    for (const source of sources.active) {
      if (source.id === id) return source.name
      for (const r of source.resources ?? []) if (r.id === id) return r.name
    }
    return id
  }

  function resourceMax(resourceId: string): number {
    for (const source of sources.active) {
      for (const r of source.resources ?? []) {
        if (r.id !== resourceId) continue
        return typeof r.max === 'number' ? r.max : stat(r.max).total
      }
    }
    return 0
  }

  function hasCondition(id: ConditionId): boolean {
    // Each instance has its own duration, but the condition is binary.
    return character.conditions.some((c) => c.conditionId === id && !c.suppressed)
  }

  // --- stat resolution ------------------------------------------------------
  function stat(path: StatPath): StatValue {
    const cached = memo.get(path)
    if (cached) return cached

    if (inProgress.has(path)) {
      const msg = `circular stat dependency at ${path}`
      if (options.strict) throw new Error(msg)
      if (!diagnostics.includes(msg)) diagnostics.push(msg)
      return { path, total: 0, terms: [], notes: [msg], incomplete: false }
    }

    const def = getStatPathDefinition(path)
    if (!def) {
      const msg = `unknown stat path: ${path}`
      if (options.strict) throw new Error(msg)
      if (!diagnostics.includes(msg)) diagnostics.push(msg)
      return { path, total: 0, terms: [], notes: [msg], incomplete: false }
    }

    inProgress.add(path)
    try {
      const computed = def.compute
        ? def.compute({ get: (p) => stat(p).total })
        : undefined

      // Ability scores are capped by their own max path, which is itself a stat
      // because the SRD raises the cap (Star card 24, hammer of thunderbolts 30,
      // the manuals permanently).
      let externalMax: { value: number; sourceId: string; sourceName: string } | undefined
      const abilityMatch = /^ability\.(str|dex|con|int|wis|cha)\.score$/.exec(path)
      if (abilityMatch) {
        const a = abilityMatch[1] as Ability
        externalMax = {
          value: stat(abilityMaxPath(a)).total,
          sourceId: abilityMaxPath(a),
          sourceName: 'ability score maximum'
        }
      }

      const intrinsicBase = path === PROFICIENCY_BONUS
        ? proficiencyBonusForLevel(characterLevel(character))
        : abilityMatch
          ? character.abilityScoreBase[abilityMatch[1] as Ability]
          : def.intrinsicBase

      const result = applyValuePipeline({
        path,
        entries,
        suppressions,
        ...(intrinsicBase !== undefined ? { intrinsicBase } : {}),
        ...(computed !== undefined ? { computed } : {}),
        rounding: def.rounding,
        multiplyComposition: def.multiplyComposition,
        ...(externalMax ? { externalMax } : {}),
        evaluateValue: (expr) => evalValue(expr)
      })

      const partial = sources.active.filter((s) => s.completeness === 'partial')
      const value: StatValue = {
        path,
        total: result.total,
        terms: result.terms,
        notes: [
          ...(def.notes ?? []),
          ...partial.map((s) => `${s.name}: rules text is incomplete in the loaded content`)
        ],
        incomplete: result.incomplete || partial.length > 0
      }
      memo.set(path, value)
      return value
    } finally {
      inProgress.delete(path)
    }
  }

  // --- proficiency ----------------------------------------------------------
  function proficiencyFrom(scope: RollScope, categories?: ProficiencyCategory[]): ProficiencyValue {
    const grants: { grant: ProficiencyGrant; source: EffectSource }[] = []
    for (const source of sources.active) {
      for (const g of source.proficiencies ?? []) {
        // A grant matches a roll when the scope implied by its category matches,
        // and when any explicit narrowing ("only to climb or swim") also does.
        const expanded = expandSelections(source, g)
        const implied = expanded
          .map(scopeOfCategory)
          .filter((sc): sc is RollScope => sc !== undefined)

        // Either the category implies a scope that matches this roll, or the
        // caller named the category explicitly (a weapon's own proficiency).
        const impliedMatch = implied.some((sc) => scopeMatches(sc, scope))
        const explicitMatch = (categories ?? []).some(
          (wanted) => expanded.some((held) => sameCategory(held, wanted)))
        if (!impliedMatch && !explicitMatch) continue
        if (g.scope && !scopeMatches(g.scope, scope)) continue
        grants.push({ grant: g, source })
      }
    }

    const terms: Term[] = []
    let proficient = false
    let multiplier = 0
    let rounding: ProficiencyValue['rounding'] = 'floor'
    let winner: { grant: ProficiencyGrant; source: EffectSource } | undefined

    for (const g of grants) {
      const gate = evaluate(g.grant.condition, env)
      if (!gate.value) {
        terms.push({
          sourceId: g.grant.sourceId ?? g.source.id,
          sourceName: g.source.name,
          provenance: g.source.provenance,
          op: 'proficiency', applied: false, reason: gate.reason, stage: 'proficiency'
        })
        continue
      }
      if (g.grant.grantsProficiency) proficient = true
      const m = PROFICIENCY_MULTIPLIER[g.grant.level]
      if (m > multiplier) { multiplier = m; rounding = g.grant.rounding; winner = g }
    }

    for (const g of grants) {
      const gate = evaluate(g.grant.condition, env)
      if (!gate.value) continue
      const m = PROFICIENCY_MULTIPLIER[g.grant.level]
      const isWinner = g === winner
      terms.push({
        sourceId: g.grant.sourceId ?? g.source.id,
        sourceName: g.source.name,
        provenance: g.source.provenance,
        op: 'proficiency',
        value: m,
        applied: isWinner,
        ...(isWinner
          ? {}
          : { reason: `proficiency multiplies only once; ${winner?.source.name ?? 'another source'} is higher` }),
        stage: 'proficiency'
      })
    }

    const pb = stat(PROFICIENCY_BONUS).total
    // The zero rule is structural, not a special case: multiplying a term that
    // is 0 when not proficient gives 0. Artificer's Lore doubling a History
    // check you are not proficient in yields nothing, exactly as the SRD says.
    const term = proficient ? applyRounding(pb * (multiplier || 1), rounding) : 0

    if (!proficient && grants.length > 0) {
      terms.push({
        sourceId: 'system:proficiency', sourceName: 'proficiency bonus',
        provenance: 'system', op: 'proficiency', value: 0, applied: true,
        reason: `not proficient — ×${multiplier || 1} of 0`, stage: 'proficiency'
      })
    }

    return { proficient, multiplier: multiplier || 1, rounding, term, terms: sortTerms(terms) }
  }

  // --- capabilities ---------------------------------------------------------
  function capabilityFrom(all: ModifierEntry[], key: CapabilityKey): CapabilityValue {
    const terms: Term[] = []
    let revoked = false
    for (const e of all) {
      const m: Modifier = e.modifier
      if (m.channel !== 'capability' || m.capability !== key) continue
      if (suppressions.find(e)) {
        terms.push({
          sourceId: e.sourceId, sourceName: e.sourceName, provenance: e.provenance,
          op: m.capOp!, applied: false, reason: 'suppressed', stage: 'suppressed'
        })
        continue
      }
      if (!e.gatePassed) {
        terms.push({
          sourceId: e.sourceId, sourceName: e.sourceName, provenance: e.provenance,
          op: m.capOp!, applied: false, reason: e.gateReason, stage: 'compute'
        })
        continue
      }
      // Revoke beats grant: every SRD capability statement is a prohibition,
      // and prohibitions are removed by ending the condition, never by a
      // competing permission.
      if (m.capOp === 'revoke') revoked = true
      terms.push({
        sourceId: e.sourceId, sourceName: e.sourceName, provenance: e.provenance,
        op: m.capOp!, applied: true, stage: 'compute'
      })
    }
    if (revoked) {
      for (const t of terms) {
        if (t.applied && t.op === 'grant') {
          t.applied = false
          t.reason = 'a revoke takes precedence over a grant'
        }
      }
    }
    return { capability: key, allowed: !revoked, terms: sortTerms(terms) }
  }

  // --- the activation fixed point -------------------------------------------
  function rebuild(activeCandidates: typeof candidates): void {
    sources = activate(activeCandidates, env)
    entries = entriesFor(sources.active, env)
    suppressions = collectSuppressions(entries)
    memo = new Map()
  }

  // Pass 1 excludes sources whose activation reads a derived stat, so the first
  // stat resolution never depends on an answer it is trying to produce.
  rebuild(candidates.filter((c) => !statDependent.includes(c)))

  let previous = ''
  let settled = false
  for (let pass = 0; pass < MAX_PASSES; pass++) {
    rebuild(candidates)
    const signature = sources.active.map((s) => s.id).sort().join('|')
    if (signature === previous) { settled = true; break }
    previous = signature
  }
  if (!settled) {
    const msg =
      `activation did not settle within ${MAX_PASSES} passes; ` +
      `using the last stable set. Check for sources whose activation depends on ` +
      `a stat they themselves modify.`
    if (options.strict) throw new Error(msg)
    diagnostics.push(msg)
  }

  return {
    character,
    get sources() { return sources },
    get entries() { return entries },
    isSuppressed: (entry) => suppressions.find(entry),
    proficiencies: heldProficiencies,
    hasProficiency,
    selection,
    evaluateValue: evalValue,
    get partialSources() { return sources.active.filter((s) => s.completeness === 'partial') },
    stat,
    proficiency: proficiencyFrom,
    capability: (key) => capabilityFrom(entries, key),
    hasCondition,
    diagnostics
  }
}

// ---------------------------------------------------------------------------
// Convenience wrappers matching the shapes used across the app
// ---------------------------------------------------------------------------

export function resolveStat(
  character: Character,
  content: ContentIndex,
  path: StatPath
): StatValue {
  return createResolution(character, content).stat(path)
}

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

export { abilityScorePath }
