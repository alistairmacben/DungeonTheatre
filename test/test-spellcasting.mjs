// Spellcasting.
//
// The claim under test is not "spells work" but "spells needed almost nothing
// new". So the assertions deliberately reach for the *old* machinery: the save
// DC is checked as a stat with a breakdown, a wand raises it by being an `add`,
// mage armor loses to chain mail through the ordinary highest-wins base rule,
// and a cast spends a slot through the ordinary resource path.

import {
  applyCommand, createResolution, loadContent, playerViewOf, resolveSpellcasting
} from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()

const item = (instanceId, definitionId) =>
  ({ instanceId, definitionId, contentVersion: 1, identified: true })

function wizard(overrides = {}) {
  return {
    id: 'char:wizard', campaignId: 'camp-1', name: 'Ilyana Vess', playerId: 'p2',
    speciesId: 'srd:species.elf', subspeciesId: 'srd:species.elf.high',
    classLevels: [{ classId: 'srd:class.wizard', level: 5 }],
    // 16 INT before the +1 from High Elf, so the modifier is +3.
    abilityScoreBase: { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 },
    buildChoices: [], hitPointsCurrent: 32, hitPointsTemp: 0,
    hitDiceSpent: {}, resourcesSpent: {}, conditions: [], effectInstances: [],
    exhaustionLevel: 0,
    inventory: { instances: [item('i-dagger', 'srd:weapon.dagger')], equipped: { mainHand: 'i-dagger' }, attunedInstanceIds: [] },
    deathSaves: { successes: 0, failures: 0 }, toggles: {},
    // A wizard's three cantrips are chosen now, not three the class named for
    // every wizard that would ever exist. This fixture picks the three the old
    // hardcoded grant handed out, so the numbers below stay comparable.
    selections: {
      'srd:class.wizard.spellcasting': {
        cantrips: [
          'srd:spell.fire-bolt', 'srd:spell.ray-of-frost', 'srd:spell.prestidigitation'
        ]
      }
    },
    spellsPrepared: [],
    ...overrides
  }
}

const WIZ = wizard()
const casting = (c) => resolveSpellcasting(createResolution(c, content), content)

// ---------------------------------------------------------------------------
// The DC is a stat, which is the whole design
// ---------------------------------------------------------------------------

{
  const c = casting(WIZ)
  check('dc: spellcasting is active', c.active === true)
  // 8 + proficiency 3 + Intelligence 3 (16 base + 1 High Elf = 17)
  check('dc: save DC is 8 + proficiency + Intelligence', c.saveDc.total === 14, c.saveDc.total)
  check('dc: spell attack is proficiency + Intelligence', c.attackBonus.total === 6, c.attackBonus.total)
  check('dc: and the DC explains itself like any other stat',
    c.saveDc.terms.filter((t) => t.applied).length >= 3,
    c.saveDc.terms.map((t) => `${t.sourceName} ${t.value}`).join(', '))

  // The load-bearing claim: an item raises the DC with no spell-specific code.
  const withWand = wizard({
    inventory: {
      instances: [item('i-dagger', 'srd:weapon.dagger'), item('i-wand', 'srd:item.wand-of-the-war-mage')],
      equipped: { mainHand: 'i-dagger', offHand: 'i-wand' },
      attunedInstanceIds: ['i-wand']
    }
  })
  const wanded = casting(withWand)
  check('dc: an attuned wand raises it, being an ordinary add', wanded.saveDc.total === 15, wanded.saveDc.total)
  check('dc: and raises the attack bonus too', wanded.attackBonus.total === 7, wanded.attackBonus.total)
  check('dc: naming the wand in the breakdown',
    wanded.saveDc.terms.some((t) => t.applied && t.sourceName.includes('Wand')))
}

// ---------------------------------------------------------------------------
// Access: two grants, one type
// ---------------------------------------------------------------------------

