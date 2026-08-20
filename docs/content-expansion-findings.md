# Content expansion — did the architecture hold?

Four classes and four species (Barbarian/Half-Orc, Warlock/Tiefling, Bard/Half-Elf,
Druid/Wood Elf) were authored by parallel agents against the SRD extraction in
`docs/srd/`, each chosen to *stress* a different part of the vocabulary rather
than for coverage. This records what the exercise proved.

The adversarial verifiers and the synthesis agent ran out of budget mid-run, so
the SRD line-by-line accuracy pass is **not** complete — see the caveat at the
end. The compile check, the resolution smoke test (`test-new-classes.mjs`, one
coherent character per class plus a sweep of all ten), and this synthesis were
done directly.

## The claim under test

> Expansion should be primarily a CONTENT problem rather than requiring new
> engine code every time.

Stated when the engine was designed. The distinction that matters is **new nouns
vs new verbs**: a new stat path or a new predicate arm is cheap, expected, and
does not threaten the design. A new *operation*, a new *channel*, or a new
*resolution stage* would mean the vocabulary was incomplete — that is the
expensive, claim-invalidating kind.

## Verdict: the claim held

**Zero of the four needed a new operation, a new channel, or a new resolution
stage.** The eight value operations and three channels absorbed every one of the
four classes without change. All four files compile against the unmodified
vocabulary and produce coherent, playable characters through the one contract.

Everything the authors requested falls into three buckets:

### Bucket 1 — new nouns (cheap, expected, ~1 line each)

These are the vocabulary asking for more words, not more grammar. None touches
the resolver's logic.

| Request | For | Shape |
|---|---|---|
| `attacksPerAction` stat path | Extra Attack (Barb, Fighter, Monk, Paladin, Ranger) | declare + read in build.ts |
| `hitDice.healingBonus` stat path | Song of Rest | declare + read in rest procedure |
| `{ kind: 'language' }` on ProficiencyCategory | Druidic, and every species | one arm + one scope line |
| `{ kind: 'abilityCheck'; ability? }` on ProficiencyCategory | Jack of All Trades | one arm + one scope line |
| `'spell'` added to SelectionDefinition.kind, `count` as ValueExpr | cantrips/spells known | widen a union |
| `condition?: Predicate` on SpellGrant | druid circle spells, warlock staged unlock | copy the field Modifier and ProficiencyGrant already have |
| `{ selectionIncludes: [id, value] }` predicate | Pact Boon, circle choice | one predicate arm |
| `spellSlot.level` as `number \| ValueExpr` | **pact magic** — the slot level rises with level | evaluate where it currently reads a number |
| `castAtLevel?: ValueExpr` on SpellGrant | warlock fixed upcast | surface on CastableSpell |
| `restores?: Record<ResourceId, ValueExpr>` on ActionDefinition | Natural Recovery, Arcane Recovery (already stubbed) | one reducer branch |
| templated `Modifier.target` | Half-Elf floating +1/+1 | resolve target against a selection |
| `temporaryHitPoints` grant carrying ValueExpr | Dark One's Blessing, Inspiring Leader | one grant type |
| `componentSubstitution` on EffectSource | druid/arcane focus | one flag consulted at cast |

The single most valuable one is **`spellSlot.level` as a ValueExpr**, because it
is the whole of what made pact magic look hard: a warlock's slots are all at the
highest level they have, and that level is a formula. Once the slot level is a
ValueExpr instead of a constant, pact magic is ordinary content. That was the
class picked specifically to break the slot model, and it did not.

### Bucket 2 — one genuinely new mechanism (worth building, recurs)

**Conferred sources — an effect applied to a creature that is not the source.**
Bardic Inspiration hands a die to an ally; Cutting Words subtracts from an
enemy's roll; Song of Rest heals the party; Bless (already stubbed) adds a d4 to
three creatures. This is the same shape four times over, and it is the one thing
the current model cannot express: every EffectSource today belongs to the
character it resolves on.

The scaffolding is already half-built: `RollResolution.pendingDice` exists as a
field and nothing populates it. The design work is the targeting and delivery —
how a source on character A reaches a roll on character B — which is genuinely
new and should not be rushed. It is also a prerequisite for a large fraction of
buff/debuff spells, so it earns its place. **This is the real finding.**

### Bucket 3 — one feature beyond the model, correctly isolated

**Wild Shape.** Replacing the character's entire statblock with a beast's. The
druid author flagged it exactly as `docs/srd/90-vocabulary-findings.md`
anticipated during the original read: it needs a `StatblockDefinition` content
type, a `creatures` map on `ContentIndex`, and a form stack. It is large, it is
isolated to one feature, and until it is built it degrades to a narrative clause
the player and DM can see. That is the designed behaviour for
"the-engine-cannot-do-this," and it worked.

A related third item, smaller than either: **damage-interception triggers**
(Relentless Endurance, Uncanny Dodge, Heavy Armor Master — already partial). The
trigger vocabulary exists; `applyDamage` does not yet consult triggers. Half a
noun: a wiring job, not a new concept.

## What is ready, and what is stubbed

All four files are **wired into content and shipping** (`src/content/index.ts`).
Every one produces a coherent character; the features in buckets 2 and 3 render
as narrative clauses or unavailable actions rather than resolving to wrong
numbers. Specifically stubbed today: Rage's damage bonus, Extra Attack, Frenzy,
Savage Attacks, Bardic Inspiration, Cutting Words, Jack of All Trades, Song of
Rest, Wild Shape, the half-elf floating ASI, and pact magic's rising slot level.

Two content gaps, distinct from engine gaps: **`srd:list.bard` and
`srd:list.druid` have zero spells tagged**, so a bard or druid currently resolves
with nothing to cast and the view hides its spellcasting section entirely. The
slots exist as resources — the machinery is wired — but the section stays hidden
until the lists are populated. That is H-phase content work. It also surfaces a
view question worth deciding: `spellcasting.active` is derived from
`accessible.length > 0`, so a caster with an empty spellbook looks like a
non-caster; arguably the section should show whenever spell slots exist.

## Priority order for the gaps

1. **`spellSlot.level` as ValueExpr** — unblocks pact magic entirely, one change.
2. **`attacksPerAction` stat path** — unblocks Extra Attack for five classes.
3. **The cheap predicate/proficiency/selection nouns** — batch them; each
   unblocks several features and none is risky.
4. **Populate `srd:list.bard` / `srd:list.druid`** — pure content.
5. **Conferred sources (bucket 2)** — the one real design task; do it deliberately.
6. **Damage-interception triggers** — wiring.
7. **Wild Shape (bucket 3)** — large, isolated, lowest priority; stays narrative
   until specifically wanted.

None of 1–4 or 6 changes the phase order (persistence → creation → content → DM
roster). Item 5 is the one thing that might deserve its own slot, and it should
land before the SRD spell list is populated in earnest, because so many spells
depend on it.

## Caveat — what was NOT verified

The adversarial SRD-accuracy pass did not run to completion. The numbers in
these four files (hit dice, save proficiencies, resource maxima, feature levels)
have been smoke-tested for *coherence* but not checked line-by-line against the
extraction. Before these classes are considered production content, re-run the
`verify:*` half of the workflow (it is cached against the authored files and will
replay cheaply) or read each against `docs/srd/02-classes.md` directly.
