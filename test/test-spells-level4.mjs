// Thirty-two 4th-level spells — the full union of every class's 4th-level
// column. Nothing existed at this level before this batch.
//
// Ice Storm is the first spell with two damage types in one resolved effect,
// proving `perSlotAbove` scales only `damage[0]` exactly as documented.
// Stoneskin sets resistance on three damage types with the same `set` op
// Protection from Poison already used. Greater Invisibility needs nothing new
// — it points at the same Invisible condition Invisibility already proved.
//
// Checked against docs/srd-source/spells.pdf via docs/srd/08b-spell-descriptions.md
// and docs/srd/08-spell-lists.md.

import {
  checkContentIntegrity, createResolution, loadContent, playerViewOf,
  resolveSpellEffect
} from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()
const spell = (id) => content.spells.get(id)

const item = (instanceId, definitionId) =>
  ({ instanceId, definitionId, contentVersion: 1, identified: true })

function caster(classId, level, abilityScoreBase, extra = {}) {
  return {
    id: 'c:x', campaignId: 'camp-1', name: 'Test', playerId: 'p',
    speciesId: 'srd:species.human',
    classLevels: [{ classId, level }],
    abilityScoreBase,
    buildChoices: [], hitPointsCurrent: 100, hitPointsTemp: 0,
    hitDiceSpent: {}, resourcesSpent: {}, conditions: [], effectInstances: [],
    exhaustionLevel: 0,
    inventory: { instances: [item('d', 'srd:weapon.dagger')], equipped: { mainHand: 'd' }, attunedInstanceIds: [] },
    deathSaves: { successes: 0, failures: 0 }, toggles: {}, spellsPrepared: [],
    selections: {}, ...extra
  }
}

const withEffect = (spellId, c) => {
  c.effectInstances = [{
    instanceId: 'ei-1', definitionId: spellId, sourceId: spellId, appliedAtSeconds: 0
  }]
  return playerViewOf(c, content, { detail: 'inspect' })
}

const effectOf = (spellId, character, ability, slotLevel = 0) =>
  resolveSpellEffect(
    spell(spellId),
    { ability, characterLevel: character.classLevels[0].level, slotLevel },
    createResolution(character, content)
  )

// ---------------------------------------------------------------------------
// All thirty-two exist
// ---------------------------------------------------------------------------

{
  const ids = [
    'blight', 'ice-storm', 'wall-of-fire', 'black-tentacles', 'stoneskin',
    'greater-invisibility', 'freedom-of-movement', 'fire-shield', 'banishment',
    'compulsion', 'confusion', 'dominate-beast', 'phantasmal-killer',
    'conjure-minor-elementals', 'conjure-woodland-beings', 'faithful-hound',
    'guardian-of-faith', 'polymorph', 'giant-insect', 'death-ward', 'dimension-door',
    'arcane-eye', 'divination', 'locate-creature', 'control-water',
    'hallucinatory-terrain', 'fabricate', 'stone-shape', 'private-sanctum',
    'resilient-sphere', 'secret-chest'
  ]
  const missing = ids.filter((n) => spell(`srd:spell.${n}`) === undefined)
  check.eq('all thirty-one 4th-level spells exist', missing.length, 0, missing.join(', '))
}

// ---------------------------------------------------------------------------
// Ice Storm: two damage types, only the first scales with the slot
// ---------------------------------------------------------------------------

{
  const c = caster('srd:class.wizard', 9, { str: 8, dex: 14, con: 14, int: 17, wis: 12, cha: 10 })
  const base = effectOf('srd:spell.ice-storm', c, 'int', 4)
  check.eq('ice storm: 2d8 bludgeoning at a 4th-level slot', base.damage[0].dice.count, 2)
  check.eq('ice storm: and 4d6 cold alongside it', base.damage[1].dice.count, 4)
  check.eq('ice storm: bludgeoning type', base.damage[0].type, 'bludgeoning')
  check.eq('ice storm: cold type', base.damage[1].type, 'cold')

  const upcast = effectOf('srd:spell.ice-storm', c, 'int', 6)
  check.eq('ice storm: upcasting to 6th grows the bludgeoning by 2d8', upcast.damage[0].dice.count, 4)
  check.eq('ice storm: but the cold term never scales — still 4d6', upcast.damage[1].dice.count, 4)
}

// ---------------------------------------------------------------------------
// Stoneskin: three resistances from one spell
// ---------------------------------------------------------------------------

{
  const skinned = withEffect('srd:spell.stoneskin',
    caster('srd:class.wizard', 9, { str: 8, dex: 14, con: 14, int: 17, wis: 12, cha: 10 }))
  const types = (skinned.defenses ?? []).filter((d) => d.state === 'resistant').map((d) => d.type)
  check('stoneskin: resistant to bludgeoning, piercing and slashing',
    types.includes('bludgeoning') && types.includes('piercing') && types.includes('slashing'),
    JSON.stringify(types))
  check.eq('stoneskin: exactly those three, nothing else', types.length, 3, JSON.stringify(types))
}

// ---------------------------------------------------------------------------
// Greater Invisibility needs no new modifier — it points at the condition
// ---------------------------------------------------------------------------

{
  const def = spell('srd:spell.greater-invisibility')
  check('greater invisibility: no modifiers of its own',
    (def.effects.modifiers ?? []).length === 0)
  check('greater invisibility: and says so',
    def.effects.narrative[0].text.includes('Invisible condition'))
}

// ---------------------------------------------------------------------------
// Freedom of Movement: a real terrain floor and a real suppression
// ---------------------------------------------------------------------------

