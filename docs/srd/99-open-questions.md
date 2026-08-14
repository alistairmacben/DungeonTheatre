# Open questions and gaps

Things the SRD does not settle, or that need a product decision. Collected
during the read so they can be worked through together once all 253 pages are
done. Nothing here blocks reading; all of it blocks *building*.

---

## A. Content the SRD references but does not contain

These features are **inert** in this edition — the rules exist but the data
they depend on was stripped out with the bestiary.

| Feature | Depends on | Status |
|---|---|---|
| Druid *Wild Shape* | beast statblocks, CR | unusable |
| Cleric *Destroy Undead* | challenge rating | unusable |
| Ranger *Favored Enemy* | creature type taxonomy | partially — types are named but no creatures exist |
| Paladin *Divine Sense*, *Turn the Unholy* | creature types (celestial/fiend/undead) | needs types on targets |
| Druid *Nature's Sanctuary* | creature types (beast/plant) | needs types on targets |

**Question 1.** Given no NPC mechanics in scope, do these features get:
(a) modelled and greyed out, (b) omitted from the MVP class data entirely, or
(c) modelled with a DM-facing manual toggle ("the DM says this counts")?

My inclination is (c) for the type-scoped ones — a DM can plausibly say "yes,
that's undead" — and (a) for Wild Shape, since it needs a whole statblock.

---

## B. Rules that require a judgement the engine cannot make

A recurring pattern: a mechanical benefit gated on a **narrative** condition.

- Dwarf *Stonecunning* — History checks "related to the origin of stonework"
- Gnome *Artificer's Lore* — History about magic items/alchemy/technology
- Ranger *Natural Explorer* — INT/WIS checks "related to your favoured terrain"
- Ranger *Favored Enemy* — INT checks "to recall information about them"

**Question 2.** Confirm the approach: surface these as an **opt-in toggle on
the roll** in the HUD ("Stonecunning applies — double proficiency"), defaulting
to off, with the player or DM deciding. Automating them is impossible;
hiding them loses the feature.

---

## C. Product decisions the rules force

**Question 3 — the reaction window.** Bardic Inspiration, Cutting Words and
Foe Slayer all let someone modify a roll *after* the dice land but before the
outcome is announced. This is a networked, interactive pause involving another
player's screen. How long should it stay open? Options: a fixed timer, an
explicit "resolve" click by the roller, or the DM advancing it. This is a UX
decision with real multiplayer consequences and I'd rather you chose it.

**Question 4 — half-caster and multiclass slot maths.** Paladin and Ranger use
a different slot table and a different prepared-spell formula from full
casters. Multiclassing combines them via a caster-level rule (still to read on
p56–57). Is multiclassing in scope for the MVP at all? It is the single most
intricate part of progression, and deferring it would remove a lot of risk.

**Question 5 — the SRD has exactly one subclass per class.** Barbarian gets
Berserker, Fighter gets Champion, Cleric gets Life, and so on. So "choose your
subclass" is a menu of one. Is that acceptable for v2, or is DM-authored
subclass creation needed early? (It uses the same feature/effect vocabulary,
so it is not architecturally hard — just scope.)

---

**Question 6 — Wild Shape. RESOLVED by the user (v3, deferred).** "Don't worry
too much about wild shape for now. Those stat blocks the DM can input — I'll
put in for a v3 perhaps." So Wild Shape is modelled as a **feature that
consumes uses and references a DM-supplied statblock**, with the statblock
library itself deferred. The entity-substitution machinery is *not* built now.

**Question 7 — feats. The SRD contains exactly one feat (Grappler), and its
only two benefits are combat-only.** With combat out of scope, shipping
SRD-pure feats means shipping nothing usable. Options: (a) build the feat
*system* and ship only Grappler, (b) skip feats entirely for v2, (c) build the
system and let the DM author feats as campaign content (Alert, Lucky,
Sharpshooter, War Caster…) using the same effect vocabulary. My inclination is
(c) — the system is small, it is the natural home for DM-authored character
options, and it exercises the prerequisite predicate language that
multiclassing already needs.

**Question 8 — survival clocks.** The SRD defines precise starvation, thirst
and forced-march rules that produce exhaustion (`06-core-rules.md` §8). These
need a **campaign calendar** and per-character day counters. Almost no table
tracks them. Build, stub with a DM toggle, or omit?

**Question 9 — downtime activities.** Crafting, professions, recuperating,
researching and training are all cleanly automatable day-granularity trackers,
and they happen *between* sessions, which suits a persistent app well. Is
downtime in scope for v2, or is that a later feature?

**Question 10 — the reaction/interaction surface is wider than Q3 suggested.**
Beyond the post-roll modifier window, these are also multi-participant or
sequential-interactive flows: **contests** (two players roll against each
other), **group checks** (everyone rolls, half must succeed), **Help** (a
second player grants advantage, and must be eligible to attempt the task), and
**spending Hit Dice on a short rest** (roll, see the result, decide whether to
roll again). Each needs a UI flow, and together they argue for one generic
"pending interaction" primitive rather than four bespoke ones.

**Question 11 — lifestyle, trade goods and services carry no mechanics.** They
are pure economy reference data. Include as shop/ledger content, or omit from
the rules dataset?

---

## D. Things I expect to resolve by finishing the read

Recorded so I don't forget to check:

- ~~Exact multiclass spellcasting rule~~ — **done**, `03-progression.md`
- ~~Whether the SRD includes backgrounds~~ — **done**, exactly one (Acolyte)
- ~~Whether feats are a full list or just the variant rule~~ — **done**,
  the rule plus exactly one feat (Grappler), `05-feats.md`
- The full **conditions** appendix and exhaustion track *(referenced constantly
  — falling → prone, forced march → exhaustion, heavily obscured → blinded,
  net → restrained. Appendix PH-A, not yet reached.)*
- Whether **disease** is defined as a mechanic or left to the DM *(Recuperating
  and Lesser Restoration both reference it)*
- Magic item **attunement** limit and the rarity/bonus conventions
- Spell **component** rules including material component costs
- Whether magic items introduce a **third refresh trigger ("at dawn")** beyond
  short and long rest
- Whether **initiative** is defined outside the combat section (out of scope,
  but the DEX section references it)
