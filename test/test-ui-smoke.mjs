// Thin smoke tests over the player UI and the stage.
//
// This layer has no automated coverage anywhere else in the project — every
// other test operates on the engine, never on a React file. Every real bug
// found this session lived here: 210 uses of two colours nobody declared in
// `@theme` (an invisible HP bar, a collapsed text hierarchy), and two roll-
// carrying rows (`ActionRow`, `SpellRow`) whose click handlers quietly
// ignored the roll entirely and dispatched a bare command instead.
//
// None of that needed a rendered DOM to catch — a rendered-component test
// harness (Vitest + Testing Library + jsdom) isn't installed anywhere in this
// project, and pulling one in is a real tooling decision, not a "thin smoke
// test". Both bugs are provable from source text alone, so that is what this
// does: parse `@theme`'s declared colours against every colour class actually
// referenced, and parse `GameMenu.tsx`'s own components for the exact shape
// of "reads a RollSpec but never calls onRoll" that shipped twice.
//
// A third check closes a symmetric gap: every command the reducer will
// actually run (src/view/commands.ts) has at least one real dispatch site
// somewhere in the player UI. levelUp/answerBuildChoice/answerSelection
// would have failed this the moment they existed with no button wired to
// them — exactly the state Phase J was in for one commit before the UI part
// landed.

import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const rel = (p) => relative(root, p).replace(/\\/g, '/')

function walk(dir, exts, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue
    const p = join(dir, entry.name)
    if (entry.isDirectory()) walk(p, exts, out)
    else if (exts.some((e) => entry.name.endsWith(e))) out.push(p)
  }
  return out
}

// The player's own bootstrap error page — raw inline `style="..."` HTML
// strings with real CSS property names ("border-radius") that coincidentally
// match the Tailwind-class shape this file looks for. Not Tailwind UI.
const uiFiles = [join(root, 'player/src'), join(root, 'src/stage-ui')]
  .flatMap((d) => walk(d, ['.ts', '.tsx']))
  .filter((f) => !f.endsWith('main.tsx'))

// ---------------------------------------------------------------------------
// 1. Every custom colour a className references is declared in @theme
//
// Tailwind v4 generates a utility only for a colour under `--color-*` in
// `@theme`; anything else emits no CSS at all, silently. This is exactly the
// shape of the parchment/verdigris bug, generalised.
// ---------------------------------------------------------------------------

{
  const css = readFileSync(join(root, 'player/src/styles.css'), 'utf8')
  const declared = new Set([...css.matchAll(/--color-([a-z0-9-]+):/g)].map((m) => m[1]))
  check(`@theme declares a plausible number of colours (${declared.size})`, declared.size >= 5)

  // Tailwind's own always-available keywords and structural suffixes that
  // share the "<prefix>-<word>" shape a custom colour reference has, and
  // would otherwise misread as an undeclared one.
  const BUILTIN = new Set([
    'white', 'black', 'transparent', 'current', 'inherit',
    'base', 'center', 'left', 'right', 'top', 'bottom',
    'sm', 'md', 'lg', 'xl', 'xs', 'none', 'b', 't', 'l', 'r', 'x', 'y',
    'gradient', 'inset', 'offset', 'clip', 'text', 'border', 'collapse', 'separate',
    // Border *styles*, which share the `border-<word>` shape a colour has.
    // `border-dashed` is core Tailwind and emits real CSS; reading it as an
    // undeclared colour is this check crying wolf at a working class.
    'solid', 'dashed', 'dotted', 'double', 'hidden', 'groove', 'ridge'
  ])
  const PREFIXES = ['text', 'bg', 'border', 'ring', 'from', 'to', 'via', 'fill',
    'stroke', 'outline', 'accent', 'caret', 'decoration', 'divide', 'shadow']
  const colorPattern = new RegExp(`\\b(?:${PREFIXES.join('|')})-([a-zA-Z][a-zA-Z0-9-]*)`, 'g')

  /** Every `className={...}` or `className="..."` span, brace-balanced. */
  function classNameChunks(src) {
    const out = []
    const re = /className\s*=\s*/g
    let m
    while ((m = re.exec(src))) {
      const start = m.index + m[0].length
      const open = src[start]
      if (open === '"' || open === "'") {
        const end = src.indexOf(open, start + 1)
        if (end !== -1) out.push(src.slice(start + 1, end))
      } else if (open === '{') {
        let depth = 1
        let i = start + 1
        while (i < src.length && depth > 0) {
          if (src[i] === '{') depth++
          else if (src[i] === '}') depth--
          i++
        }
        out.push(src.slice(start + 1, i - 1))
      }
    }
    return out
  }

  const missing = new Map() // colour -> Set<file>
  for (const file of uiFiles) {
    const src = readFileSync(file, 'utf8')
    for (const chunk of classNameChunks(src)) {
      for (const cm of chunk.matchAll(colorPattern)) {
        const word = cm[1]
        // A digit anywhere means Tailwind's own numbered default palette
        // ("orange-400") or a directional gradient utility ("gradient-to-b")
        // — this codebase's custom colours never contain one.
        if (/\d/.test(word)) continue
        if (word.startsWith('gradient')) continue
        if (BUILTIN.has(word) || declared.has(word)) continue
        if (!missing.has(word)) missing.set(word, new Set())
        missing.get(word).add(rel(file))
      }
    }
  }

  check.eq('every custom colour class used in the player UI is declared in @theme',
    missing.size, 0,
    [...missing.entries()].map(([w, files]) => `${w} (${[...files].join(', ')})`).join(' | '))
}

