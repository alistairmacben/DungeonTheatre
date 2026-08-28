// Sorcerer, levels 1 to 20, and the Draconic Bloodline.
//
// It lived in classes-extra.ts, stopped at 2nd level's Font of Magic, had no
// Metamagic, no Sorcerous Restoration and no subclass slot — and, until the
// paladin turned it up, no spell save DC or spell attack bonus at all. A
// 5th-level sorcerer's DC was 0.
//
// The SRD does ship a Sorcerous Origin. An earlier note in this project said
// it did not; the Draconic Bloodline is on p44-45.
//
// Checked against docs/srd-source/classes.pdf p42-45.

import { checkContentIntegrity, loadContent, playerViewOf } from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()

const DRACONIC = 'srd:subclass.draconic-bloodline'
const CASTING = 'srd:class.sorcerer.spellcasting'

function sorcerer(level, overrides = {}) {
  return {
    id: 'c:sorcerer', campaignId: 'camp-1', name: 'Vessa', playerId: 'p',
    speciesId: 'srd:species.human',
    classLevels: [{
      classId: 'srd:class.sorcerer', level,
      ...(overrides.subclassId ? { subclassId: overrides.subclassId } : {})
    }],
    abilityScoreBase: { str: 8, dex: 14, con: 12, int: 12, wis: 10, cha: 15 },
    buildChoices: [], hitPointsCurrent: 200, hitPointsTemp: 0,
    hitDiceSpent: {}, resourcesSpent: {}, conditions: [], effectInstances: [],
    exhaustionLevel: 0,
    inventory: overrides.inventory
      ?? { instances: [], equipped: {}, attunedInstanceIds: [] },
    deathSaves: { successes: 0, failures: 0 },
    toggles: overrides.toggles ?? {}, spellsPrepared: [],
    selections: overrides.selections ?? { [CASTING]: { skills: ['arcana', 'persuasion'] } }
  }
}

const viewAt = (level, o) =>
  playerViewOf(sorcerer(level, o ?? {}), content, { detail: 'inspect' })
const featureNames = (level, o) => viewAt(level, o).effects.map((e) => e.label)

const countPending = (level, selId, o) =>
  (viewAt(level, o).progression.pendingChoices ?? [])
    .filter((p) => p.id.endsWith(`:${selId}`))
    .reduce((n, p) => n + p.count, 0)

// ---------------------------------------------------------------------------
// The spell save DC that was zero
// ---------------------------------------------------------------------------

{
  // Human raises CHA to 16 (+3). 8 + PB + CHA.
  check.eq('spellcasting: save DC at 1st is 8 + 2 + 3', viewAt(1).spellcasting.saveDc.value, 13)
  check.eq('spellcasting: and 8 + 4 + 3 at 11th', viewAt(11).spellcasting.saveDc.value, 15)
  check.eq('spellcasting: spell attack is proficiency + Charisma',
    viewAt(1).spellcasting.attackBonus.value, 5)

  // And the panel is there even before a single spell has been chosen, which
  // is how the missing DC went unnoticed for so long.
  const blank = viewAt(5, { selections: {} })
  check('spellcasting: a sorcerer who has chosen no spells still has a panel',
    blank.spellcasting !== undefined)
  check.eq('spellcasting: with slots on it', blank.spellcasting?.slots.length, 3)
  // Proficiency is +3 at 5th level, so 8 + 3 + 3.
  check.eq('spellcasting: and a real save DC', blank.spellcasting?.saveDc.value, 14)
}

// ---------------------------------------------------------------------------
// The Sorcerer table
// ---------------------------------------------------------------------------

{
  const blank = { selections: {} }
  check.eq('cantrips: four at 1st', countPending(1, 'cantrips', blank), 4)
  check.eq('cantrips: five from 4th', countPending(4, 'cantrips', blank), 5)
  check.eq('cantrips: six from 10th, and no more', countPending(20, 'cantrips', blank), 6)

  check.eq('spells known: two at 1st', countPending(1, 'spells', blank), 2)
  check.eq('spells known: eleven at 10th', countPending(10, 'spells', blank), 11)
  // The column is flat at 12, 14, 16, 18, 19 and 20, so those level-ups must
  // ask nothing at all.
  check.eq('spells known: twelve at 11th', countPending(11, 'spells', blank), 12)
  check.eq('spells known: still twelve at 12th', countPending(12, 'spells', blank), 12)
  check.eq('spells known: fifteen at 17th', countPending(17, 'spells', blank), 15)
  check.eq('spells known: and still fifteen at 20th', countPending(20, 'spells', blank), 15)

  const points = (level) =>
    viewAt(level).resources.find((r) => r.id === 'sorcerer.sorceryPoints')?.maximum ?? 0
  // The column reads "—" at 1st, which is 0 — and Font of Magic is a 2nd-level
  // feature, so a 1st-level sorcerer has no pool at all.
  check.eq('sorcery points: none at 1st', points(1), 0)
  check.eq('sorcery points: two at 2nd', points(2), 2)
  check.eq('sorcery points: equal to level thereafter', points(11), 11)
  check.eq('sorcery points: twenty at 20th', points(20), 20)

  const topSlot = (level) => Math.max(0, ...viewAt(level).spellcasting.slots.map((s) => s.level))
  check.eq('slots: 1st only at 1st', topSlot(1), 1)
  check.eq('slots: 9th from 17th', topSlot(17), 9)
}

