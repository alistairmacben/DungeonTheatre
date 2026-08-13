import * as THREE from 'three'
import type { DiceTheme } from '@shared/dice'

/**
 * Die surfaces and numerals, generated at runtime.
 *
 * Nothing here loads an image file. The body material is derived from the
 * theme's colours, and each numeral is drawn into a small canvas texture. That
 * keeps themes free to add and removes the whole class of "the dice are
 * invisible because a texture 404'd" failure.
 */

/** Numerals that need an underline to be unambiguous when upside down. */
const AMBIGUOUS = new Set([6, 9])

const numeralCache = new Map<string, THREE.Texture>()

export function numeralTexture(value: number, color: string, size = 256): THREE.Texture {
  const key = `${value}:${color}:${size}`
  const cached = numeralCache.get(key)
  if (cached) return cached

  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!

  ctx.clearRect(0, 0, size, size)
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const label = String(value)
  // Two-digit numbers need to be smaller to fit a face.
  ctx.font = `600 ${label.length > 1 ? size * 0.52 : size * 0.68}px Georgia, serif`
  ctx.fillText(label, size / 2, size / 2)

  if (AMBIGUOUS.has(value)) {
    ctx.fillRect(size * 0.34, size * 0.76, size * 0.32, size * 0.045)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.anisotropy = 4
  texture.needsUpdate = true
  numeralCache.set(key, texture)
  return texture
}

/** Subtle surface variation so the body isn't a flat plastic colour. */
function bodyTexture(theme: DiceTheme): THREE.Texture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!

  const colors = Array.isArray(theme.colorset.background)
    ? theme.colorset.background
    : [theme.colorset.background]

  ctx.fillStyle = colors[0] ?? '#222'
  ctx.fillRect(0, 0, size, size)

  // Soft mottling, mixed from the theme's own palette.
  for (let i = 0; i < 90; i++) {
    const c = colors[i % colors.length] ?? '#222'
    const r = 12 + Math.random() * 46
    const x = Math.random() * size
    const y = Math.random() * size
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r)
    gradient.addColorStop(0, c + 'cc')
    gradient.addColorStop(1, c + '00')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  return texture
}

export interface ThemeMaterials {
  body: THREE.Material
  numeralColor: string
  dispose: () => void
}

export function materialsFor(theme: DiceTheme): ThemeMaterials {
  const colors = Array.isArray(theme.colorset.background)
    ? theme.colorset.background
    : [theme.colorset.background]
  const base = new THREE.Color(colors[0] ?? '#222')
  const map = bodyTexture(theme)

  const emissiveThemes: Record<string, string> = {
    arcane: '#4b2fa8',
    ember: '#d1471d'
  }

  // Very dark themes like obsidian read as flat black silhouettes without an
  // environment map to catch specular. Lifting the material with a little
  // self-illumination of its own colour keeps the shape legible while staying
  // true to the theme.
  const glow = emissiveThemes[theme.id]
  // Only the deliberately-glowing themes emit. Everything else gets its
  // legibility from environment specular, which keeps the hue honest — faking
  // it with emission turns black dice grey.
  const emissive = glow ? new THREE.Color(glow) : new THREE.Color('#000000')

  const body = new THREE.MeshStandardMaterial({
    color: base,
    map,
    roughness: theme.material === 'metal' ? 0.32 : theme.material === 'glass' ? 0.22 : 0.5,
    metalness: theme.material === 'metal' ? 0.85 : theme.material === 'glass' ? 0.3 : 0.1,
    emissive,
    emissiveIntensity: glow ? 0.6 : 0,
    envMapIntensity: 1.35,
    flatShading: true
  })

  return {
    body,
    numeralColor: theme.colorset.foreground,
    dispose: () => {
      map.dispose()
      body.dispose()
    }
  }
}
