// The player contract.
//
// The load-bearing claim: a fighter, a sorcerer and a paladin are rendered by
// identical code. Nothing in the view model knows what a sorcery point is, that
// Lay on Hands is a pool, or that Second Wind refreshes on a short rest — all
// three arrive as data with a display hint.

import { createResolution } from './bundle/engine.mjs'
import { loadContent } from './bundle/engine.mjs'
import {
  buildPlayerView, playerViewOf, applyCommand, transferItem
} from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()

// ---------------------------------------------------------------------------
// Three characters, built the same way
// ---------------------------------------------------------------------------

function base(overrides = {}) {
  return {
    id: 'char', campaignId: 'camp-1', name: 'Test', playerId: 'p1',
    speciesId: 'srd:species.dwarf', subspeciesId: 'srd:species.dwarf.hill',
    classLevels: [{ classId: 'srd:class.fighter', level: 5 }],
    abilityScoreBase: { str: 14, dex: 12, con: 13, int: 10, wis: 12, cha: 8 },
    buildChoices: [], hitPointsCurrent: 40, hitPointsTemp: 0,
    hitDiceSpent: {}, resourcesSpent: {}, conditions: [], effectInstances: [],
    exhaustionLevel: 0,
    inventory: { instances: [], equipped: {}, attunedInstanceIds: [] },
    deathSaves: { successes: 0, failures: 0 }, toggles: {},
    ...overrides
  }
}

const item = (instanceId, definitionId) =>
  ({ instanceId, definitionId, contentVersion: 1, identified: true })

const FIGHTER = base({
  id: 'char:fighter', name: 'Sir Aldren',
  buildChoices: [{ atLevel: 4, kind: 'feat', value: 'srd:feat.tough' }],
  toggles: { 'wearing-armor': true, 'fighter.style.defense': true },
  selections: { 'srd:class.fighter.proficiencies': { skills: ['athletics', 'perception'] } },
  inventory: {
    instances: [
      item('i-mail', 'srd:armor.chain-mail'),
      item('i-shield', 'srd:armor.shield'),
      item('i-sword', 'srd:weapon.longsword'),
      item('i-cloak', 'srd:item.cloak-of-protection'),
      item('i-helm', 'dm:item.helm-of-the-watchful'),
      item('i-potion', 'srd:item.potion-of-healing'),
      item('i-ring', 'srd:item.ring-of-protection')
    ],
    equipped: { armor: 'i-mail', shield: 'i-shield', mainHand: 'i-sword', cloak: 'i-cloak' },
    attunedInstanceIds: ['i-cloak']
  }
})

const SORCERER = base({
  id: 'char:sorcerer', name: 'Vessa',
  classLevels: [{ classId: 'srd:class.sorcerer', level: 5 }],
  abilityScoreBase: { str: 8, dex: 14, con: 12, int: 12, wis: 10, cha: 16 },
  inventory: {
    instances: [item('i-dagger', 'srd:weapon.dagger')],
    equipped: { mainHand: 'i-dagger' },
    attunedInstanceIds: []
  }
})

const PALADIN = base({
  id: 'char:paladin', name: 'Ser Bryn',
  classLevels: [{ classId: 'srd:class.paladin', level: 5 }],
  abilityScoreBase: { str: 16, dex: 10, con: 14, int: 8, wis: 10, cha: 14 },
  toggles: { 'wearing-armor': true },
  inventory: {
    instances: [item('i-plate', 'srd:armor.half-plate'), item('i-sword', 'srd:weapon.longsword')],
    equipped: { armor: 'i-plate', mainHand: 'i-sword' },
    attunedInstanceIds: []
  }
})

const view = (c, detail = 'inspect') => playerViewOf(c, content, { detail })

// ---------------------------------------------------------------------------
// 1. The contract is a plain serialisable snapshot
// ---------------------------------------------------------------------------

{
  const v = view(FIGHTER)
  const round = JSON.parse(JSON.stringify(v))
  check('contract: the view survives a JSON round trip',
    JSON.stringify(round) === JSON.stringify(v))
  check('contract: it contains no functions',
    JSON.stringify(v).length > 0 && !Object.values(v).some((x) => typeof x === 'function'))
}

// ---------------------------------------------------------------------------
// 2. Three classes, one renderer
// ---------------------------------------------------------------------------

