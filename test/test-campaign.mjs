// Loading a campaign written by an older build must not lose data or crash.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const dir = path.join(os.tmpdir(), 'dungeon-stage-test', 'campaign')
fs.mkdirSync(dir, { recursive: true })

// A campaign as written before stage settings and scene effects existed.
const legacy = {
  name: 'Curse of Strahd',
  characters: [
    { id: 'c1', name: 'Kaelen', kind: 'pc', title: 'Rogue', portrait: 'kaelen.png', color: '#e0a458' }
  ],
  scenes: [
    { id: 's1', name: 'Village of Barovia', background: 'village.png', npcIds: ['c1'] },
    { id: 's2', name: 'Castle Ravenloft', background: null, npcIds: [] }
  ],
  casting: { '1001': 'c1' },
  activeSceneId: 's2',
  gmVoiceCharacterId: 'c1'
}
fs.writeFileSync(path.join(dir, 'campaign.json'), JSON.stringify(legacy))

const { CampaignStore } = await import('./bundle/store.mjs')
const store = new CampaignStore()
const loaded = store.load()

const results = []
const check = (name, ok) => results.push([name, ok])

check('campaign name preserved', loaded.name === 'Curse of Strahd')
check('characters preserved', loaded.characters.length === 1 && loaded.characters[0].name === 'Kaelen')
check('portrait path preserved', loaded.characters[0].portrait === 'kaelen.png')
// Ids are rewritten to UUIDs on load, so the invariant worth asserting is
// that each reference still resolves to the same *entity*, not that the
// literal id survived.
const byId = (id) => loaded.characters.find((c) => c.id === id)
const sceneById = (id) => loaded.scenes.find((s) => s.id === id)

check('casting still resolves to Kaelen', byId(loaded.casting['1001'])?.name === 'Kaelen')
check(
  'active scene still resolves to Castle Ravenloft',
  sceneById(loaded.activeSceneId)?.name === 'Castle Ravenloft'
)
check('gm voice still resolves to Kaelen', byId(loaded.gmVoiceCharacterId)?.name === 'Kaelen')
check('scenes preserved', loaded.scenes.length === 2)
check('scene background preserved', loaded.scenes[0].background === 'village.png')
check('staged npc still resolves to Kaelen', byId(loaded.scenes[0].npcIds[0])?.name === 'Kaelen')

// New fields must be filled in with defaults rather than left undefined.
check('stage settings added', typeof loaded.stage === 'object' && loaded.stage !== null)
check('stage mode defaulted', loaded.stage.mode === 'novel')
check('hideGmCardWhileVoicing defaulted', loaded.stage.hideGmCardWhileVoicing === true)
check('backgroundDim defaulted', typeof loaded.stage.backgroundDim === 'number')
check('scene effect defaulted on every scene', loaded.scenes.every((s) => s.effect === 'none'))
check(
  'scene effectIntensity defaulted on every scene',
  loaded.scenes.every((s) => typeof s.effectIntensity === 'number')
)

// Legacy ids must become UUIDs, with every reference repointed. Getting this
// wrong would silently orphan casting, staged NPCs, or the active scene.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const kaelen = loaded.characters.find((c) => c.name === 'Kaelen')

check('character id rewritten to uuid', UUID_RE.test(kaelen.id))
check('scene ids rewritten to uuid', loaded.scenes.every((s) => UUID_RE.test(s.id)))
check('casting repointed to the new character id', loaded.casting['1001'] === kaelen.id)
check('staged npc repointed', loaded.scenes[0].npcIds[0] === kaelen.id)
check('gm voice repointed', loaded.gmVoiceCharacterId === kaelen.id)
check(
  'active scene repointed to the same scene',
  loaded.activeSceneId === loaded.scenes[1].id && UUID_RE.test(loaded.activeSceneId)
)
check('no legacy ids survive anywhere', !JSON.stringify(loaded).includes('char-') && !JSON.stringify(loaded).includes('scene-'))
check('cloud bookkeeping initialised', loaded.cloud && loaded.cloud.campaignId === null)

// Re-loading an already-migrated campaign must not churn the ids again.
fs.writeFileSync(path.join(dir, 'campaign.json'), JSON.stringify(loaded))
const storeAgain = new (await import('./bundle/store.mjs')).CampaignStore()
const second = storeAgain.load()
check('migration is idempotent', second.characters[0].id === kaelen.id)
check('idempotent for scenes too', second.scenes[1].id === loaded.activeSceneId)

// A corrupt file must not throw.
fs.writeFileSync(path.join(dir, 'campaign.json'), '{ this is not json')
const store2 = new CampaignStore()
let threw = false
let recovered = null
try {
  recovered = store2.load()
} catch {
  threw = true
}
check('corrupt campaign does not throw', !threw)
check('corrupt campaign falls back to a usable default', recovered?.scenes?.length >= 1)

console.log('=== CHECKS ===')
let failed = 0
for (const [name, ok] of results) {
  console.log(` ${ok ? 'PASS' : 'FAIL'}  ${name}`)
  if (!ok) failed++
}
console.log(failed === 0 ? '\nALL PASS' : `\n${failed} FAILED`)
process.exit(failed === 0 ? 0 : 1)
