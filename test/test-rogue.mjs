// Rogue, levels 1 to 20, and the Thief archetype.
//
// The rogue stopped at 5th level. Worse, two of the three things that make a
// rogue a rogue were not choices: every rogue who would ever exist was
// proficient in the same four skills and doubled the same two, and Sneak
// Attack was hardcoded to "3d6" — the level-5 row of a twenty-row column. The
// class also declared a subclass slot pointing at a `srd:subclass.thief` that
// nobody had written.
//
// Checked against docs/srd-source/classes.pdf p39-41.

import { checkContentIntegrity, loadContent, playerViewOf } from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()

const THIEF = 'srd:subclass.thief'
const PROFS = 'srd:class.rogue.proficiencies'

// Four skills chosen and two doubled, so the rogue below is a specific rogue
// rather than whatever the file used to hand out.
const CHOICES = {
  [PROFS]: { skills: ['acrobatics', 'perception', 'sleight-of-hand', 'stealth'] },
  'srd:class.rogue.expertise': { expertise: ['perception', 'stealth'] }
}

function rogue(level, overrides = {}) {
  return {
    id: 'c:rogue', campaignId: 'camp-1', name: 'Pip', playerId: 'p',
    speciesId: 'srd:species.halfling', subspeciesId: 'srd:species.halfling.lightfoot',
    classLevels: [{
      classId: 'srd:class.rogue', level,
      ...(overrides.subclassId ? { subclassId: overrides.subclassId } : {})
    }],
    abilityScoreBase: { str: 10, dex: 16, con: 14, int: 13, wis: 12, cha: 14 },
    buildChoices: [], hitPointsCurrent: 60, hitPointsTemp: 0,
    hitDiceSpent: {}, resourcesSpent: {}, conditions: [], effectInstances: [],
    exhaustionLevel: 0,
    inventory: { instances: [], equipped: {}, attunedInstanceIds: [] },
    deathSaves: { successes: 0, failures: 0 }, toggles: {}, spellsPrepared: [],
    selections: overrides.selections ?? CHOICES
  }
}

const viewAt = (level, o) => playerViewOf(rogue(level, o ?? {}), content, { detail: 'inspect' })
const featureNames = (level, o) => viewAt(level, o).effects.map((e) => e.label)
const skill = (level, id, o) => viewAt(level, o).skills.find((x) => x.id === id)

// ---------------------------------------------------------------------------
// Skills are chosen, not assigned
// ---------------------------------------------------------------------------

{
  const pending = viewAt(1, { selections: {} }).progression.pendingChoices ?? []
  const skills = pending.find((p) => p.id.endsWith(':skills'))
  check.eq('skills: the rogue chooses four — more than any other class',
    skills?.count, 4)
  check.eq('skills: from the eleven the class list names', skills?.from?.length, 11)

  // An unanswered choice grants nothing rather than guessing.
  const blank = viewAt(1, { selections: {} }).skills.filter((s) => s.proficiency !== 'none')
  check.eq('skills: an unanswered choice grants no proficiency', blank.length, 0)

  // An answered one grants exactly what was named.
  const proficient = viewAt(1).skills.filter((s) => s.proficiency !== 'none').map((s) => s.id)
  check.eq('skills: and an answered one grants exactly four', proficient.length, 4)
  check('skills: the four that were actually chosen',
    proficient.includes('acrobatics') && proficient.includes('stealth')
      && !proficient.includes('deception'), proficient.join(', '))
}

// ---------------------------------------------------------------------------
// Expertise — the only place the proficiency bonus is multiplied
// ---------------------------------------------------------------------------

{
  // DEX 16 + halfling +2 = 18 → +4. Proficiency at 1st is +2.
  check.eq('expertise: a doubled skill adds the bonus twice', skill(1, 'stealth').total.value, 8)
  check.eq('expertise: and reads as expertise', skill(1, 'stealth').proficiency, 'expertise')
  check.eq('expertise: a merely proficient one adds it once',
    skill(1, 'acrobatics').total.value, 6)

  // Doubling something you are not proficient in doubles nothing — the SRD's
  // "choose two of your proficiencies" is enforced by arithmetic, not a rule.
  const wrong = {
    [PROFS]: { skills: ['acrobatics', 'perception', 'sleight-of-hand', 'stealth'] },
    'srd:class.rogue.expertise': { expertise: ['arcana', 'stealth'] }
  }
  check.eq('expertise: doubling a skill you lack doubles nothing',
    skill(1, 'arcana', { selections: wrong }).total.value, 1)

  // A second Expertise arrives at 6th, and is a separate question.
  const sixth = (viewAt(6).progression.pendingChoices ?? [])
    .filter((p) => p.id.endsWith(':expertise-6'))
  check.eq('expertise: two more proficiencies to double at 6th', sixth.length, 1)
  check.eq('expertise: nothing at 5th',
    (viewAt(5).progression.pendingChoices ?? [])
      .filter((p) => p.id.endsWith(':expertise-6')).length, 0)
}

