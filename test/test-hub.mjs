// Verifies the Hub's speaking-release hold: a stop must NOT clear the
// speaking flag immediately, and a new start inside the window must cancel
// the pending release entirely (that's what stops mid-sentence flicker).
import { Hub } from './bundle/hub.mjs'

const hub = new Hub()
const timeline = []
const t0 = Date.now()
hub.on('snapshot', (s) => {
  const talking = s.members.filter((m) => m.speaking).map((m) => m.id)
  timeline.push({ at: Date.now() - t0, talking: talking.join(',') })
})

hub.selectSource('mock')
await hub.connect()

const speakingNow = () => {
  const m = hub.getSnapshot().members.find((x) => x.id === 'mock-2')
  return m.speaking
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const results = []
const check = (name, ok) => results.push([name, ok])

// 1. start -> immediately speaking
hub.mockSetSpeaking('mock-2', true)
check('start flips speaking on at once', speakingNow() === true)

// 2. stop -> still speaking during the hold window
hub.mockSetSpeaking('mock-2', false)
check('stop does not clear immediately', speakingNow() === true)
await wait(150)
check('still held 150ms after stop', speakingNow() === true)

// 3. a new start inside the window cancels the release
hub.mockSetSpeaking('mock-2', true)
await wait(500)
check('restart inside window cancels release', speakingNow() === true)

// 4. a genuine stop clears after the hold elapses
hub.mockSetSpeaking('mock-2', false)
await wait(200)
check('still held at 200ms', speakingNow() === true)
await wait(300)
check('cleared after full hold (~350ms)', speakingNow() === false)

// 5. no snapshot storm: the whole sequence should be a handful of publishes
const speakingChanges = timeline.filter((e, i) => i === 0 || e.talking !== timeline[i - 1].talking)
check('only real transitions published', speakingChanges.length <= 4)

await hub.disconnect()

console.log('=== SPEAKING TRANSITIONS ===')
for (const e of speakingChanges) console.log(`  t+${String(e.at).padStart(4)}ms  talking=[${e.talking}]`)

console.log('\n=== CHECKS ===')
let failed = 0
for (const [name, ok] of results) {
  console.log(` ${ok ? 'PASS' : 'FAIL'}  ${name}`)
  if (!ok) failed++
}
console.log(failed === 0 ? '\nALL PASS' : `\n${failed} FAILED`)
process.exit(failed === 0 ? 0 : 1)
