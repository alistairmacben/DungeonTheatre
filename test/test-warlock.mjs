// Warlock, levels 1 to 20, and the Fiend.
//
// The warlock is the odd caster and the odd shape was the point: one pool of
// slots whose *level* climbs. `ResourceDefinition.spellSlot.level` was a
// literal number and could not say that, so the class was modelled as three
// pools with two of them always empty — and stopped at 5th level, because the
// fourth and fifth bands would have meant five pools with four empty. A
// previous author left a note in warlock.ts naming the one-line fix. It is
// made: the level is a ValueExpr now.
//
// Its five Fiend features were also class features every warlock received
// whether or not they had made that pact, while the class declared a subclass
// slot pointing at a `srd:subclass.fiend` nobody had defined.
//
// Checked against docs/srd-source/classes.pdf p46-51.

import { checkContentIntegrity, loadContent, playerViewOf } from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()

const FIEND = 'srd:subclass.fiend'
const PROFS = 'srd:class.warlock.proficiencies'

function warlock(level, overrides = {}) {
  return {
    id: 'c:warlock', campaignId: 'camp-1', name: 'Nyx', playerId: 'p',
    speciesId: 'srd:species.tiefling',
    classLevels: [{
      classId: 'srd:class.warlock', level,
      ...(overrides.subclassId ? { subclassId: overrides.subclassId } : {})
    }],
    abilityScoreBase: { str: 8, dex: 14, con: 14, int: 12, wis: 10, cha: 16 },
    buildChoices: [], hitPointsCurrent: 80, hitPointsTemp: 0,
    hitDiceSpent: {}, resourcesSpent: {}, conditions: [], effectInstances: [],
    exhaustionLevel: 0,
    inventory: { instances: [], equipped: {}, attunedInstanceIds: [] },
    deathSaves: { successes: 0, failures: 0 }, toggles: {}, spellsPrepared: [],
    selections: overrides.selections
      ?? { [PROFS]: { skills: ['arcana', 'deception'] } }
  }
}

const viewAt = (level, o) =>
  playerViewOf(warlock(level, o ?? {}), content, { detail: 'inspect' })
const featureNames = (level, o) => viewAt(level, o).effects.map((e) => e.label)
const slots = (level) => viewAt(level).spellcasting?.slots ?? []

const countPending = (level, selId, o) =>
  (viewAt(level, o).progression.pendingChoices ?? [])
    .filter((p) => p.id.endsWith(`:${selId}`))
    .reduce((n, p) => n + p.count, 0)

// ---------------------------------------------------------------------------
// Pact Magic — one pool, and its level climbs
// ---------------------------------------------------------------------------

{
  // The whole reason this class is interesting. If this ever reads as more
  // than one row, the three-pools workaround has come back.
  for (const level of [1, 5, 11, 20]) {
    check.eq(`slots: exactly one pool at ${level}th`, slots(level).length, 1)
  }

  const levelOf = (l) => slots(l)[0]?.level
  check.eq('slots: 1st level at warlock 1', levelOf(1), 1)
  check.eq('slots: still 1st at 2nd', levelOf(2), 1)
  check.eq('slots: 2nd from 3rd', levelOf(3), 2)
  check.eq('slots: 3rd from 5th', levelOf(5), 3)
  check.eq('slots: 4th from 7th', levelOf(7), 4)
  check.eq('slots: 5th from 9th', levelOf(9), 5)
  check.eq('slots: and 5th for ever after', levelOf(20), 5)

  const countOf = (l) =>
    viewAt(l).resources.find((r) => r.id === 'warlock.pact-slots')?.maximum ?? 0
  check.eq('slots: one at 1st', countOf(1), 1)
  check.eq('slots: two from 2nd', countOf(2), 2)
  check.eq('slots: still two at 10th', countOf(10), 2)
  check.eq('slots: three from 11th', countOf(11), 3)
  check.eq('slots: four from 17th', countOf(17), 4)

  // The cadence that makes the warlock the warlock.
  check.eq('slots: come back on a short rest',
    viewAt(5).resources.find((r) => r.id === 'warlock.pact-slots')?.refresh.kind,
    'shortRest')
}

