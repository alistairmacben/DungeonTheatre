// The Player Contract — the read model the UI consumes.
//
// Everything here is a plain value. No functions, no Maps, no class instances:
// this crosses a network, survives structuredClone and a page reload, and is
// broadcast at speech rate. If a field cannot be JSON, it does not belong here.
//
// The UI renders this and nothing else. It never resolves a rule, never
// computes a total, never decides whether an action is legal, and never
// contains a branch on class, item or spell.

import type {
  Ability, ActionKind, ClassId, ConditionId, DamageType, DiceExpr, EffectSource,
  Provenance, ResourceDisplay, SkillId, SpeciesId
} from '../rules/types.js'

/**
 * How much explanation the snapshot carries.
 *
 * A full breakdown for every value is large — one AC alone can carry seven
 * terms — so disclosure is a payload decision before it is an interface one.
 */
export type DetailLevel = 'summary' | 'inspect' | 'full'

export interface BreakdownLine {
  source: string
  sourceId: string
  provenance: Provenance
  amount?: number
  /**
   * How `amount` combines.
   *
   * Load-bearing: a proficiency line's amount is a *multiplier* (2 for
   * expertise), not an addend. Without this the reader adds it, and the
   * breakdown stops reconciling with the number it explains — which defeats
   * the entire point of publishing one.
   */
  kind: 'add' | 'multiplier' | 'base' | 'set' | 'other'
  note?: string
  applied: boolean
  /** Always present when applied is false. */
  reason?: string
}

export interface Breakdown {
  total: number
  lines: BreakdownLine[]
  /** Engine assumptions where the rules are silent. */
  assumptions: string[]
  /** True when some contributing content is known to be incomplete. */
  incomplete: boolean
}

/**
 * A number the UI can render without knowing what it means.
 *
 * `display` exists so the interface never formats a game concept: whether a
 * value is signed, suffixed with "ft" or shown bare is a rules-flavoured
 * decision, and the engine already knows which.
 */
export interface Readout {
  value: number
  label: string
  display: string
  breakdown?: Breakdown
}

// ---------------------------------------------------------------------------

export interface VitalsView {
  hitPoints: { current: number; max: Readout; temporary: number }
  armorClass: Readout
  speed: Readout
  /** Initiative is a roll: Feral Instinct and Alert grant advantage on it. */
  initiative: Readout & { rollState?: 'advantage' | 'disadvantage' | 'normal'
    rollStateReasons?: string[] }
  /** 0-3 each. Only meaningful at 0 hit points; the UI decides whether to show it. */
  deathSaves: { successes: number; failures: number }
  exhaustion: number
}

/**
 * What this character shrugs off, only for the damage types where it matters.
 *
 * The engine has resolved a state for all thirteen damage types since the
 * resistance stat paths were declared; nothing before this surfaced it. A
 * monk's poison immunity, a barbarian's resistance to everything while
 * raging, a cloak's fire resistance — all real, all resolved, none visible.
 * Only non-'none' entries are listed, the same "only what's active" shape
 * `effects` already uses, so a character with nothing unusual shows nothing.
 */
export interface DefenseView {
  type: DamageType
  /**
   * 'reduced' is a flat subtraction with no halving threshold of its own —
   * Heavy Armor Master's "-3 bludgeoning/piercing/slashing" is exactly this,
   * and is not resistance: it does not become "no damage on a resisted
   * critical" the way real resistance does, so it needs its own word rather
   * than borrowing 'resistant' for a mechanic that isn't.
   */
  state: 'resistant' | 'immune' | 'vulnerable' | 'reduced'
  /** A flat reduction, present alongside 'resistant'/'immune' or standing alone as 'reduced'. */
  reduction?: number
}

export interface AbilityView {
  ability: Ability
  label: string
  score: Readout
  modifier: Readout
  save: Readout & { proficient: boolean }
  /** Rolling the raw ability check. */
  roll: RollSpec
  /** Rolling the saving throw. */
  saveRoll: RollSpec
  /** Advantage on the raw ability check, if anything grants it. */
  rollState?: 'advantage' | 'disadvantage' | 'normal'
  /** Advantage on the saving throw, which is a different roll. */
  saveRollState?: 'advantage' | 'disadvantage' | 'normal'
  rollStateReasons?: string[]
}

export type ProficiencyState = 'none' | 'half' | 'proficient' | 'expertise'

/**
 * Everything the caller needs to make a roll happen.
 *
 * The engine decides how many dice and which to keep; the caller supplies the
 * faces. That split is what keeps the reducer pure and lets the server become
 * the roller later without the UI changing — see rules/roll.ts.
 */
