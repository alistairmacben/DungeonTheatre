import { computeStage, type AssetResolver } from '@shared/stage'
import type { DiceRoll } from '@shared/dice'
import type { AppSnapshot } from '@shared/types'
import { DiceLayer } from './DiceLayer'
import { ErrorBoundary } from './ErrorBoundary'
import { CANVAS_H, CANVAS_W } from './layout'
import { useFitScale } from './useFitScale'
import { StageCanvas } from './StageCanvas'
import { NovelStage } from './NovelStage'
import { CardStage } from './CardStage'

/**
 * The stage, with no idea who is hosting it.
 *
 * The DM's Electron window and the players' web app both render exactly this,
 * differing only in where the snapshot comes from and how asset paths resolve.
 * Keeping it one component is what guarantees the DM's preview and what the
 * table sees cannot drift apart.
 */
export function StageView({
  snapshot,
  resolveAsset,
  idleMessage,
  roll,
  diceBottomInset = 0
}: {
  snapshot: AppSnapshot
  resolveAsset: AssetResolver
  idleMessage?: string
  /** Latest dice roll to play over the scene. */
  roll?: DiceRoll | null
  /** Bottom pixels the host covers with its own chrome, so dice clear it. */
  diceBottomInset?: number
}): React.JSX.Element {
  const { ref, scale } = useFitScale()

  const presences = computeStage(snapshot, resolveAsset)
  const settings = snapshot.campaign.stage
  const scene = snapshot.campaign.scenes.find((s) => s.id === snapshot.campaign.activeSceneId)

  return (
    <div ref={ref} className="relative grid h-full w-full place-items-center overflow-hidden bg-black">
      <StageCanvas
        scale={scale}
        width={CANVAS_W}
        height={CANVAS_H}
        background={resolveAsset(scene?.background ?? null)}
        dim={settings.backgroundDim}
        effect={scene?.effect ?? 'none'}
        effectIntensity={scene?.effectIntensity ?? 0.5}
      >
        {presences.length === 0 ? (
          <div className="grid size-full place-items-center">
            <p
              className="font-display text-6xl text-white/20"
              style={{ textShadow: '0 4px 16px #000' }}
            >
              {idleMessage ??
                (snapshot.connection.status === 'connected'
                  ? 'The table is quiet…'
                  : 'Awaiting the party')}
            </p>
          </div>
        ) : settings.mode === 'novel' ? (
          <NovelStage presences={presences} settings={settings} />
        ) : (
          <CardStage presences={presences} settings={settings} />
        )}
      </StageCanvas>

      {/*
        Dice sit over the stage rather than inside it. Inside, they were scaled
        along with the artwork — so the result shrank on a small window — and
        their stacking order was trapped in the canvas's own context, which put
        the number the player just rolled *underneath* the HUD.

        Dice are also a flourish: if the renderer fails — no WebGL, a driver
        quirk — the scene must carry on without them.
      */}
      <ErrorBoundary label="dice" fallback={null}>
        <DiceLayer roll={roll ?? null} bottomInset={diceBottomInset} />
      </ErrorBoundary>
    </div>
  )
}
