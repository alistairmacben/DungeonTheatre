// Thirty-one 6th-level spells — the full union of every class's 6th-level
// column. The first level with no ranger or paladin entries: both
// half-casters cap at 5th.
//
// Irresistible Dance is the first target-facing spell to get real roll
// modifiers instead of pure narrative — Haste's and Blur's vocabulary
// (disadvantage on saves, disadvantage on attacks, advantage for attackers),
// just applied to whichever creature the DM puts the effect instance on.
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
// All thirty-one exist
// ---------------------------------------------------------------------------

{
  const ids = [
    'blade-barrier', 'chain-lightning', 'circle-of-death', 'conjure-fey',
    'contingency', 'create-undead', 'disintegrate', 'eyebite', 'find-the-path',
    'flesh-to-stone', 'forbiddance', 'freezing-sphere', 'globe-of-invulnerability',
    'guards-and-wards', 'harm', 'heal', 'heroes-feast', 'instant-summons',
    'irresistible-dance', 'magic-jar', 'mass-suggestion', 'move-earth',
    'planar-ally', 'programmed-illusion', 'sunbeam', 'transport-via-plants',
    'true-seeing', 'wall-of-ice', 'wall-of-thorns', 'wind-walk', 'word-of-recall'
  ]
  const missing = ids.filter((n) => spell(`srd:spell.${n}`) === undefined)
  check.eq('all thirty-one 6th-level spells exist', missing.length, 0, missing.join(', '))
}

// ---------------------------------------------------------------------------
// Damage resolves the way the rest of the set already does
// ---------------------------------------------------------------------------

{
  const wiz = caster('srd:class.wizard', 13, { str: 8, dex: 14, con: 14, int: 18, wis: 12, cha: 10 })
  const disintegrate = effectOf('srd:spell.disintegrate', wiz, 'int', 6)
  check.eq('disintegrate: a Dexterity save', disintegrate.save.ability, 'dex')
  check.eq('disintegrate: success negates entirely', disintegrate.save.onSuccess, 'none')
  check.eq('disintegrate: 10d6 force at a 6th-level slot', disintegrate.damage[0].dice.count, 10)
  check.eq('disintegrate: plus a flat +40', disintegrate.damage[0].dice.modifier, 40)
  const disintegrateUp = effectOf('srd:spell.disintegrate', wiz, 'int', 8)
  check.eq('disintegrate: upcast to an 8th-level slot adds 6d6', disintegrateUp.damage[0].dice.count, 16)

  const circle = effectOf('srd:spell.circle-of-death', wiz, 'int', 6)
  check.eq('circle of death: a Constitution save', circle.save.ability, 'con')
  check.eq('circle of death: 8d6 necrotic', circle.damage[0].dice.count, 8)

  const blade = effectOf('srd:spell.blade-barrier',
    caster('srd:class.cleric', 11, { str: 10, dex: 10, con: 14, int: 10, wis: 16, cha: 10 }),
    'wis', 6)
  check.eq('blade barrier: a Dexterity save', blade.save.ability, 'dex')
  check.eq('blade barrier: 6d10 slashing', blade.damage[0].dice.count, 6)

  const freezing = effectOf('srd:spell.freezing-sphere', wiz, 'int', 6)
  check.eq('freezing sphere: a Constitution save', freezing.save.ability, 'con')
  check.eq('freezing sphere: 10d6 cold', freezing.damage[0].dice.count, 10)
}

// ---------------------------------------------------------------------------
// Real damage that still carries an uncaptured rider stays partial
// ---------------------------------------------------------------------------

{
  const cleric = caster('srd:class.cleric', 11, { str: 10, dex: 10, con: 14, int: 10, wis: 16, cha: 10 })
  const harm = effectOf('srd:spell.harm', cleric, 'wis', 6)
  check.eq('harm: a Constitution save', harm.save.ability, 'con')
  check.eq('harm: 14d6 necrotic', harm.damage[0].dice.count, 14)
  check.eq('harm: is still flagged partial for the HP-max rider',
    spell('srd:spell.harm').effects.completeness, 'partial')

  const sunbeam = effectOf('srd:spell.sunbeam',
    caster('srd:class.druid', 11, { str: 10, dex: 10, con: 14, int: 10, wis: 16, cha: 10 }), 'wis', 6)
  check.eq('sunbeam: 6d8 radiant', sunbeam.damage[0].dice.count, 6)
  check.eq('sunbeam: is still flagged partial for the blindness rider',
    spell('srd:spell.sunbeam').effects.completeness, 'partial')

  const wallIce = effectOf('srd:spell.wall-of-ice',
    caster('srd:class.wizard', 11, { str: 8, dex: 14, con: 14, int: 18, wis: 12, cha: 10 }), 'int', 6)
  check.eq('wall of ice: 10d6 cold on appearing', wallIce.damage[0].dice.count, 10)

  const wallThorns = effectOf('srd:spell.wall-of-thorns',
    caster('srd:class.druid', 11, { str: 10, dex: 10, con: 14, int: 10, wis: 16, cha: 10 }), 'wis', 6)
  check.eq('wall of thorns: 7d8 piercing on appearing', wallThorns.damage[0].dice.count, 7)

  const chain = effectOf('srd:spell.chain-lightning',
    caster('srd:class.wizard', 11, { str: 8, dex: 14, con: 14, int: 18, wis: 12, cha: 10 }), 'int', 6)
  check.eq('chain lightning: a Dexterity save', chain.save.ability, 'dex')
  check.eq('chain lightning: 10d8 lightning per bolt', chain.damage[0].dice.count, 10)
}

