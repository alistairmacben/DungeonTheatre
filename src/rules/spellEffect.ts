// Resolving what a spell actually does when it lands.
//
// The companion to spells.ts: that file answers "can this be cast and what pays
// for it", this one answers "and then what happens". Kept apart because access
// and effect are genuinely different questions — a spell can be castable with no
// effect (Detect Magic) or have an effect while uncastable (no slot left).
//
// The output is deliberately shaped like a weapon attack's: a damage label the
// player reads, and structured damage the DM applies. A Fire Bolt and a
// longsword hand the table the same kind of thing, because in
// theatre-of-the-mind the DM adjudicates both. Nothing here touches a target;
// there are no targets to touch.

import type {
  Ability, DamageType, DiceExpr, SpellDamage, SpellDefinition
} from './types.js'
import { abilityModifierPath, SPELL_ATTACK, SPELL_SAVE_DC } from './statPaths.js'
import type { Resolution } from './resolve.js'

export interface ResolvedSpellEffect {
  delivery: 'attack' | 'save' | 'auto'
  /** Present for delivery 'attack': the caster's spell attack bonus. */
  attackBonus?: number
  /** Present for delivery 'save': the DC the target rolls against. */
  save?: { ability: Ability; dc: number; onSuccess: 'half' | 'none' }
  /** Damage after cantrip scaling and upcasting, ready to roll or hand over. */
  damage: SpellDamage[]
  /** How many separate instances of that damage — Magic Missile's darts. */
  instances: number
  /** Healing after upcasting, with the spellcasting modifier already folded in. */
  healing?: { dice: DiceExpr; flatAdd: number }
  /** "1d10 fire", "3 × 1d4+1 force", "2d8 radiant". The player-facing summary. */
  label: string
}

/** How many extra cantrip dice a caster of this character level has earned. */
function cantripSteps(characterLevel: number): number {
  return (characterLevel >= 5 ? 1 : 0)
    + (characterLevel >= 11 ? 1 : 0)
    + (characterLevel >= 17 ? 1 : 0)
}

function scaleDice(dice: DiceExpr, extraCount: number): DiceExpr {
  return { ...dice, count: dice.count + extraCount }
}

function diceLabel(dice: DiceExpr): string {
  const base = `${dice.count}d${dice.sides}`
  if (!dice.modifier) return base
  return dice.modifier > 0 ? `${base}+${dice.modifier}` : `${base}${dice.modifier}`
}

function damageLabel(damage: SpellDamage[], instances: number): string {
  if (damage.length === 0) return ''
  const body = damage.map((d) => `${diceLabel(d.dice)} ${d.type}`).join(' + ')
  return instances > 1 ? `${instances} × ${body}` : body
}

/**
 * Resolves a spell's one-shot effect at the level it is being cast.
 *
 * `characterLevel` drives cantrip scaling; `slotLevel` drives upcasting. The
 * two are different axes — a level-17 wizard's Fire Bolt is 4d10 whatever slot
 * it would use (none), while Magic Missile gains a dart per slot regardless of
 * character level. Both are applied here so no caller has to know the rule.
 */
export function resolveSpellEffect(
  spell: SpellDefinition,
  opts: { ability: Ability; characterLevel: number; slotLevel: number },
  r: Resolution
): ResolvedSpellEffect | undefined {
  const effect = spell.effect
  if (!effect) return undefined

  const aboveBase = Math.max(0, opts.slotLevel - spell.level)

  // Damage, with both scaling axes folded in. Cantrip scaling adds dice to the
  // FIRST damage component only, matching the SRD (Fire Bolt's mote, not a
  // secondary rider). Upcasting adds its own dice component if declared.
  let damage: SpellDamage[] = (effect.damage ?? []).map((d) => ({ ...d, dice: { ...d.dice } }))
  if (effect.cantripScaling && damage[0]) {
    damage[0] = { ...damage[0], dice: scaleDice(damage[0].dice, cantripSteps(opts.characterLevel)) }
  }
  let instances = effect.instances ?? 1
  if (aboveBase > 0 && effect.perSlotAbove) {
    const up = effect.perSlotAbove
    if (up.instances) instances += up.instances * aboveBase
    if (up.damageDice && damage[0]) {
      damage[0] = {
        ...damage[0],
        dice: scaleDice(damage[0].dice, up.damageDice.count * aboveBase)
      }
    }
  }

  // Healing, with the spellcasting modifier and any per-slot dice applied.
  let healing: { dice: DiceExpr; flatAdd: number } | undefined
  if (effect.healing) {
    const dice = { ...effect.healing.dice }
    if (aboveBase > 0 && effect.perSlotAbove?.healingDice) {
      dice.count += effect.perSlotAbove.healingDice.count * aboveBase
    }
    const flatAdd = effect.healing.addSpellMod
      ? r.stat(abilityModifierPath(opts.ability)).total
      : 0
    healing = { dice, flatAdd }
  }

  const parts: string[] = []
  if (damage.length > 0) parts.push(damageLabel(damage, instances))
  if (healing) {
    const h = healing.flatAdd !== 0
      ? `${diceLabel(healing.dice)}${healing.flatAdd >= 0 ? '+' : ''}${healing.flatAdd}`
      : diceLabel(healing.dice)
    parts.push(`heal ${h}`)
  }

  return {
    delivery: effect.delivery,
    ...(effect.delivery === 'attack' ? { attackBonus: r.stat(SPELL_ATTACK).total } : {}),
    ...(effect.delivery === 'save' && effect.save
      ? { save: { ...effect.save, dc: r.stat(SPELL_SAVE_DC).total } }
      : {}),
    damage,
    instances,
    ...(healing ? { healing } : {}),
    label: parts.join(', ')
  }
}

export type { DamageType }
