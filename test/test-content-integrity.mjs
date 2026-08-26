// The content set has to hang together.
//
// This is the gate every authoring batch passes through. The SRD is ~350
// spells, ~200 magic items and twelve classes to level 20; at that volume a
// dangling reference is not found by reading, and it is not found by the type
// checker either — every bug this file exists to catch typechecked cleanly and
// passed the whole suite before someone noticed a menu was empty in play.
//
// Two claims:
//   1. The content as it stands has no integrity errors.
//   2. The checks actually fire. A checker nobody has watched fail is a
//      checker that might be returning an empty array for the wrong reason,
//      so each one is shown a broken content set and required to object.

import { checkContentIntegrity, loadContent } from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const content = loadContent()

const errorsIn = (c) => checkContentIntegrity(c).filter((p) => p.severity === 'error')
const warningsIn = (c) => checkContentIntegrity(c).filter((p) => p.severity === 'warning')

/** A shallow copy deep enough to break one thing without disturbing the rest. */
function fork() {
  return {
    ...content,
    species: new Map(content.species),
    classes: new Map(content.classes),
    feats: new Map(content.feats),
    items: new Map(content.items),
    spells: new Map(content.spells),
    conditions: new Map(content.conditions),
    skills: new Map(content.skills),
    ambient: [...(content.ambient ?? [])]
  }
}

const source = (o) => ({
  provenance: 'srd', contentVersion: 1, kind: 'feature',
  activation: { always: true }, modifiers: [], completeness: 'complete', ...o
})

/** Asserts a deliberately broken content set is objected to, and says how. */
function catches(name, mutate, expected) {
  const broken = fork()
  mutate(broken)
  const found = errorsIn(broken)
  const hit = found.some((p) => p.message.includes(expected))
  check(`catches: ${name}`, hit,
    found.length === 0 ? 'no error raised at all' : found.map((p) => p.message).join(' | '))
}

// ---------------------------------------------------------------------------
// The real content
// ---------------------------------------------------------------------------

{
  const errors = errorsIn(content)
  check('live content: no integrity errors',
    errors.length === 0,
    errors.map((p) => `${p.where}: ${p.message}`).join('\n    '))

  // Warnings are debt, and are expected to be non-zero while the SRD is being
  // authored — but they are supposed to be *known* debt, of kinds somebody has
  // decided are acceptable. Counted by kind rather than by total, so adding a
  // class does not fail this and adding a new *kind* of problem does.
  const warnings = warningsIn(content)
  const subclassDebt = warnings.filter((p) => p.message.includes('subclasses are not implemented'))
  const sharedResources = warnings.filter((p) => p.message.includes('never be active at once'))

  const withSubclassSlots = [...content.classes.values()]
    .reduce((n, c) => n + (c.subclassSlot?.options.length ?? 0), 0)
  check.eq('live content: subclass debt is exactly the declared subclass options',
    subclassDebt.length, withSubclassSlots)

  check.eq('live content: one deliberate shared-resource pair (the bard\'s)',
    sharedResources.length, 1)

  check.eq('live content: and no warnings of any other kind',
    warnings.length - subclassDebt.length - sharedResources.length, 0)
}

// ---------------------------------------------------------------------------
// Each check, shown something broken, must object
// ---------------------------------------------------------------------------

catches('a definition filed under the wrong key',
  (c) => { c.spells.set('srd:spell.not-its-id', content.spells.get('srd:spell.fire-bolt')) },
  'its own id is')

catches('a spell granted but never defined',
  (c) => {
    c.species.set('test:species.x', {
      id: 'test:species.x', name: 'Testfolk', provenance: 'srd', contentVersion: 1,
      size: 'medium', baseWalkSpeed: 30,
      effects: source({
        id: 'test:species.x', name: 'Testfolk',
        spells: [{ spellIds: ['srd:spell.nonexistent'], availability: 'always', ability: 'int' }]
      })
    })
  },
  'which no content defines')

catches('a grant drawing from a spell list no spell is on',
  (c) => {
    c.species.set('test:species.y', {
      id: 'test:species.y', name: 'Listfolk', provenance: 'srd', contentVersion: 1,
      size: 'medium', baseWalkSpeed: 30,
      effects: source({
        id: 'test:species.y', name: 'Listfolk',
        spells: [{
          fromList: { listId: 'srd:list.nobody', maxLevel: 1 },
          availability: 'prepared', ability: 'int'
        }]
      })
    })
  },
  'which no spell is on')

// The druid's dead cantrips, exactly: a spell choice with nothing behind it.
catches('a spell selection with no pool to choose from',
  (c) => {
    c.species.set('test:species.z', {
      id: 'test:species.z', name: 'Choosefolk', provenance: 'srd', contentVersion: 1,
      size: 'medium', baseWalkSpeed: 30,
      effects: source({
        id: 'test:species.z', name: 'Choosefolk',
        selections: [{ id: 'pick', prompt: 'Choose a cantrip', kind: 'spellList', count: 2 }]
      })
    })
  },
  'names no pool')

catches('a selection asking for more than its pool holds',
  (c) => {
    c.species.set('test:species.w', {
      id: 'test:species.w', name: 'Greedyfolk', provenance: 'srd', contentVersion: 1,
      size: 'medium', baseWalkSpeed: 30,
      effects: source({
        id: 'test:species.w', name: 'Greedyfolk',
        selections: [{
          id: 'pick', prompt: 'Choose two', kind: 'spellList', count: 2,
          from: ['srd:spell.fire-bolt']
        }]
      })
    })
  },
  'from a pool of 1')

