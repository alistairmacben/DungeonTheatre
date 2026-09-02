// Levelling up, as a room you walk through rather than a list you fight.
//
// The engine has had `levelUp`, `answerBuildChoice` and `answerSelection` for
// a while, and the menu answered them inline: a stack of cards, each a wall of
// buttons, with every answer committed the instant it was clicked. That works
// and reads terribly — and worse, it is unforgiving. A misclicked subclass at
// level 3 was permanent.
//
// So this stages instead of committing. `applyCommand` is a pure function of
// (character, command, content), which means the whole level-up can be folded
// onto a local copy and rendered through the same `playerViewOf` the HUD uses.
// Nothing leaves this component until Accept: Back genuinely undoes, Cancel
// genuinely cancels, and the DM never sees a half-levelled character.
//
// Deliberately single-class. The data model has `classLevels[]`, but multiclass
// *rules* — prerequisites, spell-slot aggregation, reduced starting
// proficiencies — do not exist in `src/rules`, and inventing them in the UI is
// exactly the coupling this architecture exists to prevent.

import React, { useEffect, useMemo, useState } from 'react'
import {
  applyCommand, playerViewOf,
  type Ability, type Character, type ContentIndex, type PlayerCommand, type PlayerView
} from '@engine'
import { Inspect, InspectPanel } from './Inspect'
import { describeId, guessLabel } from './contentText'
import { abilityIcon, classIcon, subclassIcon } from './icons'

type PendingChoice = PlayerView['progression']['pendingChoices'][number]

/** A staged answer, tagged with the choice it settles so it can be taken back. */
interface Entry {
  /** Null for the `levelUp` itself, which is not an answer to anything. */
  choiceId: string | null
  command: PlayerCommand
  /** What to show on the rail and on a revisited step. */
  summary: string
}

const ABILITY_LABELS: Record<Ability, string> = {
  str: 'Strength', dex: 'Dexterity', con: 'Constitution',
  int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma'
}

