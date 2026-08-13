# Backend

Supabase project **DungeonStage**, region `ap-south-1` (Mumbai).
Project URL: `https://sakzpiurgrbeewzhvvng.supabase.co`

## Why this shape

Two kinds of state, deliberately kept apart:

- **Presentation state** — who is speaking, the active scene, dice in flight.
  Ephemeral, DM-authoritative. Goes over **Realtime Broadcast**, which never
  touches Postgres, so the hot path stays fast.
- **Durable state** — characters, sheets, campaign structure, art. Lives in
  **Postgres** behind row level security.

Blurring these two is the thing that would make this unmaintainable later, so
nothing in the speaking path is allowed to write to the database.

## Tables

| Table | Purpose |
|---|---|
| `profiles` | One per signed-in user. `discord_user_id` is the join key between a login and the voice identity the DM casts. |
| `campaigns` | Owned by the DM. Carries `invite_code`, stage settings, active scene. |
| `campaign_members` | Who is in a campaign, and whether they are `dm` or `player`. |
| `characters` | PCs and NPCs. `sheet` is JSONB. |
| `scenes` | Background art, staged NPCs, weather effect. |
| `casting` | `discord_user_id` → `character_id`. Keyed by Discord ID, not profile, because the DM casts people who may not have signed in yet. |
| `dice_rolls` | Durable roll log. Read through the `dice_feed` view. |

### The `sheet` JSONB column

Stats, HP, actions, passives and notes all live in `characters.sheet`.

This is deliberate. The alternative — columns per stat — would mean running
schema migrations against a live campaign every time the character model grows.
JSONB means the next checkpoint's stat-slotting needs no migration at all.

## Security model

Every table has RLS on. Membership checks go through the `security definer`
helpers `is_campaign_member()` and `is_campaign_dm()`. Those helpers exist for a
specific reason: if a policy queried `campaign_members` directly, evaluating
that table's own policy would re-enter RLS and recurse.

Verified by simulating three real users:

| Attempt | Result |
|---|---|
| Outsider reads campaigns / characters / scenes / casting / members | 0 rows each |
| Player reads their campaign after `join_campaign` | works |
| Player edits their own `sheet` | works |
| Player renames an NPC, a scene, or the campaign | blocked |
| Player creates or deletes a character | blocked |
| Player promotes self to DM | blocked |
| Player edits the DM's profile | blocked |

### Dice visibility

Three states, because RLS filters rows but cannot filter columns:

- `public` — everyone sees the values.
- `secret` — players see that a roll *happened* but the values are redacted by
  the `dice_feed` view. This is the "the DM just rolled something" tension.
- `hidden` — the row never reaches anyone but the roller.

### Storage

Bucket `campaign-art`, public read so the CDN can cache art that every player
fetches on every scene change. Writes are restricted to the campaign's DM via
the object path convention `{campaign_id}/{filename}`.

## Remaining advisor warnings

Three, all deliberate:

- `is_campaign_member` / `is_campaign_dm` are executable by `authenticated`.
  This is **required** — RLS inlines them into queries, and revoking EXECUTE
  breaks every policy that calls them. Calling one only reveals whether you
  yourself are a member of a campaign, which you already know. Anonymous access
  is revoked.
- `join_campaign` is executable by `authenticated`. That is the intended door
  into a campaign; it can only ever add the caller, and only as a `player`.

Anonymous access is revoked on all functions, and the trigger functions are no
longer reachable over REST.

## Auth redirect URLs

Discord OAuth is configured against the existing **DungeonScreen** Discord app
(client id `1536931866769236009`), scopes `email identify`. `identify` is what
supplies `provider_id`, which the signup trigger stores as `discord_user_id` —
the key that links a login to the DM's casting.

Two redirect URLs matter:

| Where | URL |
|---|---|
| Discord Developer Portal → OAuth2 | `https://sakzpiurgrbeewzhvvng.supabase.co/auth/v1/callback` |
| Supabase → Auth → URL Configuration → Redirect URLs | `http://localhost:7373/auth/callback` (DM app) |
| Supabase → Auth → URL Configuration → Redirect URLs | `http://localhost:5273` (player app, dev) |

The second one is easy to miss. The DM app is Electron and has no address bar
for Supabase to redirect into, so it opens the system browser and catches the
PKCE code on a one-shot loopback server on port 7373. If that URL is not
allowlisted, Supabase silently falls back to the Site URL after Discord auth,
the loopback server never receives a code, and sign-in appears to hang rather
than failing loudly.

## Free tier caveat

Supabase pauses free projects after roughly a week of inactivity. A weekly game
will keep it warm, but a long break between arcs means the backend sleeps and
players cannot reach their characters until it is resumed by hand. If this
becomes the place characters actually live, that is the reason to upgrade.
