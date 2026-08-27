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
import { ALL_SPELLS } from './spells.js'
import { WIZARD_CLASSES, WIZARD_ITEMS, WIZARD_SPECIES } from './wizard.js'
import { PARTY_CLASSES, PARTY_ITEMS, PARTY_SPECIES } from './party.js'
import { BARBARIAN_CLASSES, BARBARIAN_ITEMS, BARBARIAN_SPECIES } from './barbarian.js'
import { MONK_CLASS, MONK_SUBCLASSES } from './monk.js'
import { FIGHTER_CLASSES, FIGHTER_SUBCLASSES } from './fighter.js'
import { WIZARD_SUBCLASSES } from './wizard.js'
import { BARD_CLASSES, BARD_ITEMS, BARD_SPECIES } from './bard.js'
import { WARLOCK_CLASSES, WARLOCK_ITEMS, WARLOCK_SPECIES, WARLOCK_SPELLS } from './warlock.js'
import { DRUID_CLASSES, DRUID_ITEMS, DRUID_SPECIES } from './druid.js'

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
  MONK_CLASS, ...FIGHTER_CLASSES
]
const ITEMS: ItemDefinition[] = [
  ...ALL_ITEMS, ...EXTRA_ITEMS, ...WIZARD_ITEMS, ...PARTY_ITEMS,
  ...BARBARIAN_ITEMS, ...BARD_ITEMS, ...WARLOCK_ITEMS, ...DRUID_ITEMS
]
const SPELLS: SpellDefinition[] = [...ALL_SPELLS, ...WARLOCK_SPELLS]
const SUBCLASSES: SubclassDefinition[] = [
  ...MONK_SUBCLASSES, ...FIGHTER_SUBCLASSES, ...WIZARD_SUBCLASSES
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
