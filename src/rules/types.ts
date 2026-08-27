// The canonical vocabulary. Layer 1 of docs/architecture.md.
//
// Everything that can change a character — species, class features, feats,
// weapons, armour, spells, conditions, DM-authored items — is an EffectSource
// carrying Modifiers, Actions, Triggers and Resources. There is deliberately no
// per-content type with its own calculation hook: if SRD content needs a
// capability the vocabulary lacks, the fix is to extend this file, which
// extends DM-authored content at the same time.
//
// Nothing here performs I/O and nothing here generates randomness.

// ---------------------------------------------------------------------------
// Identity and provenance
// ---------------------------------------------------------------------------

/** Where a definition came from. `dm` and `srd` are resolved identically. */
export type Provenance = 'srd' | 'dm' | 'system'

export interface Identity {
  id: string
  name: string
  provenance: Provenance
  /** Bumped on every authored edit so character state can pin what it was built against. */
  contentVersion: number
  /** Set when provenance is 'dm'. */
  campaignId?: string
  /** "SRD 5.1 p143", or a DM's own note. */
  sourceRef?: string
}

// ---------------------------------------------------------------------------
// Abilities, skills, dice
// ---------------------------------------------------------------------------

export type Ability = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
export const ABILITIES: readonly Ability[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

export type SkillId = string
export type ToolId = string
export type ConditionId = string
export type ResourceId = string
export type ClassId = string
export type SpeciesId = string
export type ToggleId = string

export interface SkillDefinition {
  id: SkillId
  name: string
  /**
   * The ability a check with this skill *usually* uses. A default, never a
   * constraint — the SRD explicitly sanctions Constitution (Athletics) and
   * Strength (Intimidation), and a RollRequest always names its own ability.
   */
  defaultAbility: Ability
}

/** e.g. { count: 2, sides: 6, modifier: 1 } for 2d6+1. */
export interface DiceExpr {
  count: number
  sides: number
  modifier?: number
}

/**
 * A value that depends on character state.
 *
 * Needed because several effects are formulas rather than constants: Tough
 * raises the hit point maximum by twice your level, Durable sets a Hit Die
 * floor of twice your Constitution modifier, Inspiring Leader grants temporary
 * hit points equal to level + Charisma modifier. Without this every such effect
 * would need bespoke code, which is precisely what the architecture forbids.
 */
export type ValueExpr =
  | number
  | DiceExpr
  | { stat: StatPath }
  | { characterLevel: true }
  | { classLevel: string }
  /**
   * A value read straight out of a level column, `values[0]` being level 1.
   *
   * Most SRD progressions are not formulas. A wizard's 1st-level slots go
   * 2, 3, 4, 4, 4… and a barbarian's rages go 2, 2, 3, 3, 3, 4… — sequences
   * with no closed form, printed in the book as a column of numbers. Writing
   * them as a stack of `classLevelAtLeast`-gated increments is possible but
   * turns a table anyone can check against the page into arithmetic nobody
   * can, which at twelve classes is exactly how a wrong number survives.
   *
   * So the table is transcribed as a table. Levels past the end of the array
   * hold its last value, which is what "and it stays there" means in a book
   * that stops printing at 20.
   */
  | { characterLevelTable: number[] }
  | { classLevelTable: { classId: string; values: number[] } }
  | { sum: ValueExpr[] }
  | { product: ValueExpr[] }
  | { min: ValueExpr[] }
  | { max: ValueExpr[] }
  | { floor: ValueExpr }
  | { ceil: ValueExpr }
  /** Resolves to the value the player chose for a selection on this source. */
  | { selection: string }

export type DamageType =
  | 'acid' | 'bludgeoning' | 'cold' | 'fire' | 'force' | 'lightning'
  | 'necrotic' | 'piercing' | 'poison' | 'psychic' | 'radiant'
  | 'slashing' | 'thunder'

// ---------------------------------------------------------------------------
// Stat paths
// ---------------------------------------------------------------------------

/**
 * A closed, declared registry key — never a free-form string in content.
 * See statPaths.ts for the registry and each path's resolution policy.
 */
export type StatPath = string

export type RoundingMode = 'floor' | 'ceil' | 'round' | 'none'

/** How several `multiply` modifiers on the same path combine. */
export type MultiplyComposition = 'product' | 'single-highest'

export interface StatPathDefinition {
  path: StatPath
  /** Paths this one reads. Used to order resolution and to detect cycles. */
  dependsOn: StatPath[]
  rounding: RoundingMode
  multiplyComposition: MultiplyComposition
  /** Intrinsic value before any modifier, if the path has one. */
  intrinsicBase?: number
  /**
   * Computed paths derive from other paths rather than accumulating modifiers
   * (ability modifier from ability score, for example). Modifiers may still
   * target them.
   */
  compute?: (ctx: ComputeContext) => number
  /** Recorded on every StatValue this path produces. */
  notes?: string[]
}

export interface ComputeContext {
  /** Resolve another path, memoised within the same resolution tree. */
  get(path: StatPath): number
}

// ---------------------------------------------------------------------------
// Roll scope — a predicate over roll tags, not a stat path
// ---------------------------------------------------------------------------

export type RollKind = 'check' | 'save' | 'attack' | 'damage' | 'death' | 'initiative'
export type Sense = 'sight' | 'hearing'

/**
 * "Advantage on saving throws against poison" is not a stat path — it is a
 * predicate over the *incoming* effect's tags. Every RollRequest carries
 * semantic tags and RollScope filters on them.
 */
export interface RollScope {
  kinds?: RollKind[]
  abilities?: Ability[]
  skills?: SkillId[]
  tools?: ToolId[]
  /** Tags on the effect being resisted: 'poison', 'magic', 'disease', 'charmed'. */
  againstTags?: string[]
  /** The check relies on these senses; blinded auto-fails sight checks. */
  requiresSenses?: Sense[]
  /** Tags on the target: 'undead', 'demon', 'dragon'. */
  targetTags?: string[]
  /** Tags on the activity: 'climb', 'swim', 'stealth-silent'. */
  activityTags?: string[]
}

// ---------------------------------------------------------------------------
// Capabilities
// ---------------------------------------------------------------------------

export type CapabilityKey =
  | 'takeActions' | 'takeReactions' | 'takeBonusActions'
  | 'move' | 'speak' | 'see' | 'hear'
  | 'castSpells' | 'concentrate' | 'breathe'
  | 'benefitFromSpeedBonus' | 'standUp'
  | 'beCharmed' | 'beFrightened' | 'ageNormally'
  | 'beSurprised' | 'beCriticallyHit'

export const CAPABILITY_KEYS: readonly CapabilityKey[] = [
  'takeActions', 'takeReactions', 'takeBonusActions',
  'move', 'speak', 'see', 'hear',
  'castSpells', 'concentrate', 'breathe',
  'benefitFromSpeedBonus', 'standUp',
  'beCharmed', 'beFrightened', 'ageNormally',
  'beSurprised', 'beCriticallyHit'
]

// ---------------------------------------------------------------------------
// Predicates
// ---------------------------------------------------------------------------

export type Predicate =
  | { all: Predicate[] }
  | { any: Predicate[] }
  | { not: Predicate }
  | { always: true }
  | { statAtLeast: [StatPath, number] }
  | { statAtMost: [StatPath, number] }
  | { hasCapability: CapabilityKey }
  | { hasProficiency: ProficiencyCategory }
  | { canCastSpells: true }
  | { hasCondition: ConditionId }
  | { characterLevelAtLeast: number }
  | { classLevelAtLeast: [ClassId, number] }
  | { speciesIs: SpeciesId }
  | { isEquipped: string }
  | { isAttunedTo: string }
  | { resourceAtLeast: [ResourceId, number] }
  /**
   * The narrative escape hatch. Stonecunning's "related to the origin of
   * stonework" cannot be judged by the engine, so the modifier is real and
   * present but gated on a toggle the player flips. It appears in every
   * breakdown as not-applied-because-not-toggled rather than vanishing.
   */
  | { playerToggle: ToggleId }
  | { dmFlag: string }

// ---------------------------------------------------------------------------
// Modifier — the atom of all three channels
// ---------------------------------------------------------------------------

export type ValueOp =
  | 'base' | 'add' | 'multiply' | 'set' | 'min' | 'max' | 'suppress' | 'replace'

export const VALUE_OPS: readonly ValueOp[] =
  ['base', 'add', 'multiply', 'set', 'min', 'max', 'suppress', 'replace']

export type RollOp =
  | 'advantage' | 'disadvantage'
  | 'autoFail' | 'autoSucceed'
  | 'reroll' | 'replaceRoll' | 'critRange'
  /** Treat any damage die that rolls below this as this value (Elemental Adept). */
  | 'minimumDieFace'
  /** Reroll the damage dice and keep either total (Savage Attacker). */
  | 'rerollDamageDice'
  /** The attack scores a critical on a hit, regardless of the die (paralyzed within 5 ft). */
  | 'autoCritical'

export type CapabilityOp = 'grant' | 'revoke'

/** Lifecycle metadata only. Temporary and persistent modifiers combine identically. */
export type Permanence = 'persistent' | 'temporary'

/** What a `suppress` modifier removes from the pipeline. */
export interface SuppressionTarget {
  tags?: string[]
  sourceIds?: string[]
  ops?: (ValueOp | RollOp)[]
  paths?: StatPath[]
  scope?: RollScope
}

export interface Modifier {
  id: string
  /** Filled in by collectSources; content authors do not set it. */
  sourceId?: string
  channel: 'value' | 'roll' | 'capability'

  // --- value channel ---
  target?: StatPath
  op?: ValueOp
  value?: ValueExpr
  /** Only for op 'suppress'. */
  suppresses?: SuppressionTarget

  // --- roll channel ---
  scope?: RollScope
  rollOp?: RollOp
  /** For 'reroll' (which faces trigger it) and 'critRange' / 'replaceRoll'. */
  rollValue?: number

  // --- capability channel ---
  capability?: CapabilityKey
  capOp?: CapabilityOp

  /**
   * Whose rolls this affects.
   *
   * 'self' is the default. 'attackersAgainstSelf' is how the SRD's
   * "attack rolls against the creature have advantage" is expressed: the
   * modifier lives on the *defender* and is picked up by the attacker's roll
   * resolution. Without it, every such clause would need the attacker to know
   * about every condition by name.
   */
  appliesTo?: 'self' | 'attackersAgainstSelf'

  /** Situational gate evaluated at resolve time. */
  condition?: Predicate
  /** For suppression targeting, dedup and breakdown grouping. */
  tags?: string[]
  /** Tiebreak within a stage. Higher wins. Default 0. */
  priority?: number
  permanence: Permanence
  /**
   * Two modifiers sharing a stackKey are the same effect from the same source
   * kind: only the highest applies. Two casts of *bless* give one bonus.
   */
  stackKey?: string
  /** Shown in the breakdown when this modifier applies. */
  note?: string
}

// ---------------------------------------------------------------------------
// Proficiency
// ---------------------------------------------------------------------------

export type ProficiencyLevel = 'half' | 'proficient' | 'expertise'

export const PROFICIENCY_MULTIPLIER: Record<ProficiencyLevel, number> = {
  half: 0.5,
  proficient: 1,
  expertise: 2
}

/**
 * What a proficiency is *in*.
 *
 * Skills, tools and saves are roll-scoped; armour and weapon proficiency are
 * not — they gate item use rather than modifying a roll. Both kinds live here
 * so there is one proficiency system rather than two.
 */
export type ProficiencyCategory =
  | { kind: 'skill'; id: SkillId }
  | { kind: 'tool'; id: ToolId }
  | { kind: 'save'; ability: Ability }
  /**
   * A raw ability check, not a skill: the bard's Jack of All Trades and the
   * Champion's Remarkable Athlete both grant half proficiency to checks made
   * with an ability rather than to any named skill.
   *
   * "That doesn't already include your proficiency bonus" needs no rule of its
   * own — the resolver takes the highest multiplier among matching grants, so
   * a check the character is already proficient in keeps full proficiency and
   * everything else takes the half.
   */
  | { kind: 'abilityCheck'; ability: Ability }
  | { kind: 'armor'; category: ArmorCategory }
  | { kind: 'weaponCategory'; category: WeaponCategory }
  | { kind: 'weapon'; itemId: string }

export type ArmorCategory = 'light' | 'medium' | 'heavy' | 'shield'
export type WeaponCategory = 'simple' | 'martial' | 'improvised' | 'unarmed'

export interface ProficiencyGrant {
  id: string
  sourceId?: string
  category: ProficiencyCategory
  /** Optional narrowing for roll-scoped grants, e.g. "only to climb or swim". */
  scope?: RollScope
  level: ProficiencyLevel
  /**
   * Jack of All Trades rounds down, Remarkable Athlete rounds up — from the
   * same proficiency bonus. Not interchangeable.
   */
  rounding: RoundingMode
  /**
   * True when the source grants the underlying proficiency as well as
   * multiplying it. Stonecunning does; Artificer's Lore does not, which is why
   * Artificer's Lore doubles zero for a non-proficient character.
   */
  grantsProficiency: boolean
  condition?: Predicate
}

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

export type RefreshRule =
  | { kind: 'shortRest' }
  | { kind: 'longRest' }
  | { kind: 'longRestFraction'; numerator: number; denominator: number; minimum: number }
  | { kind: 'dawn'; amount?: number | DiceExpr }
  | { kind: 'dusk'; amount?: number | DiceExpr }
  | { kind: 'daysElapsed'; days: number }
  | { kind: 'cumulativeDuration'; totalSeconds: number; regainSeconds?: number; perSeconds?: number }
  | { kind: 'never' }

/**
 * A rendering hint carried by the content, not a rule. The UI renders whatever
 * hint it is given and falls back to 'uses' if none — which is what keeps
 * `if (class === 'sorcerer')` out of the interface.
 */
export type ResourceDisplay = 'uses' | 'pips' | 'pool' | 'dice' | 'slots'

export interface ResourceDefinition {
  id: ResourceId
  name: string
  display?: ResourceDisplay
  /** Visual grouping only, e.g. "Spell Slots". Never a rules concept. */
  group?: string
  order?: number
  /** A stat path resolved for this character, or a constant. */
  max: number | StatPath
  refresh: RefreshRule
  /**
   * Wands and staffs roll a d20 on spending the last charge; a 1 destroys or
   * degrades the item. Declared, not special-cased.
   */
  burnout?: { onRoll: number[]; outcome: 'destroy' | 'degrade'; onRollRestore?: number[] }
  /**
   * Marks this resource as a spell slot of a given level.
   *
   * Explicit rather than inferred from the id, so a warlock's single pool of
   * high-level slots, a wizard's ladder and a DM-invented "blood magic" slot
   * are all discoverable without parsing names.
   *
   * The level is a ValueExpr because the warlock's is not a constant: it has
   * one pool whose *level* climbs 1st→5th across levels 1-9, which a literal
   * number cannot say. Modelling that as five pools with four of them empty
   * was the workaround, and it put four rows of "0 slots" behind every
   * warlock. A number is still a valid ValueExpr, so every other caster is
   * unchanged.
   */
  spellSlot?: { group: string; level: ValueExpr }
}

// ---------------------------------------------------------------------------
// Actions, reactions, triggers, targets
// ---------------------------------------------------------------------------

export type ActionCost =
  | 'action' | 'bonusAction' | 'reaction' | 'free' | 'movement'
  | { minutes: number } | { hours: number } | { days: number }

export interface TargetSpec {
  selector: 'self' | 'creature' | 'object' | 'point' | 'area'
  count?: number
  rangeFeet?: number
  restrictions?: Predicate
}

export type ActionKind = 'attack' | 'cast' | 'ability' | 'item' | 'movement' | 'basic'

export interface ActionDefinition {
  id: string
  name: string
  /** How the UI facets this action. Data, so a new kind needs no menu change. */
  kind?: ActionKind
  description?: string
  cost: ActionCost
  /** Everything that must hold for this to be usable. Drives "why is this greyed out?". */
  requirements: Predicate
  targets?: TargetSpec
  /** Resource costs, in resource id → amount. */
  costs?: Record<ResourceId, number>
  /** Free-form parameters the caller supplies (slot level, mode, charge count). */
  parameters?: string[]
}

export type TriggerWindow = 'immediate' | 'reaction' | 'player-window' | 'scheduled'

export interface EventPredicate {
  types?: string[]
  /** Constrains the event payload; kept deliberately narrow. */
  matchTags?: string[]
  subject?: 'self' | 'other' | 'any'
}

export interface TriggerDefinition {
  id: string
  event: EventPredicate
  window: TriggerWindow
  /** True for player-written conditions (glyph of warding, magic mouth). */
  authored: boolean
  cooldownSeconds?: number
  oneShot?: boolean
}

// ---------------------------------------------------------------------------
// Narrative — what the engine deliberately does not decide
// ---------------------------------------------------------------------------

export interface NarrativeClause {
  text: string
  /** Links this clause to the toggle that gates its modifier, if any. */
  toggleId?: ToggleId
  dmPromptable: boolean
}

// ---------------------------------------------------------------------------
// EffectSource — the single unifying abstraction
// ---------------------------------------------------------------------------

export type EffectSourceKind =
  | 'species' | 'class' | 'feature' | 'feat' | 'item'
  | 'spell' | 'condition' | 'environment'

/**
 * 'partial' means the loaded content is known to be missing mechanics — the
 * four conditions whose text was lost from the supplied appendix. Every
 * StatValue touching a partial source is flagged `incomplete` so the UI can say
 * so rather than silently under-reporting.
 */
export type Completeness = 'complete' | 'partial'

/**
 * A choice the player makes when they take this source: which ability Resilient
 * raises, which damage type Elemental Adept names, which three skills Skilled
 * grants. Modifiers reference the answer with `{ selection: id }`, so a
 * selectable feat needs no code of its own.
 */
export interface SelectionDefinition {
  id: string
  prompt: string
  kind: 'ability' | 'skill' | 'tool' | 'damageType' | 'weapon' | 'language' | 'spellList' | 'other'
  count: number
  /** Candidate values; omitted means "any valid value of this kind". */
  from?: string[]
}

/**
 * A choice made at the moment of acting rather than when the source was taken:
 * Great Weapon Master's -5/+10, Sharpshooter's -5/+10, a Battle Master
 * manoeuvre. The caller passes elected option ids into the roll context and
 * their modifiers join the pipeline like any other.
 */
export interface ActionOption {
  id: string
  label: string
  /** When this option may be offered at all. */
  requirements?: Predicate
  /** Which rolls it applies to. */
  scope?: RollScope
  modifiers: Modifier[]
}

export interface EffectSource extends Identity {
  kind: EffectSourceKind
  /** When this source is live. Evaluated against derived stats, so it can feed back. */
  activation: Predicate
  modifiers: Modifier[]
  proficiencies?: ProficiencyGrant[]
  selections?: SelectionDefinition[]
  options?: ActionOption[]
  actions?: ActionDefinition[]
  triggers?: TriggerDefinition[]
  resources?: ResourceDefinition[]
  /** Spells this source makes castable. See SpellGrant. */
  spells?: SpellGrant[]
  narrative?: NarrativeClause[]
  completeness: Completeness
}

/**
 * How a source hands a character access to spells.
 *
 * One shape covers every route into a spell list, because they differ only in
 * two axes: where the list comes from, and whether it must be prepared first.
 * A tiefling's innate *thaumaturgy*, a cleric's domain spells, a wizard's
 * spellbook and a sorcerer's known spells are all this type — which is what
 * keeps the caster from needing class-specific code.
 */
export interface SpellGrant {
  /** Explicit spell ids. Empty when the player chooses via `selectionId`. */
  spellIds?: string[]
  /**
   * A selection the player has answered, holding the chosen spell ids. This is
   * the same selection machinery feats already use — choosing spells at
   * level-up is not a different kind of choice from choosing a skill.
   */
  selectionId?: string
  /**
   * Every spell in the content set on this list, up to `maxLevel`. Prepared
   * casters draw from a whole list rather than a fixed set.
   */
  fromList?: { listId: string; maxLevel: ValueExpr }
  /**
   * 'always' — castable without preparing: cantrips, domain spells, innate
   * racial magic. 'prepared' — must be on the character's prepared list.
   */
  availability: 'always' | 'prepared'
  /**
   * Resource group whose slots pay for the cast. Absent means the spell costs
   * no slot at all, which is what makes a cantrip a cantrip and an innate
   * once-a-day spell a resource with its own refresh.
   */
  slotGroup?: string
  /** Fixed resource cost, for innate spells that do not use slots. */
  costs?: Record<ResourceId, number>
  /**
   * The ability powering save DCs and attack rolls for these spells. The DC
   * itself is a stat, so this only selects which modifier feeds it.
   */
  ability: Ability
}

// ---------------------------------------------------------------------------
// Content definitions (layers 2 and 3 — identical types, different provenance)
// ---------------------------------------------------------------------------

export type EquipmentSlotId =
  | 'armor' | 'shield' | 'mainHand' | 'offHand' | 'head' | 'cloak'
  | 'boots' | 'gloves' | 'bracers' | 'amulet' | 'ring1' | 'ring2' | 'belt'

/**
 * The mechanical facts about a weapon, held on the definition. The attack
 * resolver reads these; the weapon never computes anything itself.
 */
export interface WeaponProfile {
  category: WeaponCategory
  /** 'melee' or 'ranged' — which ability the attack defaults to. */
  reach: 'melee' | 'ranged'
  damage: DiceExpr
  damageType: DamageType
  /** finesse, thrown, heavy, light, loading, two-handed, versatile, reach, ammunition */
  properties: string[]
  /** The two-handed die for a versatile weapon. */
  versatileDamage?: DiceExpr
  normalRangeFeet?: number
  longRangeFeet?: number
}

export interface ArmorProfile {
  category: ArmorCategory
  baseAc: number
  /**
   * How much Dexterity the armour lets through. Light armour has no cap, medium
   * caps at 2 (3 with Medium Armor Master), heavy admits none. A stat rather
   * than a constant so a feat or item can change it.
   */
  dexCap: number | null
  /** Minimum Strength score, below which speed drops by 10. */
  strengthRequirement?: number
  stealthDisadvantage?: boolean
}

export interface ItemDefinition extends Identity {
  category: 'weapon' | 'armor' | 'shield' | 'gear' | 'tool' | 'consumable' | 'wondrous'
  weapon?: WeaponProfile
  armor?: ArmorProfile
  /** '2014' | '2024' — kept so rulesets can coexist without contaminating each other. */
  rulesetVersion?: string
  rarity?: 'common' | 'uncommon' | 'rare' | 'veryRare' | 'legendary' | 'artifact'
  weight?: number
  costCp?: number
  slot?: EquipmentSlotId
  /** Boots, gloves, bracers: both halves must be equipped. Horseshoes: all four. */
  pairedWith?: EquipmentSlotId
  requiresAttunement?: boolean
  attunementPrerequisite?: Predicate
  /** The item's contribution to the character, in the common vocabulary. */
  effects: EffectSource
  charges?: ResourceDefinition
}

export interface SpeciesDefinition extends Identity {
  size: 'tiny' | 'small' | 'medium' | 'large'
  baseWalkSpeed: number
  effects: EffectSource
  subspecies?: { id: string; name: string; effects: EffectSource }[]
}

export interface ClassFeatureDefinition extends Identity {
  grantedAtLevel: number
  effects: EffectSource
}

/**
 * A subclass: Path of the Berserker, College of Lore, School of Evocation.
 *
 * Deliberately the same shape as a class's own feature list rather than a new
 * kind of thing. A subclass is not a special case in the SRD — it is a second
 * source of features on the same level track, gated on having chosen it. So it
 * carries `features` exactly as ClassDefinition does, and the collector treats
 * both identically once the choice is made.
 *
 * `classId` is what makes a wrong choice detectable: nothing stops a character
 * row naming College of Lore on a barbarian, so the collector checks that the
 * subclass belongs to the class before granting anything.
 */
export interface SubclassDefinition extends Identity {
  /** The class this subclass belongs to. A mismatch grants nothing. */
  classId: ClassId
  features: ClassFeatureDefinition[]
}

export interface ClassDefinition extends Identity {
  hitDie: number
  savingThrowProficiencies: Ability[]
  features: ClassFeatureDefinition[]
  /** Present from day one even though v1 offers a menu of one. */
  subclassSlot?: { grantedAtLevel: number; options: string[] }
}

export interface FeatDefinition extends Identity {
  /** Continuously evaluated, not checked once — see SRD's Grappler example. */
  prerequisite: Predicate
  effects: EffectSource
}

/** One typed damage die-pool, before any scaling is applied. */
export interface SpellDamage {
  dice: DiceExpr
  type: DamageType
}

/**
 * The mechanical shape of a spell's effect, distinct from `effects` (which is
 * the ongoing EffectSource a buff like Mage Armor installs). This is the
 * one-shot thing that happens when the spell lands: damage, healing, a save.
 *
 * Optional on purpose. A spell with no `effect` — Detect Magic, Prestidigitation
 * — is pure narrative and resolves to nothing here, exactly as before. Adding
 * this makes a damage spell surface a preview and hand the DM structured damage
 * to apply, the same way a weapon attack already does. It does NOT auto-apply
 * anything to a target: this is theatre-of-the-mind, and the DM adjudicates
 * what the fireball actually hits.
 */
export interface SpellEffect {
  /** How it lands: the caster's spell attack, the target's save, or automatic. */
  delivery: 'attack' | 'save' | 'auto'
  /** For delivery 'save': which ability the target rolls, and what success does. */
  save?: { ability: Ability; onSuccess: 'half' | 'none' }
  /** Damage on a hit / a failed save / automatically. Several entries mix types. */
  damage?: SpellDamage[]
  /** Separate instances of the damage — Magic Missile's three darts. Default 1. */
  instances?: number
  /** Healing: dice, plus the spellcasting ability modifier when `addSpellMod`. */
  healing?: { dice: DiceExpr; addSpellMod?: boolean }
  /**
   * A cantrip's damage grows with CHARACTER level at 5/11/17 — a different axis
   * from slot upcasting. When true, one extra damage die is added at each step.
   */
  cantripScaling?: boolean
  /** Upcasting: what each slot level above the spell's own level adds. */
  perSlotAbove?: { damageDice?: DiceExpr; instances?: number; healingDice?: DiceExpr }
}

export interface SpellDefinition extends Identity {
  level: number
  /** Class lists this spell appears on, for grants that take a whole list. */
  lists?: string[]
  school: string
  ritual: boolean
  castingTime: ActionCost
  rangeFeet?: number
  rangeKind: 'self' | 'touch' | 'ranged' | 'sight' | 'unlimited' | 'special'
  components: { verbal: boolean; somatic: boolean; material?: string; materialCostCp?: number; consumed?: boolean }
  durationSeconds?: number
  concentration: boolean
  effects: EffectSource
  /** The one-shot damage/heal/save, when the spell has one. See SpellEffect. */
  effect?: SpellEffect
  /** Upcasting is a lookup, not a formula — see srd/91-effect-vocabulary.md §8. */
  upcast?: { slotLevel: number; effects: EffectSource }[]
}

export interface ConditionDefinition extends Identity {
  effects: EffectSource
  /** Conditions this one also imposes: paralyzed implies incapacitated. */
  implies?: ConditionId[]
}

// ---------------------------------------------------------------------------
// Character state (layer 4) — only what cannot be derived
// ---------------------------------------------------------------------------

export interface ItemInstance {
  instanceId: string
  definitionId: string
  /** Pinned so a later content edit is detectable rather than silent. */
  contentVersion: number
  quantity?: number
  chargesSpent?: number
  identified: boolean
  /**
   * A potion of poison presents as a potion of healing and *identify* confirms
   * the lie. The server projects the apparent identity to players.
   */
  apparentDefinitionId?: string
  customName?: string
  hitPointsLost?: number
  containerId?: string
}

export interface Inventory {
  instances: ItemInstance[]
  /** slot → instanceId. */
  equipped: Partial<Record<EquipmentSlotId, string>>
  attunedInstanceIds: string[]
}

export interface ConditionInstance {
  conditionId: ConditionId
  instanceId: string
  sourceId: string
  appliedAtSeconds: number
  durationSeconds?: number
  /** Suppressed effects keep running down their duration (antimagic field). */
  suppressed?: boolean
}

export interface EffectInstance {
  instanceId: string
  /** The definition that produced this — a spell in flight, an environment effect. */
  definitionId: string
  contentVersion: number
  sourceCharacterId?: string
  appliedAtSeconds: number
  durationSeconds?: number
  concentration?: boolean
  suppressed?: boolean
}

export interface BuildChoice {
  atLevel: number
  kind: 'abilityScoreImprovement' | 'feat' | 'skillProficiency' | 'spell' | 'subclass' | 'other'
  value: string | Partial<Record<Ability, number>>
}

export interface Character {
  id: string
  campaignId: string
  name: string
  playerId?: string

  speciesId: SpeciesId
  subspeciesId?: string
  /** A list from day one. v1 only ever puts one entry in it. */
  classLevels: { classId: ClassId; level: number; subclassId?: string }[]
  backgroundId?: string

  /** The chosen build values. Everything else about abilities is derived. */
  abilityScoreBase: Record<Ability, number>
  buildChoices: BuildChoice[]

  hitPointsCurrent: number
  hitPointsTemp: number
  hitDiceSpent: Record<number, number>
  resourcesSpent: Record<ResourceId, number>

  conditions: ConditionInstance[]
  effectInstances: EffectInstance[]
  exhaustionLevel: number

  inventory: Inventory
  deathSaves: { successes: number; failures: number }
  toggles: Record<ToggleId, boolean>
  dmFlags?: Record<string, boolean>
  /**
   * Answers to the selections a source offered, keyed by sourceId then
   * selectionId. Resilient's chosen ability, Skilled's three skills, Elemental
   * Adept's damage type all live here — so a selectable feat needs no code.
   */
  selections?: Record<string, Record<string, string[]>>

  /**
   * Spells prepared today. Genuine state: it is a choice, it survives until
   * the next long rest, and nothing derives it. Spells that are always
   * available are not listed here — being always available is a property of
   * the grant, not a preparation.
   */
  spellsPrepared?: string[]
  /**
   * The effect instance the character is concentrating on. One at a time, so
   * casting another concentration spell ends this one.
   */
  concentratingOn?: string

  /**
   * Effect sources the DM composed at the table, belonging to this character
   * rather than to the content set.
   *
   * This is what makes "god mode" generic instead of a wall of buttons: the DM
   * builds a modifier out of the same vocabulary a feat or an item uses, and it
   * resolves through the identical pipeline with a `dm` provenance so every
   * breakdown shows where it came from. A cursed idol nobody has written
   * content for is an EffectSource, not a special case.
   */
  adHocSources?: EffectSource[]
}

// ---------------------------------------------------------------------------
// Resolution outputs — the explainability contract
// ---------------------------------------------------------------------------

export type TermStage =
  | 'base' | 'add' | 'multiply' | 'set' | 'clamp' | 'replace'
  | 'suppressed' | 'proficiency' | 'compute'

export interface Term {
  sourceId: string
  sourceName: string
  provenance: Provenance
  op: ValueOp | RollOp | CapabilityOp | 'compute' | 'proficiency'
  value?: number
  applied: boolean
  /** Required whenever applied is false. Enforced by invariant. */
  reason?: string
  stage: TermStage
  note?: string
}

export interface StatValue {
  path: StatPath
  total: number
  terms: Term[]
  /** Assumptions the engine made where the SRD is silent. */
  notes: string[]
  /** True if any contributing source has completeness 'partial'. */
  incomplete: boolean
}

export interface ProficiencyValue {
  proficient: boolean
  multiplier: number
  rounding: RoundingMode
  term: number
  terms: Term[]
}

export type AdvantageState = 'advantage' | 'disadvantage' | 'normal'

export interface CapabilityValue {
  capability: CapabilityKey
  allowed: boolean
  terms: Term[]
}

// ---------------------------------------------------------------------------
// Rolls — three stages, deliberately separated so L1 never sees randomness
// ---------------------------------------------------------------------------

export interface RollRequest {
  kind: RollKind
  ability?: Ability
  skill?: SkillId
  tool?: ToolId
  /** Semantic tags describing what is being resisted / attacked / attempted. */
  againstTags?: string[]
  targetTags?: string[]
  activityTags?: string[]
  requiresSenses?: Sense[]
  /** DC, AC, or the opposing side of a contest. */
  target?: { kind: 'dc' | 'ac'; value: number } | { kind: 'contest' }
  /**
   * Proficiency categories this roll may draw on that the scope cannot imply.
   *
   * Skills, tools and saves imply their own scope, but weapon proficiency
   * depends on *which weapon* is swung — a fact the roll scope does not carry.
   * The attack resolver supplies the weapon's category and the weapon itself,
   * so the ordinary proficiency machinery applies with no attack-specific
   * branch inside it.
   */
  proficiencyCategories?: ProficiencyCategory[]
  /** DM fiat is a first-class input to every roll, not an escape hatch. */
  dmAdvantage?: AdvantageState
  /**
   * Ids of ActionOptions the actor elected before rolling — Great Weapon
   * Master's -5/+10, a Battle Master manoeuvre. Their modifiers join the
   * pipeline like any other, so an option needs no code of its own.
   */
  electedOptions?: string[]
  /**
   * Modifiers contributed by the *other* side of the roll: a defender's
   * conditions, cover, the attacker's own position. Supplied by resolveAttack;
   * a plain check leaves it empty.
   */
  externalModifiers?: ExternalModifier[]
  /**
   * This attack is a spell attack, so its bonus comes from `spell.attack`.
   *
   * It stays `kind: 'attack'` — a spell attack crits on a natural 20 like any
   * other — but it draws its modifier from the spellcasting stat rather than
   * from an ability plus weapon proficiency, which is why it needs saying.
   */
  spellAttack?: boolean
}

/** A modifier contributed by something other than the rolling character. */
export interface ExternalModifier {
  sourceId: string
  sourceName: string
  provenance: Provenance
  modifier: Modifier
}

export interface RollResolution {
  request: RollRequest
  /** How many d20s to throw and which to keep. */
  dice: { count: number; sides: number; keep: 'highest' | 'lowest' | 'all' }
  modifierTotal: number
  modifierTerms: Term[]
  /** Dice added by other effects — bless's 1d4 — resolved when the roll lands. */
  pendingDice: { sourceId: string; expr: DiceExpr; sign: 1 | -1 }[]
  advantage: AdvantageState
  advantageSources: Term[]
  disadvantageSources: Term[]
  autoFail: Term[]
  autoSucceed: Term[]
  /** Effects that turn any hit into a critical (paralyzed, unconscious, within 5 ft). */
  autoCritical: Term[]
  rerollOn: number[]
  critRange: number
  incomplete: boolean
  notes: string[]
}

export interface RollOutcome {
  /** The faces the authority rolled. Length matches RollResolution.dice.count. */
  faces: number[]
  /** Index of the die kept after advantage/disadvantage. */
  keptIndex: number
  /** Set when a reroll effect was used, so the breakdown can show both. */
  rerolledIndex?: number
  pendingDiceResults?: { sourceId: string; total: number }[]
}

export interface RollResult {
  resolution: RollResolution
  outcome: RollOutcome
  natural: number
  total: number
  success?: boolean
  critical?: boolean
  criticalMiss?: boolean
  terms: Term[]
}

// ---------------------------------------------------------------------------
// Damage — a list of typed components, never a scalar
// ---------------------------------------------------------------------------

export interface DamageComponent {
  sourceId: string
  type: DamageType
  dice?: DiceExpr
  flat?: number
  /** Extra dice from features (Sneak Attack) double on a crit; modifiers do not. */
  doublesOnCrit?: boolean
}

export interface DamagePacket {
  components: DamageComponent[]
  tags?: string[]
}

export type ResistanceState = 'none' | 'resistant' | 'immune' | 'vulnerable'

// ---------------------------------------------------------------------------
// Game events — semantic, never presentational
// ---------------------------------------------------------------------------

export interface GameEvent {
  id: string
  seq: number
  timestampSeconds: number
  campaignId: string
  actorId?: string
  type: string
  payload: Record<string, unknown>
  causedBy?: string
}

// ---------------------------------------------------------------------------
// The world a resolution runs against
// ---------------------------------------------------------------------------

/**
 * Content lookup. Layers 2 and 3 are the same type, so there is exactly one
 * accessor and no branch on provenance anywhere in the resolvers.
 */
export interface ContentIndex {
  species: Map<string, SpeciesDefinition>
  classes: Map<string, ClassDefinition>
  subclasses: Map<string, SubclassDefinition>
  feats: Map<string, FeatDefinition>
  items: Map<string, ItemDefinition>
  spells: Map<string, SpellDefinition>
  conditions: Map<string, ConditionDefinition>
  skills: Map<SkillId, SkillDefinition>
  /** Sources not attached to any character: environment, campaign-wide effects. */
  ambient?: EffectSource[]
}

export interface CollectedSources {
  active: EffectSource[]
  inactive: { source: EffectSource; reason: string }[]
}
