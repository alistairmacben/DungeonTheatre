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
  return (
    <div
      className="relative shrink-0 overflow-hidden bg-black"
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
  )
}
