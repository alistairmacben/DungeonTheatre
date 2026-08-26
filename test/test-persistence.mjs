// Storing and reloading a character.
//
// The claim: a Character round-trips through JSON unchanged, and when the
// content set moves under a stored sheet the mismatch is *reported* rather than
// silently absorbed or silently migrated. A player whose sword vanished because
// an item id was renamed is entitled to be told.

import {
  applyCommand, checkContentDrift, decodeSheet, encodeSheet, loadContent,
  playerViewOf, SHEET_SCHEMA
} from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()

const item = (instanceId, definitionId, extra = {}) =>
  ({ instanceId, definitionId, contentVersion: 1, identified: true, ...extra })

const FIGHTER = {
  id: 'c:fighter', campaignId: 'camp-1', name: 'Sir Aldren', playerId: 'p1',
  speciesId: 'srd:species.dwarf', subspeciesId: 'srd:species.dwarf.hill',
  classLevels: [{ classId: 'srd:class.fighter', level: 5 }],
  abilityScoreBase: { str: 16, dex: 12, con: 13, int: 10, wis: 12, cha: 8 },
  buildChoices: [{ atLevel: 4, kind: 'feat', value: 'srd:feat.tough' }],
  hitPointsCurrent: 47, hitPointsTemp: 0, hitDiceSpent: {}, resourcesSpent: {},
  conditions: [], effectInstances: [], exhaustionLevel: 0,
  inventory: {
    instances: [
      item('i-mail', 'srd:armor.chain-mail'),
      item('i-shield', 'srd:armor.shield'),
      item('i-sword', 'srd:weapon.longsword'),
      item('i-cloak', 'srd:item.cloak-of-protection')
    ],
    equipped: { armor: 'i-mail', shield: 'i-shield', mainHand: 'i-sword', cloak: 'i-cloak' },
    attunedInstanceIds: ['i-cloak']
  },
  deathSaves: { successes: 0, failures: 0 },
  toggles: { 'wearing-armor': true, 'fighter.style.defense': true },
  selections: { 'srd:class.fighter.proficiencies': { skills: ['athletics', 'perception'] } }
}

// ---------------------------------------------------------------------------
// The round trip
// ---------------------------------------------------------------------------

{
  // Through a real JSON string, not structuredClone: the column is jsonb, so
  // anything that does not survive JSON.stringify does not survive storage.
  const wire = JSON.stringify(encodeSheet(FIGHTER))
  const result = decodeSheet(JSON.parse(wire), content)

  check('roundtrip: it decodes', result.character !== undefined,
    result.problems.map((p) => p.message).join('; '))
  check('roundtrip: with no problems at all', result.problems.length === 0,
    result.problems.map((p) => `${p.severity}: ${p.message}`).join('; '))
  check('roundtrip: byte-identical to the original',
    JSON.stringify(result.character) === JSON.stringify(FIGHTER))

  // The thing that actually matters: the same character resolves the same.
  const before = playerViewOf(FIGHTER, content, { detail: 'inspect' })
  const after = playerViewOf(result.character, content, { detail: 'inspect' })
  check('roundtrip: and resolves to an identical view',
    JSON.stringify(before) === JSON.stringify(after))

  check('roundtrip: the envelope carries a schema version',
    JSON.parse(wire).schema === SHEET_SCHEMA)
}

// ---------------------------------------------------------------------------
// State that has actually changed must survive too
// ---------------------------------------------------------------------------

{
  // A character mid-session: hurt, a resource spent, a condition on them.
  let c = FIGHTER
  c = applyCommand(c, { type: 'dmDamage', characterId: c.id, amount: 20, damageType: 'slashing' }, content).character
  c = applyCommand(c, { type: 'useAbility', characterId: c.id, actionId: 'fighter.second-wind.use', sourceId: 'x' }, content).character
  c = applyCommand(c, {
    type: 'applyCondition', characterId: c.id,
    conditionId: 'srd:condition.poisoned', sourceId: 'dm:narration'
  }, content).character
  c = applyCommand(c, { type: 'unequipItem', characterId: c.id, slot: 'shield' }, content).character

  const result = decodeSheet(JSON.parse(JSON.stringify(encodeSheet(c))), content)
  check('mid-session: it survives storage', result.character !== undefined,
    result.problems.map((p) => p.message).join('; '))
  check('mid-session: hit points are preserved', result.character.hitPointsCurrent === 27,
    result.character.hitPointsCurrent)
  check('mid-session: spent resources are preserved',
    result.character.resourcesSpent['fighter.second-wind'] === 1)
  check('mid-session: conditions are preserved', result.character.conditions.length === 1)
  check('mid-session: the unequipped slot is preserved',
    result.character.inventory.equipped.shield === undefined)
  check('mid-session: and the AC reflects all of it',
    playerViewOf(result.character, content).vitals.armorClass.value === 18,
    playerViewOf(result.character, content).vitals.armorClass.value)
}

// ---------------------------------------------------------------------------
// A DM-composed effect is part of the character and must persist
// ---------------------------------------------------------------------------