export function LevelUpWizard({ character, content, classId, commit, onClose }: {
  character: Character
  content: ContentIndex
  classId: string
  /**
   * Applies the whole staged level-up as one change. Must be a batching
   * dispatch, not a loop over a single-command one — see `dispatchAll`.
   */
  commit(commands: PlayerCommand[]): Promise<string[] | undefined> | string[] | undefined
  onClose(): void
}): React.JSX.Element {
  const characterId = character.id

  const [entries, setEntries] = useState<Entry[]>(() => [{
    choiceId: null,
    command: { type: 'levelUp', characterId, classId },
    summary: 'Level gained'
  }])
  const [stepIndex, setStepIndex] = useState(0)
  const [catalog, setCatalog] = useState<PendingChoice[]>([])
  const [committing, setCommitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const before = useMemo(
    () => playerViewOf(character, content, { detail: 'inspect', revision: 0 }),
    [character, content]
  )

  // The whole staged level-up, folded onto a copy. A rejection here is a real
  // answer — the same one the server would give — so it is surfaced rather
  // than swallowed, and the fold stops at the last good state.
  const { staged, blocked } = useMemo(() => {
    let c = character
    for (const entry of entries) {
      const result = applyCommand(c, entry.command, content)
      if (result.rejected) return { staged: c, blocked: result.rejected.reasons }
      c = result.character
    }
    return { staged: c, blocked: null as string[] | null }
  }, [character, entries, content])

  const preview = useMemo(
    () => playerViewOf(staged, content, { detail: 'inspect', revision: entries.length }),
    [staged, content, entries.length]
  )

  const pending = preview.progression.pendingChoices

  // The rail has to be stable. Steps are discovered from the staged preview —
  // answering a subclass can reveal that subclass's own selections — but an
  // answered choice leaves `pending` immediately, so a rail rendered straight
  // from `pending` would delete the step you are standing on. This keeps every
  // choice ever seen, in the order it appeared, and marks them done instead.
  useEffect(() => {
    setCatalog((prev) => {
      const byId = new Map(prev.map((c) => [c.id, c]))
      let changed = false
      for (const c of pending) {
        if (!byId.has(c.id)) { byId.set(c.id, c); changed = true }
      }
      return changed ? [...byId.values()] : prev
    })
  }, [pending])

  const answeredOf = (choiceId: string): Entry | undefined =>
    entries.find((e) => e.choiceId === choiceId)

  const answer = (choiceId: string, command: PlayerCommand, summary: string): void => {
    setEntries((prev) => [...prev.filter((e) => e.choiceId !== choiceId), { choiceId, command, summary }])
  }

  const unanswer = (choiceId: string): void => {
    // Everything staged after this answer may depend on it — a subclass's own
    // cantrip pick cannot outlive the subclass. Dropping the tail is the only
    // honest undo.
    setEntries((prev) => {
      const at = prev.findIndex((e) => e.choiceId === choiceId)
      return at === -1 ? prev : prev.slice(0, at)
    })
  }

  const steps = ['summary', ...catalog.map((c) => c.id)]
  const clampedIndex = Math.min(stepIndex, steps.length - 1)
  const currentId = steps[clampedIndex]!
  const currentChoice = catalog.find((c) => c.id === currentId)
  const remaining = pending.length

  const apply = async (): Promise<void> => {
    setCommitting(true)
    setError(null)
    const rejected = await Promise.resolve(commit(entries.map((e) => e.command)))
    setCommitting(false)
    if (rejected && rejected.length > 0) {
      setError(rejected.join(' · '))
      return
    }
    onClose()
  }

  return (
    <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm">
      <div className="flex h-[88%] w-[92%] max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink/95 shadow-2xl">

        <header className="flex items-center gap-3 border-b border-white/10 px-6 py-4">
          {classIcon(classId) && (
            <img src={classIcon(classId)} alt="" className="h-11 w-11 rounded-full bg-ink-soft object-cover" />
          )}
          <div>
            <h2 className="font-display text-xl text-parchment">Level Up</h2>
            <p className="text-xs text-parchment/50">
              {character.name} · {classLabel(preview, classId)} {classLevel(preview, classId)}
            </p>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <Rail
            steps={catalog}
            currentId={currentId}
            onPick={(id) => setStepIndex(steps.indexOf(id))}
            isDone={(id) => !pending.some((c) => c.id === id)}
            answeredOf={answeredOf}
          />

          <div className="min-w-0 flex-1 overflow-y-auto px-6 py-5">
            {blocked && (
              <p className="mb-4 rounded-lg border border-ember/40 bg-ember/10 px-3 py-2 text-sm text-ember">
                {blocked.join(' · ')}
              </p>
            )}

            {currentId === 'summary' && <Summary before={before} after={preview} classId={classId} />}

            {currentChoice && (
              <ChoiceStep
                choice={currentChoice}
                content={content}
                answered={answeredOf(currentChoice.id)}
                onChange={() => unanswer(currentChoice.id)}
                onAnswer={(command, summary) => {
                  answer(currentChoice.id, command, summary)
                  // Move on rather than making the player find the next step.
                  setStepIndex((i) => Math.min(i + 1, steps.length))
                }}
                characterId={characterId}
              />
            )}
          </div>

          <CharacterPanel before={before} after={preview} />
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-white/10 px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-parchment/70 transition hover:border-white/30 hover:text-parchment"
          >
            Cancel
          </button>

          {error && <p className="min-w-0 flex-1 truncate text-[12px] text-ember">{error}</p>}

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={clampedIndex === 0}
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-parchment/70 transition hover:border-white/30 hover:text-parchment disabled:opacity-30"
            >
              Back
            </button>
            {clampedIndex < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setStepIndex((i) => Math.min(steps.length - 1, i + 1))}
                className="rounded-lg border border-arcane/50 bg-arcane/10 px-4 py-1.5 text-sm text-parchment transition hover:bg-arcane/20"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                disabled={remaining > 0 || committing || Boolean(blocked)}
                onClick={() => { void apply() }}
                className="rounded-lg border border-verdigris/50 bg-verdigris/10 px-4 py-1.5 text-sm text-parchment transition hover:bg-verdigris/20 disabled:opacity-40"
              >
                {committing
                  ? 'Applying…'
                  : remaining > 0
                    ? `${remaining} choice${remaining === 1 ? '' : 's'} left`
                    : 'Accept'}
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function classLabel(view: PlayerView, classId: string): string {
  return view.progression.classes.find((c) => c.classId === classId)?.label ?? 'Class'
}

function classLevel(view: PlayerView, classId: string): string {
  const level = view.progression.classes.find((c) => c.classId === classId)?.level
  return level ? `Lv ${level}` : ''
}

/** A short name for a step, since a prompt is a sentence and a rail is not. */
function stepLabel(choice: PendingChoice): string {
  if (choice.kind === 'abilityScoreImprovement') return 'Ability / Feat'
  if (choice.kind === 'subclass') return 'Subclass'
  return choice.prompt.replace(/^(choose|learn|pick)\s+/i, '').replace(/^a\s+/i, '')
}

function Rail({ steps, currentId, onPick, isDone, answeredOf }: {
  steps: PendingChoice[]
  currentId: string
  onPick(id: string): void
  isDone(id: string): boolean
  answeredOf(id: string): Entry | undefined
}): React.JSX.Element {
  const rows = [
    { id: 'summary', label: 'Level Up', done: true, value: undefined as string | undefined },
    ...steps.map((c) => ({
      id: c.id,
      label: stepLabel(c),
      done: isDone(c.id),
      value: answeredOf(c.id)?.summary
    }))
  ]

  return (
    <nav className="w-52 shrink-0 space-y-1 overflow-y-auto border-r border-white/10 px-3 py-4">
      {rows.map((row) => (
        <button
          key={row.id}
          type="button"
          onClick={() => onPick(row.id)}
          className={`w-full rounded-lg px-2.5 py-1.5 text-left transition ${
            row.id === currentId
              ? 'bg-arcane/10 text-parchment'
              : 'text-parchment/60 hover:bg-white/5 hover:text-parchment'
          }`}
        >
          <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest">
            {/* The unanswered marker is the whole point of the rail: BG3's
                exclamation is how you know you are not finished. */}
            <span className={row.done ? 'text-verdigris' : 'text-ember'}>{row.done ? '✓' : '!'}</span>
            <span className="truncate">{row.label}</span>
          </span>
          <span className="mt-0.5 block truncate text-[12px] text-parchment/45">
            {row.value ?? (row.done ? '' : 'unanswered')}
          </span>
        </button>
      ))}
    </nav>
  )
}

/**
 * What this level actually bought — the BG3 "Level Up!" card.
 *
 * Everything here is a diff of two real views, not a restatement of the rules:
 * whatever the engine decided the level was worth is what this shows.
 */
function Summary({ before, after, classId }: {
  before: PlayerView; after: PlayerView; classId: string
}): React.JSX.Element {
  const hpBefore = before.vitals.hitPoints.max.value
  const hpAfter = after.vitals.hitPoints.max.value
  const known = new Set(before.effects.map((e) => e.id))
  const gained = after.effects.filter((e) => !known.has(e.id))
  const subclassId = after.progression.classes.find((c) => c.classId === classId)?.subclassId

  return (
    <div className="mx-auto max-w-md space-y-4 text-center">
      <div>
        <p className="font-display text-2xl text-ember">
          {classLabel(after, classId)} {classLevel(after, classId)}
        </p>
        <p className="mt-1 text-[12px] text-parchment/45">
          Character level {before.progression.level} → {after.progression.level}
        </p>
      </div>

      {hpAfter !== hpBefore && (
        <Card title="Health Increased">
          <p className="text-lg tabular-nums text-parchment">
            {hpBefore} <span className="text-parchment/40">→</span> {hpAfter}
          </p>
        </Card>
      )}

      {subclassId && (
        <Card title="Specialisation">
          <div className="flex items-center justify-center gap-2">
            {subclassIcon(subclassId) && (
              <img src={subclassIcon(subclassId)} alt="" className="h-8 w-8 rounded-full object-cover" />
            )}
            <span className="text-sm text-parchment">{guessLabel(subclassId)}</span>
          </div>
        </Card>
      )}

      {gained.length > 0 && (
        <Card title="New Features">
          <ul className="space-y-1">
            {gained.map((f) => (
              <li key={f.id}>
                <Inspect
                  panel={(
                    <InspectPanel
                      title={f.label}
                      // `description` and `effects` are different fields and a
                      // feature can have either alone. Action Surge (2) grows a
                      // resource the level table already accounts for, so it has
                      // no mechanical lines at all — only the prose. Reading
                      // `effects` by itself showed the player an empty box.
                      lines={[...(f.description ? [f.description] : []), ...f.effects]}
                    />
                  )}
                >
                  <span className="cursor-help text-[13px] text-parchment/80 underline decoration-white/20 underline-offset-4">
                    {f.label}
                  </span>
                </Inspect>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {after.progression.pendingChoices.length > 0 && (
        <p className="text-[12px] text-parchment/45">
          Use the list on the left to make the choices this level opened up.
        </p>
      )}
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <p className="mb-1.5 text-[10px] uppercase tracking-widest text-parchment/40">{title}</p>
      {children}
    </div>
  )
}

/** The live sheet, so a choice can be judged against what it does to you. */
function CharacterPanel({ before, after }: { before: PlayerView; after: PlayerView }): React.JSX.Element {
  const beforeScore = new Map(before.abilities.map((a) => [a.ability, a.score.value]))

  return (
    <aside className="hidden w-56 shrink-0 overflow-y-auto border-l border-white/10 px-4 py-4 lg:block">
      <p className="text-[10px] uppercase tracking-widest text-parchment/40">Abilities</p>
      <ul className="mt-2 space-y-1.5">
        {after.abilities.map((a) => {
          const was = beforeScore.get(a.ability)
          const changed = was !== undefined && was !== a.score.value
          return (
            <li key={a.ability} className="flex items-center gap-2">
              {abilityIcon(a.ability) && (
                <img src={abilityIcon(a.ability)} alt="" className="h-4 w-4 opacity-80" />
              )}
              <span className="flex-1 text-[12px] text-parchment/60">{a.label}</span>
              <span className={`text-[13px] tabular-nums ${changed ? 'text-verdigris' : 'text-parchment/80'}`}>
                {a.score.value}
                {changed && <span className="ml-1 text-[10px]">(+{a.score.value - was})</span>}
              </span>
            </li>
          )
        })}
      </ul>

      <div className="mt-5 space-y-1.5 border-t border-white/10 pt-3">
        <Stat label="Hit Points" value={`${after.vitals.hitPoints.max.value}`} />
        <Stat label="Armour Class" value={after.vitals.armorClass.display} />
        <Stat label="Proficiency" value={after.progression.proficiencyBonus.display} />
      </div>
    </aside>
  )
}

function Stat({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-parchment/50">{label}</span>
      <span className="text-[13px] tabular-nums text-parchment/85">{value}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// One choice, as a whole screen rather than a card in a stack
// ---------------------------------------------------------------------------

function ChoiceStep({ choice, content, answered, onAnswer, onChange, characterId }: {
  choice: PendingChoice
  content: ContentIndex
  answered: Entry | undefined
  onAnswer(command: PlayerCommand, summary: string): void
  onChange(): void
  characterId: string
}): React.JSX.Element {
  if (answered) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm text-parchment">{choice.prompt}</h3>
        <div className="flex items-center gap-3 rounded-xl border border-verdigris/30 bg-verdigris/[0.06] px-4 py-3">
          <span className="text-verdigris">✓</span>
          <span className="flex-1 text-[13px] text-parchment">{answered.summary}</span>
          <button
            type="button"
            onClick={onChange}
            className="rounded-lg border border-white/15 px-3 py-1 text-xs text-parchment/70 transition hover:border-white/30 hover:text-parchment"
          >
            Change
          </button>
        </div>
        <p className="text-[12px] text-parchment/40">
          Changing this also clears anything chosen after it.
        </p>
      </div>
    )
  }

  if (choice.kind === 'abilityScoreImprovement') {
    return <AbilityOrFeatStep choice={choice} content={content} characterId={characterId} onAnswer={onAnswer} />
  }

  if (choice.kind === 'subclass') {
    return (
      <div className="space-y-3">
        <h3 className="text-sm text-parchment">{choice.prompt}</h3>
        <OptionGrid
          content={content}
          options={choice.options ?? []}
          iconOf={(id) => subclassIcon(id)}
          onPick={(opt) => onAnswer(
            { type: 'answerBuildChoice', characterId, atLevel: choice.atLevel!, kind: 'subclass', value: opt.id },
            opt.label
          )}
        />
      </div>
    )
  }

  return <SelectionStep choice={choice} content={content} characterId={characterId} onAnswer={onAnswer} />
}

/**
 * The SRD's two routes out of one slot: +2 spread across at most two abilities,
 * or a feat. The engine models both as the same `BuildChoice`, so this is a
 * presentation fork, not a rules one.
 */
function AbilityOrFeatStep({ choice, content, characterId, onAnswer }: {
  choice: PendingChoice
  content: ContentIndex
  characterId: string
  onAnswer(command: PlayerCommand, summary: string): void
}): React.JSX.Element {
  const [route, setRoute] = useState<'ability' | 'feat'>('ability')
  const [picked, setPicked] = useState<Ability[]>([])

  const toggle = (a: Ability): void => {
    setPicked((prev) => {
      if (prev.includes(a)) return prev.filter((x) => x !== a)
      if (prev.length >= 2) return prev
      return [...prev, a]
    })
  }

  const summary = picked.length === 1
    ? `+2 ${ABILITY_LABELS[picked[0]!]}`
    : picked.length === 2
      ? `+1 ${ABILITY_LABELS[picked[0]!]}, +1 ${ABILITY_LABELS[picked[1]!]}`
      : ''

  return (
    <div className="space-y-4">
      <h3 className="text-sm text-parchment">{choice.prompt}</h3>

      <div className="flex gap-1">
        {(['ability', 'feat'] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => { setRoute(r); setPicked([]) }}
            className={`rounded-lg border px-3 py-1.5 text-[12px] transition ${
              route === r
                ? 'border-arcane/60 bg-arcane/10 text-parchment'
                : 'border-white/10 text-parchment/50 hover:text-parchment/80'
            }`}
          >
            {r === 'ability' ? 'Raise ability scores' : 'Take a feat'}
          </button>
        ))}
      </div>

      {route === 'ability' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(Object.keys(ABILITY_LABELS) as Ability[]).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => toggle(a)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition ${
                  picked.includes(a)
                    ? 'border-arcane/60 bg-arcane/10 text-parchment'
                    : 'border-white/10 bg-white/[0.03] text-parchment/70 hover:border-white/25 hover:text-parchment'
                }`}
              >
                {abilityIcon(a) && <img src={abilityIcon(a)} alt="" className="h-6 w-6 opacity-90" />}
                <span className="text-sm">{ABILITY_LABELS[a]}</span>
                {picked.includes(a) && (
                  <span className="ml-auto text-[11px] text-arcane">
                    +{picked.length === 1 ? 2 : 1}
                  </span>
                )}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={picked.length === 0}
            onClick={() => onAnswer({
              type: 'answerBuildChoice', characterId, atLevel: choice.atLevel!,
              kind: 'abilityScoreImprovement',
              value: picked.length === 1
                ? { [picked[0]!]: 2 }
                : { [picked[0]!]: 1, [picked[1]!]: 1 }
            }, summary)}
            className="rounded-lg border border-arcane/50 bg-arcane/10 px-4 py-1.5 text-sm text-parchment transition hover:bg-arcane/20 disabled:opacity-40"
          >
            {summary || 'Pick one or two abilities'}
          </button>
        </div>
      )}

      {route === 'feat' && (
        <OptionGrid
          content={content}
          options={choice.options ?? []}
          onPick={(opt) => onAnswer(
            { type: 'answerBuildChoice', characterId, atLevel: choice.atLevel!, kind: 'feat', value: opt.id },
            opt.label
          )}
        />
      )}
    </div>
  )
}

/**
 * A feature's own "choose N from a list" — cantrips, skills, a spell list.
 * `choice.id` is `${sourceId}:${selectionId}`, the exact shape build.ts stamps
 * it with; splitting it back apart is cheaper than widening the view model
 * with two redundant fields.
 */
function SelectionStep({ choice, content, characterId, onAnswer }: {
  choice: PendingChoice
  content: ContentIndex
  characterId: string
  onAnswer(command: PlayerCommand, summary: string): void
}): React.JSX.Element {
  const [picked, setPicked] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const options = choice.from ?? []

  const send = (values: string[]): void => onAnswer({
    type: 'answerSelection',
    characterId,
    sourceId: choice.id.split(':').slice(0, -1).join(':'),
    selectionId: choice.id.split(':').at(-1)!,
    values
  }, values.map((v) => guessLabel(v)).join(', '))

  // Some selections enumerate nothing at all — "any language", "any artisan's
  // tool" — because the SRD genuinely leaves them open. There is no list to
  // render, so this takes the answer as text.
  if (options.length === 0) {
    const texts = Array.from({ length: choice.count }, (_, i) => picked[i] ?? '')
    const complete = texts.every((t) => t.trim().length > 0)
      && new Set(texts.map((t) => t.trim())).size === texts.length
    return (
      <div className="space-y-3">
        <h3 className="text-sm text-parchment">{choice.prompt}</h3>
        <div className="flex flex-wrap items-center gap-2">
          {texts.map((t, i) => (
            <input
              key={i}
              type="text"
              value={t}
              onChange={(e) => setPicked((prev) => {
                const next = [...prev]
                next[i] = e.target.value
                return next
              })}
              placeholder={choice.count > 1 ? `Choice ${i + 1}` : 'Your choice'}
              className="rounded-lg border border-white/15 bg-black/30 px-3 py-1.5 text-[13px] text-parchment placeholder:text-parchment/30 focus:border-arcane/50 focus:outline-none"
            />
          ))}
          <button
            type="button"
            disabled={!complete}
            onClick={() => send(texts.map((t) => t.trim()))}
            className="rounded-lg border border-arcane/50 bg-arcane/10 px-4 py-1.5 text-sm text-parchment transition hover:bg-arcane/20 disabled:opacity-40"
          >
            Confirm
          </button>
        </div>
      </div>
    )
  }

  const query = search.trim().toLowerCase()
  const matches = query
    ? options.filter((id) => guessLabel(id).toLowerCase().includes(query))
    : options
  const chosen = new Set(picked)
  const full = picked.length >= choice.count

  const toggle = (id: string): void => {
    setPicked((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= choice.count) return prev
      return [...prev, id]
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm text-parchment">{choice.prompt}</h3>
        <span className={`text-[12px] tabular-nums ${full ? 'text-verdigris' : 'text-ember'}`}>
          {picked.length}/{choice.count}
        </span>
      </div>

      {options.length > 8 && (
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${options.length} options…`}
          className="w-full max-w-xs rounded-lg border border-white/15 bg-black/30 px-3 py-1.5 text-[13px] text-parchment placeholder:text-parchment/30 focus:border-arcane/50 focus:outline-none"
        />
      )}

      <OptionGrid
        content={content}
        options={matches.map((id) => ({ id, label: guessLabel(id) }))}
        selected={chosen}
        // A full list still shows everything, but the ones that can no longer
        // be taken say so by looking spent rather than by vanishing.
        disabled={(id) => full && !chosen.has(id)}
        onPick={(opt) => toggle(opt.id)}
      />

      <button
        type="button"
        disabled={!full}
        onClick={() => send(picked)}
        className="rounded-lg border border-arcane/50 bg-arcane/10 px-4 py-1.5 text-sm text-parchment transition hover:bg-arcane/20 disabled:opacity-40"
      >
        Confirm
      </button>
    </div>
  )
}

/** Every list of things you can pick, with the explanation one hover away. */
function OptionGrid({ content, options, selected, disabled, iconOf, onPick }: {
  content: ContentIndex
  options: { id: string; label: string }[]
  selected?: Set<string>
  disabled?(id: string): boolean
  iconOf?(id: string): string | undefined
  onPick(option: { id: string; label: string }): void
}): React.JSX.Element {
  if (options.length === 0) {
    return <p className="text-[13px] text-parchment/45">Nothing to choose here.</p>
  }
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {options.map((opt) => {
        const icon = iconOf?.(opt.id)
        const isSelected = selected?.has(opt.id) ?? false
        const isDisabled = disabled?.(opt.id) ?? false
        return (
          <Inspect key={opt.id} panel={<InspectPanel {...describeId(content, opt.id)} />}>
            <button
              type="button"
              disabled={isDisabled}
              onClick={() => onPick(opt)}
              className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${
                isSelected
                  ? 'border-arcane/60 bg-arcane/10 text-parchment'
                  : isDisabled
                    ? 'cursor-not-allowed border-white/5 text-parchment/25'
                    : 'border-white/10 bg-white/[0.03] text-parchment/75 hover:border-white/25 hover:text-parchment'
              }`}
            >
              {icon && <img src={icon} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />}
              <span className="min-w-0 flex-1 truncate text-[13px]">{opt.label}</span>
              {isSelected && <span className="text-[11px] text-arcane">✓</span>}
            </button>
          </Inspect>
        )
      })}
    </div>
  )
}
