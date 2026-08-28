// Paladin, levels 1 to 20, and the Oath of Devotion.
//
// It lived in classes-extra.ts as three features and stopped at 1st level,
// with no spellcasting at all and no subclass slot — the largest single hole
// left in the class list. Its two skills were Religion and Athletics for every
// paladin who would ever exist.
//
// It is the first half caster the content set has: no slots at 1st, never past
// 5th, everything prepared from the class list with Charisma. `halfCasterSlots`
// is shared with the ranger, which has the identical table.
//
// Checked against docs/srd-source/classes.pdf p30-34.

import { checkContentIntegrity, loadContent, playerViewOf } from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()

const DEVOTION = 'srd:subclass.devotion'
const PROFS = 'srd:class.paladin.core'

function paladin(level, overrides = {}) {
  return {
    id: 'c:paladin', campaignId: 'camp-1', name: 'Bryn', playerId: 'p',
    speciesId: 'srd:species.human',
    classLevels: [{
      classId: 'srd:class.paladin', level,
      ...(overrides.subclassId ? { subclassId: overrides.subclassId } : {})
    }],
    abilityScoreBase: { str: 16, dex: 10, con: 14, int: 8, wis: 10, cha: 15 },
    buildChoices: [], hitPointsCurrent: 200, hitPointsTemp: 0,
    hitDiceSpent: {}, resourcesSpent: {}, conditions: overrides.conditions ?? [],
    effectInstances: [], exhaustionLevel: 0,
    inventory: { instances: [], equipped: {}, attunedInstanceIds: [] },
    deathSaves: { successes: 0, failures: 0 },
    toggles: overrides.toggles ?? {}, spellsPrepared: [],
    selections: overrides.selections
      ?? { [PROFS]: { skills: ['athletics', 'religion'] } }
  }
}

const viewAt = (level, o) =>
  playerViewOf(paladin(level, o ?? {}), content, { detail: 'inspect' })
const featureNames = (level, o) => viewAt(level, o).effects.map((e) => e.label)
const resAt = (level, id, o) =>
  viewAt(level, o).resources.find((r) => r.id === id)

// ---------------------------------------------------------------------------
// The first half caster
// ---------------------------------------------------------------------------

{
  // No slots at 1st is the whole difference between a half caster and a full
  // one at the bottom of the table, and it is easy to get wrong by starting
  // the column at index 0.
  check.eq('half caster: no spell panel at 1st', viewAt(1).spellcasting, undefined)
  check('half caster: and a panel from 2nd', viewAt(2).spellcasting !== undefined)

  const slotCount = (level, tier) =>
    viewAt(level).resources.find((r) => r.id === `paladin.slots.${tier}`)?.maximum ?? 0
  check.eq('slots: two 1st-level at 2nd', slotCount(2, 1), 2)
  check.eq('slots: three at 3rd', slotCount(3, 1), 3)
  check.eq('slots: four at 5th, and two 2nd-level', slotCount(5, 1), 4)
  check.eq('slots: two 2nd-level at 5th', slotCount(5, 2), 2)
  check.eq('slots: two 3rd-level at 9th', slotCount(9, 3), 2)
  check.eq('slots: one 4th-level at 13th', slotCount(13, 4), 1)
  check.eq('slots: one 5th-level at 17th', slotCount(17, 5), 1)
  check.eq('slots: two 5th-level at 19th', slotCount(19, 5), 2)

  const topSlot = (level) =>
    Math.max(0, ...(viewAt(level).spellcasting?.slots ?? []).map((s) => s.level))
  check.eq('slots: 1st is as high as it goes at 4th', topSlot(4), 1)
  check.eq('slots: 5th at 20th — and never higher', topSlot(20), 5)

  // "Charisma modifier + half your paladin level, rounded down, minimum 1."
  // Human raises CHA to 16 (+3). The rounding is the part worth checking.
  check.eq('prepared: CHA + half level at 2nd — 3 + 1', viewAt(2).spellcasting.preparedMax, 4)
  check.eq('prepared: 3 at 5th rounds down to 2 — 3 + 2',
    viewAt(5).spellcasting.preparedMax, 5)
  check.eq('prepared: 3 + 10 at 20th', viewAt(20).spellcasting.preparedMax, 13)

  // Charisma, not Wisdom. 8 + PB + CHA.
  check.eq('spellcasting: save DC is 8 + proficiency + Charisma at 5th',
    viewAt(5).spellcasting.saveDc.value, 14)
}

