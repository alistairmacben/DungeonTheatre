// Proficiency, advantage, capabilities, conditions, temporary effects, the
// activation fixed point — and the load-bearing unification test.

import {
  createResolution, resolveRoll, resolvePassive, applyOutcome, applyDamage,
  assignTemporaryHitPoints, checkRollInvariants, validateCharacter,
  validateEffectSource, exhaustionSource, MAX_PASSES
} from './bundle/rules.mjs'
import {
  makeChecker, makeCharacter, makeContent, makeSource,
  valueMod, suppressMod, rollMod, capMod, profGrant, skillProf
} from './rules-fixtures.mjs'

const check = makeChecker()
const SPEED = 'speed.walk'

// ---------------------------------------------------------------------------
// Proficiency
// ---------------------------------------------------------------------------

const stealthScope = { kinds: ['check'], skills: ['stealth'] }

{
  // Level 5 ⇒ PB +3. Not proficient ⇒ the term is 0, not "PB anyway".
  const r = createResolution(makeCharacter(), makeContent([]))
  const prof = r.proficiency(stealthScope)
  check.eq('proficiency: not proficient contributes 0', prof.term, 0)
}

{
  const r = createResolution(makeCharacter(), makeContent([
    makeSource({ id: 'src:rogue', name: 'Rogue', proficiencies: [profGrant(skillProf('stealth'), 'proficient')] })
  ]))
  check.eq('proficiency: proficient adds the full bonus', r.proficiency(stealthScope).term, 3)
}

{
  const r = createResolution(makeCharacter(), makeContent([
    makeSource({ id: 'src:exp', name: 'Expertise', proficiencies: [profGrant(skillProf('stealth'), 'expertise')] })
  ]))
  check.eq('proficiency: expertise doubles the bonus', r.proficiency(stealthScope).term, 6)
}

{
  // Artificer's Lore doubles but does NOT grant the underlying proficiency, so
  // a non-proficient character doubles zero. The SRD is explicit about this and
  // it is the single most commonly mis-implemented rule in the section.
  const r = createResolution(makeCharacter(), makeContent([
    makeSource({
      id: 'src:artificers-lore', name: "Artificer's Lore",
      proficiencies: [profGrant(skillProf('history'), 'expertise', { grantsProficiency: false })]
    })
  ]))
  const prof = r.proficiency({ kinds: ['check'], skills: ['history'] })
  check.eq('proficiency: doubling a non-proficiency still yields 0', prof.term, 0)
  check('proficiency: the zero case explains itself',
    prof.terms.some((t) => t.reason && t.reason.includes('not proficient')))
}

{
  // Stonecunning both grants proficiency and doubles it.
  const r = createResolution(makeCharacter(), makeContent([
    makeSource({
      id: 'src:stonecunning', name: 'Stonecunning',
      proficiencies: [profGrant(skillProf('history'), 'expertise', { grantsProficiency: true })]
    })
  ]))
  check.eq('proficiency: granting and doubling gives PB × 2',
    r.proficiency({ kinds: ['check'], skills: ['history'] }).term, 6)
}

{
  // Half proficiency rounds down for Jack of All Trades and up for Remarkable
  // Athlete, from the same PB. Not interchangeable.
  const down = createResolution(makeCharacter(), makeContent([
    makeSource({ id: 'src:joat', name: 'Jack of All Trades', proficiencies: [profGrant(skillProf('stealth'), 'half', { rounding: 'floor' })] })
  ])).proficiency(stealthScope)
  const up = createResolution(makeCharacter(), makeContent([
    makeSource({ id: 'src:ra', name: 'Remarkable Athlete', proficiencies: [profGrant(skillProf('stealth'), 'half', { rounding: 'ceil' })] })
  ])).proficiency(stealthScope)
  check.eq('proficiency: half rounds down (Jack of All Trades)', down.term, 1)
  check.eq('proficiency: half rounds up (Remarkable Athlete)', up.term, 2)
}

