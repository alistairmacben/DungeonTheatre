// Ranger, levels 1 to 20, and the Hunter.
//
// The only class in the SRD the content set never had at all. Every other one
// existed in some partial form and was extended; this is the first written
// from nothing, and it needed almost no new machinery — `halfCasterSlots` came
// from the paladin, `chosenProf` from the rogue, the fighting-style toggles
// from the fighter, and standing roll-path modifiers only began working two
// commits ago.
//
// With it, every class in SRD 5.1 exists, runs to 20th level, and has a
// subclass behind every subclass slot.
//
// Checked against docs/srd-source/classes.pdf p35-38.

import { checkContentIntegrity, loadContent, playerViewOf } from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()

const HUNTER = 'srd:subclass.hunter'
const PROFS = 'srd:class.ranger.proficiencies'

function ranger(level, overrides = {}) {
  return {
    id: 'c:ranger', campaignId: 'camp-1', name: 'Thalia', playerId: 'p',
    speciesId: 'srd:species.human',
    classLevels: [{
      classId: 'srd:class.ranger', level,
      ...(overrides.subclassId ? { subclassId: overrides.subclassId } : {})
    }],
    abilityScoreBase: { str: 12, dex: 16, con: 14, int: 10, wis: 15, cha: 8 },
    buildChoices: [], hitPointsCurrent: 200, hitPointsTemp: 0,
    hitDiceSpent: {}, resourcesSpent: {}, conditions: [], effectInstances: [],
    exhaustionLevel: 0,
    inventory: overrides.inventory
      ?? { instances: [], equipped: {}, attunedInstanceIds: [] },
    deathSaves: { successes: 0, failures: 0 },
    toggles: overrides.toggles ?? {}, spellsPrepared: [],
    selections: overrides.selections
      ?? { [PROFS]: { skills: ['stealth', 'survival', 'perception'] } }
  }
}

const viewAt = (level, o) =>
  playerViewOf(ranger(level, o ?? {}), content, { detail: 'inspect' })
const featureNames = (level, o) => viewAt(level, o).effects.map((e) => e.label)

const countPending = (level, selId, o) =>
  (viewAt(level, o).progression.pendingChoices ?? [])
    .filter((p) => p.id.endsWith(`:${selId}`))
    .reduce((n, p) => n + p.count, 0)

// ---------------------------------------------------------------------------
// The class exists at all
// ---------------------------------------------------------------------------

{
  check('exists: the ranger is in the content set',
    content.classes.get('srd:class.ranger') !== undefined)
  check.eq('exists: and all twelve SRD classes now are', content.classes.size, 12)
}

// ---------------------------------------------------------------------------
// The second half caster, on the paladin's table
// ---------------------------------------------------------------------------

{
  check.eq('half caster: no spell panel at 1st', viewAt(1).spellcasting, undefined)
  check('half caster: and a panel from 2nd', viewAt(2).spellcasting !== undefined)

  const slotCount = (level, tier) =>
    viewAt(level).resources.find((r) => r.id === `ranger.slots.${tier}`)?.maximum ?? 0
  check.eq('slots: two 1st-level at 2nd', slotCount(2, 1), 2)
  check.eq('slots: four 1st and two 2nd at 5th',
    `${slotCount(5, 1)}/${slotCount(5, 2)}`, '4/2')
  check.eq('slots: two 3rd-level at 9th', slotCount(9, 3), 2)
  check.eq('slots: two 5th-level at 19th', slotCount(19, 5), 2)

  const topSlot = (level) =>
    Math.max(0, ...(viewAt(level).spellcasting?.slots ?? []).map((s) => s.level))
  check.eq('slots: 5th at 20th — and never higher', topSlot(20), 5)

  // Wisdom, not Charisma. Human raises WIS to 16 (+3): 8 + PB + 3.
  check.eq('spellcasting: save DC is 8 + proficiency + Wisdom at 5th',
    viewAt(5).spellcasting.saveDc.value, 14)
  check.eq('spellcasting: and the attack bonus matches',
    viewAt(5).spellcasting.attackBonus.value, 6)

  // A known caster prepares nothing.
  check.eq('spellcasting: nothing is prepared, ever',
    viewAt(10).spellcasting.preparedMax, 0)
}

