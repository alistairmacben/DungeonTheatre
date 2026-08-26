// Integrity of the content set as a whole.
//
// validate.ts checks a source against itself: does this modifier name a real
// stat path, does it stay inside its channel. That catches malformed content
// and misses broken content — a spell grant naming a spell nobody defined, a
// "choose two cantrips" with one cantrip to choose from, a species that also
// exists as somebody else's subspecies. Every one of those typechecks, passes
// every existing test, and is only discovered by a player finding an empty
// menu where their cantrips should be.
//
// All three of those have actually happened here. This file exists so the next
// one is caught by a machine instead of by Alistair clicking around:
//
//   - The druid's cantrip selection used a kind with no pool behind it, so a
//     new druid was created with no cantrips and no way to pick any.
//   - Wood Elf was authored as a top-level species while Elf already carried
//     it as a subspecies, so the same race existed twice with different stats.
//   - Every subclass id referenced by a class pointed at nothing at all. That
//     was a warning here while subclasses did not exist as a concept; now that
//     they do, it is an error, along with its two quieter cousins — a subclass
//     filed under a class that never offers it, and one whose features start
//     before the level the choice is made.
//
// The rule of thumb for what belongs here: if it can be wrong without being
// *malformed*, it belongs here. Structure is validate.ts's job; meaning is
// this file's.

import type {
  ClassDefinition, ContentIndex, EffectSource, Modifier, SpeciesDefinition,
  ValueExpr
} from '../rules/types.js'
import type { Problem } from '../rules/validate.js'
import { isDeclaredStatPath } from '../rules/statPaths.js'

/** Highest level any character reaches, and so the longest a table need be. */
const MAX_LEVEL = 20
/** The SRD's slot ladder stops at 9th. */
const MAX_SLOT_LEVEL = 9

interface Ctx {
  content: ContentIndex
  problems: Problem[]
  /** Every list id any spell claims membership of. */
  spellLists: Set<string>
}

/** True for a source that is simply on, with no predicate gating it. */
function isAlways(activation: EffectSource['activation']): boolean {
  return typeof activation === 'object' && activation !== null
    && 'always' in activation && activation.always === true
}

const err = (ctx: Ctx, where: string, message: string): void => {
  ctx.problems.push({ severity: 'error', where, message })
}
const warn = (ctx: Ctx, where: string, message: string): void => {
  ctx.problems.push({ severity: 'warning', where, message })
}

// ---------------------------------------------------------------------------
// Walking the graph
// ---------------------------------------------------------------------------

/** Every EffectSource in the content set, with a human path to where it lives. */
function* allSources(content: ContentIndex): Generator<{ source: EffectSource; where: string }> {
  for (const [key, s] of content.species) {
    yield { source: s.effects, where: `species ${key}` }
    for (const sub of s.subspecies ?? []) {
      yield { source: sub.effects, where: `species ${key} › subspecies ${sub.id}` }
    }
  }
  for (const [key, c] of content.classes) {
    for (const f of c.features) {
      yield { source: f.effects, where: `class ${key} › feature ${f.id}` }
    }
  }
  for (const [key, sc] of content.subclasses) {
    for (const f of sc.features) {
      yield { source: f.effects, where: `subclass ${key} › feature ${f.id}` }
    }
  }
  for (const [key, f] of content.feats) yield { source: f.effects, where: `feat ${key}` }
  for (const [key, i] of content.items) yield { source: i.effects, where: `item ${key}` }
  for (const [key, s] of content.spells) {
    yield { source: s.effects, where: `spell ${key}` }
    for (const up of s.upcast ?? []) {
      yield { source: up.effects, where: `spell ${key} › upcast ${up.slotLevel}` }
    }
  }
  for (const [key, c] of content.conditions) yield { source: c.effects, where: `condition ${key}` }
  for (const [i, s] of (content.ambient ?? []).entries()) {
    yield { source: s, where: `ambient[${i}]` }
  }
}

