// Magic items, catalogue section I-R, part 1 — Iron Bands of Binding through
// Pearl of Power.
//
// Mithral Armor suppresses the same `armor-strength-penalty` /
// `armor-stealth-penalty` tags the `armor()` helper already declares. Oil of
// Slipperiness reuses Freedom of Movement's exact modifier shape for a
// consumable. Necklace of Prayer Beads is the first attunement prerequisite
// that reads "any of these classes."
//
// Checked against docs/srd/10-magic-items.md §10 (Catalogue: I-R).

import { checkContentIntegrity, createResolution, loadContent, playerViewOf } from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()
const itemDef = (id) => content.items.get(id)

const item = (instanceId, definitionId) =>
  ({ instanceId, definitionId, contentVersion: 1, identified: true })

function fighter(inventory, toggles = {}) {
  return {
    id: 'c:x', campaignId: 'camp-1', name: 'Test', playerId: 'p',
    speciesId: 'srd:species.human',
    classLevels: [{ classId: 'srd:class.fighter', level: 5 }],
    abilityScoreBase: { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 10 },
    buildChoices: [], hitPointsCurrent: 100, hitPointsTemp: 0,
    hitDiceSpent: {}, resourcesSpent: {}, conditions: [], effectInstances: [],
    exhaustionLevel: 0,
    inventory, deathSaves: { successes: 0, failures: 0 }, toggles,
    spellsPrepared: [], selections: {}
  }
}

// ---------------------------------------------------------------------------
// All twenty-nine exist
// ---------------------------------------------------------------------------

{
  const books = [
    'manual-of-bodily-health', 'manual-of-gainful-exercise', 'manual-of-quickness-of-action',
    'tome-of-clear-thought', 'tome-of-leadership-and-influence', 'tome-of-understanding'
  ]
  const ids = [
    'mithral-armor', 'oil-of-slipperiness', 'luck-blade', 'mace-of-smiting',
    'pearl-of-power', 'necklace-of-prayer-beads', 'iron-bands-of-binding',
    'mace-of-terror', 'medallion-of-thoughts', 'nine-lives-stealer', 'iron-flask',
    'javelin-of-lightning', 'lantern-of-revealing', 'mace-of-disruption',
    ...books, 'manual-of-golems', 'marvelous-pigments', 'mantle-of-spell-resistance',
    'mirror-of-life-trapping', 'necklace-of-adaptation', 'necklace-of-fireballs',
    'oathbow', 'oil-of-etherealness', 'oil-of-sharpness'
  ]
  const missing = ids.filter((n) => itemDef(`srd:item.${n}`) === undefined)
  check.eq('all twenty-nine catalogue-I-R-part-1 items exist', missing.length, 0, missing.join(', '))
}

// ---------------------------------------------------------------------------
// Mithral Armor: suppresses the exact tags real armor's own penalties use
// ---------------------------------------------------------------------------

{
  const def = itemDef('srd:item.mithral-armor')
  const suppress = def.effects.modifiers.find((m) => m.op === 'suppress')
  check('mithral armor: suppresses the strength-penalty tag',
    suppress?.suppresses?.tags?.includes('armor-strength-penalty'))
  check('mithral armor: suppresses the stealth-penalty tag',
    suppress?.suppresses?.tags?.includes('armor-stealth-penalty'))

  // Chain mail has a Strength 13 requirement; a weaker wearer normally
  // loses 10 feet of speed for failing to meet it.
  const weak = fighter({
    instances: [item('i-mail', 'srd:armor.chain-mail')],
    equipped: { armor: 'i-mail' }, attunedInstanceIds: []
  }, {}, )
  weak.abilityScoreBase.str = 8
  const penalized = createResolution(weak, content).stat('speed.walk').total

  const mithral = fighter({
    instances: [
      item('i-mail', 'srd:armor.chain-mail'), item('i-mithral', 'srd:item.mithral-armor')
    ],
    equipped: { armor: 'i-mail' }, attunedInstanceIds: []
  })
  mithral.abilityScoreBase.str = 8
  mithral.effectInstances = [{
    instanceId: 'ei-1', definitionId: 'srd:item.mithral-armor', sourceId: 'srd:item.mithral-armor', appliedAtSeconds: 0
  }]
  const unpenalized = createResolution(mithral, content).stat('speed.walk').total
  check('mithral armor: removes the speed penalty from an unmet Strength requirement',
    unpenalized > penalized, `${unpenalized} vs ${penalized}`)
}

