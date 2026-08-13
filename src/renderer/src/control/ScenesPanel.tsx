import { assetUrl } from '@shared/assets'
import { SCENE_EFFECTS, type SceneEffect } from '@shared/campaign'
import type { AppSnapshot } from '@shared/types'
import { send } from '../shared/useSnapshot'

export function ScenesPanel({ snapshot }: { snapshot: AppSnapshot }): React.JSX.Element {
  const { campaign } = snapshot

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-white/40">Scenes</h2>
        <button
          onClick={() => send({ type: 'scene:add', name: 'New Scene' })}
          className="rounded-md border border-ink-line px-2 py-1 text-xs text-white/60 hover:border-ember/60 hover:text-ember"
        >
          + Scene
        </button>
      </div>

      <ul className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
        {campaign.scenes.map((scene) => {
          const active = scene.id === campaign.activeSceneId
          const background = assetUrl(scene.background)

          return (
            <li
              key={scene.id}
              className={`overflow-hidden rounded-lg border transition ${
                active ? 'border-ember shadow-[0_0_0_1px] shadow-ember/40' : 'border-ink-line'
              }`}
            >
              <button
                onClick={() => send({ type: 'scene:activate', id: scene.id })}
                className="relative block h-28 w-full bg-ink-soft"
              >
                {background ? (
                  <img src={background} alt="" className="size-full object-cover" />
                ) : (
                  <span className="grid size-full place-items-center text-xs text-white/25">
                    no background
                  </span>
                )}
                {active && (
                  <span className="absolute left-2 top-2 rounded bg-ember px-1.5 py-0.5 text-[10px] font-bold uppercase text-ink">
                    live
                  </span>
                )}
              </button>

              <div className="flex items-center gap-1 p-2">
                <input
                  value={scene.name}
                  onChange={(e) =>
                    send({ type: 'scene:update', id: scene.id, patch: { name: e.target.value } })
                  }
                  className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm outline-none hover:border-ink-line focus:border-ember/60"
                />
                <button
                  onClick={() => send({ type: 'scene:pickBackground', id: scene.id })}
                  className="shrink-0 rounded border border-ink-line px-1.5 py-0.5 text-[11px] text-white/55 hover:border-ember/60 hover:text-ember"
                >
                  art
                </button>
                {campaign.scenes.length > 1 && (
                  <button
                    onClick={() => send({ type: 'scene:remove', id: scene.id })}
                    className="shrink-0 rounded px-1 py-0.5 text-[11px] text-white/25 hover:text-rose-300"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="border-t border-ink-line p-2 pt-2">
                <div className="flex flex-wrap gap-1">
                  {SCENE_EFFECTS.map((fx) => (
                    <button
                      key={fx.id}
                      onClick={() =>
                        send({
                          type: 'scene:update',
                          id: scene.id,
                          patch: { effect: fx.id as SceneEffect }
                        })
                      }
                      className={`rounded px-1.5 py-0.5 text-[11px] transition ${
                        scene.effect === fx.id
                          ? 'bg-arcane/30 text-arcane'
                          : 'text-white/35 hover:text-white/70'
                      }`}
                    >
                      {fx.label}
                    </button>
                  ))}
                </div>

                {scene.effect !== 'none' && (
                  <label className="mt-1.5 flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-white/30">
                      strength
                    </span>
                    <input
                      type="range"
                      min={0.1}
                      max={1}
                      step={0.05}
                      value={scene.effectIntensity}
                      onChange={(e) =>
                        send({
                          type: 'scene:update',
                          id: scene.id,
                          patch: { effectIntensity: Number(e.target.value) }
                        })
                      }
                      className="h-1 flex-1 accent-[var(--color-arcane)]"
                    />
                  </label>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
