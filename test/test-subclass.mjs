// Subclasses.
//
// Before this, `subclassSlot` was declared on nine classes, `subclassId` was a
// field on the character, and nothing anywhere read either. Nine classes
// offered a choice that resolved to nothing, and a monk who picked Way of the
// Open Hand got precisely as many features as one who picked nothing.
//
// The claims:
//   1. A chosen subclass grants its features, on the level track its own
//      entries declare.
//   2. An unchosen one is visible as an owed decision rather than silently
//      absent — the failure mode that made this gap survive so long.
//   3. A subclass belonging to another class grants nothing at all.

import { checkContentIntegrity, loadContent, playerViewOf } from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()

const OPEN_HAND = 'srd:subclass.open-hand'

function monk(level, subclassId) {
  return {
    id: 'c:monk', campaignId: 'camp-1', name: 'Shen', playerId: 'p',
    speciesId: 'srd:species.human',
    classLevels: [{
      classId: 'srd:class.monk', level, ...(subclassId ? { subclassId } : {})
    }],
    abilityScoreBase: { str: 12, dex: 16, con: 14, int: 10, wis: 16, cha: 8 },
    buildChoices: [], hitPointsCurrent: 50, hitPointsTemp: 0,
    hitDiceSpent: {}, resourcesSpent: {}, conditions: [], effectInstances: [],
    exhaustionLevel: 0,
    inventory: { instances: [], equipped: {}, attunedInstanceIds: [] },
    deathSaves: { successes: 0, failures: 0 }, toggles: {}, spellsPrepared: []
  }
}

const featuresAt = (level, subclassId) =>
  playerViewOf(monk(level, subclassId), content, { detail: 'inspect' })
    .effects.map((e) => e.label)

const has = (level, subclassId, name) => featuresAt(level, subclassId).includes(name)

// ---------------------------------------------------------------------------
// A chosen subclass grants its features, on its own level track
// ---------------------------------------------------------------------------

{
  check('chosen: Open Hand Technique at 3rd', has(3, OPEN_HAND, 'Open Hand Technique'))
  check('chosen: Wholeness of Body at 6th, not 5th',
    has(6, OPEN_HAND, 'Wholeness of Body') && !has(5, OPEN_HAND, 'Wholeness of Body'))
  check('chosen: Tranquility at 11th', has(11, OPEN_HAND, 'Tranquility'))
  check('chosen: Quivering Palm at 17th, not 16th',
    has(17, OPEN_HAND, 'Quivering Palm') && !has(16, OPEN_HAND, 'Quivering Palm'))

  // A subclass resource is an ordinary resource — nothing about it is special
  // for having come from a subclass rather than the class itself.
  const view = playerViewOf(monk(6, OPEN_HAND), content, { detail: 'inspect' })
  const wholeness = view.resources.find((r) => r.id === 'monk.wholeness-of-body')
  check.eq('chosen: its resource resolves like any other', wholeness?.maximum, 1)
  check.eq('chosen: and refreshes on a long rest', wholeness?.refresh.kind, 'longRest')

  // And its actions reach the action list the same way.
  const quivering = playerViewOf(monk(17, OPEN_HAND), content, { detail: 'inspect' })
    .actions.find((a) => a.id === 'monk.quivering-palm')
  check.eq('chosen: a subclass action costs what it says', quivering?.costs[0]?.amount, 3)
}

// ---------------------------------------------------------------------------
// An unchosen subclass is an owed decision, not a silent absence
// ---------------------------------------------------------------------------

{
  const pendingLabel = 'Monk: subclass not chosen'

  check('unchosen: nothing said before the level the choice is offered',
    !has(2, undefined, pendingLabel))
  check('unchosen: from that level, the sheet says a decision is owed',
    has(3, undefined, pendingLabel))
  check('unchosen: and still says so later', has(11, undefined, pendingLabel))

  // The point of the prompt: without it, a level-17 monk missing four features
  // looks exactly like a level-17 monk who has them all.
  check('unchosen: and none of the subclass features are granted',
    !has(17, undefined, 'Open Hand Technique')
      && !has(17, undefined, 'Quivering Palm'))

  // Choosing silences it.
  check('unchosen: choosing one clears the prompt', !has(3, OPEN_HAND, pendingLabel))
}

// ---------------------------------------------------------------------------
// A subclass from the wrong class grants nothing
// ---------------------------------------------------------------------------

