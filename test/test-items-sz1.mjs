// Magic items, catalogue section S-Z, part 1 — Scarab of Protection through
// Talisman of the Sphere, including the Staffs sub-table and the ten-tier
// Spell Scroll table.
//
// Checked against docs/srd/10-magic-items.md §11 (Catalogue: S-Z, part 1).

import { checkContentIntegrity, createResolution, loadContent, playerViewOf } from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()
const itemDef = (id) => content.items.get(id)

const item = (instanceId, definitionId) =>
  ({ instanceId, definitionId, contentVersion: 1, identified: true })

function wizard(instances = [], equipped = {}, attunedInstanceIds = [], toggles = {}) {
  return {
    id: 'c:x', campaignId: 'camp-1', name: 'Test', playerId: 'p',
    speciesId: 'srd:species.human',
    classLevels: [{ classId: 'srd:class.wizard', level: 5 }],
    abilityScoreBase: { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 },
    buildChoices: [], hitPointsCurrent: 100, hitPointsTemp: 0,
    hitDiceSpent: {}, resourcesSpent: {}, conditions: [], effectInstances: [],
    exhaustionLevel: 0,
    inventory: { instances, equipped, attunedInstanceIds },
    deathSaves: { successes: 0, failures: 0 }, toggles,
    spellsPrepared: [], selections: {}
  }
}

// ---------------------------------------------------------------------------
// All items exist
// ---------------------------------------------------------------------------

{
  const ids = [
    'scarab-of-protection', 'scimitar-of-speed', 'shield-plus-1', 'shield-plus-2',
    'shield-plus-3', 'shield-of-missile-attraction', 'slippers-of-spider-climbing',
    'stone-of-good-luck', 'sovereign-glue', 'spell-scroll-0', 'spell-scroll-1',
    'spell-scroll-2', 'spell-scroll-3', 'spell-scroll-4', 'spell-scroll-5',
    'spell-scroll-6', 'spell-scroll-7', 'spell-scroll-8', 'spell-scroll-9',
    'spellguard-shield', 'sphere-of-annihilation', 'stone-of-controlling-earth-elementals',
    'sun-blade', 'sword-of-life-stealing', 'sword-of-sharpness', 'sword-of-wounding',
    'talisman-of-the-sphere', 'talisman-of-pure-good', 'talisman-of-ultimate-evil',
    'staff-of-charming', 'staff-of-fire', 'staff-of-frost', 'staff-of-healing',
    'staff-of-striking', 'staff-of-swarming-insects', 'staff-of-the-python',
    'staff-of-the-woodlands', 'staff-of-thunder-and-lightning', 'staff-of-withering',
    'staff-of-power', 'staff-of-the-magi'
  ]
  const missing = ids.filter((n) => itemDef(`srd:item.${n}`) === undefined)
  check.eq('all catalogue-S-Z-part-1 items exist', missing.length, 0, missing.join(', '))
}

// ---------------------------------------------------------------------------
// Shield +1/+2/+3: complete — a shield's own +2 plus a flat magic bonus
// ---------------------------------------------------------------------------

{
  for (const tier of [1, 2, 3]) {
    const c = wizard([item('i-shield', `srd:item.shield-plus-${tier}`)], { shield: 'i-shield' })
    const bare = wizard([])
    check.eq(`shield +${tier}: AC = unarmoured AC + 2 (shield) + ${tier} (magic)`,
      playerViewOf(c, content, { detail: 'inspect' }).vitals.armorClass.value,
      playerViewOf(bare, content, { detail: 'inspect' }).vitals.armorClass.value + 2 + tier)
    check.eq(`shield +${tier}: complete, no caveat needed`,
      itemDef(`srd:item.shield-plus-${tier}`).effects.completeness, 'complete')
  }
}

// ---------------------------------------------------------------------------
// Stone of Good Luck: +1 to ability checks and saving throws, generically
// ---------------------------------------------------------------------------

{
  const withStone = wizard([item('i-stone', 'srd:item.stone-of-good-luck')], {}, ['i-stone'])
  const without = wizard([])
  const rWith = createResolution(withStone, content)
  const rWithout = createResolution(without, content)
  check.eq('stone of good luck: +1 to check.roll',
    rWith.stat('check.roll').total, rWithout.stat('check.roll').total + 1)
  check.eq('stone of good luck: +1 to save.roll',
    rWith.stat('save.roll').total, rWithout.stat('save.roll').total + 1)
  check.eq('stone of good luck: complete, no caveat needed',
    itemDef('srd:item.stone-of-good-luck').effects.completeness, 'complete')
}

// ---------------------------------------------------------------------------
// Slippers of Spider Climbing: climb speed equal to walking speed
// ---------------------------------------------------------------------------

{
  const c = wizard([item('i-slip', 'srd:item.slippers-of-spider-climbing')], { boots: 'i-slip' }, ['i-slip'])
  const r = createResolution(c, content)
  check.eq('slippers of spider climbing: climb speed = walk speed',
    r.stat('speed.climb').total, r.stat('speed.walk').total)
}

// ---------------------------------------------------------------------------
// Scarab of Protection: advantage on saves against spells, 12 charges, never
// ---------------------------------------------------------------------------

