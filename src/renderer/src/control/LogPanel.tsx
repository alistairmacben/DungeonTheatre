import { critState, describeRoll } from '@shared/dice'
import type { AppSnapshot } from '@shared/types'
import { send } from '../shared/useSnapshot'

/** Every roll at the table, newest first. Whisper rolls are never recorded. */
export function LogPanel({ snapshot }: { snapshot: AppSnapshot }): React.JSX.Element {
  const { rollLog } = snapshot

  return (
    <section className="max-w-2xl">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-white/40">
          Roll log — {rollLog.length}
        </h2>
        {rollLog.length > 0 && (
          <button
            onClick={() => send({ type: 'dice:clearLog' })}
            className="rounded px-2 py-1 text-[11px] text-white/35 hover:text-rose-300"
          >
            clear
          </button>
        )}
      </div>

      {rollLog.length === 0 ? (
        <p className="text-sm text-white/35">
          No rolls yet. Everything rolled at the table shows up here — except whispers, which are
          never recorded.
        </p>
      ) : (
        <ul className="space-y-1">
          {rollLog.map((roll) => {
            const crit = critState(roll)
            return (
              <li
                key={roll.id}
                className="flex items-center gap-3 rounded-md border border-ink-line bg-ink-soft px-3 py-2"
                style={{ borderLeft: `3px solid ${roll.color}` }}
              >
                <span
                  className="w-10 shrink-0 text-right font-display text-xl tabular-nums"
                  style={{
                    color: crit === 'crit' ? '#7dd88f' : crit === 'fumble' ? '#e06a6a' : '#f3eeff'
                  }}
                >
                  {roll.total}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm" style={{ color: roll.color }}>
                    {roll.rollerName}
                  </span>
                  <span className="block truncate text-xs text-white/40">
                    {roll.notation} · {describeRoll(roll)}
                  </span>
                </span>

                {crit && (
                  <span
                    className="shrink-0 text-[10px] uppercase tracking-widest"
                    style={{ color: crit === 'crit' ? '#7dd88f' : '#e06a6a' }}
                  >
                    {crit}
                  </span>
                )}
                <time className="shrink-0 text-[10px] tabular-nums text-white/25">
                  {new Date(roll.at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </time>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
