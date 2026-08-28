// Fifteen 9th-level spells — the last of them. The full union of every
// class's 9th-level column closes out the SRD spell list: every spell from
// cantrip through 9th level now exists in this content set.
//
// Foresight is the cleanest late-game spell to model — four ordinary roll
// modifiers cover nearly everything it does, partial only for "cannot be
// surprised," which has no mechanism here. Meteor Swarm is the third
// two-damage-type spell (after Ice Storm and Flame Strike) and the largest
// roll in the set. Power Word Kill closes the Power Word family exactly like
// Power Word Stun: no roll, just an HP threshold.
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
// All fifteen exist
// ---------------------------------------------------------------------------

{
  const ids = [
    'astral-projection', 'foresight', 'gate', 'imprisonment', 'mass-heal',
    'meteor-swarm', 'power-word-kill', 'prismatic-wall', 'shapechange',
    'storm-of-vengeance', 'time-stop', 'true-polymorph', 'true-resurrection',
    'weird', 'wish'
  ]
  const missing = ids.filter((n) => spell(`srd:spell.${n}`) === undefined)
  check.eq('all fifteen 9th-level spells exist', missing.length, 0, missing.join(', '))
}

// ---------------------------------------------------------------------------
// Meteor Swarm: the third two-damage-type spell, and the biggest roll yet
// ---------------------------------------------------------------------------

{
  const wiz = caster('srd:class.wizard', 17, { str: 8, dex: 14, con: 14, int: 18, wis: 12, cha: 10 })
  const swarm = effectOf('srd:spell.meteor-swarm', wiz, 'int', 9)
  check.eq('meteor swarm: a Dexterity save', swarm.save.ability, 'dex')
  check.eq('meteor swarm: 20d6 fire', swarm.damage[0].dice.count, 20)
  check.eq('meteor swarm: and 20d6 bludgeoning alongside it', swarm.damage[1].dice.count, 20)
  check.eq('meteor swarm: fire type', swarm.damage[0].type, 'fire')
  check.eq('meteor swarm: bludgeoning type', swarm.damage[1].type, 'bludgeoning')
}

// ---------------------------------------------------------------------------
// Foresight: four real modifiers, partial only for the surprise clause
// ---------------------------------------------------------------------------

{
  const seer = withEffect('srd:spell.foresight',
    caster('srd:class.wizard', 17, { str: 8, dex: 14, con: 14, int: 18, wis: 12, cha: 10 }))
  check.eq('foresight: advantage on saving throws',
    seer.abilities.find((a) => a.ability === 'wis').saveRollState, 'advantage')
  check.eq('foresight: is still flagged partial for the surprise clause',
    spell('srd:spell.foresight').effects.completeness, 'partial')

  const def = spell('srd:spell.foresight')
  check('foresight: advantage on attack rolls',
    def.effects.modifiers.some((m) =>
      m.channel === 'roll' && m.rollOp === 'advantage' && m.scope?.kinds?.includes('attack')
      && m.appliesTo === undefined))
  check('foresight: advantage on ability checks',
    def.effects.modifiers.some((m) =>
      m.channel === 'roll' && m.rollOp === 'advantage' && m.scope?.kinds?.includes('check')))
  check('foresight: disadvantage for everyone attacking it',
    def.effects.modifiers.some((m) =>
      m.channel === 'roll' && m.rollOp === 'disadvantage' && m.appliesTo === 'attackersAgainstSelf'))
}

// ---------------------------------------------------------------------------
// Power Word Kill: no roll, an HP threshold, exactly like Power Word Stun
// ---------------------------------------------------------------------------

{
  check.eq('power word kill: no caveat needed — nothing here to compute',
    spell('srd:spell.power-word-kill').effects.completeness, 'complete')
  check('power word kill: narrative states the HP threshold',
    spell('srd:spell.power-word-kill').effects.narrative[0].text.includes('100 hit points'))
}

// ---------------------------------------------------------------------------
// Partial spells still say what the player must do themselves
// ---------------------------------------------------------------------------

{
  for (const sid of [
    'srd:spell.foresight', 'srd:spell.astral-projection', 'srd:spell.gate',
    'srd:spell.imprisonment', 'srd:spell.mass-heal', 'srd:spell.prismatic-wall',
    'srd:spell.shapechange', 'srd:spell.storm-of-vengeance', 'srd:spell.time-stop',
    'srd:spell.true-polymorph', 'srd:spell.true-resurrection', 'srd:spell.weird',
    'srd:spell.wish'
  ]) {
    const def = spell(sid)
    check(`partial: ${def.name} carries narrative explaining its gap`,
      (def.effects.narrative?.[0]?.text.length ?? 0) > 0, sid)
    check(`partial: ${def.name} is flagged partial`,
      def.effects.completeness === 'partial', sid)
  }

  // Only Meteor Swarm and Power Word Kill are fully resolved.
  for (const sid of ['srd:spell.meteor-swarm', 'srd:spell.power-word-kill']) {
    check.eq(`complete: ${spell(sid).name} needs no caveat`,
      spell(sid).effects.completeness, 'complete')
  }

  // Shapechange explains the same missing-bestiary gap Animal Shapes does.
  check('shapechange: explains the missing creature statblocks',
    spell('srd:spell.shapechange').effects.narrative[0].text.includes('creature statblocks'))
}

// ---------------------------------------------------------------------------
// The three known casters that reach 9th level actually draw on the new
// spells — ranger and paladin cap at 5th and get nothing here
// ---------------------------------------------------------------------------

{
  const pool = (classId, level, abilityScoreBase, selId) => {
    const c = caster(classId, level, abilityScoreBase)
    const pending = playerViewOf(c, content, { detail: 'inspect' }).progression.pendingChoices ?? []
    return pending.find((p) => p.id.endsWith(`:${selId}`))?.from ?? []
  }
  check('bard: True Polymorph is a known-caster option',
    pool('srd:class.bard', 20, { str: 8, dex: 14, con: 14, int: 10, wis: 10, cha: 16 }, 'spells')
      .includes('srd:spell.true-polymorph'))
  check('sorcerer: Wish is a known-caster option',
    pool('srd:class.sorcerer', 20, { str: 8, dex: 14, con: 14, int: 10, wis: 10, cha: 16 }, 'spells')
      .includes('srd:spell.wish'))
  check('warlock: Imprisonment is a known-caster option',
    pool('srd:class.warlock', 20, { str: 8, dex: 14, con: 14, int: 10, wis: 10, cha: 16 }, 'spells-known')
      .includes('srd:spell.imprisonment'))
}

// ---------------------------------------------------------------------------
// The final tally: every spell in the SRD list now exists
// ---------------------------------------------------------------------------

{
  check.eq('the complete SRD spell list is now authored', content.spells.size, 303 + 15)
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
