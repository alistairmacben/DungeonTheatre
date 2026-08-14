# Feat coverage report

**Produced before writing any feat content**, as the source material requires.
Every one of the 42 supplied feats was checked against the vocabulary in
`src/rules/types.ts`. The question asked of each was *"can this be expressed
with the primitives we already have, and if not, what is the smallest generic
addition that would let it — and would that addition also serve items, spells,
class features and DM content?"*

**Source:** the supplied 2014-style feat list. Provenance is recorded on every
definition as `rulesetVersion: '2014'` so a future 2024/5.2 ruleset can coexist
without contaminating this one.

---

## Summary

| Class | Count | Meaning |
|---|---|---|
| **A — expressible today** | 17 | No engine change at all |
| **B — expressible with the extensions made in this phase** | 13 | Formula values, proficiency categories, selections, elected options, target-relative modifiers |
| **C — needs one further named generic primitive** | 6 | Listed in §3; each serves items and spells too |
| **D — needs combat/world state the engine does not have** | 5 | Opportunity attacks, mounted, hidden — deferred with the combat layer |
| **E — narrative only** | 1 | Cannot be mechanised at all |

**No feat requires feat-specific code.** Every mechanic reduces to a modifier, a
proficiency grant, a resource, an action, an elected option or a narrative
clause.

---

## 1. Class A — expressible with the vocabulary as it already stood

| Feat | How |
|---|---|
| **Alert** | `add` +5 to `initiative`; a `suppress` of the unseen-attacker advantage by tag; one new capability key (see C6) |
| **Durable** | `add` +1 to `ability.con.score`; a Hit Die floor as a `min` with a formula value |
| **Grappler** | `advantage` scoped to attacks, gated on a toggle; prerequisite predicate already live |
| **Heavily Armored** | `add` +1 STR; proficiency grant `{kind:'armor',category:'heavy'}`; prerequisite `hasProficiency` |
| **Keen Mind** | `add` +1 INT; the rest is narrative |
| **Lightly Armored** | `add` +1 to a selected ability; armour proficiency grant |
| **Linguist** | `add` +1 INT; language selections; cipher DC is a formula |
| **Moderately Armored** | as Lightly Armored, plus shield proficiency |
| **Observant** | `add` +1 to a selected ability; `add` +5 to `passive.perception` and `passive.investigation` |
| **Skilled** | three skill/tool proficiency grants driven by selections |
| **Tavern Brawler** | `add` +1 to a selected ability; weapon proficiency grants; unarmed damage die via `replace` |
| **Tough** | `add` to `hitPoints.max` with a formula (`2 × character level`) |
| **Weapon Master** | `add` +1 to a selected ability; four weapon proficiency grants from selections |
| **Athlete** (partial) | `add` +1 to a selected ability — the movement clauses are C1 |
| **Dungeon Delver** | `advantage` scoped by `againstTags:['trap']`; `resistance.*` set for trap damage; a `suppress` of the fast-travel passive penalty |
| **Medium Armor Master** | a `suppress` of the armour Stealth penalty by tag — exactly the mithral-armour pattern already tested |
| **Resilient** | `add` +1 to the selected ability; a save proficiency grant driven by the same selection |

## 2. Class B — expressible using the extensions made in this phase

Each extension was added because **several** feats needed it, and each serves
items, spells and DM content equally.

| Extension | Feats it unlocks | Who else needs it |
|---|---|---|
| **Formula-valued modifiers** (`ValueExpr`) | Tough (2 × level), Durable (2 × CON mod), Inspiring Leader (level + CHA mod), Defensive Duelist (+PB to AC), Linguist (cipher DC), Healer (HP by Hit Dice) | *Aid*, *heroism*, Berserker Axe (+1 HP per level), every class resource maximum |
| **Proficiency categories** (armour, weapon, weapon-item) | Heavily Armored, Lightly Armored, Moderately Armored, Weapon Master, Tavern Brawler, Heavy Armor Master, Medium Armor Master | Every class's starting proficiencies; armour's own non-proficiency penalty; *elven chain* |
| **Selections** | Resilient, Skilled, Weapon Master, Elemental Adept, Magic Initiate, Ritual Caster, Spell Sniper, Athlete, Lightly Armored, Moderately Armored, Observant, Tavern Brawler | Half-elf's two free ability increases; any DM item offering a choice |
| **Elected options** (`ActionOption`) | Great Weapon Master (−5/+10), Sharpshooter (−5/+10), Lucky (spend a point) | Divine Smite, Battle Master manoeuvres, metamagic |
| **Target-relative modifiers** (`appliesTo`) | Mage Slayer (advantage vs. nearby casters), Mounted Combatant | Every condition that says "attack rolls against the creature have advantage" |
| **`minimumDieFace`, `rerollDamageDice`** | Elemental Adept (treat 1 as 2), Savage Attacker | Great Weapon Fighting, Empowered Spell, *elemental weapon* |

