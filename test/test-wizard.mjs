// Wizard, levels 1 to 20, and the School of Evocation.
//
// The wizard was the shallowest class in the set — three features, all at 1st
// level — despite being the party's caster and the class the whole spellcasting
// vocabulary was built against. Its cantrips were three the class named for
// every wizard that would ever exist, and its prepared list was capped at 3rd
// level, which is the level-5 row of a table that runs to 9th.
//
// Checked against docs/srd-source/classes.pdf p52-54.

import { checkContentIntegrity, loadContent, playerViewOf } from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()

const EVOCATION = 'srd:subclass.evocation'
const SPELLCASTING = 'srd:class.wizard.spellcasting'

/** A High Elf wizard: INT 16 + 1 = 17, so the modifier is +3. */
function wizard(level, overrides = {}) {
  return {
    id: 'c:wizard', campaignId: 'camp-1', name: 'Ilyana', playerId: 'p',
    speciesId: 'srd:species.elf', subspeciesId: 'srd:species.elf.high',
    classLevels: [{
      classId: 'srd:class.wizard', level,
      ...(overrides.subclassId ? { subclassId: overrides.subclassId } : {})
    }],
    abilityScoreBase: { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 },
    buildChoices: [], hitPointsCurrent: 60, hitPointsTemp: 0,
    hitDiceSpent: {}, resourcesSpent: {}, conditions: [], effectInstances: [],
    exhaustionLevel: 0,
    inventory: { instances: [], equipped: {}, attunedInstanceIds: [] },
    deathSaves: { successes: 0, failures: 0 }, toggles: {},
    spellsPrepared: [],
    ...(overrides.selections !== undefined ? { selections: overrides.selections } : {})
  }
}

const viewAt = (level, o) => playerViewOf(wizard(level, o ?? {}), content, { detail: 'inspect' })
const featureNames = (level, o) => viewAt(level, o).effects.map((e) => e.label)

const countPending = (level, selId) =>
  (viewAt(level).progression.pendingChoices ?? [])
    .filter((p) => p.id.endsWith(`:${selId}`))
    .reduce((n, p) => n + p.count, 0)

// ---------------------------------------------------------------------------
// The Cantrips Known column
// ---------------------------------------------------------------------------

{
  check.eq('cantrips: three at 1st', countPending(1, 'cantrips'), 3)
  check.eq('cantrips: still three at 3rd', countPending(3, 'cantrips'), 3)
  check.eq('cantrips: four from 4th', countPending(4, 'cantrips'), 4)
  check.eq('cantrips: still four at 9th', countPending(9, 'cantrips'), 4)
  check.eq('cantrips: five from 10th', countPending(10, 'cantrips'), 5)
  check.eq('cantrips: and no more after', countPending(20, 'cantrips'), 5)

  // They are chosen, not named. The old file gave every wizard Fire Bolt, Ray
  // of Frost and Prestidigitation whether they wanted them or not.
  const chosen = {
    [SPELLCASTING]: { cantrips: ['srd:spell.chill-touch', 'srd:spell.poison-spray', 'srd:spell.fire-bolt'] }
  }
  const spells = viewAt(1, { selections: chosen }).spellcasting.spells.map((s) => s.label)
  check('cantrips: a chosen cantrip is known', spells.includes('Chill Touch'))

  // The bug this caught: the wizard's *prepared* grant draws from the whole
  // wizard list, and a cantrip is level 0, so every wizard cantrip in the
  // content set was sweeping in regardless of the Cantrips Known column. You
  // never prepare a cantrip — that is what makes it a cantrip — so a
  // whole-list grant marked 'prepared' now skips level 0 entirely.
  check('cantrips: an unchosen one is not known, even though it is on the list',
    !spells.includes('Ray of Frost'), JSON.stringify(spells))

  // And the rule is about preparation, not about the wizard: a cleric's
  // prepared list draws the same way and must behave the same.
  const cleric = playerViewOf({
    id: 'c:c', campaignId: 'camp-1', name: 'Aldwin', playerId: 'p',
    speciesId: 'srd:species.human',
    classLevels: [{ classId: 'srd:class.cleric', level: 5 }],
    abilityScoreBase: { str: 14, dex: 10, con: 14, int: 10, wis: 16, cha: 12 },
    buildChoices: [], hitPointsCurrent: 38, hitPointsTemp: 0,
    hitDiceSpent: {}, resourcesSpent: {}, conditions: [], effectInstances: [],
    exhaustionLevel: 0,
    inventory: { instances: [], equipped: {}, attunedInstanceIds: [] },
    deathSaves: { successes: 0, failures: 0 }, toggles: {}, spellsPrepared: []
  }, content, { detail: 'inspect' })
  const clericCantrips = cleric.spellcasting.spells.filter((s) => s.level === 0)
  check('cantrips: a cleric does not prepare cantrips either',
    clericCantrips.every((s) => s.alwaysAvailable),
    JSON.stringify(clericCantrips.map((s) => `${s.label}:${s.alwaysAvailable}`)))
}

