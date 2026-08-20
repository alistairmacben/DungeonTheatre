// Per-viewer projection.
//
// A view is built *for somebody*. The DM sees an unidentified item's true
// nature; the player holding it sees what it appears to be. This is the piece
// the architecture always described and never implemented —
// `ItemInstance.apparentDefinitionId` shipped in the first slice and nothing
// ever read it, which meant an unidentified potion of poison announced itself
// by name.
//
// The rule under test: filtering happens where the view is built, never in the
// UI. Anything a determined client must not learn is either absent from the
// projection or was never sent by RLS in the first place.

import { loadContent, playerViewOf } from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()

const CHAR = {
  id: 'c:mark', campaignId: 'camp-1', name: 'Sir Aldren', playerId: 'p1',
  speciesId: 'srd:species.dwarf', subspeciesId: 'srd:species.dwarf.hill',
  classLevels: [{ classId: 'srd:class.fighter', level: 5 }],
  abilityScoreBase: { str: 16, dex: 12, con: 13, int: 10, wis: 12, cha: 8 },
  buildChoices: [], hitPointsCurrent: 40, hitPointsTemp: 0,
  hitDiceSpent: {}, resourcesSpent: {}, conditions: [], effectInstances: [],
  exhaustionLevel: 0,
  inventory: {
    instances: [
      // The disguise: really poison, presenting as healing, not yet identified.
      {
        instanceId: 'i-vial', definitionId: 'srd:item.potion-of-poison',
        contentVersion: 1, identified: false,
        apparentDefinitionId: 'srd:item.potion-of-healing'
      },
      // An ordinary identified item, as a control.
      {
        instanceId: 'i-real', definitionId: 'srd:item.potion-of-healing',
        contentVersion: 1, identified: true
      }
    ],
    equipped: {}, attunedInstanceIds: []
  },
  deathSaves: { successes: 0, failures: 0 }, toggles: {}
}

const viewFor = (kind) => playerViewOf(CHAR, content, { detail: 'inspect', viewer: { kind } })
const vial = (v) => v.inventory.find((i) => i.instanceId === 'i-vial')

// ---------------------------------------------------------------------------
// The player holding it
// ---------------------------------------------------------------------------

{
  const owner = viewFor('owner')
  const item = vial(owner)

  check('owner: the disguised item is shown as what it appears to be',
    item.label === 'Potion of Healing', item.label)
  check('owner: and carries the apparent definition id, not the real one',
    item.itemId === 'srd:item.potion-of-healing', item.itemId)
  check('owner: it is flagged as a disguise so the UI can style it',
    item.disguised === true)
  check('owner: and is not marked identified', item.identified === false)

  // The important half. Hiding only the name would be theatre: the effect
  // summary is derived from the definition's modifiers and narrative, so if it
  // came from the real item it would announce the poison in prose.
  const summary = (item.effectSummary ?? []).join(' ')
  check('owner: the effect summary describes the disguise, not the poison',
    !/poison/i.test(summary), summary)

  // Nothing anywhere in the owner's serialised view may name the true item.
  const wire = JSON.stringify(owner)
  check('owner: the true identity appears nowhere in the payload',
    !wire.includes('potion-of-poison') && !wire.includes('Potion of Poison'),
    'true identity leaked into the owner view')

  // The control must be unaffected.
  const real = owner.inventory.find((i) => i.instanceId === 'i-real')
  check('owner: an identified item is untouched',
    real.label === 'Potion of Healing' && real.disguised === undefined)
}

// ---------------------------------------------------------------------------
// Another player at the table
// ---------------------------------------------------------------------------

{
  const table = viewFor('table')
  const item = vial(table)
  check('table: sees the same disguise the owner does',
    item.label === 'Potion of Healing' && item.disguised === true)
  check('table: and cannot see through it either',
    !JSON.stringify(table).includes('Potion of Poison'))
}

// ---------------------------------------------------------------------------
// The DM
// ---------------------------------------------------------------------------

{
  const dm = viewFor('dm')
  const item = vial(dm)

  check('dm: sees the true item', item.label === 'Potion of Poison', item.label)
  check('dm: with the real definition id',
    item.itemId === 'srd:item.potion-of-poison', item.itemId)
  // Both facts at once: the DM needs to know it is poison *and* that the player
  // is seeing a healing potion, or they cannot run the scene.
  check('dm: told that it is presenting as something else', item.disguised === true)
  check('dm: and told what the player sees',
    item.trueLabel === 'Potion of Poison', item.trueLabel)
  // The potion's text is a narrative clause, which surfaces in notices rather
  // than in effectSummary (describeSource walks modifiers, not prose).
  check('dm: the real narrative reaches the DM',
    dm.notices.some((n) => /poison/i.test(n.text + n.label)),
    dm.notices.map((n) => n.label).join(', '))
}

// ---------------------------------------------------------------------------
// The default, and the shape of the contract
// ---------------------------------------------------------------------------

{
  // Every existing caller passes no viewer. That must keep meaning "the owner",
  // or the whole player app silently changes behaviour.
  const implicit = playerViewOf(CHAR, content, { detail: 'inspect' })
  check('default: omitting the viewer means the owner',
    JSON.stringify(implicit.inventory) === JSON.stringify(viewFor('owner').inventory))

  // Projection must not disturb anything else: the same character resolves to
  // the same numbers no matter who is looking.
  const owner = viewFor('owner')
  const dm = viewFor('dm')
  check('projection: armour class is identical for every viewer',
    owner.vitals.armorClass.value === dm.vitals.armorClass.value)
  check('projection: hit points are identical for every viewer',
    owner.vitals.hitPoints.max.value === dm.vitals.hitPoints.max.value)
  check('projection: the action list is identical for every viewer',
    owner.actions.length === dm.actions.length)
}

check.report()
