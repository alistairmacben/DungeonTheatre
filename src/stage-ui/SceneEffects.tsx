import { useEffect, useRef } from 'react'
import type { SceneEffect } from '@shared/campaign'
import { CANVAS_H, CANVAS_W } from './layout'

/**
 * Weather and mood over the whole stage.
 *
 * Deliberately restrained. This is composited into a Discord screenshare,
 * where dense fast-moving speckle is the worst possible input for a video
 * encoder — it eats the entire bitrate and smears the artwork underneath.
 * So: fewer, larger, softer particles, and colour grading done in CSS where
 * it costs the encoder nothing.
 */

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  phase: number
}

type Spec = {
  count: number
  spawn: (rand: () => number) => Particle
  step: (p: Particle, dt: number, t: number) => void
  draw: (ctx: CanvasRenderingContext2D, p: Particle) => void
}

function makeSpec(effect: SceneEffect, intensity: number): Spec | null {
  const rand = Math.random

  switch (effect) {
    case 'rain':
    case 'storm': {
      const heavy = effect === 'storm'
      return {
        count: Math.round((heavy ? 190 : 120) * intensity),
        spawn: () => ({
          x: rand() * (CANVAS_W + 400) - 200,
          y: rand() * CANVAS_H,
          vx: heavy ? -420 : -220,
          vy: heavy ? 2100 : 1500,
          size: 12 + rand() * 20,
          alpha: 0.18 + rand() * 0.3,
          phase: 0
        }),
        step: (p, dt) => {
          p.x += p.vx * dt
          p.y += p.vy * dt
          if (p.y > CANVAS_H) {
            p.y = -40
            p.x = rand() * (CANVAS_W + 400) - 200
          }
        },
        draw: (ctx, p) => {
          ctx.strokeStyle = `rgba(190,215,255,${p.alpha})`
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(p.x - p.vx * 0.012, p.y - p.vy * 0.012)
          ctx.stroke()
        }
      }
    }

    case 'snow':
      return {
        count: Math.round(130 * intensity),
        spawn: () => ({
          x: rand() * CANVAS_W,
          y: rand() * CANVAS_H,
          vx: 0,
          vy: 40 + rand() * 70,
          size: 3 + rand() * 7,
          alpha: 0.35 + rand() * 0.5,
          phase: rand() * Math.PI * 2
        }),
        step: (p, dt, t) => {
          p.y += p.vy * dt
          p.x += Math.sin(t * 0.6 + p.phase) * 22 * dt
          if (p.y > CANVAS_H + 10) {
            p.y = -10
            p.x = rand() * CANVAS_W
          }
        },
        draw: (ctx, p) => {
          ctx.fillStyle = `rgba(255,255,255,${p.alpha})`
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
        }
      }

    case 'embers':
      return {
        count: Math.round(80 * intensity),
        spawn: () => ({
          x: rand() * CANVAS_W,
          y: CANVAS_H + rand() * 200,
          vx: 0,
          vy: -(50 + rand() * 90),
          size: 2.5 + rand() * 5,
          alpha: 0.4 + rand() * 0.5,
          phase: rand() * Math.PI * 2
        }),
        step: (p, dt, t) => {
          p.y += p.vy * dt
          p.x += Math.sin(t * 1.1 + p.phase) * 30 * dt
          if (p.y < -20) {
            p.y = CANVAS_H + 20
            p.x = rand() * CANVAS_W
          }
        },
        draw: (ctx, p) => {
          const flicker = 0.65 + Math.sin(p.phase * 7) * 0.35
          ctx.fillStyle = `rgba(255,${140 + Math.round(60 * flicker)},60,${p.alpha * flicker})`
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
        }
      }

    case 'fog':
      return {
        // Very few, very large, very soft: cheap for the encoder.
        count: Math.max(5, Math.round(11 * intensity)),
        spawn: () => ({
          x: rand() * CANVAS_W,
          y: CANVAS_H * (0.45 + rand() * 0.6),
          vx: 12 + rand() * 26,
          vy: 0,
          size: 320 + rand() * 420,
          alpha: 0.05 + rand() * 0.09,
          phase: rand() * Math.PI * 2
        }),
        step: (p, dt, t) => {
          p.x += p.vx * dt
          p.y += Math.sin(t * 0.25 + p.phase) * 6 * dt
          if (p.x - p.size > CANVAS_W) p.x = -p.size
        },
        draw: (ctx, p) => {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size)
          g.addColorStop(0, `rgba(205,210,225,${p.alpha})`)
          g.addColorStop(1, 'rgba(205,210,225,0)')
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
        }
      }

    case 'wind':
      return {
        count: Math.round(45 * intensity),
        spawn: () => ({
          x: rand() * CANVAS_W,
          y: rand() * CANVAS_H,
          vx: 320 + rand() * 380,
          vy: 0,
          size: 60 + rand() * 160,
          alpha: 0.05 + rand() * 0.1,
          phase: rand() * Math.PI * 2
        }),
        step: (p, dt, t) => {
          p.x += p.vx * dt
          p.y += Math.sin(t * 0.8 + p.phase) * 26 * dt
          if (p.x > CANVAS_W + p.size) {
            p.x = -p.size
            p.y = rand() * CANVAS_H
          }
        },
        draw: (ctx, p) => {
          ctx.strokeStyle = `rgba(230,235,245,${p.alpha})`
          ctx.lineWidth = 2.5
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(p.x + p.size, p.y + Math.sin(p.phase) * 8)
          ctx.stroke()
        }
      }

    default:
      return null
  }
}

