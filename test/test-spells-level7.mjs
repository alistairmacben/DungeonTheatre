// Twenty 7th-level spells — the full union of every class's 7th-level
// column. Ranger and paladin have had nothing since 5th; this batch adds
// nothing for them either.
//
// Arcane Sword is the first spell in the set to use delivery: 'attack'
// rather than 'save' — a summoned weapon striking at the caster's own spell
// attack bonus. Finger of Death and Regenerate are the second and third
// spells (after Disintegrate) to use DiceExpr's flat modifier for a fixed
// addend the caster's own stats don't touch.
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

const effectOf = (spellId, character, ability, slotLevel = 0) =>
  resolveSpellEffect(
    spell(spellId),
    { ability, characterLevel: character.classLevels[0].level, slotLevel },
    createResolution(character, content)
  )

// ---------------------------------------------------------------------------
// All twenty exist
// ---------------------------------------------------------------------------

{
  const ids = [
    'arcane-sword', 'conjure-celestial', 'delayed-blast-fireball', 'divine-word',
    'etherealness', 'finger-of-death', 'fire-storm', 'forcecage',
    'magnificent-mansion', 'mirage-arcane', 'plane-shift', 'prismatic-spray',
    'project-image', 'regenerate', 'resurrection', 'reverse-gravity',
    'sequester', 'simulacrum', 'symbol', 'teleport'
  ]
  const missing = ids.filter((n) => spell(`srd:spell.${n}`) === undefined)
  check.eq('all twenty 7th-level spells exist', missing.length, 0, missing.join(', '))
}

// ---------------------------------------------------------------------------
// Arcane Sword: the first delivery: 'attack' spell in the set
// ---------------------------------------------------------------------------

{
  const def = spell('srd:spell.arcane-sword')
  check.eq('arcane sword: delivered as an attack, not a save', def.effect.delivery, 'attack')
  const wiz = caster('srd:class.wizard', 13, { str: 8, dex: 14, con: 14, int: 18, wis: 12, cha: 10 })
  const resolved = effectOf('srd:spell.arcane-sword', wiz, 'int', 7)
  check.eq('arcane sword: 3d10 force', resolved.damage[0].dice.count, 3)
  check.eq('arcane sword: force type', resolved.damage[0].type, 'force')
}

// ---------------------------------------------------------------------------
// Damage resolves the way the rest of the set already does
// ---------------------------------------------------------------------------

{
  const cleric = caster('srd:class.cleric', 13, { str: 10, dex: 10, con: 14, int: 10, wis: 18, cha: 10 })
  const fireStorm = effectOf('srd:spell.fire-storm', cleric, 'wis', 7)
  check.eq('fire storm: a Dexterity save', fireStorm.save.ability, 'dex')
  check.eq('fire storm: 7d10 fire', fireStorm.damage[0].dice.count, 7)
}

// ---------------------------------------------------------------------------
// Real damage that still carries an uncaptured rider stays partial, and the
// flat DiceExpr modifier composes cleanly with the roll
// ---------------------------------------------------------------------------

{
  const sorc = caster('srd:class.sorcerer', 13, { str: 8, dex: 14, con: 14, int: 10, wis: 10, cha: 18 })
  const finger = effectOf('srd:spell.finger-of-death', sorc, 'cha', 7)
  check.eq('finger of death: a Constitution save', finger.save.ability, 'con')
  check.eq('finger of death: 7d8 necrotic', finger.damage[0].dice.count, 7)
  check.eq('finger of death: plus a flat +30', finger.damage[0].dice.modifier, 30)
  check.eq('finger of death: is still flagged partial for the zombie rider',
    spell('srd:spell.finger-of-death').effects.completeness, 'partial')

  const cleric = caster('srd:class.cleric', 13, { str: 10, dex: 10, con: 14, int: 10, wis: 18, cha: 10 })
  const regen = effectOf('srd:spell.regenerate', cleric, 'wis', 7)
  check.eq('regenerate: 4d8 immediately', regen.healing.dice.count, 4)
  check.eq('regenerate: plus a flat +15', regen.healing.dice.modifier, 15)
  check.eq('regenerate: is still flagged partial for the ongoing regen',
    spell('srd:spell.regenerate').effects.completeness, 'partial')
}

// ---------------------------------------------------------------------------
// Partial spells still say what the player must do themselves
// ---------------------------------------------------------------------------

{
  for (const sid of [
    'srd:spell.finger-of-death', 'srd:spell.regenerate', 'srd:spell.conjure-celestial',
    'srd:spell.delayed-blast-fireball', 'srd:spell.etherealness', 'srd:spell.forcecage',
    'srd:spell.plane-shift', 'srd:spell.prismatic-spray', 'srd:spell.resurrection',
    'srd:spell.reverse-gravity', 'srd:spell.sequester', 'srd:spell.simulacrum',
    'srd:spell.symbol', 'srd:spell.teleport'
  ]) {
    const def = spell(sid)
    check(`partial: ${def.name} carries narrative explaining its gap`,
      (def.effects.narrative?.[0]?.text.length ?? 0) > 0, sid)
    check(`partial: ${def.name} is flagged partial`,
      def.effects.completeness === 'partial', sid)
  }

  // Arcane Sword, Fire Storm and the pure-utility spells are fully
  // resolved — none should be marked partial.
  for (const sid of [
    'srd:spell.arcane-sword', 'srd:spell.fire-storm', 'srd:spell.magnificent-mansion',
    'srd:spell.project-image', 'srd:spell.divine-word', 'srd:spell.mirage-arcane'
  ]) {
    check.eq(`complete: ${spell(sid).name} needs no caveat`,
      spell(sid).effects.completeness, 'complete')
  }
}

// ---------------------------------------------------------------------------
// The three known casters that reach 7th level actually draw on the new
// spells — ranger and paladin cap at 5th and get nothing here
// ---------------------------------------------------------------------------

{
  const pool = (classId, level, abilityScoreBase, selId) => {
    const c = caster(classId, level, abilityScoreBase)
    const pending = playerViewOf(c, content, { detail: 'inspect' }).progression.pendingChoices ?? []
    return pending.find((p) => p.id.endsWith(`:${selId}`))?.from ?? []
  }
  check('bard: Teleport is a known-caster option',
    pool('srd:class.bard', 13, { str: 8, dex: 14, con: 14, int: 10, wis: 10, cha: 16 }, 'spells')
      .includes('srd:spell.teleport'))
  check('sorcerer: Delayed Blast Fireball is a known-caster option',
    pool('srd:class.sorcerer', 13, { str: 8, dex: 14, con: 14, int: 10, wis: 10, cha: 16 }, 'spells')
      .includes('srd:spell.delayed-blast-fireball'))
  check('warlock: Finger of Death is a known-caster option',
    pool('srd:class.warlock', 13, { str: 8, dex: 14, con: 14, int: 10, wis: 10, cha: 16 }, 'spells-known')
      .includes('srd:spell.finger-of-death'))
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