{
  const c = casting(WIZ)
  const byId = (id) => c.accessible.find((s) => s.spell.id === id)

  check('access: cantrips are always available',
    byId('srd:spell.fire-bolt').alwaysAvailable === true)
  check('access: and castable without preparing',
    byId('srd:spell.fire-bolt').available === true)
  check('access: a cantrip costs no slot',
    byId('srd:spell.fire-bolt').slotOptions.length === 0)

  check('access: the spellbook list requires preparation',
    byId('srd:spell.magic-missile').prepared === false)
  check('access: and says so',
    byId('srd:spell.magic-missile').unavailableReasons.includes('not prepared'))

  // The High Elf grants prestidigitation and so does the wizard's cantrip
  // list. Reachable twice is still one spell.
  const prest = c.accessible.filter((s) => s.spell.id === 'srd:spell.prestidigitation')
  check('access: a spell reachable by two grants appears once', prest.length === 1)

  // maxLevel 3 on the list grant: nothing above 3rd should appear at all.
  check('access: the list grant respects its level cap',
    c.accessible.every((s) => s.spell.level <= 3),
    c.accessible.filter((s) => s.spell.level > 3).map((s) => s.spell.name).join(', '))
  check('access: a cleric-only spell is not on the wizard list',
    byId('srd:spell.cure-wounds') === undefined)
}

// ---------------------------------------------------------------------------
// Preparation
// ---------------------------------------------------------------------------

{
  // Intelligence modifier 3 + wizard level 5 = 8.
  check('prepare: the limit is a stat', casting(WIZ).preparedMax === 8, casting(WIZ).preparedMax)

  const prepared = applyCommand(WIZ, {
    type: 'prepareSpells', characterId: WIZ.id,
    spellIds: ['srd:spell.magic-missile', 'srd:spell.mage-armor', 'srd:spell.shield']
  }, content)
  check('prepare: it is accepted', prepared.rejected === undefined,
    prepared.rejected && prepared.rejected.reasons.join('; '))

  const c = casting(prepared.character)
  check('prepare: the spell becomes castable',
    c.accessible.find((s) => s.spell.id === 'srd:spell.magic-missile').available === true)
  check('prepare: and counts against the limit', c.preparedCount === 3, c.preparedCount)
  check('prepare: cantrips do not count against it',
    c.accessible.filter((s) => s.alwaysAvailable).every((s) => s.prepared))

  const tooMany = applyCommand(WIZ, {
    type: 'prepareSpells', characterId: WIZ.id,
    spellIds: Array.from({ length: 9 }, () => 'srd:spell.magic-missile')
  }, content)
  check('prepare: over the limit is rejected', tooMany.rejected !== undefined)

  const notMine = applyCommand(WIZ, {
    type: 'prepareSpells', characterId: WIZ.id, spellIds: ['srd:spell.cure-wounds']
  }, content)
  check('prepare: a spell you do not have is rejected', notMine.rejected !== undefined)
  check('prepare: naming it, not its id',
    notMine.rejected.reasons.some((r) => r.includes('Cure Wounds')),
    notMine.rejected.reasons.join('; '))
}

// ---------------------------------------------------------------------------
// Casting
// ---------------------------------------------------------------------------

const READY = applyCommand(WIZ, {
  type: 'prepareSpells', characterId: WIZ.id,
  spellIds: [
    'srd:spell.magic-missile', 'srd:spell.mage-armor', 'srd:spell.detect-magic',
    'srd:spell.protection-from-energy'
  ]
}, content).character