// ---------------------------------------------------------------------------
// The Cantrips Known and Spells Known columns
// ---------------------------------------------------------------------------

{
  const blank = { selections: {} }
  check.eq('cantrips: two at 1st', countPending(1, 'cantrips', blank), 2)
  check.eq('cantrips: three from 4th', countPending(4, 'cantrips', blank), 3)
  check.eq('cantrips: still three at 9th', countPending(9, 'cantrips', blank), 3)
  check.eq('cantrips: four from 10th, and no more', countPending(20, 'cantrips', blank), 4)

  check.eq('spells known: two at 1st', countPending(1, 'spells-known', blank), 2)
  check.eq('spells known: ten at 9th', countPending(9, 'spells-known', blank), 10)
  // The column is flat on 10th, 12th, 14th, 16th, 18th and 20th, so those
  // levels must produce no new question at all.
  check.eq('spells known: still ten at 10th', countPending(10, 'spells-known', blank), 10)
  check.eq('spells known: eleven at 11th', countPending(11, 'spells-known', blank), 11)
  check.eq('spells known: fifteen at 19th', countPending(19, 'spells-known', blank), 15)
  check.eq('spells known: and still fifteen at 20th',
    countPending(20, 'spells-known', blank), 15)
}

// ---------------------------------------------------------------------------
// Skills are chosen, not assigned
// ---------------------------------------------------------------------------

{
  const pending = viewAt(1, { selections: {} }).progression.pendingChoices ?? []
  const skills = pending.find((p) => p.id.endsWith(':skills'))
  check.eq('skills: two of seven', skills?.count, 2)
  check.eq('skills: from the seven the class list names', skills?.from?.length, 7)

  // A warlock who picked History and Religion is not proficient in Arcana,
  // which every warlock in the file used to be.
  const other = { [PROFS]: { skills: ['history', 'religion'] } }
  const chosen = viewAt(1, { selections: other }).skills
    .filter((s) => s.proficiency !== 'none').map((s) => s.id)
  check.eq('skills: exactly the two named', chosen.length, 2)
  check('skills: and they are the ones the player named',
    chosen.includes('history') && !chosen.includes('arcana'), chosen.join(', '))
}

// ---------------------------------------------------------------------------
// Features arrive when the table says
// ---------------------------------------------------------------------------

{
  const has = (level, name) => featureNames(level).includes(name)

  check('features: Eldritch Invocations at 2nd, not 1st',
    has(2, 'Eldritch Invocations') && !has(1, 'Eldritch Invocations'))
  check('features: Pact Boon at 3rd', has(3, 'Pact Boon') && !has(2, 'Pact Boon'))
  check('features: Mystic Arcanum (6th level) at 11th',
    has(11, 'Mystic Arcanum (6th level)') && !has(10, 'Mystic Arcanum (6th level)'))
  check('features: 7th-level arcanum at 13th, 8th at 15th, 9th at 17th',
    has(13, 'Mystic Arcanum (7th level)') && has(15, 'Mystic Arcanum (8th level)')
      && has(17, 'Mystic Arcanum (9th level)'))
  check('features: and 11th has only the first of them',
    has(11, 'Mystic Arcanum (6th level)') && !has(11, 'Mystic Arcanum (7th level)'))
  check('features: Eldritch Master at 20th',
    has(20, 'Eldritch Master') && !has(19, 'Eldritch Master'))

  // Each arcanum is one use back on a long rest, and they are separate pools.
  const arcana = viewAt(17).resources.filter((r) => r.id.startsWith('warlock.mystic-arcanum'))
  check.eq('arcanum: four separate uses at 17th', arcana.length, 4)
  check('arcanum: each is one use on a long rest',
    arcana.every((r) => r.maximum === 1 && r.refresh.kind === 'longRest'),
    JSON.stringify(arcana.map((r) => [r.maximum, r.refresh.kind])))
}