export interface RollSpec {
  /** How many d20s to throw. Two under advantage or disadvantage. */
  diceCount: number
  keep: 'highest' | 'lowest' | 'all'
  /** Dispatch this with `faces` filled in. */
  command: PlayerCommand
  /** "Acrobatics +7" — what the player is about to roll. */
  label: string
  modifier: number
  /** Signed, for display: "+7". */
  modifierDisplay: string
}

export interface SkillView {
  id: SkillId
  label: string
  ability: Ability
  proficiency: ProficiencyState
  total: Readout
  passive: Readout
  /** 'advantage' | 'disadvantage' | 'normal' as things currently stand. */
  rollState: 'advantage' | 'disadvantage' | 'normal'
  /** Why the roll state is what it is; shown on inspect. */
  rollStateReasons: string[]
  roll: RollSpec
}

export interface ResourceView {
  id: string
  label: string
  current: number
  maximum: number
  spent: number
  display: ResourceDisplay
  refresh: { kind: string; label: string }
  sourceId: string
  sourceLabel: string
  group?: string
  order?: number
  breakdown?: Breakdown
}

// ---------------------------------------------------------------------------

export interface EquipmentSlotView {
  slot: string
  label: string
  instanceId?: string
  itemId?: string
  itemLabel?: string
  provenance?: Provenance
  /** What this item is currently contributing, in plain language. */
  effectSummary: string[]
  attuned?: boolean
}

export type ItemGroup = 'equipped' | 'carried' | 'consumables' | 'valuables' | 'quest'

export interface ItemView {
  instanceId: string
  itemId: string
  label: string
  group: ItemGroup
  provenance: Provenance
  quantity: number
  slot?: string
  equipped: boolean
  requiresAttunement: boolean
  attuned: boolean
  identified: boolean
  /**
   * Set when the viewer is being shown something other than the truth: an
   * unidentified item presenting as what it appears to be. The DM's view sets
   * this too, alongside the real identity, so the table and the DM can be
   * looking at the same object and see different things without either of them
   * being confused about which.
   */
  disguised?: boolean
  /** DM only: what the item actually is, when it is presenting as something else. */
  trueLabel?: string
  /** What equipping or using it would do. Derived from its modifiers, never authored prose. */
  effectSummary: string[]
  canEquip: boolean
  equipReasons: string[]
  /** Weapon-only, for the HUD's equipped-weapon readout. */
  weaponSummary?: { damageLabel: string; damageType: DamageType; properties: string[] }
}

// ---------------------------------------------------------------------------

export interface ActionCostView {
  type: 'action' | 'bonusAction' | 'reaction' | 'free' | 'movement' | 'time'
  label: string
}

export interface ActionOptionView {
  id: string
  label: string
  description?: string
}

export interface ActionPreview {
  attackBonus?: number
  attackBonusDisplay?: string
  damageLabel?: string
  damageType?: DamageType
  saveDc?: number
  /** The ability a save-based spell forces, so the preview can say "DC 14 DEX". */
  saveAbility?: Ability
  rangeLabel?: string
  rollState?: 'advantage' | 'disadvantage' | 'normal'
}

/**
 * What rolling this action's damage needs — the follow-up after a hit lands.
 *
 * Unlike `RollSpec`, this cannot pre-compute how many dice to roll: that
 * depends on whether the attack was a critical, which is not known until the
 * to-hit roll returns. `pools` is the undoubled dice, ready for
 * `diceNeededFor(pools, wasCritical)` once the caller knows.
 */
export interface DamageRollSpec {
  pools: { type: DamageType | 'healing'; dice: DiceExpr; flat: number }[]
  characterId: string
  source: Extract<PlayerCommand, { type: 'rollDamage' }>['source']
}

export interface ActionView {
  id: string
  label: string
  description?: string
  kind: ActionKind
  cost: ActionCostView
  costs: { resourceId: string; amount: number; label: string }[]
  targeting?: { selector: string; count?: number; rangeLabel?: string }
  available: boolean
  /** Required and non-empty whenever `available` is false. */
  unavailableReasons: string[]
  preview?: ActionPreview
  options?: ActionOptionView[]
  /** Exactly what to send the server. The UI echoes this; it never builds one. */
  command: PlayerCommand
  /** Present when taking this action means throwing dice — attacks, for now. */
  roll?: RollSpec
  /** Present on attacks: what to roll for damage once a hit is confirmed. */
  damageRoll?: DamageRollSpec
  sourceId: string
  sourceLabel: string
  breakdown?: Breakdown
}

// ---------------------------------------------------------------------------

export interface EffectView {
  id: string
  label: string
  kind: 'condition' | 'temporary' | 'passive'
  sourceLabel: string
  description?: string
  /** Plain-language list of what it is doing right now. */
  effects: string[]
  /** Present when the effect has a stated duration. */
  durationLabel?: string
  /** Conditions can be imposed several times; each instance expires separately. */
  instanceCount?: number
  removable: boolean
}

