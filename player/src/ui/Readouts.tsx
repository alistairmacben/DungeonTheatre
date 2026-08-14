// The shared disclosure primitives.
//
// Every number in the interface renders through <Value>, so progressive
// disclosure is structural rather than something each component reimplements —
// and no component ever computes anything. If a breakdown is absent the tier
// simply did not ship one; the total is identical either way.

import React, { useState } from 'react'
import type { Breakdown, Readout, ResourceView } from '@engine'

// ---------------------------------------------------------------------------

export function BreakdownList({ breakdown }: { breakdown: Breakdown }): React.JSX.Element {
  const applied = breakdown.lines.filter((l) => l.applied)
  const discarded = breakdown.lines.filter((l) => !l.applied)

  return (
    <div className="space-y-2 text-[13px]">
      <ul className="space-y-1">
        {applied.map((l, i) => (
          <li key={i} className="flex items-baseline justify-between gap-4">
            <span className="text-parchment/80">
              {l.source}
              {l.provenance === 'dm' && (
                <span className="ml-1 rounded bg-ember/20 px-1 text-[10px] uppercase tracking-wide text-ember">DM</span>
              )}
              {l.note && <span className="ml-1 text-parchment/40">· {l.note}</span>}
            </span>
            {l.amount !== undefined && (
              <span className="shrink-0 tabular-nums text-parchment">
                {l.amount >= 0 ? `+${l.amount}` : l.amount}
              </span>
            )}
          </li>
        ))}
      </ul>

      {discarded.length > 0 && (
        <div className="border-t border-white/10 pt-2">
          <p className="mb-1 text-[11px] uppercase tracking-wide text-parchment/40">Not applied</p>
          <ul className="space-y-1">
            {discarded.map((l, i) => (
              <li key={i} className="text-parchment/45">
                <span className="line-through decoration-parchment/30">{l.source}</span>
                {l.reason && <span className="ml-1 text-parchment/35">— {l.reason}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {breakdown.assumptions.length > 0 && (
        <p className="border-t border-white/10 pt-2 text-[11px] italic text-parchment/40">
          {breakdown.assumptions.join(' · ')}
        </p>
      )}
    </div>
  )
}

/**
 * A number with its explanation folded away. Level 1 is the value; opening it
 * reveals level 2 and, where the tier supplied it, level 3.
 */
export function Value({
  readout, size = 'md', suffix
}: { readout: Readout; size?: 'sm' | 'md' | 'lg'; suffix?: string }): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const hasDetail = !!readout.breakdown && readout.breakdown.lines.length > 0

  const textSize = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-sm' : 'text-xl'

  return (
    <div className="relative">
      <button
        type="button"
        disabled={!hasDetail}
        onClick={() => setOpen((v) => !v)}
        className={`group flex items-baseline gap-1 ${hasDetail ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <span className={`${textSize} font-semibold tabular-nums text-parchment`}>
          {readout.display}
        </span>
        {suffix && <span className="text-xs text-parchment/50">{suffix}</span>}
        {hasDetail && (
          <span className="text-[10px] text-parchment/30 transition group-hover:text-parchment/60">ⓘ</span>
        )}
      </button>

      {open && readout.breakdown && (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-72 rounded-lg border border-white/10 bg-ink/95 p-3 shadow-2xl backdrop-blur">
          <p className="mb-2 text-xs uppercase tracking-wide text-parchment/50">{readout.label}</p>
          <BreakdownList breakdown={readout.breakdown} />
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

/**
 * One component for every resource in the game.
 *
 * It branches on the content's `display` hint and on nothing else — there is no
 * SorcererResource, no PaladinResource, and a DM who invents a resource gets a
 * working widget for free.
 */
export function ResourceDisplay({
  resource, compact = false
}: { resource: ResourceView; compact?: boolean }): React.JSX.Element {
  const { current, maximum, display, label } = resource

  const body = (() => {
    switch (display) {
      case 'pips':
      case 'slots': {
        // Discrete dots. Capped so a large pool does not become a wall of dots.
        const shown = Math.min(maximum, 10)
        return (
          <div className="flex items-center gap-[3px]">
            {Array.from({ length: shown }, (_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full border ${
                  i < current
                    ? display === 'slots'
                      ? 'border-arcane bg-arcane'
                      : 'border-ember bg-ember'
                    : 'border-parchment/25 bg-transparent'
                }`}
              />
            ))}
            {maximum > shown && (
              <span className="ml-1 text-[10px] tabular-nums text-parchment/50">
                {current}/{maximum}
              </span>
            )}
          </div>
        )
      }
      case 'pool': {
        const pct = maximum > 0 ? Math.round((current / maximum) * 100) : 0
        return (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-verdigris transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[11px] tabular-nums text-parchment/70">{current}</span>
          </div>
        )
      }
      case 'dice':
      case 'uses':
      default:
        return (
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(maximum, 6) }, (_, i) => (
              <span
                key={i}
                className={`h-2.5 w-1.5 rounded-sm ${i < current ? 'bg-parchment' : 'bg-parchment/20'}`}
              />
            ))}
            {maximum > 6 && (
              <span className="text-[10px] tabular-nums text-parchment/50">{current}/{maximum}</span>
            )}
          </div>
        )
    }
  })()

  if (compact) return body

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wide text-parchment/45">{label}</span>
      {body}
    </div>
  )
}