{
  const cast = applyCommand(READY, {
    type: 'castSpell', characterId: WIZ.id, spellId: 'srd:spell.magic-missile'
  }, content)
  check('cast: it is accepted', cast.rejected === undefined,
    cast.rejected && cast.rejected.reasons.join('; '))
  check('cast: it emits SpellCast', cast.events.some((e) => e.type === 'SpellCast'))
  check('cast: spending a slot through the ordinary resource path',
    cast.character.resourcesSpent['wizard.slots.1'] === 1)
  check('cast: the cheapest viable slot, never a higher one',
    cast.events.find((e) => e.type === 'SpellCast').payload.castAtLevel === 1)
  check('cast: and it is not marked as upcast',
    cast.events.find((e) => e.type === 'SpellCast').payload.upcast === false)

  // Upcasting is the same command with a different slot, not a second command.
  const up = applyCommand(READY, {
    type: 'castSpell', characterId: WIZ.id,
    spellId: 'srd:spell.magic-missile', slotResourceId: 'wizard.slots.3'
  }, content)
  check('cast: naming a higher slot upcasts',
    up.character.resourcesSpent['wizard.slots.3'] === 1)
  check('cast: and says so', up.events.find((e) => e.type === 'SpellCast').payload.upcast === true)

  const tooLow = applyCommand(READY, {
    type: 'castSpell', characterId: WIZ.id,
    spellId: 'srd:spell.protection-from-energy', slotResourceId: 'wizard.slots.1'
  }, content)
  check('cast: a slot below the spell level is refused', tooLow.rejected !== undefined)

  // A cantrip spends nothing at all.
  const cantrip = applyCommand(READY, {
    type: 'castSpell', characterId: WIZ.id, spellId: 'srd:spell.fire-bolt'
  }, content)
  check('cast: a cantrip spends no slot',
    Object.keys(cantrip.character.resourcesSpent).length === 0)

  const unprepared = applyCommand(WIZ, {
    type: 'castSpell', characterId: WIZ.id, spellId: 'srd:spell.magic-missile'
  }, content)
  check('cast: an unprepared spell is refused', unprepared.rejected !== undefined)
  check('cast: for the reason the view already showed',
    unprepared.rejected.reasons.includes('not prepared'))
}

// ---------------------------------------------------------------------------
// Spells meet the stat pipeline
//
// The real test of the design: a spell that changes AC must compete with
// armour through the same operations armour uses.
// ---------------------------------------------------------------------------

{
  const before = createResolution(READY, content).stat('armorClass').total
  // Unarmoured elf wizard: baseline 10 + Dex 3 (14 base, +2 from Elf) = 13.
  check('pipeline: the unarmoured wizard starts at 13', before === 13, before)

  const armored = applyCommand(READY, {
    type: 'castSpell', characterId: WIZ.id, spellId: 'srd:spell.mage-armor'
  }, content)
  const after = createResolution(armored.character, content).stat('armorClass').total
  check('pipeline: mage armor raises the base to 13 + Dex', after === 16, after)
  check('pipeline: it won the base contest, it did not add',
    createResolution(armored.character, content).stat('armorClass').terms
      .some((t) => t.applied && t.stage === 'base' && t.sourceName === 'Mage Armor'))

  // The same spell on a character in chain mail must lose, with no rule
  // anywhere saying "unless you are wearing armour".
  const inMail = {
    ...READY,
    inventory: {
      instances: [item('i-mail', 'srd:armor.chain-mail')],
      equipped: { armor: 'i-mail' }, attunedInstanceIds: []
    }
  }
  const mailCast = applyCommand(inMail, {
    type: 'castSpell', characterId: WIZ.id, spellId: 'srd:spell.mage-armor'
  }, content)
  const mailed = createResolution(mailCast.character, content).stat('armorClass')
  check('pipeline: chain mail beats mage armor by being the higher base',
    mailed.total === 16, mailed.total)
  check('pipeline: and mage armor is shown as considered but not applied',
    mailed.terms.some((t) => !t.applied && t.sourceName === 'Mage Armor' && t.reason),
    mailed.terms.filter((t) => !t.applied).map((t) => `${t.sourceName}: ${t.reason}`).join('; '))
}

// ---------------------------------------------------------------------------
// Concentration
// ---------------------------------------------------------------------------

