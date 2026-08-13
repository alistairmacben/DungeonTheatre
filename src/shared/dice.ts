/**
 * Dice: themes, notation, and the roll payload shared by every client.
 *
 * The rule that makes multiplayer dice work: **one client decides the values,
 * everyone animates to them**. Physics cannot be made to match across devices
 * — floating point and frame timing diverge — so the roller generates the
 * numbers, broadcasts them, and every client replays a tumble forced to land
 * on those faces. The tumble may differ slightly screen to screen; the numbers
 * never can.
 */

/** d100 is deliberately absent: as a single die it reads as an odd blob. */
export type DieSides = 4 | 6 | 8 | 10 | 12 | 20

export const DIE_TYPES: DieSides[] = [4, 6, 8, 10, 12, 20]

/**
 * Who may see a roll. Just two states, on purpose.
 *
 * - `public`  — everyone sees the dice and the result, and it is logged.
 * - `whisper` — only the roller sees it, and it is never recorded anywhere:
 *               not broadcast, not written to the database, not in any log.
 */
export type RollVisibility = 'public' | 'whisper'

/** A whisper never leaves the roller's screen and is never written down. */
export function isWhisper(visibility: RollVisibility): boolean {
  return visibility === 'whisper'
}

export interface RolledDie {
  sides: DieSides
  value: number
}

export interface DiceRoll {
  id: string
  campaignId: string
  /** Profile id of whoever rolled. */
  rollerId: string | null
  /** Character the roll is attributed to on stage, when there is one. */
  characterId: string | null
  /** Display name for the roll banner. */
  rollerName: string
  /** Colour used for the banner accent. */
  color: string
  notation: string
  dice: RolledDie[]
  modifier: number
  total: number
  visibility: RollVisibility
  /** Dice theme the roller had selected. */
  theme: string
  /** Epoch ms, stamped by the roller. */
  at: number
}

/**
 * A dice material.
 *
 * `colorset` maps onto dice-box-threejs's `theme_customColorset`; `material`
 * picks its shading model. Everything is authored here rather than shipped as
 * texture files, so adding a theme costs nothing at build time.
 */
export interface DiceTheme {
  id: string
  label: string
  /** Grouping in the picker. */
  family: 'stone' | 'arcane' | 'natural'
  /** Small swatch colour for the picker UI. */
  swatch: string
  material: 'none' | 'metal' | 'wood' | 'glass' | 'plastic'
  texture: string
  colorset: {
    foreground: string
    background: string | string[]
    outline: string
    texture: string
  }
}

export const DICE_THEMES: DiceTheme[] = [
  // --- stone and metal ----------------------------------------------------
  {
    id: 'obsidian',
    label: 'Obsidian & Gold',
    family: 'stone',
    swatch: '#141118',
    material: 'glass',
    texture: 'marble',
    colorset: {
      foreground: '#e8c37a',
      background: ['#17141c', '#221d2b', '#0e0c12'],
      outline: '#000000',
      texture: 'marble'
    }
  },
  {
    id: 'bone',
    label: 'Aged Bone',
    family: 'stone',
    swatch: '#ddd2b4',
    material: 'plastic',
    texture: 'speckles',
    colorset: {
      foreground: '#4a3b28',
      background: ['#e6dcc0', '#d6c9a5', '#efe7d2'],
      outline: '#8d7c5c',
      texture: 'speckles'
    }
  },
  {
    id: 'ruby',
    label: 'Blood Ruby',
    family: 'stone',
    swatch: '#8e1220',
    material: 'glass',
    texture: 'glitter',
    colorset: {
      foreground: '#ffd9dd',
      background: ['#8e1220', '#61030f', '#b0202f'],
      outline: '#2c0308',
      texture: 'glitter'
    }
  },
  {
    id: 'mithril',
    label: 'Mithril',
    family: 'stone',
    swatch: '#b9c4d0',
    material: 'metal',
    texture: 'metal',
    colorset: {
      foreground: '#2b3440',
      background: ['#c3ced9', '#9aa7b5', '#dfe7ee'],
      outline: '#6c7a8a',
      texture: 'metal'
    }
  },

  // --- arcane and emissive ------------------------------------------------
  {
    id: 'arcane',
    label: 'Arcane Glow',
    family: 'arcane',
    swatch: '#7a5cf0',
    material: 'glass',
    texture: 'astral',
    colorset: {
      foreground: '#dcd0ff',
      background: ['#2a1b5e', '#4b2fa8', '#160f33'],
      outline: '#0d0820',
      texture: 'astral'
    }
  },
  {
    id: 'ember',
    label: 'Molten Ember',
    family: 'arcane',
    swatch: '#d1471d',
    material: 'glass',
    texture: 'fire',
    colorset: {
      foreground: '#ffe0a8',
      background: ['#3a1206', '#8c2b0c', '#d1471d'],
      outline: '#1a0703',
      texture: 'fire'
    }
  },

  // --- natural ------------------------------------------------------------
  {
    id: 'jade',
    label: 'Jade',
    family: 'natural',
    swatch: '#3f8f6b',
    material: 'glass',
    texture: 'marble',
    colorset: {
      foreground: '#eafff4',
      background: ['#2f6f52', '#47a37b', '#1e4a37'],
      outline: '#12291f',
      texture: 'marble'
    }
  },
  {
    id: 'amber',
    label: 'Amber',
    family: 'natural',
    swatch: '#c98418',
    material: 'glass',
    texture: 'glitter',
    colorset: {
      foreground: '#4a2c05',
      background: ['#e0a13a', '#c07a12', '#f0c268'],
      outline: '#5c3a08',
      texture: 'glitter'
    }
  },
  {
    id: 'verdigris',
    label: 'Verdigris Copper',
    family: 'natural',
    swatch: '#5d9c8b',
    material: 'metal',
    texture: 'stars',
    colorset: {
      foreground: '#f2efe0',
      background: ['#4f8d7d', '#7bb3a2', '#2f5f53'],
      outline: '#1d3a33',
      texture: 'stars'
    }
  }
]

