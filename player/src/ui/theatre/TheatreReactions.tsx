// The stage, reacting.
//
// Phase L's whole claim is that watching should tell you what happened without
// reading a log. So this renders over the scene and then gets out of the way:
// a damage number rises and fades, a spell announces itself with its own art,
// a broken concentration says so once. Nothing here persists, and nothing here
// is clickable — the sheet remains the place you go to *read*.
//
// Beats are derived from domain events by `reactions.ts`; this file only knows
// how to show one. That seam is what lets the same stream drive a different
// look later without anybody revisiting what an event means.

import React, { useEffect, useRef, useState } from 'react'
import { beatsFrom, type Beat, type BeatSource } from './reactions'
import { damageTypeIcon, itemIcon, spellIcon } from '../icons'

/** How long a beat stays on screen. Long enough to read, short enough to miss. */
const LIFETIME_MS = 2600

/**
 * The beats that have arrived since last render, across every stream.
 *
 * Streams are kept SEPARATE rather than concatenated, and that is a
 * correctness point rather than tidiness: "what is new" is found by locating
 * the previously-seen head, and in a merged array a new event from the second
 * stream lands in the middle, leaving index 0 untouched. Every beat from the
 * rest of the table would have been silently dropped.
 *
 * Object identity does the diffing — these are the same objects the reducer
 * and the subscription handed over. The first run deliberately emits nothing:
 * opening the app should not replay everything that already happened.
 */
export function useEventBeats(streams: BeatSource[][]): Beat[] {
  const [live, setLive] = useState<Beat[]>([])
  const heads = useRef<(BeatSource | null)[]>([])
  const primed = useRef(false)

  useEffect(() => {
    if (!primed.current) {
      primed.current = true
      heads.current = streams.map((s) => s[0] ?? null)
      return
    }

    const fresh: BeatSource[] = []
    streams.forEach((stream, i) => {
      const head = heads.current[i] ?? null
      if (stream[0] === head) return
      const at = head ? stream.indexOf(head) : -1
      // -1 means the previous head aged out of the cap; take the newest few
      // rather than replaying a window nobody was watching.
      fresh.push(...(at === -1 ? stream.slice(0, 3) : stream.slice(0, at)))
    })
    heads.current = streams.map((s) => s[0] ?? null)
    if (fresh.length === 0) return

    // One dispatch produces one batch, and a batch is already cause-first:
    // `[DamageTaken, Bloodied]`, not the other way round.
    const beats = beatsFrom(fresh)
    if (beats.length === 0) return

    setLive((prev) => [...prev, ...beats])
    const ids = new Set(beats.map((b) => b.id))
    setTimeout(() => setLive((prev) => prev.filter((b) => !ids.has(b.id))), LIFETIME_MS)
  }, [streams])

  return live
}

const TONE: Record<Beat['tone'], string> = {
  harm: 'text-ember',
  heal: 'text-verdigris',
  arcane: 'text-arcane',
  grim: 'text-ember',
  neutral: 'text-parchment/70'
}

export function TheatreReactions({ streams }: { streams: BeatSource[][] }): React.JSX.Element {
  const beats = useEventBeats(streams)

  return (
    // Above the scene, below the HUD, and never in the way of a click.
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      <div className="absolute inset-x-0 top-[22%] flex flex-col items-center gap-2">
        {beats.map((beat) => <BeatView key={beat.id} beat={beat} />)}
      </div>
    </div>
  )
}

function BeatView({ beat }: { beat: Beat }): React.JSX.Element {
  const tone = TONE[beat.tone]

  if (beat.kind === 'number') {
    const icon = beat.damageType ? damageTypeIcon(beat.damageType as never) : undefined
    return (
      <div className="animate-beat-rise flex items-center gap-2">
        {icon && <img src={icon} alt="" className="h-7 w-7 opacity-90" />}
        <span className={`font-display text-5xl font-semibold tabular-nums drop-shadow-lg ${tone}`}>
          {beat.headline}
        </span>
        {beat.detail && (
          <span className="text-[11px] uppercase tracking-widest text-parchment/50">{beat.detail}</span>
        )}
      </div>
    )
  }

  if (beat.kind === 'flourish') {
    const icon = beat.spellId ? spellIcon(beat.spellId) : undefined
    return (
      <div className="animate-beat-fade flex items-center gap-3 rounded-2xl border border-arcane/30 bg-ink/80 px-4 py-2 backdrop-blur">
        {icon && <img src={icon} alt="" className="h-10 w-10 rounded" />}
        <span>
          <span className={`block font-display text-xl ${tone}`}>{beat.headline}</span>
          {beat.detail && (
            <span className="block text-[11px] uppercase tracking-widest text-parchment/45">
              {beat.detail}
            </span>
          )}
        </span>
      </div>
    )
  }

  // A reward is the one beat worth stopping for, so it gets a frame and
  // holds the eye rather than drifting upward like a damage number.
  if (beat.kind === 'reward') {
    const icon = beat.itemId ? itemIcon({ label: beat.headline }) : undefined
    return (
      <div className="animate-beat-fade flex items-center gap-4 rounded-2xl border border-ember/40 bg-ink/90 px-5 py-3 shadow-2xl backdrop-blur">
        {icon && <img src={icon} alt="" className="h-12 w-12 rounded" />}
        <span>
          <span className="block text-[10px] uppercase tracking-[0.25em] text-ember/80">
            {beat.detail}
          </span>
          <span className="block font-display text-2xl text-parchment">{beat.headline}</span>
        </span>
      </div>
    )
  }

  if (beat.kind === 'proclaim') {
    return (
      <div className="animate-beat-fade text-center">
        <span className={`font-display text-4xl uppercase tracking-[0.3em] drop-shadow-lg ${tone}`}>
          {beat.headline}
        </span>
        {beat.detail && (
          <span className="mt-1 block text-[11px] uppercase tracking-widest text-parchment/50">
            {beat.detail}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={`animate-beat-fade rounded-full border border-white/15 bg-ink/85 px-3 py-1 text-[13px] backdrop-blur ${tone}`}>
      {beat.headline}
    </div>
  )
}