{
  // Two sources both granting proficiency: the bonus is added once.
  const r = createResolution(makeCharacter(), makeContent([
    makeSource({ id: 'src:a', name: 'Background', proficiencies: [profGrant(skillProf('stealth'), 'proficient')] }),
    makeSource({ id: 'src:b', name: 'Class', proficiencies: [profGrant(skillProf('stealth'), 'proficient')] })
  ]))
  const roll = resolveRoll(r, { kind: 'check', ability: 'dex', skill: 'stealth' })
  const problems = checkRollInvariants(roll)
  check('proficiency: the bonus appears at most once in a roll',
    problems.length === 0, problems.map((p) => p.message).join('; '))
  check.eq('proficiency: duplicate grants do not double the bonus', roll.modifierTotal, 2 + 3)
}

// ---------------------------------------------------------------------------
// Advantage
// ---------------------------------------------------------------------------

const advSource = (id, name) => makeSource({
  id, name, modifiers: [rollMod('advantage', { kinds: ['check'] })]
})
const disSource = (id, name) => makeSource({
  id, name, modifiers: [rollMod('disadvantage', { kinds: ['check'] })]
})

{
  const r = createResolution(makeCharacter(), makeContent([
    advSource('a1', 'A1'), advSource('a2', 'A2'), advSource('a3', 'A3')
  ]))
  const roll = resolveRoll(r, { kind: 'check', ability: 'dex' })
  check.eq('advantage: never stacks — still one extra die', roll.dice.count, 2)
  check.eq('advantage: three sources still yield advantage', roll.advantage, 'advantage')
}

{
  // "This is true even if multiple circumstances impose disadvantage and only
  // one grants advantage."
  const r = createResolution(makeCharacter(), makeContent([
    advSource('a1', 'A1'), disSource('d1', 'D1'), disSource('d2', 'D2'), disSource('d3', 'D3')
  ]))
  const roll = resolveRoll(r, { kind: 'check', ability: 'dex' })
  check.eq('advantage: one advantage cancels any number of disadvantages', roll.advantage, 'normal')
  check.eq('advantage: a cancelled roll throws exactly one die', roll.dice.count, 1)
  check('advantage: cancelled sources are retained',
    roll.advantageSources.length === 1 && roll.disadvantageSources.length === 3)
  check('advantage: every cancelled source explains itself',
    [...roll.advantageSources, ...roll.disadvantageSources].every((t) => !t.applied && t.reason))
  const problems = checkRollInvariants(roll)
  check('advantage: roll invariants hold', problems.length === 0,
    problems.map((p) => p.message).join('; '))
}

{
  // The same tri-state, rendered passively: +5 / −5 / 0. One function, two
  // renderings, so they can never disagree.
  const plus = resolvePassive(
    createResolution(makeCharacter(), makeContent([advSource('a1', 'A1')])),
    { kind: 'check', ability: 'wis', skill: 'perception' })
  const minus = resolvePassive(
    createResolution(makeCharacter(), makeContent([disSource('d1', 'D1')])),
    { kind: 'check', ability: 'wis', skill: 'perception' })
  const flat = resolvePassive(
    createResolution(makeCharacter(), makeContent([])),
    { kind: 'check', ability: 'wis', skill: 'perception' })
  check.eq('passive: advantage adds 5', plus.total - flat.total, 5)
  check.eq('passive: disadvantage subtracts 5', minus.total - flat.total, -5)
  check.eq('passive: base is 10 + modifiers', flat.total, 10)
}

{
  // DM fiat is a first-class input to every roll, not an escape hatch.
  const r = createResolution(makeCharacter(), makeContent([]))
  const roll = resolveRoll(r, { kind: 'check', ability: 'str', dmAdvantage: 'advantage' })
  check.eq('advantage: DM ruling grants advantage', roll.advantage, 'advantage')
  check('advantage: the DM ruling is named in the breakdown',
    roll.advantageSources.some((t) => t.sourceId === 'dm'))
}

// ---------------------------------------------------------------------------
// Capabilities
// ---------------------------------------------------------------------------

