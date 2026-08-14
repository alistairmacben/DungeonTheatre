// The eight value operations, their combination rules and the stage order.
//
// These are the tests that fail first if anyone reorders the pipeline or
// "simplifies" an operation into a plain sum.

import { createResolution, checkStatValueInvariants } from './bundle/rules.mjs'
import {
  makeChecker, makeCharacter, makeContent, makeSource, valueMod, suppressMod, termFor
} from './rules-fixtures.mjs'

const check = makeChecker()

const AC = 'armorClass'
const SPEED = 'speed.walk'

const resolveWith = (modifiers, characterOverrides = {}) => {
  const content = makeContent([makeSource({ id: 'src:test', name: 'Test', modifiers })])
  return createResolution(makeCharacter(characterOverrides), content)
}

// --- 1. base: highest wins --------------------------------------------------

{
  const content = makeContent([
    makeSource({ id: 'src:armor', name: 'Chain Mail', modifiers: [valueMod(AC, 'base', 16)] }),
    makeSource({ id: 'src:unarmored', name: 'Unarmored Defense', modifiers: [valueMod(AC, 'base', 10)] })
  ])
  const ac = createResolution(makeCharacter(), content).stat(AC)
  check.eq('base: highest wins', ac.total, 16)
  const loser = termFor(ac, 'src:unarmored')
  check('base: the losing provider is retained', loser && loser.applied === false)
  check('base: the loser explains itself', !!(loser && loser.reason && loser.reason.includes('Chain Mail')))
}

// --- 2. add: sums, and stackKey dedup --------------------------------------

{
  const ac = resolveWith([
    valueMod(AC, 'base', 10),
    valueMod(AC, 'add', 2),
    valueMod(AC, 'add', 3)
  ]).stat(AC)
  check.eq('add: sums', ac.total, 15)
}

{
  // Two castings of the same spell do not stack: "the most potent effect applies".
  const content = makeContent([
    makeSource({ id: 'src:base', name: 'Base', modifiers: [valueMod(AC, 'base', 10)] }),
    makeSource({ id: 'src:bless-a', name: 'Bless (cleric A)', modifiers: [valueMod(AC, 'add', 2, { stackKey: 'bless' })] }),
    makeSource({ id: 'src:bless-b', name: 'Bless (cleric B)', modifiers: [valueMod(AC, 'add', 5, { stackKey: 'bless' })] })
  ])
  const ac = createResolution(makeCharacter(), content).stat(AC)
  check.eq('add: same-effect sources do not stack', ac.total, 15)
  const dropped = termFor(ac, 'src:bless-a')
  check('add: the weaker duplicate is retained with a reason',
    !!(dropped && dropped.applied === false && dropped.reason))
}

// --- 3. multiply: product vs single-highest --------------------------------

{
  // speed.walk declares the `product` policy, so two halvings compose.
  const speed = resolveWith([
    valueMod(SPEED, 'base', 40),
    valueMod(SPEED, 'multiply', 0.5),
    valueMod(SPEED, 'multiply', 0.5)
  ]).stat(SPEED)
  check.eq('multiply: product policy composes', speed.total, 10)
}

{
  // proficiencyBonus declares `single-highest`, matching the SRD's explicit
  // "you multiply or divide it only once".
  const pb = resolveWith([
    valueMod('proficiencyBonus', 'multiply', 2),
    valueMod('proficiencyBonus', 'multiply', 2)
  ]).stat('proficiencyBonus')
  check.eq('multiply: single-highest policy applies once', pb.total, 6)
  const skipped = pb.terms.filter((t) => t.stage === 'multiply' && !t.applied)
  check('multiply: the skipped multiplier says why', skipped.length === 1 && !!skipped[0].reason)
}

// --- 4. set: highest priority wins -----------------------------------------

{
  const ac = resolveWith([
    valueMod(AC, 'base', 10),
    valueMod(AC, 'add', 5),
    valueMod(AC, 'set', 12, { priority: 1 }),
    valueMod(AC, 'set', 19, { priority: 5 })
  ]).stat(AC)
  check.eq('set: highest priority wins and overrides the sum', ac.total, 19)
  const lower = ac.terms.find((t) => t.stage === 'set' && !t.applied)
  check('set: the overridden set explains itself', !!(lower && lower.reason))
}

// --- 5/6. min and max clamps -----------------------------------------------

{
  // barkskin: "the target's AC can't be less than 16, regardless of armour"
  const ac = resolveWith([valueMod(AC, 'base', 11), valueMod(AC, 'min', 16)]).stat(AC)
  check.eq('min: floors the value', ac.total, 16)
}

{
  const ac = resolveWith([valueMod(AC, 'base', 25), valueMod(AC, 'max', 18)]).stat(AC)
  check.eq('max: caps the value', ac.total, 18)
}