{
  const views = [view(FIGHTER), view(SORCERER), view(PALADIN)]

  // The three used to share an identical top-level shape, and that was only
  // true because two of them had no magic: the sorcerer's spell panel was
  // withheld whenever its Spells Known selections were unanswered, and the
  // paladin had no spellcasting authored at all. Both are casters now, so the
  // honest contract is that everything *except* `spellcasting` is identical
  // and `spellcasting` appears exactly for the characters holding slots.
  const OPTIONAL = new Set(['spellcasting'])
  const shape = (v) => Object.keys(v).filter((k) => !OPTIONAL.has(k)).sort().join(',')
  check('classes: all three produce the same top-level shape',
    new Set(views.map(shape)).size === 1, views.map(shape).join(' || '))

  const casts = (v) => v.spellcasting !== undefined
  check('classes: the fighter has no spell panel', !casts(views[0]))
  check('classes: the sorcerer and paladin do, slots and DC included',
    casts(views[1]) && casts(views[2]),
    `${casts(views[1])}, ${casts(views[2])}`)
  check('classes: and a caster who knows no spells still sees a save DC',
    views[1].spellcasting.saveDc.value > 8 && views[1].spellcasting.slots.length > 0,
    JSON.stringify({ dc: views[1].spellcasting.saveDc.value, slots: views[1].spellcasting.slots.length }))

  for (const v of views) {
    check(`classes: ${v.meta.name} has vitals, abilities, skills and actions`,
      v.vitals.armorClass.value > 0 && v.abilities.length === 6 &&
      v.skills.length === 18 && v.actions.length > 0)
  }
}

// ---------------------------------------------------------------------------
// 3. Resources are data — the UI needs no class knowledge
// ---------------------------------------------------------------------------

{
  const f = view(FIGHTER).resources
  const s = view(SORCERER).resources
  const p = view(PALADIN).resources

  const byId = (list, id) => list.find((r) => r.id === id)

  const secondWind = byId(f, 'fighter.second-wind')
  check('resources: the fighter exposes Second Wind as uses',
    secondWind?.display === 'uses' && secondWind.maximum === 1)

  const points = byId(s, 'sorcerer.sorceryPoints')
  check('resources: the sorcerer exposes sorcery points as pips',
    points?.display === 'pips')
  check.eq('resources: sorcery points equal the sorcerer level', points?.maximum, 5)
  check('resources: the maximum explains where it came from',
    points?.breakdown?.lines.some((l) => l.note?.includes('sorcerer level')))

  const pool = byId(p, 'paladin.layOnHands')
  check('resources: the paladin exposes Lay on Hands as a pool', pool?.display === 'pool')
  check.eq('resources: the pool is five per level', pool?.maximum, 25)

  const sense = byId(p, 'paladin.divineSense')
  check.eq('resources: Divine Sense is 1 + CHA modifier', sense?.maximum, 3)

  // Spell slots group visually without the view knowing what a spell slot is.
  const slots = s.filter((r) => r.group === 'Spell Slots')
  check.eq('resources: spell slots arrive grouped and ordered', slots.length, 3)
  check('resources: they are ordered by level',
    slots[0].id.endsWith('.1') && slots[2].id.endsWith('.3'))

  // The proof: every field the UI needs is present for all three, with no
  // class-specific field anywhere.
  const fields = new Set()
  for (const r of [...f, ...s, ...p]) Object.keys(r).forEach((k) => fields.add(k))
  check('resources: every resource uses the same field set',
    [...f, ...s, ...p].every((r) =>
      typeof r.id === 'string' && typeof r.label === 'string' &&
      typeof r.current === 'number' && typeof r.maximum === 'number' &&
      typeof r.display === 'string' && typeof r.refresh.label === 'string'))
}

// ---------------------------------------------------------------------------
// 4. Progressive disclosure is a payload tier
// ---------------------------------------------------------------------------

{
  const summary = view(FIGHTER, 'summary')
  const inspect = view(FIGHTER, 'inspect')
  const full = view(FIGHTER, 'full')

  check('disclosure: summary carries no breakdowns',
    summary.vitals.armorClass.breakdown === undefined)
  check('disclosure: inspect carries the applied contributors',
    inspect.vitals.armorClass.breakdown.lines.every((l) => l.applied))
  check('disclosure: full carries the discarded ones too, with reasons',
    full.vitals.armorClass.breakdown.lines.some((l) => !l.applied && l.reason))

  const sizes = [summary, inspect, full].map((v) => JSON.stringify(v).length)
  check('disclosure: payload grows with the tier',
    sizes[0] < sizes[1] && sizes[1] < sizes[2],
    sizes.join(' < '))

  check.eq('disclosure: the total is identical at every tier',
    summary.vitals.armorClass.value, full.vitals.armorClass.value)
}

