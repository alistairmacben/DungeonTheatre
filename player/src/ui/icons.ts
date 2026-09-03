// Icon lookups for the small, closed vocabularies (classes, subclasses,
// species, skills, abilities, damage types, weapon types) where a bg3.wiki
// icon exists for essentially every value our content model can produce.
//
// Sourced from Baldur's Gate 3 (Larian Studios) via bg3.wiki — fine for this
// project's own use, but not an openly-licensed asset set, so treat these as
// local-only and don't redistribute them as a standalone package.
//
// Every lookup returns `undefined` on a miss so callers always have a safe
// text-only fallback — nothing here should ever render a broken image.
// Content ids (e.g. `srd:class.barbarian`) are used purely as lookup keys;
// nothing in `src/rules` or `src/content` reads or depends on this file.

import type { Ability, ActionView, DamageType } from '@engine'
import { GENERIC_ICONS, SPELL_ICONS } from './spellIcons.generated'
import { CATEGORY_ICONS } from './itemIcons.generated'
import { ACTION_ICONS } from './actionIcons.generated'

const CLASS_ICONS: Record<string, string> = {
  barbarian: '/icons/classes/barbarian.png',
  bard: '/icons/classes/bard.png',
  cleric: '/icons/classes/cleric.png',
  druid: '/icons/classes/druid.png',
  fighter: '/icons/classes/fighter.png',
  monk: '/icons/classes/monk.png',
  paladin: '/icons/classes/paladin.png',
  ranger: '/icons/classes/ranger.png',
  rogue: '/icons/classes/rogue.png',
  sorcerer: '/icons/classes/sorcerer.png',
  warlock: '/icons/classes/warlock.png',
  wizard: '/icons/classes/wizard.png'
}

// Two of our twelve subclasses (Berserker, College of Lore) have no bg3.wiki
// counterpart — BG3 either renamed or never shipped that exact archetype.
// Those ids are simply absent here; callers fall back to text.
const SUBCLASS_ICONS: Record<string, string> = {
  'circle-of-the-land': '/icons/subclasses/circle-of-the-land.png',
  champion: '/icons/subclasses/champion.png',
  'open-hand': '/icons/subclasses/open-hand.png',
  thief: '/icons/subclasses/thief.png',
  'life-domain': '/icons/subclasses/life-domain.png',
  devotion: '/icons/subclasses/devotion.png',
  hunter: '/icons/subclasses/hunter.png',
  'draconic-bloodline': '/icons/subclasses/draconic-bloodline.png',
  fiend: '/icons/subclasses/fiend.png',
  evocation: '/icons/subclasses/evocation.png'
}

const SPECIES_ICONS: Record<string, string> = {
  dwarf: '/icons/species/dwarf.png',
  elf: '/icons/species/elf.png',
  'half-elf': '/icons/species/half-elf.png',
  'half-orc': '/icons/species/half-orc.png',
  halfling: '/icons/species/halfling.png',
  human: '/icons/species/human.png',
  tiefling: '/icons/species/tiefling.png'
}

const SKILL_ICONS: Record<string, string> = {
  acrobatics: '/icons/skills/acrobatics.png',
  'animal-handling': '/icons/skills/animal-handling.png',
  arcana: '/icons/skills/arcana.png',
  athletics: '/icons/skills/athletics.png',
  deception: '/icons/skills/deception.png',
  history: '/icons/skills/history.png',
  insight: '/icons/skills/insight.png',
  intimidation: '/icons/skills/intimidation.png',
  investigation: '/icons/skills/investigation.png',
  medicine: '/icons/skills/medicine.png',
  nature: '/icons/skills/nature.png',
  perception: '/icons/skills/perception.png',
  performance: '/icons/skills/performance.png',
  persuasion: '/icons/skills/persuasion.png',
  religion: '/icons/skills/religion.png',
  'sleight-of-hand': '/icons/skills/sleight-of-hand.png',
  stealth: '/icons/skills/stealth.png',
  survival: '/icons/skills/survival.png'
}

const ABILITY_ICONS: Record<Ability, string> = {
  str: '/icons/abilities/str.png',
  dex: '/icons/abilities/dex.png',
  con: '/icons/abilities/constitution.png',
  int: '/icons/abilities/int.png',
  wis: '/icons/abilities/wis.png',
  cha: '/icons/abilities/cha.png'
}