{
  const r = createResolution(makeCharacter(), makeContent([
    makeSource({ id: 'src:grant', name: 'Freedom', modifiers: [capMod('move', 'grant')] }),
    makeSource({ id: 'src:revoke', name: 'Paralysis', modifiers: [capMod('move', 'revoke')] })
  ]))
  const cap = r.capability('move')
  check('capability: revoke beats grant', cap.allowed === false)
  check('capability: the overridden grant explains itself',
    cap.terms.some((t) => t.op === 'grant' && !t.applied && t.reason))
}

// ---------------------------------------------------------------------------
// Conditions
// ---------------------------------------------------------------------------

const withConditions = (ids, extra = {}) => makeCharacter({
  conditions: ids.map((conditionId, i) => ({
    conditionId, instanceId: `ci-${i}`, sourceId: 'test', appliedAtSeconds: 0
  })),
  ...extra
})

{
  const content = makeContent([])
  const r = createResolution(withConditions(['srd:condition.incapacitated']), content)
  check('condition: incapacitated revokes actions', r.capability('takeActions').allowed === false)
  check('condition: incapacitated revokes reactions', r.capability('takeReactions').allowed === false)
}

{
  // "If multiple effects impose the same condition, each instance has its own
  // duration, but the condition's effects don't get worse. A creature either
  // has a condition or doesn't."
  const one = createResolution(withConditions(['srd:condition.restrained']), makeContent([]))
  const two = createResolution(withConditions(
    ['srd:condition.restrained', 'srd:condition.restrained']), makeContent([]))
  const rollOne = resolveRoll(one, { kind: 'save', ability: 'dex' })
  const rollTwo = resolveRoll(two, { kind: 'save', ability: 'dex' })
  check.eq('condition: two instances apply the effects once',
    rollTwo.disadvantageSources.length, rollOne.disadvantageSources.length)
  check('condition: the condition is held regardless of instance count',
    two.hasCondition('srd:condition.restrained'))
}

{
  // Removing one of two instances leaves the condition active.
  const c = withConditions(['srd:condition.prone', 'srd:condition.prone'])
  c.conditions.splice(0, 1)
  const r = createResolution(c, makeContent([]))
  check('condition: removing one instance leaves the condition active',
    r.hasCondition('srd:condition.prone'))
}

{
  // Paralyzed implies incapacitated, which revokes actions.
  const r = createResolution(withConditions(['srd:condition.paralyzed']), makeContent([]))
  check('condition: implied conditions are collected',
    r.capability('takeActions').allowed === false)
  check('condition: paralyzed revokes speech', r.capability('speak').allowed === false)
}

{
  // Grappled sets speed to 0 *and* suppresses bonuses to it. Both are stated in
  // the source, so both exist.
  const c = withConditions(['srd:condition.grappled'])
  const content = makeContent([
    makeSource({ id: 'src:base', name: 'Species', modifiers: [valueMod(SPEED, 'base', 30)] }),
    makeSource({ id: 'src:longstrider', name: 'Longstrider', modifiers: [valueMod(SPEED, 'add', 10)] })
  ])
  const speed = createResolution(c, content).stat(SPEED)
  check.eq('condition: grappled sets speed to 0', speed.total, 0)
  const suppressed = speed.terms.find((t) => t.sourceId === 'src:longstrider')
  check('condition: grappled suppresses the speed bonus, with a reason',
    !!(suppressed && !suppressed.applied && suppressed.reason))
  check('condition: grappled revokes the speed-bonus capability',
    createResolution(c, content).capability('benefitFromSpeedBonus').allowed === false)
}

{
  // The supplied replacement text completes every condition, so nothing is
  // marked partial any more and no resolution is flagged incomplete.
  const r = createResolution(withConditions(['srd:condition.charmed']), makeContent([]))
  check('condition: charmed is held', r.hasCondition('srd:condition.charmed'))
  check('condition: no condition is partial any more', r.partialSources.length === 0)
  const roll = resolveRoll(r, { kind: 'check', ability: 'cha' })
  check('condition: a complete condition does not flag the result incomplete',
    roll.incomplete === false)

  // Charmed's mechanical clause is target-relative: the *charmer* gets
  // advantage on social checks, so the modifier lives on the charmed creature
  // and is picked up by the other side's resolution.
  const source = r.sources.active.find((s) => s.id === 'srd:condition.charmed')
  check('condition: charmed carries a target-relative social advantage',
    !!source && source.modifiers.some(
      (m) => m.appliesTo === 'attackersAgainstSelf' && m.rollOp === 'advantage'))
  check('condition: the unenforceable clause is narrative, not invented',
    !!source && !!source.narrative && source.narrative[0].text.includes('cannot attack the charmer'))
}