// ---------------------------------------------------------------------------
// 5. Readouts are presentation-ready without the UI knowing the rules
// ---------------------------------------------------------------------------

{
  const v = view(FIGHTER)
  check.eq('readout: AC renders bare', v.vitals.armorClass.display, '20')
  check.eq('readout: initiative renders signed', v.vitals.initiative.display, '+1')
  check.eq('readout: speed renders with units', v.vitals.speed.display, '25 ft')
  const str = v.abilities.find((a) => a.ability === 'str')
  check.eq('readout: an ability score is bare', str.score.display, '14')
  check.eq('readout: an ability modifier is signed', str.modifier.display, '+2')
}

// ---------------------------------------------------------------------------
// 6. Actions — one list, faceted, with availability reasons
// ---------------------------------------------------------------------------

{
  const v = view(FIGHTER)
  const attack = v.actions.find((a) => a.kind === 'attack')
  check('actions: the equipped weapon produces an attack', !!attack)
  check.eq('actions: it previews the attack bonus', attack.preview.attackBonusDisplay, '+5')
  check('actions: it previews the damage', attack.preview.damageLabel.startsWith('1d8'))
  check('actions: it carries the command to send',
    attack.command.type === 'makeAttack' && attack.command.weaponInstanceId === 'i-sword')

  const kinds = new Set(v.actions.map((a) => a.kind))
  check('actions: one list carries several facets',
    kinds.has('attack') && kinds.has('ability') && kinds.has('item') && kinds.has('basic'))

  const potion = v.actions.find((a) => a.id === 'use:i-potion')
  check('actions: a consumable appears as an action', !!potion)
}

{
  // A sorcerer's abilities appear through the identical mechanism.
  const v = view(SORCERER)
  const createSlot = v.actions.find((a) => a.id === 'sorcerer.create-slot')
  check('actions: a class ability appears with its resource cost',
    createSlot?.costs[0]?.resourceId === 'sorcerer.sorceryPoints')
  check.eq('actions: the cost is labelled for the UI',
    createSlot.costs[0].label, '2 Sorcery Points')
  check('actions: it is available when the resource allows', createSlot.available)
}

{
  // Spend the resource down and the action explains itself.
  const drained = { ...SORCERER, resourcesSpent: { 'sorcerer.sorceryPoints': 5 } }
  const createSlot = view(drained).actions.find((a) => a.id === 'sorcerer.create-slot')
  check('actions: an unaffordable action is unavailable', createSlot.available === false)
  // The reason names the resource the way a player knows it. An id in a
  // player-facing string is a leak, so asserting the name is the point.
  check('actions: and says why, naming the resource not its id',
    createSlot.unavailableReasons.some((r) => r.includes('Sorcery Points')),
    createSlot.unavailableReasons.join('; '))
  check('actions: and no reason leaks a content id',
    createSlot.unavailableReasons.every((r) => !r.includes('sorceryPoints')),
    createSlot.unavailableReasons.join('; '))
}

{
  // A condition disables every action of a cost at once, through the
  // capability system — no action knows what "stunned" means.
  const stunned = {
    ...FIGHTER,
    conditions: [{
      conditionId: 'srd:condition.stunned', instanceId: 'ci-1',
      sourceId: 'test', appliedAtSeconds: 0
    }]
  }
  const v = view(stunned)
  const actions = v.actions.filter((a) => a.cost.type === 'action')
  check('actions: being stunned disables every action', actions.every((a) => !a.available))
  check('actions: each says why, naming the condition',
    actions.every((a) => a.unavailableReasons.some((r) => r.includes('Incapacitated'))),
    actions[0]?.unavailableReasons.join('; '))

  const effect = v.effects.find((e) => e.label === 'Stunned')
  check('effects: the condition is listed', !!effect)
  check('effects: with what it is doing, in words', effect.effects.length > 0)
}

// ---------------------------------------------------------------------------
// 7. Equipment and inventory
// ---------------------------------------------------------------------------