// ---------------------------------------------------------------------------
// Proficiencies: a list of five weapons, and no armour at all
// ---------------------------------------------------------------------------

{
  const lines = (viewAt(1).effects.find((e) => e.label === 'Spellcasting')?.effects ?? [])
    .join(' | ')
  check('proficiencies: no armour of any kind',
    !lines.includes('armour'), lines)
  // "Daggers, darts, slings, quarterstaffs, light crossbows" — a list, not a
  // category. `weaponCategory: simple` handed the sorcerer eleven weapons the
  // SRD does not give it.
  check('proficiencies: five named weapons, not the simple category',
    !lines.includes('simple weapons') && lines.includes('Dagger')
      && lines.includes('Light Crossbow'), lines)
}

// ---------------------------------------------------------------------------
// Skills are chosen, not assigned
// ---------------------------------------------------------------------------

{
  const pending = viewAt(1, { selections: {} }).progression.pendingChoices ?? []
  const skills = pending.find((p) => p.id.endsWith(':skills'))
  check.eq('skills: two of six', skills?.count, 2)
  check.eq('skills: from the six the class list names', skills?.from?.length, 6)

  const other = { [CASTING]: { skills: ['deception', 'intimidation'] } }
  const chosen = viewAt(1, { selections: other }).skills
    .filter((s) => s.proficiency !== 'none').map((s) => s.id)
  check.eq('skills: exactly the two named', chosen.length, 2)
  check('skills: and they are the ones the player named',
    chosen.includes('deception') && !chosen.includes('arcana'), chosen.join(', '))
}

// ---------------------------------------------------------------------------
// Metamagic
// ---------------------------------------------------------------------------

{
  const has = (level, name) => featureNames(level).includes(name)
  check('metamagic: at 3rd, not 2nd', has(3, 'Metamagic') && !has(2, 'Metamagic'))
  check('metamagic: again at 10th and 17th',
    has(10, 'Metamagic (level 10)') && has(17, 'Metamagic (level 17)'))
  check('metamagic: and nowhere else', !has(11, 'Metamagic (level 11)'))

  check.eq('metamagic: two options at 3rd',
    countPending(3, 'metamagic', { selections: {} }), 2)
  check.eq('metamagic: three by 10th',
    countPending(10, 'metamagic', { selections: {} }), 3)
  check.eq('metamagic: four by 17th, and no more',
    countPending(20, 'metamagic', { selections: {} }), 4)

  const pool = (viewAt(3, { selections: {} }).progression.pendingChoices ?? [])
    .find((p) => p.id.endsWith(':metamagic'))?.from ?? []
  check.eq('metamagic: all eight options are offered', pool.length, 8)

  // Every option changes how a spell is cast, and each costs a different
  // number of points — so the sheet has to name the costs.
  const text = JSON.stringify(viewAt(3).effects.find((e) => e.label === 'Metamagic'))
  check('metamagic: the costs are stated, not left to memory',
    text.includes('Quickened Spell (2 sorcery points)')
      && text.includes('Heightened Spell (3 sorcery points)'), text.slice(0, 300))
}

// ---------------------------------------------------------------------------
// Font of Magic and Sorcerous Restoration
// ---------------------------------------------------------------------------

{
  const actions = viewAt(2).actions.map((a) => a.id)
  check('font of magic: both halves of Flexible Casting are offered',
    actions.includes('sorcerer.create-slot') && actions.includes('sorcerer.convert-slot'),
    JSON.stringify(actions))

  // The Creating Spell Slots table is not a formula — 2, 3, 5, 6, 7 — so the
  // sheet has to print it.
  const font = JSON.stringify(viewAt(2).effects.find((e) => e.label === 'Font of Magic'))
  check('font of magic: the slot costs are printed',
    font.includes('5 for 3rd') && font.includes('7 for 5th'), font.slice(0, 300))

  const has = (level, name) => featureNames(level).includes(name)
  check('restoration: Sorcerous Restoration at 20th, not 19th',
    has(20, 'Sorcerous Restoration') && !has(19, 'Sorcerous Restoration'))

  // The pool must still be a long-rest resource — making it short-rest would
  // hand a 20th-level sorcerer twenty points per short rest instead of four.
  check.eq('restoration: the pool still refreshes on a long rest',
    viewAt(20).resources.find((r) => r.id === 'sorcerer.sorceryPoints')?.refresh.kind,
    'longRest')
}

// ---------------------------------------------------------------------------
// Draconic Bloodline — the origin the SRD does ship
// ---------------------------------------------------------------------------