{
  // Poisoned is now defined: disadvantage on attack rolls and ability checks.
  const r = createResolution(withConditions(['srd:condition.poisoned']), makeContent([]))
  const attack = resolveRoll(r, { kind: 'attack', ability: 'str' })
  const checkRoll = resolveRoll(r, { kind: 'check', ability: 'dex' })
  check.eq('condition: poisoned imposes disadvantage on attacks', attack.advantage, 'disadvantage')
  check.eq('condition: poisoned imposes disadvantage on ability checks',
    checkRoll.advantage, 'disadvantage')
  const save = resolveRoll(r, { kind: 'save', ability: 'con' })
  check.eq('condition: poisoned does NOT affect saving throws', save.advantage, 'normal')
}

{
  // Unconscious is now complete: it implies incapacitated and prone, auto-fails
  // STR and DEX saves, and carries the within-5-feet auto-critical.
  const r = createResolution(withConditions(['srd:condition.unconscious']), makeContent([]))
  check('condition: unconscious implies incapacitated',
    r.capability('takeActions').allowed === false)
  const save = resolveRoll(r, { kind: 'save', ability: 'str' })
  check('condition: unconscious auto-fails Strength saves', save.autoFail.length > 0)
  const source = r.sources.active.find((s) => s.id === 'srd:condition.unconscious')
  check('condition: unconscious carries the within-5-feet auto-critical',
    !!source && source.modifiers.some((m) => m.rollOp === 'autoCritical'))
}

// --- exhaustion -------------------------------------------------------------

{
  const src = exhaustionSource(3)
  check('exhaustion: effects are cumulative 1..n', src.modifiers.length === 4)
  check('exhaustion: level 0 produces no source', exhaustionSource(0) === undefined)
}

{
  const content = makeContent([
    makeSource({ id: 'src:base', name: 'Species', modifiers: [valueMod(SPEED, 'base', 30)] })
  ])
  const two = createResolution(makeCharacter({ exhaustionLevel: 2 }), content).stat(SPEED)
  check.eq('exhaustion: level 2 halves speed', two.total, 15)

  const five = createResolution(makeCharacter({ exhaustionLevel: 5 }), content).stat(SPEED)
  check.eq('exhaustion: level 5 reduces speed to 0', five.total, 0)
}

{
  const content = makeContent([
    makeSource({ id: 'src:hp', name: 'Class', modifiers: [valueMod('hitPoints.max', 'base', 45)] })
  ])
  const hp = createResolution(makeCharacter({ exhaustionLevel: 4 }), content).stat('hitPoints.max')
  check.eq('exhaustion: level 4 halves the hit point maximum', hp.total, 22)
  check('exhaustion: the halving is visible in the breakdown',
    hp.terms.some((t) => t.applied && t.stage === 'multiply' && t.value === 0.5))
}

// ---------------------------------------------------------------------------
// Temporary vs permanent
// ---------------------------------------------------------------------------

{
  // An amulet of health sets CON to 19. Because nothing derived is stored,
  // removing the source reverts the value with no reconciliation step.
  const amulet = makeSource({
    id: 'src:amulet', name: 'Amulet of Health',
    modifiers: [valueMod('ability.con.score', 'set', 19, { permanence: 'temporary' })]
  })
  const withIt = createResolution(makeCharacter(), makeContent([amulet]))
  const without = createResolution(makeCharacter(), makeContent([]))
  check.eq('temporary: a temporary set applies', withIt.stat('ability.con.score').total, 19)
  check.eq('temporary: removing it reverts with no residue',
    without.stat('ability.con.score').total, 12)
  check.eq('temporary: the derived modifier follows', withIt.stat('ability.con.modifier').total, 4)
}

