# Feats (p75)

## The rule

Feats are an **optional rule**. At each Ability Score Improvement, a character
may **forgo the ASI entirely** and take a feat instead. (Not "instead of one of
the two +1s" — the whole feature is traded.)

- Each feat may be taken **only once**, unless its own text says otherwise.
- A feat may have a **prerequisite**, which must be met to take it.
- **[IMPORTANT] Prerequisites are continuously evaluated, not checked once.**
  "If you ever lose a feat's prerequisite, you can't use that feat until you
  regain the prerequisite." The SRD's own example: Grappler needs STR 13; if a
  withering curse drops your Strength below 13, the feat's benefits switch off
  and come back when Strength is restored.

This is architecturally significant. A feat is **not** a one-time grant applied
at character creation — it is a **conditional effect source** whose `active`
flag is itself a derived value computed from current (possibly debuffed)
ability scores. The same must be true of anything else with a live
prerequisite. It also means the derived-stat graph can have a **feedback edge**:
an effect that lowers STR can deactivate a feat that grants other effects.

## The complete SRD feat list

**The SRD 5.1 contains exactly one feat.** Verified by reading p75 end to end;
the section is a single page and p76 begins "Using Ability Scores".

### Grappler
*Prerequisite: Strength 13 or higher*

- **Advantage on attack rolls against a creature you are grappling.**
- **Action:** attempt to pin a creature you have grappled. Make another grapple
  check; on a success **both you and the creature are restrained** until the
  grapple ends.

Both benefits are combat-only, and combat is out of scope for this phase.

---

## Consequences for the engine

1. **The feat system must exist even though the content set is one item.**
   Feats are the primary vector for DM-authored character options, and the
   user's brief explicitly requires DM content to use the same Effect →
   Modifier → Derived Stat mechanism as SRD content. Grappler is the worked
   example proving the vocabulary needs: `prerequisite`, `advantage on
   {tag-scoped roll}`, and `grant: action`.

2. **ASI-or-feat is a choice node in progression**, not a passive award. The
   character build model needs choice points that can resolve to different
   *kinds* of thing (score increase vs. effect source).

3. **Prerequisites need a general predicate language** — ability minimums here,
   but the multiclass table (`03-progression.md`) already needs `and`/`or`
   combinations (Fighter: STR 13 **or** DEX 13; Monk: DEX 13 **and** WIS 13).
   One predicate evaluator serves both.

4. **Open question for the user:** whether to ship only Grappler (SRD-pure) or
   to build the feat system and let the DM author the familiar non-SRD feats
   (Alert, Lucky, Sharpshooter, War Caster, etc.) as campaign content. Logged
   in `99-open-questions.md`.
