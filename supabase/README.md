# Supabase

Project `sakzpiurgrbeewzhvvng` (Dungeon Theatre, `ap-south-1`).

- **`schema.sql`** — a snapshot of the live database schema (tables, RLS,
  functions, triggers, storage), captured by introspecting the project
  directly. Not a migration; `db push`/`db pull` never touch it. It exists so
  the shape of the database is written down somewhere other than Supabase's
  servers. Regenerate it after any schema change made outside `migrations/`
  (dashboard edits, ad-hoc SQL) so it stays true.
- **`migrations/`** — the CLI-tracked migration history. Anything changing the
  live schema going forward should be a new file here, applied with
  `supabase db push`, not a hand-edit to `schema.sql`.
- **`functions/`** — the edge functions. `functions/command` is the server
  authority (see its own header comment); `functions/_shared/engine.mjs` is
  the bundled rules engine, rebuilt with `npm run build:edge` before each
  deploy and never hand-edited.

Data (characters, campaigns, dice history) is not backed up by anything in
this repo — Supabase backs up the data. `schema.sql` covers the *shape*, so a
lost project could be rebuilt structurally from scratch if it ever came to
that.
