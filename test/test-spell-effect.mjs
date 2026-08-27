// Spell effects — what a spell does when it lands.
//
// The claim: a damage spell now surfaces a preview a player reads and hands the
// DM structured damage, exactly as a weapon does — and the two scaling axes
// (cantrip growth by character level, upcasting by slot) resolve correctly and
// independently. Nothing is applied to a target; there are no targets.

import {
  applyCommand, createResolution, loadContent, playerViewOf, resolveSpellEffect
} from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()
const spell = (id) => content.spells.get(id)

const item = (instanceId, definitionId) =>
  ({ instanceId, definitionId, contentVersion: 1, identified: true })

// A wizard, so cantrip scaling has a character level to read, and slots to upcast.
function wizard(level, prepared = []) {
  return {
    id: 'c:w', campaignId: 'camp-1', name: 'Ilyana', playerId: 'p',
    speciesId: 'srd:species.elf', subspeciesId: 'srd:species.elf.high',
    classLevels: [{ classId: 'srd:class.wizard', level }],
    abilityScoreBase: { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 },
    buildChoices: [], hitPointsCurrent: 20, hitPointsTemp: 0,
    hitDiceSpent: {}, resourcesSpent: {}, conditions: [], effectInstances: [],
    exhaustionLevel: 0,
    inventory: { instances: [item('d', 'srd:weapon.dagger')], equipped: { mainHand: 'd' }, attunedInstanceIds: [] },
    deathSaves: { successes: 0, failures: 0 }, toggles: {},
    // Cantrips are chosen now rather than named by the class, so a fixture
    // that casts Fire Bolt has to have picked it.
    selections: {
      'srd:class.wizard.spellcasting': {
        cantrips: [
          'srd:spell.fire-bolt', 'srd:spell.ray-of-frost', 'srd:spell.prestidigitation'
        ]
      }
    },
    spellsPrepared: prepared
  }
}

const effectOf = (spellId, character, slotLevel) =>
  resolveSpellEffect(
    spell(spellId),
    { ability: 'int', characterLevel: character.classLevels[0].level, slotLevel },
    createResolution(character, content)
  )

// ---------------------------------------------------------------------------
// A spell with no one-shot effect resolves to nothing, as before
// ---------------------------------------------------------------------------

{
  check('none: a pure-narrative spell has no resolved effect',
    effectOf('srd:spell.detect-magic', wizard(5), 1) === undefined)
  check('none: Mage Armor, a buff, likewise has none',
    effectOf('srd:spell.mage-armor', wizard(5), 1) === undefined)
}

// ---------------------------------------------------------------------------
// Cantrip scaling by character level — the axis that is NOT the slot
// ---------------------------------------------------------------------------

{
  const l1 = effectOf('srd:spell.fire-bolt', wizard(1), 0)
  check('cantrip: Fire Bolt is 1d10 at level 1',
    l1.damage[0].dice.count === 1 && l1.damage[0].dice.sides === 10, JSON.stringify(l1.damage))
  // Level 1: proficiency +2, Intelligence 17 (16 + High Elf) → +3. So +5.
  check('cantrip: it is a spell attack, and carries the attack bonus',
    l1.delivery === 'attack' && l1.attackBonus === 5, `${l1.delivery} ${l1.attackBonus}`)
  check('cantrip: its label reads the way a weapon preview does',
    l1.label === '1d10 fire', l1.label)

  check('cantrip: 2d10 at level 5', effectOf('srd:spell.fire-bolt', wizard(5), 0).damage[0].dice.count === 2)
  check('cantrip: 3d10 at level 11', effectOf('srd:spell.fire-bolt', wizard(11), 0).damage[0].dice.count === 3)
  check('cantrip: 4d10 at level 17', effectOf('srd:spell.fire-bolt', wizard(17), 0).damage[0].dice.count === 4)
  check('cantrip: still 3d10 at level 16, not yet 17',
    effectOf('srd:spell.fire-bolt', wizard(16), 0).damage[0].dice.count === 3)
}

// ---------------------------------------------------------------------------
// A save spell surfaces its DC and ability, and has no attack bonus
// ---------------------------------------------------------------------------

{
  const cleric = {
    ...wizard(5), id: 'c:c', speciesId: 'srd:species.human', subspeciesId: undefined,
    classLevels: [{ classId: 'srd:class.cleric', level: 5 }],
    abilityScoreBase: { str: 12, dex: 10, con: 14, int: 10, wis: 16, cha: 12 }
  }
  const e = resolveSpellEffect(
    spell('srd:spell.sacred-flame'),
    { ability: 'wis', characterLevel: 5, slotLevel: 0 },
    createResolution(cleric, content)
  )
  check('save: Sacred Flame is a save, not an attack', e.delivery === 'save')
  check('save: against Dexterity', e.save.ability === 'dex')
  // 8 + prof 3 + WIS 3 = 14.
  check('save: with the caster\'s own DC', e.save.dc === 14, e.save.dc)
  check('save: success negates rather than halves', e.save.onSuccess === 'none')
  check('save: no attack bonus on a save spell', e.attackBonus === undefined)
  check('save: cantrip scaling still applies — 2d8 at level 5',
    e.damage[0].dice.count === 2, e.damage[0].dice.count)
}

// ---------------------------------------------------------------------------
// Upcasting by slot — the axis that is NOT character level
// ---------------------------------------------------------------------------

