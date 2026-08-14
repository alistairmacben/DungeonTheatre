// One character, completely mechanically coherent.
//
// Sir Aldren: hill dwarf fighter 5, chain mail, shield, longsword, a cloak of
// protection, the Tough feat, poisoned, and a temporary effect. Every number
// below is produced by the resolver and inspected through its breakdown — the
// point is not that the arithmetic is right but that the whole chain
//
//   species → class → feat → equipment → condition → temporary effect
//     → derived stat → check / attack → result
//
// runs through one vocabulary with no bespoke branches anywhere.

import {
  createResolution, resolveCheck, resolvePassiveCheck, resolveAttack,
  applyAttackOutcome, applyOutcome, resolveResources, applyRest,
  checkStatValueInvariants, validateCharacter
} from './bundle/rules.mjs'
import { loadContent } from './bundle/content.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()

// ---------------------------------------------------------------------------
// The character — inputs only. Nothing derived is stored.
// ---------------------------------------------------------------------------

function sirAldren(overrides = {}) {
  return {
    id: 'char:aldren',
    campaignId: 'camp-1',
    name: 'Sir Aldren',
    playerId: 'player-1',
    speciesId: 'srd:species.dwarf',
    subspeciesId: 'srd:species.dwarf.hill',
    classLevels: [{ classId: 'srd:class.fighter', level: 5 }],
    // 14 STR, 12 DEX, 13 CON (+2 dwarf = 15), 10 INT, 12 WIS (+1 hill = 13), 8 CHA
    abilityScoreBase: { str: 14, dex: 12, con: 13, int: 10, wis: 12, cha: 8 },
    buildChoices: [{ atLevel: 4, kind: 'feat', value: 'srd:feat.tough' }],
    hitPointsCurrent: 44,
    hitPointsTemp: 0,
    hitDiceSpent: {},
    resourcesSpent: {},
    conditions: [],
    effectInstances: [],
    exhaustionLevel: 0,
    inventory: {
      instances: [
        { instanceId: 'i-mail', definitionId: 'srd:armor.chain-mail', contentVersion: 1, identified: true },
        { instanceId: 'i-shield', definitionId: 'srd:armor.shield', contentVersion: 1, identified: true },
        { instanceId: 'i-sword', definitionId: 'srd:weapon.longsword', contentVersion: 1, identified: true },
        { instanceId: 'i-cloak', definitionId: 'srd:item.cloak-of-protection', contentVersion: 1, identified: true },
        { instanceId: 'i-bow', definitionId: 'srd:weapon.longbow', contentVersion: 1, identified: true },
        { instanceId: 'i-flamefang', definitionId: 'dm:weapon.flamefang', contentVersion: 1, identified: true }
      ],
      equipped: { armor: 'i-mail', shield: 'i-shield', mainHand: 'i-sword', cloak: 'i-cloak' },
      attunedInstanceIds: ['i-cloak']
    },
    deathSaves: { successes: 0, failures: 0 },
    toggles: { 'wearing-armor': true },
    ...overrides
  }
}

const R = (c = sirAldren()) => createResolution(c, content)

check('character: state validates', validateCharacter(sirAldren()).length === 0)

// ---------------------------------------------------------------------------
// 1. Ability modifiers
// ---------------------------------------------------------------------------

{
  const r = R()
  check.eq('ability: CON 13 + 2 from dwarf = 15', r.stat('ability.con.score').total, 15)
  check.eq('ability: CON modifier is +2', r.stat('ability.con.modifier').total, 2)
  check.eq('ability: WIS 12 + 1 from hill dwarf = 13', r.stat('ability.wis.score').total, 13)
  check.eq('ability: STR modifier is +2', r.stat('ability.str.modifier').total, 2)
  const con = r.stat('ability.con.score')
  check('ability: the species increase is named in the breakdown',
    con.terms.some((t) => t.sourceId === 'srd:species.dwarf' && t.applied))
}

// ---------------------------------------------------------------------------
// 2. Proficiency bonus and derived stats
// ---------------------------------------------------------------------------

