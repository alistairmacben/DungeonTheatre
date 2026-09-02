// Choosing a picture, and framing the face.
//
// One upload produces both images the app needs. The player drags and zooms a
// square window over their picture; what is inside becomes the round HUD
// portrait, and the picture itself — downscaled — becomes the standing figure
// on the sheet. Asking for two uploads would be asking the player to solve the
// app's storage problem.
//
// All of it happens on a canvas in the browser. `sharp` does this on the DM's
// side, but that is a native Node module and the player app is a web page, so
// the resizing lives here instead.

import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { PortraitBlobs } from '../game/portraitStore'

/** The standing figure never needs to be larger than the panel that shows it. */
const FULL_MAX_EDGE = 900
/** The head crop is shown at ~64px and on retina screens; 256 is plenty. */
const HEAD_EDGE = 256
const WEBP_QUALITY = 0.85

/** Square viewport the crop is framed in, in CSS pixels. */
const VIEWPORT = 260

function drawScaled(image: HTMLImageElement, maxEdge: number): HTMLCanvasElement {
  const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(image.naturalWidth * scale)
  canvas.height = Math.round(image.naturalHeight * scale)
  canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas
}

function toWebp(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('could not encode the image'))),
      'image/webp',
      WEBP_QUALITY
    )
  })
}

export function PortraitPicker({ initialHead, onCancel, onChoose }: {
  /** Shown before anything is uploaded, so the control is not an empty box. */
  initialHead?: string
  onCancel(): void
  onChoose(blobs: PortraitBlobs): void | Promise<void>
}): React.JSX.Element {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragging = useRef<{ x: number; y: number } | null>(null)

  const load = (file: File): void => {
    setError(null)
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setImage(img)
      // Start with the picture filling the window and centred — the framing a
      // player would most often have chosen anyway.
      setZoom(1)
      setOffset({ x: 0, y: 0 })
    }
    img.onerror = () => setError('that file could not be read as an image')
    img.src = url
  }

  /** Pixels per image-pixel at zoom 1: the picture just covers the window. */
  const baseScale = image
    ? VIEWPORT / Math.min(image.naturalWidth, image.naturalHeight)
    : 1

  // Redraw whenever the framing changes. Drawing into a fixed-size square is
  // what makes the preview and the exported crop the same picture.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !image) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, VIEWPORT, VIEWPORT)
    const scale = baseScale * zoom
    const w = image.naturalWidth * scale
    const h = image.naturalHeight * scale
    ctx.drawImage(image, (VIEWPORT - w) / 2 + offset.x, (VIEWPORT - h) / 2 + offset.y, w, h)
  }, [image, zoom, offset, baseScale])

  const commit = useCallback(async () => {
    if (!image) return
    setBusy(true)
    setError(null)
    try {
      // The crop, re-rendered at full resolution rather than upscaled from the
      // on-screen preview.
      const head = document.createElement('canvas')
      head.width = HEAD_EDGE
      head.height = HEAD_EDGE
      const ratio = HEAD_EDGE / VIEWPORT
      const ctx = head.getContext('2d')!
      const scale = baseScale * zoom * ratio
      const w = image.naturalWidth * scale
      const h = image.naturalHeight * scale
      ctx.drawImage(
        image,
        (HEAD_EDGE - w) / 2 + offset.x * ratio,
        (HEAD_EDGE - h) / 2 + offset.y * ratio,
        w, h
      )

      const blobs = {
        full: await toWebp(drawScaled(image, FULL_MAX_EDGE)),
        head: await toWebp(head)
      }
      await onChoose(blobs)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }, [image, zoom, offset, baseScale, onChoose])

  return (
    <div className="pointer-events-auto absolute inset-0 z-[60] flex items-center justify-center bg-ink/80 backdrop-blur-sm">
      <div className="w-[26rem] rounded-2xl border border-white/10 bg-ink/95 p-5 shadow-2xl">
        <h3 className="font-display text-lg text-parchment">Character Portrait</h3>
        <p className="mt-0.5 text-xs text-parchment/50">
          Drag to move, zoom to frame. The square becomes the portrait; the whole
          picture is used on your sheet.
        </p>

        <div className="mt-4 flex flex-col items-center gap-3">
          <div
            className="relative overflow-hidden rounded-xl border border-white/15 bg-black/40"
            style={{ width: VIEWPORT, height: VIEWPORT }}
            onPointerDown={(e) => {
              if (!image) return
              dragging.current = { x: e.clientX - offset.x, y: e.clientY - offset.y }
              e.currentTarget.setPointerCapture(e.pointerId)
            }}
            onPointerMove={(e) => {
              if (!dragging.current) return
              setOffset({ x: e.clientX - dragging.current.x, y: e.clientY - dragging.current.y })
            }}
            onPointerUp={() => { dragging.current = null }}
            onPointerCancel={() => { dragging.current = null }}
          >
            {image ? (
              <canvas
                ref={canvasRef}
                width={VIEWPORT}
                height={VIEWPORT}
                className="cursor-move touch-none"
              />
            ) : initialHead ? (
              <img src={initialHead} alt="" className="h-full w-full object-cover opacity-60" />
            ) : (
              <div className="grid h-full w-full place-items-center text-[12px] text-parchment/35">
                No picture yet
              </div>
            )}
            {/* The round mask the HUD will actually apply, previewed here so the
                player frames against the shape they will get rather than a
                square they will not. */}
            <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10">
              <div className="absolute inset-3 rounded-full ring-2 ring-inset ring-arcane/50" />
            </div>
          </div>

          {image && (
            <input
              type="range"
              min={1}
              max={4}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-arcane"
              aria-label="Zoom"
            />
          )}

          <label className="w-full cursor-pointer rounded-lg border border-white/15 px-3 py-2 text-center text-[13px] text-parchment/75 transition hover:border-arcane/50 hover:text-parchment">
            {image ? 'Choose a different picture' : 'Choose a picture'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) load(file)
              }}
            />
          </label>
        </div>

        {error && <p className="mt-3 text-[12px] text-ember">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-parchment/70 transition hover:border-white/30 hover:text-parchment"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!image || busy}
            onClick={() => { void commit() }}
            className="rounded-lg border border-arcane/50 bg-arcane/10 px-4 py-1.5 text-sm text-parchment transition hover:bg-arcane/20 disabled:opacity-40"
          >
            {busy ? 'Saving…' : 'Use this picture'}
          </button>
        </div>
      </div>
    </div>
  )
}