{
  const v = view(FIGHTER)
  check.eq('inventory: every instance appears', v.inventory.length, 7)
  const groups = new Set(v.inventory.map((i) => i.group))
  check('inventory: items are grouped by what you do with them',
    groups.has('equipped') && groups.has('carried') && groups.has('consumables'))

  const cloak = v.inventory.find((i) => i.itemId === 'srd:item.cloak-of-protection')
  check('inventory: an item explains itself from its own modifiers',
    cloak.effectSummary.some((s) => s.includes('AC')))
  check('inventory: attunement state is exposed', cloak.attuned === true)

  const helm = v.inventory.find((i) => i.provenance === 'dm')
  check('inventory: DM content sits alongside SRD content', !!helm)
  check('inventory: and explains itself the same way',
    helm.effectSummary.some((s) => s.includes('AC')))

  const slots = v.equipment.map((s) => s.slot)
  check('equipment: filled slots are listed',
    slots.includes('armor') && slots.includes('mainHand'))
  const armorSlot = v.equipment.find((s) => s.slot === 'armor')
  check('equipment: a slot says what its item contributes',
    armorSlot.effectSummary.length > 0)
}

// ---------------------------------------------------------------------------
// 8. Commands change state; the view follows
// ---------------------------------------------------------------------------

{
  const before = view(FIGHTER).vitals.armorClass.value
  const equipped = applyCommand(FIGHTER,
    { type: 'equipItem', characterId: 'char:fighter', instanceId: 'i-helm', slot: 'head' },
    content)
  check('command: equipping succeeds', !equipped.rejected)
  check('command: it emits a domain event',
    equipped.events.some((e) => e.type === 'ItemEquipped'))
  check.eq('command: the DM helmet raises AC by 1',
    view(equipped.character).vitals.armorClass.value - before, 1)

  const unequipped = applyCommand(equipped.character,
    { type: 'unequipItem', characterId: 'char:fighter', slot: 'head' }, content)
  check.eq('command: unequipping reverts it exactly',
    view(unequipped.character).vitals.armorClass.value, before)
}

{
  // The reducer never mutates its input.
  const snapshot = JSON.stringify(FIGHTER)
  applyCommand(FIGHTER,
    { type: 'equipItem', characterId: 'char:fighter', instanceId: 'i-helm', slot: 'head' },
    content)
  check('command: the reducer is pure', JSON.stringify(FIGHTER) === snapshot)
}

{
  const bad = applyCommand(FIGHTER,
    { type: 'equipItem', characterId: 'char:fighter', instanceId: 'i-potion', slot: 'head' },
    content)
  check('command: an illegal equip is rejected', !!bad.rejected)
  check('command: rejection carries a readable reason',
    bad.rejected.reasons[0].includes('cannot be equipped'))
  check('command: rejection changes nothing', bad.character === FIGHTER)
}

{
  // Attunement is a three-slot resource, enforced by the reducer.
  let c = FIGHTER
  for (const [instanceId, defId] of [['i-ring', 'srd:item.ring-of-protection']]) {
    const r = applyCommand(c, { type: 'attuneItem', characterId: c.id, instanceId }, content)
    check(`command: attuning to ${defId} succeeds`, !r.rejected)
    c = r.character
  }
  const dupe = applyCommand(c,
    { type: 'attuneItem', characterId: c.id, instanceId: 'i-cloak' }, content)
  check('command: attuning to an already-attuned item is rejected', !!dupe.rejected)
}

// ---------------------------------------------------------------------------
// 9. Resource spending and restoration
// ---------------------------------------------------------------------------

{
  const spent = applyCommand(PALADIN,
    { type: 'spendResource', characterId: 'char:paladin', resourceId: 'paladin.layOnHands', amount: 10 },
    content)
  check('resource: spending succeeds', !spent.rejected)
  const pool = view(spent.character).resources.find((r) => r.id === 'paladin.layOnHands')
  check.eq('resource: the pool drops', pool.current, 15)
  check.eq('resource: and records what was spent', pool.spent, 10)

  const over = applyCommand(spent.character,
    { type: 'spendResource', characterId: 'char:paladin', resourceId: 'paladin.layOnHands', amount: 100 },
    content)
  check('resource: overspending is rejected', !!over.rejected)
  check('resource: with the numbers in the reason',
    over.rejected.reasons[0].includes('15 remaining'))

  const rested = applyCommand(spent.character,
    { type: 'longRest', characterId: 'char:paladin' }, content)
  const restored = view(rested.character).resources.find((r) => r.id === 'paladin.layOnHands')
  check.eq('resource: a long rest restores the pool', restored.current, 25)
  check('resource: the rest emits an event',
    rested.events.some((e) => e.type === 'LongRestTaken'))
}

