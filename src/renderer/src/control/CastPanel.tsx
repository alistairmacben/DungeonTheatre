import { assetUrl } from '@shared/assets'
import { CHARACTER_COLORS } from '@shared/campaign'
import type { AppSnapshot } from '@shared/types'
import { send } from '../shared/useSnapshot'

/**
 * Maps the people in the voice channel onto characters. Uncast players still
 * appear on stage as their Discord selves, so this is an upgrade rather than
 * a prerequisite.
 */
export function CastPanel({ snapshot }: { snapshot: AppSnapshot }): React.JSX.Element {
  const { members, campaign, connection } = snapshot
  const characters = campaign.characters
  const humans = members.filter((m) => !m.bot)

  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">
        Casting — who plays whom
      </h2>

      {humans.length === 0 ? (
        <p className="text-sm text-white/35">Connect to a voice channel to cast your players.</p>
      ) : (
        <ul className="space-y-2">
          {humans.map((member) => {
            const castId = campaign.casting[member.id] ?? ''
            const character = characters.find((c) => c.id === castId)
            const isGm = member.id === connection.selfUserId

            return (
              <li
                key={member.id}
                className={`flex items-center gap-3 rounded-lg border p-2.5 transition ${
                  member.speaking ? 'border-emerald-400/70 bg-emerald-400/10' : 'border-ink-line bg-ink-soft'
                }`}
              >
                <img
                  src={member.avatarUrl ?? undefined}
                  alt=""
                  className={`size-9 shrink-0 rounded-full bg-ink-line object-cover ring-2 ${
                    member.speaking ? 'ring-emerald-400' : 'ring-transparent'
                  }`}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm">{member.displayName}</span>
                    {isGm && (
                      <span className="rounded bg-ember/20 px-1.5 py-px text-[10px] font-semibold uppercase text-ember">
                        you
                      </span>
                    )}
                    {member.muted && <span className="text-[10px] text-white/30">muted</span>}
                  </div>
                  <span className="text-xs text-white/35">
                    {character ? `plays ${character.name}` : 'showing Discord avatar'}
                  </span>
                </div>

                <select
                  value={castId}
                  onChange={(e) =>
                    send({
                      type: 'cast:set',
                      discordUserId: member.id,
                      characterId: e.target.value || null
                    })
                  }
                  className="w-40 shrink-0 rounded-md border border-ink-line bg-ink px-2 py-1.5 text-xs outline-none focus:border-ember/60"
                >
                  <option value="">— uncast —</option>
                  {characters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <button
                  title="Create a character from this player"
                  onClick={() =>
                    send({
                      type: 'character:add',
                      name: member.displayName,
                      kind: 'pc',
                      fromDiscordUserId: member.id
                    })
                  }
                  className="shrink-0 rounded-md border border-ink-line px-2 py-1.5 text-xs text-white/60 hover:border-ember/60 hover:text-ember"
                >
                  + new
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <CharacterList snapshot={snapshot} />
    </section>
  )
}

function CharacterList({ snapshot }: { snapshot: AppSnapshot }): React.JSX.Element {
  const { campaign } = snapshot
  const scene = campaign.scenes.find((s) => s.id === campaign.activeSceneId)

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-white/40">
          Characters &amp; NPCs
        </h2>
        <button
          onClick={() => send({ type: 'character:add', name: 'New NPC', kind: 'npc' })}
          className="rounded-md border border-ink-line px-2 py-1 text-xs text-white/60 hover:border-ember/60 hover:text-ember"
        >
          + NPC
        </button>
      </div>

      {campaign.characters.length === 0 ? (
        <p className="text-sm text-white/35">
          No characters yet. Use “+ new” next to a player, or add an NPC.
        </p>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-2.5">
          {campaign.characters.map((character) => {
            const onStage = scene?.npcIds.includes(character.id) ?? false
            const gmVoicing = campaign.gmVoiceCharacterId === character.id
            const portrait = assetUrl(character.portrait)

            return (
              <li
                key={character.id}
                className="rounded-lg border border-ink-line bg-ink-soft p-2.5"
                style={{ borderLeft: `3px solid ${character.color}` }}
              >
                <div className="flex gap-2.5">
                  <button
                    onClick={() => send({ type: 'character:pickPortrait', id: character.id })}
                    title="Choose portrait"
                    className="size-14 shrink-0 overflow-hidden rounded-md border border-ink-line bg-ink text-[10px] text-white/40 hover:border-ember/60"
                  >
                    {portrait ? (
                      <img src={portrait} alt="" className="size-full object-cover" />
                    ) : (
                      'set art'
                    )}
                  </button>

                  <div className="min-w-0 flex-1 space-y-1">
                    <input
                      value={character.name}
                      onChange={(e) =>
                        send({
                          type: 'character:update',
                          id: character.id,
                          patch: { name: e.target.value }
                        })
                      }
                      className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-sm outline-none hover:border-ink-line focus:border-ember/60"
                    />
                    <input
                      value={character.title ?? ''}
                      placeholder="title, e.g. Half-elf Rogue"
                      onChange={(e) =>
                        send({
                          type: 'character:update',
                          id: character.id,
                          patch: { title: e.target.value || null }
                        })
                      }
                      className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-xs text-white/45 outline-none hover:border-ink-line focus:border-ember/60"
                    />
                  </div>
                </div>

                <label className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-white/30">size</span>
                  <input
                    type="range"
                    min={0.6}
                    max={1.4}
                    step={0.05}
                    value={character.scale ?? 1}
                    onChange={(e) =>
                      send({
                        type: 'character:update',
                        id: character.id,
                        patch: { scale: Number(e.target.value) }
                      })
                    }
                    className="h-1 flex-1 accent-[var(--color-ember)]"
                  />
                  <span className="w-8 text-right text-[10px] tabular-nums text-white/35">
                    {Math.round((character.scale ?? 1) * 100)}%
                  </span>
                </label>

                <div className="mt-2 flex flex-wrap items-center gap-1">
                  {CHARACTER_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() =>
                        send({ type: 'character:update', id: character.id, patch: { color } })
                      }
                      className={`size-4 rounded-full ring-1 ${
                        character.color === color ? 'ring-white' : 'ring-transparent'
                      }`}
                      style={{ background: color }}
                    />
                  ))}

                  <div className="ml-auto flex gap-1">
                    {character.kind === 'npc' && scene && (
                      <button
                        onClick={() =>
                          send({
                            type: 'scene:toggleNpc',
                            sceneId: scene.id,
                            characterId: character.id
                          })
                        }
                        className={`rounded px-1.5 py-0.5 text-[11px] ${
                          onStage ? 'bg-ember/25 text-ember' : 'text-white/40 hover:text-white/70'
                        }`}
                      >
                        {onStage ? 'on stage' : 'stage'}
                      </button>
                    )}
                    <button
                      title="Speak as this character"
                      onClick={() =>
                        send({
                          type: 'gmVoice:set',
                          characterId: gmVoicing ? null : character.id
                        })
                      }
                      className={`rounded px-1.5 py-0.5 text-[11px] ${
                        gmVoicing ? 'bg-arcane/30 text-arcane' : 'text-white/40 hover:text-white/70'
                      }`}
                    >
                      {gmVoicing ? 'voicing' : 'voice'}
                    </button>
                    <button
                      onClick={() => send({ type: 'character:remove', id: character.id })}
                      className="rounded px-1.5 py-0.5 text-[11px] text-white/25 hover:text-rose-300"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
