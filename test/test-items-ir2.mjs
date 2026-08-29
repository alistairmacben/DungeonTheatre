// Magic items, catalogue section I-R, part 2 — Periapt of Health through
// Restorative Ointment, including every named Potion. Potion of Poison
// already exists (src/content/classes-extra.ts) and isn't repeated.
//
// Potion of Giant Strength is printed as one entry with a five-row table
// naming six real strengths, expanded the same way Belt of Giant Strength
// was — just temporary. Potion of Speed reuses Haste's exact three
// modifiers; Potion of Resistance reuses Armor of Resistance's toggle shape.
//
// Checked against docs/srd/10-magic-items.md §10 (Catalogue: I-R).

import { checkContentIntegrity, createResolution, loadContent, playerViewOf } from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()
const itemDef = (id) => content.items.get(id)

const item = (instanceId, definitionId) =>
  ({ instanceId, definitionId, contentVersion: 1, identified: true })

function wizard(instances = [], toggles = {}) {
  return {
    id: 'c:x', campaignId: 'camp-1', name: 'Test', playerId: 'p',
    speciesId: 'srd:species.human',
    classLevels: [{ classId: 'srd:class.wizard', level: 5 }],
    abilityScoreBase: { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 },
    buildChoices: [], hitPointsCurrent: 100, hitPointsTemp: 0,
    hitDiceSpent: {}, resourcesSpent: {}, conditions: [], effectInstances: [],
    exhaustionLevel: 0,
    inventory: { instances, equipped: {}, attunedInstanceIds: [] },
    deathSaves: { successes: 0, failures: 0 }, toggles,
    spellsPrepared: [], selections: {}
  }
}

const drink = (spellId, c) => {
  c.effectInstances = [{
    instanceId: 'ei-1', definitionId: spellId, sourceId: spellId, appliedAtSeconds: 0
  }]
  return c
}

// ---------------------------------------------------------------------------
// All thirty-one exist
// ---------------------------------------------------------------------------

{
  const giants = ['hill', 'stone', 'frost', 'fire', 'cloud', 'storm']
  const simple = [
    'animal-friendship', 'clairvoyance', 'diminution', 'gaseous-form', 'growth',
    'heroism', 'invisibility', 'mind-reading', 'water-breathing'
  ]
  const healing = ['greater', 'superior', 'supreme']
  const ids = [
    'periapt-of-proof-against-poison', 'plate-armor-of-etherealness',
    ...giants.map((g) => `potion-of-${g}-giant-strength`),
    'potion-of-climbing', 'potion-of-flying', 'potion-of-resistance', 'potion-of-speed',
    'pipes-of-haunting', 'pipes-of-the-sewers',
    'periapt-of-health', 'periapt-of-wound-closure', 'philter-of-love', 'portable-hole',
    ...simple.map((s) => `potion-of-${s}`),
    ...healing.map((h) => `potion-of-${h}-healing`),
    'restorative-ointment'
  ]
  const missing = ids.filter((n) => itemDef(`srd:item.${n}`) === undefined)
  check.eq('all thirty-one catalogue-I-R-part-2 items exist', missing.length, 0, missing.join(', '))
}

// ---------------------------------------------------------------------------
// Periapt of Proof against Poison: real immunity
// ---------------------------------------------------------------------------

{
  const c = drink('srd:item.periapt-of-proof-against-poison', wizard())
  const view = playerViewOf(c, content, { detail: 'inspect' })
  check('periapt of proof against poison: immune to poison',
    (view.defenses ?? []).some((d) => d.type === 'poison' && d.state === 'immune'))
}

// ---------------------------------------------------------------------------
// Plate Armor of Etherealness: a real base AC, not a bare bonus
// ---------------------------------------------------------------------------

{
  const c = wizard([item('i-plate', 'srd:item.plate-armor-of-etherealness')])
  c.inventory.equipped = { armor: 'i-plate' }
  c.inventory.attunedInstanceIds = ['i-plate']
  // Plate: base 18, no Dexterity applies (heavy armor).
  check.eq('plate armor of etherealness: 18 AC, heavy armor ignores Dexterity',
    playerViewOf(c, content, { detail: 'inspect' }).vitals.armorClass.value, 18)
}

