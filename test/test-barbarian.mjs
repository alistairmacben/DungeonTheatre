// Barbarian, levels 1 to 20, and the Path of the Berserker.
//
// The barbarian stopped at 5th level, its two skills were Athletics and
// Intimidation for every barbarian who would ever exist, and the Rage Damage
// column was frozen at "+2" — the 1st-to-8th-level row — inside the label of
// the attack option that applied it. Frenzy was authored as a *class* feature
// granted to every barbarian at 3rd, while the class also declared a subclass
// slot pointing at a `srd:subclass.berserker` nobody had written. The same
// shape the cleric, bard and rogue were in.
//
// Checked against docs/srd-source/classes.pdf p8-10.

import { checkContentIntegrity, loadContent, playerViewOf } from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()

const BERSERKER = 'srd:subclass.berserker'
const RAGE = 'barbarian.rage'

function barbarian(level, overrides = {}) {
  return {
    id: 'c:barbarian', campaignId: 'camp-1', name: 'Grog', playerId: 'p',
    speciesId: 'srd:species.half-orc',
    classLevels: [{
      classId: 'srd:class.barbarian', level,
      ...(overrides.subclassId ? { subclassId: overrides.subclassId } : {})
    }],
    abilityScoreBase: { str: 16, dex: 14, con: 16, int: 8, wis: 12, cha: 10 },
    buildChoices: [], hitPointsCurrent: 100, hitPointsTemp: 0,
    hitDiceSpent: {}, resourcesSpent: {}, conditions: overrides.conditions ?? [],
    effectInstances: overrides.effectInstances ?? [],
    exhaustionLevel: 0,
    inventory: {
      instances: [{
        instanceId: 'g1', definitionId: 'srd:weapon.greataxe',
        contentVersion: 1, identified: true
      }],
      equipped: { mainHand: 'g1' }, attunedInstanceIds: []
    },
    deathSaves: { successes: 0, failures: 0 },
    toggles: overrides.toggles ?? {}, spellsPrepared: [],
    selections: overrides.selections
      ?? { 'srd:class.barbarian.proficiencies': { skills: ['athletics', 'intimidation'] } }
  }
}

const viewAt = (level, o) =>
  playerViewOf(barbarian(level, o ?? {}), content, { detail: 'inspect' })
const featureNames = (level, o) => viewAt(level, o).effects.map((e) => e.label)
const raging = (level, o) => viewAt(level, { ...(o ?? {}), toggles: { [RAGE]: true } })

// ---------------------------------------------------------------------------
// The Barbarian table
// ---------------------------------------------------------------------------

{
  const rages = (level) =>
    viewAt(level).resources.find((r) => r.id === 'barbarian.rages')?.maximum ?? 0

  check.eq('rages: two at 1st', rages(1), 2)
  check.eq('rages: three at 3rd', rages(3), 3)
  check.eq('rages: still two at 2nd', rages(2), 2)
  check.eq('rages: four at 6th', rages(6), 4)
  check.eq('rages: five at 12th', rages(12), 5)
  check.eq('rages: six at 17th', rages(17), 6)
  check.eq('rages: and the 20th row reads Unlimited, which a number cannot say',
    rages(20), 6)

  // The Rage Damage column was the label of an attack option, written once as
  // "+2" and therefore wrong for every barbarian past 8th level.
  const rageDamage = (level) => {
    const attack = raging(level).actions.find((a) => a.kind === 'attack')
    return attack?.options?.find((o) => o.id === 'barbarian.rage.damage')?.description
  }
  check('rage damage: +2 at 1st', rageDamage(1)?.includes('+2'), rageDamage(1))
  check('rage damage: still +2 at 8th', rageDamage(8)?.includes('+2'), rageDamage(8))
  check('rage damage: +3 from 9th', rageDamage(9)?.includes('+3'), rageDamage(9))
  check('rage damage: +4 from 16th', rageDamage(16)?.includes('+4'), rageDamage(16))

  // And the label itself must no longer promise a number it cannot keep.
  const label = raging(16).actions.find((a) => a.kind === 'attack')
    ?.options?.find((o) => o.id === 'barbarian.rage.damage')?.label
  check('rage damage: the label names no fixed amount',
    !label?.includes('+2') && !label?.includes('+4'), label)
}

// ---------------------------------------------------------------------------
// Skills are chosen, not assigned
// ---------------------------------------------------------------------------

