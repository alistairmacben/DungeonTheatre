# Conditions

**Source supplied:** `conditions.pdf` — a 7-page print of
`https://www.dndbeyond.com/sources/dnd/basic-rules-2014/appendix-a-conditions`,
"Appendix A: Conditions".

**Two things to record about the source before the content.**

**(1) The source is labelled 2014 Basic Rules, not SRD 5.2.1.** The URL, the
page title and the exhaustion table are all the **2014 / SRD 5.1** text. This is
*consistent* with the rest of the corpus, which is SRD 5.1 — so it is the right
content for this project — but the 5.2 exhaustion rule is a completely
different mechanic (a cumulative −2 to all d20 tests and −5 ft speed per level,
rather than six discrete threshold effects). Flagging it because if you later
swap to genuine 5.2 content, **exhaustion changes shape**, not just values, and
the `Exhaustion` model below would have to be replaced rather than adjusted.

**(2) The print lost content at every page break.** The PDF is a browser
print-to-PDF with the text converted to vector outlines; each page is clipped
rather than reflowed, so text that straddled a break is gone. I have extracted
everything that survived and marked precisely what did not. **Per your
instruction I have not filled any of it in from memory.**

---

## General rules (complete)

- Conditions alter a creature's capabilities and can arise from a spell, a class
  feature, a monster's attack, or other effect. **Most are impairments; a few,
  such as invisible, can be advantageous.**
- A condition lasts either **until it is countered** (prone is countered by
  standing up) **or for a duration specified by the effect that imposed it**.
- **[IMPORTANT] "If multiple effects impose the same condition on a creature,
  each instance of the condition has its own duration, but the condition's
  effects don't get worse. A creature either has a condition or doesn't."**

That last rule is the single most architecturally significant sentence in the
appendix. It means a condition is a **set of independently-expiring instances
collapsing to one binary state** — not a stacking counter, and not a single
instance that later applications overwrite.

---

## Conditions captured in full

### Blinded
- A blinded creature can't see and **automatically fails any ability check that
  requires sight**.
- **Attack rolls against the creature have advantage, and the creature's attack
  rolls have disadvantage.**

### Deafened
- A deafened creature can't hear and **automatically fails any ability check
  that requires hearing**.

### Exhaustion
Measured in **six levels**. An effect can give one or more levels, as specified
in that effect's description.

| Level | Effect |
|---|---|
| 1 | Disadvantage on ability checks |
| 2 | Speed halved |
| 3 | Disadvantage on attack rolls and saving throws |
| 4 | Hit point maximum halved |
| 5 | Speed reduced to 0 |
| 6 | Death |

- **Effects are cumulative** — a creature suffering level 2 has both the level 1
  and level 2 effects.
- If an already exhausted creature suffers another effect that causes
  exhaustion, **its current level increases by the amount specified in that
  effect's description**.
- An effect that removes exhaustion **reduces its level as specified in that
  effect's description**, with **all exhaustion effects ending if the level is
  reduced below 1**.
- **Finishing a long rest reduces exhaustion by 1, provided the creature has
  also ingested some food and drink.**
- **Being raised from the dead reduces exhaustion by 1.**

### Frightened
- Disadvantage on **ability checks and attack rolls** while the **source of its
  fear is within line of sight**.
- The creature **can't willingly move closer** to the source of its fear.

### Grappled
- Speed becomes **0**, and it **can't benefit from any bonus to its speed**.
- The condition **ends if the grappler is incapacitated**.
- The condition **also ends if an effect removes the grappled creature from the
  reach of the grappler or grappling effect** (e.g. being hurled away by
  *thunderwave*).

### Incapacitated
- An incapacitated creature **can't take actions or reactions**.

### Paralyzed
- **Incapacitated**, and **can't move or speak**.
- **Automatically fails Strength and Dexterity saving throws.** Attack rolls
  against the creature have **advantage**.
- **Any attack that hits is a critical hit if the attacker is within 5 feet.**

### Petrified
- Transformed, along with any **nonmagical** object it is wearing or carrying,
  into a solid inanimate substance (usually stone). **Weight increases ×10**, and
  it **ceases aging**.
- **Incapacitated**, can't move or speak, and is **unaware of its
  surroundings**.
- Attack rolls against the creature have **advantage**.
- **Automatically fails Strength and Dexterity saving throws.**
- **Resistance to all damage.**
- **Immune to poison and disease**, although a poison or disease already in its
  system is **suspended, not neutralized**.

### Prone
*(The heading was lost to a page break; all three bullets survived, and they are
the complete rule.)*
- Its **only movement option is to crawl**, unless it **stands up and thereby
  ends the condition**.
