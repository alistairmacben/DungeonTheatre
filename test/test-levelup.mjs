// Phase J — level-up.
//
// Two engine gaps closed at once: `levelUp`/`answerBuildChoice`/
// `answerSelection` are the first commands that let a player answer a
// choice at all (previously only creation's deterministic auto-fill ever
// touched `selections`, and ASI/feat/subclass weren't tracked as pending
// choices anywhere), and `abilityScoreImprovement` build choices — declared
// in the type since day one — actually raise an ability score now instead
// of doing nothing.
//
// Checked against docs/roadmap.md Phase J.

import {
  applyCommand, checkContentIntegrity, createResolution, loadContent, playerViewOf
} from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()

const item = (instanceId, definitionId) =>
  ({ instanceId, definitionId, contentVersion: 1, identified: true })

function fighter(level, overrides = {}) {
  return {
    id: 'c:x', campaignId: 'camp-1', name: 'Test', playerId: 'p',
    speciesId: 'srd:species.human',
    classLevels: [{ classId: 'srd:class.fighter', level }],
    abilityScoreBase: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
    buildChoices: [], hitPointsCurrent: 1, hitPointsTemp: 0,
    hitDiceSpent: {}, resourcesSpent: {}, conditions: [], effectInstances: [],
    exhaustionLevel: 0,
    inventory: { instances: [item('d', 'srd:weapon.dagger')], equipped: { mainHand: 'd' }, attunedInstanceIds: [] },
    deathSaves: { successes: 0, failures: 0 }, toggles: {}, spellsPrepared: [],
    selections: {}, ...overrides
  }
}

const hpMax = (c) => createResolution(c, content).stat('hitPoints.max').total
const view = (c) => playerViewOf(c, content, { detail: 'inspect' })

// ---------------------------------------------------------------------------
// levelUp: HP grows by the average-formula delta, damage taken survives
// ---------------------------------------------------------------------------

{
  let c = fighter(1)
  c.hitPointsCurrent = hpMax(c) // full health at level 1
  const before = hpMax(c)

  const result = applyCommand(c, { type: 'levelUp', characterId: c.id, classId: 'srd:class.fighter' }, content)
  check('levelUp: not rejected', result.rejected === undefined, JSON.stringify(result.rejected))
  check.eq('levelUp: class level rises to 2', result.character.classLevels[0].level, 2)

  const after = hpMax(result.character)
  check('levelUp: HP max grows', after > before, `${before} -> ${after}`)
  check.eq('levelUp: current HP rose by exactly the max delta, from full health',
    result.character.hitPointsCurrent, before + (after - before))

  // Now take damage and level again — the increase should still land, not heal.
  c = result.character
  c.hitPointsCurrent -= 5
  const damagedBefore = hpMax(c)
  const r2 = applyCommand(c, { type: 'levelUp', characterId: c.id, classId: 'srd:class.fighter' }, content)
  const damagedAfter = hpMax(r2.character)
  check.eq('levelUp: damage taken survives the recompute — current rises by the delta, not to full',
    r2.character.hitPointsCurrent, (c.hitPointsCurrent) + (damagedAfter - damagedBefore))

  const rejectedClass = applyCommand(c, { type: 'levelUp', characterId: c.id, classId: 'srd:class.wizard' }, content)
  check('levelUp: rejects a class the character has no levels in', rejectedClass.rejected !== undefined)
}

// ---------------------------------------------------------------------------
// pendingChoices: ASI/feat and subclass are tracked now — they never were
// ---------------------------------------------------------------------------