// ---------------------------------------------------------------------------
// Features arrive when the table says
// ---------------------------------------------------------------------------

{
  const has = (level, name) => featureNames(level).includes(name)

  check('features: Cunning Action at 2nd, not 1st',
    has(2, 'Cunning Action') && !has(1, 'Cunning Action'))
  check('features: Uncanny Dodge at 5th, not 4th',
    has(5, 'Uncanny Dodge') && !has(4, 'Uncanny Dodge'))
  check('features: Evasion at 7th, not 6th',
    has(7, 'Evasion') && !has(6, 'Evasion'))
  check('features: Reliable Talent at 11th, not 10th',
    has(11, 'Reliable Talent') && !has(10, 'Reliable Talent'))
  check('features: Blindsense at 14th', has(14, 'Blindsense') && !has(13, 'Blindsense'))
  check('features: Slippery Mind at 15th', has(15, 'Slippery Mind') && !has(14, 'Slippery Mind'))
  check('features: Elusive at 18th', has(18, 'Elusive') && !has(17, 'Elusive'))
  check('features: Stroke of Luck at 20th', has(20, 'Stroke of Luck') && !has(19, 'Stroke of Luck'))

  // Slippery Mind is wholly expressible: a third saving throw proficiency, and
  // the proficiency machinery does the rest without a rule of its own.
  const wisSave = (level) =>
    viewAt(level).abilities.find((a) => a.ability === 'wis').save.proficient
  check.eq('slippery mind: no Wisdom save proficiency at 14th', wisSave(14), false)
  check.eq('slippery mind: proficient from 15th', wisSave(15), true)

  // Stroke of Luck is one use that comes back on a short rest.
  const stroke = viewAt(20).resources.find((r) => r.id === 'rogue.stroke-of-luck')
  check.eq('stroke of luck: one use', stroke?.maximum, 1)
  check.eq('stroke of luck: back on a short rest', stroke?.refresh.kind, 'shortRest')
}

// ---------------------------------------------------------------------------
// Cunning Action — three actions on one bonus action, and no resource
// ---------------------------------------------------------------------------

{
  const bonus = viewAt(2).actions.filter((a) => a.cost.type === 'bonusAction')
  check('cunning action: dash, disengage and hide', bonus.length >= 3,
    bonus.map((a) => a.label).join(', '))
  check('cunning action: none of them costs a resource',
    bonus.every((a) => a.costs.length === 0))

  // Found by rendering the sheet rather than by any assertion above: a feature
  // whose entire contribution is new things to do had no describable lines, so
  // it was dropped from the feature list altogether. The actions still worked;
  // the rogue simply had no feature called Cunning Action.
  const feature = viewAt(2).effects.find((e) => e.label === 'Cunning Action')
  check('cunning action: is a feature on the sheet, not only three loose actions',
    feature !== undefined)
  check('cunning action: and the feature says what it lets you do',
    (feature?.effects ?? []).some((l) => l.includes('bonus action')),
    JSON.stringify(feature?.effects))
}

// ---------------------------------------------------------------------------
// A chosen proficiency reads as the thing that was chosen
// ---------------------------------------------------------------------------

{
  const lines = (level, label, o) =>
    (viewAt(level, o).effects.find((e) => e.label === label)?.effects ?? []).join(' | ')

  // Also found by rendering: the grant names a selection, not a skill, so
  // describing the grant as authored read "proficient in the undefined skill"
  // four times over. The player must see their own answer.
  const profs = lines(1, 'Rogue Proficiencies')
  check('readable: no raw ids and no undefined in the proficiency lines',
    !profs.includes('undefined') && !profs.includes('sleight-of-hand'), profs)
  check('readable: the skills the player actually chose, by name',
    profs.includes('Sleight of Hand') && profs.includes('Acrobatics'), profs)
  check('readable: expertise names its two, not the selection id',
    lines(1, 'Expertise') === 'expertise in Perception | expertise in Stealth',
    lines(1, 'Expertise'))

  // And an unanswered choice reads as the question rather than as nothing.
  const unanswered = lines(1, 'Expertise', { selections: {} })
  check('readable: an unanswered choice shows the prompt',
    unanswered.includes('Choose two'), unanswered)
}

// ---------------------------------------------------------------------------
// Thief — a choice now, not a gift
// ---------------------------------------------------------------------------