// The Wood Elf bug: the same race defined twice, once standalone and once as
// somebody else's subspecies.
catches('a race that is also another race\'s subspecies',
  (c) => {
    c.species.set('test:species.wood-elf', {
      id: 'test:species.wood-elf', name: 'Wood Elf', provenance: 'srd', contentVersion: 1,
      size: 'medium', baseWalkSpeed: 35,
      effects: source({ id: 'test:species.wood-elf', name: 'Wood Elf' })
    })
  },
  'the same race defined twice')

catches('proficiency with a weapon nobody defined',
  (c) => {
    c.species.set('test:species.armed', {
      id: 'test:species.armed', name: 'Armedfolk', provenance: 'srd', contentVersion: 1,
      size: 'medium', baseWalkSpeed: 30,
      effects: source({
        id: 'test:species.armed', name: 'Armedfolk',
        proficiencies: [{
          id: 'p1', category: { kind: 'weapon', itemId: 'srd:weapon.imaginary' },
          level: 'proficient', rounding: 'floor', grantsProficiency: true
        }]
      })
    })
  },
  'which no content defines')

catches('a level table keyed to a class that does not exist',
  (c) => {
    c.species.set('test:species.tabled', {
      id: 'test:species.tabled', name: 'Tablefolk', provenance: 'srd', contentVersion: 1,
      size: 'medium', baseWalkSpeed: 30,
      effects: source({
        id: 'test:species.tabled', name: 'Tablefolk',
        modifiers: [{
          id: 'm1', channel: 'value', target: 'hitPoints.max', op: 'add',
          value: { classLevelTable: { classId: 'srd:class.imaginary', values: [1, 2] } },
          permanence: 'persistent'
        }]
      })
    })
  },
  'which no content defines')

catches('an empty level table',
  (c) => {
    c.species.set('test:species.empty', {
      id: 'test:species.empty', name: 'Emptyfolk', provenance: 'srd', contentVersion: 1,
      size: 'medium', baseWalkSpeed: 30,
      effects: source({
        id: 'test:species.empty', name: 'Emptyfolk',
        modifiers: [{
          id: 'm1', channel: 'value', target: 'hitPoints.max', op: 'add',
          value: { characterLevelTable: [] }, permanence: 'persistent'
        }]
      })
    })
  },
  'no entries')

catches('a resource whose maximum reads an undeclared stat path',
  (c) => {
    c.species.set('test:species.res', {
      id: 'test:species.res', name: 'Resourcefolk', provenance: 'srd', contentVersion: 1,
      size: 'medium', baseWalkSpeed: 30,
      effects: source({
        id: 'test:species.res', name: 'Resourcefolk',
        resources: [{
          id: 'test.pool', name: 'Pool', max: 'resource.nobody.max',
          refresh: { kind: 'longRest' }
        }]
      })
    })
  },
  'undeclared stat path')

catches('two unconditional sources fighting over one resource',
  (c) => {
    for (const n of ['a', 'b']) {
      c.species.set(`test:species.dup-${n}`, {
        id: `test:species.dup-${n}`, name: `Dupfolk ${n}`, provenance: 'srd', contentVersion: 1,
        size: 'medium', baseWalkSpeed: 30,
        effects: source({
          id: `test:species.dup-${n}`, name: `Dupfolk ${n}`,
          resources: [{
            id: 'test.shared', name: 'Shared', max: 3, refresh: { kind: 'longRest' }
          }]
        })
      })
    }
  },
  'is also declared by')

catches('a class feature granted at a level nobody reaches',
  (c) => {
    const fighter = content.classes.get('srd:class.fighter')
    c.classes.set('srd:class.fighter', {
      ...fighter,
      features: [...fighter.features, {
        id: 'test:feature.late', name: 'Too Late', provenance: 'srd', contentVersion: 1,
        grantedAtLevel: 21,
        effects: source({ id: 'test:feature.late', name: 'Too Late' })
      }]
    })
  },
  'granted at level 21')

catches('a spell grant that grants nothing at all',
  (c) => {
    c.species.set('test:species.void', {
      id: 'test:species.void', name: 'Voidfolk', provenance: 'srd', contentVersion: 1,
      size: 'medium', baseWalkSpeed: 30,
      effects: source({
        id: 'test:species.void', name: 'Voidfolk',
        spells: [{ availability: 'always', ability: 'int' }]
      })
    })
  },
  'names no spells, list or selection')

// ---------------------------------------------------------------------------
// And must not object to content that is merely unusual
// ---------------------------------------------------------------------------

{
  // The bard's pattern: one resource, two sources, opposite activation gates.
  // A warning, never an error — the alternative is content contorting itself
  // to satisfy a checker that cannot read a predicate.
  const paired = fork()
  for (const [n, gate] of [['on', { classLevelAtLeast: ['srd:class.fighter', 5] }],
    ['off', { not: { classLevelAtLeast: ['srd:class.fighter', 5] } }]]) {
    paired.species.set(`test:species.pair-${n}`, {
      id: `test:species.pair-${n}`, name: `Pairfolk ${n}`, provenance: 'srd', contentVersion: 1,
      size: 'medium', baseWalkSpeed: 30,
      effects: source({
        id: `test:species.pair-${n}`, name: `Pairfolk ${n}`, activation: gate,
        resources: [{ id: 'test.paired', name: 'Paired', max: 2, refresh: { kind: 'longRest' } }]
      })
    })
  }
  check('allows: one resource shared by two gated sources is a warning, not an error',
    errorsIn(paired).length === 0,
    errorsIn(paired).map((p) => p.message).join(' | '))

  // A subspecies list of one is a menu of one, which is what most SRD races are.
  check('allows: the live content\'s single-option subspecies lists', errorsIn(content).length === 0)
}

check.report()
