import type { StageSettings } from '@shared/campaign'
import type { StagePresence } from '@shared/stage'

/**
 * A framed character portrait.
 *
 * Tuned for Discord Go Live: thick frames, hard contrast between the speaking
 * and idle states, and no thin strokes or subtle gradients — stream
 * compression eats all of those. The speaking cue is carried by *three*
 * redundant signals (scale, brightness, frame glow) so it survives a bad
 * bitrate.
 */
export function PortraitCard({
  presence,
  size,
  settings
}: {
  presence: StagePresence
  size: number
  settings: StageSettings
}): React.JSX.Element {
  const { speaking, color } = presence
  const lit = speaking || !settings.dimIdle

  return (
    <div
      className="flex flex-col items-center transition-transform duration-200 ease-out will-change-transform"
      style={{
        width: size,
        transform: speaking ? 'translateY(-2.5%) scale(1.06)' : 'scale(1)'
      }}
    >
      <div
        className="relative w-full overflow-hidden transition-all duration-200"
        style={{
          aspectRatio: '3 / 4',
          borderRadius: size * 0.06,
          border: `${Math.max(3, size * 0.022)}px solid ${speaking ? color : '#2a2536'}`,
          boxShadow: speaking
            ? `0 0 ${size * 0.28}px ${size * 0.02}px ${color}80, 0 ${size * 0.05}px ${size * 0.1}px #000000cc`
            : `0 ${size * 0.03}px ${size * 0.07}px #000000aa`,
          filter: lit ? 'none' : 'saturate(0.5) brightness(0.55)'
        }}
      >
        {presence.portraitUrl ? (
          <img
            src={presence.portraitUrl}
            alt=""
            draggable={false}
            className="size-full object-cover"
          />
        ) : (
          <div
            className="flex size-full items-center justify-center font-display font-bold"
            style={{ background: '#1a1725', color, fontSize: size * 0.34 }}
          >
            {presence.name.charAt(0).toUpperCase()}
          </div>
        )}

        {presence.muted && (
          <div
            className="absolute inset-x-0 bottom-0 bg-black/75 text-center font-semibold uppercase tracking-widest text-white/70"
            style={{ fontSize: size * 0.07, padding: `${size * 0.02}px 0` }}
          >
            muted
          </div>
        )}
      </div>

      {(settings.showNames || settings.showTitles) && (
        <div
          className="mt-[4%] w-full text-center transition-opacity duration-200"
          style={{ opacity: speaking ? 1 : 0.5 }}
        >
          {settings.showNames && (
            <div
              className="truncate font-display font-semibold leading-tight"
              style={{
                fontSize: size * 0.115,
                color: speaking ? color : '#cfc9de',
                textShadow: '0 2px 6px #000, 0 0 2px #000'
              }}
            >
              {presence.name}
            </div>
          )}
          {settings.showTitles && presence.title && (
            <div
              className="truncate italic leading-tight text-white/55"
              style={{ fontSize: size * 0.075, textShadow: '0 2px 5px #000' }}
            >
              {presence.title}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