// ---------------------------------------------------------------------------
// 2. A row that carries a RollSpec actually rolls it
//
// The exact bug: ActionRow and SpellRow both destructured a prop typed
// ActionView/SpellView (each carrying `roll?: RollSpec`) and rendered its
// preview, but their Cast/Use button dispatched the bare command and never
// referenced `.roll` or `onRoll` at all — so an attack-roll spell or a
// weapon attack always failed with "this roll needs 1 d20, not 0" unless
// pinned to the quick bar, which used a different, correctly-wired path.
// ---------------------------------------------------------------------------

{
  const path = join(root, 'player/src/ui/GameMenu.tsx')
  const src = readFileSync(path, 'utf8')

  /**
   * The full body of `function Name(...) { ... }`, brace-balanced.
   *
   * The naive "first `{` after the name" finds the destructured parameter's
   * own opening brace — `function Name({ action, dispatch }: {...`  — not
   * the function body, so the parameter list's parens have to be balanced
   * first to skip past it (and past any `: ReturnType` after them) before
   * looking for the body's own `{`.
   */
  function functionBody(name) {
    const m = new RegExp(`function ${name}\\(`).exec(src)
    if (!m) return undefined
    let i = m.index + m[0].length
    let depth = 1
    while (i < src.length && depth > 0) {
      if (src[i] === '(') depth++
      else if (src[i] === ')') depth--
      i++
    }
    const open = src.indexOf('{', i)
    depth = 1
    i = open + 1
    while (i < src.length && depth > 0) {
      if (src[i] === '{') depth++
      else if (src[i] === '}') depth--
      i++
    }
    return src.slice(open + 1, i - 1)
  }

  // Discovered from the file itself rather than hardcoded, so a new
  // roll-carrying row added later is covered without editing this test:
  // any component whose props destructure a field typed ActionView or
  // SpellView is exactly the shape that carries an optional `.roll`.
  const rollCapable = [...src.matchAll(/function (\w+)\([^)]*\{[^}]*:\s*(ActionView|SpellView)\b/g)]
    .map((m) => m[1])
  check(`GameMenu.tsx has at least the two known roll-carrying rows (found: ${rollCapable.join(', ')})`,
    rollCapable.includes('ActionRow') && rollCapable.includes('SpellRow'))

  for (const name of rollCapable) {
    const body = functionBody(name)
    check(`${name}: exists and is brace-balanced`, body !== undefined)
    check(`${name}: a component rendering a roll-carrying view actually calls onRoll`,
      body?.includes('onRoll(') === true,
      `${name} references .roll or dispatches a command without ever calling onRoll`)
  }
}

// ---------------------------------------------------------------------------
// 3. Every command the reducer runs has a real dispatch site in the UI
//
// The symmetric gap: a command can exist, typecheck, pass every engine test,
// and still be unreachable by an actual player because nothing in the UI
// ever sends it. levelUp/answerBuildChoice/answerSelection were in exactly
// this state for one commit, before GameMenu.tsx grew the Level Up button
// and the Pending Choices section.
// ---------------------------------------------------------------------------

{
  const commandsSrc = readFileSync(join(root, 'src/view/commands.ts'), 'utf8')
  const handled = [...commandsSrc.matchAll(/case '([a-zA-Z]+)':\s*return/g)].map((m) => m[1])
  check(`commands.ts declares a healthy number of handled commands (${handled.length})`,
    handled.length > 20)

  // src/view is included alongside the UI proper: a server-rolled command's
  // `type` literal is constructed once, in build.ts's ActionView/RollSpec,
  // and the UI only ever spreads that pre-built object — it never writes
  // the literal itself. That is still a real dispatch site, just one layer
  // removed from the button.
  const playerSrc = [join(root, 'player/src'), join(root, 'src/stage-ui'), join(root, 'src/view')]
    .flatMap((d) => walk(d, ['.ts', '.tsx']))
    // Type-level code is not a dispatch site, and two files in src/view are
    // nothing but type-level mentions of every command:
    //
    //   types.ts    declares the PlayerCommand union, so `type: 'x'` appears
    //               there once per command by definition;
    //   commands.ts is the REDUCER, narrowing each handler with
    //               `Extract<PlayerCommand, { type: 'x' }>`.
    //
    // Scanning either makes this check vacuous. It passed for `prepareSpells`
    // — which no UI has ever dispatched, so a wizard cannot prepare a spell —
    // and would have passed for anything else nobody wired up. build.ts stays
    // in scope: it genuinely builds commands the UI spreads into a dispatch.
    .filter((f) => !f.endsWith(join('src', 'view', 'types.ts'))
      && !f.endsWith(join('src', 'view', 'commands.ts')))
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n')

  // A command is "reachable" if its type literal appears anywhere as
  // `type: 'x'` (a dispatched command) — this also matches the RollSpec
  // command embedded by `rollSpecOf` in build.ts's view, which is the same
  // literal shape the UI reads back out and forwards, so it counts.
  // Known-unreachable, with a reason. An allowlist is the honest way to keep
  // a check like this useful: without one it either fails forever and gets
  // ignored, or gets deleted. Anything NOT listed here that loses its last
  // dispatch site still fails, which is the point.
  //
  // spendResource / restoreResource are manual pool adjustments with no
  // player-facing need — a player spends a resource by taking the action that
  // costs it, and the DM's panel corrects pools with `dmSetResource`.
  const KNOWN_UNREACHABLE = new Set(['spendResource', 'restoreResource'])

  const unreachable = handled
    .filter((type) => !KNOWN_UNREACHABLE.has(type))
    .filter((type) => !new RegExp(String.raw`type:\s*'${type}'`).test(playerSrc))

  check.eq('every command the reducer handles is dispatched from somewhere in the player UI',
    unreachable.length, 0, unreachable.join(', '))
}

check.report()
