// Magic items, catalogue section I-R, part 3 — closes out the section: the
// twenty-item Rings table (Ring of Protection already exists and isn't
// repeated), Robes, Rods, and the two Ropes.
//
// Ring of Free Action reuses Freedom of Movement's exact two modifiers.
// Robe of the Archmagi is the sixth competing Armor Class base provider,
// built like Unarmored Defense. Robe of Stars is the only dusk-based
// refresh in the SRD.
//
// Checked against docs/srd/10-magic-items.md §10 (Catalogue: I-R).

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
// All thirty-three exist
// ---------------------------------------------------------------------------

{
  const ids = [
    'ring-of-free-action', 'ring-of-jumping', 'ring-of-swimming', 'ring-of-telekinesis',
    'ring-of-warmth', 'ring-of-resistance', 'robe-of-stars', 'robe-of-the-archmagi',
    'rod-of-alertness', 'rod-of-lordly-might', 'ring-of-animal-influence', 'ring-of-evasion',
    'ring-of-shooting-stars', 'ring-of-the-ram', 'ring-of-three-wishes',
    'robe-of-scintillating-colors', 'rod-of-rulership', 'ring-of-djinni-summoning',
    'ring-of-elemental-command', 'ring-of-feather-falling', 'ring-of-invisibility',
    'ring-of-mind-shielding', 'ring-of-regeneration', 'ring-of-spell-storing',
    'ring-of-spell-turning', 'ring-of-water-walking', 'ring-of-x-ray-vision',
    'robe-of-eyes', 'robe-of-useful-items', 'rod-of-absorption', 'rod-of-security',
    'rope-of-climbing', 'rope-of-entanglement'
  ]
  const missing = ids.filter((n) => itemDef(`srd:item.${n}`) === undefined)
  check.eq('all thirty-three catalogue-I-R-part-3 items exist', missing.length, 0, missing.join(', '))
}

// ---------------------------------------------------------------------------
// Ring of Free Action: Freedom of Movement's exact shape
// ---------------------------------------------------------------------------

{
  const c = wizard(
    [item('i-ring', 'srd:item.ring-of-free-action')],
    { ring1: 'i-ring' }, ['i-ring']
  )
  check.eq('ring of free action: difficult terrain costs 1',
    createResolution(c, content).stat('movementCost.difficultTerrain').total, 1)
}

// ---------------------------------------------------------------------------
// Ring of Jumping / Telekinesis: at-will spell grants
// ---------------------------------------------------------------------------

{
  check('ring of jumping: grants jump at no slot cost',
    itemDef('srd:item.ring-of-jumping').effects.spells
      ?.some((g) => g.spellIds?.includes('srd:spell.jump') && g.slotGroup === undefined))
  check('ring of telekinesis: grants telekinesis at no slot cost',
    itemDef('srd:item.ring-of-telekinesis').effects.spells
      ?.some((g) => g.spellIds?.includes('srd:spell.telekinesis') && g.slotGroup === undefined))
}

// ---------------------------------------------------------------------------
// Ring of Swimming, Warmth, Resistance: real modifiers
// ---------------------------------------------------------------------------

{
  const swimmer = wizard([item('i-ring', 'srd:item.ring-of-swimming')], { ring1: 'i-ring' })
  check.eq('ring of swimming: 40-foot swim speed',
    createResolution(swimmer, content).stat('speed.swim').total, 40)

  const warm = wizard([item('i-ring', 'srd:item.ring-of-warmth')], { ring1: 'i-ring' }, ['i-ring'])
  check('ring of warmth: resistant to cold',
    (playerViewOf(warm, content, { detail: 'inspect' }).defenses ?? [])
      .some((d) => d.type === 'cold' && d.state === 'resistant'))

  const resist = wizard(
    [item('i-ring', 'srd:item.ring-of-resistance')], { ring1: 'i-ring' }, ['i-ring'],
    { 'item.ring-of-resistance.necrotic': true }
  )
  check('ring of resistance: the toggled type resolves to resistant',
    (playerViewOf(resist, content, { detail: 'inspect' }).defenses ?? [])
      .some((d) => d.type === 'necrotic' && d.state === 'resistant'))
}

