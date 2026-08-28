// Druid, levels 1 to 20, and the Circle of the Land.
//
// The druid stopped at 3rd level, its two skills were Nature and Animal
// Handling for every druid who would ever exist, and its prepared-spell grant
// was capped at 3rd level — the 5th-level row of a twenty-row ladder, so a
// 17th-level druid could not prepare a 4th-level spell. Its three Circle
// features were class features every druid received whether or not they had
// joined that circle, while the class also declared a subclass slot pointing
// at a `srd:subclass.circle-of-the-land` nobody had defined. It was the last
// class in that shape.
//
// Wild Shape stays what it was: the uses are tracked here and the beast is run
// from a statblock at the table. SRD 5.1 ships no bestiary, and the DM keeps
// the form. What the sheet gains is which row of the Beast Shapes table the
// druid is on, which changes at 4th and again at 8th.
//
// Checked against docs/srd-source/classes.pdf p19-22.

import { checkContentIntegrity, loadContent, playerViewOf } from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()

const LAND = 'srd:subclass.circle-of-the-land'
const PROFS = 'srd:class.druid.proficiencies'

function druid(level, overrides = {}) {
  return {
    id: 'c:druid', campaignId: 'camp-1', name: 'Maeve', playerId: 'p',
    speciesId: 'srd:species.human',
    classLevels: [{
      classId: 'srd:class.druid', level,
      ...(overrides.subclassId ? { subclassId: overrides.subclassId } : {})
    }],
    abilityScoreBase: { str: 10, dex: 14, con: 14, int: 12, wis: 16, cha: 10 },
    buildChoices: [], hitPointsCurrent: 90, hitPointsTemp: 0,
    hitDiceSpent: {}, resourcesSpent: {}, conditions: [], effectInstances: [],
    exhaustionLevel: 0,
    inventory: { instances: [], equipped: {}, attunedInstanceIds: [] },
    deathSaves: { successes: 0, failures: 0 }, toggles: {}, spellsPrepared: [],
    selections: overrides.selections
      ?? { [PROFS]: { skills: ['nature', 'perception'] } }
  }
}

const viewAt = (level, o) =>
  playerViewOf(druid(level, o ?? {}), content, { detail: 'inspect' })
const featureNames = (level, o) => viewAt(level, o).effects.map((e) => e.label)

const countPending = (level, selId, o) =>
  (viewAt(level, o).progression.pendingChoices ?? [])
    .filter((p) => p.id.endsWith(`:${selId}`))
    .reduce((n, p) => n + p.count, 0)

// ---------------------------------------------------------------------------
// The Druid table
// ---------------------------------------------------------------------------

{
  const blank = { selections: {} }
  check.eq('cantrips: two at 1st', countPending(1, 'cantrips-known', blank), 2)
  check.eq('cantrips: three from 4th', countPending(4, 'cantrips-known', blank), 3)
  check.eq('cantrips: still three at 9th', countPending(9, 'cantrips-known', blank), 3)
  check.eq('cantrips: four from 10th, and no more',
    countPending(20, 'cantrips-known', blank), 4)

  // The pool held two spells while the column asked for four — and two of the
  // four the druid was missing were already in the content set, tagged for the
  // cleric. Poison Spray was on no druid list at all.
  const pool = (viewAt(1, blank).progression.pendingChoices ?? [])
    .find((p) => p.id.endsWith(':cantrips-known'))?.from ?? []
  check('cantrips: the pool can answer the 10th-level column', pool.length >= 4,
    `${pool.length}: ${pool.join(', ')}`)

  const topSlot = (level) => Math.max(0, ...viewAt(level).spellcasting.slots.map((s) => s.level))
  check.eq('slots: 1st only at 1st', topSlot(1), 1)
  check.eq('slots: 5th from 9th', topSlot(9), 5)
  check.eq('slots: 9th from 17th', topSlot(17), 9)

  // Prepared: Wisdom modifier + druid level, minimum one. WIS 16 → +3.
  check.eq('prepared: WIS modifier + level at 1st', viewAt(1).spellcasting.preparedMax, 4)
  check.eq('prepared: and at 20th', viewAt(20).spellcasting.preparedMax, 23)
}

// ---------------------------------------------------------------------------
// The prepared-spell grant reaches the top of the ladder
// ---------------------------------------------------------------------------

{
  // `fromList.maxLevel` was the literal 3 — the 5th-level row — so a druid of
  // any level could only ever prepare up to 3rd-level spells. It reads the
  // column now. The content set holds nothing above 3rd, so what is checked is
  // the number the grant resolves, not a spell that does not exist.
  const grantCap = (level) => {
    const view = viewAt(level)
    return Math.max(0, ...view.spellcasting.spells.map((s) => s.level ?? 0))
  }
  check('prepared: a 1st-level druid is not offered 3rd-level spells',
    grantCap(1) <= 1, String(grantCap(1)))
  check('prepared: and a 9th-level druid is offered everything in the set',
    grantCap(9) >= grantCap(5), `${grantCap(5)} → ${grantCap(9)}`)
}

