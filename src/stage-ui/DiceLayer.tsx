import { useEffect, useRef, useState } from 'react'
import { critState, themeById, type DiceRoll } from '@shared/dice'
import { DiceScene } from './dice3d/DiceScene'
import { DieBadge } from './DieBadge'

/**
 * The dice tray, layered over the stage.
 *
 * The result is deliberately withheld until the dice actually stop. Showing
 * the total the instant someone rolls throws away the only moment that matters
 * at a table — watching the die come to rest.
 */

/** How long the result stays up after the dice settle. */
const HOLD_MS = 3000
const FADE_MS = 550

export function DiceLayer({ roll }: { roll: DiceRoll | null }): React.JSX.Element {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<DiceScene | null>(null)
  const timers = useRef<number[]>([])

  const [current, setCurrent] = useState<DiceRoll | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    let scene: DiceScene | null = null
    try {
      scene = new DiceScene(mount)
      sceneRef.current = scene
    } catch (err) {
      // No WebGL: the roll still resolves, just without the tumble.
      console.warn('Dice renderer unavailable:', err)
    }

    return () => {
      for (const t of timers.current) clearTimeout(t)
      timers.current = []
      sceneRef.current = null
      scene?.dispose()
    }
  }, [])

  useEffect(() => {
    if (!roll) return

    for (const t of timers.current) clearTimeout(t)
    timers.current = []

    setCurrent(roll)
    setVisible(true)
    setShowResult(false)

    const finish = (): void => {
      setShowResult(true)
      const hold = window.setTimeout(() => setVisible(false), HOLD_MS)
      const clear = window.setTimeout(() => {
        sceneRef.current?.clear()
        setCurrent(null)
        setShowResult(false)
      }, HOLD_MS + FADE_MS)
      timers.current.push(hold, clear)
    }

    if (sceneRef.current) {
      sceneRef.current.roll(roll.dice, themeById(roll.theme), finish)
    } else {
      // No renderer, so nothing to wait for — but still pause, or the result
      // pops up the instant the button is pressed and the roll feels fake.
      timers.current.push(window.setTimeout(finish, 1300))
    }

    return () => {
      for (const t of timers.current) clearTimeout(t)
      timers.current = []
    }
  }, [roll])

  const crit = current ? critState(current) : null

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      <div
        ref={mountRef}
        className="absolute inset-0 transition-opacity"
        style={{ opacity: visible ? 1 : 0, transitionDuration: `${FADE_MS}ms` }}
      />

      {current && (
        <div
          className="absolute inset-x-0 bottom-[6%] flex justify-center transition-all duration-500"
          style={{
            opacity: visible && showResult ? 1 : 0,
            transform: showResult ? 'translateY(0)' : 'translateY(14px)'
          }}
        >
          <div
            className="flex items-center gap-5 rounded-2xl border-2 px-7 py-3 backdrop-blur-sm"
            style={{
              borderColor: current.color,
              background: 'rgba(6,5,12,0.76)',
              boxShadow: `0 0 60px -12px ${current.color}`
            }}
          >
            {/* Each die shown as its own shape, so the roll reads at a glance. */}
            <div className="flex items-center gap-2">
              {current.dice.slice(0, 8).map((die, i) => (
                <DieBadge
                  key={i}
                  sides={die.sides}
                  value={die.value}
                  color={current.color}
                  size={current.dice.length > 4 ? 44 : 58}
                />
              ))}
              {current.dice.length > 8 && (
                <span className="text-sm text-white/45">+{current.dice.length - 8}</span>
              )}
            </div>

            {(current.dice.length > 1 || current.modifier !== 0) && (
              <div className="h-10 w-px bg-white/15" />
            )}

            <div className="text-center">
              <div
                className="font-display text-sm tracking-wide"
                style={{ color: current.color, textShadow: '0 2px 8px #000' }}
              >
                {current.rollerName}
                {current.visibility === 'whisper' && (
                  <span className="ml-2 text-[10px] uppercase tracking-widest text-arcane">
                    whisper
                  </span>
                )}
              </div>
              <div
                className="font-display font-bold leading-none"
                style={{
                  fontSize: 58,
                  color: crit === 'crit' ? '#7dd88f' : crit === 'fumble' ? '#e06a6a' : '#f3eeff',
                  textShadow: '0 4px 18px #000, 0 0 8px #000'
                }}
              >
                {current.total}
              </div>
              {current.modifier !== 0 && (
                <div className="text-xs text-white/50">
                  {current.notation}
                </div>
              )}
              {crit && (
                <div
                  className="font-display text-xs uppercase tracking-[0.3em]"
                  style={{ color: crit === 'crit' ? '#7dd88f' : '#e06a6a' }}
                >
                  {crit === 'crit' ? 'Critical' : 'Fumble'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
