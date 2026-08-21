// Character creation.
//
// The claim under test: `createCharacter` turns a creation form's answers into
// a Character that resolves cleanly through the same pipeline every other
// character does — no special-casing, no half-built state. Every registered
// class's starting kit is exercised, because a kit referencing an item that
// does not exist would otherwise only surface the first time a real player
// picked that class.

import {
  createCharacter, loadContent, playerViewOf, STANDARD_ARRAY, validateCharacter
} from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()

const standardAssignment = (order) => {
  const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha']
  const scores = {}
  order.forEach((ability, i) => { scores[ability] = STANDARD_ARRAY[i] })
  // Fill in any ability not explicitly ordered with whatever is left, so
  // callers can specify only the abilities they care about.
  const used = new Set(order)
  const remaining = STANDARD_ARRAY.filter((_, i) => !used.has(order[i]))
  let ri = 0
  for (const a of abilities) if (scores[a] === undefined) scores[a] = remaining[ri++]
  return scores
}

// ---------------------------------------------------------------------------
// The happy path
// ---------------------------------------------------------------------------

{
  const result = createCharacter({
    id: 'c:new1', campaignId: 'camp-1', name: 'Test Fighter',
    speciesId: 'srd:species.dwarf', subspeciesId: 'srd:species.dwarf.hill',
    classId: 'srd:class.fighter',
    abilityScores: standardAssignment(['str', 'con', 'dex', 'wis', 'int', 'cha'])
  }, content)

  check('creation: it succeeds', result.character !== undefined,
    result.problems.map((p) => p.message).join('; '))
  check('creation: no problems reported', result.problems.length === 0,
    result.problems.map((p) => p.message).join('; '))
  check('creation: the name is trimmed and set', result.character.name === 'Test Fighter')
  check('creation: starts at level 1',
    result.character.classLevels[0].level === 1)
  check('creation: hit points start at the derived maximum, not zero',
    result.character.hitPointsCurrent > 0, result.character.hitPointsCurrent)

  const view = playerViewOf(result.character, content, { detail: 'inspect' })
  check('creation: hit points current equals the view max exactly',
    result.character.hitPointsCurrent === view.vitals.hitPoints.max.value,
    `${result.character.hitPointsCurrent} vs ${view.vitals.hitPoints.max.value}`)
  check('creation: the character has a weapon equipped',
    Object.keys(result.character.inventory.equipped).length > 0)
  check('creation: and can act', view.actions.some((a) => a.available))
  check('creation: it passes the engine\'s own validation',
    validateCharacter(result.character).length === 0,
    validateCharacter(result.character).map((p) => p.message).join('; '))
}

// ---------------------------------------------------------------------------
// Every registered class produces a coherent, resolvable character
// ---------------------------------------------------------------------------

{
  const classIds = [...content.classes.keys()]
  check('creation: at least the ten known classes are registered',
    classIds.length >= 10, classIds.join(', '))

  const broken = []
  for (const classId of classIds) {
    const result = createCharacter({
      id: `c:sweep:${classId}`, campaignId: 'camp-1', name: 'Sweep',
      speciesId: 'srd:species.human', classId,
      abilityScores: standardAssignment(['str', 'con', 'dex', 'wis', 'int', 'cha'])
    }, content)

    if (!result.character) {
      broken.push(`${classId}: ${result.problems.map((p) => p.message).join('; ')}`)
      continue
    }
    try {
      const v = playerViewOf(result.character, content)
      if (v.vitals.hitPoints.max.value <= 0) broken.push(`${classId}: non-positive HP max`)
      // Every kit item must be real content, or equipping it silently does
      // nothing and the player opens their inventory to find an empty slot.
      for (const inst of result.character.inventory.instances) {
        if (!content.items.has(inst.definitionId)) {
          broken.push(`${classId}: kit references unknown item "${inst.definitionId}"`)
        }
      }
    } catch (e) {
      broken.push(`${classId}: threw ${String(e).slice(0, 80)}`)
    }
  }
  check(`creation: every class's starting kit builds a coherent character`,
    broken.length === 0, broken.join(' | '))
}

// ---------------------------------------------------------------------------
// Species and subspecies
// ---------------------------------------------------------------------------

