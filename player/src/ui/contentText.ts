// Turning a content id into something worth reading.
//
// The pending-choice view model carries ids and labels — "srd:feat.alert",
// "Alert" — which is all a button needs and nowhere near enough to choose
// with. The definitions in the index already say what each thing does, so
// this reads that back out rather than inventing a second description of the
// same thing that could drift from the first.
//
// Where that meaning lives varies by kind, which is the whole reason this
// file is more than one lookup: a spell keeps prose in `narrative`, a feat
// usually keeps none at all and says everything through its elected options
// and its modifiers' notes, and a subclass explains itself only as the list
// of features it will grant. See `sourceLines`.
//
// Read-only against `ContentIndex`, and deliberately outside the engine: no
// rule is decided here, and nothing in `src/rules` knows this file exists.

import type { ContentIndex, EffectSource } from '@engine'

export interface InspectText {
  title: string
  /** "Level 2 Evocation Spell", "Fighter · Level 3" — what kind of thing this is. */
  subtitle?: string
  /** What it does to you, in the content author's own words. */
  lines: string[]
  /** Short facts that read better as chips than as sentences. */
  footer: string[]
}

/** "srd:feat.alert" -> "feat". Plain ids ("acrobatics") have no kind. */
function kindOf(id: string): string | undefined {
  const afterScope = id.includes(':') ? id.slice(id.indexOf(':') + 1) : undefined
  return afterScope?.split('.')[0]
}

/**
 * A readable name for an id, used when nothing better exists.
 *
 * Every id in this codebase ends in a dash-cased name segment, so this gets
 * legible results ("Fire Bolt") without a content lookup — which matters for
 * free-text selections ("any language") that have no definition at all.
 */
export function guessLabel(id: string): string {
  const last = id.split('.').at(-1) ?? id
  return last
    .split('-')
    .map((w) => (w[0]?.toUpperCase() ?? '') + w.slice(1))
    .join(' ')
}

type Modifier = EffectSource['modifiers'][number]

/** "hitPoints.max" -> "hit points max"; "beSurprised" -> "be surprised". */
function humanise(camel: string): string {
  return camel.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase()
}

function prettyTarget(path: string): string {
  return path.split('.').map(humanise).join(' ')
}

