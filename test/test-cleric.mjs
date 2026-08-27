// Cleric, levels 1 to 20, and the Life Domain.
//
// The cleric stopped at 2nd level, and its domain was authored twice: Life
// Domain was a class feature every cleric received whether or not they chose
// it, while the class *also* declared a subclass slot pointing at a
// `srd:subclass.life-domain` that did not exist. One domain, defined twice,
// neither of them a choice.
//
// Checked against docs/srd-source/classes.pdf p15-18.

import { checkContentIntegrity, loadContent, playerViewOf } from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()

const LIFE = 'srd:subclass.life-domain'
const SPELLCASTING = 'srd:class.cleric.spellcasting'

function cleric(level, overrides = {}) {
  return {
    id: 'c:cleric', campaignId: 'camp-1', name: 'Aldwin', playerId: 'p',
    speciesId: 'srd:species.human',
    classLevels: [{
      classId: 'srd:class.cleric', level,
      ...(overrides.subclassId ? { subclassId: overrides.subclassId } : {})
    }],
    abilityScoreBase: { str: 14, dex: 10, con: 14, int: 10, wis: 16, cha: 12 },
    buildChoices: [], hitPointsCurrent: 80, hitPointsTemp: 0,
    hitDiceSpent: {}, resourcesSpent: {}, conditions: [], effectInstances: [],
    exhaustionLevel: 0,
    inventory: { instances: [], equipped: {}, attunedInstanceIds: [] },
    deathSaves: { successes: 0, failures: 0 }, toggles: {}, spellsPrepared: [],
    ...(overrides.selections !== undefined ? { selections: overrides.selections } : {})
  }
}

const viewAt = (level, o) => playerViewOf(cleric(level, o ?? {}), content, { detail: 'inspect' })
const resAt = (level, id, o) => viewAt(level, o).resources.find((r) => r.id === id)?.maximum ?? 0
const featureNames = (level, o) => viewAt(level, o).effects.map((e) => e.label)

const countPending = (level, selId) =>
  (viewAt(level).progression.pendingChoices ?? [])
    .filter((p) => p.id.endsWith(`:${selId}`))
    .reduce((n, p) => n + p.count, 0)

// ---------------------------------------------------------------------------
// The Cleric table
// ---------------------------------------------------------------------------

{
  check.eq('cantrips: three at 1st', countPending(1, 'cantrips'), 3)
  check.eq('cantrips: four from 4th', countPending(4, 'cantrips'), 4)
  check.eq('cantrips: five from 10th, and no more', countPending(20, 'cantrips'), 5)

  check.eq('channel divinity: none at 1st', resAt(1, 'cleric.channel-divinity'), 0)
  check.eq('channel divinity: one from 2nd', resAt(2, 'cleric.channel-divinity'), 1)
  check.eq('channel divinity: two from 6th', resAt(6, 'cleric.channel-divinity'), 2)
  check.eq('channel divinity: three from 18th', resAt(18, 'cleric.channel-divinity'), 3)

  check.eq('divine intervention: none before 10th', resAt(9, 'cleric.divine-intervention'), 0)
  check.eq('divine intervention: one from 10th', resAt(10, 'cleric.divine-intervention'), 1)

  const topSlot = (level) => Math.max(0, ...viewAt(level).spellcasting.slots.map((s) => s.level))
  check.eq('slots: 1st only at 1st', topSlot(1), 1)
  check.eq('slots: 5th from 9th', topSlot(9), 5)
  check.eq('slots: 9th from 17th', topSlot(17), 9)

  // Prepared: Wisdom modifier + cleric level, minimum one. Human WIS 16 → 17 → +3.
  check.eq('prepared: WIS modifier + level at 1st', viewAt(1).spellcasting.preparedMax, 4)
  check.eq('prepared: and at 20th', viewAt(20).spellcasting.preparedMax, 23)
}

// ---------------------------------------------------------------------------
// Features arrive when the table says
// ---------------------------------------------------------------------------

{
  const has = (level, name) => featureNames(level).includes(name)

  check('features: Channel Divinity at 2nd, not 1st',
    has(2, 'Channel Divinity') && !has(1, 'Channel Divinity'))
  check('features: Destroy Undead at 5th, not 4th',
    has(5, 'Destroy Undead') && !has(4, 'Destroy Undead'))
  check('features: Divine Intervention at 10th, not 9th',
    has(10, 'Divine Intervention') && !has(9, 'Divine Intervention'))

  // Turn Undead is the base class's Channel Divinity option; Preserve Life is
  // the domain's, and must not appear without it.
  const actions = (level, o) => viewAt(level, o).actions.map((a) => a.id)
  check('features: Turn Undead comes with Channel Divinity',
    actions(2).includes('cleric.channel-divinity.turn-undead'))
  check('features: Preserve Life does not, without the domain',
    !actions(2).includes('cleric.channel-divinity.preserve-life'),
    JSON.stringify(actions(2)))
}