{
  const level3 = view(fighter(3)).progression.pendingChoices
  check('pendingChoices: no ASI owed yet at level 3', !level3.some((p) => p.kind === 'abilityScoreImprovement'))
  check('pendingChoices: but a subclass is, from level 3 on',
    level3.some((p) => p.kind === 'subclass' && p.id === 'srd:class.fighter:subclass'))

  const level4 = view(fighter(4)).progression.pendingChoices
  const asi = level4.find((p) => p.kind === 'abilityScoreImprovement')
  check('pendingChoices: an ASI/feat choice appears exactly at level 4', asi !== undefined)
  check.eq('pendingChoices: it names the level it was granted at', asi?.atLevel, 4)
  check('pendingChoices: it lists real feat names to pick from, not raw ids',
    asi?.options?.some((f) => f.label === 'Tough'))

  const answered = fighter(4, { buildChoices: [{ atLevel: 4, kind: 'feat', value: 'srd:feat.tough' }] })
  check('pendingChoices: answering it removes it from the list',
    !view(answered).progression.pendingChoices.some((p) => p.kind === 'abilityScoreImprovement'))

  const withSubclass = fighter(3, { classLevels: [{ classId: 'srd:class.fighter', level: 3, subclassId: 'srd:subclass.champion' }] })
  check('pendingChoices: choosing a subclass removes its own pending choice',
    !view(withSubclass).progression.pendingChoices.some((p) => p.kind === 'subclass'))
}

// ---------------------------------------------------------------------------
// answerBuildChoice: abilityScoreImprovement actually raises the score now
// ---------------------------------------------------------------------------

{
  const c = fighter(4)
  const before = createResolution(c, content).stat('ability.str.score').total
  const result = applyCommand(c, {
    type: 'answerBuildChoice', characterId: c.id, atLevel: 4,
    kind: 'abilityScoreImprovement', value: { str: 2 }
  }, content)
  check('answerBuildChoice: not rejected', result.rejected === undefined, JSON.stringify(result.rejected))
  const after = createResolution(result.character, content).stat('ability.str.score').total
  check.eq('answerBuildChoice: Strength actually rose by 2 — the collect.ts gap is closed', after, before + 2)

  // 15 base + human's +1 to every ability + this ASI (2) = 18; a second +2
  // lands exactly on the 20 cap.
  const twice = applyCommand(result.character, {
    type: 'answerBuildChoice', characterId: c.id, atLevel: 8, kind: 'abilityScoreImprovement', value: { str: 2 }
  }, content)
  const afterTwice = createResolution(twice.character, content).stat('ability.str.score').total
  check.eq('answerBuildChoice: a second ASI stacks correctly', afterTwice, 20)

  const capped = applyCommand(twice.character, {
    type: 'answerBuildChoice', characterId: c.id, atLevel: 12, kind: 'abilityScoreImprovement', value: { str: 2 }
  }, content)
  const afterCapped = createResolution(capped.character, content).stat('ability.str.score').total
  check.eq('answerBuildChoice: the ability score cap (20) still clamps a third ASI', afterCapped, 20)

  const badSplit = applyCommand(c, {
    type: 'answerBuildChoice', characterId: c.id, atLevel: 4, kind: 'abilityScoreImprovement', value: { str: 1 }
  }, content)
  check('answerBuildChoice: a lone +1 (not +2, not +1/+1) is rejected', badSplit.rejected !== undefined)
}

// ---------------------------------------------------------------------------
// answerBuildChoice: feat, gated on its own prerequisite
// ---------------------------------------------------------------------------

{
  const c = fighter(4)
  const ok = applyCommand(c, {
    type: 'answerBuildChoice', characterId: c.id, atLevel: 4, kind: 'feat', value: 'srd:feat.tough'
  }, content)
  check('answerBuildChoice: a feat with no prerequisite succeeds', ok.rejected === undefined)
  check('answerBuildChoice: and its effects reach the sheet',
    view(ok.character).effects.some((e) => e.label === 'Tough'))

  // Heavily Armored requires Strength 13+ and medium armour proficiency —
  // this fighter has the proficiency but Strength 15 already clears 13, so
  // pick a feat this fighter genuinely fails instead: Elemental Adept
  // requires the ability to cast spells, which a fighter cannot.
  const blocked = applyCommand(c, {
    type: 'answerBuildChoice', characterId: c.id, atLevel: 4, kind: 'feat', value: 'srd:feat.elemental-adept'
  }, content)
  check('answerBuildChoice: a feat whose prerequisite fails is rejected, with a reason',
    blocked.rejected !== undefined && blocked.rejected.reasons[0].length > 0)
}

