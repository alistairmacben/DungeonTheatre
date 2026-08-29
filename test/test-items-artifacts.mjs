// Magic items, catalogue closer: Artifacts — the SRD's one artifact, Orb of
// Dragonkind. Sentient magic items (§12) are a DM-facing mechanic, not a
// catalogue of items, so nothing is authored for that section.
//
// Checked against docs/srd/10-magic-items.md §13 (Artifacts).

import { checkContentIntegrity, loadContent } from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()
const itemDef = (id) => content.items.get(id)

// ---------------------------------------------------------------------------
// Orb of Dragonkind
// ---------------------------------------------------------------------------

{
  const def = itemDef('srd:item.orb-of-dragonkind')
  check('orb of dragonkind exists', def !== undefined)
  check.eq('orb of dragonkind: artifact rarity', def.rarity, 'artifact')
  check.eq('orb of dragonkind: requires attunement', def.requiresAttunement, true)
  check.eq('orb of dragonkind: 7 charges', def.charges.max, 7)
  check.eq('orb of dragonkind: dawn refresh', def.charges.refresh.kind, 'dawn')
  check.eq('orb of dragonkind: partial, no real modifier for the orb\'s own DC 18 casting',
    def.effects.completeness, 'partial')
  check('orb of dragonkind: narrative explains the attunement gate, spells, and destruction condition',
    def.effects.narrative[0].text.includes('DC 15') && def.effects.narrative[0].text.includes('DC 18')
      && def.effects.narrative[0].text.includes('disintegrate'))
}

// ---------------------------------------------------------------------------
// The gate every item passes
// ---------------------------------------------------------------------------

{
  const problems = checkContentIntegrity(content)
  const errors = problems.filter((p) => p.severity === 'error')
  check('integrity: the batch introduces no errors',
    errors.length === 0, errors.map((p) => `${p.where}: ${p.message}`).join(' | '))
}

check.report()
