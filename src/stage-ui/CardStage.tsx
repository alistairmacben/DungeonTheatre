import type { StageSettings } from '@shared/campaign'
import type { StagePresence } from '@shared/stage'
import { computeLayout, STAGE_GAP } from './layout'
import { PortraitCard } from './PortraitCard'

/** The framed-portrait grid. Good when your art is square headshots. */
export function CardStage({
  presences,
  settings
}: {
  presences: StagePresence[]
  settings: StageSettings
}): React.JSX.Element {
  const { cols, size } = computeLayout(presences.length)

  return (
    <div className="grid size-full place-items-center">
      <div
        className="grid place-items-end justify-center"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${size}px)`,
          gap: STAGE_GAP,
          padding: 60
        }}
      >
        {presences.map((presence) => (
          <PortraitCard
            key={presence.key}
            presence={presence}
            size={size}
            settings={settings}
          />
        ))}
      </div>
    </div>
  )
}
