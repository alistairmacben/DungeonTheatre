// The stage grid must never overflow the 1920x1080 canvas, at any party size.
import { computeLayout, CANVAS_W, CANVAS_H, STAGE_GAP } from './bundle/layout.mjs'

const PAD = 60
/**
 * Independently measured from the rendered DOM, deliberately NOT imported from
 * layout.ts — the point is to catch the layout's own budget drifting away from
 * what the cards actually occupy.
 */
const MEASURED_CARD_RATIO = 1.611
/** A speaking card scales to 1.06, so the bottom row bleeds a little lower. */
const SPEAKING_BLEED = 1.03

const results = []
const check = (name, ok) => results.push([name, ok])

for (let n = 1; n <= 16; n++) {
  const { cols, size } = computeLayout(n)
  const rows = Math.ceil(n / cols)

  const usedW = cols * size + STAGE_GAP * (cols - 1) + PAD * 2
  const usedH =
    rows * size * MEASURED_CARD_RATIO * SPEAKING_BLEED + STAGE_GAP * (rows - 1) + PAD * 2

  check(`n=${n} fits width (${Math.round(usedW)} <= ${CANVAS_W})`, usedW <= CANVAS_W + 0.5)
  check(`n=${n} fits height (${Math.round(usedH)} <= ${CANVAS_H})`, usedH <= CANVAS_H + 0.5)
  check(`n=${n} every card placed (${cols}x${rows} >= ${n})`, cols * rows >= n)
  check(`n=${n} card is legible (${Math.round(size)}px)`, size >= 120)
}

// Cards should shrink monotonically as the party grows — never jump larger.
let previous = Infinity
let monotonic = true
for (let n = 1; n <= 16; n++) {
  const { size } = computeLayout(n)
  if (size > previous + 0.5) monotonic = false
  previous = size
}
check('card size never grows as party grows', monotonic)

check('empty stage is handled', computeLayout(0).size === 0)

console.log('=== CHECKS ===')
let failed = 0
for (const [name, ok] of results) {
  if (!ok) console.log(` FAIL  ${name}`)
  if (!ok) failed++
}
console.log(`${results.length - failed}/${results.length} passed`)
console.log(failed === 0 ? '\nALL PASS' : `\n${failed} FAILED`)
process.exit(failed === 0 ? 0 : 1)