{
  // Spending the last use produces a dramatic beat the theatre can react to.
  const spent = applyCommand(FIGHTER,
    { type: 'spendResource', characterId: 'char:fighter', resourceId: 'fighter.second-wind', amount: 1 },
    content)
  check('resource: spending the last use emits LastUseSpent',
    spent.events.some((e) => e.type === 'LastUseSpent'))

  const short = applyCommand(spent.character, { type: 'shortRest', characterId: 'char:fighter' }, content)
  const sw = view(short.character).resources.find((r) => r.id === 'fighter.second-wind')
  check.eq('resource: a short rest brings Second Wind back', sw.current, 1)
}

// ---------------------------------------------------------------------------
// 10. Conditions through commands
// ---------------------------------------------------------------------------

{
  const applied = applyCommand(FIGHTER, {
    type: 'applyCondition', characterId: 'char:fighter',
    conditionId: 'srd:condition.poisoned', sourceId: 'trap'
  }, content)
  check('condition: applying succeeds', !applied.rejected)
  const v = view(applied.character)
  check('condition: it appears in effects',
    v.effects.some((e) => e.label === 'Poisoned'))

  // Two instances, one condition.
  const twice = applyCommand(applied.character, {
    type: 'applyCondition', characterId: 'char:fighter',
    conditionId: 'srd:condition.poisoned', sourceId: 'another trap'
  }, content)
  const poisoned = view(twice.character).effects.find((e) => e.label === 'Poisoned')
  check.eq('condition: two instances are reported as one effect', poisoned.instanceCount, 2)

  const removedOne = applyCommand(twice.character, {
    type: 'removeCondition', characterId: 'char:fighter',
    instanceId: twice.character.conditions[0].instanceId
  }, content)
  check('condition: removing one leaves the character affected',
    removedOne.events[0].payload.stillAffected === true)
  check('condition: and it is still listed',
    view(removedOne.character).effects.some((e) => e.label === 'Poisoned'))
}

// ---------------------------------------------------------------------------
// 11. Inventory transfer between two characters
// ---------------------------------------------------------------------------

{
  const result = transferItem(FIGHTER, PALADIN, 'i-potion')
  check('transfer: it succeeds', !result.rejected)
  check('transfer: the giver loses it',
    !result.from.inventory.instances.some((i) => i.instanceId === 'i-potion'))
  check('transfer: the receiver gains it',
    result.to.inventory.instances.some((i) => i.instanceId === 'i-potion'))
  check('transfer: it emits one event',
    result.events.length === 1 && result.events[0].type === 'ItemTransferred')
  check('transfer: the potion appears in the receiver\'s view',
    view(result.to).inventory.some((i) => i.instanceId === 'i-potion'))

  const equippedTransfer = transferItem(FIGHTER, PALADIN, 'i-sword')
  check('transfer: an equipped item cannot be handed over', !!equippedTransfer.rejected)
}

// ---------------------------------------------------------------------------
// 12. Notices and progression
// ---------------------------------------------------------------------------

{
  const v = view(FIGHTER)
  const stonecunning = v.notices.find((n) => n.toggleId === 'dwarf.stonecunning')
  check('notices: an unautomatable rule is surfaced as a toggle', !!stonecunning)
  check('notices: with its current value', stonecunning.toggleValue === false)

  const toggled = applyCommand(FIGHTER, {
    type: 'setToggle', characterId: 'char:fighter', toggleId: 'dwarf.stonecunning', value: true
  }, content)
  const after = view(toggled.character).skills.find((s) => s.id === 'history')
  check.eq('notices: flipping the toggle changes the skill', after.total.value, 6)
}

{
  const v = view(PALADIN)
  check.eq('progression: level is reported', v.progression.level, 5)
  check.eq('progression: the class is named', v.progression.classes[0].label, 'Paladin')
  check.eq('progression: the species is named', v.progression.species.label, 'Dwarf')
  check.eq('progression: hit dice match the class die', v.progression.hitDice[0].size, 10)
  check.eq('progression: proficiency bonus renders signed',
    v.progression.proficiencyBonus.display, '+3')
}

