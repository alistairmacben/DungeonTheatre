// Forty-one 3rd-level spells — the full union of every class's 3rd-level
// column, minus Protection from Energy, which the set already held.
//
// Haste and Fly are the mechanical centrepieces: Haste stacks three ordinary
// modifiers (`multiply`, `add`, `roll`) on one spell, and Fly is Dragon
// Wings' `base`-reads-a-stat shape with a literal 60 instead. This batch also
// fixed a real bug the previous one exposed: `resolveDamagePools` accepted
// any spell id that resolved to a real SpellDefinition, whether or not the
// character had prepared it — invisible until Fireball existed to prove it.
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
// All forty-one exist
// ---------------------------------------------------------------------------

{
  const ids = [
    'fireball', 'lightning-bolt', 'call-lightning', 'spirit-guardians', 'wind-wall',
    'vampiric-touch', 'haste', 'fly', 'beacon-of-hope', 'gaseous-form', 'fear',
    'hypnotic-pattern', 'slow', 'stinking-cloud', 'sleet-storm', 'bestow-curse',
    'mass-healing-word', 'conjure-animals', 'animate-dead', 'phantom-steed', 'revivify',
    'counterspell', 'dispel-magic', 'daylight', 'clairvoyance', 'sending', 'tongues',
    'nondetection', 'major-image', 'glyph-of-warding', 'magic-circle', 'remove-curse',
    'speak-with-dead', 'speak-with-plants', 'plant-growth', 'create-food-and-water',
    'water-breathing', 'water-walk', 'meld-into-stone', 'tiny-hut', 'blink'
  ]
  const missing = ids.filter((n) => spell(`srd:spell.${n}`) === undefined)
  check.eq('all forty-one 3rd-level spells exist', missing.length, 0, missing.join(', '))
}

// ---------------------------------------------------------------------------
// Haste: three ordinary modifiers stacked on one spell
// ---------------------------------------------------------------------------

{
  const c = caster('srd:class.sorcerer', 5, { str: 10, dex: 12, con: 14, int: 10, wis: 10, cha: 16 })
  const before = createResolution(c, content)
  const walkSpeed = before.stat('speed.walk').total
  const ac = playerViewOf(c, content, { detail: 'inspect' }).vitals.armorClass.value

  const hasted = withEffect('srd:spell.haste', c)
  check.eq('haste: speed doubles', hasted.vitals.speed.value, walkSpeed * 2)
  check.eq('haste: +2 AC', hasted.vitals.armorClass.value, ac + 2)
  check.eq('haste: advantage on Dexterity saves',
    hasted.abilities.find((a) => a.ability === 'dex').saveRollState, 'advantage')
  check.eq('haste: and not on Strength saves — the scope is Dexterity only',
    hasted.abilities.find((a) => a.ability === 'str').saveRollState ?? 'normal', 'normal')
}

// ---------------------------------------------------------------------------
// Fly: Dragon Wings' shape, a literal number this time
// ---------------------------------------------------------------------------

{
  const c = caster('srd:class.warlock', 5, { str: 8, dex: 14, con: 14, int: 10, wis: 10, cha: 16 })
  const before = createResolution(c, content)
  check.eq('fly: no fly speed beforehand', before.stat('speed.fly').total, 0)

  withEffect('srd:spell.fly', c)
  const after = createResolution(c, content)
  check.eq('fly: 60 feet while the spell is active', after.stat('speed.fly').total, 60)
}

// ---------------------------------------------------------------------------
// Damage resolves the way the rest of the set already does
// ---------------------------------------------------------------------------

{
  const c = caster('srd:class.wizard', 9, { str: 8, dex: 14, con: 14, int: 17, wis: 12, cha: 10 })
  const fireball = effectOf('srd:spell.fireball', c, 'int', 3)
  check.eq('fireball: a Dexterity save', fireball.save.ability, 'dex')
  check.eq('fireball: 8d6 fire at a 3rd-level slot', fireball.damage[0].dice.count, 8)
  const fireballUp = effectOf('srd:spell.fireball', c, 'int', 5)
  check.eq('fireball: upcast to a 5th-level slot adds 2d6', fireballUp.damage[0].dice.count, 10)

  const bolt = effectOf('srd:spell.lightning-bolt', c, 'int', 3)
  check.eq('lightning bolt: 8d6 lightning', bolt.damage[0].dice.count, 8)

  const guardians = effectOf('srd:spell.spirit-guardians',
    caster('srd:class.cleric', 9, { str: 10, dex: 10, con: 14, int: 10, wis: 16, cha: 10 }),
    'wis', 3)
  check.eq('spirit guardians: a Wisdom save', guardians.save.ability, 'wis')
  check.eq('spirit guardians: radiant by default', guardians.damage[0].type, 'radiant')

  const wall = effectOf('srd:spell.wind-wall',
    caster('srd:class.druid', 9, { str: 10, dex: 10, con: 14, int: 10, wis: 16, cha: 10 }),
    'wis', 3)
  check.eq('wind wall: a Strength save', wall.save.ability, 'str')
  check.eq('wind wall: 3d8 bludgeoning', wall.damage[0].dice.count, 3)
}