{
  // Temporary and persistent add modifiers are indistinguishable in the maths.
  const a = createResolution(makeCharacter(), makeContent([
    makeSource({ id: 's1', name: 'S1', modifiers: [valueMod(SPEED, 'base', 30, { permanence: 'temporary' })] })
  ])).stat(SPEED)
  const b = createResolution(makeCharacter(), makeContent([
    makeSource({ id: 's1', name: 'S1', modifiers: [valueMod(SPEED, 'base', 30, { permanence: 'persistent' })] })
  ])).stat(SPEED)
  check.eq('temporary: permanence does not change the arithmetic', a.total, b.total)
}

{
  // Temporary hit points never stack: "you decide whether to keep the ones you
  // have or gain the new ones" — a choice, not a sum.
  check.eq('temp HP: replacing takes the new pool',
    assignTemporaryHitPoints(10, 12, 'replace').value, 12)
  check.eq('temp HP: keeping retains the old pool',
    assignTemporaryHitPoints(10, 12, 'keep').value, 10)
  check.eq('temp HP: they are never summed',
    assignTemporaryHitPoints(10, 12, 'replace').value === 22, false)
}

// ---------------------------------------------------------------------------
// The activation fixed point
// ---------------------------------------------------------------------------

const grappler = {
  id: 'srd:feat.grappler', name: 'Grappler', provenance: 'srd', contentVersion: 1,
  prerequisite: { statAtLeast: ['ability.str.score', 13] },
  effects: makeSource({
    id: 'srd:feat.grappler', name: 'Grappler', kind: 'feat',
    modifiers: [rollMod('advantage', { kinds: ['attack'] })]
  })
}

{
  const content = makeContent([], { feats: [grappler] })
  const strong = makeCharacter({
    abilityScoreBase: { str: 14, dex: 14, con: 12, int: 10, wis: 10, cha: 10 },
    buildChoices: [{ atLevel: 4, kind: 'feat', value: 'srd:feat.grappler' }]
  })
  const r = createResolution(strong, content)
  check('fixed point: a met prerequisite activates the feat',
    r.sources.active.some((s) => s.id === 'srd:feat.grappler'))

  // "If you ever lose a feat's prerequisite, you can't use that feat until you
  // regain the prerequisite." A curse lowering STR must switch it off *and*
  // remove what it granted.
  const cursed = makeCharacter({
    abilityScoreBase: { str: 14, dex: 14, con: 12, int: 10, wis: 10, cha: 10 },
    buildChoices: [{ atLevel: 4, kind: 'feat', value: 'srd:feat.grappler' }]
  })
  const cursedContent = makeContent([
    makeSource({ id: 'src:curse', name: 'Withering Curse', modifiers: [valueMod('ability.str.score', 'add', -3)] })
  ], { feats: [grappler] })
  const cr = createResolution(cursed, cursedContent)
  check('fixed point: losing the prerequisite deactivates the feat',
    !cr.sources.active.some((s) => s.id === 'srd:feat.grappler'))
  check('fixed point: the deactivation explains itself',
    cr.sources.inactive.some((i) => i.source.id === 'srd:feat.grappler' && i.reason.includes('13')))
  const roll = resolveRoll(cr, { kind: 'attack', ability: 'str' })
  check.eq('fixed point: the deactivated feat grants nothing', roll.advantage, 'normal')
}

{
  // A source whose activation depends on a stat it modifies cannot settle. It
  // must degrade loudly rather than hang or silently pick a side.
  const oscillating = makeSource({
    id: 'src:oscillating', name: 'Oscillating',
    activation: { statAtMost: [SPEED, 20] },
    modifiers: [valueMod(SPEED, 'add', 20)]
  })
  const content = makeContent([
    makeSource({ id: 'src:base', name: 'Base', modifiers: [valueMod(SPEED, 'base', 10)] }),
    oscillating
  ])
  const r = createResolution(makeCharacter(), content)
  check('fixed point: a cyclic configuration produces a diagnostic',
    r.diagnostics.some((d) => d.includes('did not settle')))
  check('fixed point: it terminates rather than hanging', typeof r.stat(SPEED).total === 'number')
  check.eq('fixed point: the pass cap is bounded', MAX_PASSES, 3)
}