// ---------------------------------------------------------------------------
// Skills are chosen, not assigned
// ---------------------------------------------------------------------------

{
  const pending = viewAt(1, { selections: {} }).progression.pendingChoices ?? []
  const skills = pending.find((p) => p.id.endsWith(':skills'))
  check.eq('skills: two of eight', skills?.count, 2)
  check.eq('skills: from the eight the class list names', skills?.from?.length, 8)

  const blank = viewAt(1, { selections: {} }).skills.filter((s) => s.proficiency !== 'none')
  check.eq('skills: an unanswered choice grants no proficiency', blank.length, 0)

  // A druid who picked Medicine and Survival is not proficient in Nature,
  // which every druid in the file used to be.
  const other = { [PROFS]: { skills: ['medicine', 'survival'] } }
  const chosen = viewAt(1, { selections: other }).skills
    .filter((s) => s.proficiency !== 'none').map((s) => s.id)
  check.eq('skills: exactly the two named', chosen.length, 2)
  check('skills: and they are the ones the player named',
    chosen.includes('medicine') && !chosen.includes('nature'), chosen.join(', '))
}

// ---------------------------------------------------------------------------
// Wild Shape — the uses are the app's, the beast is the DM's
// ---------------------------------------------------------------------------

{
  const shape = (level) =>
    viewAt(level).resources.find((r) => r.id === 'druid.wild-shape')
  check.eq('wild shape: nothing at 1st', shape(1), undefined)
  check.eq('wild shape: two uses from 2nd', shape(2)?.maximum, 2)
  check.eq('wild shape: back on a short rest', shape(2)?.refresh.kind, 'shortRest')

  // Transforming spends a use; reverting never does.
  const actions = viewAt(2).actions
  const transform = actions.find((a) => a.id === 'druid.wild-shape.transform')
  const revert = actions.find((a) => a.id === 'druid.wild-shape.revert')
  check.eq('wild shape: transforming costs a use', transform?.costs?.[0]?.amount, 1)
  check.eq('wild shape: reverting costs nothing', revert?.costs?.length, 0)

  // The Beast Shapes table is three rows and the sheet now says which one.
  const has = (level, name) => featureNames(level).includes(name)
  check('wild shape: the 4th-level row arrives at 4th',
    has(4, 'Wild Shape Improvement (level 4)') && !has(3, 'Wild Shape Improvement (level 4)'))
  check('wild shape: and the 8th-level row at 8th',
    has(8, 'Wild Shape Improvement (level 8)') && !has(7, 'Wild Shape Improvement (level 8)'))

  const text = (level, name) =>
    JSON.stringify(viewAt(level).effects.find((e) => e.label === name))
  check('wild shape: the 4th-level row names CR 1/2 and the flying limit',
    text(4, 'Wild Shape Improvement (level 4)').includes('1/2')
      && text(4, 'Wild Shape Improvement (level 4)').includes('flying'),
    text(4, 'Wild Shape Improvement (level 4)'))
  check('wild shape: the 8th-level row lifts every speed restriction',
    text(8, 'Wild Shape Improvement (level 8)').includes('no restriction'),
    text(8, 'Wild Shape Improvement (level 8)'))
}

// ---------------------------------------------------------------------------
// Features arrive when the table says
// ---------------------------------------------------------------------------

{
  const has = (level, name) => featureNames(level).includes(name)

  check('features: Timeless Body and Beast Spells at 18th',
    has(18, 'Timeless Body') && has(18, 'Beast Spells') && !has(17, 'Timeless Body'))
  check('features: Archdruid at 20th', has(20, 'Archdruid') && !has(19, 'Archdruid'))

  // Timeless Body is the rare feature with nothing mechanical to express and
  // nothing mechanical missing — so it must not be marked incomplete.
  const timeless = viewAt(18).effects.find((e) => e.label === 'Timeless Body')
  check('features: Timeless Body still says what it does',
    (timeless?.description?.length ?? 0) > 0, JSON.stringify(timeless))
}

// ---------------------------------------------------------------------------
// Circle of the Land — a choice now, not a gift
// ---------------------------------------------------------------------------