// ---------------------------------------------------------------------------
// Skills are chosen, not assigned
// ---------------------------------------------------------------------------

{
  const pending = viewAt(1, { selections: {} }).progression.pendingChoices ?? []
  const skills = pending.find((p) => p.id.endsWith(':skills'))
  check.eq('skills: two of six', skills?.count, 2)
  check.eq('skills: from the six the class list names', skills?.from?.length, 6)

  const other = { [PROFS]: { skills: ['medicine', 'persuasion'] } }
  const chosen = viewAt(1, { selections: other }).skills
    .filter((s) => s.proficiency !== 'none').map((s) => s.id)
  check.eq('skills: exactly the two named', chosen.length, 2)
  check('skills: and they are the ones the player named',
    chosen.includes('persuasion') && !chosen.includes('religion'), chosen.join(', '))
}

// ---------------------------------------------------------------------------
// Features arrive when the table says
// ---------------------------------------------------------------------------

{
  const has = (level, name) => featureNames(level).includes(name)

  check('features: Divine Sense and Lay on Hands at 1st',
    has(1, 'Divine Sense') && has(1, 'Lay on Hands'))
  check('features: Fighting Style, Spellcasting and Divine Smite at 2nd',
    has(2, 'Fighting Style') && has(2, 'Spellcasting') && has(2, 'Divine Smite'))
  check('features: none of them at 1st',
    !has(1, 'Spellcasting') && !has(1, 'Divine Smite'))
  check('features: Divine Health at 3rd', has(3, 'Divine Health') && !has(2, 'Divine Health'))
  check('features: Extra Attack at 5th', has(5, 'Extra Attack') && !has(4, 'Extra Attack'))
  check('features: Aura of Protection at 6th',
    has(6, 'Aura of Protection') && !has(5, 'Aura of Protection'))
  check('features: Aura of Courage at 10th',
    has(10, 'Aura of Courage') && !has(9, 'Aura of Courage'))
  check('features: Improved Divine Smite at 11th', has(11, 'Improved Divine Smite'))
  check('features: Cleansing Touch at 14th',
    has(14, 'Cleansing Touch') && !has(13, 'Cleansing Touch'))
  check('features: Aura Improvements at 18th', has(18, 'Aura Improvements'))

  // Lay on Hands is five hit points per paladin level, and Divine Sense is
  // 1 + Charisma modifier. Human CHA 15 + 1 = 16 → +3.
  check.eq('lay on hands: five points per level at 1st',
    resAt(1, 'paladin.layOnHands')?.maximum, 5)
  check.eq('lay on hands: and at 20th', resAt(20, 'paladin.layOnHands')?.maximum, 100)
  check.eq('divine sense: 1 + Charisma modifier', resAt(1, 'paladin.divineSense')?.maximum, 4)

  // Cleansing Touch is the Charisma modifier with a minimum of one.
  check.eq('cleansing touch: Charisma modifier uses',
    resAt(14, 'paladin.cleansing-touch')?.maximum, 3)
}

// ---------------------------------------------------------------------------
// The auras — half of each is exact, and that half must actually apply
// ---------------------------------------------------------------------------

