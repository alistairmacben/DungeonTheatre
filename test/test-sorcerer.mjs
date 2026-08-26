// The sorcerer's known-spells table.
//
// Converting its slots to the level ladder surfaced a bigger gap: the class
// had no spell grant at all — no cantrips, no known-spells selection, nothing
// on either column of the class table. This is the fix, checked two ways: the
// transcribed table resolves the right count at every level, and a character
// built through the real creation flow — the same function CreateCharacter.tsx
// calls — actually knows spells rather than holding slots with nothing to
// spend them on.

import { createCharacter, loadContent, playerViewOf } from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()

function sorcerer(level) {
  return {
    id: 'c:s', campaignId: 'camp-1', name: 'Sera', playerId: 'p',
    speciesId: 'srd:species.human',
    classLevels: [{ classId: 'srd:class.sorcerer', level }],
    abilityScoreBase: { str: 8, dex: 14, con: 13, int: 10, wis: 12, cha: 15 },
    buildChoices: [], hitPointsCurrent: 10, hitPointsTemp: 0,
    hitDiceSpent: {}, resourcesSpent: {}, conditions: [], effectInstances: [],
    exhaustionLevel: 0,
    inventory: { instances: [], equipped: {}, attunedInstanceIds: [] },
    deathSaves: { successes: 0, failures: 0 }, toggles: {}, spellsPrepared: []
  }
}

// A pending choice's id is "<sourceId>:<selectionId>" — one row per level's
// feature, since each level-gated grant is its own EffectSource. Summing every
// row ending in ":cantrips" or ":spells" is exactly the cumulative total an
// unanswered character is offered, level over level.
const countPending = (level, selId) => {
  const view = playerViewOf(sorcerer(level), content, { detail: 'inspect' })
  return (view.progression.pendingChoices ?? [])
    .filter((p) => p.id.endsWith(`:${selId}`))
    .reduce((n, p) => n + p.count, 0)
}

// ---------------------------------------------------------------------------
// The table, read off docs/srd-source/classes.pdf p42
// ---------------------------------------------------------------------------

{
  // Cantrips Known: 4 for three levels, 5 for six, then 6. Cumulative totals,
  // read by summing every level-gated selection up to and including `level` —
  // which is exactly what an unanswered character is offered.
  check.eq('cantrips: 4 pending at level 1', countPending(1, 'cantrips'), 4)
  check.eq('cantrips: still 4 at level 3, no new one at 2nd or 3rd',
    countPending(3, 'cantrips'), 4)
  check.eq('cantrips: 5 from level 4', countPending(4, 'cantrips'), 5)
  check.eq('cantrips: still 5 at level 9', countPending(9, 'cantrips'), 5)
  check.eq('cantrips: 6 from level 10, and no more after', countPending(20, 'cantrips'), 6)

  // Spells Known climbs almost every level but flatlines at 12, 14, 16, 18-20 —
  // the levels an Ability Score Improvement lands instead of a new spell.
  check.eq('spells: 2 at level 1', countPending(1, 'spells'), 2)
  check.eq('spells: 5 at level 4', countPending(4, 'spells'), 5)
  check.eq('spells: 12 at level 11', countPending(11, 'spells'), 12)
  check.eq('spells: still 12 at level 12 — an ASI level, not a spell level',
    countPending(12, 'spells'), 12)
  check.eq('spells: 15 at level 17, and no more after', countPending(20, 'spells'), 15)
}

// ---------------------------------------------------------------------------
// End to end: the same function the real creation flow calls
// ---------------------------------------------------------------------------

{
  const result = createCharacter({
    id: 'c:new', campaignId: 'camp-1', name: 'Fresh Sorcerer',
    speciesId: 'srd:species.human', classId: 'srd:class.sorcerer',
    abilityScores: { str: 8, dex: 14, con: 13, int: 10, wis: 12, cha: 15 }
  }, content)

  check('creation: a level-1 sorcerer builds with no problems',
    result.problems.length === 0, JSON.stringify(result.problems))

  const character = result.character
  check('creation: and auto-answers its level-1 spell choices',
    character?.selections !== undefined, JSON.stringify(character?.selections))

  const known = character.selections['srd:class.sorcerer.known-1']
  check.eq('creation: exactly 4 cantrips chosen', known?.cantrips?.length, 4)
  check.eq('creation: exactly 2 spells chosen', known?.spells?.length, 2)

  const view = playerViewOf(character, content, { detail: 'inspect' })
  check.eq('creation: the sheet actually lists 6 known spells',
    view.spellcasting?.spells.length, 6, JSON.stringify(view.spellcasting?.spells.map((s) => s.label)))

  const missile = view.spellcasting.spells.find((s) => s.label === 'Magic Missile')
  check('creation: Magic Missile is one of them, chosen first from its pool',
    missile !== undefined)
}

check.report()