{
  // The ability cap is itself a stat, because the SRD raises it.
  const capped = resolveWith([valueMod('ability.str.score', 'add', 20)]).stat('ability.str.score')
  check.eq('max: ability scores are capped at 20 by default', capped.total, 20)

  const raised = resolveWith([
    valueMod('ability.str.score', 'add', 20),
    valueMod('ability.str.max', 'set', 24)
  ]).stat('ability.str.score')
  check.eq('max: the cap itself is a resolvable stat', raised.total, 24)
}

// --- 7. suppress ------------------------------------------------------------

{
  // Grappled: speed becomes 0 *and* "can't benefit from any bonus to its speed".
  const speed = resolveWith([
    valueMod(SPEED, 'base', 30),
    valueMod(SPEED, 'add', 10, { tags: ['speed-bonus'] }),
    suppressMod({ paths: [SPEED], ops: ['add'] })
  ]).stat(SPEED)
  check.eq('suppress: removes a targeted modifier from the pipeline', speed.total, 30)
  const gone = speed.terms.find((t) => t.stage === 'suppressed')
  check('suppress: the removed modifier is retained with a reason',
    !!(gone && gone.applied === false && gone.reason))
}

{
  // Mithral armour deletes half plate's Stealth penalty — a value-channel
  // suppress removing a roll-channel modifier.
  const content = makeContent([
    makeSource({
      id: 'src:half-plate', name: 'Half Plate',
      modifiers: [{
        id: 'm-stealth', channel: 'roll', rollOp: 'disadvantage',
        scope: { kinds: ['check'], skills: ['stealth'] },
        tags: ['armor-stealth-penalty'], permanence: 'persistent'
      }]
    }),
    makeSource({
      id: 'src:mithral', name: 'Mithral Armor',
      modifiers: [suppressMod({ tags: ['armor-stealth-penalty'] })]
    })
  ])
  const r = createResolution(makeCharacter(), content)
  const roll = (await import('./bundle/rules.mjs')).resolveRoll(r, {
    kind: 'check', ability: 'dex', skill: 'stealth'
  })
  check.eq('suppress: reaches across channels (value suppresses roll)', roll.advantage, 'normal')
  check('suppress: cross-channel suppression removed the disadvantage',
    roll.disadvantageSources.filter((t) => t.applied).length === 0)
}

// --- 8. replace -------------------------------------------------------------

{
  const ac = resolveWith([
    valueMod(AC, 'base', 10),
    valueMod(AC, 'add', 5),
    valueMod(AC, 'min', 30),
    valueMod(AC, 'replace', 12)
  ]).stat(AC)
  check.eq('replace: overrides everything, including a floor', ac.total, 12)
}

// --- stage order ------------------------------------------------------------

{
  // base 10, +10 = 20, ×0.5 = 10, floor 8 does not bind, cap 9 binds.
  // If any stage were reordered this number changes.
  const speed = resolveWith([
    valueMod(SPEED, 'base', 10),
    valueMod(SPEED, 'add', 10),
    valueMod(SPEED, 'multiply', 0.5),
    valueMod(SPEED, 'min', 8),
    valueMod(SPEED, 'max', 9)
  ]).stat(SPEED)
  check.eq('stage order: base → add → multiply → clamp', speed.total, 9)
}

{
  // The same modifiers supplied in a different order must produce the same
  // answer: the pipeline orders by stage, not by declaration.
  const forward = resolveWith([
    valueMod(SPEED, 'base', 10), valueMod(SPEED, 'add', 10), valueMod(SPEED, 'multiply', 0.5)
  ]).stat(SPEED)
  const reversed = resolveWith([
    valueMod(SPEED, 'multiply', 0.5), valueMod(SPEED, 'add', 10), valueMod(SPEED, 'base', 10)
  ]).stat(SPEED)
  check.eq('stage order: declaration order does not affect the total',
    forward.total, reversed.total)
}

// --- rounding ---------------------------------------------------------------

{
  const speed = resolveWith([
    valueMod(SPEED, 'base', 25),
    valueMod(SPEED, 'multiply', 0.5)
  ]).stat(SPEED)
  check.eq('rounding: speed halving floors (engine assumption, documented)', speed.total, 12)
  check('rounding: the assumption is surfaced in notes',
    speed.notes.some((n) => n.includes('rounds down')))
}

// --- invariants -------------------------------------------------------------

{
  const ac = resolveWith([
    valueMod(AC, 'base', 16), valueMod(AC, 'base', 10),
    valueMod(AC, 'add', 2, { stackKey: 'x' }), valueMod(AC, 'add', 1, { stackKey: 'x' })
  ]).stat(AC)
  const problems = checkStatValueInvariants(ac)
  check('invariant: every not-applied term carries a reason',
    problems.length === 0, problems.map((p) => p.message).join('; '))
}

{
  // Determinism: the same input twice, byte-identical output.
  const mods = [valueMod(AC, 'base', 14), valueMod(AC, 'add', 2)]
  const a = JSON.stringify(resolveWith(mods).stat(AC))
  const b = JSON.stringify(resolveWith(mods).stat(AC))
  check('determinism: identical inputs produce identical output', a === b)
}

check.report()