const DAMAGE_TYPE_ICONS: Record<DamageType, string> = {
  acid: '/icons/damage-types/acid.png',
  bludgeoning: '/icons/damage-types/bludgeoning.png',
  cold: '/icons/damage-types/cold.png',
  fire: '/icons/damage-types/fire.png',
  force: '/icons/damage-types/force.png',
  lightning: '/icons/damage-types/lightning.png',
  necrotic: '/icons/damage-types/necrotic.png',
  piercing: '/icons/damage-types/piercing.png',
  poison: '/icons/damage-types/poison.png',
  psychic: '/icons/damage-types/psychic.png',
  radiant: '/icons/damage-types/radiant.png',
  slashing: '/icons/damage-types/slashing.png',
  thunder: '/icons/damage-types/thunder.png'
}

// Keyed by the weapon's singular SRD name (lowercase) — matched against an
// item's display name by substring, since items carry no structured "base
// weapon" field, only a free-text name like "Longsword" or "Longsword +1".
const WEAPON_TYPE_ICONS: Record<string, string> = {
  battleaxe: '/icons/weapon-types/battleaxes.png',
  club: '/icons/weapon-types/clubs.png',
  dagger: '/icons/weapon-types/daggers.png',
  dart: '/icons/weapon-types/darts.png',
  flail: '/icons/weapon-types/flails.png',
  glaive: '/icons/weapon-types/glaives.png',
  greataxe: '/icons/weapon-types/greataxes.png',
  greatclub: '/icons/weapon-types/greatclubs.png',
  greatsword: '/icons/weapon-types/greatswords.png',
  halberd: '/icons/weapon-types/halberds.png',
  'hand crossbow': '/icons/weapon-types/hand-crossbows.png',
  handaxe: '/icons/weapon-types/handaxes.png',
  'heavy crossbow': '/icons/weapon-types/heavy-crossbows.png',
  javelin: '/icons/weapon-types/javelins.png',
  'light crossbow': '/icons/weapon-types/light-crossbows.png',
  'light hammer': '/icons/weapon-types/light-hammers.png',
  longbow: '/icons/weapon-types/longbows.png',
  longsword: '/icons/weapon-types/longswords.png',
  mace: '/icons/weapon-types/maces.png',
  maul: '/icons/weapon-types/mauls.png',
  morningstar: '/icons/weapon-types/morningstars.png',
  pike: '/icons/weapon-types/pikes.png',
  quarterstaff: '/icons/weapon-types/quarterstaves.png',
  rapier: '/icons/weapon-types/rapiers.png',
  scimitar: '/icons/weapon-types/scimitars.png',
  shortbow: '/icons/weapon-types/shortbows.png',
  shortsword: '/icons/weapon-types/shortswords.png',
  sickle: '/icons/weapon-types/sickles.png',
  sling: '/icons/weapon-types/slings.png',
  spear: '/icons/weapon-types/spears.png',
  trident: '/icons/weapon-types/tridents.png',
  'war pick': '/icons/weapon-types/war-picks.png',
  warhammer: '/icons/weapon-types/warhammers.png'
}
// Longest name first, so "hand crossbow" matches before a hypothetical bare
// "crossbow" entry, and "greatsword" doesn't get shadowed by "sword".
const WEAPON_TYPE_KEYS = Object.keys(WEAPON_TYPE_ICONS).sort((a, b) => b.length - a.length)

/** Strips the `srd:kind.` prefix a content id always carries, e.g. `srd:class.barbarian` -> `barbarian`. */
function idSuffix(id: string): string {
  const i = id.lastIndexOf('.')
  return i === -1 ? id : id.slice(i + 1)
}

export function classIcon(classId: string): string | undefined {
  return CLASS_ICONS[idSuffix(classId)]
}

export function subclassIcon(subclassId: string): string | undefined {
  return SUBCLASS_ICONS[idSuffix(subclassId)]
}

/** `speciesId` may be a subspecies id (`srd:species.dwarf.hill`) — only the base segment has art. */
export function speciesIcon(speciesId: string): string | undefined {
  const rest = speciesId.replace(/^srd:species\./, '')
  const base = rest.split('.')[0]!
  return SPECIES_ICONS[base]
}

export function skillIcon(skillId: string): string | undefined {
  return SKILL_ICONS[skillId]
}

export function abilityIcon(ability: Ability): string | undefined {
  return ABILITY_ICONS[ability]
}

export function damageTypeIcon(type: DamageType): string | undefined {
  return DAMAGE_TYPE_ICONS[type]
}

/** Matches an item's free-text display name against known weapon type names. */
export function weaponTypeIconForName(name: string): string | undefined {
  const lower = name.toLowerCase()
  const key = WEAPON_TYPE_KEYS.find((k) => lower.includes(k))
  return key ? WEAPON_TYPE_ICONS[key] : undefined
}

// ---------------------------------------------------------------------------
// Spells, and the glyph that stands in when a spell has no art of its own
// ---------------------------------------------------------------------------