/** Every ValueExpr reachable from a modifier, including nested ones. */
function* valueExprs(expr: ValueExpr | undefined): Generator<ValueExpr> {
  if (expr === undefined || typeof expr === 'number') return
  yield expr
  if (typeof expr !== 'object') return
  if ('sum' in expr) for (const e of expr.sum) yield* valueExprs(e)
  if ('product' in expr) for (const e of expr.product) yield* valueExprs(e)
  if ('min' in expr) for (const e of expr.min) yield* valueExprs(e)
  if ('max' in expr) for (const e of expr.max) yield* valueExprs(e)
  if ('floor' in expr) yield* valueExprs(expr.floor)
  if ('ceil' in expr) yield* valueExprs(expr.ceil)
}

// ---------------------------------------------------------------------------
// The checks
// ---------------------------------------------------------------------------

/**
 * A definition filed under a key that is not its own id is invisible: every
 * lookup in the engine goes through the key, every cross-reference through the
 * id, and the two silently disagree.
 */
function checkKeysMatchIds(ctx: Ctx): void {
  const maps: [string, Map<string, { id: string }>][] = [
    ['species', ctx.content.species],
    ['class', ctx.content.classes],
    ['subclass', ctx.content.subclasses],
    ['feat', ctx.content.feats],
    ['item', ctx.content.items],
    ['spell', ctx.content.spells],
    ['condition', ctx.content.conditions]
  ]
  const seen = new Map<string, string>()
  for (const [kind, map] of maps) {
    for (const [key, def] of map) {
      if (def.id !== key) {
        err(ctx, `${kind} ${key}`, `filed under "${key}" but its own id is "${def.id}"`)
      }
      const previous = seen.get(key)
      if (previous) {
        err(ctx, `${kind} ${key}`, `id also used by a ${previous}`)
      }
      seen.set(key, kind)
    }
  }
}

/**
 * The Wood Elf case: a race that is both a species of its own and somebody
 * else's subspecies exists twice, with two sets of stats that will drift.
 *
 * Matched on name rather than id, because the duplicate is never a duplicate
 * id — that would be caught above. It is the same race spelled two ways.
 */
function checkNoDuplicateRaces(ctx: Ctx): void {
  const subspeciesNames = new Map<string, string>()
  const subspeciesIds = new Set<string>()

  for (const [key, s] of ctx.content.species) {
    for (const sub of s.subspecies ?? []) {
      if (subspeciesIds.has(sub.id)) {
        err(ctx, `species ${key}`, `subspecies id "${sub.id}" is used by more than one species`)
      }
      subspeciesIds.add(sub.id)
      subspeciesNames.set(sub.name.toLowerCase(), key)
    }
  }

  for (const [key, s] of ctx.content.species) {
    const owner = subspeciesNames.get(s.name.toLowerCase())
    if (owner && owner !== key) {
      err(ctx, `species ${key}`,
        `"${s.name}" is also a subspecies of ${owner} — the same race defined twice`)
    }
  }

  const byName = new Map<string, string>()
  for (const [key, s] of ctx.content.species) {
    const previous = byName.get(s.name.toLowerCase())
    if (previous) err(ctx, `species ${key}`, `shares the name "${s.name}" with ${previous}`)
    byName.set(s.name.toLowerCase(), key)
  }
}

/**
 * A grant that reaches for something absent yields an empty menu rather than an
 * error, which is the shape every content bug in this project has taken.
 */