{
  // Aura of Protection adds the paladin's own Charisma modifier to their own
  // saving throws. Getting only the ally half would have thrown that away.
  const save = (level, ability) =>
    viewAt(level).abilities.find((a) => a.ability === ability).save.value
  check.eq('aura of protection: no bonus at 5th', save(5, 'dex'), 0)
  check.eq('aura of protection: +3 at 6th, the paladin\'s Charisma modifier',
    save(6, 'dex'), 3)
  check('aura of protection: on every save, not only the proficient ones',
    save(6, 'wis') - save(5, 'wis') === 3, `${save(5, 'wis')} → ${save(6, 'wis')}`)

  // Aura of Courage suppresses frightened on the paladin, the way Mindless
  // Rage does. Frightened's effect is disadvantage on attacks while the source
  // is in sight, and it must stop biting at 10th.
  const frightened = {
    conditions: [{ conditionId: 'srd:condition.frightened' }],
    toggles: { 'frightened.sourceInSight': true }
  }
  const attackState = (level) => {
    const v = viewAt(level, frightened)
    return v.abilities.find((a) => a.ability === 'str').rollState ?? 'normal'
  }
  const checkState = (level) =>
    viewAt(level, frightened).skills.find((s) => s.id === 'athletics').rollState
  check.eq('aura of courage: frightened still bites at 9th', checkState(9), 'disadvantage')
  check.eq('aura of courage: and stops at 10th', checkState(10), 'normal')
}

// ---------------------------------------------------------------------------
// Oath of Devotion — a choice, from the first class that had none
// ---------------------------------------------------------------------------

{
  const has = (level, name) => featureNames(level, { subclassId: DEVOTION }).includes(name)

  check('devotion: Oath Spells and Channel Divinity at 3rd',
    has(3, 'Oath Spells (3rd level)') && has(3, 'Channel Divinity'))
  check('devotion: nothing at 2nd', !has(2, 'Channel Divinity'))
  check('devotion: oath spells again at 5th, 9th, 13th and 17th',
    has(5, 'Oath Spells (5th level)') && has(9, 'Oath Spells (9th level)')
      && has(13, 'Oath Spells (13th level)') && has(17, 'Oath Spells (17th level)'))
  check('devotion: Aura of Devotion at 7th',
    has(7, 'Aura of Devotion') && !has(6, 'Aura of Devotion'))
  check('devotion: Purity of Spirit at 15th', has(15, 'Purity of Spirit'))
  check('devotion: Holy Nimbus at 20th', has(20, 'Holy Nimbus') && !has(19, 'Holy Nimbus'))

  // One Channel Divinity use, two things to spend it on.
  const cd = resAt(3, 'paladin.channel-divinity', { subclassId: DEVOTION })
  check.eq('devotion: one Channel Divinity use', cd?.maximum, 1)
  check.eq('devotion: back on a short rest', cd?.refresh.kind, 'shortRest')
  const options = viewAt(3, { subclassId: DEVOTION }).actions
    .filter((a) => a.id.startsWith('paladin.channel-divinity.'))
  check.eq('devotion: Sacred Weapon and Turn the Unholy', options.length, 2)

  // Sacred Weapon's attack bonus is real, and behind a toggle because the
  // effect lasts a minute and the app runs no clock.
  const attackBonus = (toggles) => {
    const c = paladin(3, { subclassId: DEVOTION })
    c.toggles = toggles
    c.inventory = {
      instances: [{
        instanceId: 's1', definitionId: 'srd:weapon.longsword',
        contentVersion: 1, identified: true
      }],
      equipped: { mainHand: 's1' }, attunedInstanceIds: []
    }
    return playerViewOf(c, content, { detail: 'inspect' })
      .actions.find((a) => a.kind === 'attack')?.preview?.attackBonus
  }
  const off = attackBonus({})
  const on = attackBonus({ 'paladin.sacred-weapon': true })
  check.eq('devotion: Sacred Weapon adds the Charisma modifier', on - off, 3)

  // Aura of Devotion suppresses charmed the way Aura of Courage suppresses
  // frightened — and must not do so before 7th.
  const charmedNotices = (level) => viewAt(level, {
    subclassId: DEVOTION, conditions: [{ conditionId: 'srd:condition.charmed' }]
  }).effects.filter((e) => e.label === 'Charmed').length
  check('devotion: the charmed condition is still on the sheet at 7th',
    charmedNotices(7) > 0, String(charmedNotices(7)))

  // Without the oath, none of it — and the sheet says a decision is owed.
  const undecided = featureNames(15)
  check('devotion: an unchosen oath grants nothing',
    !undecided.includes('Channel Divinity') && !undecided.includes('Aura of Devotion'))
  check('devotion: and the sheet says so',
    undecided.includes('Paladin: subclass not chosen'), JSON.stringify(undecided))
}