{
  // A feat with an unanswered selection shows up as a pending choice rather
  // than silently doing nothing.
  const undecided = { ...FIGHTER, buildChoices: [{ atLevel: 4, kind: 'feat', value: 'srd:feat.resilient' }] }
  const pending = view(undecided).progression.pendingChoices
  check('progression: an unanswered selection is surfaced',
    pending.some((c) => c.prompt.includes('ability score')))
}

// ---------------------------------------------------------------------------
// 13. Skills expose their roll state and why
// ---------------------------------------------------------------------------

{
  const v = view(FIGHTER)
  const stealth = v.skills.find((s) => s.id === 'stealth')
  check.eq('skills: chain mail shows as disadvantage', stealth.rollState, 'disadvantage')
  check('skills: with the source named', stealth.rollStateReasons.length > 0)

  const athletics = v.skills.find((s) => s.id === 'athletics')
  check.eq('skills: proficiency state is exposed', athletics.proficiency, 'proficient')
  check.eq('skills: the total renders signed', athletics.total.display, '+5')
  check.eq('skills: passive scores are present', athletics.passive.value, 15)
}

// ---------------------------------------------------------------------------
// 14. The load-bearing claim
// ---------------------------------------------------------------------------

{
  // Render all three through the identical path and assert that no field in the
  // contract is class-specific. If a class ever needs a bespoke field, this is
  // the test that notices.
  const views = [FIGHTER, SORCERER, PALADIN].map((c) => buildPlayerView(
    createResolution(c, content), content, { detail: 'inspect' }))

  const keysOf = (v) => JSON.stringify(Object.keys(v).sort())
  // Same correction as above: `spellcasting` is optional by design, and two
  // of these three were only matching because their magic was missing.
  const withoutCasting = (v) =>
    Object.keys(v).filter((k) => k !== 'spellcasting').sort().join(',')
  check('unification: identical top-level contract for all three classes',
    new Set([FIGHTER, SORCERER, PALADIN].map((c) => withoutCasting(view(c)))).size === 1)

  // Optional presentation hints (group, order) vary; the required contract
  // does not. That is the field set the UI actually depends on.
  const REQUIRED = ['id', 'label', 'current', 'maximum', 'spent', 'display', 'refresh', 'sourceId', 'sourceLabel']
  const allResources = views.flatMap((v) => v.resources)
  check('unification: every resource across every class carries the required contract',
    allResources.every((r) => REQUIRED.every((k) => r[k] !== undefined)))
  check('unification: and adds nothing beyond the declared optional hints',
    allResources.every((r) => Object.keys(r).every(
      (k) => REQUIRED.includes(k) || ['group', 'order', 'breakdown'].includes(k))))

  const actionKeys = views.flatMap((v) => v.actions.map((a) => Object.keys(a).sort().join(',')))
  check('unification: no action carries a class-specific field',
    actionKeys.every((k) => !k.includes('sorcery') && !k.includes('layOnHands')))

  const serialised = JSON.stringify(views)
  check('unification: the contract mentions no class in a structural position',
    !/"(sorcerer|paladin|fighter)(Points|Pool|Uses)"/.test(serialised))
}

// ---------------------------------------------------------------------------
// Using an ability
//
// The loop the player actually performs: spend, be told why you cannot spend
// again, rest, spend again. Nothing here names Second Wind's mechanics — the
// action declares its own costs and the reducer honours them.
// ---------------------------------------------------------------------------