function checkSpellGrants(ctx: Ctx, source: EffectSource, where: string): void {
  const selectionIds = new Set((source.selections ?? []).map((s) => s.id))

  for (const grant of source.spells ?? []) {
    for (const spellId of grant.spellIds ?? []) {
      if (!ctx.content.spells.has(spellId)) {
        err(ctx, where, `grants spell "${spellId}", which no content defines`)
      }
    }

    if (grant.fromList && !ctx.spellLists.has(grant.fromList.listId)) {
      err(ctx, where,
        `draws from spell list "${grant.fromList.listId}", which no spell is on`)
    }

    if (grant.selectionId && !selectionIds.has(grant.selectionId)) {
      err(ctx, where,
        `names selection "${grant.selectionId}", which this source does not declare`)
    }

    // A grant that names no spells, no list and no selection grants nothing.
    if (!grant.spellIds?.length && !grant.fromList && !grant.selectionId) {
      err(ctx, where, 'a spell grant that names no spells, list or selection')
    }
  }
}

/**
 * A choice the player cannot make. The druid's dead cantrips were exactly
 * this: a selection whose pool was missing, so the creation flow had nothing
 * to offer and silently answered it with nothing.
 */
function checkSelections(ctx: Ctx, source: EffectSource, where: string): void {
  const seen = new Set<string>()
  for (const sel of source.selections ?? []) {
    if (seen.has(sel.id)) err(ctx, where, `duplicate selection id "${sel.id}"`)
    seen.add(sel.id)

    if (sel.count < 1) err(ctx, where, `selection "${sel.id}" asks for ${sel.count} choices`)

    // 'skill', 'ability' and the rest have an implicit universe the engine can
    // enumerate. A spell list does not: the pool has to be stated, or there is
    // nothing to choose from.
    if (sel.kind === 'spellList' && !sel.from?.length) {
      err(ctx, where, `selection "${sel.id}" chooses spells but names no pool`)
    }

    if (sel.from && sel.from.length < sel.count) {
      err(ctx, where,
        `selection "${sel.id}" asks for ${sel.count} from a pool of ${sel.from.length}`)
    }

    // A spell pool must name spells that exist, or the menu is short by one
    // and nobody notices which.
    if (sel.kind === 'spellList') {
      for (const spellId of sel.from ?? []) {
        if (!ctx.content.spells.has(spellId)) {
          err(ctx, where, `selection "${sel.id}" offers "${spellId}", which no content defines`)
        }
      }
    }
  }
}

/** Proficiency in a named weapon that does not exist grants nothing. */
function checkProficiencies(ctx: Ctx, source: EffectSource, where: string): void {
  for (const grant of source.proficiencies ?? []) {
    const category = grant.category as { kind?: string; itemId?: string; id?: string }
    if (category?.kind === 'weapon' && category.itemId
      && !ctx.content.items.has(category.itemId)) {
      err(ctx, where, `grants proficiency with "${category.itemId}", which no content defines`)
    }
  }
}

/**
 * Two sources declaring the same resource id fight over one pool — unless
 * they are gated so that only one is ever live.
 *
 * The bard does exactly that on purpose: Bardic Inspiration comes back on a
 * long rest until 5th level and on a short rest after, which is two sources
 * with opposite activation predicates and one resource between them. So an
 * unconditional collision is a bug and a conditional one is a claim, reported
 * as a warning because this file cannot evaluate a predicate without a
 * character to evaluate it against.
 */
function checkResources(ctx: Ctx): void {
  const owners = new Map<string, { where: string; conditional: boolean }>()
  for (const { source, where } of allSources(ctx.content)) {
    const conditional = !isAlways(source.activation)
    for (const def of source.resources ?? []) {
      const previous = owners.get(def.id)
      if (previous) {
        const message = `resource "${def.id}" is also declared by ${previous.where}`
        if (previous.conditional || conditional) {
          warn(ctx, where, `${message} — the two must never be active at once`)
        } else {
          err(ctx, where, message)
        }
      }
      // The unconditional declarer is the more useful one to name in a later
      // collision, so it wins the slot.
      if (!previous || (previous.conditional && !conditional)) {
        owners.set(def.id, { where, conditional })
      }

      if (typeof def.max === 'string' && !isDeclaredStatPath(def.max)) {
        err(ctx, where, `resource "${def.id}" reads undeclared stat path "${def.max}"`)
      }
      if (def.spellSlot) {
        const level = def.spellSlot.level
        if (!Number.isInteger(level) || level < 1 || level > MAX_SLOT_LEVEL) {
          err(ctx, where, `resource "${def.id}" is a slot of level ${level}`)
        }
      }
    }
  }
}