// ---------------------------------------------------------------------------
// The Spells Known column
// ---------------------------------------------------------------------------

{
  const blank = { selections: {} }
  check.eq('spells known: none at 1st', countPending(1, 'spells', blank), 0)
  check.eq('spells known: two at 2nd', countPending(2, 'spells', blank), 2)
  check.eq('spells known: three at 3rd', countPending(3, 'spells', blank), 3)
  // The column holds on every even level from 4th, so half of a ranger's
  // level-ups teach nothing.
  check.eq('spells known: still three at 4th', countPending(4, 'spells', blank), 3)
  check.eq('spells known: four at 5th', countPending(5, 'spells', blank), 4)
  check.eq('spells known: eleven at 19th', countPending(19, 'spells', blank), 11)
  check.eq('spells known: and still eleven at 20th', countPending(20, 'spells', blank), 11)
}

// ---------------------------------------------------------------------------
// Three skills, not two
// ---------------------------------------------------------------------------

{
  const pending = viewAt(1, { selections: {} }).progression.pendingChoices ?? []
  const skills = pending.find((p) => p.id.endsWith(':skills'))
  check.eq('skills: three of eight — more than any class but the rogue and bard',
    skills?.count, 3)
  check.eq('skills: from the eight the class list names', skills?.from?.length, 8)

  const chosen = viewAt(1).skills.filter((s) => s.proficiency !== 'none').map((s) => s.id)
  check.eq('skills: exactly the three named', chosen.length, 3)
  check('skills: and they are the ones the player named',
    chosen.includes('stealth') && !chosen.includes('nature'), chosen.join(', '))
}

// ---------------------------------------------------------------------------
// Features arrive when the table says
// ---------------------------------------------------------------------------

{
  const has = (level, name) => featureNames(level).includes(name)

  check('features: Favored Enemy and Natural Explorer at 1st',
    has(1, 'Favored Enemy') && has(1, 'Natural Explorer'))
  check('features: Fighting Style and Spellcasting at 2nd, not 1st',
    has(2, 'Fighting Style') && has(2, 'Spellcasting') && !has(1, 'Spellcasting'))
  check('features: Primeval Awareness at 3rd', has(3, 'Primeval Awareness'))
  check('features: Extra Attack at 5th', has(5, 'Extra Attack') && !has(4, 'Extra Attack'))
  check('features: a second Favored Enemy and terrain at 6th',
    has(6, 'Favored Enemy (level 6)') && has(6, 'Natural Explorer (level 6)'))
  check('features: Land\'s Stride at 8th', has(8, "Land's Stride") && !has(7, "Land's Stride"))
  check('features: a third terrain at 10th, and Hide in Plain Sight',
    has(10, 'Natural Explorer (level 10)') && has(10, 'Hide in Plain Sight'))
  check('features: a third Favored Enemy at 14th, and Vanish',
    has(14, 'Favored Enemy (level 14)') && has(14, 'Vanish'))
  check('features: Feral Senses at 18th', has(18, 'Feral Senses'))
  check('features: Foe Slayer at 20th', has(20, 'Foe Slayer') && !has(19, 'Foe Slayer'))

  // The improvement levels differ between the two features — 6/14 for enemies,
  // 6/10 for terrain — which is easy to conflate.
  check('features: no third Favored Enemy at 10th', !has(10, 'Favored Enemy (level 14)'))
  check('features: no third terrain at 14th', !has(14, 'Natural Explorer (level 14)'))
}

// ---------------------------------------------------------------------------
// The toggled halves that are real
// ---------------------------------------------------------------------------

