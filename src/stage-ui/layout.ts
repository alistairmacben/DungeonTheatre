/** The virtual canvas everything is laid out on, then scaled to fit. */
export const CANVAS_W = 1920
export const CANVAS_H = 1080

const PAD = 60
const GAP = 40
/**
 * Card height as a multiple of its width: the 3:4 portrait plus the nameplate.
 * Measured at 1.611 in the DOM; budgeted a little higher so a speaking card —
 * which scales to 1.06 and lifts slightly — cannot clip the canvas edge.
 */
const CARD_RATIO = 1.67
/** Past this, cards stop growing and just sit centred. */
const MAX_CARD = 520

export interface StageLayout {
  cols: number
  size: number
}

/**
 * Picks a grid that keeps every card as large as possible while fitting the
 * canvas. Rows are chosen first so a party of six reads as 3+3 rather than a
 * cramped single line.
 */
export function computeLayout(count: number): StageLayout {
  if (count === 0) return { cols: 1, size: 0 }

  const rows = count <= 4 ? 1 : count <= 8 ? 2 : count <= 15 ? 3 : 4
  const cols = Math.ceil(count / rows)

  const byWidth = (CANVAS_W - PAD * 2 - GAP * (cols - 1)) / cols
  const byHeight = (CANVAS_H - PAD * 2 - GAP * (rows - 1)) / (rows * CARD_RATIO)

  return { cols, size: Math.max(80, Math.min(byWidth, byHeight, MAX_CARD)) }
}

export const STAGE_GAP = GAP