{
  // Nothing in the type system stops a stored row naming a barbarian's path on
  // a monk — the check has to live where the grant happens.
  const wrong = featuresAt(17, 'srd:subclass.berserker')
  check('mismatched: grants no features',
    !wrong.includes('Open Hand Technique') && !wrong.includes('Wholeness of Body'),
    JSON.stringify(wrong.filter((n) => /Open Hand|Wholeness/.test(n))))

  // And it must not silence the prompt. A stored id that looks answered but
  // grants nothing is the worst of both: no features and no explanation.
  check('mismatched: still reports the choice as owed',
    wrong.includes('Monk: subclass not chosen'), JSON.stringify(wrong))

  // An id nothing defines at all lands in the same place.
  const unknown = featuresAt(17, 'srd:subclass.does-not-exist')
  check('mismatched: so does an id nobody defines',
    unknown.includes('Monk: subclass not chosen'))
  check('mismatched: and it does not crash the resolver',
    Array.isArray(unknown) && unknown.length > 0)
}

// ---------------------------------------------------------------------------
// The integrity checker knows about subclasses now
// ---------------------------------------------------------------------------

{
  const problems = checkContentIntegrity(content)
  const errors = problems.filter((p) => p.severity === 'error')
  check('integrity: the real content set has no subclass errors',
    errors.length === 0, errors.map((p) => `${p.where}: ${p.message}`).join(' | '))

  // Unauthored subclasses are debt, counted rather than hidden: this number is
  // every class still waiting for one, and is expected to fall to zero.
  const unauthored = problems.filter((p) => p.message.includes('not authored yet'))
  const offered = [...content.classes.values()]
    .flatMap((c) => c.subclassSlot?.options ?? [])
  const missing = offered.filter((o) => !content.subclasses.has(o))
  check.eq('integrity: unauthored subclasses are counted, not hidden',
    unauthored.length, missing.length)

  // And the one that IS authored is not among them.
  check('integrity: Way of the Open Hand is not counted as debt',
    !unauthored.some((p) => p.message.includes(OPEN_HAND)))
}

// ---------------------------------------------------------------------------
// The checks fire on deliberately broken content
// ---------------------------------------------------------------------------

function fork() {
  return {
    ...content,
    classes: new Map(content.classes),
    subclasses: new Map(content.subclasses)
  }
}

const catches = (name, mutate, expected) => {
  const broken = fork()
  mutate(broken)
  const found = checkContentIntegrity(broken).filter((p) => p.severity === 'error')
  check(`catches: ${name}`, found.some((p) => p.message.includes(expected)),
    found.length === 0 ? 'no error raised' : found.map((p) => p.message).join(' | '))
}

catches('a subclass whose class does not exist',
  (c) => {
    c.subclasses.set('test:subclass.orphan', {
      id: 'test:subclass.orphan', name: 'Orphan', provenance: 'srd', contentVersion: 1,
      classId: 'srd:class.imaginary',
      features: [{
        id: 'test:subclass.orphan.f', name: 'F', provenance: 'srd', contentVersion: 1,
        grantedAtLevel: 3,
        effects: {
          id: 'test:subclass.orphan.f', name: 'F', provenance: 'srd', contentVersion: 1,
          kind: 'feature', activation: { always: true }, modifiers: [], completeness: 'complete'
        }
      }]
    })
  },
  'which no content defines')

catches('a subclass its own class never offers',
  (c) => {
    c.subclasses.set('test:subclass.unreachable', {
      id: 'test:subclass.unreachable', name: 'Unreachable', provenance: 'srd', contentVersion: 1,
      classId: 'srd:class.monk',
      features: [{
        id: 'test:subclass.unreachable.f', name: 'F', provenance: 'srd', contentVersion: 1,
        grantedAtLevel: 3,
        effects: {
          id: 'test:subclass.unreachable.f', name: 'F', provenance: 'srd', contentVersion: 1,
          kind: 'feature', activation: { always: true }, modifiers: [], completeness: 'complete'
        }
      }]
    })
  },
  'nothing can choose it')

catches('a subclass granting a feature before the choice is made',
  (c) => {
    const monkClass = content.classes.get('srd:class.monk')
    c.subclasses.set(OPEN_HAND, {
      ...content.subclasses.get(OPEN_HAND),
      features: [{
        id: 'test:early', name: 'Too Early', provenance: 'srd', contentVersion: 1,
        grantedAtLevel: 1, // monk offers the choice at 3
        effects: {
          id: 'test:early', name: 'Too Early', provenance: 'srd', contentVersion: 1,
          kind: 'feature', activation: { always: true }, modifiers: [], completeness: 'complete'
        }
      }]
    })
    void monkClass
  },
  'before srd:class.monk offers the choice')

catches('a class offering a subclass that belongs to another class',
  (c) => {
    const monkClass = content.classes.get('srd:class.monk')
    c.classes.set('srd:class.rogue', {
      ...content.classes.get('srd:class.rogue'),
      subclassSlot: { grantedAtLevel: 3, options: [OPEN_HAND] }
    })
    void monkClass
  },
  'belongs to srd:class.monk')

check.report()
