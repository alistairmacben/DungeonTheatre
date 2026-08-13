import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CANVAS_H, CANVAS_W } from './layout'

/**
 * Scales the fixed 1920x1080 stage canvas to fill whatever window it lands in.
 *
 * Laying out at a fixed size and scaling means the composition is identical on
 * a 4K monitor and in a 720p screenshare — no reflow surprises mid-session.
 *
 * The first measurement cannot be trusted: the Stage window is created hidden
 * and only shown on `ready-to-show`, so early reads return a zero-sized rect.
 * We therefore keep retrying on animation frames until a real size appears,
 * and listen on both ResizeObserver and window resize so a missed observer
 * callback can't strand the canvas at the wrong scale.
 */
export function useFitScale(): { ref: React.RefObject<HTMLDivElement | null>; scale: number } {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    let frame = 0
    let cancelled = false

    const apply = (): boolean => {
      const element = ref.current
      if (!element) return false
      const { width, height } = element.getBoundingClientRect()
      if (!width || !height) return false
      setScale(Math.min(width / CANVAS_W, height / CANVAS_H))
      return true
    }

    // Poll frames until the window is actually laid out and visible.
    const settle = (): void => {
      if (cancelled || apply()) return
      frame = requestAnimationFrame(settle)
    }
    settle()

    const observer = new ResizeObserver(() => apply())
    if (ref.current) observer.observe(ref.current)
    window.addEventListener('resize', apply)

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', apply)
    }
  }, [])

  // A window moved between displays can change devicePixelRatio without ever
  // firing a resize; re-measuring on focus is a cheap safety net.
  useEffect(() => {
    const onFocus = (): void => {
      const element = ref.current
      if (!element) return
      const { width, height } = element.getBoundingClientRect()
      if (width && height) setScale(Math.min(width / CANVAS_W, height / CANVAS_H))
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  return { ref, scale }
}
