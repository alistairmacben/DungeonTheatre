// Fighter, levels 1 to 20, and the Champion archetype.
//
// The fighter was a levels-1-to-2 sketch in srd.ts: three features, a Fighting
// Style hardcoded to Defense for everyone, and Action Surge frozen at one use
// forever. This checks the real thing against docs/srd-source/classes.pdf p24-25.
//
// Three things here are the first of their kind in the content set and are
// checked as such: a choice of six styles, a stat with two clamps racing to the
// lower value, and half proficiency.

import { checkContentIntegrity, createResolution, loadContent, playerViewOf } from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()

const CHAMPION = 'srd:subclass.champion'
const PROFS = 'srd:class.fighter.proficiencies'

/**
 * A human fighter — human is +1 to everything, so STR 15 resolves to 16 (+3).
 * Skills default to athletics and perception, the two the old hardcoded
 * version granted, so the numbers stay comparable.
 */
function fighter(level, overrides = {}) {
  return {
    id: 'c:fighter', campaignId: 'camp-1', name: 'Aldren', playerId: 'p',
    speciesId: 'srd:species.human',
    classLevels: [{ classId: 'srd:class.fighter', level, ...(overrides.subclassId ? { subclassId: overrides.subclassId } : {}) }],
    abilityScoreBase: { str: 15, dex: 13, con: 14, int: 10, wis: 12, cha: 8 },
    buildChoices: [], hitPointsCurrent: 100, hitPointsTemp: 0,
    hitDiceSpent: {}, resourcesSpent: {}, conditions: [], effectInstances: [],
    exhaustionLevel: 0,
    inventory: { instances: [], equipped: {}, attunedInstanceIds: [] },
    deathSaves: { successes: 0, failures: 0 },
    toggles: overrides.toggles ?? {},
    selections: overrides.selections ?? { [PROFS]: { skills: ['athletics', 'perception'] } }
  }
}

const viewAt = (level, o) => playerViewOf(fighter(level, o ?? {}), content, { detail: 'inspect' })
const resAt = (level, id, o) => viewAt(level, o).resources.find((r) => r.id === id)?.maximum ?? 0
const featureNames = (level, o) => viewAt(level, o).effects.map((e) => e.label)

// ---------------------------------------------------------------------------
// The table
// ---------------------------------------------------------------------------

{
  // d10: 10 + CON at 1st, 6 + CON per level after. Human CON 14 → 15 → +2.
  check.eq('hp: 10 + CON at 1st', viewAt(1).vitals.hitPoints.max.value, 12)
  check.eq('hp: +8 a level thereafter', viewAt(2).vitals.hitPoints.max.value, 20)
  check.eq('hp: 164 at 20th', viewAt(20).vitals.hitPoints.max.value, 164)

  check.eq('action surge: none at 1st', resAt(1, 'fighter.action-surge'), 0)
  check.eq('action surge: one from 2nd', resAt(2, 'fighter.action-surge'), 1)
  check.eq('action surge: still one at 16th', resAt(16, 'fighter.action-surge'), 1)
  check.eq('action surge: two from 17th', resAt(17, 'fighter.action-surge'), 2)

  check.eq('indomitable: none before 9th', resAt(8, 'fighter.indomitable'), 0)
  check.eq('indomitable: one from 9th', resAt(9, 'fighter.indomitable'), 1)
  check.eq('indomitable: two from 13th', resAt(13, 'fighter.indomitable'), 2)
  check.eq('indomitable: three from 17th', resAt(17, 'fighter.indomitable'), 3)

  check.eq('second wind: one use, at every level', resAt(1, 'fighter.second-wind'), 1)
  check.eq('second wind: and still one at 20th', resAt(20, 'fighter.second-wind'), 1)
}

// ---------------------------------------------------------------------------
// Features arrive when the table says
// ---------------------------------------------------------------------------

{
  const has = (level, name) => featureNames(level).includes(name)

  check('features: Fighting Style and Second Wind at 1st',
    has(1, 'Fighting Style') && has(1, 'Second Wind'))
  check('features: Action Surge at 2nd, not 1st',
    has(2, 'Action Surge') && !has(1, 'Action Surge'))
  check('features: Extra Attack at 5th, not 4th',
    has(5, 'Extra Attack') && !has(4, 'Extra Attack'))
  check('features: Indomitable at 9th, not 8th',
    has(9, 'Indomitable') && !has(8, 'Indomitable'))
}

// ---------------------------------------------------------------------------
// Fighting Style — six options, each its own gated modifier
// ---------------------------------------------------------------------------

{
  const acWith = (toggles) => viewAt(1, { toggles }).vitals.armorClass.value

  // Base: 10 + DEX (13 → 14 → +2) = 12, no style, no armour.
  check.eq('style: no style chosen adds nothing', acWith({}), 12)

  // Defense needs BOTH its own toggle and armour — two real gates.
  check.eq('style: Defense alone does nothing without armour',
    acWith({ 'fighter.style.defense': true }), 12)
  check.eq('style: armour alone does nothing without the style',
    acWith({ 'wearing-armor': true }), 12)
  check.eq('style: Defense plus armour is +1',
    acWith({ 'fighter.style.defense': true, 'wearing-armor': true }), 13)

  // The old sketch hardcoded Defense for every fighter. Choosing a different
  // style must not grant it.
  check.eq('style: choosing Archery does not grant Defense',
    acWith({ 'fighter.style.archery': true, 'wearing-armor': true }), 12)

  // Six options offered, all six on the selection.
  const pending = viewAt(1, { selections: {} }).progression.pendingChoices
  const styleChoice = pending.find((p) => p.id.endsWith(':fighting-style'))
  check.eq('style: all six are offered', styleChoice?.from?.length, 6)
}