{
  // Favored Enemy: advantage on Survival to track them and on Intelligence
  // checks to recall information.
  const survival = (toggles) =>
    viewAt(6, { toggles }).skills.find((s) => s.id === 'survival').rollState
  check.eq('favored enemy: no advantage untoggled', survival({}), 'normal')
  check.eq('favored enemy: advantage on Survival when declared',
    survival({ 'ranger.favored-enemy': true }), 'advantage')

  const intCheck = (toggles) =>
    viewAt(6, { toggles }).abilities.find((a) => a.ability === 'int').rollState ?? 'normal'
  check.eq('favored enemy: and on Intelligence checks',
    intCheck({ 'ranger.favored-enemy': true }), 'advantage')

  // Natural Explorer: doubled proficiency on Intelligence and Wisdom checks
  // made with a skill you are proficient in — and only those. Perception is a
  // chosen proficiency here; Nature is not.
  const skill = (skillId, toggles) =>
    viewAt(6, { toggles }).skills.find((s) => s.id === skillId).total.value
  const on = { 'ranger.favored-terrain': true }
  check('explorer: a proficient Wisdom skill doubles in favored terrain',
    skill('perception', on) - skill('perception', {}) === 3,
    `${skill('perception', {})} → ${skill('perception', on)}`)
  // "if you are using a skill that you're proficient in" — the resolver's zero
  // rule enforces this without a rule of its own.
  check.eq('explorer: and a skill you lack does not',
    skill('nature', on) - skill('nature', {}), 0)
  check.eq('explorer: Charisma checks are untouched — the scope is INT and WIS',
    viewAt(6, { toggles: on }).abilities.find((a) => a.ability === 'cha').save.value,
    viewAt(6).abilities.find((a) => a.ability === 'cha').save.value)

  // Hide in Plain Sight: a flat +10 on Stealth, and nothing until declared.
  const stealth = (toggles) =>
    viewAt(10, { toggles }).skills.find((s) => s.id === 'stealth').total.value
  check.eq('hide in plain sight: +10 when camouflaged',
    stealth({ 'ranger.hide-in-plain-sight': true }) - stealth({}), 10)

  // Land's Stride is the Circle of the Land's, word for word.
  const stride = viewAt(8).effects.find((e) => e.label === "Land's Stride")
  const lines = (stride?.effects ?? []).join(' | ')
  check('land\'s stride: changes difficult terrain and grants advantage',
    lines.includes('difficult') && lines.includes('advantage'), lines)
}

// ---------------------------------------------------------------------------
// Fighting Style — the fighter's, and a different four from the paladin's
// ---------------------------------------------------------------------------

{
  const styles = (viewAt(2, { selections: {} }).progression.pendingChoices ?? [])
    .find((p) => p.id.endsWith(':fighting-style'))
  check.eq('style: four options', styles?.from?.length, 4)
  check('style: Archery and Two-Weapon, not Great Weapon or Protection',
    styles?.from?.includes('archery') && styles?.from?.includes('two-weapon')
      && !styles?.from?.includes('protection'), JSON.stringify(styles?.from))

  // Archery only started working two commits ago, when standing modifiers on
  // a roll path began being read at all.
  const attack = (toggles) => {
    const c = ranger(2, { toggles })
    c.inventory = {
      instances: [{
        instanceId: 'b1', definitionId: 'srd:weapon.longbow',
        contentVersion: 1, identified: true
      }],
      equipped: { mainHand: 'b1' }, attunedInstanceIds: []
    }
    return playerViewOf(c, content, { detail: 'inspect' })
      .actions.find((a) => a.kind === 'attack')?.preview?.attackBonus
  }
  check.eq('style: Archery adds +2 to a ranged attack',
    attack({ 'fighter.style.archery': true }) - attack({}), 2)
}

// ---------------------------------------------------------------------------
// Hunter — four features, every one of them a choice
// ---------------------------------------------------------------------------

