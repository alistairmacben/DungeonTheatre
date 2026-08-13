# Dungeon Theatre

A cinematic stage for Discord D&D games. It watches who is talking in your
Discord voice channel and puts the right character on screen — with scene art,
weather, and physics-simulated 3D dice that everyone at the table sees land on
the same number.

No bot in your voice channel, no transcription, no LLMs, no paid APIs.

---

## The two halves

**The GM app** is an Electron desktop app. It reads your running Discord client
directly, and it is the only piece that has to be installed.

**The player view** is a web app. Players open a link, sign in with Discord, and
see the same stage you do — on their own screen, at full quality, instead of
squinting at a compressed screenshare. They can roll dice from it too.

---

## How the Discord connection works

Discord's desktop client runs a local RPC server. Dungeon Theatre connects to it
over the **IPC named pipe** (`\\.\pipe\discord-ipc-0` on Windows, a socket in
`$XDG_RUNTIME_DIR` elsewhere) and subscribes to `SPEAKING_START` /
`SPEAKING_STOP` for whichever voice channel you are in.

Two things are worth knowing, because they rule out the obvious alternatives:

- **Not the RPC WebSocket.** The `ws://127.0.0.1:6463` transport checks the
  connection's `Origin` header against the application's registered
  `rpc_origins`, and is limited to Discord itself plus a few partners. The IPC
  pipe sends no Origin, so that check does not apply.
- **The `rpc` scope is gated**, but Discord always grants it to the
  application's **owner**. Because you register your own Discord application,
  you are the owner and it just works. To let another person's client connect,
  add them under the app's testers (50 slots).

### One-time setup

1. Go to <https://discord.com/developers/applications> → **New Application**.
2. **General Information** → copy the **Application ID**. That is your Client ID.
3. **OAuth2** → add these redirect URIs:
   - `http://localhost` — used by the token exchange
   - `http://localhost:7373/auth/callback` — the GM app's sign-in
   - `https://<your-supabase-ref>.supabase.co/auth/v1/callback` — player sign-in
4. **OAuth2** → **Reset Secret** → copy the **Client Secret**.
5. In the GM app: pick the *Discord (local client)* source, paste both, **Save**,
   then **Connect**, and approve the prompt Discord raises.

Run `npm run doctor` if the connection misbehaves — it checks whether Discord is
actually running, whether the pipe exists, and whether your application ID is
valid.

### Requirements and limits

- Needs the **Discord desktop app** on the same machine as the GM app. The
  browser client exposes no RPC pipe.
- Tells you *who is speaking*, not *what they said*. That is all the stage needs.
- Speaking events are per-user and near-instant. Stop events are held for 350 ms
  so portraits don't strobe during natural pauses in speech.

---

## The stage

Two ways to draw the cast, switched in the **Stage** tab:

- **Visual novel** — characters stand on the scene side by side, unframed. The
  speaker steps forward, brightens and gets a rim glow; everyone else falls back
  into shadow. Use full-body cut-out PNGs with transparency.
- **Portrait cards** — framed portraits in a grid. Better for square busts.

Also there: show/hide names and titles, dim-idle, character height, per-character
size, and a **background dim** slider. Set the dim to 0 and your scene art is
untouched.

### Scene effects

Each scene carries its own weather — rain, storm, snow, fog, embers, wind,
sunbeams, gloom — with a strength slider.

These are deliberately restrained. Dense fast-moving speckle is the worst
possible input for a video encoder, so if you ever *do* screenshare, particle
counts stay low, shapes stay large and soft, and colour grading is done in CSS
where it costs the encoder nothing.

---

## Dice

Rigid-body physics via cannon-es, viewed from above. Dice are thrown inward from
the edges and genuinely simulated — they collide with the felt, the walls and
each other, tumble, lose energy and come to rest wherever they land.

**How real physics coexists with a result everyone must agree on:** the dice are
never steered. They fall freely, and the die is continuously renumbered so
whichever face is currently uppermost carries the rolled value. Every face is
geometrically identical, so the roll is honest to watch and still shows the
number the roller generated.

Forcing the final pose instead would produce visibly un-physical dice, and
re-simulating until the right answer came up would take unbounded time.

- Shapes: d4, d6, d8, d10, d12, d20 — real polyhedra, with the collision hull
  built from the same vertices as the visible mesh.
- A d4 carries its numbers at the corners and is read from the top point, the
  way a real one is.
- Nine material themes; a player's choice follows them between campaigns.
- **Whisper** rolls are never broadcast, never written to the database, and
  never appear in any log.

---

## Backend

See [docs/backend.md](docs/backend.md) for the schema, the row-level-security
model, and the reasoning behind it.

The short version: **presentation state** (who is speaking, the active scene,
dice in flight) travels over Realtime Broadcast and never touches Postgres, so
the hot path stays fast. **Durable state** (characters, sheets, campaign
structure, art) lives in Postgres behind RLS.

`characters.sheet` is JSONB on purpose — stats, actions and passives can be added
later without migrating a live campaign.

---

## Development

```bash
npm run dev
```

```bash
npm run dev:player
```

Other scripts:

```bash
npm test
```

```bash
npm run typecheck
```

```bash
npm run doctor
```

### Tests

Five suites, no framework — these are protocol and timing checks that need real
sockets and real clocks:

- **test-rpc** — the RPC source against a fake Discord pipe server that speaks
  the real framing protocol, so the wire format, auth handshake, roster parsing
  and speaking dispatch are covered without Discord running.
- **test-hub** — the speaking release hold, with real timers.
- **test-stage** — who ends up on stage: casting, GM voice takeover, staged
  NPCs, bot exclusion, de-duplication.
- **test-layout** — the stage grid fits the 1920x1080 canvas at every party size.
  It asserts against a card ratio measured from the real DOM rather than
  importing the layout's own constant, so the budget cannot silently drift.
- **test-campaign** — a campaign written by an older build still loads with its
  data intact and gains sane defaults for new fields.

The fake pipe server binds a test-specific name rather than `discord-ipc-0`, so
the suite runs correctly even while the real Discord client is open.
`DUNGEON_RPC_PIPE` overrides the pipe the app connects to.

### Designing without a live game

```bash
npm run dev:player
```

- `http://localhost:5273/dice-test.html` — dice harness with no auth or campaign.
  Add `?raf=timer` to drive the render loop from timers in a browser that
  suspends `requestAnimationFrame`.
- Stage layouts can be previewed with `?demo=8&fx=storm` on the GM stage window.

---

## Architecture

The Electron **main process owns all state**. Renderers are pure views: they
receive `AppSnapshot` pushes and send back `Command`s.

```
src/
  shared/      domain types shared by every surface
  main/
    hub.ts     single source of truth; owns speaking state and debouncing
    discord/   named-pipe transport, RPC source, mock source, credentials
    cloud/     Supabase auth, campaign sync, presentation broadcast
    campaign/  local campaign store and asset import
  stage-ui/    the stage itself — rendered identically by both apps
  renderer/    the GM windows (control + stage)
player/        the player web app
```

`stage-ui` is the important boundary. The GM's stage window and the players' web
app render the *same* `StageView`, differing only in where the snapshot comes
from and how asset paths resolve. That is what guarantees the GM's preview and
what the table sees cannot drift apart.