// ---------------------------------------------------------------------------
// Robe of Stars: a dusk refresh, the only one in the SRD
// ---------------------------------------------------------------------------

{
  const def = itemDef('srd:item.robe-of-stars')
  check.eq('robe of stars: six stars', def.charges.max, 6)
  check.eq('robe of stars: dusk refresh', def.charges.refresh.kind, 'dusk')
  check('robe of stars: +1 to every saving throw',
    (['str', 'dex', 'con', 'int', 'wis', 'cha']).every((a) =>
      def.effects.modifiers.some((m) => m.target === `save.${a}`)))
}

// ---------------------------------------------------------------------------
// Robe of the Archmagi: the sixth competing AC base, plus spell DC/attack
// ---------------------------------------------------------------------------

{
  const wearer = wizard(
    [item('i-robe', 'srd:item.robe-of-the-archmagi')], { armor: 'i-robe' }, ['i-robe']
  )
  // Dexterity 14 as a human (+1) is 15, a +2 modifier: 15 + 2 = 17.
  check.eq('robe of the archmagi: 15 + Dexterity while unarmoured = 17',
    playerViewOf(wearer, content, { detail: 'inspect' }).vitals.armorClass.value, 17)

  const withRobe = createResolution(wearer, content).stat('spell.saveDc').total
  const without = createResolution(wizard([], {}, []), content).stat('spell.saveDc').total
  check.eq('robe of the archmagi: spell save DC +2', withRobe, without + 2)
}

// ---------------------------------------------------------------------------
// Rod of Alertness: advantage on Perception and initiative
// ---------------------------------------------------------------------------

{
  const alert = wizard([item('i-rod', 'srd:item.rod-of-alertness')], {}, ['i-rod'])
  const view = playerViewOf(alert, content, { detail: 'inspect' })
  check.eq('rod of alertness: advantage on Perception',
    view.skills.find((s) => s.id === 'perception').rollState, 'advantage')
}

// ---------------------------------------------------------------------------
// Partial items still say what the DM must do themselves
// ---------------------------------------------------------------------------

{
  for (const id of [
    'srd:item.robe-of-stars', 'srd:item.robe-of-the-archmagi', 'srd:item.rod-of-alertness',
    'srd:item.rod-of-lordly-might', 'srd:item.ring-of-animal-influence', 'srd:item.ring-of-evasion',
    'srd:item.ring-of-shooting-stars', 'srd:item.ring-of-the-ram', 'srd:item.ring-of-three-wishes',
    'srd:item.robe-of-scintillating-colors', 'srd:item.rod-of-rulership',
    'srd:item.ring-of-djinni-summoning', 'srd:item.ring-of-elemental-command',
    'srd:item.ring-of-feather-falling', 'srd:item.ring-of-invisibility',
    'srd:item.ring-of-mind-shielding', 'srd:item.ring-of-regeneration',
    'srd:item.ring-of-spell-storing', 'srd:item.ring-of-spell-turning',
    'srd:item.ring-of-water-walking', 'srd:item.ring-of-x-ray-vision', 'srd:item.robe-of-eyes',
    'srd:item.robe-of-useful-items', 'srd:item.rod-of-absorption', 'srd:item.rod-of-security',
    'srd:item.rope-of-climbing', 'srd:item.rope-of-entanglement'
  ]) {
    const def = itemDef(id)
    check(`partial: ${def.name} carries narrative explaining its gap`,
      (def.effects.narrative?.[0]?.text.length ?? 0) > 0, id)
    check(`partial: ${def.name} is flagged partial`,
      def.effects.completeness === 'partial', id)
  }

  for (const id of ['srd:item.ring-of-free-action', 'srd:item.ring-of-swimming']) {
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