{
  const noSub = createCharacter({
    id: 'c:nosub', campaignId: 'camp-1', name: 'X',
    speciesId: 'srd:species.dwarf', classId: 'srd:class.fighter',
    abilityScores: standardAssignment(['str'])
  }, content)
  check('creation: a species requiring a subspecies is refused without one',
    noSub.character === undefined)
  check('creation: and says which species needed it',
    noSub.problems.some((p) => p.message.includes('Dwarf')),
    noSub.problems.map((p) => p.message).join('; '))

  const wrongSub = createCharacter({
    id: 'c:wrongsub', campaignId: 'camp-1', name: 'X',
    speciesId: 'srd:species.dwarf', subspeciesId: 'srd:species.elf.high',
    classId: 'srd:class.fighter',
    abilityScores: standardAssignment(['str'])
  }, content)
  check('creation: a subspecies from the wrong species is refused',
    wrongSub.character === undefined)

  const noSubNeeded = createCharacter({
    id: 'c:human', campaignId: 'camp-1', name: 'X',
    speciesId: 'srd:species.human', subspeciesId: 'srd:species.dwarf.hill',
    classId: 'srd:class.fighter',
    abilityScores: standardAssignment(['str'])
  }, content)
  check('creation: a subspecies offered where none exists is refused',
    noSubNeeded.character === undefined)

  const unknownSpecies = createCharacter({
    id: 'c:ghost', campaignId: 'camp-1', name: 'X',
    speciesId: 'srd:species.beholderkin', classId: 'srd:class.fighter',
    abilityScores: standardAssignment(['str'])
  }, content)
  check('creation: an unknown species is refused', unknownSpecies.character === undefined)

  const unknownClass = createCharacter({
    id: 'c:noclass', campaignId: 'camp-1', name: 'X',
    speciesId: 'srd:species.human', classId: 'srd:class.beekeeper',
    abilityScores: standardAssignment(['str'])
  }, content)
  check('creation: an unknown class is refused', unknownClass.character === undefined)
}

// ---------------------------------------------------------------------------
// Ability scores must be the standard array, no more and no less
// ---------------------------------------------------------------------------

{
  const tooHigh = createCharacter({
    id: 'c:cheat', campaignId: 'camp-1', name: 'X',
    speciesId: 'srd:species.human', classId: 'srd:class.fighter',
    abilityScores: { str: 18, dex: 14, con: 13, int: 12, wis: 10, cha: 8 }
  }, content)
  check('creation: a score outside the standard array is refused',
    tooHigh.character === undefined)

  const duplicated = createCharacter({
    id: 'c:dup', campaignId: 'camp-1', name: 'X',
    speciesId: 'srd:species.human', classId: 'srd:class.fighter',
    abilityScores: { str: 15, dex: 15, con: 13, int: 12, wis: 10, cha: 8 }
  }, content)
  check('creation: reusing a value instead of using each once is refused',
    duplicated.character === undefined)

  const missing = createCharacter({
    id: 'c:missing', campaignId: 'camp-1', name: 'X',
    speciesId: 'srd:species.human', classId: 'srd:class.fighter',
    abilityScores: { str: 15, dex: 14, con: 13, int: 12, wis: 10 }
  }, content)
  check('creation: a missing ability is refused', missing.character === undefined)

  // Different assignments of the same array must produce different, correct
  // modifiers — proving the values actually land where the player put them.
  const strBuild = createCharacter({
    id: 'c:str', campaignId: 'camp-1', name: 'X',
    speciesId: 'srd:species.human', classId: 'srd:class.fighter',
    abilityScores: standardAssignment(['str', 'con', 'dex', 'wis', 'int', 'cha'])
  }, content)
  const dexBuild = createCharacter({
    id: 'c:dex', campaignId: 'camp-1', name: 'X',
    speciesId: 'srd:species.human', classId: 'srd:class.fighter',
    abilityScores: standardAssignment(['dex', 'con', 'str', 'wis', 'int', 'cha'])
  }, content)
  const strView = playerViewOf(strBuild.character, content)
  const dexView = playerViewOf(dexBuild.character, content)
  check('creation: putting the top score in a different ability changes the character',
    strView.abilities.find((a) => a.ability === 'str').score.value
      !== dexView.abilities.find((a) => a.ability === 'str').score.value)
}

// ---------------------------------------------------------------------------
// A blank name is refused
// ---------------------------------------------------------------------------

{
  const blank = createCharacter({
    id: 'c:blank', campaignId: 'camp-1', name: '   ',
    speciesId: 'srd:species.human', classId: 'srd:class.fighter',
    abilityScores: standardAssignment(['str'])
  }, content)
  check('creation: a whitespace-only name is refused', blank.character === undefined)
}

check.report()