/**
 * One spell, already explained.
 *
 * Every string here is derived. The UI renders a spell card without knowing
 * what a spell is, which is the same bargain every other view makes.
 */
export interface SpellView {
  id: string
  label: string
  level: number
  /** "Cantrip", "1st", "2nd" — the form a player reads, not the integer. */
  levelLabel: string
  school: string
  castingTimeLabel: string
  rangeLabel: string
  durationLabel?: string
  concentration: boolean
  ritual: boolean
  /** "V, S, M (a pinch of soot and salt)" */
  componentsLabel: string
  description?: string
  /** Plain-language consequences, from the spell's effect source. */
  effects: string[]
  /**
   * The one-shot damage/heal/save, when the spell has one — the same "2d10
   * fire" a weapon shows. Present only for spells with a resolved effect;
   * a buff or a utility spell leaves it undefined.
   */
  effectPreview?: {
    /** "2d10 fire", "3 × 1d4+1 force", "heal 1d8+3". */
    label: string
    delivery: 'attack' | 'save' | 'auto'
    /** "+6" for an attack spell. */
    attackBonusDisplay?: string
    /** "DC 14 DEX" for a save spell. */
    saveLabel?: string
  }
  prepared: boolean
  /** True for cantrips, domain and innate spells: preparation does not apply. */
  alwaysAvailable: boolean
  available: boolean
  unavailableReasons: string[]
  /** Slots that could pay, cheapest first. More than one means upcasting. */
  slotOptions: { resourceId: string; label: string; level: number; remaining: number }[]
  /** Casts at the cheapest viable slot; name a slot to upcast. */
  command: PlayerCommand
  /** Present when casting this spell means throwing dice — a spell attack. */
  roll?: RollSpec
  /** Present when the spell has damage or healing to roll, on a hit or at once. */
  damageRoll?: DamageRollSpec
  sourceLabel: string
}

export interface SpellcastingView {
  saveDc: Readout
  attackBonus: Readout
  preparedCount: number
  preparedMax: number
  slots: { resourceId: string; label: string; level: number; remaining: number }[]
  spells: SpellView[]
  concentratingOn?: { instanceId: string; label: string }
}

export interface NoticeView {
  id: string
  label: string
  text: string
  /** Set when the notice corresponds to a toggle the player can flip. */
  toggleId?: string
  toggleValue?: boolean
  dmPromptable: boolean
}

export interface ProgressionView {
  level: number
  proficiencyBonus: Readout
  classes: { classId: ClassId; label: string; level: number; subclassId?: string }[]
  species: { id: SpeciesId; label: string; subspeciesLabel?: string }
  hitDice: { size: number; total: number; spent: number }[]
  /** Choices the character is entitled to but has not made. */
  pendingChoices: {
    id: string; prompt: string; kind: string; count: number; from?: string[]
    /** Present for a level-up choice (ASI/feat, subclass) — absent for a feature selection. */
    atLevel?: number
    /** Human-readable options, for a choice `from` alone can't render a button for. */
    options?: { id: string; label: string }[]
  }[]
}

/**
 * Who is looking.
 *
 * The projection question the architecture always intended and never answered:
 * a view is built *for somebody*. A DM sees an unidentified item's true nature;
 * the player holding it sees what it appears to be. Filtering this in the UI
 * would be a lie a determined client could read straight through, so it happens
 * where the view is built — and, for anything genuinely secret like an NPC's
 * hit points, in RLS before the row is ever sent.
 */
export type Viewer =
  /** The player this character belongs to. */
  | { kind: 'owner' }
  /** The DM, who sees through every disguise. */
  | { kind: 'dm' }
  /** Another player at the table. */
  | { kind: 'table' }

export interface PlayerViewMeta {
  characterId: string
  campaignId: string
  name: string
  playerId?: string
  detail: DetailLevel
  /** Bumps whenever the underlying character state changes. */
  revision: number
  /** Non-fatal engine problems, surfaced rather than swallowed. */
  diagnostics: string[]
}

export interface PlayerView {
  meta: PlayerViewMeta
  vitals: VitalsView
  /** Only the damage types this character resists, is immune to, or reduces. */
  defenses: DefenseView[]
  abilities: AbilityView[]
  skills: SkillView[]
  resources: ResourceView[]
  equipment: EquipmentSlotView[]
  inventory: ItemView[]
  actions: ActionView[]
  /** Absent when the character has no spell access — not an empty object. */
  spellcasting?: SpellcastingView
  effects: EffectView[]
  notices: NoticeView[]
  progression: ProgressionView
}

