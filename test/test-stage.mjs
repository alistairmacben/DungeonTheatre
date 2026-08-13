// Pure-logic checks for computeStage: who ends up on the stage, and lit.
import { computeStage } from './bundle/stage.mjs'

// The stage no longer knows how to turn a stored path into a URL — the host
// supplies that, so the DM app can use asset:// and players can use https.
const stageOf = (snapshot) => computeStage(snapshot, (p) => (p ? `asset://local/${p}` : null))

const results = []
const check = (name, ok) => results.push([name, ok])

const member = (id, name, over = {}) => ({
  id,
  username: name.toLowerCase(),
  displayName: name,
  avatarUrl: `https://cdn.discordapp.com/avatars/${id}/x.png`,
  speaking: false,
  muted: false,
  deafened: false,
  bot: false,
  ...over
})

const character = (id, name, over = {}) => ({
  id,
  name,
  kind: 'npc',
  title: null,
  portrait: null,
  color: '#fff',
  ...over
})

const stageSettings = (over = {}) => ({
  mode: 'novel',
  showNames: true,
  showTitles: false,
  backgroundDim: 0.25,
  dimIdle: true,
  characterScale: 0.8,
  hideGmCardWhileVoicing: true,
  ...over
})

const snap = (over = {}) => ({
  connection: {
    kind: 'mock',
    status: 'connected',
    message: null,
    channel: { id: 'c', name: 'vc', guildId: null },
    selfUserId: 'gm',
    ...(over.connection ?? {})
  },
  members: over.members ?? [],
  discordAuth: { clientId: null, hasSecret: false, hasToken: false },
  campaign: {
    name: 'test',
    characters: [],
    scenes: [{ id: 's1', name: 'Scene', background: null, npcIds: [] }],
    casting: {},
    activeSceneId: 's1',
    gmVoiceCharacterId: null,
    stage: stageSettings(),
    ...(over.campaign ?? {}),
    // Let callers override individual stage settings without restating them.
    ...(over.campaign?.stage ? { stage: stageSettings(over.campaign.stage) } : {})
  }
})

// 1. Uncast players still show up, using their Discord identity.
{
  const stage = stageOf(snap({ members: [member('u1', 'Brenna')] }))
  check('uncast member appears', stage.length === 1)
  check('uncast uses discord name', stage[0].name === 'Brenna')
  check('uncast uses discord avatar', stage[0].portraitUrl?.includes('cdn.discordapp.com'))
  check('uncast has no character', stage[0].characterId === null)
}

// 2. Cast players show their character instead.
{
  const stage = stageOf(
    snap({
      members: [member('u1', 'Brenna', { speaking: true })],
      campaign: {
        characters: [character('c1', 'Kaelen Vance', { kind: 'pc', title: 'Rogue' })],
        casting: { u1: 'c1' },
        scenes: [{ id: 's1', name: 'S', background: null, npcIds: [] }],
        activeSceneId: 's1',
        gmVoiceCharacterId: null
      }
    })
  )
  check('cast member shows character name', stage[0].name === 'Kaelen Vance')
  check('cast member carries title', stage[0].title === 'Rogue')
  check('speaking propagates to card', stage[0].speaking === true)
}

// 3. Bots never take a slot.
{
  const stage = stageOf(
    snap({ members: [member('u1', 'Brenna'), member('bot', 'Rythm', { bot: true })] })
  )
  check('bots excluded from stage', stage.length === 1)
}