{
  const pending = viewAt(1, { selections: {} }).progression.pendingChoices ?? []
  const skills = pending.find((p) => p.id.endsWith(':skills'))
  check.eq('skills: two of six', skills?.count, 2)
  check.eq('skills: from the six the class list names', skills?.from?.length, 6)

  // The half-orc's Menacing grants Intimidation on its own, so an unanswered
  // barbarian still has that one and nothing else.
  const blank = viewAt(1, { selections: {} }).skills
    .filter((s) => s.proficiency !== 'none').map((s) => s.id)
  check.eq('skills: an unanswered choice grants nothing beyond the species',
    blank.join(','), 'intimidation')

  // A barbarian who picked Nature and Survival is not proficient in Athletics,
  // which every barbarian in the file used to be.
  const other = {
    'srd:class.barbarian.proficiencies': { skills: ['nature', 'survival'] }
  }
  const chosen = viewAt(1, { selections: other }).skills
    .filter((s) => s.proficiency !== 'none').map((s) => s.id)
  check.eq('skills: the two named, plus the half-orc\'s Intimidation', chosen.length, 3)
  check('skills: and they are the ones the player named',
    chosen.includes('nature') && chosen.includes('survival')
      && !chosen.includes('athletics'), chosen.join(', '))
}

// ---------------------------------------------------------------------------
// Features arrive when the table says
// ---------------------------------------------------------------------------

{
  const has = (level, name) => featureNames(level).includes(name)

  check('features: Feral Instinct at 7th, not 6th',
    has(7, 'Feral Instinct') && !has(6, 'Feral Instinct'))
  check('features: Brutal Critical (1 die) at 9th',
    has(9, 'Brutal Critical (1 die)') && !has(8, 'Brutal Critical (1 die)'))
  check('features: two dice at 13th, three at 17th',
    has(13, 'Brutal Critical (2 dice)') && has(17, 'Brutal Critical (3 dice)'))
  // Three separate features, so a 17th-level barbarian carries all three rows
  // — but each names its own number and none of them is stale.
  check('features: 13th names two dice, not one',
    has(13, 'Brutal Critical (2 dice)') && !has(9, 'Brutal Critical (2 dice)'))
  check('features: Relentless Rage at 11th', has(11, 'Relentless Rage') && !has(10, 'Relentless Rage'))
  check('features: Persistent Rage at 15th', has(15, 'Persistent Rage') && !has(14, 'Persistent Rage'))
  check('features: Indomitable Might at 18th', has(18, 'Indomitable Might') && !has(17, 'Indomitable Might'))
  check('features: Primal Champion at 20th', has(20, 'Primal Champion') && !has(19, 'Primal Champion'))

  // Feral Instinct's initiative half is wholly expressible — initiative is a
  // roll kind — so it must show as advantage rather than as prose.
  const init = (level) => viewAt(level).vitals.initiative
  check.eq('feral instinct: no advantage on initiative at 6th',
    init(6).rollState ?? 'normal', 'normal')
  check.eq('feral instinct: advantage from 7th', init(7).rollState, 'advantage')
  check('feral instinct: and the sheet says where it came from',
    (init(7).rollStateReasons ?? []).some((rr) => rr.includes('Feral Instinct')),
    JSON.stringify(init(7).rollStateReasons))

  // Primal Champion's +4s are ordinary adds and must reach every derived stat
  // that reads them. Half-orc STR 16 + 2 = 18 (+4); at 20th, 22 (+6).
  const str = (level) => viewAt(level).abilities.find((a) => a.ability === 'str')
  check.eq('primal champion: Strength 18 at 19th', str(19).score.value, 18)
  check.eq('primal champion: 22 at 20th', str(20).score.value, 22)
  check.eq('primal champion: and the modifier follows', str(20).modifier.value, 6)
}

// ---------------------------------------------------------------------------
// Rage is still one switch driving five mechanics
// ---------------------------------------------------------------------------

{
  const calm = viewAt(5)
  const angry = raging(5)
  const str = (v) => v.abilities.find((a) => a.ability === 'str')

  check.eq('rage: no advantage on Strength checks when calm',
    str(calm).rollState ?? 'normal', 'normal')
  check.eq('rage: advantage on Strength checks while raging',
    str(angry).rollState, 'advantage')
  check.eq('rage: and on Strength saves, which are a different roll',
    str(angry).saveRollState, 'advantage')
  check.eq('rage: Dexterity is untouched — the scope is Strength only',
    calm.abilities.find((a) => a.ability === 'dex').rollState ?? 'normal', 'normal')

  const resist = (v) => (v.defenses ?? []).filter((d) => d.state === 'resistant').length
  check('rage: three resistances arrive with the rage',
    resist(angry) - resist(calm) === 3, `${resist(calm)} → ${resist(angry)}`)
}

// ---------------------------------------------------------------------------
// Path of the Berserker — a choice now, not a gift
// ---------------------------------------------------------------------------