// ---------------------------------------------------------------------------
// The slot ladder reaches as high as the table says
// ---------------------------------------------------------------------------

{
  const topSlot = (level) => Math.max(0, ...viewAt(level).spellcasting.slots.map((s) => s.level))

  check.eq('slots: 1st-level only at 1st', topSlot(1), 1)
  check.eq('slots: 2nd from 3rd', topSlot(3), 2)
  check.eq('slots: 5th from 9th', topSlot(9), 5)
  check.eq('slots: 9th from 17th', topSlot(17), 9)

  // Prepared spells: Intelligence modifier + wizard level, minimum one.
  check.eq('prepared: INT modifier + level at 1st', viewAt(1).spellcasting.preparedMax, 4)
  check.eq('prepared: and at 20th', viewAt(20).spellcasting.preparedMax, 23)
}

// ---------------------------------------------------------------------------
// Features arrive when the table says
// ---------------------------------------------------------------------------

{
  const has = (level, name) => featureNames(level).includes(name)

  check('features: Spellcasting and Arcane Recovery at 1st',
    has(1, 'Spellcasting') && has(1, 'Arcane Recovery'))
  check('features: Spell Mastery at 18th, not 17th',
    has(18, 'Spell Mastery') && !has(17, 'Spell Mastery'))
  check('features: Signature Spells at 20th, not 19th',
    has(20, 'Signature Spells') && !has(19, 'Signature Spells'))

  const recovery = viewAt(1).resources.find((r) => r.id === 'wizard.arcane-recovery')
  check.eq('features: Arcane Recovery is one use', recovery?.maximum, 1)
  check.eq('features: refreshing on a long rest', recovery?.refresh.kind, 'longRest')
}

// ---------------------------------------------------------------------------
// School of Evocation
// ---------------------------------------------------------------------------

{
  const has = (level, name) => featureNames(level, { subclassId: EVOCATION }).includes(name)

  // The wizard chooses its tradition at 2nd, earlier than most classes' 3rd.
  check('evocation: Evocation Savant and Sculpt Spells at 2nd',
    has(2, 'Evocation Savant') && has(2, 'Sculpt Spells'))
  check('evocation: nothing at 1st', !has(1, 'Sculpt Spells'))
  check('evocation: Potent Cantrip at 6th, not 5th',
    has(6, 'Potent Cantrip') && !has(5, 'Potent Cantrip'))
  check('evocation: Empowered Evocation at 10th', has(10, 'Empowered Evocation'))
  check('evocation: Overchannel at 14th', has(14, 'Overchannel'))

  // Without it, none of them — and the sheet says a decision is owed rather
  // than quietly missing five features.
  const unchosen = featureNames(14)
  check('evocation: an unchosen tradition grants nothing',
    !unchosen.includes('Sculpt Spells') && !unchosen.includes('Overchannel'))
  check('evocation: and the sheet says so',
    unchosen.includes('Wizard: subclass not chosen'), JSON.stringify(unchosen))
}

// ---------------------------------------------------------------------------
// What the vocabulary cannot reach is visible, not missing
// ---------------------------------------------------------------------------

{
  const view = viewAt(20, { subclassId: EVOCATION })
  const named = (name) => view.effects.find((e) => e.label === name)

  // Every Evocation feature acts on somebody else — a creature's save, a
  // creature's damage — and there is no other end of the spell to reach.
  for (const name of [
    'Sculpt Spells', 'Potent Cantrip', 'Empowered Evocation', 'Overchannel',
    'Spell Mastery', 'Signature Spells', 'Arcane Recovery'
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
    .filter((p) => p.where.includes('wizard') || p.where.includes('evocation'))
  const errors = problems.filter((p) => p.severity === 'error')
  check('integrity: the wizard and Evocation introduce no errors',
    errors.length === 0, errors.map((p) => `${p.where}: ${p.message}`).join(' | '))

  const debt = checkContentIntegrity(content)
    .filter((p) => p.message.includes('not authored yet') && p.message.includes('evocation'))
  check.eq('integrity: Evocation is no longer unauthored debt', debt.length, 0)
}

check.report()
