-- Dungeon Theatre — Supabase schema snapshot
--
-- This is NOT a migration. `supabase db push`/`db pull` never touch this file;
-- the tracked migration history lives in supabase/migrations/ and stays
-- separate from it. This file exists for one reason: so the shape of the
-- database is not a fact that only exists inside Supabase's servers.
--
-- It was captured by introspecting the live project (sakzpiurgrbeewzhvvng)
-- directly — every table, column, constraint, RLS policy, function, trigger,
-- index and storage policy that project actually has, exactly as it has it.
-- Regenerate it after any schema change made directly against the dashboard or
-- via `execute_sql`/`apply_migration`, so it never drifts from reality.
--
-- Disaster recovery: running this file against a fresh Postgres database with
-- the Supabase extensions (auth schema, storage schema) available reproduces
-- the schema from nothing. It is not a substitute for an actual backup of the
-- DATA — characters, campaigns, dice history — only of the shape that data
-- lives in. Supabase takes its own data backups; this file is what you'd need
-- if the project itself, not just a table, had to be rebuilt.
--
-- Captured: 2026-08-22

-- ============================================================================
-- Extensions
-- ============================================================================

create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- ============================================================================
-- Tables
-- ============================================================================

-- One row per Discord-authenticated user. Created automatically by the
-- handle_new_user() trigger on auth.users the moment someone signs in — a
-- profile is never inserted by application code.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  discord_user_id text unique,
  display_name text not null default 'Adventurer',
  avatar_url text,
  dice_theme text not null default 'obsidian',
  created_at timestamptz not null default now()
);

-- A table. The DM's Electron app pushes its local campaign here; this is the
-- copy players read from.
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default 'New Campaign',
  invite_code text not null unique
    default upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8)),
  stage_settings jsonb not null default '{}'::jsonb,
  active_scene_id uuid,
  gm_voice_character_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Who belongs to a campaign, and in what capacity. The owner is auto-added as
-- 'dm' by the campaigns_add_owner trigger the moment the campaign is created.
create table public.campaign_members (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'player' check (role in ('dm', 'player')),
  joined_at timestamptz not null default now(),
  primary key (campaign_id, profile_id)
);

