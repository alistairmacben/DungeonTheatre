// The bard's known-spells table, extended to level 20.
//
// The same gap the sorcerer had, in its sibling class: spellsKnownAtLevel
// existed and worked, but was only ever called for levels 2 through 5. A
// level-10 bard's Magical Secrets — the two levels where Spells Known jumps
// by 2 instead of 1 — had nowhere to land.

import { createCharacter, loadContent, playerViewOf } from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()

function bard(level) {
  return {
    id: 'c:b', campaignId: 'camp-1', name: 'Lior', playerId: 'p',
    speciesId: 'srd:species.half-elf',
    classLevels: [{ classId: 'srd:class.bard', level }],
    abilityScoreBase: { str: 8, dex: 14, con: 13, int: 10, wis: 12, cha: 15 },
    buildChoices: [], hitPointsCurrent: 10, hitPointsTemp: 0,
    hitDiceSpent: {}, resourcesSpent: {}, conditions: [], effectInstances: [],
    exhaustionLevel: 0,
    inventory: { instances: [], equipped: {}, attunedInstanceIds: [] },
    deathSaves: { successes: 0, failures: 0 }, toggles: {}, spellsPrepared: []
  }
}

const countPending = (level, selId) => {
  const view = playerViewOf(bard(level), content, { detail: 'inspect' })
  return (view.progression.pendingChoices ?? [])
    .filter((p) => p.id.endsWith(`:${selId}`))
    .reduce((n, p) => n + p.count, 0)
}

// ---------------------------------------------------------------------------
// The table, read off docs/srd-source/classes.pdf p11
// ---------------------------------------------------------------------------

{
  check.eq('cantrips: 2 at level 1', countPending(1, 'cantrips'), 2)
  check.eq('cantrips: 3 from level 4', countPending(4, 'cantrips'), 3)
  check.eq('cantrips: 4 from level 10, and no more after', countPending(20, 'cantrips'), 4)

  check.eq('spells: 4 at level 1', countPending(1, 'spells'), 4)
  check.eq('spells: 12 at level 9', countPending(9, 'spells'), 12)
  // Magical Secrets: +2 rather than +1 at 10th, 14th and 18th.
  check.eq('spells: 14 at level 10 — a jump of 2, not 1', countPending(10, 'spells'), 14)
  check.eq('spells: still 15 at level 12 — an ASI level', countPending(12, 'spells'), 15)
  check.eq('spells: 18 at level 14 — another jump of 2', countPending(14, 'spells'), 18)
  check.eq('spells: 22 at level 18, and no more after', countPending(20, 'spells'), 22)
}

// ---------------------------------------------------------------------------
// End to end: the same function the real creation flow calls
// ---------------------------------------------------------------------------

{
  const result = createCharacter({
    id: 'c:new', campaignId: 'camp-1', name: 'Fresh Bard',
    speciesId: 'srd:species.half-elf', classId: 'srd:class.bard',
    abilityScores: { str: 8, dex: 14, con: 13, int: 10, wis: 12, cha: 15 }
  }, content)

  check('creation: a level-1 bard builds with no problems',
    result.problems.length === 0, JSON.stringify(result.problems))

  const view = playerViewOf(result.character, content, { detail: 'inspect' })
  check.eq('creation: the sheet lists 6 known spells (2 cantrips + 4 spells)',
    view.spellcasting?.spells.length, 6,
    JSON.stringify(view.spellcasting?.spells.map((s) => s.label)))
}

check.report()