/**
 * Which generic glyph speaks for each school.
 *
 * Only about half the SRD spell list has bespoke art in the bg3.wiki set, and
 * the misses are overwhelmingly utility spells — Prestidigitation, Alarm,
 * Find Familiar — where the school genuinely is the most useful thing a small
 * square can say. Every spell has a school, so this always resolves.
 */
const SCHOOL_GLYPH: Record<string, string> = {
  abjuration: 'buff',
  conjuration: 'summon',
  divination: 'info',
  enchantment: 'control',
  evocation: 'damage',
  illusion: 'invisibility',
  necromancy: 'death',
  transmutation: 'magical'
}

/** Bespoke art for a spell, if the icon set has any. */
export function spellIcon(spellId: string): string | undefined {
  return SPELL_ICONS[idSuffix(spellId)]
}

/** A glyph for a damage type, a school, or any generic key the set defines. */
export function genericIcon(key: string | undefined): string | undefined {
  if (!key) return undefined
  return GENERIC_ICONS[key] ?? GENERIC_ICONS[SCHOOL_GLYPH[key] ?? '']
}

/**
 * The icon to show for a spell, in order of how much it tells the player:
 * its own art, then what it does to you, then what kind of magic it is.
 *
 * Always returns something for a real spell, which is what lets the spell
 * list and the action bar be uniformly iconic instead of patchy.
 */
export function spellIconOrGlyph(
  spellId: string, damageType?: string, school?: string
): string | undefined {
  return spellIcon(spellId) ?? genericIcon(damageType) ?? genericIcon(school)
}

/**
 * The icon for anything on the action bar or in the Actions list.
 *
 * One resolver rather than a branch at each call site, because the HUD and the
 * menu must never disagree about what a given action looks like — the whole
 * value of an icon on a hotbar is that it is the same picture every time.
 */
export function actionIcon(action: ActionView): string | undefined {
  const damageType = action.damageRoll?.pools[0]?.type

  // A spell knows its own art; a weapon attack is named after the weapon
  // ("Attack with Longsword"), which is the only handle on its type the view
  // model offers.
  if (action.command.type === 'castSpell') {
    return spellIconOrGlyph(action.command.spellId, damageType) ?? genericIcon('magical')
  }
  // Dash, Disengage, Hide and friends have their own art. Matched on the
  // label's first word so "Dash (Cunning Action)" still finds the dash icon.
  const universal = ACTION_ICONS[action.label.toLowerCase().split(/[^a-z]/)[0] ?? '']
  if (universal) return universal

  const byName = nameIcon(action.label)
  if (byName) return byName
  if (damageType) return genericIcon(damageType)
  return genericIcon(action.kind === 'attack' ? 'physical' : 'feature')
}

// ---------------------------------------------------------------------------
// Items — by kind, because name-matching them does not work
// ---------------------------------------------------------------------------

/**
 * What an item's *name* alone reveals: its weapon type, or that it is a potion,
 * a scroll, a wand. Separate from `itemIcon` because an action needs exactly
 * this much — "Use Potion of Healing" should show a potion — without
 * inheriting `itemIcon`'s guarantee of always returning something, which would
 * swallow the more meaningful fallbacks an action has.
 */
export function nameIcon(label: string): string | undefined {
  const weapon = weaponTypeIconForName(label)
  if (weapon) return weapon
  const lower = label.toLowerCase()
  if (lower.includes('potion') || lower.includes('elixir')) return CATEGORY_ICONS['potion']
  if (lower.includes('scroll')) return CATEGORY_ICONS['scroll']
  if (lower.includes('wand')) return CATEGORY_ICONS['wand']
  return undefined
}

/** Equipment slot -> category glyph. Two slots share the ring icon. */
const SLOT_CATEGORY: Record<string, string> = {
  armor: 'armor',
  shield: 'shield',
  head: 'head',
  cloak: 'cloak',
  gloves: 'gloves',
  boots: 'boots',
  amulet: 'amulet',
  ring1: 'ring',
  ring2: 'ring'
}

/**
 * The icon for an inventory item or an equipment slot.
 *
 * A weapon is recognised from its name, because "Longsword +1" and "Flame
 * Tongue Longsword" are both longswords and the icon set has a longsword. For
 * everything else the answer is its category: only 11% of SRD items have
 * bespoke art in this set — BG3 ships its own itemisation — so a ring showing
 * a ring is both the best available answer and an honest one.
 */
export function itemIcon(
  { label, slot, group }: { label: string; slot?: string; group?: string }
): string | undefined {
  const byName = nameIcon(label)
  if (byName) return byName

  const bySlot = slot ? CATEGORY_ICONS[SLOT_CATEGORY[slot] ?? ''] : undefined
  if (bySlot) return bySlot
  if (group === 'consumables') return CATEGORY_ICONS['potion']
  return genericIcon('magical')
}