// ---------------------------------------------------------------------------
// answerBuildChoice: subclass, gated on the class's own options
// ---------------------------------------------------------------------------

{
  const c = fighter(3)
  const ok = applyCommand(c, {
    type: 'answerBuildChoice', characterId: c.id, atLevel: 3, kind: 'subclass', value: 'srd:subclass.champion'
  }, content)
  check('answerBuildChoice: a real subclass option succeeds', ok.rejected === undefined)
  check.eq('answerBuildChoice: and is recorded on the class level',
    ok.character.classLevels[0].subclassId, 'srd:subclass.champion')

  const wrong = applyCommand(c, {
    type: 'answerBuildChoice', characterId: c.id, atLevel: 3, kind: 'subclass', value: 'srd:subclass.berserker'
  }, content)
  check('answerBuildChoice: a subclass belonging to another class is rejected', wrong.rejected !== undefined)
}

// ---------------------------------------------------------------------------
// answerSelection: the first interactive path into `character.selections`
// ---------------------------------------------------------------------------

{
  // A wizard's Cantrips Known selection: 3 at level 1.
  function wizard(level, overrides = {}) {
    return {
      id: 'c:w', campaignId: 'camp-1', name: 'Test', playerId: 'p',
      speciesId: 'srd:species.human',
      classLevels: [{ classId: 'srd:class.wizard', level }],
      abilityScoreBase: { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 },
      buildChoices: [], hitPointsCurrent: 10, hitPointsTemp: 0,
      hitDiceSpent: {}, resourcesSpent: {}, conditions: [], effectInstances: [],
      exhaustionLevel: 0,
      inventory: { instances: [], equipped: {}, attunedInstanceIds: [] },
      deathSaves: { successes: 0, failures: 0 }, toggles: {}, spellsPrepared: [],
      selections: {}, ...overrides
    }
  }

  const c = wizard(1)
  const pending = view(c).progression.pendingChoices.find((p) => p.kind === 'spellList')
  check('answerSelection: the cantrip choice is pending before any answer', pending !== undefined)

  const result = applyCommand(c, {
    type: 'answerSelection', characterId: c.id,
    sourceId: pending.id.split(':').slice(0, -1).join(':'),
    selectionId: pending.id.split(':').at(-1),
    values: ['srd:spell.fire-bolt', 'srd:spell.ray-of-frost', 'srd:spell.prestidigitation']
  }, content)
  check('answerSelection: not rejected', result.rejected === undefined, JSON.stringify(result.rejected))

  const after = view(result.character)
  check('answerSelection: Fire Bolt now appears on the sheet',
    after.spellcasting.spells.some((s) => s.id === 'srd:spell.fire-bolt'))
  check('answerSelection: the pending choice is gone',
    !after.progression.pendingChoices.some((p) => p.kind === 'spellList'))

  const tooMany = applyCommand(c, {
    type: 'answerSelection', characterId: c.id,
    sourceId: pending.id.split(':').slice(0, -1).join(':'),
    selectionId: pending.id.split(':').at(-1),
    values: ['srd:spell.fire-bolt', 'srd:spell.ray-of-frost', 'srd:spell.prestidigitation', 'srd:spell.mage-hand']
  }, content)
  check('answerSelection: more values than the selection allows is rejected', tooMany.rejected !== undefined)

  const badValue = applyCommand(c, {
    type: 'answerSelection', characterId: c.id,
    sourceId: pending.id.split(':').slice(0, -1).join(':'),
    selectionId: pending.id.split(':').at(-1),
    values: ['srd:spell.fireball']
  }, content)
  check('answerSelection: a value outside the offered list is rejected', badValue.rejected !== undefined)
}

// ---------------------------------------------------------------------------
// The gate every batch passes
// ---------------------------------------------------------------------------

{
  const problems = checkContentIntegrity(content)
  const errors = problems.filter((p) => p.severity === 'error')
  check('integrity: level-up introduces no errors',
    errors.length === 0, errors.map((p) => `${p.where}: ${p.message}`).join(' | '))
}

check.report()
