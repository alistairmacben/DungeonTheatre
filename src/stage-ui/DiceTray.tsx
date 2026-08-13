import { useState } from 'react'
import {
  DICE_THEMES,
  parseNotation,
  rollValues,
  totalOf,
  themeById,
  type DieSides,
  type RollVisibility,
  type RolledDie
} from '@shared/dice'

/** Every die gets a button. One tap rolls it — no confirm step. */
const DICE: DieSides[] = [4, 6, 8, 10, 12, 20]

export interface RollRequest {
  notation: string
  dice: RolledDie[]
  modifier: number
  total: number
  visibility: RollVisibility
}

/**
 * Roll controls, built for speed: the die buttons are the primary action and a
 * single tap rolls immediately. Count and modifier sit alongside rather than
 * in front, so the common case — one die, no modifier — is exactly one tap.
 */
export function DiceTray({
  theme,
  onThemeChange,
  onRoll,
  allowSecret = false,
  compact = false
}: {
  theme: string
  onThemeChange: (id: string) => void
  onRoll: (request: RollRequest) => void
  /** DMs get the visibility switch; players always roll open. */
  allowSecret?: boolean
  compact?: boolean
}): React.JSX.Element {
  const [count, setCount] = useState(1)
  const [modifier, setModifier] = useState(0)
  const [whisper, setWhisper] = useState(false)
  const visibility: RollVisibility = whisper ? 'whisper' : 'public'
  const [custom, setCustom] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showThemes, setShowThemes] = useState(false)

  const fire = (notation: string, keepCount = false): void => {
    const parsed = parseNotation(notation)
    if (!parsed) {
      setError(`Can't read "${notation}"`)
      return
    }
    setError(null)
    const dice = rollValues(parsed)
    onRoll({
      notation,
      dice,
      modifier: parsed.modifier,
      total: totalOf(dice, parsed.modifier),
      visibility
    })
    // Quantity is nearly always a one-off, so it springs back to 1.
    if (!keepCount) setCount(1)
  }

  const modText = modifier === 0 ? '' : modifier > 0 ? `+${modifier}` : `${modifier}`
  const roll = (sides: DieSides): void => fire(`${count}d${sides}${modText}`)

  /** d20 with advantage or disadvantage, the two most common special rolls. */
  const rollTwenty = (mode: 'adv' | 'dis'): void => {
    const parsed = parseNotation(`2d20${modText}`)!
    const dice = rollValues(parsed)
    const chosen =
      mode === 'adv'
        ? Math.max(...dice.map((d) => d.value))
        : Math.min(...dice.map((d) => d.value))
    onRoll({
      notation: `d20 ${mode === 'adv' ? 'advantage' : 'disadvantage'}${modText}`,
      dice,
      modifier,
      total: chosen + modifier,
      visibility
    })
  }

  return (
    <div className="space-y-2.5">
      {/* Primary: tap a die, it rolls. */}
      <div className={`grid gap-1.5 ${compact ? 'grid-cols-4' : 'grid-cols-7'}`}>
        {DICE.map((sides) => (
          <button
            key={sides}
            onClick={() => roll(sides)}
            className="rounded-lg border border-ink-line bg-ink-soft py-3 font-display text-base leading-none transition hover:border-ember hover:bg-ember/10 hover:text-ember active:scale-90"
          >
            d{sides}
          </button>
        ))}
      </div>

      {/* Secondary: how many, and what to add. */}
      <div className="flex items-center gap-1.5">
        <Stepper label="×" value={count} min={1} max={12} onChange={setCount} />
        <Stepper label="+" value={modifier} min={-20} max={20} onChange={setModifier} showSign />
        <div className="ml-auto flex gap-1">
          <button
            onClick={() => rollTwenty('adv')}
            title="Roll two d20 and keep the higher"
            className="rounded-md border border-emerald-400/30 px-2 py-1.5 text-[11px] text-emerald-300/80 transition hover:border-emerald-400 hover:text-emerald-300"
          >
            adv
          </button>
          <button
            onClick={() => rollTwenty('dis')}
            title="Roll two d20 and keep the lower"
            className="rounded-md border border-rose-400/30 px-2 py-1.5 text-[11px] text-rose-300/80 transition hover:border-rose-400 hover:text-rose-300"
          >
            dis
          </button>
        </div>
      </div>

      <div className="flex gap-1.5">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && custom) {
              fire(custom, true)
              setCustom('')
            }
          }}
          placeholder="2d6+3"
          spellCheck={false}
          className="min-w-0 flex-1 rounded-lg border border-ink-line bg-ink px-3 py-1.5 text-sm outline-none focus:border-ember/60"
        />
        <button
          onClick={() => setShowThemes((v) => !v)}
          title={themeById(theme).label}
          className={`size-8 shrink-0 rounded-full ring-2 transition ${
            showThemes ? 'ring-ember' : 'ring-white/20 hover:ring-white/50'
          }`}
          style={{ background: themeById(theme).swatch }}
        />
      </div>

      {showThemes && (
        <div className="rounded-lg border border-ink-line bg-ink p-2">
          <div className="grid grid-cols-9 gap-1.5">
            {DICE_THEMES.map((t) => (
              <button
                key={t.id}
                title={t.label}
                onClick={() => {
                  onThemeChange(t.id)
                  setShowThemes(false)
                }}
                className={`aspect-square rounded-full ring-2 transition ${
                  theme === t.id ? 'ring-white' : 'ring-transparent hover:ring-white/40'
                }`}
                style={{ background: t.swatch }}
              />
            ))}
          </div>
          <p className="mt-1.5 text-center text-[11px] text-white/40">{themeById(theme).label}</p>
        </div>
      )}

      <button
        onClick={() => setWhisper((v) => !v)}
        title="Only you see the result, and it is never recorded"
        className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[11px] transition ${
          whisper ? 'bg-arcane/25 text-arcane' : 'text-white/40 hover:text-white/70'
        }`}
      >
        <span
          className={`h-4 w-7 shrink-0 rounded-full transition ${
            whisper ? 'bg-arcane' : 'bg-white/15'
          }`}
        >
          <span
            className={`mt-0.5 block size-3 rounded-full bg-ink transition-transform ${
              whisper ? 'translate-x-3.5' : 'translate-x-0.5'
            }`}
          />
        </span>
        Whisper — only you see it, nothing is recorded
      </button>

      {error && <p className="text-xs text-rose-300">{error}</p>}
    </div>
  )
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  showSign
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  showSign?: boolean
}): React.JSX.Element {
  return (
    <div className="flex items-center rounded-lg border border-ink-line bg-ink-soft">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="size-7 rounded-l-lg text-white/45 transition hover:bg-white/10 hover:text-white"
      >
        −
      </button>
      <span className="min-w-8 text-center text-xs tabular-nums text-white/70">
        {label}
        {showSign && value > 0 ? `+${value}` : value}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="size-7 rounded-r-lg text-white/45 transition hover:bg-white/10 hover:text-white"
      >
        +
      </button>
    </div>
  )
}
