import type { ReactNode } from 'react'
import type { SceneEffect } from '@shared/campaign'
import { SceneEffects } from './SceneEffects'
import { SceneBackground } from './SceneBackground'

/**
 * The fixed-size stage surface: background art, an adjustable scrim, the cast,
 * and weather on top of everything.
 */
export function StageCanvas({
  scale,
  width,
  height,
  background,
  dim,
  effect,
  effectIntensity,
  children
}: {
  scale: number
  width: number
  height: number
  background: string | null
  /** 0..0.85 — how far the artwork is darkened behind the cast. */
  dim: number
  effect: SceneEffect
  effectIntensity: number
  children: ReactNode
}): React.JSX.Element {
  // Two boxes, and the outer one is the point.
  //
  // Scaling a 1920x1080 box down still leaves a 1920x1080 box as far as layout
  // is concerned, so a parent asked to centre it centres something far larger
  // than the window — and with `transform-origin` at the centre the visible
  // result lands offset down and to the right, cropped on two edges. The stage
  // then disagrees with itself between a big window and a small one, which is
  // exactly the sort of "it looks different over there" that has no cause a
  // reader could guess at.
  //
  // So: the outer box is the true on-screen size and is what the parent lays
  // out, and the inner box scales from its top-left corner inside it. Nothing
  // overflows, so centring means what it says at every window size.
  return (
    <div
      className="relative shrink-0 overflow-hidden bg-black"
      style={{ width: width * scale, height: height * scale }}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ width, height, transform: `scale(${scale})` }}
      >
        <SceneBackground src={background} />

        {/*
          A single flat scrim under the cast. The old fixed vignette plus floor
          gradient buried the scene art; this is one dial the GM controls, and
          at 0 the background is untouched.
        */}
        {dim > 0 && (
          <div className="absolute inset-0" style={{ background: `rgba(6,5,12,${dim})` }} />
        )}

        <div className="absolute inset-0">{children}</div>

        <SceneEffects effect={effect} intensity={effectIntensity} />
      </div>
    </div>
  )
}
