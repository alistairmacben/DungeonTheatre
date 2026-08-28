// Magic items, catalogue section C — the third batch of the SRD's ~347-item
// magic-item list. Cloak of Protection was authored in an earlier pass
// (src/content/srd.ts) and isn't repeated here.
//
// This section leans on finite, non-recharging charge pools (Chime of
// Opening's ten uses) via `refresh: { kind: 'never' }`, and a dice-valued
// dawn refresh (Cube of Force's 1d20) that had gone unused until now.
//
// Checked against docs/srd/10-magic-items.md §8 (Catalogue: C).

import { checkContentIntegrity, createResolution, loadContent, playerViewOf } from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()
const itemDef = (id) => content.items.get(id)

const item = (instanceId, definitionId) =>
  ({ instanceId, definitionId, contentVersion: 1, identified: true })

function wizard(inventory, toggles = {}) {
  return {
    id: 'c:x', campaignId: 'camp-1', name: 'Test', playerId: 'p',
    speciesId: 'srd:species.human',
    classLevels: [{ classId: 'srd:class.wizard', level: 5 }],
    abilityScoreBase: { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 },
    buildChoices: [], hitPointsCurrent: 100, hitPointsTemp: 0,
    hitDiceSpent: {}, resourcesSpent: {}, conditions: [], effectInstances: [],
    exhaustionLevel: 0,
    inventory, deathSaves: { successes: 0, failures: 0 }, toggles,
    spellsPrepared: [], selections: {}
  }
}

// ---------------------------------------------------------------------------
// All nineteen exist
// ---------------------------------------------------------------------------

{
  const ids = [
    'candle-of-invocation', 'cape-of-the-mountebank', 'carpet-of-flying',
    'censer-of-controlling-air-elementals', 'chime-of-opening', 'circlet-of-blasting',
    'cloak-of-arachnida', 'cloak-of-displacement', 'cloak-of-elvenkind',
    'cloak-of-the-bat', 'cloak-of-the-manta-ray', 'crystal-ball', 'cube-of-force',
    'cubic-gate', 'dagger-of-venom', 'dancing-sword', 'decanter-of-endless-water',
    'deck-of-illusions', 'deck-of-many-things'
  ]
  const missing = ids.filter((n) => itemDef(`srd:item.${n}`) === undefined)
  check.eq('all nineteen catalogue-C items exist', missing.length, 0, missing.join(', '))
}

// ---------------------------------------------------------------------------
// Cloak of Arachnida: real resistance and a dynamic climbing speed
// ---------------------------------------------------------------------------

{
  const spun = wizard({
    instances: [item('i-cloak', 'srd:item.cloak-of-arachnida')],
    equipped: { cloak: 'i-cloak' }, attunedInstanceIds: ['i-cloak']
  })
  const view = playerViewOf(spun, content, { detail: 'inspect' })
  check('cloak of arachnida: resistant to poison',
    (view.defenses ?? []).some((d) => d.type === 'poison' && d.state === 'resistant'))

  const r = createResolution(spun, content)
  check.eq('cloak of arachnida: climbing speed equals walking speed',
    r.stat('speed.climb').total, r.stat('speed.walk').total)
}

// ---------------------------------------------------------------------------
// Cloak of Displacement: Blur's exact modifier
// ---------------------------------------------------------------------------

{
  const displaced = wizard({
    instances: [item('i-cloak', 'srd:item.cloak-of-displacement')],
    equipped: { cloak: 'i-cloak' }, attunedInstanceIds: ['i-cloak']
  })
  const def = itemDef('srd:item.cloak-of-displacement')
  check('cloak of displacement: disadvantage for everyone attacking it',
    def.effects.modifiers.some((m) =>
      m.channel === 'roll' && m.rollOp === 'disadvantage' && m.appliesTo === 'attackersAgainstSelf'))
}

// ---------------------------------------------------------------------------
// Cloak of Elvenkind and Cloak of the Manta Ray: toggle-gated real modifiers
// ---------------------------------------------------------------------------

