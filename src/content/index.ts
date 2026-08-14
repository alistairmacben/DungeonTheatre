// Content loading. Layers 2 and 3 of docs/architecture.md go into the same
// maps: an SRD longsword and a DM-authored Flamefang are the same type and are
// resolved by the same code, differing only in provenance.

import type { ContentIndex } from '../rules/types.js'
import { createContentIndex } from '../rules/index.js'
import {
  ALL_CLASSES, ALL_FEATS, ALL_ITEMS, ALL_SPECIES, BASELINE
} from './srd.js'
import { EXTRA_CLASSES, EXTRA_ITEMS } from './classes-extra.js'

export * from './srd.js'
export * from './classes-extra.js'

export function loadContent(): ContentIndex {
  const content = createContentIndex()
  for (const s of ALL_SPECIES) content.species.set(s.id, s)
  for (const c of [...ALL_CLASSES, ...EXTRA_CLASSES]) content.classes.set(c.id, c)
  for (const f of ALL_FEATS) content.feats.set(f.id, f)
  for (const i of [...ALL_ITEMS, ...EXTRA_ITEMS]) content.items.set(i.id, i)
  content.ambient = [BASELINE]
  return content
}