{
  const r = R()
  check.eq('proficiency bonus: level 5 gives +3', r.stat('proficiencyBonus').total, 3)

  // Chain mail 16 (heavy: no Dex) + shield 2 + Defense fighting style 1
  // + cloak of protection 1 = 20.
  const ac = r.stat('armorClass')
  check.eq('AC: chain mail + shield + Defense + cloak = 20', ac.total, 20)
  check('AC: the unarmoured base lost to chain mail and says so',
    ac.terms.some((t) => t.value === 10 && !t.applied && t.reason.includes('Chain Mail')))
  check('AC: heavy armour suppressed the Dexterity term',
    ac.terms.some((t) => t.stage === 'suppressed' && t.reason.includes('Chain Mail')))
  check('AC: every discarded term explains itself',
    checkStatValueInvariants(ac).length === 0)

  // Fighter d10: 4 + 6/level + CON/level, + 1/level dwarven toughness,
  // + 2/level Tough = 5×6 + 4 + 5×2 + 5 + 10 = 59.
  const hp = r.stat('hitPoints.max')
  check.eq('max HP: class + CON + dwarven toughness + Tough = 59', hp.total, 59)
  check('max HP: the Tough feat contributes a formula, shown as such',
    hp.terms.some((t) => t.sourceId === 'srd:feat.tough' && t.applied && t.value === 10))

  check.eq('speed: dwarf 25, unreduced by heavy armour', r.stat('speed.walk').total, 25)
  const speed = r.stat('speed.walk')
  check('speed: the Strength penalty was suppressed by dwarven training',
    speed.terms.some((t) => t.stage === 'suppressed'))

  check.eq('initiative: DEX +1', r.stat('initiative').total, 1)
  check.eq('carrying capacity: STR 14 × 15', r.stat('carryingCapacity').total, 210)
}

// ---------------------------------------------------------------------------
// 3. Skills — the generic check resolver
// ---------------------------------------------------------------------------

{
  const r = R()
  // Athletics: STR +2, proficient +3.
  const athletics = resolveCheck(r, { checkType: 'skill', skill: 'athletics' })
  check.eq('skill: Athletics is +5', athletics.modifierTotal, 5)
  check.eq('skill: the label reads naturally', athletics.label, 'Athletics +5')

  // Not proficient in Acrobatics: DEX +1 only.
  const acro = resolveCheck(r, { checkType: 'skill', skill: 'acrobatics' })
  check.eq('skill: Acrobatics is +1 without proficiency', acro.modifierTotal, 1)

  // The SRD explicitly allows an unusual ability with a skill.
  const conAthletics = resolveCheck(r, { checkType: 'skill', skill: 'athletics', ability: 'con' })
  check.eq('skill: Constitution (Athletics) uses CON and keeps proficiency',
    conAthletics.modifierTotal, 2 + 3)

  // Chain mail imposes Stealth disadvantage — a tagged roll modifier.
  const stealth = resolveCheck(r, { checkType: 'skill', skill: 'stealth' })
  check.eq('skill: chain mail imposes disadvantage on Stealth', stealth.advantage, 'disadvantage')

  // Passive Perception: 10 + WIS 1 + proficiency 3.
  const passive = resolvePassiveCheck(r, { checkType: 'skill', skill: 'perception' })
  check.eq('passive: Perception is 14', passive.total, 14)
}

{
  // Stonecunning is a toggle, not an assumption. Off by default, and its
  // absence is visible in the breakdown rather than silent.
  const off = resolveCheck(R(), { checkType: 'skill', skill: 'history' })
  check.eq('skill: History without Stonecunning is INT +0', off.modifierTotal, 0)

  const on = resolveCheck(
    R(sirAldren({ toggles: { 'wearing-armor': true, 'dwarf.stonecunning': true } })),
    { checkType: 'skill', skill: 'history' })
  check.eq('skill: Stonecunning grants History and doubles it', on.modifierTotal, 6)
}

// ---------------------------------------------------------------------------
// 4. Saving throws — same infrastructure, no separate system
// ---------------------------------------------------------------------------

{
  const r = R()
  // CON save: CON +2, proficient +3, cloak +1.
  const conSave = resolveCheck(r, { checkType: 'savingThrow', ability: 'con' })
  check.eq('save: Constitution is +6', conSave.modifierTotal, 6)
  check('save: the cloak of protection is named',
    conSave.modifierTerms.some((t) => t.sourceId === 'srd:item.cloak-of-protection' && t.applied))

  // DEX save: not proficient. DEX +1, cloak +1.
  const dexSave = resolveCheck(r, { checkType: 'savingThrow', ability: 'dex' })
  check.eq('save: Dexterity is +2 without proficiency', dexSave.modifierTotal, 2)

  // Dwarven Resilience: advantage on saves against poison.
  const poison = resolveCheck(r, {
    checkType: 'savingThrow', ability: 'con', context: { againstTags: ['poison'] }
  })
  check.eq('save: dwarves have advantage against poison', poison.advantage, 'advantage')
}

