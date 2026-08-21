// Building the player view.
//
// One function, three detail levels, zero class knowledge. Every branch in this
// file is on *shape* — is this a weapon, does this action cost a resource — and
// never on identity. There is no `if (classId === ...)` and there never will be:
// if a class needs something the view cannot express, the fix is a new field
// here, which every class gets at once.

import type {
  Ability, ActionDefinition, ClassDefinition, ContentIndex, EffectSource,
  ItemDefinition, ResourceDefinition, RollResolution, SpellDefinition, StatValue, Term
} from '../rules/types.js'
import { ABILITIES } from '../rules/types.js'
import type { Resolution } from '../rules/resolve.js'
import { createResolution, characterLevel } from '../rules/resolve.js'
import { describeProficiency, evaluate } from '../rules/predicates.js'
import { resolveCheck, resolvePassiveCheck } from '../rules/check.js'
import { resolveAttack } from '../rules/attack.js'
import { resolveResources, type ResourceValue } from '../rules/resources.js'
import { resolveSpellcasting, type CastableSpell, type SlotOption } from '../rules/spells.js'
import { resolveSpellEffect } from '../rules/spellEffect.js'
import {
  abilityModifierPath, abilityScorePath, ARMOR_CLASS, HP_MAX, INITIATIVE,
  PROFICIENCY_BONUS, speedPath
} from '../rules/statPaths.js'
import { SRD_SKILLS } from '../rules/index.js'
import type {
  AbilityView, ActionView, Breakdown, DetailLevel, EffectView,
  EquipmentSlotView, ItemGroup, ItemView, NoticeView, PlayerView,
  PlayerCommand, ProgressionView, ProficiencyState, Readout, ResourceView,
  RollSpec, SkillView, SpellcastingView, SpellView, Viewer, VitalsView
} from './types.js'

const ABILITY_LABEL: Record<Ability, string> = {
  str: 'Strength', dex: 'Dexterity', con: 'Constitution',
  int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma'
}

const SLOT_LABEL: Record<string, string> = {
  armor: 'Armour', shield: 'Shield', mainHand: 'Main Hand', offHand: 'Off Hand',
  head: 'Head', cloak: 'Cloak', boots: 'Boots', gloves: 'Gloves',
  bracers: 'Bracers', amulet: 'Amulet', ring1: 'Ring', ring2: 'Ring', belt: 'Belt'
}

export interface BuildOptions {
  detail?: DetailLevel
  revision?: number
  /**
   * Who the view is for. Defaults to the character's owner, which is what the
   * single-player harness and every existing caller want. See `Viewer`.
   */
  viewer?: Viewer
}

// ---------------------------------------------------------------------------
// Formatting — the one place a game concept becomes a string
// ---------------------------------------------------------------------------

const signed = (n: number): string => (n >= 0 ? `+${n}` : String(n))
const feet = (n: number): string => `${n} ft`

function toBreakdown(value: StatValue, detail: DetailLevel): Breakdown | undefined {
  if (detail === 'summary') return undefined
  const wanted = detail === 'full' ? value.terms : value.terms.filter((t) => t.applied)
  return {
    total: value.total,
    lines: wanted.map(lineOf),
    assumptions: value.notes,
    incomplete: value.incomplete
  }
}

function lineKind(op: Term['op']): Breakdown['lines'][number]['kind'] {
  if (op === 'add') return 'add'
  if (op === 'proficiency' || op === 'multiply') return 'multiplier'
  if (op === 'base') return 'base'
  if (op === 'set') return 'set'
  return 'other'
}

function lineOf(t: Term): Breakdown['lines'][number] {
  return {
    source: t.sourceName,
    sourceId: t.sourceId,
    provenance: t.provenance,
    ...(t.value !== undefined ? { amount: t.value } : {}),
    kind: lineKind(t.op),
    ...(t.note ? { note: t.note } : {}),
    applied: t.applied,
    ...(t.reason ? { reason: t.reason } : {})
  }
}

function readout(
  value: StatValue, label: string, detail: DetailLevel,
  format: (n: number) => string = String
): Readout {
  const breakdown = toBreakdown(value, detail)
  return {
    value: value.total,
    label,
    display: format(value.total),
    ...(breakdown ? { breakdown } : {})
  }
}

// ---------------------------------------------------------------------------
// Plain-language effect summaries
// ---------------------------------------------------------------------------

/**
 * What a source is doing, in words a new player can read. Derived from the
 * modifiers themselves, so a DM-authored item explains itself without the DM
 * writing marketing copy — and cannot lie about what it does.
 */