{
  const has = (level, name) => featureNames(level, { subclassId: DRACONIC }).includes(name)

  // The sorcerer picks its origin at 1st, as the cleric and warlock do.
  check('draconic: Dragon Ancestor and Draconic Resilience at 1st',
    has(1, 'Dragon Ancestor') && has(1, 'Draconic Resilience'))
  check('draconic: Elemental Affinity at 6th',
    has(6, 'Elemental Affinity') && !has(5, 'Elemental Affinity'))
  check('draconic: Dragon Wings at 14th', has(14, 'Dragon Wings') && !has(13, 'Dragon Wings'))
  check('draconic: Draconic Presence at 18th', has(18, 'Draconic Presence'))

  // Draconic Resilience is entirely arithmetic, and both halves must land.
  const hp = (level, sub) => viewAt(level, sub ? { subclassId: DRACONIC } : {})
    .vitals.hitPoints.max.value
  check.eq('resilience: +1 hit point per sorcerer level at 5th',
    hp(5, true) - hp(5, false), 5)
  check.eq('resilience: and +20 at 20th', hp(20, true) - hp(20, false), 20)

  // 13 + DEX unarmoured, in the same highest-wins contest as any armour.
  // DEX 14 + human +1 = 15 → +2.
  const ac = (o) => viewAt(5, o).vitals.armorClass.value
  check.eq('resilience: AC 10 + Dex without the bloodline', ac({}), 12)
  check.eq('resilience: 13 + Dex with it', ac({ subclassId: DRACONIC }), 15)
  check.eq('resilience: and nothing while armoured — the gate is real',
    ac({ subclassId: DRACONIC, toggles: { 'wearing-armor': true } }), 12)

  // Dragon Ancestor's doubled proficiency on Charisma checks is expressible,
  // and behind a toggle because only the table knows there is a dragon here.
  const persuasion = (toggles) =>
    viewAt(5, { subclassId: DRACONIC, toggles }).skills
      .find((s) => s.id === 'persuasion').total.value
  check.eq('ancestor: proficiency doubles on Charisma checks with dragons',
    persuasion({ 'sorcerer.dragon-ancestor': true }) - persuasion({}), 3)

  // Dragon Wings: a flying speed that reads the walking speed.
  const fly = (toggles) => {
    const v = viewAt(14, { subclassId: DRACONIC, toggles })
    return v.effects.find((e) => e.label === 'Dragon Wings')?.effects ?? []
  }
  check('wings: the flying speed is stated, not left as prose',
    fly({ 'sorcerer.dragon-wings': true }).some((l) => l.includes('fly')),
    JSON.stringify(fly({ 'sorcerer.dragon-wings': true })))
  check('wings: and not applying while armoured',
    fly({ 'sorcerer.dragon-wings': true, 'wearing-armor': true })
      .some((l) => l.includes('not applying')),
    JSON.stringify(fly({ 'sorcerer.dragon-wings': true, 'wearing-armor': true })))

  // Without the origin, none of it — and the sheet says a decision is owed.
  const undecided = featureNames(14)
  check('draconic: an unchosen origin grants nothing',
    !undecided.includes('Draconic Resilience') && !undecided.includes('Dragon Wings'))
  check('draconic: and the sheet says so',
    undecided.includes('Sorcerer: subclass not chosen'), JSON.stringify(undecided))
}

// ---------------------------------------------------------------------------
// What the vocabulary cannot reach is visible
// ---------------------------------------------------------------------------

{
  const view = viewAt(20, { subclassId: DRACONIC })
  const named = (name) => view.effects.find((e) => e.label === name)

  for (const name of [
    'Font of Magic', 'Metamagic', 'Sorcerous Restoration',
    'Dragon Ancestor', 'Elemental Affinity', 'Draconic Presence'
  ]) {
    const feature = named(name)
    check(`partial: ${name} still reaches the sheet`, feature !== undefined)
    check(`partial: ${name} says what the player must do themselves`,
      (feature?.effects?.length ?? 0) > 0 || (feature?.description?.length ?? 0) > 0,
      JSON.stringify(feature))
  }

  // The Draconic Ancestry table is ten rows, and the sheet names them all so a
  // player can look up their own damage type without the book.
  // A feature card shows only its first paragraph, so the ancestry table
  // reaches the player as a notice — all ten rows, so a player can look up
  // their damage type without the book.
  const ancestor = view.notices
    .filter((n) => n.label === 'Dragon Ancestor').map((n) => n.text).join(' ')
  check('ancestor: the whole ancestry table is named',
    ancestor.includes('black') && ancestor.includes('acid')
      && ancestor.includes('silver') && ancestor.includes('cold'),
    ancestor.slice(0, 300))
}

// ---------------------------------------------------------------------------
// The gate every class passes — and the last class in the SRD
// ---------------------------------------------------------------------------

{
  const problems = checkContentIntegrity(content)
    .filter((p) => p.where.includes('sorcerer') || p.where.includes('draconic'))
  const errors = problems.filter((p) => p.severity === 'error')
  check('integrity: the sorcerer and the bloodline introduce no errors',
    errors.length === 0, errors.map((p) => `${p.where}: ${p.message}`).join(' | '))

  const debt = checkContentIntegrity(content)
    .filter((p) => p.message.includes('not authored yet'))
  check.eq('integrity: no class points at a subclass nobody wrote', debt.length, 0,
    debt.map((p) => p.message).join(' | '))
}

check.report()
