// Collecting the effect sources that are live on a character.
//
// The inactive list is a required output, not a debug aid: it is what lets the
// HUD say "Grappler is inactive: Strength 12 is below the required 13" instead
// of silently omitting it.

import type {
  Ability, Character, ClassFeatureDefinition, CollectedSources, ContentIndex, EffectSource,
  ItemDefinition, ItemInstance, Modifier, ProficiencyGrant
} from './types.js'
import { evaluate, type PredicateEnv } from './predicates.js'
import { exhaustionSource } from './conditions.js'
import { abilityScorePath } from './statPaths.js'

const MAX_ATTUNED = 3

/** Sources whose modifiers carry their owner's id, ready for the pipeline. */
function stamp(source: EffectSource): EffectSource {
  return {
    ...source,
    modifiers: source.modifiers.map<Modifier>((m) => ({ ...m, sourceId: m.sourceId ?? source.id })),
    proficiencies: source.proficiencies?.map<ProficiencyGrant>(
      (p) => ({ ...p, sourceId: p.sourceId ?? source.id })
    )
  }
}

interface Candidate {
  source: EffectSource
  /** Gates checked before the source's own activation predicate. */
  preconditionReason?: string
}

function itemCandidates(character: Character, content: ContentIndex): Candidate[] {
  const out: Candidate[] = []
  const equippedInstanceIds = new Set(Object.values(character.inventory.equipped))
  const attuned = new Set(character.inventory.attunedInstanceIds)

  // Attunement is a three-slot resource. Anything beyond the third is inert,
  // and says so.
  const attunementOrder = character.inventory.attunedInstanceIds
  const overAttunementLimit = new Set(attunementOrder.slice(MAX_ATTUNED))

  for (const instance of character.inventory.instances) {
    const def = content.items.get(instance.definitionId)
    if (!def) continue
    const reason = itemPrecondition(def, instance, equippedInstanceIds, attuned, overAttunementLimit, character)
    out.push({ source: stamp(def.effects), ...(reason ? { preconditionReason: reason } : {}) })
  }
  return out
}

function itemPrecondition(
  def: ItemDefinition,
  instance: ItemInstance,
  equipped: Set<string | undefined>,
  attuned: Set<string>,
  overLimit: Set<string>,
  character: Character
): string | undefined {
  const isEquipped = equipped.has(instance.instanceId)

  if (def.slot && !isEquipped) {
    const where = instance.containerId ? ` (in container "${instance.containerId}")` : ''
    return `not equipped${where}`
  }

  // Boots, gloves, bracers: both halves or nothing.
  if (def.pairedWith && isEquipped) {
    const other = character.inventory.equipped[def.pairedWith]
    if (!other) return `paired item requires both halves; ${def.pairedWith} slot is empty`
    const otherInstance = character.inventory.instances.find((i) => i.instanceId === other)
    if (otherInstance && otherInstance.definitionId !== def.id) {
      return `paired item requires a matching pair; ${def.pairedWith} holds a different item`
    }
  }

  if (def.requiresAttunement) {
    if (overLimit.has(instance.instanceId)) {
      return `attunement limit reached (${MAX_ATTUNED} items)`
    }
    if (!attuned.has(instance.instanceId)) {
      // Not attuned still grants the item's non-magical benefits, which are
      // modelled as a separate source by content that needs them.
      return 'not attuned'
    }
  }
  return undefined
}