// ---------------------------------------------------------------------------
// Commands — the only way the client can change anything
// ---------------------------------------------------------------------------

export type PlayerCommand =
  | { type: 'equipItem'; characterId: string; instanceId: string; slot: string }
  | { type: 'unequipItem'; characterId: string; slot: string }
  | { type: 'attuneItem'; characterId: string; instanceId: string }
  | { type: 'endAttunement'; characterId: string; instanceId: string }
  | { type: 'useItem'; characterId: string; instanceId: string }
  | { type: 'makeAttack'; characterId: string; weaponInstanceId: string; targetAc?: number; electedOptions?: string[]; twoHanded?: boolean; faces: number[] }
  /**
   * The follow-up to a hit: rolls the damage dice, doubled on a critical.
   * `faces` is one array per damage pool, matching `RollDamageSpec.pools` in
   * order — almost always one pool, but a spell or feature with two damage
   * types (rare) needs two. Applying it to anyone is still the DM's call.
   */
  | {
      type: 'rollDamage'; characterId: string
      source:
        | { kind: 'weapon'; weaponInstanceId: string; twoHanded?: boolean }
        | { kind: 'spell'; spellId: string; slotResourceId?: string }
      critical: boolean
      faces: number[][]
    }
  | { type: 'makeCheck'; characterId: string; checkType: 'ability' | 'skill'; ability?: Ability; skill?: SkillId; faces: number[] }
  | { type: 'makeSave'; characterId: string; ability: Ability; dc?: number; faces: number[] }
  | { type: 'useAbility'; characterId: string; actionId: string; sourceId: string }
  /**
   * `faces` carries the to-hit d20 for a spell that needs one (Fire Bolt), and
   * is ignored for every other spell. Casting and rolling to hit are one act
   * at the table, and splitting them into two commands would let a player
   * spend the slot and then decline to roll.
   */
  | {
      type: 'castSpell'; characterId: string; spellId: string
      slotResourceId?: string; faces?: number[]
    }
  | { type: 'prepareSpells'; characterId: string; spellIds: string[] }
  | { type: 'endConcentration'; characterId: string }
  /** Raises one class's level by one. HP grows by the average-formula delta. */
  | { type: 'levelUp'; characterId: string; classId: string }
  /**
   * Answers a level-up choice: an Ability Score Improvement (a flat bonus
   * split across at most two abilities), a feat (gated on its own
   * prerequisite), or a subclass (one of the class's own `subclassSlot.options`).
   */
  | {
      type: 'answerBuildChoice'; characterId: string; atLevel: number
      kind: 'abilityScoreImprovement'; value: Partial<Record<Ability, number>>
    }
  | { type: 'answerBuildChoice'; characterId: string; atLevel: number; kind: 'feat'; value: string }
  | { type: 'answerBuildChoice'; characterId: string; atLevel: number; kind: 'subclass'; value: string }
  /**
   * Answers a feature's own "choose N" selection (cantrips known, skills,
   * a spell list) — the primitive `defaultSelections()` in creation has
   * always used internally, now reachable as a real command.
   */
  | {
      type: 'answerSelection'; characterId: string; sourceId: string; selectionId: string
      values: string[]
    }
  | { type: 'spendResource'; characterId: string; resourceId: string; amount: number }
  | { type: 'restoreResource'; characterId: string; resourceId: string; amount: number }
  | { type: 'applyCondition'; characterId: string; conditionId: ConditionId; sourceId: string; durationSeconds?: number }
  | { type: 'removeCondition'; characterId: string; instanceId: string }
  | { type: 'setToggle'; characterId: string; toggleId: string; value: boolean }
  | { type: 'shortRest'; characterId: string }
  | { type: 'longRest'; characterId: string }
  | { type: 'transferItem'; fromCharacterId: string; toCharacterId: string; instanceId: string }
  | { type: 'dmOverride'; characterId: string; note: string }
  // --- the DM's hand ---
  // Six verbs, composed from the existing vocabulary rather than one button per
  // D&D effect. "12 fire damage" and "frightened" need no enemy to exist.
  | { type: 'dmDamage'; characterId: string; amount: number; damageType: DamageType; tags?: string[] }
  | { type: 'dmHeal'; characterId: string; amount: number }
  | { type: 'dmTemporaryHitPoints'; characterId: string; amount: number; choice?: 'keep' | 'replace' }
  | { type: 'dmSetResource'; characterId: string; resourceId: string; remaining: number }
  | { type: 'dmApplyEffect'; characterId: string; effect: EffectSource }
  | { type: 'dmRemoveEffect'; characterId: string; sourceId: string }

export type CommandType = PlayerCommand['type']
