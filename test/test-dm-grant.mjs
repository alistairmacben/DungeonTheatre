// The DM's seventh verb: putting an item into a character's hands.
//
// Every other dm* command modifies something the character already has, and
// there was no way to make an item exist — `transferItem` moves an instance
// between two characters, which cannot conjure loot from an ogre nobody
// modelled. This is the reward system's foundation, so it is worth pinning
// down, especially the part where a player must not be able to issue it.

import { applyCommand, loadContent } from './bundle/engine.mjs'
import { mayIssue, isDmOnly } from './bundle/authority.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()

const character = () => ({
  id: 'c:x', campaignId: 'camp-1', name: 'Test', playerId: 'p',
  speciesId: 'srd:species.human',
  classLevels: [{ classId: 'srd:class.fighter', level: 3 }],
  abilityScoreBase: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
  buildChoices: [], hitPointsCurrent: 20, hitPointsTemp: 0,
  hitDiceSpent: {}, resourcesSpent: {}, conditions: [], effectInstances: [],
  exhaustionLevel: 0,
  inventory: { instances: [], equipped: {}, attunedInstanceIds: [] },
  deathSaves: { successes: 0, failures: 0 }, toggles: {}, spellsPrepared: [], selections: {}
})

const grant = (c, itemId, quantity) => applyCommand(
  c, { type: 'dmGrantItem', characterId: 'c:x', itemId, ...(quantity ? { quantity } : {}) }, content
)

// A real consumable and a real wondrous item from the catalogue.
const POTION = 'srd:item.potion-of-healing'
const knownPotion = content.items.has(POTION)

// ---------------------------------------------------------------------------
// Only the DM may hand out treasure
// ---------------------------------------------------------------------------

check('dmGrantItem is DM-only', isDmOnly('dmGrantItem'))
check('a player may not grant themselves an item',
  mayIssue('owner', 'dmGrantItem').allowed === false)
check('the refusal says why',
  /only the DM/.test(mayIssue('owner', 'dmGrantItem').reason ?? ''))
check('another player may not either', mayIssue('other', 'dmGrantItem').allowed === false)
check('the DM may', mayIssue('dm', 'dmGrantItem').allowed === true)

// ---------------------------------------------------------------------------
// Granting
// ---------------------------------------------------------------------------

{
  const unknown = grant(character(), 'srd:item.not-a-real-thing')
  check('an unknown item is refused, not invented', unknown.rejected !== undefined)

  if (knownPotion) {
    const one = grant(character(), POTION)
    check('granting adds the item', one.rejected === undefined)
    check.eq('exactly one instance arrives', one.character.inventory.instances.length, 1)
    check.eq('it is the item asked for',
      one.character.inventory.instances[0]?.definitionId, POTION)
    check('a granted item is identified — it was handed over, not found',
      one.character.inventory.instances[0]?.identified === true)

    const evt = one.events.find((e) => e.type === 'ItemGranted')
    check('it announces itself, so the table can react', evt !== undefined)
    check.eq('the announcement names the item', evt?.payload.label, content.items.get(POTION)?.name)

    // Consumables stack; the reward reads "×3", not as three rows.
    const three = grant(character(), POTION, 3)
    check.eq('three potions are one stacked instance',
      three.character.inventory.instances.length, 1)
    check.eq('with a quantity of three',
      three.character.inventory.instances[0]?.quantity, 3)

    // Granting again folds into what is already carried.
    const again = grant(three.character, POTION, 2)
    check.eq('granting more stacks rather than duplicating',
      again.character.inventory.instances.length, 1)
    check.eq('and adds up', again.character.inventory.instances[0]?.quantity, 5)
  }
}

// A non-stacking item arrives as its own object: two cloaks are two cloaks,
// each attunable separately.
{
  const cloak = [...content.items.values()].find(
    (i) => i.category === 'wondrous' && i.requiresAttunement)
  if (cloak) {
    const two = grant(character(), cloak.id, 2)
    check.eq(`two of a wondrous item are two instances (${cloak.name})`,
      two.character.inventory.instances.length, 2)
    check('their instance ids differ, or one cannot be attuned without the other',
      two.character.inventory.instances[0]?.instanceId
      !== two.character.inventory.instances[1]?.instanceId)
  }
}

check.report()