// ---------------------------------------------------------------------------
// Damage
// ---------------------------------------------------------------------------

{
  // The SRD's own worked example: 25 bludgeoning, a −5 aura, resistance ⇒
  // (25 − 5) / 2 = 10, not 25/2 − 5.
  const result = applyDamage({
    packet: { components: [] },
    rolled: [{ sourceId: 'w', sourceName: 'Maul', type: 'bludgeoning', diceTotal: 25, flat: 0, doublesOnCrit: true }],
    critical: false,
    flatReductions: [{ sourceId: 'aura', sourceName: 'Aura', amount: 5 }],
    resistances: { bludgeoning: 'resistant' },
    temporaryHitPoints: 0,
    hitPointsCurrent: 40
  })
  check.eq('damage: reductions apply before resistance', result.totalBeforeAbsorption, 10)
}

{
  // Two damage types in one packet, resisted independently.
  const result = applyDamage({
    packet: { components: [] },
    rolled: [
      { sourceId: 's', sourceName: 'Flame Strike', type: 'fire', diceTotal: 14, flat: 0, doublesOnCrit: true },
      { sourceId: 's', sourceName: 'Flame Strike', type: 'radiant', diceTotal: 14, flat: 0, doublesOnCrit: true }
    ],
    critical: false,
    flatReductions: [],
    resistances: { fire: 'resistant' },
    temporaryHitPoints: 0,
    hitPointsCurrent: 40
  })
  check.eq('damage: typed components are resisted independently', result.totalBeforeAbsorption, 7 + 14)
}

{
  // Critical hits double dice, never modifiers.
  const result = applyDamage({
    packet: { components: [] },
    rolled: [{ sourceId: 'w', sourceName: 'Dagger', type: 'piercing', diceTotal: 3, flat: 4, doublesOnCrit: true, critDiceTotal: 2 }],
    critical: true,
    flatReductions: [],
    resistances: {},
    temporaryHitPoints: 0,
    hitPointsCurrent: 40
  })
  check.eq('damage: a crit doubles the dice but not the modifier',
    result.totalBeforeAbsorption, 3 + 2 + 4)
}

{
  // Temporary hit points absorb first.
  const result = applyDamage({
    packet: { components: [] },
    rolled: [{ sourceId: 'w', sourceName: 'Arrow', type: 'piercing', diceTotal: 7, flat: 0, doublesOnCrit: true }],
    critical: false, flatReductions: [], resistances: {},
    temporaryHitPoints: 5, hitPointsCurrent: 20
  })
  check.eq('damage: temporary hit points absorb first', result.absorbedByTemporary, 5)
  check.eq('damage: the remainder reaches hit points', result.appliedToHitPoints, 2)
  check.eq('damage: hit points are reduced correctly', result.hitPointsRemaining, 18)
}

{
  // An object's damage threshold ignores sub-threshold damage entirely.
  const result = applyDamage({
    packet: { components: [] },
    rolled: [{ sourceId: 'w', sourceName: 'Sword', type: 'slashing', diceTotal: 8, flat: 0, doublesOnCrit: true }],
    critical: false, flatReductions: [], resistances: {},
    damageThreshold: 10, temporaryHitPoints: 0, hitPointsCurrent: 100
  })
  check.eq('damage: sub-threshold damage is wholly ignored', result.totalBeforeAbsorption, 0)
  check('damage: the threshold explains itself', result.notes.length > 0)
}

// ---------------------------------------------------------------------------
// Rolls
// ---------------------------------------------------------------------------

{
  const r = createResolution(makeCharacter(), makeContent([]))
  const res = resolveRoll(r, { kind: 'attack', ability: 'dex', target: { kind: 'ac', value: 30 } })
  const nat20 = applyOutcome(res, { faces: [20], keptIndex: 0 })
  check('roll: a natural 20 hits regardless of AC', nat20.success === true)
  check('roll: a natural 20 is a critical', nat20.critical === true)
  const nat1 = applyOutcome(res, { faces: [1], keptIndex: 0 })
  check('roll: a natural 1 misses regardless of modifiers', nat1.success === false)
}

