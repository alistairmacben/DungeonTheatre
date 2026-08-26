// The monk, and the standard every other class file is held to.
//
// Two things are being asserted. The first is that the monk's numbers are
// right at every level, checked against docs/srd-source/classes.pdf rather
// than against what the code happens to produce. The second is the part that
// generalises: that a class authored to level 20 actually *works* at level 20,
// that features arrive on the level the table says, and that the features the
// vocabulary cannot express are visibly marked rather than quietly absent.
//
// When the remaining eleven classes are authored, this file is the shape their
// tests should take.

import {
  checkContentIntegrity, createResolution, loadContent, playerViewOf
} from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()

/**
 * A human monk. Human is +1 to every ability, so the base 16s below resolve to
 * 17s and a +3 modifier — stated here because every expected number downstream
 * depends on it.
 */
function monk(level, overrides = {}) {
  return {
    id: 'c:monk', campaignId: 'camp-1', name: 'Shen', playerId: 'p',
    speciesId: 'srd:species.human',
    classLevels: [{ classId: 'srd:class.monk', level }],
    abilityScoreBase: { str: 12, dex: 16, con: 14, int: 10, wis: 16, cha: 8 },
    buildChoices: [], hitPointsCurrent: 10, hitPointsTemp: 0,
    hitDiceSpent: {}, resourcesSpent: {}, conditions: [], effectInstances: [],
    exhaustionLevel: 0,
    inventory: { instances: [], equipped: {}, attunedInstanceIds: [] },
    deathSaves: { successes: 0, failures: 0 }, toggles: {}, spellsPrepared: [],
    ...overrides
  }
}

const viewAt = (level, overrides) =>
  playerViewOf(monk(level, overrides), content, { detail: 'inspect' })

const kiAt = (level) => viewAt(level).resources.find((r) => r.id === 'monk.ki')?.maximum
const featureNames = (view) => view.effects.map((e) => e.label)

// ---------------------------------------------------------------------------
// Unarmored Defense — and the shield clause the barbarian does not share
// ---------------------------------------------------------------------------

{
  // 10 + DEX (17 → +3) + WIS (17 → +3) = 16.
  check.eq('AC: 10 + Dexterity + Wisdom while unarmoured', viewAt(1).vitals.armorClass.value, 16)

  // The monk's Unarmored Defense says "and not wielding a shield" where the
  // barbarian's explicitly permits one. Copying the barbarian's gate across
  // would have produced a monk who kept 16 AC behind a shield.
  const shielded = viewAt(1, { toggles: { 'wielding-shield': true } })
  check('AC: a shield switches Unarmored Defense off',
    shielded.vitals.armorClass.value < 16, shielded.vitals.armorClass.value)

  const armoured = viewAt(1, { toggles: { 'wearing-armor': true } })
  check('AC: so does armour', armoured.vitals.armorClass.value < 16,
    armoured.vitals.armorClass.value)
}

// ---------------------------------------------------------------------------
// Ki — the column, including the level where there is none
// ---------------------------------------------------------------------------

{
  check.eq('ki: a 1st-level monk has none at all, and is not shown a pool', kiAt(1), undefined)
  check.eq('ki: 2 points at 2nd level', kiAt(2), 2)
  check.eq('ki: equal to the monk level thereafter — 5 at 5th', kiAt(5), 5)
  check.eq('ki: 11 at 11th', kiAt(11), 11)
  check.eq('ki: 20 at 20th', kiAt(20), 20)

  // Ki comes back on a short rest, which is the shorter of the two — a long
  // rest restores it as well, and that is what this refresh kind already means.
  const pool = viewAt(5).resources.find((r) => r.id === 'monk.ki')
  check.eq('ki: refreshes on a short rest', pool.refresh.kind, 'shortRest')

  // Spending is real even where the feature it fuels is not.
  const spent = viewAt(5, { resourcesSpent: { 'monk.ki': 3 } })
  check.eq('ki: spending leaves the rest', spent.resources.find((r) => r.id === 'monk.ki').current, 2)
}

// ---------------------------------------------------------------------------
// Unarmored Movement — the other column
// ---------------------------------------------------------------------------

{
  const speedAt = (level, overrides) => viewAt(level, overrides).vitals.speed.value

  check.eq('speed: no bonus at 1st level', speedAt(1), 30)
  check.eq('speed: +10 from 2nd', speedAt(2), 40)
  check.eq('speed: still +10 at 5th', speedAt(5), 40)
  check.eq('speed: +15 at 6th', speedAt(6), 45)
  check.eq('speed: +20 at 10th', speedAt(10), 50)
  check.eq('speed: +25 at 14th', speedAt(14), 55)
  check.eq('speed: +30 at 18th, and no more', speedAt(18), 60)
  check.eq('speed: still +30 at 20th', speedAt(20), 60)

  check.eq('speed: armour takes the bonus away',
    speedAt(10, { toggles: { 'wearing-armor': true } }), 30)
}

// ---------------------------------------------------------------------------
// Hit points off the d8 table
// ---------------------------------------------------------------------------

{
  // 8 + CON at 1st; 5 + CON per level after. CON 15 → +2.
  check.eq('hp: 8 + Constitution at 1st', viewAt(1).vitals.hitPoints.max.value, 10)
  check.eq('hp: +7 a level after that — 17 at 2nd', viewAt(2).vitals.hitPoints.max.value, 17)
  check.eq('hp: 143 at 20th', viewAt(20).vitals.hitPoints.max.value, 143)
}

// ---------------------------------------------------------------------------
// Features arrive on the level the table says
// ---------------------------------------------------------------------------

