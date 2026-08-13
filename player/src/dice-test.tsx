/**
 * Standalone dice harness — no auth, no campaign, no Discord.
 *
 * Exists so the 3D dice can be developed and verified in a browser without
 * signing into a live game. Not shipped in the player build's entry list.
 */
import { useState } from 'react'
import { createRoot } from 'react-dom/client'

// The rAF shim for `?raf=timer` lives in dice-test.html — it has to run before
// any module is evaluated.
import './styles.css'
import { DiceLayer } from '@stage-ui/DiceLayer'
import {
  DICE_THEMES,
  parseNotation,
  rollValues,
  totalOf,
  type DiceRoll
} from '@shared/dice'

function Harness(): React.JSX.Element {
  const [roll, setRoll] = useState<DiceRoll | null>(null)
  const [theme, setTheme] = useState(DICE_THEMES[0]!.id)

  const fire = (notation: string): void => {
    const parsed = parseNotation(notation)
    if (!parsed) return
    const dice = rollValues(parsed)
    setRoll({
      id: crypto.randomUUID(),
      campaignId: 'test',
      rollerId: null,
      characterId: null,
      rollerName: 'Test Roller',
      color: '#e0a458',
      notation,
      dice,
      modifier: parsed.modifier,
      total: totalOf(dice, parsed.modifier),
      visibility: 'public',
      theme,
      at: Date.now()
    })
  }

  return (
    <div
      className="relative overflow-hidden bg-[radial-gradient(ellipse_at_50%_40%,#241f33,#08070c_70%)]"
      // Matches the real stage canvas exactly, so dice size can be judged
      // against what players will actually see rather than the viewport.
      style={{ width: 1920, height: 1080, transform: 'scale(0.6)', transformOrigin: 'top left' }}
    >
      <DiceLayer roll={roll} />

      <div className="absolute left-4 top-4 z-50 w-64 space-y-2 rounded-lg border border-ink-line bg-ink/90 p-3">
        <div className="grid grid-cols-4 gap-1">
          {['1d4', '1d6', '1d8', '1d10', '1d12', '1d20', '1d100', '4d6'].map((n) => (
            <button
              key={n}
              onClick={() => fire(n)}
              className="rounded border border-ink-line py-1.5 text-xs hover:border-ember hover:text-ember"
            >
              {n}
            </button>
          ))}
        </div>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className="w-full rounded border border-ink-line bg-ink px-2 py-1 text-xs"
        >
          {DICE_THEMES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <div id="probe" className="text-[10px] text-white/40">
          {roll ? `${roll.notation} = ${roll.total}` : 'no roll yet'}
        </div>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<Harness />)