// ---------------------------------------------------------------------------
// Fighting Style — the fighter's, minus the two a paladin cannot take
// ---------------------------------------------------------------------------

{
  const styles = (viewAt(2, { selections: {} }).progression.pendingChoices ?? [])
    .find((p) => p.id.endsWith(':fighting-style'))
  check.eq('style: four options, not six', styles?.from?.length, 4)
  check('style: no Archery and no Two-Weapon Fighting',
    !styles?.from?.includes('archery') && !styles?.from?.includes('two-weapon'),
    JSON.stringify(styles?.from))

  // The toggles are the fighter's own, so a paladin/fighter has one switch per
  // decision rather than two.
  const ac = (toggles) => {
    const c = paladin(2)
    c.toggles = toggles
    return playerViewOf(c, content, { detail: 'inspect' }).vitals.armorClass.value
  }
  check.eq('style: Defense adds 1 AC while armoured',
    ac({ 'wearing-armor': true, 'fighter.style.defense': true })
      - ac({ 'wearing-armor': true }), 1)
  check.eq('style: and nothing while unarmoured',
    ac({ 'fighter.style.defense': true }) - ac({}), 0)
}

// ---------------------------------------------------------------------------
// What the vocabulary cannot reach is visible
// ---------------------------------------------------------------------------

{
  const view = viewAt(20, { subclassId: DEVOTION })
  const named = (name) => view.effects.find((e) => e.label === name)

  for (const name of [
    'Divine Sense', 'Lay on Hands', 'Divine Smite', 'Divine Health',
    'Extra Attack', 'Aura of Protection', 'Aura of Courage',
    'Improved Divine Smite', 'Aura Improvements',
    'Oath Spells (17th level)', 'Channel Divinity', 'Aura of Devotion',
    'Purity of Spirit', 'Holy Nimbus'
  ]) {
    const feature = named(name)
    check(`partial: ${name} still reaches the sheet`, feature !== undefined)
    check(`partial: ${name} says what the player must do themselves`,
      (feature?.effects?.length ?? 0) > 0 || (feature?.description?.length ?? 0) > 0,
      JSON.stringify(feature))
  }

  // Divine Smite is the fourth feature to want extra damage dice and the
  // fourth not to get them, so it has to say the numbers.
  const smite = JSON.stringify(named('Divine Smite'))
  check('smite: names the whole 2d8-to-5d8 progression',
    smite.includes('2d8') && smite.includes('5d8'), smite)

  // The oath spell tables are transcribed, not gestured at.
  const oath = JSON.stringify(named('Oath Spells (17th level)'))
  check('devotion: the 17th-level oath spells are named',
    oath.includes('commune') && oath.includes('flame strike'), oath)
}

// ---------------------------------------------------------------------------
// The gate every class passes
// ---------------------------------------------------------------------------

{
  const problems = checkContentIntegrity(content)
    .filter((p) => p.where.includes('paladin') || p.where.includes('devotion'))
  const errors = problems.filter((p) => p.severity === 'error')
  check('integrity: the paladin and the Oath introduce no errors',
    errors.length === 0, errors.map((p) => `${p.where}: ${p.message}`).join(' | '))

  const debt = checkContentIntegrity(content)
    .filter((p) => p.message.includes('not authored yet'))
  check.eq('integrity: no class points at a subclass nobody wrote', debt.length, 0,
    debt.map((p) => p.message).join(' | '))
}

check.report()
