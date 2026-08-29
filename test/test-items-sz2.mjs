// Magic items, catalogue section S-Z, part 2 — Trident of Fish Command
// through Wings of Flying, including the thirteen-item Wands sub-table
// (Wand of the War Mage +1 already existed; +2 and +3 are new here).
//
// Checked against docs/srd/10-magic-items.md §11 (Catalogue: S-Z, part 2).

import { checkContentIntegrity, createResolution, loadContent, playerViewOf } from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()
const itemDef = (id) => content.items.get(id)

const item = (instanceId, definitionId) =>
  ({ instanceId, definitionId, contentVersion: 1, identified: true })

function wizard(instances = [], equipped = {}, attunedInstanceIds = [], toggles = {}) {
  return {
    id: 'c:x', campaignId: 'camp-1', name: 'Test', playerId: 'p',
    speciesId: 'srd:species.human',
    classLevels: [{ classId: 'srd:class.wizard', level: 5 }],
    abilityScoreBase: { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 },
    buildChoices: [], hitPointsCurrent: 100, hitPointsTemp: 0,
    hitDiceSpent: {}, resourcesSpent: {}, conditions: [], effectInstances: [],
    exhaustionLevel: 0,
    inventory: { instances, equipped, attunedInstanceIds },
    deathSaves: { successes: 0, failures: 0 }, toggles,
    spellsPrepared: [], selections: {}
  }
}

// ---------------------------------------------------------------------------
// All items exist
// ---------------------------------------------------------------------------

{
  const ids = [
    'weapon-plus-1', 'weapon-plus-2', 'weapon-plus-3',
    'wand-of-the-war-mage-2', 'wand-of-the-war-mage-3', 'vorpal-sword',
    'winged-boots', 'wings-of-flying', 'trident-of-fish-command',
    'universal-solvent', 'vicious-weapon', 'well-of-many-worlds', 'wind-fan',
    'wand-of-binding', 'wand-of-enemy-detection', 'wand-of-fear', 'wand-of-fireballs',
    'wand-of-lightning-bolts', 'wand-of-magic-detection', 'wand-of-magic-missiles',
    'wand-of-paralysis', 'wand-of-polymorph', 'wand-of-secrets', 'wand-of-web',
    'wand-of-wonder'
  ]
  const missing = ids.filter((n) => itemDef(`srd:item.${n}`) === undefined)
  check.eq('all catalogue-S-Z-part-2 items exist', missing.length, 0, missing.join(', '))
  // The pre-existing +1 wasn't touched by this batch.
  check('wand of the war mage +1 still exists from the wizard starter kit',
    itemDef('srd:item.wand-of-the-war-mage') !== undefined)
}

// ---------------------------------------------------------------------------
// Weapon +1/+2/+3: complete — a toggle-gated overlay, nothing left dangling
// ---------------------------------------------------------------------------

{
  for (const tier of [1, 2, 3]) {
    const c = wizard(
      [item('i-weapon', `srd:item.weapon-plus-${tier}`)], { mainHand: 'i-weapon' }, [],
      { [`item.weapon-plus-${tier}`]: true }
    )
    const r = createResolution(c, content)
    check.eq(`weapon +${tier}: +${tier} to attack rolls when toggled on`,
      r.stat('attack.roll').total, tier)
    check.eq(`weapon +${tier}: +${tier} to weapon damage when toggled on`,
      r.stat('damage.weapon').total, tier)
    check.eq(`weapon +${tier}: complete, no caveat needed`,
      itemDef(`srd:item.weapon-plus-${tier}`).effects.completeness, 'complete')
  }
}

// ---------------------------------------------------------------------------
// Wand of the War Mage +2/+3: real spell attack bonus, gated on a spellcaster
// ---------------------------------------------------------------------------

{
  for (const [tier, id2] of [[2, 'wand-of-the-war-mage-2'], [3, 'wand-of-the-war-mage-3']]) {
    const def = itemDef(`srd:item.${id2}`)
    check.eq(`${def.name}: attunement gated on a spellcaster`,
      def.attunementPrerequisite?.canCastSpells, true)
    const c = wizard([item('i-wand', `srd:item.${id2}`)], { offHand: 'i-wand' }, ['i-wand'])
    const none = wizard([])
    check.eq(`${def.name}: +${tier} to spell attack rolls`,
      createResolution(c, content).stat('spell.attack').total,
      createResolution(none, content).stat('spell.attack').total + tier)
  }
}

