// Building the player view.
//
// One function, three detail levels, zero class knowledge. Every branch in this
// file is on *shape* — is this a weapon, does this action cost a resource — and
// never on identity. There is no `if (classId === ...)` and there never will be:
// if a class needs something the view cannot express, the fix is a new field
// here, which every class gets at once.

import type {
  Ability, ActionDefinition, ClassDefinition, ContentIndex, EffectSource,
  ItemDefinition, ResourceDefinition, StatValue, Term
} from '../rules/types.js'
import { ABILITIES } from '../rules/types.js'
import type { Resolution } from '../rules/resolve.js'
import { createResolution, characterLevel } from '../rules/resolve.js'
import { evaluate } from '../rules/predicates.js'
import { resolveCheck, resolvePassiveCheck } from '../rules/check.js'
import { resolveAttack } from '../rules/attack.js'
import { resolveResources, type ResourceValue } from '../rules/resources.js'
import {
  abilityModifierPath, abilityScorePath, ARMOR_CLASS, HP_MAX, INITIATIVE,
  PROFICIENCY_BONUS, speedPath
} from '../rules/statPaths.js'
import { SRD_SKILLS } from '../rules/index.js'
import type {
  AbilityView, ActionView, Breakdown, DetailLevel, EffectView,
  EquipmentSlotView, ItemGroup, ItemView, NoticeView, PlayerView,
  ProgressionView, ProficiencyState, Readout, ResourceView, SkillView, VitalsView
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

function lineOf(t: Term): Breakdown['lines'][number] {
  return {
    source: t.sourceName,
    sourceId: t.sourceId,
    provenance: t.provenance,
    ...(t.value !== undefined ? { amount: t.value } : {}),
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
function describeSource(source: EffectSource, resolution: Resolution): string[] {
  const out: string[] = []
  for (const m of source.modifiers) {
    if (m.note) { out.push(m.note); continue }
    if (m.channel === 'value' && m.target && m.op) {
      const n = resolution.evaluateValue(m.value, source.id)
      const stat = prettyPath(m.target)
      if (m.op === 'add') out.push(`${signed(n)} ${stat}`)
      else if (m.op === 'base') out.push(`${stat} ${n}`)
      else if (m.op === 'set') out.push(`${stat} becomes ${n}`)
      else if (m.op === 'min') out.push(`${stat} at least ${n}`)
      else if (m.op === 'max') out.push(`${stat} at most ${n}`)
      else if (m.op === 'multiply') out.push(`${stat} × ${n}`)
    } else if (m.channel === 'roll' && m.rollOp) {
      out.push(`${m.rollOp} on ${describeScope(m)}`)
    } else if (m.channel === 'capability' && m.capability) {
      out.push(m.capOp === 'revoke' ? `cannot ${m.capability}` : `can ${m.capability}`)
    }
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
  return {
    hitPoints: {
      current: c.hitPointsCurrent,
      max: readout(r.stat(HP_MAX), 'Maximum Hit Points', detail),
      temporary: c.hitPointsTemp
    },
    armorClass: readout(r.stat(ARMOR_CLASS), 'Armour Class', detail),
    speed: readout(r.stat(speedPath('walk')), 'Speed', detail, feet),
    initiative: readout(r.stat(INITIATIVE), 'Initiative', detail, signed),
    deathSaves: c.deathSaves,
    exhaustion: c.exhaustionLevel
  }
}

function buildAbilities(r: Resolution, detail: DetailLevel): AbilityView[] {
  return ABILITIES.map((a) => {
    const save = resolveCheck(r, { checkType: 'savingThrow', ability: a })
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
      }
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

function buildSkills(r: Resolution, detail: DetailLevel): SkillView[] {
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
      rollStateReasons: reasons
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

function buildInventory(
  r: Resolution, content: ContentIndex, detail: DetailLevel
): { items: ItemView[]; slots: EquipmentSlotView[] } {
  const c = r.character
  const equippedBySlot = c.inventory.equipped
  const equippedIds = new Set(Object.values(equippedBySlot))
  const attuned = new Set(c.inventory.attunedInstanceIds)
  const inactiveById = new Map(r.sources.inactive.map((i) => [i.source.id, i.reason]))

  const items: ItemView[] = []
  for (const inst of c.inventory.instances) {
    const def = content.items.get(inst.definitionId)
    if (!def) continue
    const isEquipped = equippedIds.has(inst.instanceId)
    const reason = inactiveById.get(def.effects.id)

    items.push({
      instanceId: inst.instanceId,
      itemId: def.id,
      label: inst.customName ?? def.name,
      group: itemGroupOf(def, isEquipped),
      provenance: def.provenance,
      quantity: inst.quantity ?? 1,
      ...(def.slot ? { slot: def.slot } : {}),
      equipped: isEquipped,
      requiresAttunement: def.requiresAttunement === true,
      attuned: attuned.has(inst.instanceId),
      identified: inst.identified,
      effectSummary: describeSource(def.effects, r),
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
        effectSummary: def ? describeSource(def.effects, r) : [],
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
  r: Resolution, content: ContentIndex, detail: DetailLevel, resources: ResourceView[]
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
      command: { type: 'makeAttack', characterId, weaponInstanceId: instanceId },
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
        dmFlag: (id) => r.character.dmFlags?.[id] === true
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

  // --- consumables ----------------------------------------------------------
  for (const inst of r.character.inventory.instances) {
    const def = content.items.get(inst.definitionId)
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
      effects: describeSource(source, r),
      ...(count !== undefined && count > 1 ? { instanceCount: count } : {}),
      removable: def !== undefined,
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
      effects: describeSource(source, r),
      ...(inst.durationSeconds ? { durationLabel: `${inst.durationSeconds}s` } : {}),
      removable: true
    })
  }

  return out
}

function buildNotices(r: Resolution): NoticeView[] {
  const out: NoticeView[] = []
  for (const source of r.sources.active) {
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
  const c = resolution.character
  const resources = buildResources(resolution, detail)
  const { items, slots } = buildInventory(resolution, content, detail)

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
    abilities: buildAbilities(resolution, detail),
    skills: buildSkills(resolution, detail),
    resources,
    equipment: slots,
    inventory: items,
    actions: buildActions(resolution, content, detail, resources),
    effects: buildEffects(resolution, content),
    notices: buildNotices(resolution),
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
