// Magic items, catalogue section D-I, part 1 — the largest SRD catalogue
// letter, split across several batches. This part runs Defender through Gem
// of Brightness.
//
// Dragon Scale Mail is printed as one entry naming ten dragon colours, each
// with its own fixed resistance — expanded into ten real items. Dwarven
// Thrower is the first item whose attunement prerequisite reads the
// wearer's species rather than a class or capability.
//
// Checked against docs/srd/10-magic-items.md §9 (Catalogue: D-I).

import { checkContentIntegrity, createResolution, loadContent, playerViewOf } from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()
const itemDef = (id) => content.items.get(id)

const item = (instanceId, definitionId) =>
  ({ instanceId, definitionId, contentVersion: 1, identified: true })

function wizard(inventory, toggles = {}, speciesId = 'srd:species.human') {
  return {
    id: 'c:x', campaignId: 'camp-1', name: 'Test', playerId: 'p',
    speciesId,
    classLevels: [{ classId: 'srd:class.wizard', level: 5 }],
    abilityScoreBase: { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 },
    buildChoices: [], hitPointsCurrent: 100, hitPointsTemp: 0,
    hitDiceSpent: {}, resourcesSpent: {}, conditions: [], effectInstances: [],
    exhaustionLevel: 0,
    inventory, deathSaves: { successes: 0, failures: 0 }, toggles,
    spellsPrepared: [], selections: {}
  }
}

// ---------------------------------------------------------------------------
// All thirty-four exist
// ---------------------------------------------------------------------------

{
  const dragonColors = ['black', 'blue', 'brass', 'bronze', 'copper', 'gold', 'green', 'red', 'silver', 'white']
  const ids = [
    ...dragonColors.map((c) => `dragon-scale-mail-${c}`),
    'dwarven-plate', 'elven-chain', 'demon-armor', 'dragon-slayer', 'dwarven-thrower',
    'gauntlets-of-ogre-power', 'frost-brand', 'eyes-of-minute-seeing', 'eyes-of-the-eagle',
    'eyes-of-charming', 'gem-of-brightness', 'defender', 'dimensional-shackles',
    'dust-of-disappearance', 'dust-of-dryness', 'dust-of-sneezing-and-choking',
    'efficient-quiver', 'efreeti-bottle', 'elemental-gem', 'eversmoking-bottle',
    'feather-token', 'figurine-of-wondrous-power', 'flame-tongue', 'folding-boat'
  ]
  const missing = ids.filter((n) => itemDef(`srd:item.${n}`) === undefined)
  check.eq('all thirty-four catalogue-D-I-part-1 items exist', missing.length, 0, missing.join(', '))
}

// ---------------------------------------------------------------------------
// Dragon Scale Mail: a real AC bonus and a fixed resistance per colour
// ---------------------------------------------------------------------------

{
  const cases = [['red', 'fire'], ['white', 'cold'], ['green', 'poison'], ['bronze', 'lightning']]
  for (const [color, type] of cases) {
    const wearer = wizard({
      instances: [item('i-scale', `srd:item.dragon-scale-mail-${color}`)],
      equipped: { armor: 'i-scale' }, attunedInstanceIds: ['i-scale']
    })
    const view = playerViewOf(wearer, content, { detail: 'inspect' })
    check(`${color} dragon scale mail: resistant to ${type}`,
      (view.defenses ?? []).some((d) => d.type === type && d.state === 'resistant'))
  }

  // A real base armor profile now, not a bare bonus: 13 base AC, Dexterity
  // capped at 2 (medium armor), plus the +1 enhancement. Dexterity 14 as a
  // human (+1) is 15, a +2 modifier, so 13 + 2 + 1 = 16.
  const scaled = wizard({
    instances: [item('i-scale', 'srd:item.dragon-scale-mail-red')],
    equipped: { armor: 'i-scale' }, attunedInstanceIds: ['i-scale']
  })
  check.eq('dragon scale mail: 13 base + 2 Dex (capped) + 1 enhancement = 16',
    playerViewOf(scaled, content, { detail: 'inspect' }).vitals.armorClass.value, 16)
}