{
  // A paralyzed character's Dexterity save resolves through the ordinary
  // condition architecture — there is no "paralyzed save" branch anywhere.
  const paralyzed = R(sirAldren({
    conditions: [{
      conditionId: 'srd:condition.paralyzed', instanceId: 'ci-1',
      sourceId: 'test', appliedAtSeconds: 0
    }]
  }))
  const save = resolveCheck(paralyzed, { checkType: 'savingThrow', ability: 'dex' })
  check('save: paralysis auto-fails Dexterity saves', save.autoFail.length > 0)
  const outcome = applyOutcome(save, { faces: [20], keptIndex: 0 })
  check('save: the auto-fail beats a natural 20', outcome.success === false)
  check('save: paralysis also revokes actions',
    paralyzed.capability('takeActions').allowed === false)
}

// ---------------------------------------------------------------------------
// 5. Equipment changes derived state — no mutation of derived values
// ---------------------------------------------------------------------------

{
  const withShield = R().stat('armorClass').total

  const noShield = sirAldren()
  delete noShield.inventory.equipped.shield
  const withoutShield = R(noShield).stat('armorClass').total
  check.eq('equipment: unequipping the shield lowers AC by 2',
    withShield - withoutShield, 2)

  const noArmor = sirAldren()
  delete noArmor.inventory.equipped.armor
  noArmor.toggles = {}
  const unarmored = R(noArmor)
  // 10 base + DEX 1 + shield 2 + cloak 1 = 14; the Defense style needs armour,
  // so it drops out while the cloak, which does not, stays.
  check.eq('equipment: unarmoured falls back to 10 + Dex + shield + cloak',
    unarmored.stat('armorClass').total, 14)
  check('equipment: the Dexterity term applies once the heavy armour is gone',
    unarmored.stat('armorClass').terms.some((t) => t.sourceId === 'system:baseline' && t.applied && t.value === 1))

  const noCloak = sirAldren()
  noCloak.inventory.attunedInstanceIds = []
  const unattuned = R(noCloak)
  check.eq('equipment: an unattuned item grants nothing',
    withShield - unattuned.stat('armorClass').total, 1)
  check('equipment: the unattuned item says why it is inactive',
    unattuned.sources.inactive.some(
      (i) => i.source.id === 'srd:item.cloak-of-protection' && i.reason.includes('attuned')))
}

{
  // Medium armour: the Dex cap is a stat, so it is data rather than a branch.
  const halfPlate = sirAldren()
  halfPlate.inventory.instances.push({
    instanceId: 'i-hp', definitionId: 'srd:armor.half-plate', contentVersion: 1, identified: true
  })
  halfPlate.inventory.equipped.armor = 'i-hp'
  halfPlate.abilityScoreBase = { ...halfPlate.abilityScoreBase, dex: 18 }
  const r = R(halfPlate)
  check.eq('equipment: half plate caps Dexterity at 2', r.stat('armorDexCap').total, 2)
  // 15 + 2 (capped) + shield 2 + Defense 1 + cloak 1 = 21
  check.eq('equipment: medium armour admits Dex up to the cap',
    r.stat('armorClass').total, 21)
}

// ---------------------------------------------------------------------------
// 6. Attacks — actor + weapon + target + context
// ---------------------------------------------------------------------------

const longsword = content.items.get('srd:weapon.longsword')
const longbow = content.items.get('srd:weapon.longbow')
const dagger = content.items.get('srd:weapon.dagger')
const flamefang = content.items.get('dm:weapon.flamefang')

{
  const r = R()
  const attack = resolveAttack(r, { weapon: longsword, targetAc: 15 })
  check.eq('attack: a longsword uses Strength', attack.ability, 'str')
  check('attack: the character is proficient with martial weapons', attack.proficient)
  check.eq('attack: the bonus is STR +2 and proficiency +3', attack.attackRoll.modifierTotal, 5)
  check.eq('attack: the damage die is the one-handed 1d8',
    attack.damage.components[0].dice.sides, 8)
  check.eq('attack: damage adds the same ability modifier', attack.damage.components[0].flat, 2)

  const twoHanded = resolveAttack(r, { weapon: longsword, targetAc: 15, context: { twoHanded: true } })
  check.eq('attack: versatile two-handed uses the larger die',
    twoHanded.damage.components[0].dice.sides, 10)
}

