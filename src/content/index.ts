// Content loading. Layers 2 and 3 of docs/architecture.md go into the same
// maps: an SRD longsword and a DM-authored Flamefang are the same type and are
// resolved by the same code, differing only in provenance.

import type { ContentIndex } from '../rules/types.js'
import { createContentIndex } from '../rules/index.js'
import {
  ALL_CLASSES, ALL_FEATS, ALL_ITEMS, ALL_SPECIES, BASELINE
} from './srd.js'
import { EXTRA_CLASSES, EXTRA_ITEMS } from './classes-extra.js'
import { ALL_SPELLS } from './spells.js'
import { WIZARD_CLASSES, WIZARD_ITEMS, WIZARD_SPECIES } from './wizard.js'

export * from './srd.js'
export * from './classes-extra.js'
export * from './spells.js'
export * from './wizard.js'

export function loadContent(): ContentIndex {
  const content = createContentIndex()
  for (const s of [...ALL_SPECIES, ...WIZARD_SPECIES]) content.species.set(s.id, s)
  for (const c of [...ALL_CLASSES, ...EXTRA_CLASSES, ...WIZARD_CLASSES]) content.classes.set(c.id, c)
  for (const f of ALL_FEATS) content.feats.set(f.id, f)
  for (const i of [...ALL_ITEMS, ...EXTRA_ITEMS, ...WIZARD_ITEMS]) content.items.set(i.id, i)
  for (const sp of ALL_SPELLS) content.spells.set(sp.id, sp)
  content.ambient = [BASELINE]
  return content
}