{
  const w = wizard(5)
  const base = effectOf('srd:spell.magic-missile', w, 1)
  check('upcast: Magic Missile is auto damage, no roll needed',
    base.delivery === 'auto')
  check('upcast: three darts at 1st level', base.instances === 3, base.instances)
  check('upcast: each 1d4+1 force',
    base.damage[0].dice.sides === 4 && base.damage[0].dice.modifier === 1
      && base.damage[0].type === 'force')
  check('upcast: the label shows the darts explicitly',
    base.label === '3 × 1d4+1 force', base.label)

  check('upcast: four darts from a 2nd-level slot',
    effectOf('srd:spell.magic-missile', w, 2).instances === 4)
  check('upcast: five from a 3rd-level slot',
    effectOf('srd:spell.magic-missile', w, 3).instances === 5)
  // Character level must NOT affect Magic Missile — it is not a cantrip.
  check('upcast: level 17 does not add darts, only slots do',
    effectOf('srd:spell.magic-missile', wizard(17), 1).instances === 3)
}

// ---------------------------------------------------------------------------
// Healing folds in the spellcasting modifier and upcasts its dice
// ---------------------------------------------------------------------------

{
  const cleric = {
    ...wizard(5), id: 'c:h', speciesId: 'srd:species.human', subspeciesId: undefined,
    classLevels: [{ classId: 'srd:class.cleric', level: 5 }],
    abilityScoreBase: { str: 12, dex: 10, con: 14, int: 10, wis: 16, cha: 12 }
  }
  const heal = (slot) => resolveSpellEffect(
    spell('srd:spell.cure-wounds'),
    { ability: 'wis', characterLevel: 5, slotLevel: slot },
    createResolution(cleric, content)
  )
  const l1 = heal(1)
  check('heal: Cure Wounds heals rather than damages',
    l1.healing !== undefined && l1.damage.length === 0)
  check('heal: 1d8 at 1st level', l1.healing.dice.count === 1)
  check('heal: plus the caster\'s Wisdom modifier of +3',
    l1.healing.flatAdd === 3, l1.healing.flatAdd)
  check('heal: the label reads heal 1d8+3', l1.label === 'heal 1d8+3', l1.label)
  check('heal: a 3rd-level slot heals 3d8 + mod',
    heal(3).healing.dice.count === 3, heal(3).healing.dice.count)
  check('heal: the flat modifier does not scale with the slot',
    heal(3).healing.flatAdd === 3)

  // The same spell on a bard uses Charisma, because addSpellMod reads the grant
  // ability, not a hard-coded one.
  const bard = {
    ...cleric, id: 'c:b', classLevels: [{ classId: 'srd:class.bard', level: 5 }],
    abilityScoreBase: { str: 8, dex: 14, con: 12, int: 10, wis: 10, cha: 16 }
  }
  const bardHeal = resolveSpellEffect(
    spell('srd:spell.cure-wounds'),
    { ability: 'cha', characterLevel: 5, slotLevel: 1 },
    createResolution(bard, content)
  )
  check('heal: the same definition uses Charisma for a bard',
    bardHeal.healing.flatAdd === 3, bardHeal.healing.flatAdd)
}

// ---------------------------------------------------------------------------
// The view surfaces the preview, and the cast event carries the effect
// ---------------------------------------------------------------------------

{
  const w = wizard(5, ['srd:spell.magic-missile'])
  const view = playerViewOf(w, content, { detail: 'inspect' })

  const fireBolt = view.actions.find((a) => a.id === 'cast:srd:spell.fire-bolt')
  check('view: a damage cantrip shows a damage preview like a weapon does',
    fireBolt?.preview?.damageLabel === '2d10 fire', fireBolt?.preview?.damageLabel)
  check('view: with the spell attack bonus',
    fireBolt?.preview?.attackBonusDisplay === '+6', fireBolt?.preview?.attackBonusDisplay)

  const missile = view.actions.find((a) => a.id === 'cast:srd:spell.magic-missile')
  check('view: an auto-damage spell shows its darts', missile?.preview?.damageLabel === '3 × 1d4+1 force',
    missile?.preview?.damageLabel)

  const detect = view.actions.find((a) => a.id === 'cast:srd:spell.detect-magic')
  check('view: a pure-narrative spell shows no damage preview',
    detect !== undefined && detect.preview?.damageLabel === undefined)

  // The Spells tab is the primary caster surface, so SpellView carries the
  // effect too — not only the cast ActionView.
  const sc = view.spellcasting
  const fbSpell = sc.spells.find((s) => s.label === 'Fire Bolt')
  check('view: SpellView carries the effect preview for the Spells tab',
    fbSpell?.effectPreview?.label === '2d10 fire', fbSpell?.effectPreview?.label)
  check('view: with the attack bonus for an attack spell',
    fbSpell?.effectPreview?.attackBonusDisplay === '+6', fbSpell?.effectPreview?.attackBonusDisplay)
  const mmSpell = sc.spells.find((s) => s.label === 'Magic Missile')
  check('view: an auto spell has a label but no attack bonus',
    mmSpell?.effectPreview?.label === '3 × 1d4+1 force'
      && mmSpell?.effectPreview?.attackBonusDisplay === undefined)
  const mageArmor = sc.spells.find((s) => s.label === 'Mage Armor')
  check('view: a buff spell has no effect preview at all',
    mageArmor !== undefined && mageArmor.effectPreview === undefined)

  // The cast event carries structured damage for the DM to apply in one click.
  const cast = applyCommand(w, { type: 'castSpell', characterId: w.id, spellId: 'srd:spell.magic-missile' }, content)
  const spellCast = cast.events.find((e) => e.type === 'SpellCast')
  check('cast: the SpellCast event carries the resolved effect',
    spellCast?.payload?.effect !== undefined)
  check('cast: with the darts and their damage type intact',
    spellCast.payload.effect.instances === 3
      && spellCast.payload.effect.damage[0].type === 'force')
  check('cast: and a human summary for the DM to read',
    spellCast.payload.effect.summary === '3 × 1d4+1 force', spellCast.payload.effect.summary)
}

check.report()
