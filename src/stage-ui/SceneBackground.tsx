import { useEffect, useRef, useState } from 'react'

/**
 * Scene artwork that never flashes.
 *
 * Swapping an <img> src paints an empty frame while the new file loads, which
 * on a dark stage reads as a black blink at exactly the dramatic moment the DM
 * is revealing somewhere. So the new image is decoded off-screen first, then
 * crossfaded in over the old one.
 */
export function SceneBackground({ src }: { src: string | null }): React.JSX.Element {
  // What is currently painted, and what is fading in on top of it.
  const [base, setBase] = useState<string | null>(src)
  const [incoming, setIncoming] = useState<string | null>(null)
  const [fading, setFading] = useState(false)
  const latest = useRef(src)

  useEffect(() => {
    latest.current = src

    if (src === base) return

    if (!src) {
      setIncoming(null)
      setBase(null)
      return
    }

    let cancelled = false
    const img = new Image()
    img.src = src

    const reveal = (): void => {
      // A newer scene may have been picked while this one was decoding.
      if (cancelled || latest.current !== src) return
      setIncoming(src)
      // Next frame, so the layer mounts at opacity 0 before transitioning.
      requestAnimationFrame(() => {
        if (cancelled || latest.current !== src) return
        setFading(true)
      })
    }

    // decode() waits for the bitmap to be ready to paint, not merely fetched.
    if (img.decode) img.decode().then(reveal, reveal)
    else img.onload = reveal

    return () => {
      cancelled = true
    }
  }, [src, base])

  const settle = (): void => {
    if (!incoming) return
    setBase(incoming)
    setIncoming(null)
    setFading(false)
  }

  return (
    <>
      {base ? (
        <img src={base} alt="" draggable={false} className="absolute inset-0 size-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,#241f33,#08070c_70%)]" />
      )}

      {incoming && (
        <img
          src={incoming}
          alt=""
          draggable={false}
          onTransitionEnd={settle}
          className="absolute inset-0 size-full object-cover transition-opacity duration-500 ease-out"
          style={{ opacity: fading ? 1 : 0 }}
        />
      )}
    </>
  )
}
