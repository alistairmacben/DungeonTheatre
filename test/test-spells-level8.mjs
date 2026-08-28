// Sixteen 8th-level spells — the full union of every class's 8th-level
// column. Nothing for ranger or paladin, same as the last two levels.
//
// Animal Shapes is the one spell in the whole SRD list that the source
// material itself flags inert: it turns willing creatures into beast
// statblocks, and this content set was scoped from the start to exclude
// monsters and beasts. Mind Blank and Holy Aura reach for RESISTANCE_IMMUNE
// and ordinary roll modifiers for the one clause each spell states as
// absolute, leaving the rest narrative.
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
// All sixteen exist
// ---------------------------------------------------------------------------

{
  const ids = [
    'animal-shapes', 'antimagic-field', 'antipathy-sympathy', 'clone',
    'control-weather', 'demiplane', 'dominate-monster', 'earthquake',
    'feeblemind', 'glibness', 'holy-aura', 'incendiary-cloud', 'maze',
    'mind-blank', 'power-word-stun', 'sunburst'
  ]
  const missing = ids.filter((n) => spell(`srd:spell.${n}`) === undefined)
  check.eq('all sixteen 8th-level spells exist', missing.length, 0, missing.join(', '))
}

// ---------------------------------------------------------------------------
// Damage resolves the way the rest of the set already does
// ---------------------------------------------------------------------------

{
  const sorc = caster('srd:class.sorcerer', 17, { str: 8, dex: 14, con: 14, int: 10, wis: 10, cha: 18 })
  const incendiary = effectOf('srd:spell.incendiary-cloud', sorc, 'cha', 8)
  check.eq('incendiary cloud: a Dexterity save', incendiary.save.ability, 'dex')
  check.eq('incendiary cloud: 10d8 fire', incendiary.damage[0].dice.count, 10)

  const sunburst = effectOf('srd:spell.sunburst', sorc, 'cha', 8)
  check.eq('sunburst: a Constitution save', sunburst.save.ability, 'con')
  check.eq('sunburst: 12d6 radiant', sunburst.damage[0].dice.count, 12)
  check.eq('sunburst: is still flagged partial for the blindness rider',
    spell('srd:spell.sunburst').effects.completeness, 'partial')
}

// ---------------------------------------------------------------------------
// Mind Blank and Holy Aura: real modifiers alongside an uncaptured rider
// ---------------------------------------------------------------------------

{
  const blanked = withEffect('srd:spell.mind-blank',
    caster('srd:class.wizard', 17, { str: 8, dex: 14, con: 14, int: 18, wis: 12, cha: 10 }))
  check('mind blank: immune to psychic damage',
    (blanked.defenses ?? []).some((d) => d.type === 'psychic' && d.state === 'immune'))
  check.eq('mind blank: is still flagged partial for the other immunities',
    spell('srd:spell.mind-blank').effects.completeness, 'partial')

  const blessed = withEffect('srd:spell.holy-aura',
    caster('srd:class.cleric', 17, { str: 10, dex: 10, con: 14, int: 10, wis: 18, cha: 10 }))
  check.eq('holy aura: advantage on every save',
    blessed.abilities.find((a) => a.ability === 'wis').saveRollState, 'advantage')
  check.eq('holy aura: is still flagged partial for the fiend/undead rider',
    spell('srd:spell.holy-aura').effects.completeness, 'partial')

  const def = spell('srd:spell.holy-aura')
  check('holy aura: disadvantage for everyone attacking it',
    def.effects.modifiers.some((m) =>
      m.channel === 'roll' && m.rollOp === 'disadvantage' && m.appliesTo === 'attackersAgainstSelf'))
}

// ---------------------------------------------------------------------------
// Partial spells still say what the player must do themselves
// ---------------------------------------------------------------------------

{
  for (const sid of [
    'srd:spell.sunburst', 'srd:spell.holy-aura', 'srd:spell.mind-blank',
    'srd:spell.animal-shapes', 'srd:spell.antipathy-sympathy', 'srd:spell.clone',
    'srd:spell.dominate-monster', 'srd:spell.earthquake', 'srd:spell.feeblemind',
    'srd:spell.glibness', 'srd:spell.maze'
  ]) {
    const def = spell(sid)
    check(`partial: ${def.name} carries narrative explaining its gap`,
      (def.effects.narrative?.[0]?.text.length ?? 0) > 0, sid)
    check(`partial: ${def.name} is flagged partial`,
      def.effects.completeness === 'partial', sid)
  }

  // Incendiary Cloud and the pure-utility spells are fully resolved — none
  // should be marked partial.
  for (const sid of [
    'srd:spell.incendiary-cloud', 'srd:spell.demiplane', 'srd:spell.control-weather',
    'srd:spell.antimagic-field', 'srd:spell.power-word-stun'
  ]) {
    check.eq(`complete: ${spell(sid).name} needs no caveat`,
      spell(sid).effects.completeness, 'complete')
  }

  // Explicitly confirm Animal Shapes says why it's inert.
  check('animal shapes: explains the missing bestiary content',
    spell('srd:spell.animal-shapes').effects.narrative[0].text.includes('beast statblocks'))
}

// ---------------------------------------------------------------------------
// The three known casters that reach 8th level actually draw on the new
// spells — ranger and paladin cap at 5th and get nothing here
// ---------------------------------------------------------------------------

{
  const pool = (classId, level, abilityScoreBase, selId) => {
    const c = caster(classId, level, abilityScoreBase)
    const pending = playerViewOf(c, content, { detail: 'inspect' }).progression.pendingChoices ?? []
    return pending.find((p) => p.id.endsWith(`:${selId}`))?.from ?? []
  }
  check('bard: Mind Blank is a known-caster option',
    pool('srd:class.bard', 17, { str: 8, dex: 14, con: 14, int: 10, wis: 10, cha: 16 }, 'spells')
      .includes('srd:spell.mind-blank'))
  check('sorcerer: Sunburst is a known-caster option',
    pool('srd:class.sorcerer', 17, { str: 8, dex: 14, con: 14, int: 10, wis: 10, cha: 16 }, 'spells')
      .includes('srd:spell.sunburst'))
  check('warlock: Demiplane is a known-caster option',
    pool('srd:class.warlock', 17, { str: 8, dex: 14, con: 14, int: 10, wis: 10, cha: 16 }, 'spells-known')
      .includes('srd:spell.demiplane'))
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
