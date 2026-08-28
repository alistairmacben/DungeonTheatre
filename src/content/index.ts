// Content loading. Layers 2 and 3 of docs/architecture.md go into the same
// maps: an SRD longsword and a DM-authored Flamefang are the same type and are
// resolved by the same code, differing only in provenance.

import type {
  ClassDefinition, ContentIndex, ItemDefinition, SpeciesDefinition,
  SpellDefinition, SubclassDefinition
} from '../rules/types.js'
import { createContentIndex } from '../rules/index.js'
import {
  ALL_CLASSES, ALL_FEATS, ALL_ITEMS, ALL_SPECIES, BASELINE
} from './srd.js'
import { EXTRA_CLASSES, EXTRA_ITEMS } from './classes-extra.js'
import { PALADIN_CLASSES, PALADIN_SUBCLASSES } from './paladin.js'
import {
  SORCERER_CLASSES, SORCERER_ITEMS, SORCERER_SUBCLASSES
} from './sorcerer.js'
import { RANGER_CLASSES, RANGER_SUBCLASSES } from './ranger.js'
import { ALL_SPELLS } from './spells.js'
import { ALL_LEVEL1_SPELLS } from './spells-level1.js'
import { ALL_LEVEL2_SPELLS } from './spells-level2.js'
import { ALL_LEVEL3_SPELLS } from './spells-level3.js'
import { ALL_LEVEL4_SPELLS } from './spells-level4.js'
import { WIZARD_CLASSES, WIZARD_ITEMS, WIZARD_SPECIES } from './wizard.js'
import { PARTY_CLASSES, PARTY_ITEMS, PARTY_SPECIES } from './party.js'
import {
  BARBARIAN_CLASSES, BARBARIAN_ITEMS, BARBARIAN_SPECIES, BARBARIAN_SUBCLASSES
} from './barbarian.js'
import { MONK_CLASS, MONK_SUBCLASSES } from './monk.js'
import { FIGHTER_CLASSES, FIGHTER_SUBCLASSES } from './fighter.js'
import { WIZARD_SUBCLASSES } from './wizard.js'
import { PARTY_SUBCLASSES } from './party.js'
import { BARD_SUBCLASSES } from './bard.js'
import { BARD_CLASSES, BARD_ITEMS, BARD_SPECIES } from './bard.js'
import {
  WARLOCK_CLASSES, WARLOCK_ITEMS, WARLOCK_SPECIES, WARLOCK_SPELLS, WARLOCK_SUBCLASSES
} from './warlock.js'
import {
  DRUID_CLASSES, DRUID_ITEMS, DRUID_SPECIES, DRUID_SUBCLASSES
} from './druid.js'

export * from './srd.js'
export * from './classes-extra.js'
export * from './spells.js'
export * from './wizard.js'
export * from './party.js'
export * from './barbarian.js'
export * from './bard.js'
export * from './warlock.js'
export * from './druid.js'
export * from './progression.js'
export * from './integrity.js'
export * from './monk.js'
export * from './fighter.js'

// One list per content kind, so adding a module is one line in one place rather
// than four edits scattered through loadContent. The last writer for a given id
// wins; validation, not this function, is where a genuine collision is caught.
const SPECIES: SpeciesDefinition[] = [
  ...ALL_SPECIES, ...WIZARD_SPECIES, ...PARTY_SPECIES,
  ...BARBARIAN_SPECIES, ...BARD_SPECIES, ...WARLOCK_SPECIES, ...DRUID_SPECIES
]
const CLASSES: ClassDefinition[] = [
  ...ALL_CLASSES, ...EXTRA_CLASSES, ...WIZARD_CLASSES, ...PARTY_CLASSES,
  ...BARBARIAN_CLASSES, ...BARD_CLASSES, ...WARLOCK_CLASSES, ...DRUID_CLASSES,
  MONK_CLASS, ...FIGHTER_CLASSES, ...PALADIN_CLASSES, ...SORCERER_CLASSES,
  ...RANGER_CLASSES
]
const ITEMS: ItemDefinition[] = [
  ...ALL_ITEMS, ...EXTRA_ITEMS, ...WIZARD_ITEMS, ...PARTY_ITEMS,
  ...BARBARIAN_ITEMS, ...BARD_ITEMS, ...WARLOCK_ITEMS, ...DRUID_ITEMS,
  ...SORCERER_ITEMS
]
const SPELLS: SpellDefinition[] = [
  ...ALL_SPELLS, ...WARLOCK_SPELLS, ...ALL_LEVEL1_SPELLS, ...ALL_LEVEL2_SPELLS,
  ...ALL_LEVEL3_SPELLS, ...ALL_LEVEL4_SPELLS
]
const SUBCLASSES: SubclassDefinition[] = [
  ...MONK_SUBCLASSES, ...FIGHTER_SUBCLASSES, ...WIZARD_SUBCLASSES, ...PARTY_SUBCLASSES,
  ...BARD_SUBCLASSES, ...BARBARIAN_SUBCLASSES, ...WARLOCK_SUBCLASSES,
  ...DRUID_SUBCLASSES, ...PALADIN_SUBCLASSES, ...SORCERER_SUBCLASSES,
  ...RANGER_SUBCLASSES
]

export function loadContent(): ContentIndex {
  const content = createContentIndex()
  for (const s of SPECIES) content.species.set(s.id, s)
  for (const c of CLASSES) content.classes.set(c.id, c)
  for (const sc of SUBCLASSES) content.subclasses.set(sc.id, sc)
  for (const f of ALL_FEATS) content.feats.set(f.id, f)
  for (const i of ITEMS) content.items.set(i.id, i)
  for (const sp of SPELLS) content.spells.set(sp.id, sp)
  content.ambient = [BASELINE]
  return content
}
