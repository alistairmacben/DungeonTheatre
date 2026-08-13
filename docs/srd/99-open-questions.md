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

## D. Things I expect to resolve by finishing the read

Recorded so I don't forget to check:

- Exact multiclass spellcasting rule (p56–57, partially read)
- Whether the SRD includes **backgrounds** at all (not yet seen — the class
  entries say "equipment granted by your background", implying they exist)
- Whether **feats** are a full list or just the variant rule (p75 is a single
  page, which seems short)
- The full **conditions** appendix and exhaustion track
- Whether **disease** is defined as a mechanic or left to the DM
- Magic item **attunement** limit and the rarity/bonus conventions
- Spell **component** rules including material component costs