// 4. GM voicing an NPC: the GM's own card is replaced, and the NPC lights up
//    when the GM talks.
{
  const stage = stageOf(
    snap({
      members: [member('gm', 'Alistair', { speaking: true }), member('u1', 'Brenna')],
      campaign: {
        characters: [character('n1', 'Innkeeper')],
        casting: {},
        scenes: [{ id: 's1', name: 'S', background: null, npcIds: [] }],
        activeSceneId: 's1',
        gmVoiceCharacterId: 'n1'
      }
    })
  )
  const names = stage.map((p) => p.name)
  check('gm own card is replaced', !names.includes('Alistair'))
  check('voiced npc is on stage', names.includes('Innkeeper'))
  check('voiced npc lights up when gm talks', stage.find((p) => p.name === 'Innkeeper').speaking === true)
  check('voiced npc flagged gmVoiced', stage.find((p) => p.name === 'Innkeeper').gmVoiced === true)
  check('other players unaffected', names.includes('Brenna'))
}

// 4b. With the toggle off, the GM stays on stage next to the NPC they voice.
{
  const stage = stageOf(
    snap({
      members: [member('gm', 'Alistair', { speaking: true })],
      campaign: {
        characters: [character('n1', 'Innkeeper'), character('c1', 'Kaelen', { kind: 'pc' })],
        casting: { gm: 'c1' },
        scenes: [{ id: 's1', name: 'S', background: null, npcIds: [] }],
        activeSceneId: 's1',
        gmVoiceCharacterId: 'n1',
        stage: { hideGmCardWhileVoicing: false }
      }
    })
  )
  const names = stage.map((p) => p.name)
  check('toggle off keeps gm character on stage', names.includes('Kaelen'))
  check('toggle off still stages the voiced npc', names.includes('Innkeeper'))
  check(
    'voiced npc still lights up with toggle off',
    stage.find((p) => p.name === 'Innkeeper').speaking === true
  )
}

// 5. Staged NPCs stand on stage silently.
{
  const stage = stageOf(
    snap({
      members: [],
      campaign: {
        characters: [character('n1', 'Statue')],
        casting: {},
        scenes: [{ id: 's1', name: 'S', background: null, npcIds: ['n1'] }],
        activeSceneId: 's1',
        gmVoiceCharacterId: null
      }
    })
  )
  check('staged npc appears with no voice channel', stage.length === 1 && stage[0].name === 'Statue')
  check('staged npc is not speaking', stage[0].speaking === false)
}

// 6. A character both staged as an NPC and cast to a live player must appear
//    once, with the live speaking state winning.
{
  const stage = stageOf(
    snap({
      members: [member('u1', 'Brenna', { speaking: true })],
      campaign: {
        characters: [character('c1', 'Kaelen')],
        casting: { u1: 'c1' },
        scenes: [{ id: 's1', name: 'S', background: null, npcIds: ['c1'] }],
        activeSceneId: 's1',
        gmVoiceCharacterId: null
      }
    })
  )
  check('no duplicate card', stage.length === 1)
  check('live speaking state wins over staged', stage[0].speaking === true)
  check('duplicate resolves to the discord user', stage[0].userId === 'u1')
}

// 7. Scene switching changes which NPCs are staged.
{
  const base = {
    members: [],
    campaign: {
      characters: [character('n1', 'Tavern Keep'), character('n2', 'Dragon')],
      casting: {},
      scenes: [
        { id: 's1', name: 'Tavern', background: null, npcIds: ['n1'] },
        { id: 's2', name: 'Lair', background: null, npcIds: ['n2'] }
      ],
      activeSceneId: 's1',
      gmVoiceCharacterId: null
    }
  }
  const tavern = stageOf(snap(base))
  const lair = stageOf(snap({ ...base, campaign: { ...base.campaign, activeSceneId: 's2' } }))
  check('scene 1 stages its own npc', tavern.length === 1 && tavern[0].name === 'Tavern Keep')
  check('scene 2 stages its own npc', lair.length === 1 && lair[0].name === 'Dragon')
}

console.log('=== CHECKS ===')
let failed = 0
for (const [name, ok] of results) {
  console.log(` ${ok ? 'PASS' : 'FAIL'}  ${name}`)
  if (!ok) failed++
}
console.log(failed === 0 ? '\nALL PASS' : `\n${failed} FAILED`)
process.exit(failed === 0 ? 0 : 1)