{
  const view0 = playerViewOf(FIGHTER, content)
  const secondWind = view0.actions.find((a) => a.label === 'Second Wind')
  check('useAbility: the action is present and available', !!secondWind && secondWind.available)

  const used = applyCommand(FIGHTER, secondWind.command, content)
  check('useAbility: it is not rejected', used.rejected === undefined,
    used.rejected && used.rejected.reasons.join('; '))
  check('useAbility: it emits AbilityUsed',
    used.events.some((e) => e.type === 'AbilityUsed'))
  check('useAbility: and spends the declared resource',
    used.events.some((e) => e.type === 'ResourceSpent' && e.payload.remaining === 0))
  check('useAbility: the last use is announced for the theatre',
    used.events.some((e) => e.type === 'LastUseSpent'))

  const view1 = playerViewOf(used.character, content)
  const again = view1.actions.find((a) => a.label === 'Second Wind')
  check('useAbility: the action is now unavailable', again.available === false)
  check('useAbility: and says so by name, not by id',
    again.unavailableReasons.some((r) => r.includes('Second Wind'))
    && again.unavailableReasons.every((r) => !r.includes('fighter.second-wind')),
    again.unavailableReasons.join('; '))

  // The reason a command is refused is the reason the button was disabled.
  const refused = applyCommand(used.character, secondWind.command, content)
  check('useAbility: a second use is rejected with the same reasons',
    refused.rejected !== undefined
    && refused.rejected.reasons.join('|') === again.unavailableReasons.join('|'),
    refused.rejected && refused.rejected.reasons.join('; '))
  check('useAbility: and the character is unchanged',
    refused.character === used.character)

  const rested = applyCommand(used.character, { type: 'shortRest', characterId: FIGHTER.id }, content)
  const view2 = playerViewOf(rested.character, content)
  check('useAbility: a short rest makes it available again',
    view2.actions.find((a) => a.label === 'Second Wind').available === true)

  // Action Surge declares a resource *and* an action, like every other feature.
  check('useAbility: every resource with no way to spend it is a content gap',
    view0.resources.every((r) =>
      view0.actions.some((a) => a.costs.some((c) => c.resourceId === r.id))),
    view0.resources.filter((r) =>
      !view0.actions.some((a) => a.costs.some((c) => c.resourceId === r.id)))
      .map((r) => r.label).join(', '))
}

// ---------------------------------------------------------------------------
// Explaining the character
//
// Effects are what is happening to you *and* what is permanently true of you.
// The important claim is the second one: an explanation must never assert an
// effect that the resolver is not applying.
// ---------------------------------------------------------------------------

{
  const view = playerViewOf(FIGHTER, content)
  const passive = view.effects.filter((e) => e.kind === 'passive')
  check('effects: permanent traits are listed', passive.length > 0)
  check('effects: the species trait is among them',
    passive.some((e) => e.label === 'Dwarf'))
  check('effects: the feat is among them',
    passive.some((e) => e.label === 'Tough'))

  // Chain mail suppresses the baseline's Dexterity term. Saying "+1 AC" here
  // would make the explanation disagree with the AC it explains.
  const baseline = passive.find((e) => e.label === 'Baseline')
  const dexLine = baseline.effects.find((l) => l.includes('Dexterity'))
  check('effects: a suppressed term is marked, not silently listed',
    dexLine !== undefined && dexLine.includes('not applying'), dexLine)

  // The sum of what is claimed must equal what is resolved. Breakdowns only
  // ship above the glance tier, so this is the inspect view.
  const inspect = playerViewOf(FIGHTER, content, { detail: 'inspect' })
  const acLines = inspect.vitals.armorClass.breakdown.lines.filter((l) => l.applied)
  check('effects: the AC breakdown sums to the AC',
    acLines.reduce((n, l) => n + (l.amount ?? 0), 0) === inspect.vitals.armorClass.value,
    `${acLines.map((l) => `${l.source} ${l.amount}`).join(' + ')} != ${inspect.vitals.armorClass.value}`)

  // Proficiencies are effects. A source that grants only proficiencies must
  // still be able to say what it does.
  const fighterProfs = passive.find((e) => e.label.includes('Fighter'))
  check('effects: granted proficiencies are described',
    fighterProfs.effects.some((l) => l.startsWith('proficient in')))
  check('effects: and no description leaks a content id',
    passive.every((e) => e.effects.every((l) => !l.includes('srd:') && !l.includes('dm:'))),
    passive.flatMap((e) => e.effects).filter((l) => /(srd|dm):/.test(l)).join('; '))
}

// ---------------------------------------------------------------------------
// Nor a stat path — the other half of "never show the player a database key"
// ---------------------------------------------------------------------------