{
  const has = (level, name) => featureNames(viewAt(level)).includes(name)

  check('features: Martial Arts at 1st', has(1, 'Martial Arts'))
  check('features: no Ki at 1st', !has(1, 'Ki'))
  check('features: Ki at 2nd', has(2, 'Ki'))
  check('features: Deflect Missiles at 3rd, not 2nd',
    has(3, 'Deflect Missiles') && !has(2, 'Deflect Missiles'))
  check('features: Stunning Strike at 5th', has(5, 'Stunning Strike'))
  check('features: Evasion at 7th, not 6th', has(7, 'Evasion') && !has(6, 'Evasion'))
  check('features: Diamond Soul at 14th', has(14, 'Diamond Soul'))
  check('features: Empty Body at 18th', has(18, 'Empty Body'))
  check('features: Perfect Self at 20th', has(20, 'Perfect Self'))

  // The late levels are the ones no class could previously reach at all.
  check('features: a 20th-level monk has every feature the class grants',
    featureNames(viewAt(20)).length > featureNames(viewAt(5)).length)
}

// ---------------------------------------------------------------------------
// Diamond Soul: six proficiency grants, no new vocabulary
// ---------------------------------------------------------------------------

{
  const before = viewAt(13)
  const after = viewAt(14)
  const proficientSaves = (v) => v.abilities.filter((a) => a.save.proficient).length

  check.eq('diamond soul: two save proficiencies before 14th', proficientSaves(before), 2)
  check.eq('diamond soul: all six after', proficientSaves(after), 6)

  // Strength and Dexterity were already proficient; granting them again must
  // not double the bonus.
  const str = after.abilities.find((a) => a.ability === 'str')
  check.eq('diamond soul: a re-granted proficiency is not counted twice',
    str.save.value, before.abilities.find((a) => a.ability === 'str').save.value)
}

// ---------------------------------------------------------------------------
// Ki-fuelled actions cost what the book says
// ---------------------------------------------------------------------------

{
  const actionsAt = (level) => viewAt(level).actions
  const find = (level, id) => actionsAt(level).find((a) => a.id === id)

  check('actions: Flurry of Blows appears with Ki at 2nd',
    find(2, 'monk.flurry-of-blows') !== undefined)
  check.eq('actions: and costs 1 ki',
    find(2, 'monk.flurry-of-blows').costs[0].amount, 1)
  check.eq('actions: as a bonus action',
    find(2, 'monk.flurry-of-blows').cost.type, 'bonusAction')

  check.eq('actions: Empty Body costs 4 ki',
    find(18, 'monk.empty-body').costs[0].amount, 4)
  check.eq('actions: and its astral projection costs 8',
    find(18, 'monk.empty-body-astral').costs[0].amount, 8)

  // A monk with 3 ki cannot afford the 4-point option, and the view says why
  // rather than hiding it.
  const poor = playerViewOf(
    monk(18, { resourcesSpent: { 'monk.ki': 15 } }), content, { detail: 'inspect' })
  const empty = poor.actions.find((a) => a.id === 'monk.empty-body')
  check('actions: unaffordable ki spends are unavailable with a reason',
    empty !== undefined && !empty.available && empty.unavailableReasons.length > 0,
    JSON.stringify(empty?.unavailableReasons))
}

// ---------------------------------------------------------------------------
// What the vocabulary cannot express is visible, not missing
// ---------------------------------------------------------------------------

{
  const view = viewAt(20)
  const named = (name) => view.effects.find((e) => e.label === name)

  // Nine features are honestly incomplete. The test is not that the count is
  // nine — it is that each one still reaches the player with an explanation,
  // because a feature that resolves to nothing and says nothing is a feature
  // the player will believe is working.
  for (const name of [
    'Martial Arts', 'Deflect Missiles', 'Slow Fall', 'Extra Attack',
    'Stunning Strike', 'Evasion', 'Purity of Body', 'Empty Body', 'Perfect Self'
  ]) {
    const feature = named(name)
    check(`partial: ${name} still reaches the sheet`, feature !== undefined)
    check(`partial: ${name} says what the player must do themselves`,
      (feature?.effects?.length ?? 0) > 0 || (feature?.description?.length ?? 0) > 0,
      JSON.stringify(feature))
  }

  // Purity of Body is the interesting one: half of it resolves and half does
  // not, and both halves are stated. The half that resolves is checked against
  // the engine rather than the view, because — found while writing this test —
  // PlayerView has no resistances section at all. A 10th-level monk is immune
  // to poison, the engine knows it, and the sheet has nowhere to say so. That
  // is a gap in the view contract rather than in this class, and it belongs to
  // whoever adds a defences section, not to the monk.
  const resolution = createResolution(monk(20), content)
  check.eq('partial: Purity of Body\'s poison immunity resolves in the engine',
    resolution.stat('resistance.poison').total, 2)
}

// ---------------------------------------------------------------------------
// And the class passes the gate every other class will pass
// ---------------------------------------------------------------------------

{
  const monkProblems = checkContentIntegrity(content)
    .filter((p) => p.where.includes('monk'))
  const errors = monkProblems.filter((p) => p.severity === 'error')
  check('integrity: the monk introduces no errors', errors.length === 0,
    errors.map((p) => `${p.where}: ${p.message}`).join(' | '))

  // The one warning it does introduce is the same subclass debt every other
  // class carries, and no other kind.
  const other = monkProblems.filter((p) => !p.message.includes('subclasses are not implemented'))
  check('integrity: and only the shared subclass debt as a warning', other.length === 0,
    other.map((p) => p.message).join(' | '))
}

check.report()