{
  const has = (level, name) => featureNames(level, { subclassId: THIEF }).includes(name)

  check('thief: Fast Hands and Second-Story Work at 3rd',
    has(3, 'Fast Hands') && has(3, 'Second-Story Work'))
  check('thief: nothing at 2nd', !has(2, 'Fast Hands'))
  check('thief: Supreme Sneak at 9th', has(9, 'Supreme Sneak') && !has(8, 'Supreme Sneak'))
  check('thief: Use Magic Device at 13th', has(13, 'Use Magic Device'))
  check("thief: Thief's Reflexes at 17th",
    has(17, "Thief's Reflexes") && !has(16, "Thief's Reflexes"))

  // Fast Hands adds three more things to spend the bonus action on, and they
  // are additional Cunning Action options rather than a fourth resource.
  const bonus = viewAt(3, { subclassId: THIEF }).actions
    .filter((a) => a.cost.type === 'bonusAction')
  check('thief: Fast Hands adds three bonus-action options', bonus.length >= 6,
    bonus.map((a) => a.label).join(', '))
  check('thief: and still spends no resource', bonus.every((a) => a.costs.length === 0))

  // Second-Story Work is one of the few subclass features that is entirely
  // arithmetic rather than prose — climbing costs no extra movement, and the
  // running jump grows by the rogue's Dexterity modifier. Both must reach the
  // player as readable lines, not as raw stat paths.
  const ssw = viewAt(3, { subclassId: THIEF }).effects
    .find((e) => e.label === 'Second-Story Work')
  const lines = (ssw?.effects ?? []).join(' | ')
  check('thief: Second-Story Work states both halves', (ssw?.effects?.length ?? 0) === 2, lines)
  check('thief: and states them in English, not stat paths',
    !lines.includes('movement.') && !lines.includes('jump.'), lines)

  // Supreme Sneak's advantage is behind a toggle, because the app does not
  // track how far anyone moved.
  const sneakAdv = (toggles) => {
    const c = rogue(9, { subclassId: THIEF })
    c.toggles = toggles
    return playerViewOf(c, content, { detail: 'inspect' })
      .skills.find((s) => s.id === 'stealth').rollState
  }
  check.eq('thief: Supreme Sneak grants no advantage untoggled', sneakAdv({}), 'normal')
  check.eq('thief: and advantage when the player declares it',
    sneakAdv({ 'rogue.supreme-sneak': true }), 'advantage')

  // And an undecided rogue is told, rather than quietly missing five features.
  const undecided = featureNames(17)
  check('thief: an unchosen archetype grants nothing',
    !undecided.includes('Fast Hands') && !undecided.includes('Supreme Sneak'))
  check('thief: and the sheet says a decision is owed',
    undecided.includes('Rogue: subclass not chosen'), JSON.stringify(undecided))
}

// ---------------------------------------------------------------------------
// What the vocabulary cannot reach is visible
// ---------------------------------------------------------------------------

{
  const view = viewAt(20, { subclassId: THIEF })
  const named = (name) => view.effects.find((e) => e.label === name)

  for (const name of [
    'Sneak Attack', 'Uncanny Dodge', 'Evasion', 'Reliable Talent',
    'Elusive', 'Stroke of Luck', 'Use Magic Device', "Thief's Reflexes"
  ]) {
    const feature = named(name)
    check(`partial: ${name} still reaches the sheet`, feature !== undefined)
    check(`partial: ${name} says what the player must do themselves`,
      (feature?.effects?.length ?? 0) > 0 || (feature?.description?.length ?? 0) > 0,
      JSON.stringify(feature))
  }

  // Sneak Attack in particular: the old text said "3d6" at every level from 1
  // to 20. Whatever it says now, it must not name a single fixed number of
  // dice, because the column has ten different ones.
  const sneak = named('Sneak Attack')
  const text = JSON.stringify(sneak)
  check('sneak attack: no longer frozen at the level-5 row',
    !text.includes('3d6'), text)
  check('sneak attack: describes the column it actually scales along',
    text.includes('1d6') && text.includes('10d6'), text)
}

// ---------------------------------------------------------------------------
// The gate every class passes
// ---------------------------------------------------------------------------

{
  const problems = checkContentIntegrity(content)
    .filter((p) => p.where.includes('rogue') || p.where.includes('thief'))
  const errors = problems.filter((p) => p.severity === 'error')
  check('integrity: the rogue and the Thief introduce no errors',
    errors.length === 0, errors.map((p) => `${p.where}: ${p.message}`).join(' | '))

  const debt = checkContentIntegrity(content)
    .filter((p) => p.message.includes('not authored yet') && p.message.includes('thief'))
  check.eq('integrity: the Thief is no longer unauthored debt', debt.length, 0)
}

check.report()
