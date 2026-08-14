// Fixture builders for the rules-engine suites.
//
// Deliberately minimal: enough content to exercise the vocabulary, none of the
// SRD dataset. Every builder produces content of the *same type* regardless of
// provenance, which is what the unification test relies on.

import { createContentIndex } from './bundle/rules.mjs'

let seq = 0
const uid = (p) => `${p}-${++seq}`

export function makeCharacter(overrides = {}) {
  return {
    id: 'char-1',
    campaignId: 'camp-1',
    name: 'Test Character',
    speciesId: 'test:species',
    classLevels: [{ classId: 'test:class', level: 5 }],
    abilityScoreBase: { str: 10, dex: 14, con: 12, int: 10, wis: 10, cha: 10 },
    buildChoices: [],
    hitPointsCurrent: 30,
    hitPointsTemp: 0,
    hitDiceSpent: {},
    resourcesSpent: {},
    conditions: [],
    effectInstances: [],
    exhaustionLevel: 0,
    inventory: { instances: [], equipped: {}, attunedInstanceIds: [] },
    deathSaves: { successes: 0, failures: 0 },
    toggles: {},
    ...overrides
  }
}

/** An EffectSource with sensible defaults. Used for every kind of content. */
export function makeSource(overrides = {}) {
  return {
    id: uid('src'),
    name: 'Test Source',
    provenance: 'srd',
    contentVersion: 1,
    kind: 'feature',
    activation: { always: true },
    modifiers: [],
    completeness: 'complete',
    ...overrides
  }
}

export const valueMod = (target, op, value, extra = {}) => ({
  id: uid('mod'), channel: 'value', target, op, value, permanence: 'persistent', ...extra
})

export const suppressMod = (suppresses, extra = {}) => ({
  id: uid('mod'), channel: 'value', op: 'suppress', suppresses,
  permanence: 'persistent', ...extra
})

export const rollMod = (rollOp, scope, extra = {}) => ({
  id: uid('mod'), channel: 'roll', rollOp, scope, permanence: 'persistent', ...extra
})

export const capMod = (capability, capOp, extra = {}) => ({
  id: uid('mod'), channel: 'capability', capability, capOp,
  permanence: 'persistent', ...extra
})

export const profGrant = (scope, level, extra = {}) => ({
  id: uid('prof'), scope, level, rounding: 'floor', grantsProficiency: true, ...extra
})

/**
 * Builds a content index and attaches the given sources as ambient content, so
 * a test can put a modifier in play without inventing a species or an item.
 */
export function makeContent(sources = [], extra = {}) {
  const content = createContentIndex()
  content.ambient = sources
  if (extra.species) for (const s of extra.species) content.species.set(s.id, s)
  if (extra.classes) for (const c of extra.classes) content.classes.set(c.id, c)
  if (extra.feats) for (const f of extra.feats) content.feats.set(f.id, f)
  if (extra.items) for (const i of extra.items) content.items.set(i.id, i)
  if (extra.spells) for (const s of extra.spells) content.spells.set(s.id, s)
  return content
}

// --- assertions -------------------------------------------------------------

export function makeChecker() {
  const results = []
  const check = (name, ok, detail) => results.push([name, !!ok, detail])
  check.eq = (name, actual, expected) =>
    check(name, actual === expected, `expected ${expected}, got ${actual}`)
  check.report = () => {
    console.log('=== CHECKS ===')
    let failed = 0
    for (const [name, ok, detail] of results) {
      console.log(` ${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail ? `  — ${detail}` : ''}`)
      if (!ok) failed++
    }
    console.log(failed === 0 ? '\nALL PASS' : `\n${failed} FAILED`)
    process.exit(failed === 0 ? 0 : 1)
  }
  return check
}

/** Term lookup helper — tests assert on explanations, not just totals. */
export const termFor = (value, sourceIdOrName) =>
  value.terms.find((t) => t.sourceId === sourceIdOrName || t.sourceName === sourceIdOrName)
