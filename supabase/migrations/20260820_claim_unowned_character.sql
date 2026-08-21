-- Phase G. Lets a player claim their own unowned PC row during character
-- creation. Additive: Postgres OR's policies together for the same command,
-- so this does not replace `characters_update` (owner-or-DM), it adds one more
-- way to satisfy it.
--
-- Why this is needed: the DM casts a Discord user to a stage character (name,
-- portrait, colour), but that row starts with owner_id = null — nobody has
-- built a rules sheet for it yet. The existing UPDATE policy requires
-- owner_id = auth.uid() to touch a row at all, which is circular for a first
-- claim: a null owner can never equal the caller's id. This policy is the
-- narrow exception, scoped so a member can only ever move a PC from unowned to
-- owned-by-themselves — never reassign someone else's character, never touch
-- an NPC, never change anything but ownership.

drop policy if exists characters_claim_unowned on public.characters;
create policy characters_claim_unowned on public.characters
  for update
  using (
    kind = 'pc'
    and owner_id is null
    and public.is_campaign_member(campaign_id)
  )
  with check (
    owner_id = auth.uid()
    and kind = 'pc'
  );