{
  const c = caster('srd:class.cleric', 9, { str: 10, dex: 10, con: 14, int: 10, wis: 16, cha: 10 })
  const before = createResolution(c, content)
  check.eq('freedom of movement: difficult terrain costs double beforehand',
    before.stat('movementCost.difficultTerrain').total, 2)

  withEffect('srd:spell.freedom-of-movement', c)
  const after = createResolution(c, content)
  check.eq('freedom of movement: costs 1 while the spell is active',
    after.stat('movementCost.difficultTerrain').total, 1)

  // Paralyzed is suppressed exactly the way Mindless Rage suspends charmed.
  const paralyzed = caster('srd:class.cleric', 9, { str: 10, dex: 10, con: 14, int: 10, wis: 16, cha: 10 })
  paralyzed.conditions = [{ conditionId: 'srd:condition.paralyzed' }]
  const stillParalyzed = playerViewOf(paralyzed, content, { detail: 'inspect' })
  paralyzed.effectInstances = [{
    instanceId: 'ei-2', definitionId: 'srd:spell.freedom-of-movement',
    sourceId: 'srd:spell.freedom-of-movement', appliedAtSeconds: 0
  }]
  const freed = playerViewOf(paralyzed, content, { detail: 'inspect' })
  check('freedom of movement: paralysis is suspended, not removed from the sheet',
    stillParalyzed.effects.some((e) => e.label === 'Paralyzed')
    && freed.effects.some((e) => e.label === 'Paralyzed'))
}

// ---------------------------------------------------------------------------
// Fire Shield: resistance behind a choice of two toggles
// ---------------------------------------------------------------------------

{
  const withToggle = (toggles) => withEffect('srd:spell.fire-shield',
    caster('srd:class.wizard', 9, { str: 8, dex: 14, con: 14, int: 17, wis: 12, cha: 10 }, { toggles }))

  check.eq('fire shield: no resistance untoggled',
    (withToggle({}).defenses ?? []).length, 0)
  check('fire shield: warm shield resists cold',
    (withToggle({ 'spell.fire-shield.warm': true }).defenses ?? [])
      .some((d) => d.type === 'cold' && d.state === 'resistant'))
  check('fire shield: chill shield resists fire',
    (withToggle({ 'spell.fire-shield.chill': true }).defenses ?? [])
      .some((d) => d.type === 'fire' && d.state === 'resistant'))
}

// ---------------------------------------------------------------------------
// Damage resolves the way the rest of the set already does
// ---------------------------------------------------------------------------

{
  const c = caster('srd:class.sorcerer', 9, { str: 8, dex: 14, con: 14, int: 10, wis: 10, cha: 18 })
  const blight = effectOf('srd:spell.blight', c, 'cha', 4)
  check.eq('blight: a Constitution save', blight.save.ability, 'con')
  check.eq('blight: 8d8 necrotic at a 4th-level slot', blight.damage[0].dice.count, 8)

  const wall = effectOf('srd:spell.wall-of-fire', c, 'cha', 4)
  check.eq('wall of fire: a Dexterity save', wall.save.ability, 'dex')
  check.eq('wall of fire: 5d8 fire', wall.damage[0].dice.count, 5)

  const tentacles = effectOf('srd:spell.black-tentacles',
    caster('srd:class.wizard', 9, { str: 8, dex: 14, con: 14, int: 17, wis: 12, cha: 10 }), 'int', 4)
  check.eq('black tentacles: success negates', tentacles.save.onSuccess, 'none')
  check.eq('black tentacles: 3d6 bludgeoning', tentacles.damage[0].dice.count, 3)
}

// ---------------------------------------------------------------------------
// Partial spells still say what the player must do themselves
// ---------------------------------------------------------------------------

{
  for (const sid of [
    'srd:spell.blight', 'srd:spell.black-tentacles', 'srd:spell.freedom-of-movement',
    'srd:spell.fire-shield', 'srd:spell.banishment', 'srd:spell.compulsion',
    'srd:spell.confusion', 'srd:spell.dominate-beast', 'srd:spell.phantasmal-killer',
    'srd:spell.conjure-minor-elementals', 'srd:spell.conjure-woodland-beings',
    'srd:spell.faithful-hound', 'srd:spell.guardian-of-faith', 'srd:spell.polymorph',
    'srd:spell.giant-insect', 'srd:spell.death-ward', 'srd:spell.resilient-sphere'
  ]) {
    const def = spell(sid)
    check(`partial: ${def.name} carries narrative explaining its gap`,
      (def.effects.narrative?.[0]?.text.length ?? 0) > 0, sid)
    check(`partial: ${def.name} is flagged partial`,
      def.effects.completeness === 'partial', sid)
  }

  // Ice Storm, Stoneskin, Greater Invisibility and Wall of Fire are fully
  // resolved — none should be marked partial.
  for (const sid of [
    'srd:spell.ice-storm', 'srd:spell.stoneskin', 'srd:spell.greater-invisibility',
    'srd:spell.wall-of-fire'
  ]) {
    check.eq(`complete: ${spell(sid).name} needs no caveat`,
      spell(sid).effects.completeness, 'complete')
  }
}

// ---------------------------------------------------------------------------
// The gate every spell passes
// ---------------------------------------------------------------------------

{
  const problems = checkContentIntegrity(content)
  const errors = problems.filter((p) => p.severity === 'error')
  check('integrity: the batch introduces no errors',
    errors.length === 0, errors.map((p) => `${p.where}: ${p.message}`).join(' | '))
}

check.report()
