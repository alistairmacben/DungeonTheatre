// One real playable session.
//
// This suite is not about rules correctness — the other suites cover that. It
// walks the loop a player actually performs, on four characters that stress
// different mechanics, and asserts the things that only break when you try to
// *use* the product: that the roll a UI is told to make is the roll the engine
// accepts, that a DM can affect a character without an enemy existing, and that
// one contract renders four archetypes with nothing class-shaped in it.

import { applyCommand, loadContent, playerViewOf } from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()

const item = (instanceId, definitionId, extra = {}) =>
  ({ instanceId, definitionId, contentVersion: 1, identified: true, ...extra })

const base = (o) => ({
  campaignId: 'camp-1', playerId: 'p', buildChoices: [],
  hitPointsTemp: 0, hitDiceSpent: {}, resourcesSpent: {}, conditions: [],
  effectInstances: [], exhaustionLevel: 0,
  deathSaves: { successes: 0, failures: 0 }, toggles: {},
  ...o
})

const FIGHTER = base({
  id: 'c:fighter', name: 'Sir Aldren',
  speciesId: 'srd:species.dwarf', subspeciesId: 'srd:species.dwarf.hill',
  classLevels: [{ classId: 'srd:class.fighter', level: 5 }],
  abilityScoreBase: { str: 16, dex: 12, con: 13, int: 10, wis: 12, cha: 8 },
  hitPointsCurrent: 47,
  toggles: { 'wearing-armor': true, 'fighter.style.defense': true },
  selections: { 'srd:class.fighter.proficiencies': { skills: ['athletics', 'perception'] } },
  inventory: {
    instances: [
      item('i-mail', 'srd:armor.chain-mail'), item('i-shield', 'srd:armor.shield'),
      item('i-sword', 'srd:weapon.longsword'), item('i-bow', 'srd:weapon.longbow')
    ],
    equipped: { armor: 'i-mail', shield: 'i-shield', mainHand: 'i-sword' },
    attunedInstanceIds: []
  }
})

const WIZARD = base({
  id: 'c:wizard', name: 'Ilyana Vess',
  speciesId: 'srd:species.elf', subspeciesId: 'srd:species.elf.high',
  classLevels: [{ classId: 'srd:class.wizard', level: 5 }],
  abilityScoreBase: { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 },
  hitPointsCurrent: 24,
  inventory: {
    instances: [item('w-dagger', 'srd:weapon.dagger')],
    equipped: { mainHand: 'w-dagger' }, attunedInstanceIds: []
  },
  spellsPrepared: ['srd:spell.magic-missile', 'srd:spell.mage-armor']
})

const ROGUE = base({
  id: 'c:rogue', name: 'Pip Underbough',
  speciesId: 'srd:species.halfling', subspeciesId: 'srd:species.halfling.lightfoot',
  classLevels: [{ classId: 'srd:class.rogue', level: 5 }],
  abilityScoreBase: { str: 10, dex: 16, con: 14, int: 13, wis: 12, cha: 14 },
  hitPointsCurrent: 33,
  inventory: {
    instances: [item('r-short', 'srd:weapon.shortsword'), item('r-leather', 'srd:armor.leather')],
    equipped: { mainHand: 'r-short', armor: 'r-leather' }, attunedInstanceIds: []
  }
})

const CLERIC = base({
  id: 'c:cleric', name: 'Brother Aldwin',
  speciesId: 'srd:species.human',
  classLevels: [{
    classId: 'srd:class.cleric', level: 5, subclassId: 'srd:subclass.life-domain'
  }],
  // Life Domain is a subclass now, not something every cleric is handed, and
  // cantrips are chosen from the Cantrips Known column.
  selections: {
    'srd:class.cleric.spellcasting': {
      cantrips: ['srd:spell.sacred-flame', 'srd:spell.guidance', 'srd:spell.light']
    }
  },
  abilityScoreBase: { str: 14, dex: 10, con: 14, int: 10, wis: 16, cha: 12 },
  hitPointsCurrent: 38, toggles: { 'wearing-armor': true },
  inventory: {
    instances: [
      item('c-mace', 'srd:weapon.mace'), item('c-mail', 'srd:armor.chain-mail'),
      item('c-shield', 'srd:armor.shield')
    ],
    equipped: { mainHand: 'c-mace', armor: 'c-mail', shield: 'c-shield' },
    attunedInstanceIds: []
  },
  spellsPrepared: ['srd:spell.detect-magic']
})