{
  // Finesse chooses the better ability and uses it for attack AND damage — the
  // SRD requires the same modifier for both.
  const highDex = sirAldren({ abilityScoreBase: { str: 14, dex: 18, con: 13, int: 10, wis: 12, cha: 8 } })
  const attack = resolveAttack(R(highDex), { weapon: dagger, targetAc: 15 })
  check.eq('attack: finesse picks the better ability', attack.ability, 'dex')
  check.eq('attack: finesse uses the same modifier for damage',
    attack.damage.components[0].flat, 4)
  check('attack: the choice is explained', attack.abilityReason.includes('finesse'))
}

{
  const r = R()
  const bow = resolveAttack(r, { weapon: longbow, targetAc: 15, context: { range: 'long' } })
  check.eq('attack: a longbow uses Dexterity', bow.ability, 'dex')
  check.eq('attack: long range imposes disadvantage', bow.attackRoll.advantage, 'disadvantage')

  // Sharpshooter suppresses that penalty — the same `suppress` operation that
  // mithral armour uses, not a second mechanism.
  const sharp = sirAldren({
    buildChoices: [
      { atLevel: 4, kind: 'feat', value: 'srd:feat.tough' },
      { atLevel: 6, kind: 'feat', value: 'srd:feat.sharpshooter' }
    ]
  })
  const sharpBow = resolveAttack(R(sharp), { weapon: longbow, targetAc: 15, context: { range: 'long' } })
  check.eq('attack: Sharpshooter removes the long-range disadvantage',
    sharpBow.attackRoll.advantage, 'normal')
  check('attack: the removed penalty is still shown, with its reason',
    sharpBow.attackRoll.disadvantageSources.some(
      (t) => !t.applied && t.reason.includes('Sharpshooter')))
}

{
  // Cover raises the target's AC and only the most protective degree applies.
  const r = R()
  const plain = resolveAttack(r, { weapon: longsword, targetAc: 15 })
  const covered = resolveAttack(r, { weapon: longsword, targetAc: 15, context: { cover: 'half' } })
  check.eq('attack: half cover raises the target AC by 2',
    covered.targetAc - plain.targetAc, 2)
}

{
  // Elected options: Great Weapon Master's -5/+10 is a declared choice, not an
  // always-on modifier.
  const gwm = sirAldren({
    buildChoices: [{ atLevel: 4, kind: 'feat', value: 'srd:feat.great-weapon-master' }]
  })
  const r = R(gwm)
  const normal = resolveAttack(r, { weapon: longsword, targetAc: 15 })
  const powered = resolveAttack(r, {
    weapon: longsword, targetAc: 15, context: { electedOptions: ['gwm.power-attack'] }
  })
  check.eq('attack: electing Power Attack costs 5 to hit',
    normal.attackRoll.modifierTotal - powered.attackRoll.modifierTotal, 5)
  check.eq('attack: and adds 10 to damage',
    powered.damage.components[0].flat - normal.damage.components[0].flat, 10)
  check('attack: the election is named in the breakdown',
    powered.attackRoll.modifierTerms.some((t) => t.sourceName.includes('Power Attack')))
}

{
  // A target's conditions reach the attacker without the attacker knowing what
  // "prone" means.
  const proneTarget = R(sirAldren({
    conditions: [{
      conditionId: 'srd:condition.prone', instanceId: 'ci-1',
      sourceId: 'test', appliedAtSeconds: 0
    }]
  }))
  const melee = resolveAttack(R(), {
    weapon: longsword, target: proneTarget, context: { range: 'melee' }
  })
  check.eq('attack: a prone target grants advantage within 5 feet',
    melee.attackRoll.advantage, 'advantage')

  const ranged = resolveAttack(R(), {
    weapon: longbow, target: proneTarget, context: { range: 'normal' }
  })
  check.eq('attack: a prone target grants disadvantage beyond 5 feet',
    ranged.attackRoll.advantage, 'disadvantage')
  check('attack: the target-side source is labelled as the target\'s',
    melee.attackRoll.advantageSources.some((t) => t.sourceName.includes('(target)')))
}

