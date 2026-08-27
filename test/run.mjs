// Bundles the main-process modules under test (stubbing Electron) and runs
// the integration suites. No test framework — these are protocol and timing
// checks that need real sockets and real clocks.
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdirSync } from 'node:fs'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const bundleDir = join(here, 'bundle')
const stub = join(here, 'electron-stub.mjs')

mkdirSync(bundleDir, { recursive: true })

const esbuild = await import('esbuild')

for (const [src, out] of [
  ['src/main/discord/DiscordRpcSource.ts', 'DiscordRpcSource.mjs'],
  ['src/main/hub.ts', 'hub.mjs'],
  ['src/shared/stage.ts', 'stage.mjs'],
  ['src/stage-ui/layout.ts', 'layout.mjs'],
  ['src/main/campaign/store.ts', 'store.mjs'],
  ['src/shared/dice.ts', 'dice.mjs'],
  ['src/engine.ts', 'engine.mjs']
]) {
  await esbuild.build({
    entryPoints: [join(root, src)],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: join(bundleDir, out),
    alias: { electron: stub },
    // sharp is a native module and supabase-js is large; both resolve fine
    // from node_modules at runtime and neither survives ESM bundling cleanly.
    external: ['sharp', '@supabase/supabase-js'],
    logLevel: 'error'
  })
}

let failed = 0
for (const suite of [
  'test-rpc.mjs',
  'test-hub.mjs',
  'test-stage.mjs',
  'test-layout.mjs',
  'test-campaign.mjs',
  'test-dice.mjs',
  'test-rules-operations.mjs',
  'test-rules-resolution.mjs',
  'test-rules-character.mjs',
  'test-view-contract.mjs',
  'test-spellcasting.mjs',
  'test-session.mjs',
  'test-persistence.mjs',
  'test-new-classes.mjs',
  'test-projection.mjs',
  'test-authority.mjs',
  'test-creation.mjs',
  'test-spell-effect.mjs',
  'test-level-tables.mjs',
  'test-content-integrity.mjs',
  'test-monk.mjs',
  'test-subclass.mjs',
  'test-fighter.mjs',
  'test-wizard.mjs',
  'test-cleric.mjs',
  'test-bard.mjs',
  'test-rogue.mjs',
  'test-sorcerer.mjs',
  'test-bard-known-spells.mjs',
  'test-roll-damage.mjs'
]) {
  console.log(`\n───── ${suite} ─────`)
  try {
    execFileSync(process.execPath, [join(here, suite)], { stdio: 'inherit' })
  } catch {
    failed++
  }
}

if (failed) {
  console.error(`\n${failed} suite(s) failed`)
  process.exit(1)
}
console.log('\nAll suites passed.')
