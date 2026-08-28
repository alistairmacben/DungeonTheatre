// Magic items, catalogue section B — the second batch of the SRD's ~347-item
// magic-item list.
//
// Belt of Giant Strength and Belt of Dwarvenkind's Constitution bonus are the
// first uses of `max` as a ceiling, the mirror of `min`'s floor. Boots of
// Levitation is the first item to grant a spell through `EffectSource.spells`
// rather than a modifier. Bracers of Defense reuses Unarmored Defense's
// established `wearing-armor` / `wielding-shield` toggles for a real,
// accurate condition.
//
// Checked against docs/srd/10-magic-items.md §7 (Catalogue: B).

import { checkContentIntegrity, createResolution, loadContent, playerViewOf } from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()
const itemDef = (id) => content.items.get(id)

const item = (instanceId, definitionId) =>
  ({ instanceId, definitionId, contentVersion: 1, identified: true })

function wizard(level, abilityScoreBase, inventory, toggles = {}) {
  return {
    id: 'c:x', campaignId: 'camp-1', name: 'Test', playerId: 'p',
    speciesId: 'srd:species.human',
    classLevels: [{ classId: 'srd:class.wizard', level }],
    abilityScoreBase,
    buildChoices: [], hitPointsCurrent: 100, hitPointsTemp: 0,
    hitDiceSpent: {}, resourcesSpent: {}, conditions: [], effectInstances: [],
    exhaustionLevel: 0,
    inventory, deathSaves: { successes: 0, failures: 0 }, toggles,
    spellsPrepared: [], selections: {}
  }
}

// ---------------------------------------------------------------------------
// All twenty-four exist
// ---------------------------------------------------------------------------

{
  const ids = [
    'bag-of-beans', 'bag-of-devouring', 'bag-of-holding', 'bag-of-tricks',
    'bead-of-force', 'belt-of-dwarvenkind',
    'belt-of-giant-strength-hill', 'belt-of-giant-strength-stone',
    'belt-of-giant-strength-frost', 'belt-of-giant-strength-fire',
    'belt-of-giant-strength-cloud', 'belt-of-giant-strength-storm',
    'berserker-axe', 'boots-of-elvenkind', 'boots-of-levitation', 'boots-of-speed',
    'boots-of-striding-and-springing', 'boots-of-the-winterlands',
    'bowl-of-commanding-water-elementals', 'bracers-of-archery', 'bracers-of-defense',
    'brazier-of-commanding-fire-elementals', 'brooch-of-shielding', 'broom-of-flying'
  ]
  const missing = ids.filter((n) => itemDef(`srd:item.${n}`) === undefined)
  check.eq('all twenty-four catalogue-B items exist', missing.length, 0, missing.join(', '))
}

// ---------------------------------------------------------------------------
// Belt of Giant Strength: a floor per tier, exceeding the normal 20 cap
// ---------------------------------------------------------------------------

{
  const cases = [
    ['hill', 21], ['stone', 23], ['frost', 23], ['fire', 25], ['cloud', 27], ['storm', 29]
  ]
  for (const [key, str] of cases) {
    const c = wizard(5, { str: 10, dex: 14, con: 14, int: 16, wis: 12, cha: 10 }, {
      instances: [item('i-belt', `srd:item.belt-of-giant-strength-${key}`)],
      equipped: { belt: 'i-belt' }, attunedInstanceIds: ['i-belt']
    })
    check.eq(`belt of ${key} giant strength: Strength floors to ${str}`,
      playerViewOf(c, content, { detail: 'inspect' }).abilities.find((a) => a.ability === 'str').score.value, str)
  }

}

// ---------------------------------------------------------------------------
// Belt of Dwarvenkind: Constitution +2, capped at 20
// ---------------------------------------------------------------------------

{
  const low = wizard(5, { str: 8, dex: 14, con: 16, int: 16, wis: 12, cha: 10 }, {
    instances: [item('i-belt', 'srd:item.belt-of-dwarvenkind')],
    equipped: { belt: 'i-belt' }, attunedInstanceIds: ['i-belt']
  })
  // Human adds +1 to every ability score, so base 16 is 17 before the belt.
  check.eq('belt of dwarvenkind: Constitution 16 (17 as a human) becomes 19',
    playerViewOf(low, content, { detail: 'inspect' }).abilities.find((a) => a.ability === 'con').score.value, 19)

  const capped = wizard(5, { str: 8, dex: 14, con: 19, int: 16, wis: 12, cha: 10 }, {
    instances: [item('i-belt', 'srd:item.belt-of-dwarvenkind')],
    equipped: { belt: 'i-belt' }, attunedInstanceIds: ['i-belt']
  })
  check.eq('belt of dwarvenkind: Constitution 19 caps at 20, not 21',
    playerViewOf(capped, content, { detail: 'inspect' }).abilities.find((a) => a.ability === 'con').score.value, 20)
}