-- A cast member: a PC a player can be claimed onto, or an NPC the DM puppets.
-- `sheet` is a legacy/cosmetic jsonb blob predating the rules engine; the
-- authoritative rules sheet lives in character_sheets below.
create table public.characters (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete set null,
  name text not null default 'New Character',
  title text,
  kind text not null default 'pc' check (kind in ('pc', 'npc')),
  color text not null default '#e0a458',
  portrait_path text,
  sheet jsonb not null default '{}'::jsonb,
  scale numeric not null default 1 check (scale >= 0.5 and scale <= 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The rules engine's actual, authoritative sheet for a character — the
-- encoded Character that applyCommand operates on. One row per character;
-- `revision` is the optimistic-concurrency token the command edge function
-- checks before writing.
create table public.character_sheets (
  character_id uuid primary key references public.characters(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  schema integer not null default 1,
  sheet jsonb not null default '{}'::jsonb,
  revision bigint not null default 0,
  updated_at timestamptz not null default now()
);

-- Which Discord user plays which character, keyed by Discord id rather than
-- profile id because casting can happen before someone has signed in to the
-- web app at all — the DM casts off the voice channel roster.
create table public.casting (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  discord_user_id text not null,
  character_id uuid not null references public.characters(id) on delete cascade,
  primary key (campaign_id, discord_user_id)
);

-- The stage's scene list.
create table public.scenes (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  name text not null default 'New Scene',
  background_path text,
  npc_ids uuid[] not null default '{}',
  effect text not null default 'none',
  effect_intensity numeric not null default 0.5,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- The append-only domain event log applyCommand produces — SpellCast,
-- RollMade, DamageTaken and the rest of DomainEventType. `visibility` decides
-- who may read a row: 'dm' for NPC business, 'private' for a rejection only
-- the actor should see, 'public' for everything else.
create table public.game_events (
  id bigint primary key generated always as identity,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  character_id uuid references public.characters(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  visibility text not null default 'public' check (visibility in ('public', 'private', 'dm')),
  created_at timestamptz not null default now()
);

-- Free-standing dice rolls — the dice tray, not the rules engine's own rolls
-- (those live inside game_events payloads). 'secret' rows are redacted for
-- everyone but the roller by the dice_feed view below.
create table public.dice_rolls (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  roller_id uuid references public.profiles(id) on delete set null,
  character_id uuid references public.characters(id) on delete set null,
  notation text not null,
  dice jsonb not null default '[]'::jsonb,
  modifier integer not null default 0,
  total integer not null,
  visibility text not null default 'public'
    check (visibility in ('public', 'secret', 'hidden', 'whisper')),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Views
-- ============================================================================

-- dice_rolls, with a secret roll's actual values hidden from everyone but the
-- roller. The row still exists and is still counted — only the numbers are
-- swapped for nulls — so the table's row-level security stays about *access*,
-- and this view is what actually implements "secret from the table."
create view public.dice_feed as
select
  id,
  campaign_id,
  roller_id,
  character_id,
  visibility,
  created_at,
  case when visibility = 'secret' and roller_id <> auth.uid() then null else notation end as notation,
  case when visibility = 'secret' and roller_id <> auth.uid() then '[]'::jsonb else dice end as dice,
  case when visibility = 'secret' and roller_id <> auth.uid() then null else modifier end as modifier,
  case when visibility = 'secret' and roller_id <> auth.uid() then null else total end as total
from public.dice_rolls r;

-- ============================================================================
-- Indexes
-- ============================================================================

create index character_sheets_campaign_idx on public.character_sheets using btree (campaign_id);
create index game_events_campaign_idx on public.game_events using btree (campaign_id, id desc);
create index campaign_members_profile_idx on public.campaign_members using btree (profile_id);
create index scenes_campaign_idx on public.scenes using btree (campaign_id);
create index characters_campaign_idx on public.characters using btree (campaign_id);
create index dice_rolls_campaign_idx on public.dice_rolls using btree (campaign_id, created_at desc);

-- ============================================================================
-- Functions
-- ============================================================================

-- Membership/DM checks are SECURITY DEFINER functions rather than inline RLS
-- subqueries, because an RLS policy that queries campaign_members from inside
-- a campaign_members policy recurses. Wrapping the check in a definer function
-- breaks that cycle — the function runs with its own privileges, outside the
-- calling policy's RLS.

create or replace function public.is_campaign_dm(target_campaign uuid)
returns boolean
language sql stable security definer
set search_path to ''
as $$
  select exists (
    select 1 from public.campaigns c
    where c.id = target_campaign and c.owner_id = auth.uid()
  );
$$;

create or replace function public.is_campaign_member(target_campaign uuid)
returns boolean
language sql stable security definer
set search_path to ''
as $$
  select exists (
    select 1 from public.campaign_members m
    where m.campaign_id = target_campaign and m.profile_id = auth.uid()
  );
$$;

-- Fires after a campaign is inserted: makes its owner a 'dm' member of their
-- own campaign, so is_campaign_member()/RLS treat the DM as a normal member
-- rather than needing an owner_id special case sprinkled through every policy.
create or replace function public.add_owner_as_dm()
returns trigger
language plpgsql security definer
set search_path to ''
as $$
begin
  insert into public.campaign_members (campaign_id, profile_id, role)
  values (new.id, new.owner_id, 'dm')
  on conflict do nothing;
  return new;
end;
$$;

-- Fires after Supabase Auth creates a new auth.users row (Discord sign-in):
-- creates the matching public.profiles row, pulling the display name and
-- avatar out of whatever Discord handed back in raw_user_meta_data.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path to ''
as $$
begin
  insert into public.profiles (id, discord_user_id, display_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'provider_id',
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      'Adventurer'
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- The invite-code join flow: a player calls this by RPC with the code the DM
-- gave them, and it resolves the code to a campaign and adds them as 'player'.
-- SECURITY DEFINER because campaign_members INSERT is otherwise DM-only —
-- this function IS the one sanctioned way around that, gated on knowing the
-- code rather than on being the DM.
create or replace function public.join_campaign(code text)
returns uuid
language plpgsql security definer
set search_path to ''
as $$
declare
  target uuid;
begin
  select id into target from public.campaigns
  where invite_code = upper(trim(code));

  if target is null then
    raise exception 'No campaign found with that invite code';
  end if;

  insert into public.campaign_members (campaign_id, profile_id, role)
  values (target, auth.uid(), 'player')
  on conflict (campaign_id, profile_id) do nothing;

  return target;
end;
$$;

-- Storage object paths are "<campaign-id>/<filename>"; this reads the
-- campaign id back out so a storage RLS policy can check is_campaign_dm() on
-- it. A path whose first segment isn't a valid uuid belongs to no campaign
-- rather than erroring, so a malformed path just fails the policy check.
create or replace function public.storage_campaign_id(object_name text)
returns uuid
language plpgsql immutable
set search_path to ''
as $$
begin
  return (storage.foldername(object_name))[1]::uuid;
exception when others then
  return null;
end;
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- Triggers
-- ============================================================================

create trigger campaigns_add_owner
  after insert on public.campaigns
  for each row execute function public.add_owner_as_dm();

create trigger campaigns_touch
  before update on public.campaigns
  for each row execute function public.touch_updated_at();

create trigger characters_touch
  before update on public.characters
  for each row execute function public.touch_updated_at();

-- Lives on auth.users, not a public table — Supabase Auth owns that table,
-- this trigger is what bridges a new sign-in into our own schema.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Row level security
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_members enable row level security;
alter table public.characters enable row level security;
alter table public.character_sheets enable row level security;
alter table public.casting enable row level security;
alter table public.scenes enable row level security;
alter table public.game_events enable row level security;
alter table public.dice_rolls enable row level security;

-- --- profiles ---------------------------------------------------------------

create policy profiles_select_self on public.profiles
  for select to authenticated
  using (id = auth.uid());

-- Seeing your tablemates' display names/avatars, not just your own — needed
-- for the party roster and the cast list.
create policy profiles_select_tablemates on public.profiles
  for select to authenticated
  using (exists (
    select 1 from public.campaign_members mine
    join public.campaign_members theirs on theirs.campaign_id = mine.campaign_id
    where mine.profile_id = auth.uid() and theirs.profile_id = profiles.id
  ));

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- --- campaigns ---------------------------------------------------------------

create policy campaigns_select_members on public.campaigns
  for select to authenticated
  using (public.is_campaign_member(id) or owner_id = auth.uid());

create policy campaigns_insert_own on public.campaigns
  for insert to authenticated
  with check (owner_id = auth.uid());

create policy campaigns_update_owner on public.campaigns
  for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy campaigns_delete_owner on public.campaigns
  for delete to authenticated
  using (owner_id = auth.uid());

-- --- campaign_members ---------------------------------------------------------------

create policy members_select on public.campaign_members
  for select to authenticated
  using (profile_id = auth.uid() or public.is_campaign_member(campaign_id));

create policy members_insert_dm on public.campaign_members
  for insert to authenticated
  with check (public.is_campaign_dm(campaign_id));

-- A member may remove themself (leaving the table); the DM may remove anyone.
create policy members_delete on public.campaign_members
  for delete to authenticated
  using (profile_id = auth.uid() or public.is_campaign_dm(campaign_id));

-- --- characters ---------------------------------------------------------------

create policy characters_select_members on public.characters
  for select to authenticated
  using (public.is_campaign_member(campaign_id));

create policy characters_insert_dm on public.characters
  for insert to authenticated
  with check (public.is_campaign_dm(campaign_id));

create policy characters_update on public.characters
  for update to authenticated
  using (owner_id = auth.uid() or public.is_campaign_dm(campaign_id))
  with check (owner_id = auth.uid() or public.is_campaign_dm(campaign_id));

create policy characters_delete_dm on public.characters
  for delete to authenticated
  using (public.is_campaign_dm(campaign_id));

-- Lets an unclaimed PC (owner_id is null) be claimed by any campaign member —
-- this is how a player picks up the stage character the DM cast them as,
-- without the DM having to grant ownership by hand.
create policy characters_claim_unowned on public.characters
  for update to public
  using (kind = 'pc' and owner_id is null and public.is_campaign_member(campaign_id))
  with check (owner_id = auth.uid() and kind = 'pc');

-- --- character_sheets ---------------------------------------------------------------

create policy sheets_select on public.character_sheets
  for select to public
  using (public.is_campaign_dm(campaign_id) or exists (
    select 1 from public.characters c
    where c.id = character_sheets.character_id and c.owner_id = auth.uid()
  ));

create policy sheets_insert on public.character_sheets
  for insert to public
  with check (public.is_campaign_dm(campaign_id) or exists (
    select 1 from public.characters c
    where c.id = character_sheets.character_id and c.owner_id = auth.uid()
  ));

create policy sheets_update on public.character_sheets
  for update to public
  using (public.is_campaign_dm(campaign_id) or exists (
    select 1 from public.characters c
    where c.id = character_sheets.character_id and c.owner_id = auth.uid()
  ))
  with check (public.is_campaign_dm(campaign_id) or exists (
    select 1 from public.characters c
    where c.id = character_sheets.character_id and c.owner_id = auth.uid()
  ));

create policy sheets_delete_dm on public.character_sheets
  for delete to public
  using (public.is_campaign_dm(campaign_id));

-- --- casting ---------------------------------------------------------------

create policy casting_select_members on public.casting
  for select to authenticated
  using (public.is_campaign_member(campaign_id));

create policy casting_write_dm on public.casting
  for all to authenticated
  using (public.is_campaign_dm(campaign_id))
  with check (public.is_campaign_dm(campaign_id));

-- --- scenes ---------------------------------------------------------------

create policy scenes_select_members on public.scenes
  for select to authenticated
  using (public.is_campaign_member(campaign_id));

create policy scenes_write_dm on public.scenes
  for all to authenticated
  using (public.is_campaign_dm(campaign_id))
  with check (public.is_campaign_dm(campaign_id));

-- --- game_events ---------------------------------------------------------------

create policy events_insert on public.game_events
  for insert to public
  with check (public.is_campaign_member(campaign_id));

create policy events_select on public.game_events
  for select to public
  using (
    public.is_campaign_dm(campaign_id)
    or (public.is_campaign_member(campaign_id) and visibility = 'public')
    or (visibility = 'private' and actor_id = auth.uid())
  );

-- --- dice_rolls ---------------------------------------------------------------

create policy dice_insert_members on public.dice_rolls
  for insert to authenticated
  with check (public.is_campaign_member(campaign_id) and roller_id = auth.uid());

-- Note: this policy exposes secret rolls' actual columns to any campaign
-- member at the table level. The redaction that matters is enforced by the
-- dice_feed VIEW above (secret dice show as null/[] to everyone but the
-- roller) — application code reads dice_feed, never dice_rolls, directly.
create policy dice_select on public.dice_rolls
  for select to authenticated
  using (
    roller_id = auth.uid()
    or (public.is_campaign_member(campaign_id) and visibility in ('public', 'secret'))
  );

-- ============================================================================
-- Realtime
-- ============================================================================

-- Only game_events streams over Realtime; everything else is pulled on demand
-- or pushed via the DM's own broadcast channel (src/main/cloud/broadcast.ts).
alter publication supabase_realtime add table public.game_events;

-- ============================================================================
-- Storage
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('campaign-art', 'campaign-art', true)
on conflict (id) do nothing;

create policy campaign_art_read on storage.objects
  for select to public
  using (bucket_id = 'campaign-art');

create policy campaign_art_write_dm on storage.objects
  for insert to authenticated
  with check (bucket_id = 'campaign-art' and public.is_campaign_dm(public.storage_campaign_id(name)));

create policy campaign_art_update_dm on storage.objects
  for update to authenticated
  using (bucket_id = 'campaign-art' and public.is_campaign_dm(public.storage_campaign_id(name)));

create policy campaign_art_delete_dm on storage.objects
  for delete to authenticated
  using (bucket_id = 'campaign-art' and public.is_campaign_dm(public.storage_campaign_id(name)));