// ---------------------------------------------------------------------------
// Cantrips are chosen, and the pool is real
// ---------------------------------------------------------------------------

{
  // The pool had two cleric cantrips and the column asks for three, which the
  // integrity checker correctly refuses. Four more were authored alongside.
  const pool = (viewAt(1).progression.pendingChoices ?? [])
    .find((p) => p.id.endsWith(':cantrips'))?.from ?? []
  check('cantrips: the pool can actually answer the choice', pool.length >= 5,
    `${pool.length} cantrips: ${pool.join(', ')}`)

  const chosen = {
    [SPELLCASTING]: {
      cantrips: ['srd:spell.guidance', 'srd:spell.light', 'srd:spell.spare-the-dying']
    }
  }
  const spells = viewAt(1, { selections: chosen }).spellcasting.spells.map((s) => s.label)
  check('cantrips: a chosen one is known', spells.includes('Guidance'))
  check('cantrips: and Sacred Flame is not, having not been chosen',
    !spells.includes('Sacred Flame'), JSON.stringify(spells))
}

// ---------------------------------------------------------------------------
// Life Domain — a choice now, not a gift
// ---------------------------------------------------------------------------

{
  const has = (level, name) => featureNames(level, { subclassId: LIFE }).includes(name)

  // The cleric picks its domain at 1st, earlier than any other class.
  check('life: Bonus Proficiency, domain spells and Disciple of Life at 1st',
    has(1, 'Bonus Proficiency') && has(1, 'Life Domain Spells')
      && has(1, 'Disciple of Life'))
  check('life: Preserve Life at 2nd, with Channel Divinity', has(2, 'Preserve Life'))
  check('life: Blessed Healer at 6th', has(6, 'Blessed Healer'))
  check('life: Divine Strike at 8th', has(8, 'Divine Strike'))
  check('life: Supreme Healing at 17th', has(17, 'Supreme Healing'))

  // Heavy armour proficiency comes from the domain, and only from it.
  const heavy = (o) => viewAt(5, o).effects
    .flatMap((e) => e.effects ?? []).filter((l) => l.includes('heavy armour'))
  check('life: heavy armour proficiency arrives with the domain',
    heavy({ subclassId: LIFE }).length === 1, JSON.stringify(heavy({ subclassId: LIFE })))
  check('life: and not without it', heavy({}).length === 0, JSON.stringify(heavy({})))

  // Domain spells are always prepared, and are the domain's, not the class's.
  const withDomain = viewAt(5, { subclassId: LIFE }).spellcasting.spells
  const bless = withDomain.find((s) => s.label === 'Bless')
  check('life: domain spells are always available without preparing',
    bless?.alwaysAvailable === true, JSON.stringify(bless))

  // And an undecided cleric is told, rather than quietly missing seven features.
  const undecided = featureNames(17)
  check('life: an unchosen domain grants nothing',
    !undecided.includes('Preserve Life') && !undecided.includes('Divine Strike'))
  check('life: and the sheet says a decision is owed',
    undecided.includes('Cleric: subclass not chosen'), JSON.stringify(undecided))
}

// ---------------------------------------------------------------------------
// What the vocabulary cannot reach is visible
// ---------------------------------------------------------------------------

{
  const view = viewAt(20, { subclassId: LIFE })
  const named = (name) => view.effects.find((e) => e.label === name)

  for (const name of [
    'Channel Divinity', 'Destroy Undead', 'Divine Intervention',
    'Life Domain Spells', 'Disciple of Life', 'Preserve Life',
    'Blessed Healer', 'Divine Strike', 'Supreme Healing'
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
    .filter((p) => p.where.includes('cleric') || p.where.includes('life-domain'))
  const errors = problems.filter((p) => p.severity === 'error')
  check('integrity: the cleric and Life Domain introduce no errors',
    errors.length === 0, errors.map((p) => `${p.where}: ${p.message}`).join(' | '))

  const debt = checkContentIntegrity(content)
    .filter((p) => p.message.includes('not authored yet') && p.message.includes('life-domain'))
  check.eq('integrity: Life Domain is no longer unauthored debt', debt.length, 0)
}

check.report()
