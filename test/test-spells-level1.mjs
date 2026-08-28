// Thirty-eight 1st-level spells — the full union of every class's 1st-level
// column, minus what spells.ts and the class files already held.
//
// Two of them reuse a shape built for something else: Jump is the first spell
// to touch JUMP_LONG/JUMP_HIGH with `multiply` rather than `add`, and Hunter's
// Mark's tracking advantage is the ranger's own Favored Enemy shape — a
// roll-channel modifier gated on a toggle.
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

const effectOf = (spellId, character, ability, slotLevel) =>
  resolveSpellEffect(
    spell(spellId),
    { ability, characterLevel: character.classLevels[0].level, slotLevel },
    createResolution(character, content)
  )

// ---------------------------------------------------------------------------
// Every 1st-level union spell is in the content set
// ---------------------------------------------------------------------------

{
  const ids = [
    'burning-hands', 'thunderwave', 'guiding-bolt', 'inflict-wounds', 'healing-word',
    'shield-of-faith', 'jump', 'hunters-mark', 'heroism', 'bane', 'animal-friendship',
    'command', 'entangle', 'grease', 'hideous-laughter', 'faerie-fire',
    'protection-from-evil-and-good', 'sanctuary', 'alarm', 'comprehend-languages',
    'create-or-destroy-water', 'detect-evil-and-good', 'detect-poison-and-disease',
    'disguise-self', 'feather-fall', 'find-familiar', 'floating-disk', 'fog-cloud',
    'goodberry', 'illusory-script', 'purify-food-and-drink', 'silent-image',
    'speak-with-animals', 'unseen-servant', 'false-life', 'divine-favor',
    'expeditious-retreat', 'sleep', 'color-spray'
  ]
  const missing = ids.filter((n) => spell(`srd:spell.${n}`) === undefined)
  check.eq('all thirty-eight 1st-level spells exist', missing.length, 0, missing.join(', '))
}

// ---------------------------------------------------------------------------
// Damage and healing resolve exactly as the transcribed feature classes'
// spells did
// ---------------------------------------------------------------------------

{
  const c = caster('srd:class.sorcerer', 5, { str: 8, dex: 14, con: 14, int: 10, wis: 10, cha: 18 })
  const burning = effectOf('srd:spell.burning-hands', c, 'cha', 1)
  check.eq('burning hands: a Dexterity save', burning.save.ability, 'dex')
  check.eq('burning hands: half on success', burning.save.onSuccess, 'half')
  check.eq('burning hands: 3d6 fire at 1st-level slot', burning.damage[0].dice.count, 3)
  const upcast = effectOf('srd:spell.burning-hands', c, 'cha', 3)
  check.eq('burning hands: upcast to a 3rd-level slot adds 2d6', upcast.damage[0].dice.count, 5)

  const wave = effectOf('srd:spell.thunderwave', c, 'cha', 1)
  check.eq('thunderwave: a Constitution save', wave.save.ability, 'con')
  check.eq('thunderwave: 2d8 thunder', wave.damage[0].dice.count, 2)

  const bolt = effectOf('srd:spell.guiding-bolt',
    caster('srd:class.cleric', 5, { str: 12, dex: 10, con: 14, int: 10, wis: 16, cha: 12 }),
    'wis', 1)
  check.eq('guiding bolt: an attack, not a save', bolt.delivery, 'attack')
  check.eq('guiding bolt: 4d6 radiant', bolt.damage[0].dice.count, 4)

  const inflict = effectOf('srd:spell.inflict-wounds',
    caster('srd:class.cleric', 5, { str: 12, dex: 10, con: 14, int: 10, wis: 16, cha: 12 }),
    'wis', 1)
  check.eq('inflict wounds: 3d10 necrotic', inflict.damage[0].dice.count, 3)

  const heal = effectOf('srd:spell.healing-word',
    caster('srd:class.cleric', 5, { str: 12, dex: 10, con: 14, int: 10, wis: 16, cha: 12 }),
    'wis', 1)
  check.eq('healing word: an auto delivery', heal.delivery, 'auto')
  check.eq('healing word: 1d4 healing dice', heal.healing.dice.count, 1)
}

// ---------------------------------------------------------------------------
// Shield of Faith and Jump install real modifiers
// ---------------------------------------------------------------------------