// ---------------------------------------------------------------------------
// Potions of Giant Strength: temporary floors, exceeding the normal cap
// ---------------------------------------------------------------------------

{
  const c = drink('srd:item.potion-of-storm-giant-strength', wizard())
  check.eq('potion of storm giant strength: Strength floors to 29',
    playerViewOf(c, content, { detail: 'inspect' }).abilities.find((a) => a.ability === 'str').score.value, 29)
}

// ---------------------------------------------------------------------------
// Potion of Climbing / Flying: dynamic speed reads, matching Cloak of
// Arachnida's shape
// ---------------------------------------------------------------------------

{
  const climbing = drink('srd:item.potion-of-climbing', wizard())
  const r = createResolution(climbing, content)
  check.eq('potion of climbing: climbing speed equals walking speed',
    r.stat('speed.climb').total, r.stat('speed.walk').total)

  const flying = drink('srd:item.potion-of-flying', wizard())
  const rf = createResolution(flying, content)
  check.eq('potion of flying: flying speed equals walking speed',
    rf.stat('speed.fly').total, rf.stat('speed.walk').total)
}

// ---------------------------------------------------------------------------
// Potion of Resistance: toggle-gated, matching Armor of Resistance
// ---------------------------------------------------------------------------

{
  const c = drink('srd:item.potion-of-resistance', wizard([], { 'item.potion-of-resistance.fire': true }))
  check('potion of resistance: the toggled type resolves to resistant',
    (playerViewOf(c, content, { detail: 'inspect' }).defenses ?? [])
      .some((d) => d.type === 'fire' && d.state === 'resistant'))
}

// ---------------------------------------------------------------------------
// Potion of Speed: Haste's exact modifiers
// ---------------------------------------------------------------------------

{
  const before = wizard()
  const walkSpeed = createResolution(before, content).stat('speed.walk').total
  const baseAc = playerViewOf(before, content, { detail: 'inspect' }).vitals.armorClass.value

  const sped = drink('srd:item.potion-of-speed', wizard())
  check.eq('potion of speed: speed doubles',
    createResolution(sped, content).stat('speed.walk').total, walkSpeed * 2)
  check.eq('potion of speed: +2 AC',
    playerViewOf(sped, content, { detail: 'inspect' }).vitals.armorClass.value, baseAc + 2)
  check.eq('potion of speed: advantage on Dexterity saves',
    playerViewOf(sped, content, { detail: 'inspect' }).abilities.find((a) => a.ability === 'dex').saveRollState, 'advantage')
}

// ---------------------------------------------------------------------------
// Partial items still say what the DM must do themselves
// ---------------------------------------------------------------------------

{
  for (const id of [
    'srd:item.periapt-of-proof-against-poison', 'srd:item.plate-armor-of-etherealness',
    'srd:item.potion-of-climbing', 'srd:item.potion-of-flying', 'srd:item.potion-of-resistance',
    'srd:item.potion-of-speed', 'srd:item.pipes-of-haunting', 'srd:item.pipes-of-the-sewers',
    'srd:item.periapt-of-wound-closure', 'srd:item.philter-of-love', 'srd:item.portable-hole',
    'srd:item.potion-of-animal-friendship', 'srd:item.potion-of-invisibility',
    'srd:item.potion-of-greater-healing', 'srd:item.restorative-ointment'
  ]) {
    const def = itemDef(id)
    check(`partial: ${def.name} carries narrative explaining its gap`,
      (def.effects.narrative?.[0]?.text.length ?? 0) > 0, id)
    check(`partial: ${def.name} is flagged partial`,
      def.effects.completeness === 'partial', id)
  }

  for (const id of [
    'srd:item.periapt-of-health', 'srd:item.potion-of-hill-giant-strength'
  ]) {
    check.eq(`complete: ${itemDef(id).name} needs no caveat`,
      itemDef(id).effects.completeness, 'complete')
  }
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