- The creature has **disadvantage on attack rolls**.
- An attack roll against the creature has **advantage if the attacker is within
  5 feet**; **otherwise the attack roll has disadvantage**.

### Restrained
- Speed becomes **0**, and it **can't benefit from any bonus to its speed**.
- **Attack rolls against the creature have advantage, and the creature's attack
  rolls have disadvantage.**
- **Disadvantage on Dexterity saving throws.**

### Stunned
- **Incapacitated**, **can't move**, and can **speak only falteringly**.
- **Automatically fails Strength and Dexterity saving throws.**
- Attack rolls against the creature have **advantage**.

---

## [GAPS] Conditions the source does not fully define

**These are recorded as `INCOMPLETE` in the dataset and their missing clauses
are not invented.** The engine models what is present and marks the rest
`unmodelled`, surfacing the gap in the UI rather than silently guessing.

| Condition | What survived | What was lost |
|---|---|---|
| **Charmed** | Heading only | **Both bullets.** Nothing about the charmer, hostile actions, or social advantage is available. |
| **Invisible** | Heading lost. Tail of bullet 1: *"…heavily obscured. The creature's location can be detected by any noise it makes or any tracks it leaves."* Bullet 2 complete: *"Attack rolls against the creature have disadvantage, and the creature's attack rolls have advantage."* | **The opening clause of bullet 1** — the part that establishes what makes the creature impossible to see and under what circumstances. |
| **Poisoned** | Heading only | **Its single bullet.** |
| **Unconscious** | *"An unconscious creature is incapacitated, can't move or speak, and is unaware of its surroundings."* and *"The creature drops whatever it's holding and falls prone."* | **The remaining bullets**, including anything about saving throws, attack rolls against it, and attacks from within 5 feet. |

**Impact on the engine.** Charmed, Poisoned and Unconscious are referenced
heavily across the corpus already read:

- *Charmed* — Fey Ancestry, Gnome Cunning, *charm person*, *dominate person /
  beast / monster*, *hypnotic pattern*, *modify memory*, *geas*, *mass
  suggestion*, *rod of rulership*, *ring of mind shielding*, sentient items,
  *calm emotions*, *greater restoration*, *protection from evil and good*.
- *Poisoned* — every injury/ingested/inhaled/contact poison, *contagion*,
  *ray of sickness*-style effects, *periapt of proof against poison*,
  *lesser restoration*, *protection from poison*, *heroes' feast*.
- *Unconscious* — the entire death-and-dying flow, *sleep*, *eyebite*,
  *oil of taggit*, *essence of ether*, knocking a creature out.

Each of these will resolve correctly for **everything that applies or removes
the condition**, and will correctly report **that the creature has it** — but
the condition's own mechanical consequences cannot be applied until the missing
text is supplied. That is a two-line fix in the dataset once you have it.

**To close the gap:** the missing clauses are in the same appendix; a print that
does not clip at page boundaries (or the SRD 5.1 PDF's own conditions appendix,
or the CC-BY SRD 5.2 document if you would rather move the whole project to 5.2)
would supply all four.

---

## Cross-references the appendix does not resolve

Recorded as flags rather than assumptions:

1. **"Automatically fails a saving throw"** — the appendix uses this for
   paralyzed, petrified and stunned (STR and DEX saves), and blinded/deafened use
   "automatically fails any ability check that requires sight/hearing". Whether
   an automatic failure is *before or after* effects that convert a failed save
   into a success (*ring of evasion*, *scarab of protection*, Indomitable) **is
   not stated anywhere in the corpus**. The engine models auto-fail as a
   `replace` on the outcome and leaves the interaction ordering as an explicit,
   documented, DM-overridable choice — **not as a silent rule**.
2. **"Can't benefit from any bonus to its speed"** (grappled, restrained) is a
   *suppression scoped to a stat*, distinct from setting speed to 0. Both appear
   in the same bullet, so both are needed: the `set 0` and the `suppress` of any
   `add` to speed. Whether a `base` speed provider (rather than a bonus) is also
   suppressed is not stated; the engine treats "bonus" as `add` and `multiply`
   only, and flags the ambiguity.
3. **Exhaustion level 4, "hit point maximum halved"**, and level 2/5 speed
   changes interact with other `multiply`/`set` sources on the same stats. The
   appendix does not state ordering. The engine applies the documented global
   ordering (§ resolution pipeline) and records the interaction in the breakdown
   so it is visible rather than hidden.
4. **Petrified "resistance to all damage"** plus an existing resistance to a
   specific type: the SRD's general rule already covers this — *"multiple
   instances of resistance to the same damage type count as only one"* — so no
   new rule is needed. Recorded for completeness.
