// Bard, levels 1 to 20, and the College of Lore.
//
// The bard's Spells Known table already ran to 20 (see test-bard-known-spells),
// but its actual features stopped at 5th, and the College of Lore was two class
// features every bard received whether or not they had joined it — while the
// class also declared a subclass slot pointing at a `srd:subclass.lore` nobody
// had defined. The same shape the cleric's Life Domain was in.
//
// Checked against docs/srd-source/classes.pdf p11-14.

import { checkContentIntegrity, loadContent, playerViewOf } from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()

const LORE = 'srd:subclass.lore'

function bard(level, overrides = {}) {
  return {
    id: 'c:bard', campaignId: 'camp-1', name: 'Lior', playerId: 'p',
    speciesId: 'srd:species.half-elf',
    classLevels: [{
      classId: 'srd:class.bard', level,
      ...(overrides.subclassId ? { subclassId: overrides.subclassId } : {})
    }],
    abilityScoreBase: { str: 8, dex: 14, con: 13, int: 10, wis: 12, cha: 15 },
    buildChoices: [], hitPointsCurrent: 80, hitPointsTemp: 0,
    hitDiceSpent: {}, resourcesSpent: {}, conditions: [], effectInstances: [],
    exhaustionLevel: 0,
    inventory: { instances: [], equipped: {}, attunedInstanceIds: [] },
    deathSaves: { successes: 0, failures: 0 }, toggles: {}, spellsPrepared: [],
    ...(overrides.selections !== undefined ? { selections: overrides.selections } : {})
  }
}

const viewAt = (level, o) => playerViewOf(bard(level, o ?? {}), content, { detail: 'inspect' })
const featureNames = (level, o) => viewAt(level, o).effects.map((e) => e.label)
const skill = (level, id, o) => {
  const s = viewAt(level, o).skills.find((x) => x.id === id)
  return s?.total?.value ?? s?.total
}

// ---------------------------------------------------------------------------
// Jack of All Trades — the gap this file recorded in its own header
// ---------------------------------------------------------------------------

{
  // "one missing ProficiencyCategory away from working", said bard.ts line 14.
  // The category arrived with the Champion's Remarkable Athlete, which needs
  // the same thing for three abilities rather than all six.
  //
  // Arcana is not a bard class proficiency, so it shows the half bonus cleanly.
  check.eq('jack: nothing at 1st, before the feature', skill(1, 'arcana'), 0)
  check.eq('jack: +1 at 2nd — half of a +2 proficiency bonus', skill(2, 'arcana'), 1)

  // Rounded DOWN, unlike the Champion's Remarkable Athlete, which rounds up.
  // Two features, two roundings, and the difference is real.
  check.eq('jack: still +1 at 5th — half of +3, rounded down', skill(5, 'arcana'), 1)
  check.eq('jack: +2 at 9th', skill(9, 'arcana'), 2)
  check.eq('jack: still +2 at 13th — half of +5, rounded down', skill(13, 'arcana'), 2)
  check.eq('jack: +3 at 17th', skill(17, 'arcana'), 3)

  // A skill the bard is already proficient in is untouched: the resolver takes
  // the highest multiplier, so "doesn't already include your proficiency
  // bonus" needs no rule of its own.
  const chosen = { 'srd:class.bard.proficiencies': { skills: ['performance', 'persuasion'] } }
  check.eq('jack: a proficient skill is unchanged between 1st and 2nd',
    skill(2, 'performance', { selections: chosen }) - skill(1, 'performance', { selections: chosen }), 0)

  // And it is NOT eighteen skill grants: the bard must not read as proficient
  // in everything, which is what that approximation would have done.
  const proficient = viewAt(10).skills.filter((s) => s.proficiency !== 'none')
  check('jack: the bard is not proficient in all eighteen skills',
    proficient.length < 18, `${proficient.length} proficient`)
}

// ---------------------------------------------------------------------------
// Class features arrive when the table says
// ---------------------------------------------------------------------------

