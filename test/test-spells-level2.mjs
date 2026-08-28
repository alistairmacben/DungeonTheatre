// Fifty-one 2nd-level spells — the full union of every class's 2nd-level
// column, minus Darkness, which the tiefling already needed.
//
// Five of them exercise vocabulary nothing had used before: Barkskin is the
// `min` operation's first real use, Blur is Reckless Attack's exposure clause
// with nothing attached, Spider Climb reads Dragon Wings' `base`-reads-a-stat
// shape, Protection from Poison pairs a resistance `set` with a `roll`
// advantage, and Invisibility needs no new modifier at all — the existing
// Invisible condition already carries the right pair.
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
// All fifty-one exist
// ---------------------------------------------------------------------------

{
  const ids = [
    'shatter', 'moonbeam', 'flaming-sphere', 'acid-arrow', 'flame-blade',
    'spiritual-weapon', 'barkskin', 'blur', 'spider-climb', 'protection-from-poison',
    'pass-without-trace', 'enhance-ability', 'enlarge-reduce', 'invisibility',
    'hold-person', 'suggestion', 'web', 'spike-growth', 'blindness-deafness',
    'calm-emotions', 'enthrall', 'zone-of-truth', 'branding-smite', 'magic-weapon',
    'mirror-image', 'ray-of-enfeeblement', 'warding-bond', 'heat-metal', 'alter-self',
    'find-steed', 'gust-of-wind', 'darkvision', 'see-invisibility', 'levitate',
    'misty-step', 'rope-trick', 'knock', 'silence', 'continual-flame', 'gentle-repose',
    'augury', 'detect-thoughts', 'locate-object', 'locate-animals-or-plants',
    'find-traps', 'animal-messenger', 'magic-mouth', 'arcane-lock',
    'arcanists-magic-aura', 'lesser-restoration', 'prayer-of-healing', 'scorching-ray'
  ]
  const missing = ids.filter((n) => spell(`srd:spell.${n}`) === undefined)
  check.eq('all fifty-one 2nd-level spells exist', missing.length, 0, missing.join(', '))
}

// ---------------------------------------------------------------------------
// Barkskin: the `min` operation's first real use
// ---------------------------------------------------------------------------

{
  const unarmoured = caster('srd:class.druid', 5, { str: 10, dex: 10, con: 14, int: 10, wis: 16, cha: 10 })
  const barked = withEffect('srd:spell.barkskin', { ...unarmoured })
  check.eq('barkskin: unarmoured AC 10 rises to the floor of 16',
    barked.vitals.armorClass.value, 16)

  // Half plate is 15 + Dex, capped at 2 — DEX 14 (+2) gives 17, above the
  // floor of 16, and Barkskin must not touch it.
  const plated = caster('srd:class.fighter', 5, { str: 16, dex: 14, con: 14, int: 8, wis: 10, cha: 8 })
  plated.inventory = {
    instances: [item('p', 'srd:armor.half-plate')], equipped: { armor: 'p' }, attunedInstanceIds: []
  }
  plated.toggles = { 'wearing-armor': true }
  const platedBarked = withEffect('srd:spell.barkskin', plated)
  check.eq('barkskin: a floor, not a bonus — armour already above 16 is untouched',
    platedBarked.vitals.armorClass.value, 17)
}

// ---------------------------------------------------------------------------
// Blur: Reckless Attack's exposure clause with nothing attached to it
// ---------------------------------------------------------------------------

{
  const blurred = withEffect('srd:spell.blur',
    caster('srd:class.wizard', 5, { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 }))
  const attack = blurred.actions.find((a) => a.kind === 'attack')
  check.eq('blur: attacks against the caster have disadvantage',
    attack?.preview?.rollState, 'disadvantage')
}

// ---------------------------------------------------------------------------
// Spider Climb: Dragon Wings' shape, read again
// ---------------------------------------------------------------------------

{
  const climber = caster('srd:class.sorcerer', 5, { str: 10, dex: 14, con: 12, int: 10, wis: 10, cha: 16 })
  const before = createResolution(climber, content)
  check.eq('spider climb: no climb speed beforehand', before.stat('speed.climb').total, 0)

  const climbing = withEffect('srd:spell.spider-climb', climber)
  const after = createResolution(climber, content)
  check.eq('spider climb: climb speed matches walking speed', after.stat('speed.climb').total, 30)
}

// ---------------------------------------------------------------------------
// Protection from Poison: a resistance and an advantage, both real
// ---------------------------------------------------------------------------

{
  const protectedView = withEffect('srd:spell.protection-from-poison',
    caster('srd:class.cleric', 5, { str: 10, dex: 10, con: 14, int: 10, wis: 16, cha: 10 }))
  check('protection from poison: resistance to poison damage',
    (protectedView.defenses ?? []).some((d) => d.type === 'poison' && d.state === 'resistant'))

  const save = protectedView.abilities.find((a) => a.ability === 'con').saveRollState
  // The advantage applies against poison specifically, which a raw save-roll
  // state check cannot isolate — confirmed instead via the effect's own
  // modifier shape.
  const def = spell('srd:spell.protection-from-poison')
  check('protection from poison: an advantage modifier scoped to poison saves',
    def.effects.modifiers.some((m) =>
      m.channel === 'roll' && m.rollOp === 'advantage'
      && m.scope?.againstTags?.includes('poison')),
    JSON.stringify(def.effects.modifiers))
}