{
  const has = (level, name) => featureNames(level, { subclassId: BERSERKER }).includes(name)

  check('berserker: Frenzy at 3rd', has(3, 'Frenzy') && !has(2, 'Frenzy'))
  check('berserker: Mindless Rage at 6th', has(6, 'Mindless Rage') && !has(5, 'Mindless Rage'))
  check('berserker: Intimidating Presence at 10th',
    has(10, 'Intimidating Presence') && !has(9, 'Intimidating Presence'))
  check('berserker: Retaliation at 14th', has(14, 'Retaliation') && !has(13, 'Retaliation'))

  // Frenzy's bonus attack is only offered while raging, which is the whole
  // shape of the feature.
  const frenzyAt = (toggles) => viewAt(5, { subclassId: BERSERKER, toggles })
    .actions.find((a) => a.id === 'barbarian.frenzy.attack')
  check('berserker: Frenzy is unavailable when not raging',
    frenzyAt({})?.available === false, JSON.stringify(frenzyAt({})?.unavailableReasons))
  check('berserker: and available while raging',
    frenzyAt({ [RAGE]: true })?.available === true)

  // Intimidating Presence's DC is the same declared formula the monk's
  // Stunning Strike uses. Half-orc CHA 10 → +0, proficiency at 10th is +4.
  // Half-orc CHA 10, proficiency at 10th is +4: 8 + 4 + 0 = 12. The DC is a
  // declared stat, so it explains itself in a breakdown rather than being
  // computed inside whatever renders it — and until this class it was declared
  // by the monk and shown to nobody.
  const dcLine = viewAt(10, { subclassId: BERSERKER }).effects
    .find((e) => e.label === 'Intimidating Presence')?.effects ?? []
  check('berserker: Intimidating Presence states its save DC',
    dcLine.includes('save DC 12'), JSON.stringify(dcLine))

  // Without the path, none of it — and the sheet says a decision is owed.
  const undecided = featureNames(14)
  check('berserker: an unchosen path grants nothing',
    !undecided.includes('Frenzy') && !undecided.includes('Retaliation'))
  check('berserker: and the sheet says so',
    undecided.includes('Barbarian: subclass not chosen'), JSON.stringify(undecided))
}

// ---------------------------------------------------------------------------
// Mindless Rage actually suspends the two conditions
// ---------------------------------------------------------------------------

{
  // Frightened's mechanical effect is disadvantage on attacks while the source
  // is in sight. Mindless Rage suspends the condition rather than removing it,
  // so the chip stays and the modifiers stop.
  const SEEN = 'frightened.sourceInSight'
  const attackState = (level, toggles) => {
    const v = viewAt(level, {
      subclassId: BERSERKER,
      conditions: [{ conditionId: 'srd:condition.frightened' }],
      toggles
    })
    return v.actions.find((a) => a.kind === 'attack')?.preview?.rollState
  }

  check.eq('mindless rage: frightened bites at 5th, before the feature',
    attackState(5, { [SEEN]: true, [RAGE]: true }), 'disadvantage')
  check.eq('mindless rage: and still bites at 6th when not raging',
    attackState(6, { [SEEN]: true }), 'disadvantage')
  check.eq('mindless rage: but is suspended while raging from 6th',
    attackState(6, { [SEEN]: true, [RAGE]: true }), 'normal')
}

// ---------------------------------------------------------------------------
// What the vocabulary cannot reach is visible
// ---------------------------------------------------------------------------

{
  const view = viewAt(20, { subclassId: BERSERKER })
  const named = (name) => view.effects.find((e) => e.label === name)

  for (const name of [
    'Rage', 'Extra Attack', 'Feral Instinct', 'Brutal Critical (3 dice)',
    'Relentless Rage', 'Persistent Rage', 'Indomitable Might', 'Primal Champion',
    'Frenzy', 'Intimidating Presence'
  ]) {
    const feature = named(name)
    check(`partial: ${name} still reaches the sheet`, feature !== undefined)
    check(`partial: ${name} says what the player must do themselves`,
      (feature?.effects?.length ?? 0) > 0 || (feature?.description?.length ?? 0) > 0,
      JSON.stringify(feature))
  }
}

// ---------------------------------------------------------------------------
// The gate every class passes
// ---------------------------------------------------------------------------

{
  const problems = checkContentIntegrity(content)
    .filter((p) => p.where.includes('barbarian') || p.where.includes('berserker'))
  const errors = problems.filter((p) => p.severity === 'error')
  check('integrity: the barbarian and the Berserker introduce no errors',
    errors.length === 0, errors.map((p) => `${p.where}: ${p.message}`).join(' | '))

  const debt = checkContentIntegrity(content)
    .filter((p) => p.message.includes('not authored yet') && p.message.includes('berserker'))
  check.eq('integrity: the Berserker is no longer unauthored debt', debt.length, 0)
}

check.report()