{
  // Every class at a level where its resources are live. A raw path reaching a
  // description ("+3 resource.barbarianRages.max") is the app talking to itself
  // in front of the player, and it survived a long time because no assertion
  // looked for it.
  const RAW_PATH = /resource\.|feature\.[a-z]|damageReduction\.|movementCost\.|\.max\b|\.saveDc\b/

  const subjects = [
    ['barbarian', 'srd:class.barbarian', 5, undefined],
    ['monk', 'srd:class.monk', 10, 'srd:subclass.open-hand'],
    ['sorcerer', 'srd:class.sorcerer', 5, undefined],
    ['bard', 'srd:class.bard', 5, undefined],
    ['wizard', 'srd:class.wizard', 5, undefined],
    ['cleric', 'srd:class.cleric', 5, undefined],
    ['paladin', 'srd:class.paladin', 5, undefined],
    ['rogue', 'srd:class.rogue', 5, undefined],
    ['warlock', 'srd:class.warlock', 5, undefined],
    ['druid', 'srd:class.druid', 5, undefined],
    ['fighter', 'srd:class.fighter', 5, undefined]
  ]

  for (const [label, classId, level, subclassId] of subjects) {
    const view = playerViewOf(base({
      speciesId: 'srd:species.human', subspeciesId: undefined,
      classLevels: [{ classId, level, ...(subclassId ? { subclassId } : {}) }]
    }), content, { detail: 'inspect' })

    const leaked = view.effects
      .flatMap((e) => e.effects.map((l) => `${e.label}: ${l}`))
      .filter((l) => RAW_PATH.test(l))

    check(`effects: ${label} descriptions name things, not stat paths`,
      leaked.length === 0, leaked.join(' | '))
  }

  // And the positive case: the name actually used is the one the resource
  // definition carries, not a guess derived from its id.
  const monk = playerViewOf(base({
    speciesId: 'srd:species.human', subspeciesId: undefined,
    classLevels: [{ classId: 'srd:class.monk', level: 10 }]
  }), content, { detail: 'inspect' })
  const ki = monk.effects.flatMap((e) => e.effects).find((l) => l.includes('Ki Points'))
  check('effects: a resource is named as its definition names it', ki !== undefined,
    JSON.stringify(monk.effects.flatMap((e) => e.effects).filter((l) => /max/.test(l))))

  // A modifier contributing nothing is not listed at all: a level-5 caster
  // declares all nine slot tiers, and six of them add 0.
  const sorcerer = playerViewOf(base({
    speciesId: 'srd:species.human', subspeciesId: undefined,
    classLevels: [{ classId: 'srd:class.sorcerer', level: 5 }]
  }), content, { detail: 'inspect' })
  const zeroes = sorcerer.effects.flatMap((e) => e.effects).filter((l) => l.startsWith('+0 '))
  check('effects: a modifier adding zero is not described', zeroes.length === 0,
    zeroes.join(' | '))
}

// ---------------------------------------------------------------------------
// Defenses — only shown where a character actually has one
// ---------------------------------------------------------------------------

{
  // FIGHTER is itself a dwarf, so it is not the "nothing unusual" baseline —
  // that has to be a species with no resistance modifiers of its own.
  const human = base({ speciesId: 'srd:species.human', subspeciesId: undefined })
  const plain = playerViewOf(human, content, { detail: 'inspect' })
  check.eq('defenses: a character with nothing unusual shows nothing',
    plain.defenses.length, 0, JSON.stringify(plain.defenses))

  // The dwarf's own Dwarven Resilience: poison resistance, unconditional.
  const dwarf = base({ speciesId: 'srd:species.dwarf', subspeciesId: 'srd:species.dwarf.hill' })
  const view = playerViewOf(dwarf, content, { detail: 'inspect' })
  const poison = view.defenses.find((d) => d.type === 'poison')
  check('defenses: a dwarf resists poison', poison?.state === 'resistant', JSON.stringify(poison))

  // Every other damage type stays off the list — this is not thirteen rows of
  // "none", it is one row that means something.
  check.eq('defenses: and nothing else is listed for a plain dwarf',
    view.defenses.length, 1, JSON.stringify(view.defenses))

  // What resistancesOf resolves is what the sheet shows — the same function
  // applyAttackOutcome calls to decide what a real hit does, so the sheet
  // cannot claim a resistance combat would not honour.
  const resolution = createResolution(dwarf, content)
  check.eq('defenses: matches what an actual hit would resolve',
    view.defenses.find((d) => d.type === 'poison')?.state,
    resolutionResistanceState(resolution, 'poison'))
}

function resolutionResistanceState(resolution, damageType) {
  const value = resolution.stat(`resistance.${damageType}`).total
  return value >= 2 ? 'immune' : value === 1 ? 'resistant' : value < 0 ? 'vulnerable' : 'none'
}

check.report()