// ---------------------------------------------------------------------------
// Boots of Striding and Springing: a speed floor and a jump multiplier
// ---------------------------------------------------------------------------

{
  const slow = wizard(5, { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 }, {
    instances: [item('i-boots', 'srd:item.boots-of-striding-and-springing')],
    equipped: { boots: 'i-boots' }, attunedInstanceIds: ['i-boots']
  })
  const before = createResolution(wizard(5, { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 }, {
    instances: [], equipped: {}, attunedInstanceIds: []
  }), content)
  const after = createResolution(slow, content)
  check.eq('boots of striding and springing: walking speed floors to 30',
    after.stat('speed.walk').total, 30)
  check('boots of striding and springing: jump distance triples',
    after.stat('jump.long').total === before.stat('jump.long').total * 3)
}

// ---------------------------------------------------------------------------
// Bracers of Defense: a real AC bonus gated on the same toggles Unarmored
// Defense already established
// ---------------------------------------------------------------------------

{
  // Dexterity 14 as a human (+1) is 15, a +2 modifier.
  const geared = wizard(5, { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 }, {
    instances: [
      item('i-armor', 'srd:armor.leather'), item('i-bracers', 'srd:item.bracers-of-defense')
    ],
    equipped: { armor: 'i-armor', bracers: 'i-bracers' }, attunedInstanceIds: ['i-bracers']
  }, { 'wearing-armor': true })
  check.eq('bracers of defense: no bonus while wearing armor — plain leather AC',
    playerViewOf(geared, content, { detail: 'inspect' }).vitals.armorClass.value, 13)

  const unarmored = wizard(5, { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 }, {
    instances: [item('i-bracers', 'srd:item.bracers-of-defense')],
    equipped: { bracers: 'i-bracers' }, attunedInstanceIds: ['i-bracers']
  })
  check.eq('bracers of defense: +2 AC while wearing no armor and no shield',
    playerViewOf(unarmored, content, { detail: 'inspect' }).vitals.armorClass.value, 14)
}

// ---------------------------------------------------------------------------
// Boots of Levitation: a spell grant, not a modifier
// ---------------------------------------------------------------------------

{
  const def = itemDef('srd:item.boots-of-levitation')
  check('boots of levitation: grants levitate at no slot cost',
    def.effects.spells?.some((g) => g.spellIds?.includes('srd:spell.levitate') && g.availability === 'always'
      && g.slotGroup === undefined))
}

// ---------------------------------------------------------------------------
// Boots of Elvenkind: real advantage on Stealth checks
// ---------------------------------------------------------------------------

{
  const stealthy = wizard(5, { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 }, {
    instances: [item('i-boots', 'srd:item.boots-of-elvenkind')],
    equipped: { boots: 'i-boots' }, attunedInstanceIds: []
  })
  const view = playerViewOf(stealthy, content, { detail: 'inspect' })
  check('boots of elvenkind: advantage on the Stealth check',
    view.skills.find((s) => s.id === 'stealth').rollState === 'advantage')
}

// ---------------------------------------------------------------------------
// Partial items still say what the DM must do themselves
// ---------------------------------------------------------------------------

{
  for (const id of [
    'srd:item.belt-of-dwarvenkind', 'srd:item.berserker-axe', 'srd:item.boots-of-elvenkind',
    'srd:item.boots-of-the-winterlands', 'srd:item.bracers-of-archery', 'srd:item.brooch-of-shielding',
    'srd:item.broom-of-flying', 'srd:item.bag-of-beans', 'srd:item.bag-of-devouring',
    'srd:item.bag-of-holding', 'srd:item.bag-of-tricks', 'srd:item.bead-of-force',
    'srd:item.boots-of-speed', 'srd:item.bowl-of-commanding-water-elementals',
    'srd:item.brazier-of-commanding-fire-elementals'
  ]) {
    const def = itemDef(id)
    check(`partial: ${def.name} carries narrative explaining its gap`,
      (def.effects.narrative?.[0]?.text.length ?? 0) > 0, id)
    check(`partial: ${def.name} is flagged partial`,
      def.effects.completeness === 'partial', id)
  }

  for (const id of [
    'srd:item.belt-of-giant-strength-hill', 'srd:item.boots-of-striding-and-springing',
    'srd:item.bracers-of-defense', 'srd:item.boots-of-levitation'
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
