// Phase J stress test — every class, level 1 through 20, a different
// species/subspecies per class for real race/class variety.
//
// Not a targeted unit test (test-levelup.mjs already covers the mechanism
// precisely); this simulates an actual playthrough — dispatch `levelUp`,
// answer every pending choice `levelUp` reveals, repeat to 20 — looking for
// anything that only shows up deep in a real leveling arc: a crash at a
// specific level, HP going backwards, a choice that can never be answered,
// a subclass/feat/ASI interaction nothing else exercises.
//
// Checked against docs/roadmap.md Phase J.

import {
  applyCommand, checkContentIntegrity, createResolution, loadContent, playerViewOf
} from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()

// One species/subspecies per class — between them, every species and
// subspecies in the SRD content set gets exercised at least once.
const COMBOS = [
  ['srd:class.fighter', 'srd:species.dwarf', 'srd:species.dwarf.hill', 'str'],
  ['srd:class.wizard', 'srd:species.elf', 'srd:species.elf.high', 'int'],
  ['srd:class.rogue', 'srd:species.halfling', 'srd:species.halfling.lightfoot', 'dex'],
  ['srd:class.cleric', 'srd:species.human', undefined, 'wis'],
  ['srd:class.barbarian', 'srd:species.half-orc', undefined, 'str'],
  ['srd:class.bard', 'srd:species.half-elf', undefined, 'cha'],
  ['srd:class.warlock', 'srd:species.tiefling', undefined, 'cha'],
  ['srd:class.druid', 'srd:species.elf', 'srd:species.elf.wood', 'wis'],
  ['srd:class.monk', 'srd:species.human', undefined, 'dex'],
  ['srd:class.paladin', 'srd:species.dwarf', 'srd:species.dwarf.hill', 'str'],
  ['srd:class.sorcerer', 'srd:species.tiefling', undefined, 'cha'],
  ['srd:class.ranger', 'srd:species.half-elf', undefined, 'dex']
]

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha']

function baseFor(primary) {
  const order = [primary, 'con', ...ABILITIES.filter((a) => a !== primary && a !== 'con')]
  const array = [15, 14, 13, 12, 10, 8]
  const out = {}
  order.forEach((a, i) => { out[a] = array[i] })
  return out
}

function seed(classId, speciesId, subspeciesId, primary) {
  return {
    id: `c:sweep:${classId}`, campaignId: 'camp-1', name: 'Sweep', playerId: 'p',
    speciesId, ...(subspeciesId ? { subspeciesId } : {}),
    classLevels: [{ classId, level: 1 }],
    abilityScoreBase: baseFor(primary),
    buildChoices: [], hitPointsCurrent: 1, hitPointsTemp: 0,
    hitDiceSpent: {}, resourcesSpent: {}, conditions: [], effectInstances: [],
    exhaustionLevel: 0,
    inventory: { instances: [], equipped: {}, attunedInstanceIds: [] },
    deathSaves: { successes: 0, failures: 0 }, toggles: {}, spellsPrepared: [],
    selections: {}
  }
}

const hpMax = (c) => createResolution(c, content).stat('hitPoints.max').total
const view = (c) => playerViewOf(c, content, { detail: 'inspect' })

