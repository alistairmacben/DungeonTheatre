// Notation parsing and the forced-outcome notation that keeps every client
// showing the same numbers.
import {
  parseNotation,
  rollValues,
  totalOf,
  forcedNotation,
  describeRoll,
  critState,
  DICE_THEMES,
  VALID_DICE_TEXTURES,
  themeById,
  isWhisper
} from './bundle/dice.mjs'

const results = []
const check = (name, ok) => results.push([name, ok])

// --- parsing ---------------------------------------------------------------
check('plain d20', JSON.stringify(parseNotation('d20')) === JSON.stringify({ dice: [{ sides: 20, qty: 1 }], modifier: 0 }))
check('quantity', parseNotation('3d6').dice[0].qty === 3)
check('positive modifier', parseNotation('1d20+5').modifier === 5)
check('negative modifier', parseNotation('1d20-2').modifier === -2)
check('whitespace tolerated', parseNotation(' 2d8 + 3 ').modifier === 3)
check('mixed dice', parseNotation('1d20+2d6').dice.length === 2)
check('garbage rejected', parseNotation('hello') === null)
check('modifier alone rejected', parseNotation('+5') === null)
check('unsupported die rejected', parseNotation('1d7') === null)
check('quantity capped at 20', parseNotation('999d6').dice[0].qty === 20)

// --- rolling ---------------------------------------------------------------
{
  const parsed = parseNotation('5d20')
  let allInRange = true
  for (let i = 0; i < 300; i++) {
    for (const die of rollValues(parsed)) {
      if (die.value < 1 || die.value > 20 || !Number.isInteger(die.value)) allInRange = false
    }
  }
  check('rolled values stay in range over 1500 dice', allInRange)
  check('rolls the right number of dice', rollValues(parsed).length === 5)
}

check('total sums dice and modifier', totalOf([{ sides: 6, value: 3 }, { sides: 6, value: 5 }], 2) === 10)
check('total handles negative modifier', totalOf([{ sides: 20, value: 11 }], -3) === 8)

// --- forced notation: the multiplayer-critical bit -------------------------
{
  const dice = [
    { sides: 20, value: 17 },
    { sides: 6, value: 4 },
    { sides: 6, value: 2 }
  ]
  const notation = forcedNotation(dice, 3)
  check('groups dice by type', notation.startsWith('1d20+2d6'))
  check('carries the modifier', notation.includes('+3@'))
  check('appends every forced value', notation.endsWith('@17,4,2'))

  // The count of forced values must equal the number of dice, or dice-box
  // silently rolls the remainder at random and clients diverge.
  const [spec, values] = notation.split('@')
  const declared = [...spec.matchAll(/(\d+)d\d+/g)].reduce((n, m) => n + Number(m[1]), 0)
  check('forced value count matches dice count', values.split(',').length === declared)
}

check('empty roll produces empty notation', forcedNotation([], 0) === '')
check('single die needs no modifier part', forcedNotation([{ sides: 20, value: 9 }], 0) === '1d20@9')

// A round trip: whatever we roll must be expressible as forced notation with
// exactly the same values in the same order.
{
  let consistent = true
  for (let i = 0; i < 200; i++) {
    const parsed = parseNotation('2d20+3d6+1')
    const dice = rollValues(parsed)
    const notation = forcedNotation(dice, parsed.modifier)
    const forced = notation.split('@')[1].split(',').map(Number)
    const expected = [...dice.filter((d) => d.sides === 20), ...dice.filter((d) => d.sides === 6)].map((d) => d.value)
    if (JSON.stringify(forced) !== JSON.stringify(expected)) consistent = false
  }
  check('forced values round-trip in group order over 200 rolls', consistent)
}

// --- presentation ----------------------------------------------------------
check('describes a lone die as its total', describeRoll({ dice: [{ sides: 20, value: 14 }], modifier: 0, total: 14 }) === '14')
check('describes a sum', describeRoll({ dice: [{ sides: 6, value: 3 }, { sides: 6, value: 5 }], modifier: 2, total: 10 }).includes('= 10'))
check('nat 20 is a crit', critState({ dice: [{ sides: 20, value: 20 }], modifier: 0, total: 20 }) === 'crit')
check('nat 1 is a fumble', critState({ dice: [{ sides: 20, value: 1 }], modifier: 0, total: 1 }) === 'fumble')
check('two d20s are not a crit', critState({ dice: [{ sides: 20, value: 20 }, { sides: 20, value: 3 }], modifier: 0, total: 23 }) === null)

// --- themes ----------------------------------------------------------------
check('nine themes authored', DICE_THEMES.length === 9)
check('theme ids unique', new Set(DICE_THEMES.map((t) => t.id)).size === DICE_THEMES.length)
check('every theme has a colorset', DICE_THEMES.every((t) => t.colorset?.foreground && t.colorset?.background))
check('every theme has a valid material', DICE_THEMES.every((t) => ['none', 'metal', 'wood', 'glass', 'plastic'].includes(t.material)))
check('unknown theme falls back rather than crashing', themeById('nope').id === DICE_THEMES[0].id)

// An invalid texture name fails silently at runtime — the die just renders
// wrong — so it has to be caught here.
{
  const bad = DICE_THEMES.filter((t) => !VALID_DICE_TEXTURES.includes(t.texture))
  const badColorset = DICE_THEMES.filter((t) => !VALID_DICE_TEXTURES.includes(t.colorset.texture))
  check(
    `every theme texture exists${bad.length ? ` (bad: ${bad.map((t) => t.texture).join(', ')})` : ''}`,
    bad.length === 0
  )
  check(
    `every colorset texture exists${badColorset.length ? ` (bad: ${badColorset.map((t) => t.colorset.texture).join(', ')})` : ''}`,
    badColorset.length === 0
  )
}

// --- visibility ------------------------------------------------------------
// This single flag gates what leaves the roller's machine, so getting it wrong
// leaks a roll that was meant to be invisible.
check('public rolls are shared and recorded', !isWhisper('public'))
check('whisper rolls are neither shared nor recorded', isWhisper('whisper'))

console.log('=== CHECKS ===')
let failed = 0
for (const [name, ok] of results) {
  console.log(` ${ok ? 'PASS' : 'FAIL'}  ${name}`)
  if (!ok) failed++
}
console.log(failed === 0 ? '\nALL PASS' : `\n${failed} FAILED`)
process.exit(failed === 0 ? 0 : 1)
