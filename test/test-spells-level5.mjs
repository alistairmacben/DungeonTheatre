// Thirty-seven 5th-level spells — the full union of every class's 5th-level
// column. This is the level where the SRD tips hard toward summons, charms
// and resurrection: only five of the thirty-seven get an `effect` block.
//
// Flame Strike is the second two-damage-type spell (after Ice Storm) and the
// first where the SRD gives the caster a real upcast choice — fire or
// radiant — that the engine can't offer, since perSlotAbove only ever scales
// damage[0]. It resolves correctly at base level and is flagged partial for
// the upcast gap rather than silently favouring fire.
//
// Checked against docs/srd-source/spells.pdf via docs/srd/08b-spell-descriptions.md
// and docs/srd/08-spell-lists.md.

import {
  checkContentIntegrity, createResolution, loadContent, playerViewOf,
  resolveSpellEffect
} from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()
const spell = (id) => content.spells.get(id)

const item = (instanceId, definitionId) =>
  ({ instanceId, definitionId, contentVersion: 1, identified: true })

function caster(classId, level, abilityScoreBase, extra = {}) {
  return {
    id: 'c:x', campaignId: 'camp-1', name: 'Test', playerId: 'p',
    speciesId: 'srd:species.human',
    classLevels: [{ classId, level }],
    abilityScoreBase,
    buildChoices: [], hitPointsCurrent: 100, hitPointsTemp: 0,
    hitDiceSpent: {}, resourcesSpent: {}, conditions: [], effectInstances: [],
    exhaustionLevel: 0,
    inventory: { instances: [item('d', 'srd:weapon.dagger')], equipped: { mainHand: 'd' }, attunedInstanceIds: [] },
    deathSaves: { successes: 0, failures: 0 }, toggles: {}, spellsPrepared: [],
    selections: {}, ...extra
  }
}

const effectOf = (spellId, character, ability, slotLevel = 0) =>
  resolveSpellEffect(
    spell(spellId),
    { ability, characterLevel: character.classLevels[0].level, slotLevel },
    createResolution(character, content)
  )

// ---------------------------------------------------------------------------
// All thirty-seven exist
// ---------------------------------------------------------------------------

{
  const ids = [
    'animate-objects', 'antilife-shell', 'arcane-hand', 'awaken', 'cloudkill',
    'commune', 'commune-with-nature', 'cone-of-cold', 'conjure-elemental',
    'contact-other-plane', 'contagion', 'creation', 'dispel-evil-and-good',
    'dominate-person', 'dream', 'flame-strike', 'geas', 'greater-restoration',
    'hallow', 'hold-monster', 'insect-plague', 'legend-lore', 'mass-cure-wounds',
    'mislead', 'modify-memory', 'passwall', 'planar-binding', 'raise-dead',
    'reincarnate', 'scrying', 'seeming', 'telekinesis', 'telepathic-bond',
    'teleportation-circle', 'tree-stride', 'wall-of-force', 'wall-of-stone'
  ]
  const missing = ids.filter((n) => spell(`srd:spell.${n}`) === undefined)
  check.eq('all thirty-seven 5th-level spells exist', missing.length, 0, missing.join(', '))
}

// ---------------------------------------------------------------------------
// Flame Strike: two damage types, only the first scales with the slot
// ---------------------------------------------------------------------------

{
  const c = caster('srd:class.cleric', 9, { str: 10, dex: 10, con: 14, int: 10, wis: 16, cha: 10 })
  const base = effectOf('srd:spell.flame-strike', c, 'wis', 5)
  check.eq('flame strike: 4d6 fire at a 5th-level slot', base.damage[0].dice.count, 4)
  check.eq('flame strike: and 4d6 radiant alongside it', base.damage[1].dice.count, 4)
  check.eq('flame strike: fire type', base.damage[0].type, 'fire')
  check.eq('flame strike: radiant type', base.damage[1].type, 'radiant')

  const upcast = effectOf('srd:spell.flame-strike', c, 'wis', 7)
  check.eq('flame strike: upcasting to 7th grows the fire term by 2d6', upcast.damage[0].dice.count, 6)
  check.eq('flame strike: the radiant term never scales — still 4d6', upcast.damage[1].dice.count, 4)
}

// ---------------------------------------------------------------------------
// Damage resolves the way the rest of the set already does
// ---------------------------------------------------------------------------

{
  const c = caster('srd:class.wizard', 11, { str: 8, dex: 14, con: 14, int: 17, wis: 12, cha: 10 })
  const cloudkill = effectOf('srd:spell.cloudkill', c, 'int', 5)
  check.eq('cloudkill: a Constitution save', cloudkill.save.ability, 'con')
  check.eq('cloudkill: 5d8 poison at a 5th-level slot', cloudkill.damage[0].dice.count, 5)
  const cloudkillUp = effectOf('srd:spell.cloudkill', c, 'int', 7)
  check.eq('cloudkill: upcast to a 7th-level slot adds 2d8', cloudkillUp.damage[0].dice.count, 7)

  const cone = effectOf('srd:spell.cone-of-cold', c, 'int', 5)
  check.eq('cone of cold: 8d8 cold', cone.damage[0].dice.count, 8)

  const insects = effectOf('srd:spell.insect-plague',
    caster('srd:class.cleric', 9, { str: 10, dex: 10, con: 14, int: 10, wis: 16, cha: 10 }),
    'wis', 5)
  check.eq('insect plague: a Constitution save', insects.save.ability, 'con')
  check.eq('insect plague: 4d10 piercing', insects.damage[0].dice.count, 4)
}

