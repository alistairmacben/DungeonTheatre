// Magic items, catalogue section D-I, part 2 — Gem of Seeing through Ioun
// Stone. Ioun Stone is printed as one entry with a fourteen-row table,
// expanded into fourteen real items.
//
// Ioun Stone of Mastery is the only thing in the SRD that modifies the
// proficiency bonus itself. Holy Avenger is the first item whose attunement
// prerequisite reads the wearer's class level rather than species.
//
// Checked against docs/srd/10-magic-items.md §9 (Catalogue: D-I).

import { checkContentIntegrity, createResolution, loadContent, playerViewOf } from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()
const itemDef = (id) => content.items.get(id)

const item = (instanceId, definitionId) =>
  ({ instanceId, definitionId, contentVersion: 1, identified: true })

function wizard(inventory, toggles = {}) {
  return {
    id: 'c:x', campaignId: 'camp-1', name: 'Test', playerId: 'p',
    speciesId: 'srd:species.human',
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
// All thirty-five exist
// ---------------------------------------------------------------------------

{
  const ioun = [
    'agility', 'fortitude', 'insight', 'intellect', 'leadership', 'strength',
    'mastery', 'protection', 'absorption', 'greater-absorption', 'awareness',
    'regeneration', 'reserve', 'sustenance'
  ]
  const ids = [
    'gem-of-seeing', 'giant-slayer', 'glamoured-studded-leather',
    'gloves-of-missile-snaring', 'gloves-of-swimming-and-climbing', 'goggles-of-night',
    'hammer-of-thunderbolts', 'handy-haversack', 'hat-of-disguise',
    'headband-of-intellect', 'helm-of-brilliance', 'helm-of-comprehending-languages',
    'helm-of-telepathy', 'helm-of-teleportation', 'holy-avenger', 'horn-of-blasting',
    'horn-of-valhalla', 'horseshoes-of-a-zephyr', 'horseshoes-of-speed',
    'immovable-rod', 'instant-fortress',
    ...ioun.map((k) => `ioun-stone-${k}`)
  ]
  const missing = ids.filter((n) => itemDef(`srd:item.${n}`) === undefined)
  check.eq('all thirty-five catalogue-D-I-part-2 items exist', missing.length, 0, missing.join(', '))
}

// ---------------------------------------------------------------------------
// Headband of Intellect: a floor on Intelligence
// ---------------------------------------------------------------------------

{
  const c = wizard({
    instances: [item('i-band', 'srd:item.headband-of-intellect')],
    equipped: { head: 'i-band' }, attunedInstanceIds: ['i-band']
  })
  check.eq('headband of intellect: Intelligence floors to 19',
    playerViewOf(c, content, { detail: 'inspect' }).abilities.find((a) => a.ability === 'int').score.value, 19)
}

// ---------------------------------------------------------------------------
// Hat of Disguise and Helm of Comprehending Languages: at-will spell grants
// ---------------------------------------------------------------------------

{
  check('hat of disguise: grants disguise self at no slot cost',
    itemDef('srd:item.hat-of-disguise').effects.spells
      ?.some((g) => g.spellIds?.includes('srd:spell.disguise-self') && g.slotGroup === undefined))
  check('helm of comprehending languages: grants comprehend languages at no slot cost',
    itemDef('srd:item.helm-of-comprehending-languages').effects.spells
      ?.some((g) => g.spellIds?.includes('srd:spell.comprehend-languages') && g.slotGroup === undefined))
}

// ---------------------------------------------------------------------------
// Glamoured Studded Leather: a real base armor profile plus the enhancement
// ---------------------------------------------------------------------------

{
  const c = wizard({
    instances: [item('i-leather', 'srd:item.glamoured-studded-leather')],
    equipped: { armor: 'i-leather' }, attunedInstanceIds: []
  })
  // Studded leather: base 12, no Dex cap. Dexterity 14 as a human (+1) is
  // 15, a +2 modifier. 12 + 2 + 1 enhancement = 15.
  check.eq('glamoured studded leather: 12 base + 2 Dex + 1 enhancement = 15',
    playerViewOf(c, content, { detail: 'inspect' }).vitals.armorClass.value, 15)
}

// ---------------------------------------------------------------------------
// Horseshoes of Speed: a real speed bonus
// ---------------------------------------------------------------------------

{
  const c = wizard({ instances: [], equipped: {}, attunedInstanceIds: [] })
  const before = createResolution(c, content).stat('speed.walk').total
  const shod = wizard({
    instances: [item('i-shoes', 'srd:item.horseshoes-of-speed')],
    equipped: {}, attunedInstanceIds: []
  })
  check.eq('horseshoes of speed: +30 feet',
    createResolution(shod, content).stat('speed.walk').total, before + 30)
}

// ---------------------------------------------------------------------------
// Holy Avenger: an attunement prerequisite that reads class level
// ---------------------------------------------------------------------------

{
  const def = itemDef('srd:item.holy-avenger')
  check.eq('holy avenger: attunement requires being a paladin',
    def.attunementPrerequisite?.classLevelAtLeast?.[0], 'srd:class.paladin')
}

// ---------------------------------------------------------------------------
// Ioun Stones: real ability floors capped at 20, a real proficiency bonus,
// and a real AC bonus
// ---------------------------------------------------------------------------

{
  const c = wizard({
    instances: [item('i-stone', 'srd:item.ioun-stone-strength')],
    equipped: {}, attunedInstanceIds: ['i-stone']
  })
  // Strength 8 as a human (+1) is 9, plus 2 from the stone: 11.
  check.eq('ioun stone of strength: Strength 8 (9 as a human) becomes 11',
    playerViewOf(c, content, { detail: 'inspect' }).abilities.find((a) => a.ability === 'str').score.value, 11)

  const capped = wizard({
    instances: [item('i-stone', 'srd:item.ioun-stone-intellect')],
    equipped: {}, attunedInstanceIds: ['i-stone']
  })
  // Intelligence 16 as a human (+1) is 17, plus 2 from the stone would be
  // 19 — under the cap, so unaffected by it.
  check.eq('ioun stone of intellect: Intelligence 16 (17 as a human) becomes 19',
    playerViewOf(capped, content, { detail: 'inspect' }).abilities.find((a) => a.ability === 'int').score.value, 19)

  const master = wizard({
    instances: [item('i-stone', 'srd:item.ioun-stone-mastery')],
    equipped: {}, attunedInstanceIds: ['i-stone']
  })
  const withoutStone = createResolution(wizard({ instances: [], equipped: {}, attunedInstanceIds: [] }), content)
    .stat('proficiencyBonus').total
  check.eq('ioun stone of mastery: proficiency bonus +1',
    createResolution(master, content).stat('proficiencyBonus').total, withoutStone + 1)

  const protectedC = wizard({
    instances: [item('i-stone', 'srd:item.ioun-stone-protection')],
    equipped: {}, attunedInstanceIds: ['i-stone']
  })
  const baseAc = playerViewOf(wizard({ instances: [], equipped: {}, attunedInstanceIds: [] }), content, { detail: 'inspect' }).vitals.armorClass.value
  check.eq('ioun stone of protection: +1 AC',
    playerViewOf(protectedC, content, { detail: 'inspect' }).vitals.armorClass.value, baseAc + 1)
}

// ---------------------------------------------------------------------------
// Partial items still say what the DM must do themselves
// ---------------------------------------------------------------------------

{
  for (const id of [
    'srd:item.giant-slayer', 'srd:item.glamoured-studded-leather',
    'srd:item.gloves-of-swimming-and-climbing', 'srd:item.hammer-of-thunderbolts',
    'srd:item.holy-avenger', 'srd:item.horseshoes-of-a-zephyr', 'srd:item.gem-of-seeing',
    'srd:item.helm-of-teleportation', 'srd:item.gloves-of-missile-snaring',
    'srd:item.goggles-of-night', 'srd:item.handy-haversack', 'srd:item.helm-of-brilliance',
    'srd:item.helm-of-telepathy', 'srd:item.horn-of-blasting', 'srd:item.horn-of-valhalla',
    'srd:item.immovable-rod', 'srd:item.instant-fortress',
    'srd:item.ioun-stone-absorption', 'srd:item.ioun-stone-greater-absorption',
    'srd:item.ioun-stone-awareness', 'srd:item.ioun-stone-regeneration',
    'srd:item.ioun-stone-reserve', 'srd:item.ioun-stone-sustenance'
  ]) {
    const def = itemDef(id)
    check(`partial: ${def.name} carries narrative explaining its gap`,
      (def.effects.narrative?.[0]?.text.length ?? 0) > 0, id)
    check(`partial: ${def.name} is flagged partial`,
      def.effects.completeness === 'partial', id)
  }

  for (const id of [
    'srd:item.headband-of-intellect', 'srd:item.horseshoes-of-speed',
    'srd:item.hat-of-disguise', 'srd:item.helm-of-comprehending-languages',
    'srd:item.ioun-stone-strength', 'srd:item.ioun-stone-mastery', 'srd:item.ioun-stone-protection'
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
