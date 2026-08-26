# SRD source files

The primary sources content authoring is checked against. Committed here so
they're never a single-machine risk and so future authoring/verification
passes can go straight to page/paragraph rather than trusting a summary.

- `races.pdf`, `classes.pdf`, `spells.pdf`, `magic-items.pdf`, `equipment.pdf`,
  `conditions.pdf`, `rules-1/2/3.pdf` — the official SRD 5.1 document, split
  by section. These are the same source `docs/srd/*.md` was extracted from —
  re-checked against the existing extraction on 2026-08-26 and found to match
  (same page counts, same content). Kept for direct verification rather than
  trusting the extraction alone.
- `feats.txt` — SRD-adjacent 2014-style feat text (feats are not part of the
  official free SRD). 43 feats, full mechanical text. Not yet reflected in
  `docs/srd/05-feats.md`, which only captured 2. Explicitly marked in the
  source as reference data, not implementation instructions — feats must be
  built on the existing generic effect vocabulary, never as bespoke
  hardcoded logic.

Excluded on request: monster/creature statblocks. Not being implemented yet.