// ---------------------------------------------------------------------------
// Mass Cure Wounds: the per-creature healing number resolves like Cure Wounds
// ---------------------------------------------------------------------------

{
  const c = caster('srd:class.cleric', 9, { str: 10, dex: 10, con: 14, int: 10, wis: 16, cha: 10 })
  const healed = effectOf('srd:spell.mass-cure-wounds', c, 'wis', 5)
  check.eq('mass cure wounds: 3d8 at a 5th-level slot', healed.healing.dice.count, 3)
  check.eq('mass cure wounds: plus the Wisdom modifier of +3', healed.healing.flatAdd, 3)
}

// ---------------------------------------------------------------------------
// Contagion carries a real attack roll — the disease it inflicts is the
// part with no channel, not the melee spell attack that delivers it.
// ---------------------------------------------------------------------------

{
  const cleric = caster('srd:class.cleric', 9, { str: 10, dex: 10, con: 14, int: 10, wis: 16, cha: 10 })
  const contagion = effectOf('srd:spell.contagion', cleric, 'wis', 5)
  check.eq('contagion: a real melee spell attack', contagion?.delivery, 'attack')
  check.eq('contagion: no damage of its own', contagion?.damage?.length ?? 0, 0)
}

// ---------------------------------------------------------------------------
// Partial spells still say what the player must do themselves
// ---------------------------------------------------------------------------

{
  for (const sid of [
    'srd:spell.flame-strike', 'srd:spell.mass-cure-wounds', 'srd:spell.animate-objects',
    'srd:spell.arcane-hand', 'srd:spell.awaken', 'srd:spell.conjure-elemental',
    'srd:spell.contact-other-plane', 'srd:spell.contagion', 'srd:spell.dispel-evil-and-good',
    'srd:spell.dominate-person', 'srd:spell.dream', 'srd:spell.geas',
    'srd:spell.greater-restoration', 'srd:spell.hallow', 'srd:spell.hold-monster',
    'srd:spell.modify-memory', 'srd:spell.planar-binding', 'srd:spell.raise-dead',
    'srd:spell.reincarnate', 'srd:spell.scrying', 'srd:spell.seeming',
    'srd:spell.telekinesis', 'srd:spell.wall-of-stone'
  ]) {
    const def = spell(sid)
    check(`partial: ${def.name} carries narrative explaining its gap`,
      (def.effects.narrative?.[0]?.text.length ?? 0) > 0, sid)
    check(`partial: ${def.name} is flagged partial`,
      def.effects.completeness === 'partial', sid)
  }

  // Cloudkill, Cone of Cold, Insect Plague and pure-utility spells are fully
  // resolved — none should be marked partial.
  for (const sid of [
    'srd:spell.cloudkill', 'srd:spell.cone-of-cold', 'srd:spell.insect-plague',
    'srd:spell.commune', 'srd:spell.commune-with-nature', 'srd:spell.legend-lore',
    'srd:spell.telepathic-bond', 'srd:spell.teleportation-circle', 'srd:spell.tree-stride',
    'srd:spell.antilife-shell', 'srd:spell.passwall', 'srd:spell.mislead',
    'srd:spell.wall-of-force', 'srd:spell.creation'
  ]) {
    check.eq(`complete: ${spell(sid).name} needs no caveat`,
      spell(sid).effects.completeness, 'complete')
  }
}

// ---------------------------------------------------------------------------
// The four known casters actually draw on the new spells
// ---------------------------------------------------------------------------

{
  const pool = (classId, level, abilityScoreBase, selId) => {
    const c = caster(classId, level, abilityScoreBase)
    const pending = playerViewOf(c, content, { detail: 'inspect' }).progression.pendingChoices ?? []
    return pending.find((p) => p.id.endsWith(`:${selId}`))?.from ?? []
  }
  check('bard: Greater Restoration is a known-caster option',
    pool('srd:class.bard', 9, { str: 8, dex: 14, con: 14, int: 10, wis: 10, cha: 16 }, 'spells')
      .includes('srd:spell.greater-restoration'))
  check('sorcerer: Cloudkill is a known-caster option',
    pool('srd:class.sorcerer', 9, { str: 8, dex: 14, con: 14, int: 10, wis: 10, cha: 16 }, 'spells')
      .includes('srd:spell.cloudkill'))
  check('warlock: Scrying is a known-caster option',
    pool('srd:class.warlock', 9, { str: 8, dex: 14, con: 14, int: 10, wis: 10, cha: 16 }, 'spells-known')
      .includes('srd:spell.scrying'))
  check('ranger: Tree Stride is a known-caster option',
    pool('srd:class.ranger', 20, { str: 12, dex: 16, con: 14, int: 10, wis: 15, cha: 8 }, 'spells')
      .includes('srd:spell.tree-stride'))
}

// ---------------------------------------------------------------------------
// The gate every spell passes
// ---------------------------------------------------------------------------

{
  const problems = checkContentIntegrity(content)
  const errors = problems.filter((p) => p.severity === 'error')
  check('integrity: the batch introduces no errors',
    errors.length === 0, errors.map((p) => `${p.where}: ${p.message}`).join(' | '))
}

check.report()