/** Colour grading and light shafts, done in CSS so the encoder barely notices. */
function overlayFor(effect: SceneEffect, intensity: number): React.CSSProperties | null {
  switch (effect) {
    case 'gloom':
      return {
        background:
          'radial-gradient(ellipse at 50% 40%, rgba(10,12,26,0.25), rgba(4,5,12,0.86) 100%)',
        opacity: 0.55 + intensity * 0.45
      }
    case 'storm':
      return { background: 'rgba(20,28,50,0.35)', opacity: 0.5 + intensity * 0.5 }
    case 'rain':
      return { background: 'rgba(30,45,70,0.22)', opacity: 0.5 + intensity * 0.5 }
    case 'fog':
      return { background: 'rgba(190,198,214,0.10)', opacity: 0.5 + intensity * 0.5 }
    case 'snow':
      return { background: 'rgba(150,180,220,0.12)', opacity: 0.5 + intensity * 0.5 }
    case 'embers':
      return { background: 'rgba(60,20,5,0.20)', opacity: 0.5 + intensity * 0.5 }
    case 'sunbeams':
      return {
        background:
          'linear-gradient(102deg, transparent 12%, rgba(255,226,160,0.13) 17%, transparent 23%, transparent 37%, rgba(255,226,160,0.10) 43%, transparent 49%, transparent 63%, rgba(255,226,160,0.14) 69%, transparent 76%)',
        opacity: 0.55 + intensity * 0.45
      }
    default:
      return null
  }
}

export function SceneEffects({
  effect,
  intensity
}: {
  effect: SceneEffect
  intensity: number
}): React.JSX.Element | null {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const flashRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const spec = makeSpec(effect, Math.max(0.05, intensity))
    if (!ctx || !spec) {
      ctx?.clearRect(0, 0, CANVAS_W, CANVAS_H)
      return
    }

    const particles: Particle[] = Array.from({ length: spec.count }, () => spec.spawn(Math.random))

    let frame = 0
    let last = performance.now()
    let elapsed = 0
    let nextStrike = 2 + Math.random() * 5

    const tick = (now: number): void => {
      // Clamp dt so a backgrounded window doesn't teleport every particle.
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      elapsed += dt

      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
      for (const p of particles) {
        spec.step(p, dt, elapsed)
        spec.draw(ctx, p)
      }

      // Lightning: a rare double-flash rather than a constant strobe.
      if (effect === 'storm' && flashRef.current) {
        nextStrike -= dt
        if (nextStrike <= 0) {
          nextStrike = 4 + Math.random() * 9
          const flash = flashRef.current
          flash.style.transition = 'none'
          flash.style.opacity = String(0.5 + Math.random() * 0.35)
          requestAnimationFrame(() => {
            flash.style.transition = 'opacity 700ms ease-out'
            flash.style.opacity = '0'
          })
        }
      }

      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
    }
  }, [effect, intensity])

  if (effect === 'none') return null
  const overlay = overlayFor(effect, intensity)

  return (
    <div className="pointer-events-none absolute inset-0">
      {overlay && <div className="absolute inset-0" style={overlay} />}
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="absolute inset-0 size-full"
      />
      {effect === 'storm' && (
        <div
          ref={flashRef}
          className="absolute inset-0 bg-[#dbe6ff] mix-blend-screen"
          style={{ opacity: 0 }}
        />
      )}
    </div>
  )
}