{
  // Full outcome: hit, damage, resistance.
  const r = R()
  const attack = resolveAttack(r, { weapon: longsword, targetAc: 12 })
  const result = applyAttackOutcome({
    attack, attacker: r,
    outcome: { faces: [14], keptIndex: 0 },
    damageDiceTotals: [5],
    targetHitPoints: 20
  })
  check('attack: 14 + 5 beats AC 12', result.hit === true)
  check.eq('attack: damage is 5 + STR 2', result.damage.totalBeforeAbsorption, 7)

  const miss = applyAttackOutcome({
    attack, attacker: r, outcome: { faces: [3], keptIndex: 0 },
    damageDiceTotals: [5], targetHitPoints: 20
  })
  check('attack: 3 + 5 misses AC 12', miss.hit === false)
}

{
  // The DM-authored weapon works through the identical path, including its
  // resistance-bypass, which uses the same primitive as Elemental Adept.
  const dm = sirAldren()
  dm.inventory.equipped.mainHand = 'i-flamefang'
  dm.inventory.attunedInstanceIds = ['i-cloak', 'i-flamefang']
  const r = R(dm)
  const attack = resolveAttack(r, { weapon: flamefang, targetAc: 12 })
  check.eq('DM item: a DM weapon resolves through the same path', attack.ability, 'str')
  check.eq('DM item: its resistance bypass is a normal stat',
    r.stat('resistanceBypass.fire').total, 1)
  check('DM item: it appears as DM provenance alongside SRD content',
    r.sources.active.some((s) => s.provenance === 'dm'))
}

// ---------------------------------------------------------------------------
// 7. Conditions and temporary effects on the whole chain
// ---------------------------------------------------------------------------

{
  const poisoned = R(sirAldren({
    conditions: [{
      conditionId: 'srd:condition.poisoned', instanceId: 'ci-1',
      sourceId: 'test', appliedAtSeconds: 0
    }]
  }))
  const attack = resolveAttack(poisoned, { weapon: longsword, targetAc: 15 })
  check.eq('condition: poisoned gives disadvantage on attacks',
    attack.attackRoll.advantage, 'disadvantage')
  const skill = resolveCheck(poisoned, { checkType: 'skill', skill: 'athletics' })
  check.eq('condition: poisoned gives disadvantage on ability checks',
    skill.advantage, 'disadvantage')
  const save = resolveCheck(poisoned, { checkType: 'savingThrow', ability: 'con' })
  check.eq('condition: poisoned leaves saving throws alone', save.advantage, 'normal')
}

{
  // Exhaustion 4 halves the maximum, and the derived value simply changes —
  // there is nothing stored to reconcile.
  const base = R().stat('hitPoints.max').total
  const tired = R(sirAldren({ exhaustionLevel: 4 })).stat('hitPoints.max').total
  check.eq('condition: exhaustion 4 halves the hit point maximum', tired, Math.floor(base / 2))
  check.eq('condition: exhaustion 2 halves speed',
    R(sirAldren({ exhaustionLevel: 2 })).stat('speed.walk').total, 12)
}

{
  // A temporary effect appears and disappears with no residue, because nothing
  // derived was ever stored.
  const blessed = sirAldren()
  blessed.effectInstances = [{
    instanceId: 'ei-1', definitionId: 'srd:item.cloak-of-protection',
    contentVersion: 1, appliedAtSeconds: 0
  }]
  const withEffect = R(blessed).stat('armorClass').total
  const without = R().stat('armorClass').total
  check.eq('temporary: an effect instance raises AC', withEffect - without, 1)

  blessed.effectInstances = []
  check.eq('temporary: removing it reverts exactly', R(blessed).stat('armorClass').total, without)
}

// ---------------------------------------------------------------------------
// 8. Resources
// ---------------------------------------------------------------------------

{
  const r = R()
  const resources = resolveResources(r)
  const secondWind = resources.find((x) => x.id === 'fighter.second-wind')
  check('resource: Second Wind is present', !!secondWind)
  check.eq('resource: its maximum is 1', secondWind.maximum, 1)
  check.eq('resource: nothing is spent yet', secondWind.remaining, 1)

  const spent = resolveResources(R(sirAldren({ resourcesSpent: { 'fighter.second-wind': 1 } })))
    .find((x) => x.id === 'fighter.second-wind')
  check.eq('resource: spending reduces what remains', spent.remaining, 0)

  const restored = applyRest(spent, 'short')
  check.eq('resource: a short rest restores it', restored.spent, 0)
  check.eq('resource: Action Surge also refreshes on a short rest',
    applyRest(resolveResources(r).find((x) => x.id === 'fighter.action-surge'), 'short').spent, 0)
}