// ---------------------------------------------------------------------------
// Beacon of Hope: advantage on two roll kinds, including death saves
// ---------------------------------------------------------------------------

{
  const blessed = withEffect('srd:spell.beacon-of-hope',
    caster('srd:class.cleric', 5, { str: 10, dex: 10, con: 14, int: 10, wis: 16, cha: 10 }))
  check.eq('beacon of hope: advantage on Wisdom saves',
    blessed.abilities.find((a) => a.ability === 'wis').saveRollState, 'advantage')

  const def = spell('srd:spell.beacon-of-hope')
  check('beacon of hope: an advantage modifier scoped to death saves',
    def.effects.modifiers.some((m) =>
      m.channel === 'roll' && m.rollOp === 'advantage' && m.scope?.kinds?.includes('death')),
    JSON.stringify(def.effects.modifiers))
}

// ---------------------------------------------------------------------------
// Partial spells still say what the player must do themselves
// ---------------------------------------------------------------------------

{
  for (const sid of [
    'srd:spell.call-lightning', 'srd:spell.spirit-guardians', 'srd:spell.wind-wall',
    'srd:spell.vampiric-touch', 'srd:spell.haste', 'srd:spell.beacon-of-hope',
    'srd:spell.gaseous-form', 'srd:spell.fear', 'srd:spell.hypnotic-pattern', 'srd:spell.slow',
    'srd:spell.stinking-cloud', 'srd:spell.sleet-storm', 'srd:spell.bestow-curse',
    'srd:spell.mass-healing-word', 'srd:spell.conjure-animals', 'srd:spell.animate-dead',
    'srd:spell.phantom-steed', 'srd:spell.revivify', 'srd:spell.glyph-of-warding',
    'srd:spell.magic-circle', 'srd:spell.remove-curse'
  ]) {
    const def = spell(sid)
    check(`partial: ${def.name} carries narrative explaining its gap`,
      (def.effects.narrative?.[0]?.text.length ?? 0) > 0, sid)
    check(`partial: ${def.name} is flagged partial`,
      def.effects.completeness === 'partial', sid)
  }

  // Fireball, Lightning Bolt, Fly and Daylight are fully resolved — none
  // should be marked partial.
  for (const sid of ['srd:spell.fireball', 'srd:spell.lightning-bolt', 'srd:spell.fly', 'srd:spell.daylight']) {
    check.eq(`complete: ${spell(sid).name} needs no caveat`,
      spell(sid).effects.completeness, 'complete')
  }
}

// ---------------------------------------------------------------------------
// The four known casters actually draw on the new spells
// ---------------------------------------------------------------------------

{
  const pool = (classId, level, abilityScoreBase, selId) => {
    const c = caster(classId, level, abilityScoreBase)
    const pending = playerViewOf(c, content, { detail: 'inspect' }).progression.pendingChoices ?? []
    return pending.find((p) => p.id.endsWith(`:${selId}`))?.from ?? []
  }
  check('sorcerer: Fireball is a known-caster option',
    pool('srd:class.sorcerer', 5, { str: 8, dex: 14, con: 14, int: 10, wis: 10, cha: 16 }, 'spells')
      .includes('srd:spell.fireball'))
  check('warlock: Vampiric Touch is a known-caster option',
    pool('srd:class.warlock', 5, { str: 8, dex: 14, con: 14, int: 10, wis: 10, cha: 16 }, 'spells-known')
      .includes('srd:spell.vampiric-touch'))
  check('ranger: Conjure Animals is a known-caster option',
    pool('srd:class.ranger', 9, { str: 12, dex: 16, con: 14, int: 10, wis: 15, cha: 8 }, 'spells')
      .includes('srd:spell.conjure-animals'))
}

// ---------------------------------------------------------------------------
// The bug the last batch found: an unprepared spell must be rejected, not
// silently rolled
// ---------------------------------------------------------------------------

{
  const c = caster('srd:class.wizard', 9, { str: 8, dex: 14, con: 14, int: 17, wis: 12, cha: 10 })
  const casting = playerViewOf(c, content, { detail: 'inspect' }).spellcasting
  const fireball = casting.spells.find((s) => s.label === 'Fireball')
  check('resolveSpellcasting: an unprepared spell is listed but not available',
    fireball !== undefined && fireball.available === false, JSON.stringify(fireball))
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
