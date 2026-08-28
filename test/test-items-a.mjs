// Magic items, catalogue section A — the first batch of the SRD's ~347-item
// magic-item list, batched by the SRD's own alphabetical catalogue sections
// the way the spell list was batched by level.
//
// Amulet of Health is the first `min` op on an ability score itself rather
// than a derived stat. Armor of Resistance and Armor of Vulnerability reuse
// Fire Shield's toggle-gated `set` pattern, but for a choice fixed once at
// identification rather than once per cast.
//
// Checked against docs/srd/10-magic-items.md §6 (Catalogue: A).

import { checkContentIntegrity, createResolution, loadContent, playerViewOf } from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()
const itemDef = (id) => content.items.get(id)

const item = (instanceId, definitionId) =>
  ({ instanceId, definitionId, contentVersion: 1, identified: true })

function wizard(level, abilityScoreBase, inventory) {
  return {
    id: 'c:x', campaignId: 'camp-1', name: 'Test', playerId: 'p',
    speciesId: 'srd:species.human',
    classLevels: [{ classId: 'srd:class.wizard', level }],
    abilityScoreBase,
    buildChoices: [], hitPointsCurrent: 100, hitPointsTemp: 0,
    hitDiceSpent: {}, resourcesSpent: {}, conditions: [], effectInstances: [],
    exhaustionLevel: 0,
    inventory, deathSaves: { successes: 0, failures: 0 }, toggles: {},
    spellsPrepared: [], selections: {}
  }
}

// ---------------------------------------------------------------------------
// All seventeen exist
// ---------------------------------------------------------------------------

{
  const ids = [
    'adamantine-armor', 'ammunition-plus-1', 'ammunition-plus-2', 'ammunition-plus-3',
    'amulet-of-health', 'amulet-of-proof-against-detection-and-location',
    'amulet-of-the-planes', 'animated-shield', 'apparatus-of-the-crab',
    'armor-plus-1', 'armor-plus-2', 'armor-plus-3', 'armor-of-invulnerability',
    'armor-of-resistance', 'armor-of-vulnerability', 'arrow-catching-shield',
    'arrow-of-slaying'
  ]
  const missing = ids.filter((n) => itemDef(`srd:item.${n}`) === undefined)
  check.eq('all seventeen catalogue-A items exist', missing.length, 0, missing.join(', '))
}

// ---------------------------------------------------------------------------
// Amulet of Health: a floor on the ability score itself
// ---------------------------------------------------------------------------

{
  const low = wizard(5, { str: 8, dex: 14, con: 12, int: 16, wis: 12, cha: 10 }, {
    instances: [item('i-amulet', 'srd:item.amulet-of-health')],
    equipped: { amulet: 'i-amulet' }, attunedInstanceIds: ['i-amulet']
  })
  const raised = playerViewOf(low, content, { detail: 'inspect' })
  check.eq('amulet of health: Constitution floors to 19',
    raised.abilities.find((a) => a.ability === 'con').score.value, 19)

  const high = wizard(5, { str: 8, dex: 14, con: 20, int: 16, wis: 12, cha: 10 }, {
    instances: [item('i-amulet', 'srd:item.amulet-of-health')],
    equipped: { amulet: 'i-amulet' }, attunedInstanceIds: ['i-amulet']
  })
  const unaffected = playerViewOf(high, content, { detail: 'inspect' })
  check.eq("amulet of health: doesn't lower an already-higher score",
    unaffected.abilities.find((a) => a.ability === 'con').score.value, 20)
}

// ---------------------------------------------------------------------------
// Armor, +1/+2/+3: the modifier itself is a plain AC bonus, the same channel
// Ring of Protection uses — partial only because this generic SRD entry
// names no base armor to combine it with
// ---------------------------------------------------------------------------

{
  const unarmored = wizard(5, { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 }, {
    instances: [], equipped: {}, attunedInstanceIds: []
  })
  const baseAc = playerViewOf(unarmored, content, { detail: 'inspect' }).vitals.armorClass.value

  const plussed = wizard(5, { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 }, {
    instances: [item('i-plus', 'srd:item.armor-plus-2')],
    equipped: { armor: 'i-plus' }, attunedInstanceIds: []
  })
  check.eq('armor +2: the modifier itself adds exactly 2 AC',
    playerViewOf(plussed, content, { detail: 'inspect' }).vitals.armorClass.value, baseAc + 2)
}

// ---------------------------------------------------------------------------
// Armor of Resistance / Vulnerability: toggle-gated, fixed once at ID
// ---------------------------------------------------------------------------