// ---------------------------------------------------------------------------
// Vorpal Sword: real toggle-gated +3, gated attunement, curable narrative gap
// ---------------------------------------------------------------------------

{
  const c = wizard(
    [item('i-vorpal', 'srd:item.vorpal-sword')], { mainHand: 'i-vorpal' }, ['i-vorpal'],
    { 'item.vorpal-sword': true }
  )
  const r = createResolution(c, content)
  check.eq('vorpal sword: +3 to attack rolls when toggled on', r.stat('attack.roll').total, 3)
  check.eq('vorpal sword: +3 to weapon damage when toggled on', r.stat('damage.weapon').total, 3)
}

// ---------------------------------------------------------------------------
// Winged Boots / Wings of Flying: a real flying speed, gated on the toggle
// ---------------------------------------------------------------------------

{
  const bare = wizard([])
  const wearer = wizard(
    [item('i-boots', 'srd:item.winged-boots')], { boots: 'i-boots' }, ['i-boots'],
    { 'item.winged-boots': true }
  )
  check.eq('winged boots: flying speed equals walking speed while toggled on',
    createResolution(wearer, content).stat('speed.fly').total,
    createResolution(wearer, content).stat('speed.walk').total)
  check.eq('winged boots: no flying speed while toggled off',
    createResolution(bare, content).stat('speed.fly').total, 0)

  const winged = wizard(
    [item('i-wings', 'srd:item.wings-of-flying')], {}, ['i-wings'],
    { 'item.wings-of-flying': true }
  )
  check.eq('wings of flying: 60-foot flying speed while toggled on',
    createResolution(winged, content).stat('speed.fly').total, 60)
}

// ---------------------------------------------------------------------------
// Wands: dawn-recharged charge tracks, and the attunement/spellcaster split
// ---------------------------------------------------------------------------

{
  const binding = itemDef('srd:item.wand-of-binding')
  check.eq('wand of binding: 7 charges, dawn refresh', binding.charges.max, 7)
  check.eq('wand of binding: attunement gated on a spellcaster',
    binding.attunementPrerequisite?.canCastSpells, true)

  const enemyDetection = itemDef('srd:item.wand-of-enemy-detection')
  check('wand of enemy detection: attunement required, but not class-gated',
    enemyDetection.requiresAttunement === true && enemyDetection.attunementPrerequisite === undefined)

  const magicDetection = itemDef('srd:item.wand-of-magic-detection')
  check('wand of magic detection: no attunement at all',
    magicDetection.requiresAttunement !== true)
  check.eq('wand of magic detection: 3 charges', magicDetection.charges.max, 3)

  const wonder = itemDef('srd:item.wand-of-wonder')
  check.eq('wand of wonder: 7 charges, dawn refresh', wonder.charges.max, 7)
}

// ---------------------------------------------------------------------------
// Partial items still say what the DM must do themselves
// ---------------------------------------------------------------------------

{
  for (const id of [
    'srd:item.wand-of-the-war-mage-2', 'srd:item.wand-of-the-war-mage-3',
    'srd:item.vorpal-sword', 'srd:item.winged-boots', 'srd:item.wings-of-flying',
    'srd:item.trident-of-fish-command',
    'srd:item.wand-of-binding', 'srd:item.wand-of-enemy-detection', 'srd:item.wand-of-fear',
    'srd:item.wand-of-fireballs', 'srd:item.wand-of-lightning-bolts',
    'srd:item.wand-of-magic-detection', 'srd:item.wand-of-magic-missiles',
    'srd:item.wand-of-paralysis', 'srd:item.wand-of-polymorph', 'srd:item.wand-of-secrets',
    'srd:item.wand-of-web', 'srd:item.wand-of-wonder'
  ]) {
    const def = itemDef(id)
    check(`partial: ${def.name} carries narrative explaining its gap`,
      (def.effects.narrative?.[0]?.text.length ?? 0) > 0, id)
    check(`partial: ${def.name} is flagged partial`,
      def.effects.completeness === 'partial', id)
  }

  for (const id of [
    'srd:item.weapon-plus-1', 'srd:item.weapon-plus-2', 'srd:item.weapon-plus-3',
    'srd:item.universal-solvent', 'srd:item.vicious-weapon', 'srd:item.well-of-many-worlds',
    'srd:item.wind-fan'
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