function describeSource(
  source: EffectSource, resolution: Resolution, content?: ContentIndex
): string[] {
  const out: string[] = []
  for (const m of source.modifiers) {
    // A note annotates the mechanics; it does not stand in for them. Letting it
    // replace them is how a shield ends up describing itself as "shield" and
    // never mentioning the +2.
    const mech: string[] = []
    if (m.channel === 'value' && m.target && m.op) {
      const n = resolution.evaluateValue(m.value, source.id)
      const stat = prettyPath(m.target)
      if (m.op === 'add') mech.push(`${signed(n)} ${stat}`)
      else if (m.op === 'base') mech.push(`${stat} ${n}`)
      else if (m.op === 'set') {
        // `resistance.poison` is a flag wearing a number's clothes; "becomes 1"
        // is arithmetically true and useless to read.
        mech.push(m.target.startsWith('resistance.')
          ? (n > 0 ? `resistance to ${m.target.slice(11)}` : `no resistance to ${m.target.slice(11)}`)
          : `${stat} becomes ${n}`)
      }
      else if (m.op === 'min') mech.push(`${stat} at least ${n}`)
      else if (m.op === 'max') mech.push(`${stat} at most ${n}`)
      else if (m.op === 'multiply') mech.push(`${stat} × ${n}`)
    } else if (m.channel === 'roll' && m.rollOp) {
      mech.push(`${m.rollOp} on ${describeScope(m)}`)
    } else if (m.channel === 'capability' && m.capability) {
      mech.push(m.capOp === 'revoke' ? `cannot ${m.capability}` : `can ${m.capability}`)
    }

    if (mech.length === 0) {
      // Nothing mechanical to say — suppression and the like. The note is all
      // there is, and it is the whole point of the modifier.
      if (m.note) out.push(m.note)
      continue
    }
    // The note qualifies the last clause: "+1 AC while wearing armour".
    if (m.note) mech[mech.length - 1] = `${mech[mech.length - 1]} (${m.note})`

    // A trait that is currently doing nothing must not read as if it were.
    // Heavy armour suppresses the baseline's Dexterity term; listing it plainly
    // would make the explanation disagree with the number it explains.
    const entry = resolution.entries.find((e) => e.modifier.id === m.id)
    const off = entry && (resolution.isSuppressed(entry) || !entry.gatePassed)
    if (off) {
      const why = entry && !entry.gatePassed && entry.gateReason
        ? entry.gateReason
        : 'suppressed'
      out.push(...mech.map((line) => `${line} — not applying: ${why}`))
      continue
    }
    out.push(...mech)
  }

  // Proficiencies are effects too. Omitting them is why a class's proficiency
  // source could describe itself purely in terms of hit points.
  for (const p of source.proficiencies ?? []) {
    // Content may grant proficiency in an item this deployment has not loaded.
    // The id's last segment is still a readable word, and a readable word beats
    // showing the player a database key.
    const label = describeProficiency(
      p.category, (id) => content?.items.get(id)?.name ?? id.split('.').pop() ?? id)
    out.push(p.level === 'expertise' ? `expertise in ${label}`
      : p.level === 'half' ? `half proficiency in ${label}`
        : `proficient in ${label}`)
  }

  return out
}

function prettyPath(path: string): string {
  if (path === ARMOR_CLASS) return 'AC'
  if (path === HP_MAX) return 'max HP'
  if (path === INITIATIVE) return 'initiative'
  if (path === PROFICIENCY_BONUS) return 'proficiency bonus'
  if (path.startsWith('speed.')) return `${path.slice(6)} speed`
  if (path.startsWith('save.')) return `${path.slice(5).toUpperCase()} saves`
  if (path.startsWith('skill.')) return `${path.slice(6)} checks`
  if (path.startsWith('ability.')) {
    const [, a, kind] = path.split('.')
    return `${ABILITY_LABEL[a as Ability] ?? a}${kind === 'modifier' ? ' modifier' : ''}`
  }
  if (path.startsWith('resistance.')) return `${path.slice(11)} resistance`
  if (path.startsWith('damageReduction.')) return `${path.slice(16)} damage taken`
  return path
}