{
  const withEffect = (spellDef) => {
    const c = caster('srd:class.cleric', 5, { str: 10, dex: 12, con: 14, int: 10, wis: 16, cha: 12 })
    c.effectInstances = [{
      instanceId: 'ei-1', definitionId: spellDef.id, sourceId: spellDef.effects.id,
      appliedAtSeconds: 0
    }]
    return playerViewOf(c, content, { detail: 'inspect' })
  }

  const shieldOn = withEffect(spell('srd:spell.shield-of-faith'))
  const shieldOff = playerViewOf(
    caster('srd:class.cleric', 5, { str: 10, dex: 12, con: 14, int: 10, wis: 16, cha: 12 }),
    content, { detail: 'inspect' })
  check.eq('shield of faith: +2 AC while the effect is active',
    shieldOn.vitals.armorClass.value - shieldOff.vitals.armorClass.value, 2)

  // Jump is the first spell to reach JUMP_LONG/JUMP_HIGH with `multiply`.
  // Human raises STR 10 to 11, giving a long jump of 11 feet (= score) and a
  // high jump of 3 feet (3 + the +0 modifier from 11) untouched.
  const jumper = caster('srd:class.wizard', 5, { str: 10, dex: 12, con: 14, int: 16, wis: 10, cha: 10 })
  const before = createResolution(jumper, content)
  check.eq('jump: long jump starts at Strength score', before.stat('jump.long').total, 11)

  jumper.effectInstances = [{
    instanceId: 'ei-2', definitionId: 'srd:spell.jump', sourceId: 'srd:spell.jump',
    appliedAtSeconds: 0
  }]
  const after = createResolution(jumper, content)
  check.eq('jump: long jump triples', after.stat('jump.long').total, 33)
  check.eq('jump: high jump triples too', after.stat('jump.high').total, 9)
}

// ---------------------------------------------------------------------------
// Hunter's Mark reuses Favored Enemy's toggle-gated advantage
// ---------------------------------------------------------------------------

{
  const marked = (toggles) => {
    const c = caster('srd:class.ranger', 5, { str: 12, dex: 16, con: 14, int: 10, wis: 15, cha: 8 })
    c.effectInstances = [{
      instanceId: 'ei-3', definitionId: 'srd:spell.hunters-mark',
      sourceId: 'srd:spell.hunters-mark', appliedAtSeconds: 0
    }]
    c.toggles = toggles
    return playerViewOf(c, content, { detail: 'inspect' })
  }
  check.eq('hunter\'s mark: no advantage untoggled',
    marked({}).skills.find((s) => s.id === 'survival').rollState, 'normal')
  check.eq('hunter\'s mark: advantage on Survival when marked',
    marked({ 'spell.hunters-mark': true }).skills.find((s) => s.id === 'survival').rollState,
    'advantage')
  check.eq('hunter\'s mark: and on Perception',
    marked({ 'spell.hunters-mark': true }).skills.find((s) => s.id === 'perception').rollState,
    'advantage')
}

// ---------------------------------------------------------------------------
// Heroism suppresses frightened the way Aura of Courage does
// ---------------------------------------------------------------------------

{
  const heroic = () => {
    const c = caster('srd:class.bard', 5, { str: 10, dex: 12, con: 12, int: 10, wis: 10, cha: 16 })
    c.conditions = [{ conditionId: 'srd:condition.frightened' }]
    c.toggles = { 'frightened.sourceInSight': true }
    c.effectInstances = [{
      instanceId: 'ei-4', definitionId: 'srd:spell.heroism',
      sourceId: 'srd:spell.heroism', appliedAtSeconds: 0
    }]
    return playerViewOf(c, content, { detail: 'inspect' })
  }
  const plain = () => {
    const c = caster('srd:class.bard', 5, { str: 10, dex: 12, con: 12, int: 10, wis: 10, cha: 16 })
    c.conditions = [{ conditionId: 'srd:condition.frightened' }]
    c.toggles = { 'frightened.sourceInSight': true }
    return playerViewOf(c, content, { detail: 'inspect' })
  }
  const attackRollState = (v) => v.abilities.find((a) => a.ability === 'str').rollState ?? 'normal'
  check.eq('heroism: frightened bites without the spell', attackRollState(plain()), 'disadvantage')
  check.eq('heroism: suspended with it active', attackRollState(heroic()), 'normal')
}

// ---------------------------------------------------------------------------
// Partial spells still say what the player must do themselves
// ---------------------------------------------------------------------------

{
  for (const sid of [
    'srd:spell.thunderwave', 'srd:spell.guiding-bolt', 'srd:spell.hunters-mark',
    'srd:spell.heroism', 'srd:spell.bane', 'srd:spell.animal-friendship',
    'srd:spell.command', 'srd:spell.entangle', 'srd:spell.grease',
    'srd:spell.hideous-laughter', 'srd:spell.faerie-fire',
    'srd:spell.protection-from-evil-and-good', 'srd:spell.sanctuary',
    'srd:spell.find-familiar', 'srd:spell.unseen-servant', 'srd:spell.false-life',
    'srd:spell.divine-favor'
  ]) {
    const def = spell(sid)
    check(`partial: ${def.name} carries narrative explaining its gap`,
      (def.effects.narrative?.[0]?.text.length ?? 0) > 0, sid)
    check(`partial: ${def.name} is flagged partial`,
      def.effects.completeness === 'partial', sid)
  }

  // Sleep and Color Spray are the fourth resolution shape — no attack, no
  // save — and that is not a gap, so neither should be marked partial.
  check.eq('sleep: not partial — nothing here is missing, it is a different shape',
    spell('srd:spell.sleep').effects.completeness, 'complete')
  check.eq('color spray: likewise', spell('srd:spell.color-spray').effects.completeness, 'complete')
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