// ---------------------------------------------------------------------------
// A partial source has to be earned, not assumed
// ---------------------------------------------------------------------------

{
  // Three of the six styles cannot be expressed at all. Marking the whole
  // feature partial would flag every fighter's AC as unreliable — including a
  // Defense fighter whose AC is exactly right — so the unmodellable three live
  // in their own source, active only if one of them was actually chosen.
  const partialIds = (toggles) =>
    createResolution(fighter(1, { toggles }), content).partialSources.map((s) => s.id)

  const manual = 'srd:class.fighter.fighting-style-manual'
  check('partial: a Defense fighter does not carry the manual-style flag',
    !partialIds({ 'fighter.style.defense': true }).includes(manual))
  check('partial: a Protection fighter does',
    partialIds({ 'fighter.style.protection': true }).includes(manual))
  check('partial: so does a Two-Weapon Fighting one',
    partialIds({ 'fighter.style.two-weapon': true }).includes(manual))
}

// ---------------------------------------------------------------------------
// Skills are chosen, not handed over
// ---------------------------------------------------------------------------

{
  const skill = (level, id, o) => viewAt(level, o).skills.find((s) => s.id === id)

  // Athletics: STR 16 (+3) + proficiency 2 at 1st.
  check.eq('skills: a chosen skill is proficient', skill(1, 'athletics')?.total?.value ?? skill(1, 'athletics')?.total, 5)
  check('skills: and says so', skill(1, 'athletics')?.proficiency !== 'none')

  // An unchosen one is not.
  check('skills: an unchosen skill is not proficient',
    skill(1, 'survival')?.proficiency === 'none')

  // A different answer produces a different sheet — the point of it being a
  // choice at all.
  const other = { [PROFS]: { skills: ['survival', 'intimidation'] } }
  check('skills: choosing differently grants differently',
    skill(1, 'survival', { selections: other })?.proficiency !== 'none'
      && skill(1, 'athletics', { selections: other })?.proficiency === 'none')
}

// ---------------------------------------------------------------------------
// Champion
// ---------------------------------------------------------------------------

{
  const critAt = (level) =>
    createResolution(fighter(level, { subclassId: CHAMPION }), content).stat('critRange').total

  check.eq('champion: crit range untouched before 3rd', critAt(2), 20)
  check.eq('champion: 19 from 3rd — Improved Critical', critAt(3), 19)
  check.eq('champion: still 19 at 14th', critAt(14), 19)
  // Two `max` clamps on one path, composing to the lower without either
  // knowing the other exists. Two `set`s would have raced on declaration order.
  check.eq('champion: 18 from 15th — Superior Critical clamps lower', critAt(15), 18)
  check.eq('champion: and stays 18 at 20th', critAt(20), 18)

  // Without the subclass, none of it applies.
  check.eq('champion: an unchosen archetype changes nothing',
    createResolution(fighter(20), content).stat('critRange').total, 20)

  const names = (level) => featureNames(level, { subclassId: CHAMPION })
  check('champion: Remarkable Athlete at 7th', names(7).includes('Remarkable Athlete'))
  check('champion: Additional Fighting Style at 10th',
    names(10).includes('Additional Fighting Style'))
  check('champion: Survivor at 18th', names(18).includes('Survivor'))
}

// ---------------------------------------------------------------------------
// Remarkable Athlete — the first half proficiency in the content set
// ---------------------------------------------------------------------------

{
  const skill = (level, id) =>
    viewAt(level, { subclassId: CHAMPION }).skills.find((s) => s.id === id)
  const total = (s) => s?.total?.value ?? s?.total

  // Proficiency bonus is 3 at levels 5-8, so half rounded up is 2.
  check.eq('athlete: a DEX skill gains half proficiency at 7th',
    total(skill(7, 'acrobatics')) - total(skill(6, 'acrobatics')), 2)

  // "That doesn't already use your proficiency bonus" needs no rule of its
  // own: the resolver takes the highest multiplier, so a skill already
  // proficient is untouched.
  check.eq('athlete: a skill already proficient is unchanged',
    total(skill(7, 'athletics')), total(skill(6, 'athletics')))

  // Only Strength, Dexterity and Constitution. Wisdom is not on the list.
  check.eq('athlete: a WIS skill gains nothing',
    total(skill(7, 'insight')), total(skill(6, 'insight')))

  // The running long jump grows by the Strength modifier.
  const jump = (level) =>
    createResolution(fighter(level, { subclassId: CHAMPION }), content).stat('jump.long').total
  check.eq('athlete: the long jump grows by the Strength modifier',
    jump(7) - jump(6), 3)
}

// ---------------------------------------------------------------------------
// The gate every class passes
// ---------------------------------------------------------------------------

{
  const problems = checkContentIntegrity(content)
    .filter((p) => p.where.includes('fighter') || p.where.includes('champion'))
  const errors = problems.filter((p) => p.severity === 'error')
  check('integrity: the fighter and Champion introduce no errors',
    errors.length === 0, errors.map((p) => `${p.where}: ${p.message}`).join(' | '))

  // Champion is authored, so it is not counted as debt any more.
  const debt = checkContentIntegrity(content)
    .filter((p) => p.message.includes('not authored yet') && p.message.includes('champion'))
  check.eq('integrity: Champion is no longer unauthored debt', debt.length, 0)
}

check.report()