{
  const cursed = applyCommand(FIGHTER, {
    type: 'dmApplyEffect', characterId: FIGHTER.id,
    effect: {
      id: 'dm:curse.leaden-limbs', name: 'Leaden Limbs',
      provenance: 'dm', contentVersion: 1, kind: 'environment',
      activation: { always: true }, completeness: 'complete',
      modifiers: [{
        id: 'dm-m1', channel: 'value', target: 'speed.walk', op: 'add',
        value: -10, permanence: 'temporary'
      }]
    }
  }, content).character

  const result = decodeSheet(JSON.parse(JSON.stringify(encodeSheet(cursed))), content)
  check('adhoc: an improvised effect survives storage',
    result.character.adHocSources.length === 1)
  check('adhoc: and still resolves after reloading',
    playerViewOf(result.character, content).vitals.speed.value === 15,
    playerViewOf(result.character, content).vitals.speed.value)
  // It references no content, so it must not be reported as drift.
  check('adhoc: it is not mistaken for missing content',
    result.problems.length === 0,
    result.problems.map((p) => p.message).join('; '))
}

// ---------------------------------------------------------------------------
// Content drift — reported, never silently absorbed
// ---------------------------------------------------------------------------

{
  const renamed = {
    ...FIGHTER,
    inventory: {
      ...FIGHTER.inventory,
      instances: [...FIGHTER.inventory.instances, item('i-ghost', 'srd:weapon.vorpal-nonsense')]
    }
  }
  const problems = checkContentDrift(renamed, content)
  check('drift: a missing item is reported',
    problems.some((p) => p.message.includes('vorpal-nonsense')),
    problems.map((p) => p.message).join('; '))
  check('drift: as a warning, because the character is still playable',
    problems.every((p) => p.severity === 'warning'))

  // A version that moved is distinguishable from a definition that vanished.
  const stale = {
    ...FIGHTER,
    inventory: {
      ...FIGHTER.inventory,
      instances: [item('i-sword', 'srd:weapon.longsword', { contentVersion: 99 })],
      equipped: { mainHand: 'i-sword' },
      attunedInstanceIds: []
    }
  }
  const versionProblems = checkContentDrift(stale, content)
  check('drift: a changed content version is reported separately from a missing one',
    versionProblems.some((p) => p.message.includes('version 99')),
    versionProblems.map((p) => p.message).join('; '))

  const badSpecies = { ...FIGHTER, speciesId: 'homebrew:species.gnoll' }
  check('drift: a missing species is reported',
    checkContentDrift(badSpecies, content).some((p) => p.message.includes('gnoll')))

  const badFeat = {
    ...FIGHTER,
    buildChoices: [{ atLevel: 4, kind: 'feat', value: 'srd:feat.imaginary' }]
  }
  check('drift: a missing feat is reported',
    checkContentDrift(badFeat, content).some((p) => p.message.includes('imaginary')))

  const orphanConcentration = { ...FIGHTER, concentratingOn: 'ei-nothing' }
  check('drift: concentration on a vanished effect is reported',
    checkContentDrift(orphanConcentration, content)
      .some((p) => p.message.includes('no longer active')))

  check('drift: a clean character reports nothing',
    checkContentDrift(FIGHTER, content).length === 0,
    checkContentDrift(FIGHTER, content).map((p) => p.message).join('; '))
}

// ---------------------------------------------------------------------------
// Refusing to load what it should refuse
// ---------------------------------------------------------------------------

{
  const empty = decodeSheet({}, content)
  check('reject: the empty jsonb default is refused as empty, not as corrupt',
    empty.character === undefined && empty.problems[0].message.includes('empty'),
    empty.problems.map((p) => p.message).join('; '))

  check('reject: a non-object', decodeSheet('nonsense', content).character === undefined)
  check('reject: a sheet with no schema version',
    decodeSheet({ character: FIGHTER }, content).character === undefined)

  const future = decodeSheet({ schema: SHEET_SCHEMA + 1, character: FIGHTER }, content)
  check('reject: a sheet written by a newer build', future.character === undefined)
  check('reject: telling the user to update rather than guessing',
    future.problems[0].message.includes('newer'),
    future.problems[0].message)

  const missingField = decodeSheet({
    schema: SHEET_SCHEMA,
    character: { ...FIGHTER, inventory: undefined }
  }, content)
  check('reject: a structurally incomplete character',
    missingField.character === undefined
    && missingField.problems.some((p) => p.message.includes('inventory')))

  // Invariant 20, asserted specifically for data arriving from storage.
  const withDerived = decodeSheet({
    schema: SHEET_SCHEMA,
    character: { ...FIGHTER, armorClass: 20 }
  }, content)
  check('reject: a stored derived value is refused, not trusted',
    withDerived.character === undefined
    && withDerived.problems.some((p) => p.message.includes('armorClass')),
    withDerived.problems.map((p) => p.message).join('; '))

  const overAttuned = decodeSheet({
    schema: SHEET_SCHEMA,
    character: {
      ...FIGHTER,
      inventory: { ...FIGHTER.inventory, attunedInstanceIds: ['i-mail', 'i-shield', 'i-sword', 'i-cloak'] }
    }
  }, content)
  check('reject: attunement over the limit is refused',
    overAttuned.character === undefined)
}

check.report()