// ---------------------------------------------------------------------------
// Oil of Slipperiness: Freedom of Movement's exact shape
// ---------------------------------------------------------------------------

{
  const c = fighter({ instances: [], equipped: {}, attunedInstanceIds: [] })
  const before = createResolution(c, content).stat('movementCost.difficultTerrain').total
  c.effectInstances = [{
    instanceId: 'ei-1', definitionId: 'srd:item.oil-of-slipperiness', sourceId: 'srd:item.oil-of-slipperiness', appliedAtSeconds: 0
  }]
  const after = createResolution(c, content).stat('movementCost.difficultTerrain').total
  check.eq('oil of slipperiness: difficult terrain costs double beforehand', before, 2)
  check.eq('oil of slipperiness: costs 1 while applied', after, 1)
}

// ---------------------------------------------------------------------------
// Necklace of Prayer Beads: attunement requires any of three classes
// ---------------------------------------------------------------------------

{
  const def = itemDef('srd:item.necklace-of-prayer-beads')
  const classes = def.attunementPrerequisite?.any?.map((p) => p.classLevelAtLeast?.[0])
  check('necklace of prayer beads: attunement allows cleric, druid or paladin',
    classes?.includes('srd:class.cleric') && classes?.includes('srd:class.druid')
    && classes?.includes('srd:class.paladin'))
}

// ---------------------------------------------------------------------------
// Luck Blade: real attack/damage and save bonuses, a finite wish pool
// ---------------------------------------------------------------------------

{
  const def = itemDef('srd:item.luck-blade')
  check.eq('luck blade: three wish charges, never recharging',
    def.charges.max, 3)
  check.eq('luck blade: no recharge', def.charges.refresh.kind, 'never')
  check('luck blade: +1 to every saving throw while carried',
    (['str', 'dex', 'con', 'int', 'wis', 'cha']).every((a) =>
      def.effects.modifiers.some((m) => m.target === `save.${a}`)))
}

// ---------------------------------------------------------------------------
// Partial items still say what the DM must do themselves
// ---------------------------------------------------------------------------

{
  for (const id of [
    'srd:item.mithral-armor', 'srd:item.oil-of-slipperiness', 'srd:item.luck-blade',
    'srd:item.mace-of-smiting', 'srd:item.pearl-of-power', 'srd:item.necklace-of-prayer-beads',
    'srd:item.iron-bands-of-binding', 'srd:item.mace-of-terror', 'srd:item.medallion-of-thoughts',
    'srd:item.nine-lives-stealer', 'srd:item.iron-flask', 'srd:item.javelin-of-lightning',
    'srd:item.mace-of-disruption', 'srd:item.manual-of-bodily-health', 'srd:item.manual-of-golems',
    'srd:item.marvelous-pigments', 'srd:item.mantle-of-spell-resistance',
    'srd:item.mirror-of-life-trapping', 'srd:item.necklace-of-adaptation',
    'srd:item.necklace-of-fireballs', 'srd:item.oathbow', 'srd:item.oil-of-etherealness',
    'srd:item.oil-of-sharpness'
  ]) {
    const def = itemDef(id)
    check(`partial: ${def.name} carries narrative explaining its gap`,
      (def.effects.narrative?.[0]?.text.length ?? 0) > 0, id)
    check(`partial: ${def.name} is flagged partial`,
      def.effects.completeness === 'partial', id)
  }

  check.eq('complete: Lantern of Revealing needs no caveat',
    itemDef('srd:item.lantern-of-revealing').effects.completeness, 'complete')
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
