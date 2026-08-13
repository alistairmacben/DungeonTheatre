import { EMPTY_SNAPSHOT, type AppSnapshot } from '@shared/types'
import { CHARACTER_COLORS, defaultScene, type SceneEffect } from '@shared/campaign'

/**
 * A fake party used by `?demo=N` so the stage can be designed and reviewed in
 * a plain browser tab, with no Electron bridge and no Discord. N sets the
 * head-count so the auto-layout can be eyeballed at every size.
 */
const NAMES: Array<[string, string]> = [
  ['Kaelen Vance', 'Half-elf Rogue'],
  ['Brenna Stormcloak', 'Dwarf Cleric'],
  ['Sorrel Ashdown', 'Tiefling Warlock'],
  ['Thorne Blackwood', 'Human Fighter'],
  ['Mira Quillfeather', 'Gnome Bard'],
  ['Garrick Stone', 'Goliath Barbarian'],
  ['Ysolde', 'Innkeeper'],
  ['Vexis the Grey', 'Archmage'],
  ['Fenwick', 'Stableboy'],
  ['Lady Amaranth', 'Noble']
]

export function demoSnapshot(count: number, effect: SceneEffect = 'none'): AppSnapshot {
  const n = Math.max(1, Math.min(count, NAMES.length))
  const characters = NAMES.slice(0, n).map(([name, title], i) => ({
    id: `demo-${i}`,
    name,
    title,
    kind: i < 6 ? ('pc' as const) : ('npc' as const),
    portrait: null,
    color: CHARACTER_COLORS[i % CHARACTER_COLORS.length]!
  }))

  return {
    ...EMPTY_SNAPSHOT,
    connection: {
      kind: 'mock',
      status: 'connected',
      message: null,
      channel: { id: 'demo', name: 'demo', guildId: null },
      selfUserId: null
    },
    members: characters.map((c, i) => ({
      id: `demo-user-${i}`,
      username: c.name,
      displayName: c.name,
      avatarUrl: null,
      // Light up a couple so both states are visible side by side.
      speaking: i === 0 || i === 3,
      muted: i === 2,
      deafened: false,
      bot: false
    })),
    campaign: {
      ...EMPTY_SNAPSHOT.campaign,
      characters,
      scenes: [{ ...defaultScene('demo-scene', 'Demo'), effect, effectIntensity: 0.6 }],
      activeSceneId: 'demo-scene',
      casting: Object.fromEntries(characters.map((c, i) => [`demo-user-${i}`, c.id]))
    }
  }
}