// ---------------------------------------------------------------------------
// The Fiend — a choice now, not a gift
// ---------------------------------------------------------------------------

{
  const has = (level, name) => featureNames(level, { subclassId: FIEND }).includes(name)

  check('fiend: Expanded Spell List and Dark One\'s Blessing at 1st',
    has(1, 'Expanded Spell List') && has(1, "Dark One's Blessing"))
  check('fiend: Dark One\'s Own Luck at 6th',
    has(6, "Dark One's Own Luck") && !has(5, "Dark One's Own Luck"))
  check('fiend: Fiendish Resilience at 10th',
    has(10, 'Fiendish Resilience') && !has(9, 'Fiendish Resilience'))
  check('fiend: Hurl Through Hell at 14th',
    has(14, 'Hurl Through Hell') && !has(13, 'Hurl Through Hell'))

  // Dark One's Own Luck comes back on a short rest, like the pact slots and
  // unlike the other two Fiend resources.
  const luck = viewAt(6, { subclassId: FIEND }).resources
    .find((r) => r.id === 'warlock.dark-ones-own-luck')
  check.eq('fiend: the luck is one use', luck?.maximum, 1)
  check.eq('fiend: back on a short rest', luck?.refresh.kind, 'shortRest')

  const hurl = viewAt(14, { subclassId: FIEND }).resources
    .find((r) => r.id === 'warlock.hurl-through-hell')
  check.eq('fiend: Hurl Through Hell is a long-rest use', hurl?.refresh.kind, 'longRest')

  // The patron is chosen at 1st, earlier than any class but the cleric — so an
  // undecided warlock is missing features from the very first level.
  const undecided = featureNames(14)
  check('fiend: an unchosen patron grants nothing',
    !undecided.includes("Dark One's Blessing") && !undecided.includes('Hurl Through Hell'))
  check('fiend: and the sheet says a decision is owed',
    undecided.includes('Warlock: subclass not chosen'), JSON.stringify(undecided))
}

// ---------------------------------------------------------------------------
// What the vocabulary cannot reach is visible
// ---------------------------------------------------------------------------

{
  const view = viewAt(20, { subclassId: FIEND })
  const named = (name) => view.effects.find((e) => e.label === name)

  for (const name of [
    'Eldritch Invocations', 'Pact Boon', 'Mystic Arcanum (9th level)',
    'Eldritch Master', 'Expanded Spell List', "Dark One's Blessing",
    "Dark One's Own Luck", 'Fiendish Resilience', 'Hurl Through Hell'
  ]) {
    const feature = named(name)
    check(`partial: ${name} still reaches the sheet`, feature !== undefined)
    check(`partial: ${name} says what the player must do themselves`,
      (feature?.effects?.length ?? 0) > 0 || (feature?.description?.length ?? 0) > 0,
      JSON.stringify(feature))
  }

  // The invocation count is a column now, not the two rows the file knew.
  const inv = JSON.stringify(named('Eldritch Invocations'))
  check('invocations: the narrative names the whole column, not just 2nd and 5th',
    inv.includes('eight') && inv.includes('18th'), inv)
}

// ---------------------------------------------------------------------------
// The gate every class passes
// ---------------------------------------------------------------------------

{
  const problems = checkContentIntegrity(content)
    .filter((p) => p.where.includes('warlock') || p.where.includes('fiend'))
  const errors = problems.filter((p) => p.severity === 'error')
  check('integrity: the warlock and the Fiend introduce no errors',
    errors.length === 0, errors.map((p) => `${p.where}: ${p.message}`).join(' | '))

  const debt = checkContentIntegrity(content)
    .filter((p) => p.message.includes('not authored yet') && p.message.includes('fiend'))
  check.eq('integrity: the Fiend is no longer unauthored debt', debt.length, 0)
}

check.report()