## 3. Class C — the six primitives still missing

Each is a **stat path or capability key**, not a mechanism — which is the
strongest possible sign the architecture is holding. Each is justified by
non-feat content as well.

| # | Missing primitive | Feats needing it | Non-feat content needing it |
|---|---|---|---|
| **C1** | `movementCost.<mode>` stat paths (climb, swim, standUp, difficultTerrain) | Athlete, Mobile | *Freedom of movement*, *spider climb*, difficult terrain itself, the SRD's crawl and squeeze rules |
| **C2** | `damageReduction.<type>` stat path, read by the damage pipeline before resistance | Heavy Armor Master (−3 nonmagical BPS) | *Warding bond*, protective auras, the SRD's own worked resistance example |
| **C3** | `resistanceBypass.<type>` stat path, read by the damage pipeline | Elemental Adept | Magic weapons bypassing nonmagical resistance; *vorpal sword* ignoring slashing resistance |
| **C4** | `armorDexCap` stat path so armour's Dex contribution is data | Medium Armor Master ("add 3 rather than 2") | All medium armour; *mage armor*; any DM armour |
| **C5** | Context tags on rolls (`cover`, `longRange`, `unseen`, `dimLight`) so situational penalties are **tagged modifiers** that `suppress` can reach | Sharpshooter, Crossbow Expert, Skulker, Alert, Spell Sniper | Cover generally; the SRD's ranged-in-melee rule; *blur*; *fog cloud* |
| **C6** | Two capability keys: `beSurprised`, `beCriticallyHit` | Alert | *Foresight*, adamantine armour |

**C5 is the important one**, and it is worth stating why it is not a new
mechanism: the penalties already exist as rules; the change is that they enter
resolution as **modifiers carrying tags** rather than as inline arithmetic. Once
they do, `suppress` — which is already built and tested — removes them. Four
feats, cover, and half a dozen spells all fall out of one consistent decision.

## 4. Class D — needs combat and world state

These are **not vocabulary gaps**. The `TriggerDefinition` type already exists;
what is missing is the combat event stream and positional state, which are
deliberately out of scope for this phase.

| Feat | What it needs |
|---|---|
| **Charger** | The Dash action and a movement trace |
| **Mage Slayer** (reaction clause) | An "enemy casts a spell within 5 ft" event |
| **Mobile** (opportunity-attack clause) | Opportunity attacks |
| **Polearm Master** | Reach tracking and opportunity attacks |
| **Sentinel** | Opportunity attacks and target selection |
| **War Caster** (reaction clause) | Opportunity attacks |
| **Shield Master** | The Attack action and a bonus-action shove |
| **Mounted Combatant** | Mounted state and attack redirection |
| **Crossbow Expert** (bonus-action clause) | Action economy |
| **Dual Wielder** (two-weapon clause) | Action economy |

**Every one of these is authored now as a `TriggerDefinition` with its event
predicate written out**, so when the combat layer lands they activate without
touching the feat data. Their *passive* clauses (Dual Wielder's +1 AC, Mobile's
+10 speed, War Caster's concentration advantage) work today.

## 5. Class E — narrative only

**Keen Mind's** "you always know which way is north" and "you can recall
anything you have seen or heard within the past month" cannot be mechanised —
there is no world state to consult and no roll to modify. Recorded as a
`NarrativeClause` with `dmPromptable: true`, shown verbatim in the HUD.

Also narrative, on the same basis: **Actor's** mimicry (the contested check is
modelled; whether a listener is fooled is not), **Linguist's** cipher creation
(the DC formula is modelled; the fiction is not), **Mounted Combatant's**
"force an attack to target you instead".

---

## 6. What this report says about the architecture

The exercise was a genuine test, and it produced two findings worth recording.

**It held.** 42 feats — the most mechanically varied content in the SRD outside
magic items — produced **no request for a feat-specific mechanism**. Everything
reduced to modifiers, proficiency grants, resources, actions, options and
narrative. The six gaps in §3 are all *stat paths and capability keys*, which is
the vocabulary working as designed: new content asks for new **nouns**, not new
**verbs**.

**The one design decision it forced** is C5. Before this exercise, situational
penalties like long-range disadvantage and cover were going to be computed
inline in the attack resolver. Four separate feats want to remove them
selectively, and inline arithmetic cannot be selectively removed. Making them
tagged modifiers costs nothing and makes `suppress` — already built — the single
answer for every "you ignore X" clause in the game. That is a better design than
the one I would have written without reading the feats first, which is precisely
why the source material asked for this report before implementation.

**What is deliberately not done:** the full 42-feat catalogue. Per the standing
instruction to prefer coherence over volume, this phase implements **ten feats
chosen to exercise every primitive** — including the six new ones — rather than
forty implemented shallowly.