function describeScope(m: { scope?: { kinds?: string[]; skills?: string[]; abilities?: string[]; againstTags?: string[] } }): string {
  const s = m.scope
  if (!s) return 'all rolls'
  const parts: string[] = []
  if (s.skills?.length) parts.push(s.skills.join(', '))
  else if (s.abilities?.length) parts.push(s.abilities.map((a) => a.toUpperCase()).join(', '))
  if (s.kinds?.length) parts.push(s.kinds.join('/') + (s.kinds.includes('save') ? 's' : ' rolls'))
  if (s.againstTags?.length) parts.push(`against ${s.againstTags.join(', ')}`)
  return parts.join(' ') || 'all rolls'
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

function buildVitals(r: Resolution, detail: DetailLevel): VitalsView {
  const c = r.character
  const max = r.stat(HP_MAX)
  return {
    hitPoints: {
      // Current hit points are stored and the maximum is derived, so the two
      // can legitimately disagree — a lost Constitution belt lowers the maximum
      // without anyone editing the current total. Reporting a number above the
      // maximum would be showing the player an impossible character, so the
      // view clamps. The stored value is left alone; the authority reconciles.
      current: Math.min(c.hitPointsCurrent, max.total),
      max: readout(max, 'Maximum Hit Points', detail),
      temporary: c.hitPointsTemp
    },
    armorClass: readout(r.stat(ARMOR_CLASS), 'Armour Class', detail),
    speed: readout(r.stat(speedPath('walk')), 'Speed', detail, feet),
    initiative: readout(r.stat(INITIATIVE), 'Initiative', detail, signed),
    deathSaves: c.deathSaves,
    exhaustion: c.exhaustionLevel
  }
}

/**
 * Turns a resolved check into everything a caller needs to roll it.
 *
 * The engine says how many dice and which to keep; the caller supplies the
 * faces. Publishing the spec rather than a bare command is what stops the UI
 * from having to know that advantage means two dice.
 */
function rollSpecOf(
  resolution: { dice: RollResolution['dice']; modifierTotal: number; label: string },
  command: PlayerCommand
): RollSpec {
  return {
    diceCount: resolution.dice.count,
    keep: resolution.dice.keep,
    command,
    label: resolution.label,
    modifier: resolution.modifierTotal,
    modifierDisplay: signed(resolution.modifierTotal)
  }
}

function buildAbilities(
  r: Resolution, detail: DetailLevel, characterId: string
): AbilityView[] {
  return ABILITIES.map((a) => {
    const save = resolveCheck(r, { checkType: 'savingThrow', ability: a })
    const check = resolveCheck(r, { checkType: 'ability', ability: a })
    const saveBreakdown = detail === 'summary'
      ? undefined
      : {
        total: save.modifierTotal,
        lines: (detail === 'full' ? save.modifierTerms : save.modifierTerms.filter((t) => t.applied)).map(lineOf),
        assumptions: save.notes,
        incomplete: save.incomplete
      }
    return {
      ability: a,
      label: ABILITY_LABEL[a],
      score: readout(r.stat(abilityScorePath(a)), ABILITY_LABEL[a], detail),
      modifier: readout(r.stat(abilityModifierPath(a)), `${ABILITY_LABEL[a]} modifier`, detail, signed),
      save: {
        value: save.modifierTotal,
        label: `${ABILITY_LABEL[a]} save`,
        display: signed(save.modifierTotal),
        proficient: r.hasProficiency({ kind: 'save', ability: a }),
        ...(saveBreakdown ? { breakdown: saveBreakdown } : {})
      },
      roll: rollSpecOf(check, {
        type: 'makeCheck', characterId, checkType: 'ability', ability: a, faces: []
      }),
      saveRoll: rollSpecOf(save, {
        type: 'makeSave', characterId, ability: a, faces: []
      })
    }
  })
}

function proficiencyStateFor(r: Resolution, skillId: string): ProficiencyState {
  const held = r.proficiencies().filter(
    (p) => p.category.kind === 'skill' && p.category.id === skillId)
  if (held.some((p) => p.level === 'expertise')) return 'expertise'
  if (held.some((p) => p.level === 'proficient')) return 'proficient'
  if (held.some((p) => p.level === 'half')) return 'half'
  return 'none'
}

function buildSkills(
  r: Resolution, detail: DetailLevel, characterId: string
): SkillView[] {
  return SRD_SKILLS.map((s) => {
    const roll = resolveCheck(r, { checkType: 'skill', skill: s.id })
    const passive = resolvePassiveCheck(r, { checkType: 'skill', skill: s.id })
    const reasons = [...roll.advantageSources, ...roll.disadvantageSources]
      .filter((t) => t.applied)
      .map((t) => `${t.op} — ${t.sourceName}`)

    const breakdown = detail === 'summary'
      ? undefined
      : {
        total: roll.modifierTotal,
        lines: (detail === 'full' ? roll.modifierTerms : roll.modifierTerms.filter((t) => t.applied)).map(lineOf),
        assumptions: roll.notes,
        incomplete: roll.incomplete
      }

    return {
      id: s.id,
      label: s.name,
      ability: s.defaultAbility,
      proficiency: proficiencyStateFor(r, s.id),
      total: {
        value: roll.modifierTotal, label: s.name, display: signed(roll.modifierTotal),
        ...(breakdown ? { breakdown } : {})
      },
      passive: { value: passive.total, label: `Passive ${s.name}`, display: String(passive.total) },
      rollState: roll.advantage,
      rollStateReasons: reasons,
      roll: rollSpecOf(roll, {
        type: 'makeCheck', characterId, checkType: 'skill', skill: s.id, faces: []
      })
    }
  })
}

const REFRESH_LABEL: Record<string, string> = {
  shortRest: 'on a short rest',
  longRest: 'on a long rest',
  longRestFraction: 'partly on a long rest',
  dawn: 'at dawn',
  dusk: 'at dusk',
  daysElapsed: 'after some days',
  cumulativeDuration: 'over time',
  never: 'never'
}

function buildResources(r: Resolution, detail: DetailLevel): ResourceView[] {
  const defs = new Map<string, { def: ResourceDefinition; source: EffectSource }>()
  for (const source of r.sources.active) {
    for (const def of source.resources ?? []) defs.set(def.id, { def, source })
  }

  return resolveResources(r)
    .map((v: ResourceValue) => {
      const found = defs.get(v.id)
      const def = found?.def
      return {
        id: v.id,
        label: v.name,
        current: v.remaining,
        maximum: v.maximum,
        spent: v.spent,
        // A hint carried by the content. Absent means 'uses', which is what
        // keeps class knowledge out of the interface.
        display: def?.display ?? 'uses',
        refresh: { kind: v.refresh.kind, label: REFRESH_LABEL[v.refresh.kind] ?? v.refresh.kind },
        sourceId: v.sourceId,
        sourceLabel: v.sourceName,
        ...(def?.group ? { group: def.group } : {}),
        ...(def?.order !== undefined ? { order: def.order } : {}),
        ...(detail === 'summary'
          ? {}
          : { breakdown: { total: v.maximum, lines: v.terms.map(lineOf), assumptions: [], incomplete: false } })
      } as ResourceView
    })
    .sort((a, b) => (a.order ?? 100) - (b.order ?? 100) || a.label.localeCompare(b.label))
}

// ---------------------------------------------------------------------------

function itemGroupOf(def: ItemDefinition, equipped: boolean): ItemGroup {
  if (equipped) return 'equipped'
  if (def.category === 'consumable') return 'consumables'
  if (def.category === 'gear' && def.costCp !== undefined && !def.slot) return 'valuables'
  return 'carried'
}

function damageLabel(def: ItemDefinition, twoHanded = false): string | undefined {
  const w = def.weapon
  if (!w) return undefined
  const dice = twoHanded && w.versatileDamage ? w.versatileDamage : w.damage
  return `${dice.count}d${dice.sides}`
}

/**
 * What an item instance appears to be, to this viewer.
 *
 * One helper rather than a check at each call site, because the first attempt
 * patched only the inventory and the true name promptly reappeared in the
 * action list ("Use Potion of Poison") and in the narrative notices. A disguise
 * is a property of the instance, not of the panel that happens to be rendering
 * it, so every consumer has to ask the same question in the same place.
 */
function seenAs(
  inst: { definitionId: string; identified: boolean; apparentDefinitionId?: string },
  content: ContentIndex,
  viewer: Viewer
): { def: ItemDefinition | undefined; disguised: boolean; trueDef: ItemDefinition | undefined } {
  const trueDef = content.items.get(inst.definitionId)
  const apparent = !inst.identified && inst.apparentDefinitionId
    ? content.items.get(inst.apparentDefinitionId)
    : undefined
  // The DM sees through it; everyone else, the owner included, does not.
  const disguised = apparent !== undefined && viewer.kind !== 'dm'
  return { def: disguised ? apparent : trueDef, disguised: apparent !== undefined, trueDef }
}

function buildInventory(
  r: Resolution, content: ContentIndex, detail: DetailLevel, viewer: Viewer
): { items: ItemView[]; slots: EquipmentSlotView[] } {
  const c = r.character
  const equippedBySlot = c.inventory.equipped
  const equippedIds = new Set(Object.values(equippedBySlot))
  const attuned = new Set(c.inventory.attunedInstanceIds)
  const inactiveById = new Map(r.sources.inactive.map((i) => [i.source.id, i.reason]))

  const items: ItemView[] = []
  for (const inst of c.inventory.instances) {
    // A potion of poison presents as a potion of healing, and *identify*
    // confirms the lie. Everyone but the DM is shown the disguise, including
    // its effects — describing the real item's modifiers would give the game
    // away just as surely as printing its name.
    const seen = seenAs(inst, content, viewer)
    const def = seen.def
    if (!def) continue

    const isEquipped = equippedIds.has(inst.instanceId)
    const reason = inactiveById.get(def.effects.id)

    items.push({
      instanceId: inst.instanceId,
      itemId: def.id,
      label: inst.customName ?? def.name,
      ...(seen.disguised ? { disguised: true } : {}),
      ...(viewer.kind === 'dm' && seen.disguised && seen.trueDef
        ? { trueLabel: seen.trueDef.name }
        : {}),
      group: itemGroupOf(def, isEquipped),
      provenance: def.provenance,
      quantity: inst.quantity ?? 1,
      ...(def.slot ? { slot: def.slot } : {}),
      equipped: isEquipped,
      requiresAttunement: def.requiresAttunement === true,
      attuned: attuned.has(inst.instanceId),
      identified: inst.identified,
      effectSummary: describeSource(def.effects, r, content),
      canEquip: def.slot !== undefined && !isEquipped,
      equipReasons: !isEquipped && reason ? [reason] : [],
      ...(def.weapon
        ? {
          weaponSummary: {
            damageLabel: damageLabel(def) ?? '',
            damageType: def.weapon.damageType,
            properties: def.weapon.properties
          }
        }
        : {})
    })
  }

  const slots: EquipmentSlotView[] = Object.entries(equippedBySlot)
    .filter(([, instanceId]) => instanceId)
    .map(([slot, instanceId]) => {
      const inst = c.inventory.instances.find((i) => i.instanceId === instanceId)
      const def = inst ? content.items.get(inst.definitionId) : undefined
      return {
        slot,
        label: SLOT_LABEL[slot] ?? slot,
        ...(instanceId ? { instanceId } : {}),
        ...(def ? { itemId: def.id, itemLabel: def.name, provenance: def.provenance } : {}),
        effectSummary: def ? describeSource(def.effects, r, content) : [],
        ...(instanceId && attuned.has(instanceId) ? { attuned: true } : {})
      }
    })

  void detail
  return { items, slots }
}

// ---------------------------------------------------------------------------
// Actions — one list, faceted by kind
// ---------------------------------------------------------------------------

const COST_LABEL: Record<string, string> = {
  action: 'Action', bonusAction: 'Bonus Action', reaction: 'Reaction',
  free: 'Free', movement: 'Movement'
}

function costView(cost: ActionDefinition['cost']): ActionView['cost'] {
  if (typeof cost === 'string') {
    return { type: cost as ActionView['cost']['type'], label: COST_LABEL[cost] ?? cost }
  }
  if ('minutes' in cost) return { type: 'time', label: `${cost.minutes} min` }
  if ('hours' in cost) return { type: 'time', label: `${cost.hours} hr` }
  return { type: 'time', label: `${cost.days} days` }
}

/** The capability an action of this cost requires. */
const CAPABILITY_FOR_COST: Record<string, string | undefined> = {
  action: 'takeActions',
  bonusAction: 'takeBonusActions',
  reaction: 'takeReactions'
}

function buildActions(
  r: Resolution, content: ContentIndex, detail: DetailLevel,
  resources: ResourceView[], viewer: Viewer
): ActionView[] {
  const out: ActionView[] = []
  const characterId = r.character.id
  const remaining = new Map(resources.map((x) => [x.id, x.current]))

  // Whether the character can act at all is a capability question, so one
  // condition disables every action of that cost at once and no action needs to
  // know what "stunned" means.
  const capabilityBlocked = (costType: string): string | undefined => {
    const key = CAPABILITY_FOR_COST[costType]
    if (!key) return undefined
    const cap = r.capability(key as never)
    if (cap.allowed) return undefined
    const blocker = cap.terms.find((t) => t.applied && t.op === 'revoke')
    return blocker ? `${blocker.sourceName}: cannot take ${costType === 'action' ? 'actions' : costType === 'reaction' ? 'reactions' : 'bonus actions'}` : 'unable to act'
  }

  // --- weapon attacks, one per equipped weapon ------------------------------
  for (const [slot, instanceId] of Object.entries(r.character.inventory.equipped)) {
    if (!instanceId) continue
    if (slot !== 'mainHand' && slot !== 'offHand') continue
    const inst = r.character.inventory.instances.find((i) => i.instanceId === instanceId)
    const def = inst ? content.items.get(inst.definitionId) : undefined
    if (!def?.weapon) continue

    const attack = resolveAttack(r, { weapon: def })
    const reasons: string[] = []
    const blocked = capabilityBlocked('action')
    if (blocked) reasons.push(blocked)

    const options = r.sources.active.flatMap((s) =>
      (s.options ?? [])
        .filter((o) => !o.scope?.kinds || o.scope.kinds.includes('attack'))
        .map((o) => ({ id: o.id, label: o.label })))

    out.push({
      id: `attack:${instanceId}`,
      label: `Attack with ${def.name}`,
      kind: 'attack',
      cost: { type: 'action', label: 'Action' },
      costs: [],
      targeting: { selector: 'creature', count: 1 },
      available: reasons.length === 0,
      unavailableReasons: reasons,
      preview: {
        attackBonus: attack.attackRoll.modifierTotal,
        attackBonusDisplay: signed(attack.attackRoll.modifierTotal),
        damageLabel: `${damageLabel(def)}${signed(attack.damage.components[0]?.flat ?? 0)}`,
        ...(def.weapon.damageType ? { damageType: def.weapon.damageType } : {}),
        rollState: attack.attackRoll.advantage
      },
      ...(options.length ? { options } : {}),
      command: { type: 'makeAttack', characterId, weaponInstanceId: instanceId, faces: [] },
      roll: rollSpecOf(
        {
          dice: attack.attackRoll.dice,
          modifierTotal: attack.attackRoll.modifierTotal,
          label: `${def.name} attack`
        },
        { type: 'makeAttack', characterId, weaponInstanceId: instanceId, faces: [] }
      ),
      sourceId: def.id,
      sourceLabel: def.name,
      ...(detail === 'summary'
        ? {}
        : {
          breakdown: {
            total: attack.attackRoll.modifierTotal,
            lines: (detail === 'full'
              ? attack.attackRoll.modifierTerms
              : attack.attackRoll.modifierTerms.filter((t) => t.applied)).map(lineOf),
            assumptions: attack.notes,
            incomplete: attack.attackRoll.incomplete
          }
        })
    })
  }

  // --- actions declared by any source ---------------------------------------
  for (const source of r.sources.active) {
    for (const action of source.actions ?? []) {
      const cost = costView(action.cost)
      const reasons: string[] = []

      const blocked = capabilityBlocked(cost.type)
      if (blocked) reasons.push(blocked)

      const gate = evaluate(action.requirements, {
        getStat: (p) => r.stat(p).total,
        hasCondition: (id) => r.hasCondition(id),
        hasCapability: (k) => r.capability(k).allowed,
        hasProficiency: (c) => r.hasProficiency(c),
        canCastSpells: () => true,
        characterLevel: () => characterLevel(r.character),
        classLevel: (id) => r.character.classLevels.find((c) => c.classId === id)?.level ?? 0,
        speciesId: () => r.character.speciesId,
        isEquipped: () => false,
        isAttunedTo: () => false,
        resourceRemaining: (id) => remaining.get(id) ?? 0,
        toggle: (id) => r.character.toggles[id] === true,
        dmFlag: (id) => r.character.dmFlags?.[id] === true,
        nameOf: (id) => resources.find((x) => x.id === id)?.label
          ?? content.items.get(id)?.name
          ?? id
      })
      if (!gate.value) reasons.push(gate.reason)

      const costs = Object.entries(action.costs ?? {}).map(([resourceId, amount]) => {
        const res = resources.find((x) => x.id === resourceId)
        return { resourceId, amount, label: `${amount} ${res?.label ?? resourceId}` }
      })

      out.push({
        id: action.id,
        label: action.name,
        ...(action.description ? { description: action.description } : {}),
        kind: action.kind ?? 'ability',
        cost,
        costs,
        ...(action.targets
          ? {
            targeting: {
              selector: action.targets.selector,
              ...(action.targets.count !== undefined ? { count: action.targets.count } : {}),
              ...(action.targets.rangeFeet !== undefined ? { rangeLabel: feet(action.targets.rangeFeet) } : {})
            }
          }
          : {}),
        available: reasons.length === 0,
        unavailableReasons: reasons,
        command: { type: 'useAbility', characterId, actionId: action.id, sourceId: source.id },
        sourceId: source.id,
        sourceLabel: source.name
      })
    }
  }

  // --- castable spells ------------------------------------------------------
  // A spell is an action. Making it one here is what lets the HUD, the action
  // list, the facet pills and the availability reasons all work on spells
  // without a line of spell-specific presentation code.
  for (const c of resolveSpellcasting(r, content).accessible) {
    const cheapest = c.slotOptions.find((s: SlotOption) => s.remaining > 0)

    // The one-shot effect at the cheapest slot the spell could use — a preview,
    // so what a player reads before casting Fire Bolt is the same "1d10 fire"
    // shape they read on a weapon before swinging it.
    const castLevel = cheapest?.level ?? c.spell.level
    const resolved = resolveSpellEffect(
      c.spell,
      { ability: c.ability, characterLevel: characterLevel(r.character), slotLevel: castLevel },
      r
    )
    const preview: ActionView['preview'] | undefined = resolved
      ? {
        ...(resolved.attackBonus !== undefined
          ? { attackBonus: resolved.attackBonus, attackBonusDisplay: signed(resolved.attackBonus) }
          : {}),
        ...(resolved.damage.length > 0 || resolved.healing
          ? { damageLabel: resolved.label }
          : {}),
        ...(resolved.damage[0] ? { damageType: resolved.damage[0].type } : {}),
        ...(resolved.save ? { saveDc: resolved.save.dc, saveAbility: resolved.save.ability } : {})
      }
      : undefined

    out.push({
      id: `cast:${c.spell.id}`,
      label: c.spell.name,
      ...(c.spell.effects.narrative?.[0]
        ? { description: c.spell.effects.narrative[0].text }
        : {}),
      kind: 'cast',
      cost: costView(c.spell.castingTime),
      costs: cheapest
        ? [{ resourceId: cheapest.resourceId, amount: 1, label: `1 ${cheapest.label}` }]
        : c.costs.map((x: CastableSpell['costs'][number]) => ({ resourceId: x.resourceId, amount: x.amount, label: x.label })),
      ...(preview ? { preview } : {}),
      available: c.available,
      unavailableReasons: c.unavailableReasons,
      command: { type: 'castSpell', characterId, spellId: c.spell.id },
      sourceId: c.grantSourceId,
      sourceLabel: c.grantSourceName
    })
  }

  // --- consumables ----------------------------------------------------------
  for (const inst of r.character.inventory.instances) {
    // Through the disguise, or "Use Potion of Poison" appears in the action
    // list of a player who is holding what they believe is a healing potion.
    const def = seenAs(inst, content, viewer).def
    if (def?.category !== 'consumable') continue
    const reasons: string[] = []
    const blocked = capabilityBlocked('action')
    if (blocked) reasons.push(blocked)
    out.push({
      id: `use:${inst.instanceId}`,
      label: `Use ${def.name}`,
      kind: 'item',
      cost: { type: 'action', label: 'Action' },
      costs: [],
      available: reasons.length === 0,
      unavailableReasons: reasons,
      command: { type: 'useItem', characterId, instanceId: inst.instanceId },
      sourceId: def.id,
      sourceLabel: def.name
    })
  }

  // --- baseline actions every character has ---------------------------------
  for (const basic of [
    { id: 'basic:dash', label: 'Dash' },
    { id: 'basic:disengage', label: 'Disengage' },
    { id: 'basic:dodge', label: 'Dodge' },
    { id: 'basic:hide', label: 'Hide' }
  ]) {
    const reasons: string[] = []
    const blocked = capabilityBlocked('action')
    if (blocked) reasons.push(blocked)
    out.push({
      id: basic.id, label: basic.label, kind: 'basic',
      cost: { type: 'action', label: 'Action' }, costs: [],
      available: reasons.length === 0, unavailableReasons: reasons,
      command: { type: 'useAbility', characterId, actionId: basic.id, sourceId: 'system:baseline' },
      sourceId: 'system:baseline', sourceLabel: 'Basic'
    })
  }

  return out
}

// ---------------------------------------------------------------------------

const LEVEL_LABEL = [
  'Cantrip', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'
]

function durationLabel(seconds: number | undefined, concentration: boolean): string | undefined {
  if (seconds === undefined) return concentration ? 'Concentration' : undefined
  const body = seconds >= 3600
    ? `${seconds / 3600} hour${seconds === 3600 ? '' : 's'}`
    : seconds >= 60
      ? `${seconds / 60} minute${seconds === 60 ? '' : 's'}`
      : `${seconds} second${seconds === 1 ? '' : 's'}`
  return concentration ? `Concentration, up to ${body}` : body
}

function rangeLabel(spell: SpellDefinition): string {
  switch (spell.rangeKind) {
    case 'self': return 'Self'
    case 'touch': return 'Touch'
    case 'sight': return 'Sight'
    case 'unlimited': return 'Unlimited'
    case 'special': return 'Special'
    default: return spell.rangeFeet !== undefined ? feet(spell.rangeFeet) : 'Ranged'
  }
}

function componentsLabel(c: SpellDefinition['components']): string {
  const parts: string[] = []
  if (c.verbal) parts.push('V')
  if (c.somatic) parts.push('S')
  if (c.material) parts.push(`M (${c.material}${c.consumed ? ', consumed' : ''})`)
  else if (c.materialCostCp !== undefined) parts.push('M')
  return parts.join(', ') || '—'
}

/**
 * The spellcasting view.
 *
 * Returned undefined rather than empty when the character has no magic, so the
 * UI's test is "is there spellcasting" rather than "is this list empty" — a
 * fighter should not render a spell tab with nothing in it.
 */
function buildSpellcasting(
  r: Resolution, content: ContentIndex, detail: DetailLevel, characterId: string
): SpellcastingView | undefined {
  const casting = resolveSpellcasting(r, content)
  if (!casting.active) return undefined

  const level = characterLevel(r.character)
  const spells: SpellView[] = casting.accessible.map((c: CastableSpell) => {
    // The effect at the cheapest slot it could use, so the Spells tab shows the
    // same "2d10 fire" a weapon shows on the HUD — one shape for both.
    const castLevel = c.slotOptions.find((s) => s.remaining > 0)?.level ?? c.spell.level
    const resolved = resolveSpellEffect(
      c.spell, { ability: c.ability, characterLevel: level, slotLevel: castLevel }, r
    )
    const effectPreview = resolved
      ? {
        label: resolved.label,
        delivery: resolved.delivery,
        ...(resolved.attackBonus !== undefined
          ? { attackBonusDisplay: signed(resolved.attackBonus) }
          : {}),
        ...(resolved.save
          ? { saveLabel: `DC ${resolved.save.dc} ${resolved.save.ability.toUpperCase()}` }
          : {})
      }
      : undefined

    return {
      id: c.spell.id,
      label: c.spell.name,
      level: c.spell.level,
      levelLabel: LEVEL_LABEL[c.spell.level] ?? `${c.spell.level}th`,
      school: c.spell.school,
      castingTimeLabel: costView(c.spell.castingTime).label,
      rangeLabel: rangeLabel(c.spell),
      ...(durationLabel(c.spell.durationSeconds, c.spell.concentration)
        ? { durationLabel: durationLabel(c.spell.durationSeconds, c.spell.concentration)! }
        : {}),
      concentration: c.spell.concentration,
      ritual: c.spell.ritual,
      componentsLabel: componentsLabel(c.spell.components),
      ...(c.spell.effects.narrative?.[0]
        ? { description: c.spell.effects.narrative[0].text }
        : {}),
      effects: describeSource(c.spell.effects, r, content),
      ...(effectPreview ? { effectPreview } : {}),
      prepared: c.prepared,
      alwaysAvailable: c.alwaysAvailable,
      available: c.available,
      unavailableReasons: c.unavailableReasons,
      slotOptions: c.slotOptions,
      command: { type: 'castSpell', characterId, spellId: c.spell.id },
      sourceLabel: c.grantSourceName
    }
  })

  const concentrating = r.character.concentratingOn
  const concentratingDef = concentrating
    ? r.character.effectInstances.find((e) => e.instanceId === concentrating)
    : undefined

  return {
    saveDc: readout(casting.saveDc, 'Spell save DC', detail),
    attackBonus: readout(casting.attackBonus, 'Spell attack', detail, signed),
    preparedCount: casting.preparedCount,
    preparedMax: casting.preparedMax,
    slots: casting.slots,
    spells,
    ...(concentrating && concentratingDef
      ? {
        concentratingOn: {
          instanceId: concentrating,
          label: content.spells.get(concentratingDef.definitionId)?.name ?? 'a spell'
        }
      }
      : {})
  }
}

function buildEffects(r: Resolution, content: ContentIndex): EffectView[] {
  const out: EffectView[] = []
  const counts = new Map<string, number>()
  for (const inst of r.character.conditions) {
    if (inst.suppressed) continue
    counts.set(inst.conditionId, (counts.get(inst.conditionId) ?? 0) + 1)
  }

  for (const source of r.sources.active) {
    if (source.kind !== 'condition') continue
    const def = content.conditions.get(source.id)
    const count = counts.get(source.id)
    out.push({
      id: source.id,
      label: source.name,
      kind: source.provenance === 'system' ? 'temporary' : 'condition',
      sourceLabel: source.name,
      effects: describeSource(source, r, content),
      ...(count !== undefined && count > 1 ? { instanceCount: count } : {}),
      removable: def !== undefined,
      ...(source.narrative?.[0] ? { description: source.narrative[0].text } : {})
    })
  }

  // Everything permanently shaping the character: species traits, class
  // features, feats. Items are excluded — they are explained where they are
  // held, and repeating them here would say the same thing twice.
  for (const source of r.sources.active) {
    if (source.kind === 'condition' || source.kind === 'item' || source.kind === 'spell') continue
    const described = describeSource(source, r, content)
    if (described.length === 0 && !source.narrative?.[0]) continue
    out.push({
      id: source.id,
      label: source.name,
      kind: 'passive',
      sourceLabel: source.name,
      effects: described,
      removable: false,
      ...(source.narrative?.[0] ? { description: source.narrative[0].text } : {})
    })
  }

  for (const inst of r.character.effectInstances) {
    if (inst.suppressed) continue
    const source = r.sources.active.find((s) => s.id === inst.definitionId)
    if (!source) continue
    out.push({
      id: inst.instanceId,
      label: source.name,
      kind: 'temporary',
      sourceLabel: source.name,
      effects: describeSource(source, r, content),
      ...(inst.durationSeconds ? { durationLabel: `${inst.durationSeconds}s` } : {}),
      removable: true
    })
  }

  return out
}

function buildNotices(
  r: Resolution, content: ContentIndex, viewer: Viewer
): NoticeView[] {
  const out: NoticeView[] = []

  // A disguised item's own source still resolves — it has to, or the poison
  // would not work when drunk — so its narrative would otherwise appear in the
  // notices under its real name. Suppressing by source id keeps the disguise
  // whole without touching resolution.
  const hidden = new Set<string>()
  for (const inst of r.character.inventory.instances) {
    const seen = seenAs(inst, content, viewer)
    if (seen.disguised && viewer.kind !== 'dm' && seen.trueDef) {
      hidden.add(seen.trueDef.effects.id)
    }
  }

  for (const source of r.sources.active) {
    if (hidden.has(source.id)) continue
    for (const clause of source.narrative ?? []) {
      if (source.kind === 'condition') continue // shown on the effect itself
      out.push({
        id: `${source.id}:${out.length}`,
        label: source.name,
        text: clause.text,
        ...(clause.toggleId
          ? { toggleId: clause.toggleId, toggleValue: r.character.toggles[clause.toggleId] === true }
          : {}),
        dmPromptable: clause.dmPromptable
      })
    }
  }
  return out
}

function buildProgression(
  r: Resolution, content: ContentIndex, detail: DetailLevel
): ProgressionView {
  const c = r.character
  const species = content.species.get(c.speciesId)
  const sub = species?.subspecies?.find((s) => s.id === c.subspeciesId)

  const hitDice = c.classLevels.map((cl) => {
    const def: ClassDefinition | undefined = content.classes.get(cl.classId)
    return {
      size: def?.hitDie ?? 8,
      total: cl.level,
      spent: c.hitDiceSpent[def?.hitDie ?? 8] ?? 0
    }
  })

  const pendingChoices: ProgressionView['pendingChoices'] = []
  for (const source of r.sources.active) {
    for (const sel of source.selections ?? []) {
      const answered = r.selection(source.id, sel.id)
      if (answered.length >= sel.count) continue
      pendingChoices.push({
        id: `${source.id}:${sel.id}`,
        prompt: sel.prompt,
        kind: sel.kind,
        count: sel.count - answered.length,
        ...(sel.from ? { from: sel.from } : {})
      })
    }
  }

  return {
    level: characterLevel(c),
    proficiencyBonus: readout(r.stat(PROFICIENCY_BONUS), 'Proficiency Bonus', detail, signed),
    classes: c.classLevels.map((cl) => ({
      classId: cl.classId,
      label: content.classes.get(cl.classId)?.name ?? cl.classId,
      level: cl.level,
      ...(cl.subclassId ? { subclassId: cl.subclassId } : {})
    })),
    species: {
      id: c.speciesId,
      label: species?.name ?? c.speciesId,
      ...(sub ? { subspeciesLabel: sub.name } : {})
    },
    hitDice,
    pendingChoices
  }
}

// ---------------------------------------------------------------------------

export function buildPlayerView(
  resolution: Resolution,
  content: ContentIndex,
  options: BuildOptions = {}
): PlayerView {
  const detail = options.detail ?? 'summary'
  const viewer = options.viewer ?? { kind: 'owner' }
  const c = resolution.character
  const spellcasting = buildSpellcasting(resolution, content, detail, c.id)
  const resources = buildResources(resolution, detail)
  const { items, slots } = buildInventory(resolution, content, detail, viewer)

  return {
    meta: {
      characterId: c.id,
      campaignId: c.campaignId,
      name: c.name,
      ...(c.playerId ? { playerId: c.playerId } : {}),
      detail,
      revision: options.revision ?? 0,
      diagnostics: resolution.diagnostics
    },
    vitals: buildVitals(resolution, detail),
    abilities: buildAbilities(resolution, detail, c.id),
    skills: buildSkills(resolution, detail, c.id),
    resources,
    equipment: slots,
    inventory: items,
    actions: buildActions(resolution, content, detail, resources, viewer),
    ...(spellcasting ? { spellcasting } : {}),
    effects: buildEffects(resolution, content),
    notices: buildNotices(resolution, content, viewer),
    progression: buildProgression(resolution, content, detail)
  }
}

/** Convenience: resolve and build in one step. */
export function playerViewOf(
  character: Parameters<typeof createResolution>[0],
  content: ContentIndex,
  options: BuildOptions = {}
): PlayerView {
  return buildPlayerView(createResolution(character, content), content, options)
}
