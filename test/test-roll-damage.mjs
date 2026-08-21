// Rolling damage — the follow-up after a hit lands.
//
// The claim: given the faces the authority rolled, a weapon or a damage spell
// turns them into a total, doubling the dice (never the flat bonus) on a
// critical, exactly as the rulebook states. Nothing here decides whether the
// attack hit, and nothing applies the total to anyone — that stays the DM's
// call, same as always.

import {
  applyCommand, diceMismatch, diceNeededFor, loadContent, resolveDamagePools, totalDamageRoll
} from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()

const item = (instanceId, definitionId) =>
  ({ instanceId, definitionId, contentVersion: 1, identified: true })

function wizard(level, prepared = []) {
  return {
    id: 'c:w', campaignId: 'camp-1', name: 'Ilyana', playerId: 'p',
    speciesId: 'srd:species.elf', subspeciesId: 'srd:species.elf.high',
    classLevels: [{ classId: 'srd:class.wizard', level }],
    abilityScoreBase: { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 },
    buildChoices: [], hitPointsCurrent: 20, hitPointsTemp: 0,
    hitDiceSpent: {}, resourcesSpent: {}, conditions: [], effectInstances: [],
    exhaustionLevel: 0,
    inventory: { instances: [item('d', 'srd:weapon.dagger')], equipped: { mainHand: 'd' }, attunedInstanceIds: [] },
    deathSaves: { successes: 0, failures: 0 }, toggles: {},
    spellsPrepared: prepared
  }
}

// ---------------------------------------------------------------------------
// The pure core: dice count doubles on a crit, the flat bonus never does
// ---------------------------------------------------------------------------

{
  const pools = [{ type: 'piercing', dice: { count: 1, sides: 4 }, flat: 2 }]
  check.eq('diceNeededFor: 1d4 normally', diceNeededFor(pools, false)[0].count, 1)
  check.eq('diceNeededFor: 2d4 on a crit — the dice double', diceNeededFor(pools, true)[0].count, 2)

  const normal = totalDamageRoll(pools, [[3]], false)
  check.eq('totalDamageRoll: 3 + 2 = 5 normally', normal.total, 5)

  const crit = totalDamageRoll(pools, [[3, 4]], true)
  check.eq('totalDamageRoll: 3 + 4 + 2 = 9 on a crit — the +2 is added once, not twice', crit.total, 9)
  check('totalDamageRoll: label reads like a weapon\'s damage line',
    crit.label === '9 piercing', crit.label)

  check('diceMismatch: catches the wrong die count',
    diceMismatch(pools, [[3, 4]], false) !== undefined)
  check('diceMismatch: catches a face the die cannot show',
    diceMismatch(pools, [[5]], false) !== undefined)
  check('diceMismatch: silent when the shape is right',
    diceMismatch(pools, [[3]], false) === undefined)
  check('diceMismatch: silent for the doubled shape under a crit',
    diceMismatch(pools, [[3, 4]], true) === undefined)
}

// ---------------------------------------------------------------------------
// resolveDamagePools — a weapon in inventory
// ---------------------------------------------------------------------------

{
  const w = wizard(5)
  const resolved = resolveDamagePools(w, { kind: 'weapon', weaponInstanceId: 'd' }, content)
  check('weapon: resolves the dagger\'s 1d4 piercing',
    resolved.pools?.length === 1 && resolved.pools[0].dice.sides === 4
      && resolved.pools[0].dice.count === 1 && resolved.pools[0].type === 'piercing',
    JSON.stringify(resolved))
  check.eq('weapon: label is the weapon\'s name', resolved.label, 'Dagger')

  const missing = resolveDamagePools(w, { kind: 'weapon', weaponInstanceId: 'nope' }, content)
  check('weapon: a weapon not in inventory is rejected, not thrown',
    'rejected' in missing, JSON.stringify(missing))
}

// ---------------------------------------------------------------------------
// resolveDamagePools — a spell, with its darts/instances folded into the pool
// ---------------------------------------------------------------------------

{
  const w = wizard(5, ['srd:spell.magic-missile'])
  const resolved = resolveDamagePools(w, { kind: 'spell', spellId: 'srd:spell.magic-missile' }, content)
  // Three darts of 1d4+1 force fold to one pool: 3d4, flat +3.
  check('spell: Magic Missile\'s three darts fold into one 3d4 pool',
    resolved.pools?.length === 1 && resolved.pools[0].dice.count === 3
      && resolved.pools[0].dice.sides === 4 && resolved.pools[0].flat === 3,
    JSON.stringify(resolved))

  const rolled = totalDamageRoll(resolved.pools, [[1, 2, 3]], false)
  check.eq('spell: 1+2+3 dice plus the folded +3 flat = 9', rolled.total, 9)

  const noSpell = resolveDamagePools(w, { kind: 'spell', spellId: 'srd:spell.detect-magic' }, content)
  check('spell: a spell with no damage is rejected, not thrown',
    'rejected' in noSpell, JSON.stringify(noSpell))

  const notKnown = resolveDamagePools(w, { kind: 'spell', spellId: 'srd:spell.fireball' }, content)
  check('spell: a spell the character cannot cast is rejected',
    'rejected' in notKnown, JSON.stringify(notKnown))
}

// ---------------------------------------------------------------------------
// The full command, end to end through applyCommand — the shape a real
// client actually sends and receives
// ---------------------------------------------------------------------------

{
  const w = wizard(5)
  const hit = applyCommand(w, {
    type: 'rollDamage', characterId: w.id,
    source: { kind: 'weapon', weaponInstanceId: 'd' },
    critical: false, faces: [[4]]
  }, content)
  check('command: a normal hit is not rejected', hit.rejected === undefined, JSON.stringify(hit.rejected))
  const rollEvent = hit.events.find((e) => e.type === 'RollMade')
  check('command: emits a RollMade event, same family as every other roll',
    rollEvent !== undefined)
  // Finesse dagger, High Elf's Dexterity 16 → +3.
  check.eq('command: total is the die plus the dagger\'s Dexterity-based bonus (+3)',
    rollEvent.payload.total, 7)
  check('command: not flagged critical', rollEvent.payload.critical === false)

  const crit = applyCommand(w, {
    type: 'rollDamage', characterId: w.id,
    source: { kind: 'weapon', weaponInstanceId: 'd' },
    critical: true, faces: [[4, 3]]
  }, content)
  check.eq('command: a crit doubles the dice — 4+3+3 = 10', crit.events[0].payload.total, 10)
  check('command: flagged critical', crit.events[0].payload.critical === true)

  const wrongShape = applyCommand(w, {
    type: 'rollDamage', characterId: w.id,
    source: { kind: 'weapon', weaponInstanceId: 'd' },
    critical: false, faces: [[4, 3]]
  }, content)
  check('command: rejects a face count that does not match the crit state',
    wrongShape.rejected !== undefined, JSON.stringify(wrongShape.rejected))

  const spellCast = applyCommand(w, {
    type: 'rollDamage', characterId: w.id,
    source: { kind: 'spell', spellId: 'srd:spell.magic-missile' },
    critical: false, faces: [[2, 2, 2]]
  }, content)
  check.eq('command: Magic Missile totals its three darts plus the folded flat bonus',
    spellCast.events[0].payload.total, 9)
}

check.report()