const PARTY = [FIGHTER, WIZARD, ROGUE, CLERIC]

// ---------------------------------------------------------------------------
// One contract, four archetypes
// ---------------------------------------------------------------------------

{
  const views = PARTY.map((c) => playerViewOf(c, content, { detail: 'inspect' }))

  check('party: every character produces a view',
    views.every((v) => v.vitals && v.abilities.length === 6 && v.skills.length === 18))
  check('party: every character has something to do',
    views.every((v) => v.actions.some((a) => a.available)),
    views.map((v, i) => `${PARTY[i].name}: ${v.actions.filter((a) => a.available).length}`).join(', '))

  // The differences that matter must actually differ, or the slice proves
  // nothing about the architecture adapting.
  const casters = views.filter((v) => v.spellcasting)
  check('party: exactly the two casters have spellcasting', casters.length === 2,
    views.filter((v) => v.spellcasting).map((v) => v.meta.name).join(', '))

  const rogueView = views[2]
  check('party: expertise doubles the proficiency bonus',
    rogueView.skills.find((s) => s.id === 'stealth').total.value === 10,
    rogueView.skills.find((s) => s.id === 'stealth').total.value)
  check('party: and is reported as expertise, not proficiency',
    rogueView.skills.find((s) => s.id === 'stealth').proficiency === 'expertise')
  check('party: a merely proficient skill is not doubled',
    rogueView.skills.find((s) => s.id === 'acrobatics').total.value === 7,
    rogueView.skills.find((s) => s.id === 'acrobatics').total.value)

  check('party: the rogue is proficient with her own shortsword',
    rogueView.actions.find((a) => a.kind === 'attack').preview.attackBonusDisplay === '+7',
    rogueView.actions.find((a) => a.kind === 'attack').preview.attackBonusDisplay)

  const bonusActions = rogueView.actions.filter((a) => a.cost.type === 'bonusAction')
  check('party: the rogue has bonus actions that cost no resource',
    bonusActions.length >= 3 && bonusActions.every((a) => a.costs.length === 0),
    bonusActions.map((a) => a.label).join(', '))

  const clericView = views[3]
  check('party: the cleric prepares from a whole list, not a book',
    clericView.spellcasting.spells.length > 3)
  check('party: domain spells are always available without preparing',
    clericView.spellcasting.spells.find((s) => s.label === 'Cure Wounds').alwaysAvailable === true)
  check('party: a short-rest resource is present alongside spell slots',
    clericView.resources.some((r) => r.id === 'cleric.channel-divinity')
    && clericView.resources.some((r) => r.id === 'cleric.slots.1'))

  // Nothing class-shaped may appear in a structural position.
  const serialised = JSON.stringify(views)
  check('party: no class name appears as a field name',
    !/"(fighter|wizard|rogue|cleric)[A-Z]/.test(serialised))
}

// ---------------------------------------------------------------------------
// The player loop: choose, inspect, roll, resolve
// ---------------------------------------------------------------------------

{
  const view = playerViewOf(FIGHTER, content, { detail: 'inspect' })

  // 3. See HP, AC and useful actions.
  check('loop: the HUD essentials are present',
    view.vitals.hitPoints.max.value === 49 && view.vitals.armorClass.value === 19,
    `${view.vitals.hitPoints.max.value} hp / ${view.vitals.armorClass.value} ac`)

  // 4-5. Choose an action, and open it for more.
  const attack = view.actions.find((a) => a.kind === 'attack')
  check('loop: an attack is offered', attack !== undefined)
  check('loop: with a preview a new player can read',
    attack.preview.attackBonusDisplay === '+6' && attack.preview.damageLabel.startsWith('1d8'),
    `${attack.preview.attackBonusDisplay} ${attack.preview.damageLabel}`)
  check('loop: and a breakdown a veteran can audit',
    attack.breakdown.lines.length > 0)

  // 6. Roll it. The engine told the caller how many dice; anything else is
  //    refused, which is the check the server will need.
  check('loop: the action publishes a roll spec', attack.roll !== undefined)
  check('loop: one die when there is no advantage', attack.roll.diceCount === 1)

  const rolled = applyCommand(FIGHTER, { ...attack.roll.command, faces: [17] }, content)
  check('loop: the roll is accepted', rolled.rejected === undefined,
    rolled.rejected && rolled.rejected.reasons.join('; '))

  // 7. See the result clearly.
  const made = rolled.events.find((e) => e.type === 'RollMade')
  check('loop: a RollMade event carries the whole result', made !== undefined)
  check('loop: total is the die plus the modifier', made.payload.total === 23, made.payload.total)
  check('loop: the natural die is reported separately for the crit rule',
    made.payload.natural === 17)
  check('loop: and the breakdown travels with it',
    made.payload.terms.length > 1)

  // A roll is an observation: in a theatre-of-the-mind game the DM applies the
  // consequences, so nothing about the character may have changed.
  check('loop: rolling changes nothing about the character',
    rolled.character === FIGHTER)

  const cheated = applyCommand(FIGHTER, { ...attack.roll.command, faces: [20, 20] }, content)
  check('loop: claiming advantage you do not have is refused',
    cheated.rejected !== undefined, 'accepted two dice')
  const impossible = applyCommand(FIGHTER, { ...attack.roll.command, faces: [21] }, content)
  check('loop: a face a d20 cannot show is refused', impossible.rejected !== undefined)

  // A natural 1 and a natural 20 must be called out.
  const crit = applyCommand(FIGHTER, { ...attack.roll.command, faces: [20] }, content)
  check('loop: a natural 20 is flagged critical',
    crit.events.find((e) => e.type === 'RollMade').payload.critical === true)
}

// ---------------------------------------------------------------------------
// Rolling skills and saves, which is most of what a session actually is
// ---------------------------------------------------------------------------

{
  const view = playerViewOf(ROGUE, content, { detail: 'inspect' })

  const stealth = view.skills.find((s) => s.id === 'stealth')
  const rolled = applyCommand(ROGUE, { ...stealth.roll.command, faces: [11] }, content)
  check('skill: a skill roll lands', rolled.rejected === undefined)
  check('skill: totalling die plus expertise',
    rolled.events[0].payload.total === 21, rolled.events[0].payload.total)
  check('skill: and naming itself the way the button did',
    rolled.events[0].payload.label === stealth.roll.label, rolled.events[0].payload.label)

  const dex = view.abilities.find((a) => a.ability === 'dex')
  const save = applyCommand(ROGUE, { ...dex.saveRoll.command, faces: [8] }, content)
  check('save: a saving throw lands', save.rejected === undefined)
  check('save: proficient saves include the bonus',
    save.events[0].payload.total === 15, save.events[0].payload.total)

  // Chain mail gives the fighter disadvantage on Stealth, which must change the
  // number of dice the UI is told to roll — not just a warning label.
  const heavy = playerViewOf(FIGHTER, content, { detail: 'inspect' })
  const heavyStealth = heavy.skills.find((s) => s.id === 'stealth')
  check('skill: disadvantage asks for two dice', heavyStealth.roll.diceCount === 2,
    heavyStealth.roll.diceCount)
  check('skill: and keeps the lowest', heavyStealth.roll.keep === 'lowest')
  const dis = applyCommand(FIGHTER, { ...heavyStealth.roll.command, faces: [18, 4] }, content)
  check('skill: the worse die is the one that counts',
    dis.events[0].payload.natural === 4, dis.events[0].payload.natural)
}

// ---------------------------------------------------------------------------
// The DM's hand — generic verbs, no enemy required
// ---------------------------------------------------------------------------

{
  // "Apply 12 fire damage" with nothing on the other side of it.
  const hurt = applyCommand(FIGHTER, {
    type: 'dmDamage', characterId: FIGHTER.id, amount: 12, damageType: 'fire'
  }, content)
  check('dm: damage needs no target entity to exist', hurt.rejected === undefined,
    hurt.rejected && hurt.rejected.reasons.join('; '))
  check('dm: and reduces hit points', hurt.character.hitPointsCurrent === 35,
    hurt.character.hitPointsCurrent)

  // Resistance is the engine's business, not the DM's arithmetic.
  const poisoned = applyCommand(FIGHTER, {
    type: 'dmDamage', characterId: FIGHTER.id, amount: 12, damageType: 'poison'
  }, content)
  check('dm: dwarven poison resistance halves it without the DM doing sums',
    poisoned.character.hitPointsCurrent === 41, poisoned.character.hitPointsCurrent)

  const bloodied = applyCommand(FIGHTER, {
    type: 'dmDamage', characterId: FIGHTER.id, amount: 30, damageType: 'slashing'
  }, content)
  check('dm: crossing half health announces itself for the theatre',
    bloodied.events.some((e) => e.type === 'Bloodied'))

  const healed = applyCommand(hurt.character, {
    type: 'dmHeal', characterId: FIGHTER.id, amount: 100
  }, content)
  check('dm: healing stops at the maximum', healed.character.hitPointsCurrent === 49,
    healed.character.hitPointsCurrent)
  check('dm: and says how much was wasted',
    healed.events[0].payload.wasted === 86, healed.events[0].payload.wasted)

  // "Apply Frightened", again with no source creature.
  const scared = applyCommand(FIGHTER, {
    type: 'applyCondition', characterId: FIGHTER.id,
    conditionId: 'srd:condition.frightened', sourceId: 'dm:narration'
  }, content)
  check('dm: a condition can be imposed by narration alone', scared.rejected === undefined)
  const scaredView = playerViewOf(scared.character, content, { detail: 'inspect' })
  check('dm: and reaches the player view',
    scaredView.effects.some((e) => e.label === 'Frightened'))
  // Frightened's disadvantage applies only *while the source of fear is in line
  // of sight*. The engine cannot know that, and correctly refuses to guess: the
  // condition is on, its consequences are listed, and each says plainly why it
  // is dormant. This is the DM-judgement path, and it is the honest behaviour.
  const frightened = scaredView.effects.find((e) => e.label === 'Frightened')
  check('dm: its consequences are spelled out',
    frightened.effects.length === 2, frightened.effects.join(' | '))
  check('dm: and a clause the engine cannot judge says so rather than guessing',
    frightened.effects.every((line) => line.includes('not applying')),
    frightened.effects.join(' | '))
  check('dm: so the roll is unchanged until the table says otherwise',
    scaredView.skills.find((s) => s.id === 'athletics').rollState === 'normal')

  // Flipping the toggle is what the DM does when the monster is in view.
  const inSight = applyCommand(scared.character, {
    type: 'setToggle', characterId: FIGHTER.id,
    toggleId: 'frightened.sourceInSight', value: true
  }, content)
  const inSightView = playerViewOf(inSight.character, content, { detail: 'inspect' })
  check('dm: with the source in sight the disadvantage bites',
    inSightView.skills.find((s) => s.id === 'athletics').rollState === 'disadvantage',
    inSightView.skills.find((s) => s.id === 'athletics').rollState)
  check('dm: and the UI is told to roll two dice for it',
    inSightView.skills.find((s) => s.id === 'athletics').roll.diceCount === 2)

  // The improvised effect: a modifier the DM composed, resolved like content.
  const cursed = applyCommand(FIGHTER, {
    type: 'dmApplyEffect', characterId: FIGHTER.id,
    effect: {
      id: 'dm:curse.leaden-limbs', name: 'Leaden Limbs',
      provenance: 'dm', contentVersion: 1, kind: 'environment',
      activation: { always: true }, completeness: 'complete',
      modifiers: [{
        id: 'dm-m1', channel: 'value', target: 'speed.walk', op: 'add',
        value: -10, permanence: 'temporary', note: 'the idol’s weight'
      }]
    }
  }, content)
  check('dm: an improvised effect is accepted', cursed.rejected === undefined,
    cursed.rejected && cursed.rejected.reasons.join('; '))

  const cursedView = playerViewOf(cursed.character, content, { detail: 'inspect' })
  check('dm: it resolves through the ordinary pipeline',
    cursedView.vitals.speed.value === 15, cursedView.vitals.speed.value)
  check('dm: and is labelled as coming from the table, not the rules',
    cursedView.vitals.speed.breakdown.lines.some((l) => l.provenance === 'dm'),
    cursedView.vitals.speed.breakdown.lines.map((l) => `${l.source}/${l.provenance}`).join(', '))

  const lifted = applyCommand(cursed.character, {
    type: 'dmRemoveEffect', characterId: FIGHTER.id, sourceId: 'dm:curse.leaden-limbs'
  }, content)
  check('dm: removing it reverts exactly',
    playerViewOf(lifted.character, content).vitals.speed.value === 25)

  // Resources, without knowing what the resource is.
  let drained = { character: WIZARD, rejected: undefined }
  for (const slot of ['wizard.slots.1', 'wizard.slots.2', 'wizard.slots.3']) {
    drained = applyCommand(drained.character, {
      type: 'dmSetResource', characterId: WIZARD.id, resourceId: slot, remaining: 0
    }, content)
  }
  check('dm: a resource can be set directly', drained.rejected === undefined)
  const drainedView = playerViewOf(drained.character, content)
  check('dm: and the player sees it',
    drainedView.resources.find((r) => r.id === 'wizard.slots.1').current === 0)
  check('dm: which changes what they can cast',
    drainedView.actions.find((a) => a.id === 'cast:srd:spell.magic-missile').available === false)

  const nonsense = applyCommand(FIGHTER, {
    type: 'dmSetResource', characterId: FIGHTER.id, resourceId: 'nope', remaining: 1
  }, content)
  check('dm: a resource the character lacks is refused', nonsense.rejected !== undefined)
}

// ---------------------------------------------------------------------------
// Progressive disclosure: the payload matches the tier
// ---------------------------------------------------------------------------

{
  const glance = playerViewOf(FIGHTER, content, { detail: 'summary' })
  const deep = playerViewOf(FIGHTER, content, { detail: 'full' })

  check('disclosure: the summary tier ships no breakdowns',
    glance.vitals.armorClass.breakdown === undefined)
  check('disclosure: but the number is identical',
    glance.vitals.armorClass.value === deep.vitals.armorClass.value)
  check('disclosure: the full tier includes discarded terms',
    deep.vitals.armorClass.breakdown.lines.some((l) => !l.applied))
  check('disclosure: every discarded term says why',
    deep.vitals.armorClass.breakdown.lines.filter((l) => !l.applied).every((l) => l.reason))
  check('disclosure: and the summary payload is genuinely smaller',
    JSON.stringify(glance).length < JSON.stringify(deep).length)
}

// ---------------------------------------------------------------------------
// The explanation must reconcile with the number
//
// The invariant a published breakdown exists to satisfy. It was violated
// silently: a proficiency term's value is a *multiplier*, and a reader adding
// the column got a different answer from the total. Nothing caught it until
// somebody read the card on screen.
// ---------------------------------------------------------------------------

{
  for (const c of PARTY) {
    const view = playerViewOf(c, content, { detail: 'inspect' })

    for (const skill of view.skills) {
      const lines = skill.total.breakdown.lines.filter((l) => l.applied)
      const sum = lines
        .filter((l) => l.kind === 'add' || l.kind === 'base')
        .reduce((n, l) => n + (l.amount ?? 0), 0)
      check(`reconcile: ${c.name} ${skill.label} breakdown adds up`,
        sum === skill.total.value,
        `${lines.map((l) => `${l.source} ${l.kind} ${l.amount}`).join(' | ')} => ${sum} != ${skill.total.value}`)
    }

    // And every line that carries a number must say how it combines, or the
    // reader has to guess.
    const everyLine = [
      ...view.skills.flatMap((s) => s.total.breakdown.lines),
      ...view.abilities.map((a) => a.save.breakdown).flatMap((b) => b?.lines ?? []),
      ...(view.vitals.armorClass.breakdown?.lines ?? [])
    ]
    check(`reconcile: ${c.name} every breakdown line declares its kind`,
      everyLine.every((l) => l.kind !== undefined))
  }

  // The roll event carries the same distinction.
  const rogueView = playerViewOf(PARTY[2], content, { detail: 'inspect' })
  const attack = rogueView.actions.find((a) => a.kind === 'attack')
  const rolled = applyCommand(PARTY[2], { ...attack.roll.command, faces: [15] }, content)
  const payload = rolled.events[0].payload
  const additive = payload.terms
    .filter((t) => t.applied && t.op !== 'proficiency' && t.op !== 'multiply')
    .reduce((n, t) => n + (t.value ?? 0), 0)
  check('reconcile: the roll card terms add up to the total',
    additive === payload.total,
    `${payload.terms.map((t) => `${t.source} ${t.op} ${t.value}`).join(' | ')} => ${additive} != ${payload.total}`)
  check('reconcile: and the multiplier term is still shown, marked as one',
    payload.terms.some((t) => t.op === 'proficiency' && t.value !== undefined))
}

check.report()