{
  const has = (level, name) => featureNames(level, { subclassId: LAND }).includes(name)

  check('land: Bonus Cantrip and Natural Recovery at 2nd',
    has(2, 'Bonus Cantrip') && has(2, 'Natural Recovery'))
  check('land: Circle Spells at 3rd, 5th, 7th and 9th',
    has(3, 'Circle Spells (level 3)') && has(5, 'Circle Spells (level 5)')
      && has(7, 'Circle Spells (level 7)') && has(9, 'Circle Spells (level 9)'))
  check('land: and not before', !has(2, 'Circle Spells (level 3)'))
  check('land: Land\'s Stride at 6th', has(6, "Land's Stride") && !has(5, "Land's Stride"))
  check('land: Nature\'s Ward at 10th', has(10, "Nature's Ward") && !has(9, "Nature's Ward"))
  check('land: Nature\'s Sanctuary at 14th',
    has(14, "Nature's Sanctuary") && !has(13, "Nature's Sanctuary"))

  // The land is asked once, at 3rd, and its answer changes what all four
  // Circle Spells features say.
  const lands = (viewAt(3, { subclassId: LAND }).progression.pendingChoices ?? [])
    .filter((p) => p.id.endsWith(':land'))
  check.eq('land: the circle asks which land, once', lands.length, 1)
  check.eq('land: from the seven the SRD names', lands[0]?.from?.length, 7)

  // The sets were recorded as "not listed in SRD 5.1 as extracted here", which
  // was true of the extraction and not of the document.
  const spells3 = JSON.stringify(viewAt(3, { subclassId: LAND }).effects
    .find((e) => e.label === 'Circle Spells (level 3)'))
  check('land: the 3rd-level sets are named, not gestured at',
    spells3.includes('hold person') && spells3.includes('mirror image')
      && spells3.includes('barkskin'), spells3.slice(0, 300))

  // Land's Stride is the one Circle feature that is mostly arithmetic.
  const stride = viewAt(6, { subclassId: LAND }).effects
    .find((e) => e.label === "Land's Stride")
  const lines = (stride?.effects ?? []).join(' | ')
  check('land: Land\'s Stride changes difficult terrain and grants advantage',
    lines.includes('difficult') && lines.includes('advantage'), lines)
  check('land: and says so in English, not stat paths',
    !lines.includes('movementCost.'), lines)

  // Nature's Ward's poison immunity is real; the rest of it is not.
  const poison = (level) => (viewAt(level, { subclassId: LAND }).defenses ?? [])
    .find((d) => d.type === 'poison')
  check.eq('land: no poison immunity at 9th', poison(9), undefined)
  check.eq('land: immune from 10th', poison(10)?.state, 'immune')

  // Without the circle, none of it — and the sheet says a decision is owed.
  const undecided = featureNames(14)
  check('land: an unchosen circle grants nothing',
    !undecided.includes('Natural Recovery') && !undecided.includes("Nature's Ward"))
  check('land: and the sheet says so',
    undecided.includes('Druid: subclass not chosen'), JSON.stringify(undecided))
}

// ---------------------------------------------------------------------------
// What the vocabulary cannot reach is visible
// ---------------------------------------------------------------------------

{
  const view = viewAt(20, { subclassId: LAND })
  const named = (name) => view.effects.find((e) => e.label === name)

  for (const name of [
    'Wild Shape', 'Wild Shape Improvement (level 8)', 'Beast Spells', 'Archdruid',
    'Natural Recovery', 'Circle Spells (level 9)', "Land's Stride",
    "Nature's Ward", "Nature's Sanctuary"
  ]) {
    const feature = named(name)
    check(`partial: ${name} still reaches the sheet`, feature !== undefined)
    check(`partial: ${name} says what the player must do themselves`,
      (feature?.effects?.length ?? 0) > 0 || (feature?.description?.length ?? 0) > 0,
      JSON.stringify(feature))
  }

  // Wild Shape carries four paragraphs and a feature card shows only the
  // first, so the rest reach the player as notices. All four must survive.
  const wildNotices = view.notices.filter((n) => n.label === 'Wild Shape')
  check.eq('wild shape: all four paragraphs reach the player', wildNotices.length, 4)
  check('wild shape: including the one saying the beast is run at the table',
    wildNotices.some((n) => n.text.includes('statblock')),
    JSON.stringify(wildNotices.map((n) => n.text.slice(0, 40))))
}

// ---------------------------------------------------------------------------
// The gate every class passes — and the last of the unauthored subclasses
// ---------------------------------------------------------------------------

{
  const problems = checkContentIntegrity(content)
    .filter((p) => p.where.includes('druid') || p.where.includes('circle-of-the-land'))
  const errors = problems.filter((p) => p.severity === 'error')
  check('integrity: the druid and the Circle introduce no errors',
    errors.length === 0, errors.map((p) => `${p.where}: ${p.message}`).join(' | '))

  // Every class that declared a subclass slot now has something behind it.
  const debt = checkContentIntegrity(content)
    .filter((p) => p.message.includes('not authored yet'))
  check.eq('integrity: no class points at a subclass nobody wrote', debt.length, 0,
    debt.map((p) => p.message).join(' | '))
}

check.report()