/** Level tables are transcribed by hand; these are the transcription errors. */
function checkLevelTables(ctx: Ctx, modifier: Modifier, where: string): void {
  for (const expr of valueExprs(modifier.value)) {
    if (typeof expr !== 'object') continue

    if ('characterLevelTable' in expr) {
      const values = expr.characterLevelTable
      if (values.length === 0) err(ctx, where, 'a character level table with no entries')
      if (values.length > MAX_LEVEL) {
        warn(ctx, where, `a character level table of ${values.length} entries; nothing exceeds ${MAX_LEVEL}`)
      }
      if (values.some((v) => !Number.isFinite(v))) {
        err(ctx, where, 'a character level table with a non-numeric entry')
      }
    }

    if ('classLevelTable' in expr) {
      const { classId, values } = expr.classLevelTable
      if (!ctx.content.classes.has(classId)) {
        err(ctx, where, `a level table keyed to class "${classId}", which no content defines`)
      }
      if (values.length === 0) err(ctx, where, `a level table for "${classId}" with no entries`)
      if (values.length > MAX_LEVEL) {
        warn(ctx, where, `a level table of ${values.length} entries; nothing exceeds ${MAX_LEVEL}`)
      }
      if (values.some((v) => !Number.isFinite(v))) {
        err(ctx, where, `a level table for "${classId}" with a non-numeric entry`)
      }
    }
  }
}

/** Class shape: features at reachable levels, subclass options that exist. */
function checkClasses(ctx: Ctx): void {
  for (const [key, c] of ctx.content.classes as Map<string, ClassDefinition>) {
    const featureIds = new Set<string>()
    for (const f of c.features) {
      if (featureIds.has(f.id)) err(ctx, `class ${key}`, `duplicate feature id "${f.id}"`)
      featureIds.add(f.id)

      if (!Number.isInteger(f.grantedAtLevel)
        || f.grantedAtLevel < 1 || f.grantedAtLevel > MAX_LEVEL) {
        err(ctx, `class ${key}`,
          `feature "${f.id}" is granted at level ${f.grantedAtLevel}`)
      }
    }

    if (c.subclassSlot) {
      const { grantedAtLevel, options } = c.subclassSlot
      if (!Number.isInteger(grantedAtLevel) || grantedAtLevel < 1 || grantedAtLevel > MAX_LEVEL) {
        err(ctx, `class ${key}`, `subclass chosen at level ${grantedAtLevel}`)
      }
      if (options.length === 0) {
        err(ctx, `class ${key}`, 'declares a subclass slot with no options')
      }
      // Two different things, kept apart on purpose.
      //
      // An option with no definition is a class whose subclass has not been
      // authored yet — known, tracked, and shrinking to zero as the remaining
      // classes are written. A warning, so the gate stays meaningful while the
      // debt is still countable.
      //
      // An option that IS defined but belongs to another class is a mistake:
      // the collector silently refuses to grant it, so the menu offers a
      // tradition that does nothing when taken. That is an error.
      for (const option of options) {
        const subclass = ctx.content.subclasses.get(option)
        if (!subclass) {
          warn(ctx, `class ${key}`, `offers subclass "${option}", which is not authored yet`)
        } else if (subclass.classId !== key) {
          err(ctx, `class ${key}`,
            `offers subclass "${option}", which belongs to ${subclass.classId}`)
        }
      }
    }

    if (!Number.isInteger(c.hitDie) || c.hitDie < 4) {
      err(ctx, `class ${key}`, `hit die of d${c.hitDie}`)
    }
    if (c.savingThrowProficiencies.length !== 2) {
      warn(ctx, `class ${key}`,
        `${c.savingThrowProficiencies.length} saving throw proficiencies; every SRD class has two`)
    }
  }
}