{
  const def = itemDef('srd:item.scarab-of-protection')
  check.eq('scarab of protection: 12 charges', def.charges.max, 12)
  check.eq('scarab of protection: never refreshes on its own', def.charges.refresh.kind, 'never')

  const c = wizard([item('i-scarab', 'srd:item.scarab-of-protection')], {}, ['i-scarab'])
  const view = playerViewOf(c, content, { detail: 'inspect' })
  const save = (view.saves ?? []).find((s) => s.ability === 'wis')
  check('scarab of protection: advantage on saves against spells present in some rollable form',
    def.effects.modifiers.some((m) => m.channel === 'roll' && m.rollOp === 'advantage'
      && m.scope?.kinds?.includes('save') && m.scope?.againstTags?.includes('spell')))
}

// ---------------------------------------------------------------------------
// Staffs: passive weapon/AC/save/spell-attack bonuses are real
// ---------------------------------------------------------------------------

{
  const striking = wizard(
    [item('i-staff', 'srd:item.staff-of-striking')], { mainHand: 'i-staff' }, ['i-staff'],
    { 'item.staff-of-striking': true }
  )
  const r = createResolution(striking, content)
  check.eq('staff of striking: +3 to attack rolls when toggled on',
    r.stat('attack.roll').total, 3)

  const power = wizard(
    [item('i-power', 'srd:item.staff-of-power')], { mainHand: 'i-power' }, ['i-power']
  )
  const rPower = createResolution(power, content)
  const rNone = createResolution(wizard([]), content)
  check.eq('staff of power: +2 AC while held',
    playerViewOf(power, content, { detail: 'inspect' }).vitals.armorClass.value,
    playerViewOf(wizard([]), content, { detail: 'inspect' }).vitals.armorClass.value + 2)
  check.eq('staff of power: +2 to saves while held',
    rPower.stat('save.roll').total, rNone.stat('save.roll').total + 2)
  check.eq('staff of power: +2 to spell attack rolls while held',
    rPower.stat('spell.attack').total, rNone.stat('spell.attack').total + 2)

  const magi = wizard([item('i-magi', 'srd:item.staff-of-the-magi')], { mainHand: 'i-magi' }, ['i-magi'])
  check.eq('staff of the magi: +2 to spell attack rolls while held',
    createResolution(magi, content).stat('spell.attack').total, rNone.stat('spell.attack').total + 2)

  const fireDef = itemDef('srd:item.staff-of-fire')
  const fireWearer = wizard([item('i-fire', 'srd:item.staff-of-fire')], { mainHand: 'i-fire' }, ['i-fire'])
  check('staff of fire: resistant to fire',
    (playerViewOf(fireWearer, content, { detail: 'inspect' }).defenses ?? [])
      .some((d) => d.type === 'fire' && d.state === 'resistant'))
  check.eq('staff of fire: 10 charges, dawn refresh', fireDef.charges.max, 10)
  check.eq('staff of fire: dawn refresh kind', fireDef.charges.refresh.kind, 'dawn')

  check.eq('staff of the python: no charges (transformation, not a charge track)',
    itemDef('srd:item.staff-of-the-python').charges, undefined)

  check.eq('staff of the magi: legendary, 50 charges', itemDef('srd:item.staff-of-the-magi').charges.max, 50)
}

// ---------------------------------------------------------------------------
// Spell Scroll: ten tiers, each with the SRD's fixed DC and attack bonus
// ---------------------------------------------------------------------------

{
  const scroll5 = itemDef('srd:item.spell-scroll-5')
  check('spell scroll (5th level): narrative names the correct DC and attack bonus',
    scroll5.effects.narrative[0].text.includes('DC 17') && scroll5.effects.narrative[0].text.includes('+9'))
  const scroll9 = itemDef('srd:item.spell-scroll-9')
  check('spell scroll (9th level): narrative names the correct DC and attack bonus',
    scroll9.effects.narrative[0].text.includes('DC 19') && scroll9.effects.narrative[0].text.includes('+11'))
}

// ---------------------------------------------------------------------------
// Partial items still say what the DM must do themselves
// ---------------------------------------------------------------------------

{
  for (const id of [
    'srd:item.scarab-of-protection', 'srd:item.scimitar-of-speed',
    'srd:item.shield-of-missile-attraction', 'srd:item.slippers-of-spider-climbing',
    'srd:item.spellguard-shield',
    'srd:item.sun-blade', 'srd:item.talisman-of-pure-good', 'srd:item.talisman-of-ultimate-evil',
    'srd:item.staff-of-charming', 'srd:item.staff-of-fire', 'srd:item.staff-of-frost',
    'srd:item.staff-of-healing', 'srd:item.staff-of-striking', 'srd:item.staff-of-swarming-insects',
    'srd:item.staff-of-the-python', 'srd:item.staff-of-the-woodlands',
    'srd:item.staff-of-thunder-and-lightning', 'srd:item.staff-of-withering',
    'srd:item.staff-of-power', 'srd:item.staff-of-the-magi'
  ]) {
    const def = itemDef(id)
    check(`partial: ${def.name} carries narrative explaining its gap`,
      (def.effects.narrative?.[0]?.text.length ?? 0) > 0, id)
    check(`partial: ${def.name} is flagged partial`,
      def.effects.completeness === 'partial', id)
  }

  for (const id of [
    'srd:item.shield-plus-1', 'srd:item.shield-plus-2', 'srd:item.shield-plus-3',
    'srd:item.stone-of-good-luck', 'srd:item.stone-of-controlling-earth-elementals',
    'srd:item.sovereign-glue', 'srd:item.sphere-of-annihilation',
    'srd:item.sword-of-life-stealing', 'srd:item.sword-of-sharpness', 'srd:item.sword-of-wounding',
    'srd:item.talisman-of-the-sphere'
  ]) {
    check.eq(`complete: ${itemDef(id).name} needs no caveat`,
      itemDef(id).effects.completeness, 'complete')
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