{
  const untoggled = wizard(5, { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 }, {
    instances: [item('i-resist', 'srd:item.armor-of-resistance')],
    equipped: { armor: 'i-resist' }, attunedInstanceIds: ['i-resist']
  })
  check.eq('armor of resistance: no resistance until the type is decided',
    (playerViewOf(untoggled, content, { detail: 'inspect' }).defenses ?? [])
      .filter((d) => d.state === 'resistant').length, 0)

  const fireResist = wizard(5, { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 }, {
    instances: [item('i-resist', 'srd:item.armor-of-resistance')],
    equipped: { armor: 'i-resist' }, attunedInstanceIds: ['i-resist']
  }, )
  fireResist.toggles = { 'item.armor-of-resistance.fire': true }
  check('armor of resistance: the toggled type resolves to resistant',
    (playerViewOf(fireResist, content, { detail: 'inspect' }).defenses ?? [])
      .some((d) => d.type === 'fire' && d.state === 'resistant'))

  const cursed = wizard(5, { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 }, {
    instances: [item('i-vuln', 'srd:item.armor-of-vulnerability')],
    equipped: { armor: 'i-vuln' }, attunedInstanceIds: ['i-vuln']
  })
  cursed.toggles = { 'item.armor-of-vulnerability.bludgeoning': true }
  const view = playerViewOf(cursed, content, { detail: 'inspect' })
  check('armor of vulnerability: resistant to the chosen type',
    view.defenses.some((d) => d.type === 'bludgeoning' && d.state === 'resistant'))
  check('armor of vulnerability: vulnerable to both of the other two',
    view.defenses.some((d) => d.type === 'piercing' && d.state === 'vulnerable')
    && view.defenses.some((d) => d.type === 'slashing' && d.state === 'vulnerable'))
}

// ---------------------------------------------------------------------------
// Armor of Invulnerability: a real passive resistance alongside the
// unmodeled activated ability
// ---------------------------------------------------------------------------

{
  const armored = wizard(5, { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 }, {
    instances: [item('i-inv', 'srd:item.armor-of-invulnerability')],
    equipped: { armor: 'i-inv' }, attunedInstanceIds: ['i-inv']
  })
  const view = playerViewOf(armored, content, { detail: 'inspect' })
  const resistant = (view.defenses ?? []).filter((d) => d.state === 'resistant').map((d) => d.type)
  check('armor of invulnerability: resistant to all three physical types',
    ['bludgeoning', 'piercing', 'slashing'].every((t) => resistant.includes(t)))
}

// ---------------------------------------------------------------------------
// Partial items still say what the DM must do themselves
// ---------------------------------------------------------------------------

{
  for (const id of [
    'srd:item.adamantine-armor', 'srd:item.ammunition-plus-1', 'srd:item.ammunition-plus-2',
    'srd:item.ammunition-plus-3', 'srd:item.amulet-of-the-planes', 'srd:item.animated-shield',
    'srd:item.apparatus-of-the-crab', 'srd:item.armor-of-invulnerability',
    'srd:item.armor-of-vulnerability', 'srd:item.arrow-catching-shield', 'srd:item.arrow-of-slaying',
    'srd:item.armor-plus-1', 'srd:item.armor-plus-2', 'srd:item.armor-plus-3'
  ]) {
    const def = itemDef(id)
    check(`partial: ${def.name} carries narrative explaining its gap`,
      (def.effects.narrative?.[0]?.text.length ?? 0) > 0, id)
    check(`partial: ${def.name} is flagged partial`,
      def.effects.completeness === 'partial', id)
  }

  // Amulet of Health and Armor of Resistance resolve completely — the type
  // is a real toggle, not a missing number.
  for (const id of [
    'srd:item.amulet-of-health', 'srd:item.amulet-of-proof-against-detection-and-location',
    'srd:item.armor-of-resistance'
  ]) {
    check.eq(`complete: ${itemDef(id).name} needs no caveat`,
      itemDef(id).effects.completeness, 'complete')
  }

  check('apparatus of the crab: explains why it is out of scope',
    itemDef('srd:item.apparatus-of-the-crab').effects.narrative[0].text.includes('vehicle'))
}

// ---------------------------------------------------------------------------
// The gate every item passes
// ---------------------------------------------------------------------------

{
  const problems = checkContentIntegrity(content)
  const errors = problems.filter((p) => p.severity === 'error')
  check('integrity: the batch introduces no errors',
    errors.length === 0, errors.map((p) => `${p.where}: ${p.message}`).join(' | '))
}

check.report()