// ---------------------------------------------------------------------------
// Dwarven Thrower: an attunement prerequisite that reads species
// ---------------------------------------------------------------------------

{
  const def = itemDef('srd:item.dwarven-thrower')
  check.eq('dwarven thrower: attunement requires being a dwarf',
    def.attunementPrerequisite?.speciesIs, 'srd:species.dwarf')
}

// ---------------------------------------------------------------------------
// Gauntlets of Ogre Power: a floor on Strength
// ---------------------------------------------------------------------------

{
  const weak = wizard({
    instances: [item('i-gauntlets', 'srd:item.gauntlets-of-ogre-power')],
    equipped: { gloves: 'i-gauntlets' }, attunedInstanceIds: ['i-gauntlets']
  })
  check.eq('gauntlets of ogre power: Strength floors to 19',
    playerViewOf(weak, content, { detail: 'inspect' }).abilities.find((a) => a.ability === 'str').score.value, 19)
}

// ---------------------------------------------------------------------------
// Frost Brand: real fire resistance while held
// ---------------------------------------------------------------------------

{
  const branded = wizard({
    instances: [item('i-sword', 'srd:item.frost-brand')],
    equipped: { mainHand: 'i-sword' }, attunedInstanceIds: ['i-sword']
  })
  check('frost brand: resistant to fire',
    (playerViewOf(branded, content, { detail: 'inspect' }).defenses ?? [])
      .some((d) => d.type === 'fire' && d.state === 'resistant'))
}

// ---------------------------------------------------------------------------
// Eyes of Minute Seeing / the Eagle: real skill-check advantage
// ---------------------------------------------------------------------------

{
  const sharp = wizard({
    instances: [item('i-eyes', 'srd:item.eyes-of-the-eagle')],
    equipped: { amulet: 'i-eyes' }, attunedInstanceIds: ['i-eyes']
  })
  check.eq('eyes of the eagle: advantage on Perception',
    playerViewOf(sharp, content, { detail: 'inspect' }).skills.find((s) => s.id === 'perception').rollState, 'advantage')
}

// ---------------------------------------------------------------------------
// Partial items still say what the DM must do themselves
// ---------------------------------------------------------------------------

{
  for (const id of [
    'srd:item.dwarven-plate', 'srd:item.elven-chain', 'srd:item.demon-armor',
    'srd:item.dragon-slayer', 'srd:item.dwarven-thrower', 'srd:item.frost-brand',
    'srd:item.eyes-of-minute-seeing', 'srd:item.eyes-of-the-eagle',
    'srd:item.eyes-of-charming', 'srd:item.gem-of-brightness', 'srd:item.defender',
    'srd:item.dimensional-shackles', 'srd:item.dust-of-disappearance',
    'srd:item.dust-of-dryness', 'srd:item.dust-of-sneezing-and-choking',
    'srd:item.efficient-quiver', 'srd:item.efreeti-bottle', 'srd:item.elemental-gem',
    'srd:item.eversmoking-bottle', 'srd:item.feather-token',
    'srd:item.figurine-of-wondrous-power', 'srd:item.flame-tongue', 'srd:item.folding-boat',
    'srd:item.dragon-scale-mail-red'
  ]) {
    const def = itemDef(id)
    check(`partial: ${def.name} carries narrative explaining its gap`,
      (def.effects.narrative?.[0]?.text.length ?? 0) > 0, id)
    check(`partial: ${def.name} is flagged partial`,
      def.effects.completeness === 'partial', id)
  }

  check.eq('complete: Gauntlets of Ogre Power needs no caveat',
    itemDef('srd:item.gauntlets-of-ogre-power').effects.completeness, 'complete')
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