function signed(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`
}

/**
 * One modifier, as a line worth reading.
 *
 * `build.ts` states the rule this follows: "A note annotates the mechanics; it
 * does not stand in for them. Letting it replace them is how a shield ends up
 * describing itself as 'shield' and never mentioning the +2." Alert is the
 * proof — of its three modifiers only one carries a note, so reading notes
 * alone silently dropped both "+5 initiative" and "cannot be surprised".
 *
 * The one case where a note genuinely is the description is a value the note
 * spells out in words because it cannot be a literal: Tough adds `level × 2`
 * and annotates it "twice your level". That is detectable structurally — the
 * value is a formula rather than a number — so no string-sniffing is needed.
 */
function modifierLine(m: Modifier): string | undefined {
  if (m.channel === 'capability' && m.capability) {
    return `${m.capOp === 'revoke' ? 'cannot' : 'can'} ${humanise(m.capability)}`
  }
  // A roll modifier's real scope ("on Dexterity saves against traps") needs the
  // engine's own scope renderer; the note is the authored short form of it.
  if (m.channel === 'roll') return m.note ?? (m.rollOp ? `${m.rollOp} on some rolls` : undefined)
  // Suppression has no arithmetic to show, so the note is the whole point.
  if (m.op === 'suppress' || !m.target || !m.op) return m.note

  const stat = prettyTarget(m.target)

  // `resistance.poison` is a flag wearing a number's clothes — "becomes 1" is
  // arithmetically true and useless to read.
  if (m.op === 'set' && m.target.startsWith('resistance.')) {
    const type = m.target.slice('resistance.'.length)
    const n = typeof m.value === 'number' ? m.value : 1
    return n >= 2 ? `immune to ${type}`
      : n >= 1 ? `resistance to ${type}`
        : n <= -1 ? `vulnerable to ${type}`
          : undefined
  }

  if (typeof m.value !== 'number') {
    // A formula. Untaken, there is no character to evaluate it against, so the
    // note is the only statement of the quantity available — given its subject.
    return m.note ? `${stat}: ${m.note}` : `changes ${stat}`
  }
  if (m.op === 'add') {
    if (m.value === 0) return undefined
    return `${signed(m.value)} ${stat}`
  }
  if (m.op === 'base') return `${stat} ${m.value}`
  if (m.op === 'set') return `${stat} becomes ${m.value}`
  if (m.op === 'min') return `${stat} at least ${m.value}`
  if (m.op === 'max') return `${stat} at most ${m.value}`
  if (m.op === 'multiply') return `${stat} × ${m.value}`
  return m.note
}

/**
 * What a source actually does to you.
 *
 * Read from every place the content keeps meaning, because no single field
 * holds it: a spell writes prose in `narrative`, a feat like Great Weapon
 * Master writes none and says everything through an elected option, and Alert
 * says it through three modifiers of three different channels.
 */
function sourceLines(source: EffectSource | undefined): string[] {
  if (!source) return []
  const out: string[] = []

  for (const clause of source.narrative ?? []) {
    if (clause.text) out.push(clause.text)
  }
  for (const option of source.options ?? []) out.push(option.label)
  for (const modifier of source.modifiers ?? []) {
    const line = modifierLine(modifier)
    if (line) out.push(line)
  }
  for (const action of source.actions ?? []) out.push(action.description ?? action.name)
  for (const resource of source.resources ?? []) out.push(`grants ${resource.name}`)

  // "−5 to hit" is already inside "Power Attack (−5 to hit, +10 damage)".
  // Dropping any line another line already states keeps the panel short
  // without a hand-maintained list of which fields overlap.
  return out.filter((line, i) =>
    out.findIndex((other) => other === line) === i
    && !out.some((other) => other !== line && other.includes(line)))
}

function rangeLabel(spell: {
  rangeKind: string; rangeFeet?: number
}): string {
  if (spell.rangeKind === 'ranged') return spell.rangeFeet ? `${spell.rangeFeet} ft` : 'Ranged'
  return spell.rangeKind.charAt(0).toUpperCase() + spell.rangeKind.slice(1)
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Everything the UI knows how to explain, dispatched on the id's own kind.
 *
 * Returns a usable panel for an unknown id rather than nothing: a selection
 * whose options are free text ("any artisan's tool") still deserves a title.
 */
export function describeId(content: ContentIndex, id: string): InspectText {
  switch (kindOf(id)) {
    case 'spell': return describeSpell(content, id)
    case 'feat': return describeFeat(content, id)
    case 'subclass': return describeSubclass(content, id)
    case 'class': return describeClass(content, id)
    default: return describeSkill(content, id) ?? { title: guessLabel(id), lines: [], footer: [] }
  }
}

function describeSpell(content: ContentIndex, id: string): InspectText {
  const spell = content.spells.get(id)
  if (!spell) return { title: guessLabel(id), lines: [], footer: [] }

  const school = titleCase(spell.school)
  const footer = [rangeLabel(spell)]
  if (spell.concentration) footer.push('Concentration')
  if (spell.ritual) footer.push('Ritual')
  if (spell.components.verbal) footer.push('V')
  if (spell.components.somatic) footer.push('S')
  if (spell.components.material) footer.push('M')

  const lines = sourceLines(spell.effects)
  // The damage is the single fact a player picks an attack cantrip on, and it
  // is not always spelled out in the prose.
  for (const d of spell.effect?.damage ?? []) {
    lines.unshift(`${d.dice.count}d${d.dice.sides} ${d.type} damage`)
  }

  return {
    title: spell.name,
    subtitle: spell.level === 0 ? `${school} Cantrip` : `Level ${spell.level} ${school} Spell`,
    lines,
    footer
  }
}

function describeFeat(content: ContentIndex, id: string): InspectText {
  const feat = content.feats.get(id)
  if (!feat) return { title: guessLabel(id), lines: [], footer: [] }
  return { title: feat.name, subtitle: 'Feat', lines: sourceLines(feat.effects), footer: [] }
}

/**
 * A subclass is explained by what it grants and when — which is exactly the
 * question being asked at the moment one is chosen, and is not written down
 * anywhere as a single blurb.
 */
function describeSubclass(content: ContentIndex, id: string): InspectText {
  const subclass = content.subclasses.get(id)
  if (!subclass) return { title: guessLabel(id), lines: [], footer: [] }

  const className = content.classes.get(subclass.classId)?.name
  const lines = [...subclass.features]
    .sort((a, b) => a.grantedAtLevel - b.grantedAtLevel)
    .map((f) => `Level ${f.grantedAtLevel} — ${f.name}`)

  return {
    title: subclass.name,
    subtitle: className ? `${className} subclass` : 'Subclass',
    lines,
    footer: []
  }
}

function describeClass(content: ContentIndex, id: string): InspectText {
  const klass = content.classes.get(id)
  if (!klass) return { title: guessLabel(id), lines: [], footer: [] }
  return {
    title: klass.name,
    subtitle: `d${klass.hitDie} hit die`,
    lines: [],
    footer: klass.savingThrowProficiencies.map((a) => `${a.toUpperCase()} save`)
  }
}

function describeSkill(content: ContentIndex, id: string): InspectText | undefined {
  const skill = content.skills.get(id)
  if (!skill) return undefined
  return {
    title: skill.name,
    subtitle: 'Skill',
    lines: [`Usually rolled with ${skill.defaultAbility.toUpperCase()}.`],
    footer: []
  }
}