{
  const hoodDown = wizard({
    instances: [item('i-cloak', 'srd:item.cloak-of-elvenkind')],
    equipped: { cloak: 'i-cloak' }, attunedInstanceIds: ['i-cloak']
  })
  check.eq('cloak of elvenkind: no advantage with the hood down',
    playerViewOf(hoodDown, content, { detail: 'inspect' }).skills.find((s) => s.id === 'stealth').rollState, 'normal')

  const hoodUp = wizard({
    instances: [item('i-cloak', 'srd:item.cloak-of-elvenkind')],
    equipped: { cloak: 'i-cloak' }, attunedInstanceIds: ['i-cloak']
  }, { 'item.cloak-of-elvenkind.hood-up': true })
  check.eq('cloak of elvenkind: advantage on Stealth with the hood up',
    playerViewOf(hoodUp, content, { detail: 'inspect' }).skills.find((s) => s.id === 'stealth').rollState, 'advantage')

  const swimming = wizard({
    instances: [item('i-cloak', 'srd:item.cloak-of-the-manta-ray')],
    equipped: { cloak: 'i-cloak' }, attunedInstanceIds: []
  }, { 'item.cloak-of-the-manta-ray.hood-up': true })
  check.eq('cloak of the manta ray: 60-foot swim speed with the hood up',
    createResolution(swimming, content).stat('speed.swim').total, 60)
}

// ---------------------------------------------------------------------------
// Dagger of Venom: a toggle-gated attack and damage bonus, plus a real
// once-per-dawn charge for the coating
// ---------------------------------------------------------------------------

{
  const def = itemDef('srd:item.dagger-of-venom')
  check.eq('dagger of venom: one venom coating, refreshing at dawn',
    def.charges.max, 1)
  check.eq('dagger of venom: dawn refresh', def.charges.refresh.kind, 'dawn')
  check('dagger of venom: +1 to attack, gated on the toggle',
    def.effects.modifiers.some((m) => m.target === 'attack.roll' && m.condition?.playerToggle === 'item.dagger-of-venom'))
}

// ---------------------------------------------------------------------------
// Finite charge pools that never recharge
// ---------------------------------------------------------------------------

{
  check.eq('chime of opening: ten uses', itemDef('srd:item.chime-of-opening').charges.max, 10)
  check.eq('chime of opening: never recharges', itemDef('srd:item.chime-of-opening').charges.refresh.kind, 'never')
  check.eq('deck of illusions: thirty-four cards', itemDef('srd:item.deck-of-illusions').charges.max, 34)
  check.eq('deck of illusions: never recharges', itemDef('srd:item.deck-of-illusions').charges.refresh.kind, 'never')
}

// ---------------------------------------------------------------------------
// Dice-valued dawn refresh
// ---------------------------------------------------------------------------

{
  const cube = itemDef('srd:item.cube-of-force')
  check.eq('cube of force: 36 charges', cube.charges.max, 36)
  check.eq('cube of force: regains 1d20 daily', cube.charges.refresh.amount.sides, 20)

  const gate = itemDef('srd:item.cubic-gate')
  check.eq('cubic gate: 3 charges', gate.charges.max, 3)
  check.eq('cubic gate: regains 1d3 daily', gate.charges.refresh.amount.sides, 3)
}

// ---------------------------------------------------------------------------
// Partial items still say what the DM must do themselves
// ---------------------------------------------------------------------------

{
  for (const id of [
    'srd:item.cloak-of-arachnida', 'srd:item.cloak-of-displacement',
    'srd:item.cloak-of-elvenkind', 'srd:item.cloak-of-the-bat',
    'srd:item.cloak-of-the-manta-ray', 'srd:item.dagger-of-venom',
    'srd:item.chime-of-opening', 'srd:item.cube-of-force', 'srd:item.cubic-gate',
    'srd:item.deck-of-illusions', 'srd:item.candle-of-invocation',
    'srd:item.cape-of-the-mountebank', 'srd:item.carpet-of-flying',
    'srd:item.censer-of-controlling-air-elementals', 'srd:item.circlet-of-blasting',
    'srd:item.crystal-ball', 'srd:item.dancing-sword', 'srd:item.decanter-of-endless-water',
    'srd:item.deck-of-many-things'
  ]) {
    const def = itemDef(id)
    check(`partial: ${def.name} carries narrative explaining its gap`,
      (def.effects.narrative?.[0]?.text.length ?? 0) > 0, id)
    check(`partial: ${def.name} is flagged partial`,
      def.effects.completeness === 'partial', id)
  }
}

// ---------------------------------------------------------------------------
// The gate every item passes
// ---------------------------------------------------------------------------

{
  const problems = checkContentIntegrity(content)
  const errors = problems.filter((p) => p.severity === 'error')
  check('integrity: the batch introduces no errors',
    errors.length === 0, errors.map((p) => `${p.where}: ${p.message}`).join(' | '))
}

check.report()
