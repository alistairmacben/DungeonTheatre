// Hover to understand.
//
// This is the reason BG3's level-up screens can put forty unfamiliar words on
// one page without teaching any of them up front: the list stays terse, and
// the explanation arrives only for the thing you are actually looking at.
//
// A primitive rather than a component per use: it wraps any trigger and floats
// an arbitrary panel beside it. Opens on hover, on keyboard focus, and on tap
// — the third matters because a tooltip that only answers to a mouse is a
// tooltip half this product's players can never read.
//
// The panel renders through a portal to `document.body`. Inside the menu's own
// `overflow-y-auto` column it would otherwise be clipped by the scroller, and
// no amount of z-index fixes a clip.

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/** Breathing room between the trigger and the panel, and against the viewport. */
const GAP = 10

export function Inspect({ panel, children, className, side = 'right' }: {
  /** What to show. Not rendered at all until the panel opens. */
  panel: React.ReactNode
  children: React.ReactNode
  className?: string
  /** Preferred side. Flips automatically when there isn't room. */
  side?: 'right' | 'left'
}): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  const triggerRef = useRef<HTMLSpanElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => { setOpen(false); setPos(null) }, [])

  // Measured, not guessed. The panel is rendered invisibly at the origin on
  // the first pass purely so it has a real width and height to place against;
  // `pos` staying null is what keeps that pass off-screen rather than flashing
  // in the corner.
  useLayoutEffect(() => {
    if (!open) return
    const t = triggerRef.current?.getBoundingClientRect()
    const p = panelRef.current?.getBoundingClientRect()
    if (!t || !p) return

    let left = side === 'right' ? t.right + GAP : t.left - p.width - GAP
    // Flip when the preferred side would run off, then clamp — a panel wider
    // than the space on either side has to overlap the trigger somewhere, and
    // overlapping is better than being unreadable at the screen edge.
    if (left + p.width > window.innerWidth - GAP) left = t.left - p.width - GAP
    if (left < GAP) left = Math.min(t.right + GAP, window.innerWidth - p.width - GAP)
    if (left < GAP) left = GAP

    let top = t.top
    if (top + p.height > window.innerHeight - GAP) top = window.innerHeight - p.height - GAP
    if (top < GAP) top = GAP

    setPos((prev) => (prev && prev.left === left && prev.top === top ? prev : { left, top }))
  }, [open, side])

  // Anything that moves the trigger out from under the panel dismisses it.
  // `scroll` is captured because the scroller is an ancestor, not the window.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent): void => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open, close])

  return (
    <span
      ref={triggerRef}
      className={className}
      onPointerEnter={(e) => { if (e.pointerType !== 'touch') setOpen(true) }}
      onPointerLeave={(e) => { if (e.pointerType !== 'touch') close() }}
      // Touch has no hover, so a tap has to do both jobs. Toggling rather than
      // opening means the same finger can dismiss it.
      onPointerDown={(e) => { if (e.pointerType === 'touch') setOpen((v) => !v) }}
      onFocus={() => setOpen(true)}
      onBlur={close}
    >
      {children}
      {open && createPortal(
        <div
          ref={panelRef}
          role="tooltip"
          style={{
            left: pos?.left ?? 0,
            top: pos?.top ?? 0,
            visibility: pos ? 'visible' : 'hidden'
          }}
          className="pointer-events-none fixed z-[100] w-72 rounded-xl border border-white/15 bg-ink/95 px-3.5 py-3 shadow-2xl backdrop-blur-md"
        >
          {panel}
        </div>,
        document.body
      )}
    </span>
  )
}

/**
 * The house style for what goes inside one, so every inspect panel in the
 * product reads the same way: what it is, what kind of thing it is, what it
 * does to you.
 */
export function InspectPanel({ title, subtitle, lines, footer }: {
  title: string
  subtitle?: string
  lines?: string[]
  footer?: string[]
}): React.JSX.Element {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-[13px] text-parchment">{title}</p>
        {subtitle && <p className="text-[11px] italic text-parchment/45">{subtitle}</p>}
      </div>
      {lines && lines.length > 0 && (
        <ul className="space-y-1">
          {lines.map((line, i) => (
            <li key={i} className="text-[12px] leading-relaxed text-parchment/70">{line}</li>
          ))}
        </ul>
      )}
      {footer && footer.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-white/10 pt-2">
          {footer.map((f) => (
            <span key={f} className="text-[10px] uppercase tracking-wide text-parchment/45">{f}</span>
          ))}
        </div>
      )}
    </div>
  )
}