{
  // Blinded auto-fails an ability check that requires sight.
  const r = createResolution(withConditions(['srd:condition.blinded']), makeContent([]))
  const res = resolveRoll(r, {
    kind: 'check', ability: 'wis', skill: 'perception',
    requiresSenses: ['sight'], target: { kind: 'dc', value: 5 }
  })
  check('roll: blinded produces an autoFail term', res.autoFail.length > 0)
  const outcome = applyOutcome(res, { faces: [20], keptIndex: 0 })
  check('roll: autoFail beats even a natural 20 on a check', outcome.success === false)
}

{
  // resolveRoll is pure and generates nothing random.
  const r = createResolution(makeCharacter(), makeContent([]))
  const a = JSON.stringify(resolveRoll(r, { kind: 'check', ability: 'dex' }))
  const b = JSON.stringify(resolveRoll(r, { kind: 'check', ability: 'dex' }))
  check('roll: resolution is deterministic and rolls nothing', a === b)
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

{
  const bad = makeSource({
    id: 'src:bad', name: 'Bad',
    modifiers: [{ id: 'm1', channel: 'value', target: 'not.a.real.path', op: 'add', value: 1, permanence: 'persistent' }]
  })
  const problems = validateEffectSource(bad)
  check('validation: an unknown stat path is rejected',
    problems.some((p) => p.message.includes('unknown stat path')))
}

{
  const crossed = makeSource({
    id: 'src:crossed', name: 'Crossed',
    modifiers: [{ id: 'm1', channel: 'value', target: SPEED, op: 'add', value: 1, rollOp: 'advantage', permanence: 'persistent' }]
  })
  check('validation: a modifier cannot span channels',
    validateEffectSource(crossed).some((p) => p.message.includes('roll or capability fields')))
}

{
  const emptySuppress = makeSource({
    id: 'src:empty', name: 'Empty Suppress',
    modifiers: [suppressMod({})]
  })
  check('validation: a suppression that matches nothing is rejected',
    validateEffectSource(emptySuppress).some((p) => p.message.includes('empty target')))
}

{
  const overAttuned = makeCharacter({
    inventory: {
      instances: [1, 2, 3, 4].map((n) => ({
        instanceId: `i${n}`, definitionId: `d${n}`, contentVersion: 1, identified: true
      })),
      equipped: {},
      attunedInstanceIds: ['i1', 'i2', 'i3', 'i4']
    }
  })
  check('validation: more than three attuned items is an error',
    validateCharacter(overAttuned).some((p) => p.message.includes('limit is 3')))
}

{
  const stored = makeCharacter()
  stored.armorClass = 18
  check('validation: storing a derived value on the character is an error',
    validateCharacter(stored).some((p) => p.message.includes('derived values are computed')))
}

// ---------------------------------------------------------------------------
// The load-bearing unification test
// ---------------------------------------------------------------------------

{
  // A species trait, a class feature, a feat, a weapon, an armour, a spell, a
  // condition and a DM-authored item — all affecting the same stats, all
  // resolved through the generic path. If anyone adds a branch on `kind` or
  // `provenance` inside the resolver, this is the test that notices.
  const AC = 'armorClass'

  const species = {
    id: 'test:species', name: 'Test Species', provenance: 'srd', contentVersion: 1,
    size: 'medium', baseWalkSpeed: 30,
    effects: makeSource({
      id: 'test:species', name: 'Test Species', kind: 'species',
      modifiers: [valueMod(SPEED, 'base', 30), valueMod('ability.dex.score', 'add', 2)]
    })
  }

  const klass = {
    id: 'test:class', name: 'Test Class', provenance: 'srd', contentVersion: 1,
    hitDie: 10, savingThrowProficiencies: ['str'],
    features: [{
      id: 'test:class.feature', name: 'Unarmored Defense', provenance: 'srd', contentVersion: 1,
      grantedAtLevel: 1,
      effects: makeSource({
        id: 'test:class.feature', name: 'Unarmored Defense', kind: 'feature',
        modifiers: [valueMod(AC, 'base', 13)]
      })
    }]
  }

  const armor = {
    id: 'srd:armor.chain-mail', name: 'Chain Mail', provenance: 'srd', contentVersion: 1,
    category: 'armor', slot: 'armor',
    effects: makeSource({
      id: 'srd:armor.chain-mail', name: 'Chain Mail', kind: 'item',
      modifiers: [valueMod(AC, 'base', 16)]
    })
  }

  const dmItem = {
    id: 'dm:amulet-of-the-tide', name: 'Amulet of the Tide', provenance: 'dm',
    contentVersion: 1, campaignId: 'camp-1', category: 'wondrous', slot: 'amulet',
    effects: makeSource({
      id: 'dm:amulet-of-the-tide', name: 'Amulet of the Tide', kind: 'item',
      provenance: 'dm', campaignId: 'camp-1',
      modifiers: [valueMod(AC, 'add', 1), valueMod(SPEED, 'add', 5)]
    })
  }

  const spell = {
    id: 'srd:spell.shield-of-faith', name: 'Shield of Faith', provenance: 'srd',
    contentVersion: 1, level: 1, school: 'abjuration', ritual: false,
    castingTime: 'bonusAction', rangeKind: 'ranged',
    components: { verbal: true, somatic: true }, concentration: true,
    effects: makeSource({
      id: 'srd:spell.shield-of-faith', name: 'Shield of Faith', kind: 'spell',
      modifiers: [valueMod(AC, 'add', 2, { permanence: 'temporary' })]
    })
  }

  const character = makeCharacter({
    abilityScoreBase: { str: 10, dex: 12, con: 12, int: 10, wis: 10, cha: 10 },
    buildChoices: [{ atLevel: 4, kind: 'feat', value: 'srd:feat.grappler' }],
    conditions: [{
      conditionId: 'srd:condition.grappled', instanceId: 'ci-1',
      sourceId: 'test', appliedAtSeconds: 0
    }],
    effectInstances: [{
      instanceId: 'ei-1', definitionId: 'srd:spell.shield-of-faith',
      contentVersion: 1, appliedAtSeconds: 0, concentration: true
    }],
    inventory: {
      instances: [
        { instanceId: 'i-armor', definitionId: 'srd:armor.chain-mail', contentVersion: 1, identified: true },
        { instanceId: 'i-amulet', definitionId: 'dm:amulet-of-the-tide', contentVersion: 1, identified: true }
      ],
      equipped: { armor: 'i-armor', amulet: 'i-amulet' },
      attunedInstanceIds: []
    }
  })

  const content = makeContent([], {
    species: [species], classes: [klass], feats: [grappler],
    items: [armor, dmItem], spells: [spell]
  })
  const r = createResolution(character, content)

  const ac = r.stat(AC)
  // chain mail 16 beats Unarmored Defense 13, + DM amulet 1 + shield of faith 2
  check.eq('unification: SRD and DM content combine through one path', ac.total, 19)
  check('unification: the DM item appears in the breakdown by name',
    ac.terms.some((t) => t.sourceId === 'dm:amulet-of-the-tide' && t.applied))
  check('unification: the losing base provider is still explained',
    ac.terms.some((t) => t.sourceId === 'test:class.feature' && !t.applied && t.reason))

  const speed = r.stat(SPEED)
  check.eq('unification: a condition beats a DM item on the same stat', speed.total, 0)
  check('unification: the DM item\'s suppressed bonus is explained',
    speed.terms.some((t) => t.sourceId === 'dm:amulet-of-the-tide' && !t.applied && t.reason))

  check('unification: the feat is inactive and says why',
    r.sources.inactive.some((i) => i.source.id === 'srd:feat.grappler'))

  const kinds = new Set(r.sources.active.map((s) => s.kind))
  check('unification: every content kind reached the resolver',
    ['species', 'feature', 'item', 'spell', 'condition'].every((k) => kinds.has(k)),
    `saw ${[...kinds].join(', ')}`)

  const provenances = new Set(r.sources.active.map((s) => s.provenance))
  check('unification: srd and dm provenance resolve side by side',
    provenances.has('srd') && provenances.has('dm'))
}

check.report()