{
  const has = (level, name) => featureNames(level).includes(name)

  check('features: Countercharm at 6th, not 5th',
    has(6, 'Countercharm') && !has(5, 'Countercharm'))
  check('features: Magical Secrets at 10th, not 9th',
    has(10, 'Magical Secrets (level 10)') && !has(9, 'Magical Secrets (level 10)'))
  check('features: again at 14th and 18th',
    has(14, 'Magical Secrets (level 14)') && has(18, 'Magical Secrets (level 18)'))
  check('features: Superior Inspiration at 20th, not 19th',
    has(20, 'Superior Inspiration') && !has(19, 'Superior Inspiration'))

  // Bardic Inspiration's refresh changes at 5th, which is two sources with
  // opposite activation gates and one resource between them.
  const refreshAt = (level) =>
    viewAt(level).resources.find((r) => r.id === 'bard.bardicInspiration')?.refresh.kind
  check.eq('features: Bardic Inspiration returns on a long rest at 4th', refreshAt(4), 'longRest')
  check.eq('features: and on a short rest from 5th — Font of Inspiration',
    refreshAt(5), 'shortRest')
}

// ---------------------------------------------------------------------------
// College of Lore — a choice now, not a gift
// ---------------------------------------------------------------------------

{
  const has = (level, name) => featureNames(level, { subclassId: LORE }).includes(name)

  check('lore: Bonus Proficiencies and Cutting Words at 3rd',
    has(3, 'Bonus Proficiencies') && has(3, 'Cutting Words'))
  check('lore: nothing at 2nd', !has(2, 'Cutting Words'))
  check('lore: Additional Magical Secrets at 6th', has(6, 'Additional Magical Secrets'))
  check('lore: Peerless Skill at 14th, not 13th',
    has(14, 'Peerless Skill') && !has(13, 'Peerless Skill'))

  // Both Lore actions spend Bardic Inspiration, a resource the *class* declares
  // — a subclass reaching a class resource needs no special case.
  const actions = viewAt(14, { subclassId: LORE }).actions
  const cutting = actions.find((a) => a.id === 'bard.lore.cutting-words')
  check.eq('lore: Cutting Words spends a Bardic Inspiration die',
    cutting?.costs[0]?.resourceId, 'bard.bardicInspiration')
  check.eq('lore: and is a reaction', cutting?.cost.type, 'reaction')

  // Without the college, none of it — and the sheet says a decision is owed.
  const undecided = featureNames(14)
  check('lore: an unchosen college grants nothing',
    !undecided.includes('Cutting Words') && !undecided.includes('Peerless Skill'))
  check('lore: and the sheet says so',
    undecided.includes('Bard: subclass not chosen'), JSON.stringify(undecided))
}

// ---------------------------------------------------------------------------
// What the vocabulary cannot reach is visible
// ---------------------------------------------------------------------------

{
  const view = viewAt(20, { subclassId: LORE })
  const named = (name) => view.effects.find((e) => e.label === name)

  // Almost every bard feature reaches another creature — a die handed to an
  // ally, a die subtracted from an enemy, advantage granted to friends within
  // 30 feet. That is the wall this class was written to document.
  for (const name of [
    'Bardic Inspiration', 'Song of Rest', 'Countercharm',
    'Magical Secrets (level 10)', 'Superior Inspiration',
    'Cutting Words', 'Additional Magical Secrets', 'Peerless Skill'
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
    .filter((p) => p.where.includes('bard') || p.where.includes('lore'))
  const errors = problems.filter((p) => p.severity === 'error')
  check('integrity: the bard and College of Lore introduce no errors',
    errors.length === 0, errors.map((p) => `${p.where}: ${p.message}`).join(' | '))

  const debt = checkContentIntegrity(content)
    .filter((p) => p.message.includes('not authored yet') && p.message.includes('lore'))
  check.eq('integrity: College of Lore is no longer unauthored debt', debt.length, 0)
}

check.report()