export function collectCandidates(character: Character, content: ContentIndex): Candidate[] {
  const out: Candidate[] = []

  const species = content.species.get(character.speciesId)
  if (species) {
    out.push({ source: stamp(species.effects) })
    const sub = species.subspecies?.find((s) => s.id === character.subspeciesId)
    if (sub) out.push({ source: stamp(sub.effects) })
  }

  for (const cl of character.classLevels) {
    const def = content.classes.get(cl.classId)
    if (!def) continue

    const featureCandidate = (
      feature: ClassFeatureDefinition, ownerName: string
    ): Candidate => (
      feature.grantedAtLevel > cl.level
        ? {
          source: stamp(feature.effects),
          preconditionReason:
            `${ownerName} level ${feature.grantedAtLevel} required (currently ${cl.level})`
        }
        : { source: stamp(feature.effects) }
    )

    for (const feature of def.features) out.push(featureCandidate(feature, def.name))

    // A subclass is a second feature list on the same level track, not a
    // different kind of thing — so once the choice is made its features go
    // through exactly the machinery above. What differs is only whether the
    // choice was made, and whether it was a legal one to make.
    if (!def.subclassSlot) continue

    // A subclass counts only if it exists AND belongs to this class. Nothing in
    // the type system stops a stored row saying a barbarian took College of
    // Lore, so the check lives here, where the grant happens.
    const named = cl.subclassId ? content.subclasses.get(cl.subclassId) : undefined
    const subclass = named?.classId === cl.classId ? named : undefined

    if (!subclass) {
      // No usable subclass — never chosen, an id nothing defines, or one
      // belonging to another class. All three are the same thing from here:
      // the character is owed a decision, and is told so from the level it was
      // offered. The alternative is a 17th-level monk quietly missing four
      // features and looking identical to one who has them.
      if (cl.level >= def.subclassSlot.grantedAtLevel) {
        const why = cl.subclassId
          ? `"${cl.subclassId}" is not one of its subclasses`
          : 'it has not been chosen'
        out.push({
          source: stamp({
            id: `${def.id}.subclass-pending`,
            name: `${def.name}: subclass not chosen`,
            provenance: def.provenance,
            contentVersion: def.contentVersion,
            kind: 'feature',
            activation: { always: true },
            modifiers: [],
            completeness: 'complete',
            narrative: [{
              text: `Choose your ${def.name} subclass — ${why}. It was available at `
                + `level ${def.subclassSlot.grantedAtLevel} and grants features you `
                + 'are not receiving until you do.',
              dmPromptable: true
            }]
          })
        })
      }
      continue
    }

    for (const feature of subclass.features) {
      out.push(featureCandidate(feature, subclass.name))
    }
  }

  for (const choice of character.buildChoices) {
    if (choice.kind === 'feat' && typeof choice.value === 'string') {
      const feat = content.feats.get(choice.value)
      if (!feat) continue
      // The prerequisite is folded into activation so it is re-evaluated every
      // resolve. "If you ever lose a feat's prerequisite, you can't use that
      // feat until you regain the prerequisite."
      out.push({
        source: stamp({
          ...feat.effects,
          activation: { all: [feat.prerequisite, feat.effects.activation] }
        })
      })
      continue
    }

    // An Ability Score Improvement was, until now, a value the type declared
    // and nothing consumed — picking one raised nothing on the sheet. The
    // 20-cap clamp is automatic (abilityScorePath depends on abilityMaxPath),
    // so this is exactly the same shape a species racial bonus already uses.
    if (choice.kind === 'abilityScoreImprovement' && typeof choice.value === 'object') {
      const raised = choice.value as Partial<Record<Ability, number>>
      const modifiers: Modifier[] = Object.entries(raised).map(([a, n]) => ({
        id: `${choice.atLevel}.asi.${a}`, channel: 'value', target: abilityScorePath(a as Ability),
        op: 'add', value: n, permanence: 'persistent'
      }))
      if (modifiers.length === 0) continue
      out.push({
        source: stamp({
          id: `build-choice.asi.${choice.atLevel}`, name: 'Ability Score Improvement',
          provenance: 'srd', contentVersion: 1, kind: 'feature',
          activation: { always: true }, modifiers, completeness: 'complete'
        })
      })
    }
  }

  out.push(...itemCandidates(character, content))

  // Conditions: one source per distinct condition, regardless of how many
  // instances imposed it. "A creature either has a condition or doesn't."
  const distinct = new Set<string>()
  for (const inst of character.conditions) {
    if (inst.suppressed) continue
    distinct.add(inst.conditionId)
  }
  // Implied conditions (paralyzed implies incapacitated) are pulled in too.
  let frontier = [...distinct]
  while (frontier.length > 0) {
    const next: string[] = []
    for (const id of frontier) {
      const def = content.conditions.get(id)
      for (const implied of def?.implies ?? []) {
        if (!distinct.has(implied)) { distinct.add(implied); next.push(implied) }
      }
    }
    frontier = next
  }
  for (const id of distinct) {
    const def = content.conditions.get(id)
    if (def) out.push({ source: stamp(def.effects) })
  }

  // Exhaustion is a level, not a set of instances, and its effects are
  // cumulative — so the source is assembled from levels 1..n rather than looked
  // up as content.
  const exhaustion = exhaustionSource(character.exhaustionLevel)
  if (exhaustion) out.push({ source: stamp(exhaustion) })

  for (const inst of character.effectInstances) {
    if (inst.suppressed) continue
    const spell = content.spells.get(inst.definitionId)
    if (spell) { out.push({ source: stamp(spell.effects) }); continue }
    const item = content.items.get(inst.definitionId)
    if (item) out.push({ source: stamp(item.effects) })
  }

  // Whatever the DM improvised at the table, resolved exactly like content.
  for (const source of character.adHocSources ?? []) out.push({ source: stamp(source) })

  for (const ambient of content.ambient ?? []) out.push({ source: stamp(ambient) })

  return out
}

/** Applies each candidate's activation predicate against the supplied environment. */
export function activate(candidates: Candidate[], env: PredicateEnv): CollectedSources {
  const active: EffectSource[] = []
  const inactive: { source: EffectSource; reason: string }[] = []

  for (const c of candidates) {
    if (c.preconditionReason) {
      inactive.push({ source: c.source, reason: c.preconditionReason })
      continue
    }
    const r = evaluate(c.source.activation, env)
    if (r.value) active.push(c.source)
    else inactive.push({ source: c.source, reason: r.reason })
  }

  return { active, inactive }
}