{
  const first = applyCommand(READY, {
    type: 'castSpell', characterId: WIZ.id, spellId: 'srd:spell.detect-magic'
  }, content)
  check('concentration: casting one sets it', first.character.concentratingOn !== undefined)

  const second = applyCommand(first.character, {
    type: 'castSpell', characterId: WIZ.id,
    spellId: 'srd:spell.protection-from-energy', slotResourceId: 'wizard.slots.3'
  }, content)
  check('concentration: the second cast actually happened', second.rejected === undefined,
    second.rejected && second.rejected.reasons.join('; '))
  check('concentration: a second concentration spell breaks the first',
    second.events.some((e) => e.type === 'ConcentrationBroken'))
  check('concentration: and the first spell stops applying',
    !second.character.effectInstances.some((e) => e.definitionId === 'srd:spell.detect-magic'))
  check('concentration: only one is held at a time',
    second.character.effectInstances.filter((e) => e.definitionId.startsWith('srd:spell.')).length === 1)

  // Mage armor is not concentration, so it must survive.
  const withArmor = applyCommand(first.character, {
    type: 'castSpell', characterId: WIZ.id, spellId: 'srd:spell.mage-armor'
  }, content)
  check('concentration: a non-concentration spell does not break it',
    withArmor.character.concentratingOn === first.character.concentratingOn)
}

// ---------------------------------------------------------------------------
// The contract: a wizard renders through the same view as a fighter
// ---------------------------------------------------------------------------

{
  const view = playerViewOf(READY, content, { detail: 'inspect' })
  check('view: spellcasting is present for a caster', view.spellcasting !== undefined)
  check('view: the save DC arrives as a readout with a breakdown',
    view.spellcasting.saveDc.display === '14' && !!view.spellcasting.saveDc.breakdown)
  check('view: slots are listed ascending',
    view.spellcasting.slots.map((s) => s.level).join(',') === '1,2,3')

  const missile = view.spellcasting.spells.find((s) => s.label === 'Magic Missile')
  check('view: a spell explains itself without the UI knowing what a spell is',
    missile.levelLabel === '1st' && missile.rangeLabel === '120 ft'
    && missile.componentsLabel === 'V, S',
    `${missile.levelLabel} / ${missile.rangeLabel} / ${missile.componentsLabel}`)
  check('view: upcast options are the slots that could pay',
    missile.slotOptions.map((s) => s.level).join(',') === '1,2,3')

  const ritual = view.spellcasting.spells.find((s) => s.label === 'Detect Magic')
  check('view: a ritual is flagged', ritual.ritual === true)
  check('view: concentration reaches the duration label',
    ritual.durationLabel.startsWith('Concentration'), ritual.durationLabel)

  // The integration that matters: a spell is an action, so every existing
  // surface renders it with no spell-specific code.
  const castActions = view.actions.filter((a) => a.kind === 'cast')
  check('view: spells appear as ordinary actions', castActions.length > 0)
  check('view: with the cost the action list already knows how to show',
    castActions.every((a) => typeof a.cost.label === 'string'))
  check('view: and an unavailable one says why like any other action',
    view.actions.filter((a) => a.kind === 'cast' && !a.available)
      .every((a) => a.unavailableReasons.length > 0))

  // A fighter must not grow a spell tab.
  const fighterView = playerViewOf({
    ...READY, id: 'char:f', speciesId: 'srd:species.dwarf',
    subspeciesId: 'srd:species.dwarf.hill',
    classLevels: [{ classId: 'srd:class.fighter', level: 5 }],
    spellsPrepared: []
  }, content)
  check('view: a non-caster has no spellcasting at all',
    fighterView.spellcasting === undefined)
  check('view: and no cast actions',
    fighterView.actions.every((a) => a.kind !== 'cast'))
}

// ---------------------------------------------------------------------------
// Derived maximum vs stored current
// ---------------------------------------------------------------------------

{
  // Current hit points are stored; the maximum is derived. They can disagree,
  // and showing a total above the maximum would be showing an impossible
  // character.
  const overfull = wizard({ hitPointsCurrent: 999 })
  const view = playerViewOf(overfull, content)
  check('vitals: current hit points never exceed the derived maximum',
    view.vitals.hitPoints.current === view.vitals.hitPoints.max.value,
    `${view.vitals.hitPoints.current} / ${view.vitals.hitPoints.max.value}`)
  check('vitals: and the stored value is left alone for the authority to reconcile',
    overfull.hitPointsCurrent === 999)
}

check.report()