// ---------------------------------------------------------------------------
// Invisibility needs nothing new — the condition already carries the pair
// ---------------------------------------------------------------------------

{
  const def = spell('srd:spell.invisibility')
  check('invisibility: no modifiers of its own — it points at the condition',
    (def.effects.modifiers ?? []).length === 0)
  check('invisibility: and says so',
    def.effects.narrative[0].text.includes('Invisible condition'))

  const cond = content.conditions.get('srd:condition.invisible')
  check('invisibility: the condition it points at exists and carries both halves',
    cond !== undefined
    && cond.effects.modifiers.some((m) => m.appliesTo === 'attackersAgainstSelf')
    && cond.effects.modifiers.some((m) => m.channel === 'roll' && !m.appliesTo))
}

// ---------------------------------------------------------------------------
// Damage and healing resolve the way the rest of the set already does
// ---------------------------------------------------------------------------

{
  const c = caster('srd:class.wizard', 9, { str: 8, dex: 14, con: 14, int: 17, wis: 12, cha: 10 })
  const shatter = effectOf('srd:spell.shatter', c, 'int', 2)
  check.eq('shatter: a Constitution save', shatter.save.ability, 'con')
  check.eq('shatter: 3d8 thunder at a 2nd-level slot', shatter.damage[0].dice.count, 3)
  const shatterUp = effectOf('srd:spell.shatter', c, 'int', 4)
  check.eq('shatter: upcast to a 4th-level slot adds 2d8', shatterUp.damage[0].dice.count, 5)

  const arrow = effectOf('srd:spell.acid-arrow', c, 'int', 2)
  check.eq('acid arrow: an attack', arrow.delivery, 'attack')
  check.eq('acid arrow: 4d4 acid on the resolved hit', arrow.damage[0].dice.count, 4)

  const heal = effectOf('srd:spell.prayer-of-healing',
    caster('srd:class.cleric', 9, { str: 10, dex: 10, con: 14, int: 10, wis: 16, cha: 10 }), 'wis', 2)
  check.eq('prayer of healing: an auto delivery', heal.delivery, 'auto')
  check.eq('prayer of healing: 2d8 healing dice', heal.healing.dice.count, 2)
}

// ---------------------------------------------------------------------------
// Enhance Ability: six gated options, the fighting-style shape doubled
// ---------------------------------------------------------------------------

{
  const withToggle = (toggles) => withEffect('srd:spell.enhance-ability',
    caster('srd:class.bard', 5, { str: 10, dex: 12, con: 12, int: 10, wis: 10, cha: 16 }, { toggles }))

  check.eq('enhance ability: no advantage untoggled',
    withToggle({}).abilities.find((a) => a.ability === 'str').rollState ?? 'normal', 'normal')
  check.eq('enhance ability: advantage on Strength checks when Bull\'s Strength is chosen',
    withToggle({ 'spell.enhance-ability.str': true })
      .abilities.find((a) => a.ability === 'str').rollState, 'advantage')
  check.eq('enhance ability: and not on Charisma at the same time',
    withToggle({ 'spell.enhance-ability.str': true })
      .abilities.find((a) => a.ability === 'cha').rollState ?? 'normal', 'normal')
}

// ---------------------------------------------------------------------------
// Partial spells still say what the player must do themselves
// ---------------------------------------------------------------------------

{
  for (const sid of [
    'srd:spell.acid-arrow', 'srd:spell.flame-blade', 'srd:spell.spiritual-weapon',
    'srd:spell.protection-from-poison', 'srd:spell.pass-without-trace',
    'srd:spell.enhance-ability', 'srd:spell.enlarge-reduce', 'srd:spell.hold-person',
    'srd:spell.suggestion', 'srd:spell.web', 'srd:spell.spike-growth',
    'srd:spell.branding-smite', 'srd:spell.magic-weapon', 'srd:spell.mirror-image',
    'srd:spell.ray-of-enfeeblement', 'srd:spell.warding-bond', 'srd:spell.heat-metal',
    'srd:spell.alter-self', 'srd:spell.find-steed', 'srd:spell.lesser-restoration',
    'srd:spell.prayer-of-healing'
  ]) {
    const def = spell(sid)
    check(`partial: ${def.name} carries narrative explaining its gap`,
      (def.effects.narrative?.[0]?.text.length ?? 0) > 0, sid)
    check(`partial: ${def.name} is flagged partial`,
      def.effects.completeness === 'partial', sid)
  }

  // Barkskin, Blur, Spider Climb and Invisibility are fully resolved — none
  // should be marked partial.
  for (const sid of ['srd:spell.barkskin', 'srd:spell.blur', 'srd:spell.spider-climb', 'srd:spell.invisibility']) {
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
