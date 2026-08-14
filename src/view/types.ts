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
  Ability, ActionKind, ClassId, ConditionId, DamageType, Provenance,
  ResourceDisplay, SkillId, SpeciesId
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
  initiative: Readout
  /** 0-3 each. Only meaningful at 0 hit points; the UI decides whether to show it. */
  deathSaves: { successes: number; failures: number }
  exhaustion: number
}

export interface AbilityView {
  ability: Ability
  label: string
  score: Readout
  modifier: Readout
  save: Readout & { proficient: boolean }
}

export type ProficiencyState = 'none' | 'half' | 'proficient' | 'expertise'

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
  rangeLabel?: string
  rollState?: 'advantage' | 'disadvantage' | 'normal'
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
  pendingChoices: { id: string; prompt: string; kind: string; count: number; from?: string[] }[]
}

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
  abilities: AbilityView[]
  skills: SkillView[]
  resources: ResourceView[]
  equipment: EquipmentSlotView[]
  inventory: ItemView[]
  actions: ActionView[]
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
  | { type: 'makeAttack'; characterId: string; weaponInstanceId: string; targetId?: string; electedOptions?: string[]; twoHanded?: boolean }
  | { type: 'makeCheck'; characterId: string; checkType: 'ability' | 'skill'; ability?: Ability; skill?: SkillId }
  | { type: 'makeSave'; characterId: string; ability: Ability; dc?: number }
  | { type: 'useAbility'; characterId: string; actionId: string; sourceId: string }
  | { type: 'castSpell'; characterId: string; spellId: string; slotLevel?: number }
  | { type: 'spendResource'; characterId: string; resourceId: string; amount: number }
  | { type: 'restoreResource'; characterId: string; resourceId: string; amount: number }
  | { type: 'applyCondition'; characterId: string; conditionId: ConditionId; sourceId: string; durationSeconds?: number }
  | { type: 'removeCondition'; characterId: string; instanceId: string }
  | { type: 'setToggle'; characterId: string; toggleId: string; value: boolean }
  | { type: 'shortRest'; characterId: string }
  | { type: 'longRest'; characterId: string }
  | { type: 'transferItem'; fromCharacterId: string; toCharacterId: string; instanceId: string }
  | { type: 'dmOverride'; characterId: string; note: string }

export type CommandType = PlayerCommand['type']
