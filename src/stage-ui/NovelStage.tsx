import type { StageSettings } from '@shared/campaign'
import type { StagePresence } from '@shared/stage'
import { CANVAS_H, CANVAS_W } from './layout'

/**
 * Visual-novel staging: characters stand on the scene floor, side by side,
 * facing the viewer. Nothing is framed or boxed — the background art is the
 * picture and the cast are part of it.
 *
 * Cut-out PNGs with transparency look best here. Anything without alpha still
 * works, it just reads as a standing panel.
 */
export function NovelStage({
  presences,
  settings
}: {
  presences: StagePresence[]
  settings: StageSettings
}): React.JSX.Element {
  const count = presences.length
  if (count === 0) return <></>

  // Characters stand on a floor line a little above the bottom edge.
  const floor = CANVAS_H * 0.965
  const baseHeight = CANVAS_H * settings.characterScale

  // Share the width evenly, letting figures overlap slightly once the cast
  // grows — crowding together reads better than shrinking everyone.
  const slot = Math.min(CANVAS_W / count, baseHeight * 0.78)
  const totalWidth = slot * count
  const startX = (CANVAS_W - totalWidth) / 2

  return (
    <div className="absolute inset-0">
      {presences.map((presence, index) => {
        const centerX = startX + slot * index + slot / 2
        const lit = presence.speaking || !settings.dimIdle
        // Per-character nudge, so one badly-cropped portrait can be brought
        // into scale without resizing the whole cast.
        const height = baseHeight * (presence.scale || 1)

        return (
          <div
            key={presence.key}
            className="absolute flex flex-col items-center transition-all duration-300 ease-out will-change-transform"
            style={{
              left: centerX,
              top: floor,
              width: slot * 1.35,
              transform: `translate(-50%, -100%) scale(${presence.speaking ? 1.04 : 1})`,
              transformOrigin: 'bottom center',
              // The speaker sits in front of the rest of the cast.
              zIndex: presence.speaking ? 20 : 10 - Math.abs(index - count / 2),
              filter: lit
                ? 'none'
                : 'brightness(0.42) saturate(0.55) contrast(0.95)',
              opacity: lit ? 1 : 0.85
            }}
          >
            <Figure presence={presence} height={height} lit={lit} />

            {(settings.showNames || settings.showTitles) && (
              <Nameplate presence={presence} settings={settings} width={slot * 1.2} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function Figure({
  presence,
  height,
  lit
}: {
  presence: StagePresence
  height: number
  lit: boolean
}): React.JSX.Element {
  if (!presence.portraitUrl) {
    // No art yet: a soft standing silhouette rather than an empty gap.
    return (
      <div
        className="grid place-items-end justify-center"
        style={{ height, width: height * 0.42 }}
      >
        <div
          className="w-full rounded-t-full"
          style={{
            height: height * 0.82,
            background: `linear-gradient(to top, ${presence.color}55, ${presence.color}18)`,
            border: `2px solid ${presence.color}66`,
            borderBottom: 'none'
          }}
        />
      </div>
    )
  }

  return (
    <img
      src={presence.portraitUrl}
      alt=""
      draggable={false}
      style={{
        height,
        width: 'auto',
        maxWidth: '100%',
        objectFit: 'contain',
        objectPosition: 'bottom center',
        // A grounding shadow, plus a rim glow while speaking so the figure
        // separates from busy background art.
        filter: lit
          ? `drop-shadow(0 ${height * 0.02}px ${height * 0.03}px rgba(0,0,0,0.75))${
              presence.speaking ? ` drop-shadow(0 0 ${height * 0.03}px ${presence.color}aa)` : ''
            }`
          : `drop-shadow(0 ${height * 0.015}px ${height * 0.02}px rgba(0,0,0,0.6))`
      }}
    />
  )
}

function Nameplate({
  presence,
  settings,
  width
}: {
  presence: StagePresence
  settings: StageSettings
  width: number
}): React.JSX.Element {
  const size = Math.max(20, width * 0.11)

  return (
    <div
      className="pointer-events-none mt-[-2%] text-center transition-opacity duration-300"
      style={{ width, opacity: presence.speaking ? 1 : 0.62 }}
    >
      {settings.showNames && (
        <div
          className="truncate font-display font-semibold leading-tight"
          style={{
            fontSize: size,
            color: presence.speaking ? presence.color : '#e6e1f2',
            textShadow: '0 3px 10px #000, 0 0 4px #000, 0 1px 2px #000'
          }}
        >
          {presence.name}
        </div>
      )}
      {settings.showTitles && presence.title && (
        <div
          className="truncate italic leading-tight text-white/70"
          style={{ fontSize: size * 0.68, textShadow: '0 2px 8px #000, 0 0 3px #000' }}
        >
          {presence.title}
        </div>
      )}
    </div>
  )
}
