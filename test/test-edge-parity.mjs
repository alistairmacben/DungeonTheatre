// The deployed engine is the same engine.
//
// `supabase/functions/command` does not import the engine from source — it
// imports `_shared/engine.mjs`, a bundle produced by `npm run build:edge` and
// deliberately gitignored. Nothing forced that rebuild, so the bundle could
// silently fall behind `src/` and the server would go on running an older set
// of rules than the client predicts with.
//
// It had. When this test was written the bundle was seven days stale: it
// contained no `levelUp`, `answerBuildChoice` or `answerSelection` at all, so
// every Phase J command worked in the local Solo harness and would have been
// refused by the real server as "not a state transition" — the client and the
// authority disagreeing about what the game even allows.
//
// This asserts behaviour rather than text: it drives the command list from
// `applyCommand`'s own switch in source, then dispatches each one *into the
// bundle* and fails on the unknown-command branch.

import { readFileSync, existsSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const BUNDLE = join(root, 'supabase/functions/_shared/engine.mjs')

if (!existsSync(BUNDLE)) {
  check('edge bundle exists — run `npm run build:edge`', false, BUNDLE)
  check.report()
  process.exit(1)
}

// The authoritative list: every command `applyCommand` actually handles.
// Driven from source rather than from the PlayerCommand union, because the
// union also carries commands the reducer deliberately does not handle
// (`transferItem` is a two-party export, `dmOverride` has no transition).
const source = readFileSync(join(root, 'src/view/commands.ts'), 'utf8')
const handled = [...source.matchAll(/case '([a-zA-Z]+)':\s*return/g)].map((m) => m[1])

check(`source declares a healthy number of commands (${handled.length})`, handled.length > 20)

const edge = await import(`file://${BUNDLE.replace(/\\/g, '/')}`)
const content = edge.loadContent()

const character = {
  id: 'c:edge', campaignId: 'camp-1', name: 'Edge', playerId: 'p',
  speciesId: 'srd:species.human',
  classLevels: [{ classId: 'srd:class.fighter', level: 5 }],
  abilityScoreBase: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
  buildChoices: [], hitPointsCurrent: 30, hitPointsTemp: 0,
  hitDiceSpent: {}, resourcesSpent: {}, conditions: [], effectInstances: [],
  exhaustionLevel: 0,
  inventory: { instances: [], equipped: {}, attunedInstanceIds: [] },
  deathSaves: { successes: 0, failures: 0 }, toggles: {}, spellsPrepared: [],
  selections: {}
}

// ---------------------------------------------------------------------------
// Every command the source handles, the deployed bundle also handles
// ---------------------------------------------------------------------------

{
  const unknown = []
  for (const type of handled) {
    let result
    try {
      result = edge.applyCommand(character, { type, characterId: character.id }, content)
    } catch {
      // A throw means the command reached its handler and tripped over the
      // deliberately minimal payload — which is proof it is *known*, and the
      // only thing under test here.
      continue
    }
    const reasons = result?.rejected?.reasons ?? []
    if (reasons.some((r) => r.includes('not a state transition'))) unknown.push(type)
  }

  check.eq('every command the reducer handles exists in the deployed bundle',
    unknown.length, 0,
    unknown.length > 0
      ? `stale bundle — missing: ${unknown.join(', ')}. Run \`npm run build:edge\`.`
      : '')
}

// ---------------------------------------------------------------------------
// The deployed content set matches the local one
//
// The same staleness hid content, not just commands: the seven-day-old bundle
// predated the whole S-Z magic-item catalogue and the artifacts section, so a
// server-side item lookup would have missed items the client could see.
// ---------------------------------------------------------------------------

{
  const local = (await import('./bundle/engine.mjs')).loadContent()
  for (const kind of ['spells', 'items', 'classes', 'species', 'subclasses', 'feats']) {
    check.eq(`deployed ${kind} count matches local`, content[kind].size, local[kind].size,
      'stale bundle — run `npm run build:edge`')
  }
}

// ---------------------------------------------------------------------------
// A staleness hint, so a failure above reads as "rebuild" not "mystery"
// ---------------------------------------------------------------------------

{
  const bundleAge = statSync(BUNDLE).mtimeMs
  const newestSource = ['src/view/commands.ts', 'src/rules/resolve.ts', 'src/content/index.ts']
    .map((p) => statSync(join(root, p)).mtimeMs)
    .reduce((a, b) => Math.max(a, b), 0)
  check('the bundle is no older than the engine source it is built from',
    bundleAge >= newestSource,
    `bundle built ${new Date(bundleAge).toISOString()}, source changed `
      + `${new Date(newestSource).toISOString()} — run \`npm run build:edge\``)
}

check.report()