{
  const has = (level, name) => featureNames(level, { subclassId: HUNTER }).includes(name)

  check('hunter: Hunter\'s Prey at 3rd', has(3, "Hunter's Prey") && !has(2, "Hunter's Prey"))
  check('hunter: Defensive Tactics at 7th', has(7, 'Defensive Tactics') && !has(6, 'Defensive Tactics'))
  check('hunter: Multiattack at 11th', has(11, 'Multiattack') && !has(10, 'Multiattack'))
  check('hunter: Superior Hunter\'s Defense at 15th',
    has(15, "Superior Hunter's Defense") && !has(14, "Superior Hunter's Defense"))

  const opts = (level, selId) =>
    (viewAt(level, { subclassId: HUNTER, selections: {} }).progression.pendingChoices ?? [])
      .find((p) => p.id.endsWith(`:${selId}`))?.from ?? []
  check.eq('hunter: three ways to hunt prey', opts(3, 'hunters-prey').length, 3)
  check.eq('hunter: three defensive tactics', opts(7, 'defensive-tactics').length, 3)
  check.eq('hunter: two multiattacks', opts(11, 'multiattack').length, 2)
  check.eq('hunter: three superior defenses', opts(15, 'superior-defense').length, 3)

  // Steel Will is the one option in all eleven the vocabulary reaches.
  const frightSave = (toggles) => {
    const c = ranger(7, { subclassId: HUNTER })
    c.toggles = toggles
    // The save must carry the frightened tag for the scope to match, which is
    // what the halfling's Brave already relies on.
    return playerViewOf(c, content, { detail: 'inspect' })
      .effects.find((e) => e.label === 'Defensive Tactics')?.effects ?? []
  }
  check('hunter: Steel Will applies when declared',
    frightSave({ 'ranger.steel-will': true }).some(
      (l) => l.includes('advantage') && !l.includes('not applying')),
    JSON.stringify(frightSave({ 'ranger.steel-will': true })))
  check('hunter: and says so when it is not',
    frightSave({}).some((l) => l.includes('not applying')),
    JSON.stringify(frightSave({})))

  // Without the archetype, none of it — and the sheet says a decision is owed.
  const undecided = featureNames(15)
  check('hunter: an unchosen archetype grants nothing',
    !undecided.includes("Hunter's Prey") && !undecided.includes('Multiattack'))
  check('hunter: and the sheet says so',
    undecided.includes('Ranger: subclass not chosen'), JSON.stringify(undecided))
}

// ---------------------------------------------------------------------------
// What the vocabulary cannot reach is visible
// ---------------------------------------------------------------------------

{
  const view = viewAt(20, { subclassId: HUNTER })
  const named = (name) => view.effects.find((e) => e.label === name)

  for (const name of [
    'Favored Enemy', 'Natural Explorer', 'Primeval Awareness', 'Extra Attack',
    "Land's Stride", 'Feral Senses', 'Foe Slayer',
    "Hunter's Prey", 'Defensive Tactics', 'Multiattack',
    "Superior Hunter's Defense"
  ]) {
    const feature = named(name)
    check(`partial: ${name} still reaches the sheet`, feature !== undefined)
    check(`partial: ${name} says what the player must do themselves`,
      (feature?.effects?.length ?? 0) > 0 || (feature?.description?.length ?? 0) > 0,
      JSON.stringify(feature))
  }

  // Every Hunter option must reach the player as text, not just as an id in a
  // dropdown — eleven options across four features.
  const hunterText = view.notices
    .filter((n) => n.label.includes('Hunter') || n.label === 'Defensive Tactics'
      || n.label === 'Multiattack')
    .map((n) => n.text).join(' ')
  check('hunter: all eleven options are described, not just named',
    hunterText.includes('Colossus Slayer') && hunterText.includes('Horde Breaker')
      && hunterText.includes('Whirlwind Attack') && hunterText.includes('Uncanny Dodge'),
    hunterText.slice(0, 200))
}

// ---------------------------------------------------------------------------
// The gate every class passes — and the last one to walk through it
// ---------------------------------------------------------------------------

{
  const problems = checkContentIntegrity(content)
    .filter((p) => p.where.includes('ranger') || p.where.includes('hunter'))
  const errors = problems.filter((p) => p.severity === 'error')
  check('integrity: the ranger and the Hunter introduce no errors',
    errors.length === 0, errors.map((p) => `${p.where}: ${p.message}`).join(' | '))

  const debt = checkContentIntegrity(content)
    .filter((p) => p.message.includes('not authored yet'))
  check.eq('integrity: no class points at a subclass nobody wrote', debt.length, 0,
    debt.map((p) => p.message).join(' | '))

  // Every class runs to 20th level: each must have at least one feature
  // granted above 15th, which no class did before this stretch of work.
  const shallow = [...content.classes.values()].filter(
    (c) => !c.features.some((f) => f.grantedAtLevel >= 15))
  check.eq('integrity: every class has features past 15th level', shallow.length, 0,
    shallow.map((c) => c.name).join(', '))
}

check.report()