// ---------------------------------------------------------------------------
// Irresistible Dance: real modifiers, applied to the target's own sheet
// ---------------------------------------------------------------------------

{
  const target = caster('srd:class.fighter', 11, { str: 16, dex: 14, con: 14, int: 8, wis: 10, cha: 8 })
  const danced = withEffect('srd:spell.irresistible-dance', target)
  check.eq('irresistible dance: disadvantage on the target\'s Dexterity saves',
    danced.abilities.find((a) => a.ability === 'dex').saveRollState, 'disadvantage')
  check.eq('irresistible dance: still flagged partial for the forced movement',
    spell('srd:spell.irresistible-dance').effects.completeness, 'partial')

  const def = spell('srd:spell.irresistible-dance')
  check('irresistible dance: disadvantage on its own attack rolls',
    def.effects.modifiers.some((m) =>
      m.channel === 'roll' && m.rollOp === 'disadvantage' && m.scope?.kinds?.includes('attack')
      && m.appliesTo === undefined))
  check('irresistible dance: advantage for everyone attacking it',
    def.effects.modifiers.some((m) =>
      m.channel === 'roll' && m.rollOp === 'advantage' && m.appliesTo === 'attackersAgainstSelf'))
}

// ---------------------------------------------------------------------------
// Partial spells still say what the player must do themselves
// ---------------------------------------------------------------------------

{
  for (const sid of [
    'srd:spell.harm', 'srd:spell.sunbeam', 'srd:spell.wall-of-ice', 'srd:spell.wall-of-thorns',
    'srd:spell.chain-lightning', 'srd:spell.irresistible-dance', 'srd:spell.conjure-fey',
    'srd:spell.create-undead', 'srd:spell.contingency', 'srd:spell.eyebite',
    'srd:spell.flesh-to-stone', 'srd:spell.forbiddance', 'srd:spell.guards-and-wards',
    'srd:spell.heal', 'srd:spell.heroes-feast', 'srd:spell.magic-jar',
    'srd:spell.mass-suggestion', 'srd:spell.planar-ally', 'srd:spell.wind-walk'
  ]) {
    const def = spell(sid)
    check(`partial: ${def.name} carries narrative explaining its gap`,
      (def.effects.narrative?.[0]?.text.length ?? 0) > 0, sid)
    check(`partial: ${def.name} is flagged partial`,
      def.effects.completeness === 'partial', sid)
  }

  // Blade Barrier, Circle of Death, Disintegrate, Freezing Sphere and the
  // pure-utility spells are fully resolved — none should be marked partial.
  for (const sid of [
    'srd:spell.blade-barrier', 'srd:spell.circle-of-death', 'srd:spell.disintegrate',
    'srd:spell.freezing-sphere', 'srd:spell.find-the-path', 'srd:spell.transport-via-plants',
    'srd:spell.true-seeing', 'srd:spell.word-of-recall', 'srd:spell.instant-summons',
    'srd:spell.globe-of-invulnerability', 'srd:spell.move-earth', 'srd:spell.programmed-illusion'
  ]) {
    check.eq(`complete: ${spell(sid).name} needs no caveat`,
      spell(sid).effects.completeness, 'complete')
  }
}

// ---------------------------------------------------------------------------
// The three known casters that reach 6th level actually draw on the new
// spells — ranger and paladin cap at 5th and get nothing here
// ---------------------------------------------------------------------------

{
  const pool = (classId, level, abilityScoreBase, selId) => {
    const c = caster(classId, level, abilityScoreBase)
    const pending = playerViewOf(c, content, { detail: 'inspect' }).progression.pendingChoices ?? []
    return pending.find((p) => p.id.endsWith(`:${selId}`))?.from ?? []
  }
  check('bard: True Seeing is a known-caster option',
    pool('srd:class.bard', 11, { str: 8, dex: 14, con: 14, int: 10, wis: 10, cha: 16 }, 'spells')
      .includes('srd:spell.true-seeing'))
  check('sorcerer: Disintegrate is a known-caster option',
    pool('srd:class.sorcerer', 11, { str: 8, dex: 14, con: 14, int: 10, wis: 10, cha: 16 }, 'spells')
      .includes('srd:spell.disintegrate'))
  check('warlock: Create Undead is a known-caster option',
    pool('srd:class.warlock', 11, { str: 8, dex: 14, con: 14, int: 10, wis: 10, cha: 16 }, 'spells-known')
      .includes('srd:spell.create-undead'))
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