function answerOne(c, choice, level, tookFeat) {
  if (choice.kind === 'subclass') {
    return {
      cmd: { type: 'answerBuildChoice', characterId: c.id, atLevel: choice.atLevel, kind: 'subclass', value: (choice.from ?? [])[0] },
      tookFeat
    }
  }
  if (choice.kind === 'abilityScoreImprovement') {
    if (!tookFeat) {
      return {
        cmd: { type: 'answerBuildChoice', characterId: c.id, atLevel: choice.atLevel, kind: 'feat', value: 'srd:feat.tough' },
        tookFeat: true
      }
    }
    const a = ABILITIES[level % ABILITIES.length]
    return {
      cmd: { type: 'answerBuildChoice', characterId: c.id, atLevel: choice.atLevel, kind: 'abilityScoreImprovement', value: { [a]: 2 } },
      tookFeat
    }
  }
  // A feature's own "choose N" — take the first N offered. A selection with
  // no enumerated `from` genuinely has none in the SRD ("any language", "any
  // tool") — freeform placeholder text, same as the UI's own text-input
  // fallback for the identical case. 'ability' is the one open-ended kind
  // with real semantics downstream (Resilient reads the answer back as an
  // ability id), so it draws from the real six rather than placeholder text.
  const values = choice.from
    ? choice.from.slice(0, choice.count)
    : choice.kind === 'ability'
      ? ABILITIES.slice(0, choice.count)
      : Array.from({ length: choice.count }, (_, i) => `sweep-choice-${choice.id}-${i}`)
  return {
    cmd: {
      type: 'answerSelection', characterId: c.id,
      sourceId: choice.id.split(':').slice(0, -1).join(':'),
      selectionId: choice.id.split(':').at(-1),
      values
    },
    tookFeat
  }
}

for (const [classId, speciesId, subspeciesId, primary] of COMBOS) {
  let c = seed(classId, speciesId, subspeciesId, primary)
  c.hitPointsCurrent = hpMax(c)
  let prevMax = c.hitPointsCurrent
  let tookFeat = false
  const failures = []

  for (let level = 2; level <= 20 && failures.length === 0; level++) {
    const r = applyCommand(c, { type: 'levelUp', characterId: c.id, classId }, content)
    if (r.rejected) {
      failures.push(`level ${level}: levelUp rejected — ${r.rejected.reasons.join('; ')}`)
      break
    }
    c = r.character

    const newMax = hpMax(c)
    if (newMax < prevMax) failures.push(`level ${level}: HP max fell ${prevMax} -> ${newMax}`)
    prevMax = newMax

    // Answer everything levelUp just revealed, looping in case answering
    // one choice at this level (a subclass) makes another visible.
    for (let guard = 0; guard < 15; guard++) {
      const pending = view(c).progression.pendingChoices
      if (pending.length === 0) break
      let progressed = false
      for (const choice of pending) {
        const { cmd, tookFeat: nextTookFeat } = answerOne(c, choice, level, tookFeat)
        const ar = applyCommand(c, cmd, content)
        if (ar.rejected) {
          failures.push(`level ${level}: answering "${choice.prompt}" rejected — ${ar.rejected.reasons.join('; ')}`)
          continue
        }
        c = ar.character
        tookFeat = nextTookFeat
        progressed = true
      }
      if (!progressed) {
        failures.push(`level ${level}: pending choices stuck — ${pending.map((p) => p.prompt).join('; ')}`)
        break
      }
    }
  }

  const finalView = view(c)
  check.eq(`${classId}: reaches level 20`, c.classLevels[0].level, 20)
  check.eq(`${classId}: every pending choice was answered by level 20`,
    finalView.progression.pendingChoices.length, 0,
    JSON.stringify(finalView.progression.pendingChoices))
  check(`${classId}: no failures across the level 1-20 sweep`, failures.length === 0, failures.join(' | '))

  // A spot-check that HP actually grew a lot, not just "didn't shrink" —
  // 20 levels of a real hit die should be a large multiple of level 1.
  check(`${classId}: HP max at 20 is well above HP max at 1`,
    hpMax(c) > 5 * hpMax(seed(classId, speciesId, subspeciesId, primary)),
    `${hpMax(c)} vs 5x level-1 (${5 * hpMax(seed(classId, speciesId, subspeciesId, primary))})`)
}

// ---------------------------------------------------------------------------
// The gate every sweep passes
// ---------------------------------------------------------------------------

{
  const problems = checkContentIntegrity(content)
  const errors = problems.filter((p) => p.severity === 'error')
  check('integrity: the sweep introduces no errors',
    errors.length === 0, errors.map((p) => `${p.where}: ${p.message}`).join(' | '))
}

check.report()
