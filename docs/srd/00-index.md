# SRD 5.1 — complete extraction corpus

**Purpose.** Read the SRD front to back and capture *everything* mechanical
before deciding what to trim. Accumulate first, lean later. Nothing is
summarised away during the read — trimming is a separate, later decision made
with the whole picture in hand.

**Source.** SRD 5.1, CC-BY-4.0, 253 pages, ~903k chars normalised.
**No bestiary** — no statblocks, no challenge ratings ("min" edition).

## Two kinds of file

- **`NN-*.md`** — complete extraction of a section. Every mechanic, in order,
  losslessly. These get long. That is intentional.
- **`90-vocabulary-findings.md`** — raw running notes from the races and classes
  read. Superseded by `91-effect-vocabulary.md`.
- **`91-effect-vocabulary.md`** — THE OUTPUT. The distilled, complete effect
  vocabulary derived from all 253 pages: every
  *distinct* mechanic pattern the effect vocabulary must express, deduplicated
  across sections. This is what the engine design is actually built from.

## Page map

| Pages | Section | File | Status |
|---|---|---|---|
| 1–2 | Legal / attribution | — | read |
| 3–7 | Races | `01-races.md` | **complete** |
| 8–56 | Classes (12) | `02-classes.md` | **complete** |
| 56–61 | Beyond 1st level, multiclassing | `03-progression.md` | **complete** |
| 62–74 | Equipment | `04-equipment.md` | **complete** |
| 75 | Feats | `05-feats.md` | **complete** (1 feat only) |
| 76–89 | Using ability scores, adventuring | `06-core-rules.md` | **complete** |
| 90–104 | Combat, spellcasting rules | `07-combat-spellcasting.md` | **complete** |
| 105–113 | Spell lists | `08-spell-lists.md` | **complete** |
| 114–193 | Spell descriptions (~320) | `08b-spell-descriptions.md` | **complete** |
| 194–205 | Traps, madness, poisons, objects | `09-dm-content.md` | **complete** |
| 206–253 | Magic items | `10-magic-items.md` | **complete** |
| — | **Appendix PH-A: Conditions** | — | **MISSING FROM THIS PDF** |

**The read is complete: all 253 pages have been read end to end.**

## [BLOCKER] The conditions appendix is not in this document

"Appendix PH-A" is **referenced by name on pages 9, 23, 67, 84, 86, 91, 93, 95,
98 and 100**, and the conditions it defines are invoked constantly throughout
the classes, spells, traps, poisons and magic items — but **the appendix itself
is absent from this 253-page extraction**, which ends with the *Orb of
Dragonkind* on p253.

Verified by full-text search: no page contains a condition definition (e.g.
"a blinded creature can't see"), and no page carries the appendix heading.

**Undefined but required:** blinded · charmed · deafened · exhaustion (the six
levels) · frightened · grappled · incapacitated · invisible · paralyzed ·
petrified · poisoned · prone · restrained · stunned · unconscious.

This is the single largest hole in the corpus and it blocks the condition
system outright. See `99-open-questions.md` Q12.

## Class read order and page ranges

| Class | Pages | Casting model | Status |
|---|---|---|---|
| Barbarian | 8–10 | none | complete |
| Bard | 11–14 | known, any-list at L10 | complete |
| Cleric | 15–18 | prepared (divine) | complete |
| Druid | 19–23 | prepared | complete |
| Fighter | 24–25 | none (Eldritch Knight subclass absent from SRD?) | complete |
| Monk | 26–29 | none (ki) | complete |
| Paladin | 30–34 | prepared, half-caster | complete |
| Ranger | 35–38 | known, half-caster | complete |
| Rogue | 39–41 | none | complete |
| Sorcerer | 42–45 | known + sorcery points | complete |
| Warlock | 46–51 | known + pact magic (short-rest slots) | complete |
| Wizard | 52–55 | spellbook + prepared | complete |

The casting models are the architecturally important variable: **known**,
**prepared**, **spellbook**, and **pact magic** are four genuinely different
resource shapes, plus half-caster slot progression.

## Attribution requirement

CC-BY-4.0 obliges attribution in the shipped product. Exact wording to be
captured from p1–2 when the licence text is transcribed into the app's about
screen.