/**
 * Texture names dice-box-threejs actually ships. A theme referencing anything
 * outside this list renders wrong, and it fails silently, so the test suite
 * checks every theme against it.
 */
export const VALID_DICE_TEXTURES = [
  'none',
  'cloudy',
  'cloudy_2',
  'fire',
  'marble',
  'water',
  'ice',
  'paper',
  'speckles',
  'glitter',
  'glitter_2',
  'stars',
  'stainedglass',
  'wood',
  'metal',
  'skulls',
  'leopard',
  'tiger',
  'cheetah',
  'dragon',
  'lizard',
  'bird',
  'astral',
  'acleaf',
  'thecage',
  'isabelle',
  'bronze01',
  'bronze02',
  'bronze03',
  'bronze03a',
  'bronze03b',
  'bronze04'
] as const

export const DEFAULT_THEME = 'obsidian'

export function themeById(id: string | null | undefined): DiceTheme {
  return DICE_THEMES.find((t) => t.id === id) ?? DICE_THEMES[0]!
}

// --- notation --------------------------------------------------------------

export interface ParsedNotation {
  /** Expanded so d100 becomes its own die rather than two d10s. */
  dice: Array<{ sides: DieSides; qty: number }>
  modifier: number
}

const TERM = /([+-]?)\s*(\d*)d(\d+)|([+-]\s*\d+)/gi

/**
 * Parses simple notation like `2d6+3`, `d20`, `4d8 - 1`.
 * Returns null when nothing rollable is found.
 */
export function parseNotation(input: string): ParsedNotation | null {
  const dice: Array<{ sides: DieSides; qty: number }> = []
  let modifier = 0
  let matched = false

  for (const match of input.matchAll(TERM)) {
    if (match[3]) {
      const sides = Number(match[3]) as DieSides
      if (!DIE_TYPES.includes(sides)) continue
      const qty = Math.min(Number(match[2] || 1), 20)
      if (qty < 1) continue
      dice.push({ sides, qty })
      matched = true
    } else if (match[4]) {
      modifier += Number(match[4].replace(/\s+/g, ''))
      matched = true
    }
  }

  if (!matched || dice.length === 0) return null
  return { dice, modifier }
}

/** Rolls values locally. The roller is the only one who does this. */
export function rollValues(parsed: ParsedNotation): RolledDie[] {
  const out: RolledDie[] = []
  for (const group of parsed.dice) {
    for (let i = 0; i < group.qty; i++) {
      // d100 is rolled as a single 0-90 tens die plus a d10 in most systems;
      // here it is a straight 1-100 for simplicity and clarity of result.
      const max = group.sides
      out.push({ sides: group.sides, value: 1 + Math.floor(Math.random() * max) })
    }
  }
  return out
}

export function totalOf(dice: RolledDie[], modifier: number): number {
  return dice.reduce((sum, d) => sum + d.value, 0) + modifier
}

/**
 * Builds dice-box-threejs notation that forces a predetermined outcome, e.g.
 * `3d6@4,2,6`. This is what makes every client show identical numbers.
 */
export function forcedNotation(dice: RolledDie[], modifier: number): string {
  if (dice.length === 0) return ''

  // Group by die type, preserving the order values were generated in.
  const groups = new Map<DieSides, number[]>()
  for (const die of dice) {
    const list = groups.get(die.sides) ?? []
    list.push(die.value)
    groups.set(die.sides, list)
  }

  const parts: string[] = []
  const values: number[] = []
  for (const [sides, vals] of groups) {
    parts.push(`${vals.length}d${sides}`)
    values.push(...vals)
  }

  const modPart = modifier === 0 ? '' : modifier > 0 ? `+${modifier}` : `${modifier}`
  return `${parts.join('+')}${modPart}@${values.join(',')}`
}

/** Human-readable summary for the roll banner, e.g. "17 + 3 = 20". */
export function describeRoll(roll: DiceRoll): string {
  const values = roll.dice.map((d) => d.value).join(' + ')
  if (roll.dice.length === 1 && roll.modifier === 0) return String(roll.total)
  const mod =
    roll.modifier === 0 ? '' : roll.modifier > 0 ? ` + ${roll.modifier}` : ` − ${-roll.modifier}`
  return `${values}${mod} = ${roll.total}`
}

/** A natural 20 or natural 1 on a lone d20 is worth calling out on stage. */
export function critState(roll: DiceRoll): 'crit' | 'fumble' | null {
  const d20s = roll.dice.filter((d) => d.sides === 20)
  if (d20s.length !== 1) return null
  if (d20s[0]!.value === 20) return 'crit'
  if (d20s[0]!.value === 1) return 'fumble'
  return null
}
