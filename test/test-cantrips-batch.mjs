// Ten new cantrips, and the six class pools they complete.
//
// Every caster's cantrip pool stopped short of the SRD's own cantrip list —
// not because the mechanism couldn't hold more, but because the spells did
// not exist yet. Acid Splash, Dancing Lights, Mage Hand, Message, Minor
// Illusion, Produce Flame, Shillelagh, Shocking Grasp, True Strike and
// Vicious Mockery, plus two pool corrections (Thaumaturgy was authored but
// never added to the cleric's own pool; Poison Spray never had a resolved
// effect at all), complete the cantrip column for all six casters that have
// one: Cleric, Druid, Sorcerer, Wizard, Warlock, Bard.
//
// Checked against docs/srd-source and docs/srd/08-spell-lists.md +
// 08b-spell-descriptions.md.

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

const effectOf = (spellId, character, ability, slotLevel = 0) =>
  resolveSpellEffect(
    spell(spellId),
    { ability, characterLevel: character.classLevels[0].level, slotLevel },
    createResolution(character, content)
  )

// ---------------------------------------------------------------------------
// The six cantrip pools are complete, against the SRD's own counts
// ---------------------------------------------------------------------------

{
  const poolSize = (classId, selId, level, o) => {
    const c = caster(classId, level, { str: 10, dex: 10, con: 10, int: 16, wis: 16, cha: 16 }, o)
    const pending = playerViewOf(c, content, { detail: 'inspect' }).progression.pendingChoices ?? []
    return pending.find((p) => p.id.endsWith(`:${selId}`))?.from?.length ?? 0
  }

  check.eq('wizard: fourteen cantrips, matching the SRD list exactly',
    poolSize('srd:class.wizard', 'cantrips', 1), 14)
  check.eq('sorcerer: fourteen — the same list as the wizard\'s',
    poolSize('srd:class.sorcerer', 'cantrips', 1), 14)
  check.eq('warlock: seven',
    poolSize('srd:class.warlock', 'cantrips', 1), 7)
  check.eq('bard: nine',
    poolSize('srd:class.bard', 'cantrips', 1), 9)
  check.eq('cleric: seven — Thaumaturgy was authored and never added',
    poolSize('srd:class.cleric', 'cantrips', 1), 7)
  check.eq('druid: seven',
    poolSize('srd:class.druid', 'cantrips-known', 1), 7)
}

// ---------------------------------------------------------------------------
// Save cantrips: Acid Splash, Vicious Mockery, Poison Spray
// ---------------------------------------------------------------------------

{
  const c = caster('srd:class.wizard', 5, { str: 8, dex: 14, con: 14, int: 17, wis: 12, cha: 10 })
  const acid = effectOf('srd:spell.acid-splash', c, 'int')
  check.eq('acid splash: a Dexterity save', acid.save.ability, 'dex')
  check.eq('acid splash: success negates', acid.save.onSuccess, 'none')
  // Cantrip scaling steps at 5/11/17, so a 5th-level caster is already on the
  // second row: 2d6.
  check.eq('acid splash: 2d6 at level 5', acid.damage[0].dice.count, 2)

  const mock = caster('srd:class.bard', 11, { str: 8, dex: 12, con: 12, int: 10, wis: 10, cha: 18 })
  const vicious = effectOf('srd:spell.vicious-mockery', mock, 'cha')
  check.eq('vicious mockery: a Wisdom save', vicious.save.ability, 'wis')
  check.eq('vicious mockery: 3d4 at level 11', vicious.damage[0].dice.count, 3)

  // Poison Spray never had a resolved effect before this batch — pure
  // narrative with a save and a damage number nothing computed.
  const poison = effectOf('srd:spell.poison-spray', caster('srd:class.warlock', 1,
    { str: 8, dex: 14, con: 14, int: 10, wis: 10, cha: 16 }), 'cha')
  check('poison spray: now resolves at all', poison !== undefined)
  check.eq('poison spray: a Constitution save', poison?.save.ability, 'con')
  check.eq('poison spray: 1d12 at level 1', poison?.damage[0].dice.count, 1)
}

// ---------------------------------------------------------------------------
// Attack cantrips: Shocking Grasp, Produce Flame
// ---------------------------------------------------------------------------

{
  const c = caster('srd:class.sorcerer', 17, { str: 8, dex: 14, con: 14, int: 10, wis: 10, cha: 18 })
  const grasp = effectOf('srd:spell.shocking-grasp', c, 'cha')
  check.eq('shocking grasp: an attack, not a save', grasp.delivery, 'attack')
  check.eq('shocking grasp: 4d8 at level 17', grasp.damage[0].dice.count, 4)
  check.eq('shocking grasp: lightning', grasp.damage[0].type, 'lightning')

  const flame = effectOf('srd:spell.produce-flame', caster('srd:class.druid', 1,
    { str: 10, dex: 12, con: 14, int: 10, wis: 16, cha: 10 }), 'wis')
  check.eq('produce flame: an attack', flame.delivery, 'attack')
  check.eq('produce flame: 1d8 fire at level 1', flame.damage[0].dice.count, 1)
}

// ---------------------------------------------------------------------------
// True Strike — advantage on a toggle, not a resolved damage effect
// ---------------------------------------------------------------------------

{
  const withSpell = (toggles) => caster('srd:class.wizard', 1,
    { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 }, { toggles })

  check('true strike: no resolved damage effect — it is a roll modifier',
    effectOf('srd:spell.true-strike', withSpell({}), 'int') === undefined)

  const attackState = (toggles) =>
    playerViewOf(withSpell(toggles), content, { detail: 'inspect' })
      .effects.find((e) => e.label === 'True Strike')

  // True Strike is not on anyone's class list yet as a *known* spell grant —
  // it reaches the sheet only once cast/prepared. What is checked here is
  // that the spell definition itself carries a real, gated roll modifier
  // rather than only prose, the same way Sacred Weapon does.
  const def = spell('srd:spell.true-strike')
  check('true strike: a gated advantage modifier, not just narrative',
    def.effects.modifiers.some((m) =>
      m.channel === 'roll' && m.rollOp === 'advantage'
      && m.condition?.playerToggle === 'spell.true-strike'),
    JSON.stringify(def.effects.modifiers))
}

// ---------------------------------------------------------------------------
// Partial spells still say what the player must do themselves
// ---------------------------------------------------------------------------

{
  for (const sid of [
    'srd:spell.acid-splash', 'srd:spell.shillelagh', 'srd:spell.shocking-grasp',
    'srd:spell.vicious-mockery'
  ]) {
    const def = spell(sid)
    check(`partial: ${def.name} carries narrative explaining its gap`,
      (def.effects.narrative?.[0]?.text.length ?? 0) > 0, sid)
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