/**
 * Subclass shape, and the one relationship that cannot be typechecked: a
 * subclass must belong to a class that exists, and no class may reach it
 * except through that class's own slot.
 */
function checkSubclasses(ctx: Ctx): void {
  const offered = new Set<string>()
  for (const c of ctx.content.classes.values()) {
    for (const option of c.subclassSlot?.options ?? []) offered.add(option)
  }

  for (const [key, sc] of ctx.content.subclasses) {
    const owner = ctx.content.classes.get(sc.classId)
    if (!owner) {
      err(ctx, `subclass ${key}`, `belongs to class "${sc.classId}", which no content defines`)
    } else if (!(owner.subclassSlot?.options ?? []).includes(key)) {
      // Defined, owned, and unreachable: the class it claims never offers it,
      // so no character can ever choose it.
      err(ctx, `subclass ${key}`,
        `is not among the subclasses ${sc.classId} offers — nothing can choose it`)
    }

    if (sc.features.length === 0) {
      err(ctx, `subclass ${key}`, 'grants no features at all')
    }

    const featureIds = new Set<string>()
    for (const f of sc.features) {
      if (featureIds.has(f.id)) err(ctx, `subclass ${key}`, `duplicate feature id "${f.id}"`)
      featureIds.add(f.id)
      if (!Number.isInteger(f.grantedAtLevel)
        || f.grantedAtLevel < 1 || f.grantedAtLevel > MAX_LEVEL) {
        err(ctx, `subclass ${key}`, `feature "${f.id}" is granted at level ${f.grantedAtLevel}`)
      }
    }

    // A subclass whose first feature lands before the class offers the choice
    // would be granted to a character who has not chosen it yet.
    const earliest = Math.min(...sc.features.map((f) => f.grantedAtLevel))
    const offeredAt = owner?.subclassSlot?.grantedAtLevel
    if (offeredAt !== undefined && earliest < offeredAt) {
      err(ctx, `subclass ${key}`,
        `grants a feature at level ${earliest}, before ${sc.classId} offers the choice at ${offeredAt}`)
    }
  }

  // The other direction — an offered id with no definition — is checked in
  // checkClasses, where the offer lives.
}

/** Species shape: a subspecies menu of one is a menu, not a mistake, but zero is. */
function checkSpecies(ctx: Ctx): void {
  for (const [key, s] of ctx.content.species as Map<string, SpeciesDefinition>) {
    if (s.subspecies && s.subspecies.length === 0) {
      err(ctx, `species ${key}`, 'declares an empty subspecies list')
    }
    if (s.baseWalkSpeed <= 0) {
      err(ctx, `species ${key}`, `walk speed of ${s.baseWalkSpeed}`)
    }
  }
}

// ---------------------------------------------------------------------------

/**
 * Checks the whole content set and returns everything wrong with it.
 *
 * Errors are things that will produce a wrong or empty result in play.
 * Warnings are debts worth seeing — content that is knowingly unfinished —
 * and are expected to be non-zero while the SRD is still being authored.
 */
export function checkContentIntegrity(content: ContentIndex): Problem[] {
  const spellLists = new Set<string>()
  for (const spell of content.spells.values()) {
    for (const list of spell.lists ?? []) spellLists.add(list)
  }

  const ctx: Ctx = { content, problems: [], spellLists }

  checkKeysMatchIds(ctx)
  checkNoDuplicateRaces(ctx)
  checkClasses(ctx)
  checkSubclasses(ctx)
  checkSpecies(ctx)
  checkResources(ctx)

  for (const { source, where } of allSources(content)) {
    checkSpellGrants(ctx, source, where)
    checkSelections(ctx, source, where)
    checkProficiencies(ctx, source, where)
    for (const m of source.modifiers) {
      checkLevelTables(ctx, m, `${where}#${m.id}`)
    }
  }

  return ctx.problems
}