// ---------------------------------------------------------------------------
// 9. Feat activation and deactivation
// ---------------------------------------------------------------------------

{
  // Heavily Armored requires medium armour proficiency, which the fighter has.
  const heavy = sirAldren({
    buildChoices: [{ atLevel: 4, kind: 'feat', value: 'srd:feat.heavily-armored' }]
  })
  const r = R(heavy)
  check('feat: a met proficiency prerequisite activates the feat',
    r.sources.active.some((s) => s.id === 'srd:feat.heavily-armored'))
  check.eq('feat: it raises Strength', r.stat('ability.str.score').total, 15)
}

{
  // Elemental Adept requires the ability to cast a spell. A fighter cannot, so
  // the feat is inactive and says so — rather than silently applying.
  const adept = sirAldren({
    buildChoices: [{ atLevel: 4, kind: 'feat', value: 'srd:feat.elemental-adept' }]
  })
  const r = R(adept)
  check('feat: an unmet spellcasting prerequisite deactivates the feat',
    !r.sources.active.some((s) => s.id === 'srd:feat.elemental-adept'))
  check('feat: the reason is legible',
    r.sources.inactive.some(
      (i) => i.source.id === 'srd:feat.elemental-adept' && i.reason.includes('cast')))
}

{
  // Athlete uses the movement-cost primitive.
  const athlete = R(sirAldren({
    buildChoices: [{ atLevel: 4, kind: 'feat', value: 'srd:feat.athlete' }]
  }))
  check.eq('feat: Athlete makes climbing cost no extra movement',
    athlete.stat('movementCost.climb').total, 1)
  check.eq('feat: and standing up cost a flat 5 feet',
    athlete.stat('movementCost.standUp').total, 5)
  check.eq('feat: without it, standing up costs half your speed',
    R().stat('movementCost.standUp').total, 12)
}

{
  // Heavy Armor Master reduces incoming damage — the C2 primitive.
  const hamChar = sirAldren({
    buildChoices: [{ atLevel: 4, kind: 'feat', value: 'srd:feat.heavy-armor-master' }],
    toggles: { 'wearing-armor': true, 'wearing-heavy-armor': true }
  })
  const ham = R(hamChar)
  check.eq('feat: Heavy Armor Master reduces slashing damage by 3',
    ham.stat('damageReduction.slashing').total, 3)

  const attacker = R()
  const attack = resolveAttack(attacker, { weapon: longsword, target: ham })
  const result = applyAttackOutcome({
    attack, attacker, target: ham,
    outcome: { faces: [20], keptIndex: 0 },
    damageDiceTotals: [6], critDiceTotals: [4],
    targetHitPoints: 44
  })
  check('feat: the reduction is applied to a real attack', result.hit === true)
  check('feat: and is visible in the damage breakdown',
    result.damage.terms.some((t) => t.sourceName.includes('damage reduction')))
}

// ---------------------------------------------------------------------------
// 10. The chain, end to end
// ---------------------------------------------------------------------------

{
  const r = R()
  const kinds = new Set(r.sources.active.map((s) => s.kind))
  check('chain: species, class features, feat, items and baseline all active',
    ['species', 'feature', 'feat', 'item', 'environment'].every((k) => kinds.has(k)),
    `saw ${[...kinds].join(', ')}`)

  const ac = r.stat('armorClass')
  const contributors = new Set(ac.terms.map((t) => t.sourceId))
  check('chain: AC draws on the baseline, armour, shield, class and item',
    contributors.has('system:baseline') &&
    contributors.has('srd:armor.chain-mail') &&
    contributors.has('srd:armor.shield') &&
    contributors.has('srd:class.fighter.defense') &&
    contributors.has('srd:item.cloak-of-protection'))

  check('chain: no diagnostics were raised', r.diagnostics.length === 0,
    r.diagnostics.join('; '))
  check('chain: nothing is incomplete', ac.incomplete === false)
}

check.report()
