-- ============================================================
-- Brasa: security hardening migration
--
-- BEFORE RUNNING: enable anonymous sign-ins in the dashboard:
--   Authentication → Sign In / Up → "Allow anonymous sign-ins"
--
-- After this migration, rooms/players/turns are only readable by
-- the two members of each room. Creating and joining rooms goes
-- through SECURITY DEFINER functions that require the room code.
-- NOTE: rooms created before this migration become inaccessible
-- (their players have no auth_uid) — create fresh rooms after.
-- ============================================================

-- Tie players to the anonymous auth identity
alter table players add column if not exists auth_uid uuid;

-- Membership helper. SECURITY DEFINER so it can read players
-- regardless of RLS (also avoids policy recursion on players).
create or replace function is_room_member(p_room_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from players
    where room_id = p_room_id and auth_uid = auth.uid()
  );
$$;

-- Drop the wide-open policies
drop policy if exists "Allow public access to rooms" on rooms;
drop policy if exists "Allow public access to players" on players;
drop policy if exists "Allow public access to turns" on turns;
drop policy if exists "Allow public access to favorites" on favorites;
drop policy if exists "Allow public access to chat_messages" on chat_messages;

-- Members-only policies (anonymous sessions have the 'authenticated' role)
create policy "members read rooms" on rooms
  for select to authenticated using (is_room_member(id));
create policy "members update rooms" on rooms
  for update to authenticated using (is_room_member(id)) with check (is_room_member(id));

create policy "members read players" on players
  for select to authenticated using (is_room_member(room_id));

create policy "members read turns" on turns
  for select to authenticated using (is_room_member(room_id));
create policy "members insert turns" on turns
  for insert to authenticated with check (is_room_member(room_id));

create policy "members read favorites" on favorites
  for select to authenticated using (is_room_member(room_id));
create policy "members insert favorites" on favorites
  for insert to authenticated with check (is_room_member(room_id));

create policy "members read chat" on chat_messages
  for select to authenticated using (is_room_member(room_id));
create policy "members insert chat" on chat_messages
  for insert to authenticated with check (is_room_member(room_id));

-- Room creation: inserts the room and its host in one step.
create or replace function create_room(p_code text, p_game_length int, p_nickname text)
returns rooms
language plpgsql security definer set search_path = public
as $$
declare
  v_room rooms;
begin
  if auth.uid() is null then
    raise exception 'Se requiere sesión';
  end if;
  insert into rooms (code, game_length)
    values (upper(p_code), coalesce(p_game_length, 15))
    returning * into v_room;
  insert into players (room_id, device_id, role, nickname, auth_uid)
    values (v_room.id, auth.uid()::text, 'host', p_nickname, auth.uid());
  return v_room;
end;
$$;

-- Joining: requires knowing the code; enforces the 2-player cap;
-- idempotent if you are already a member.
create or replace function join_room(p_code text, p_nickname text)
returns rooms
language plpgsql security definer set search_path = public
as $$
declare
  v_room rooms;
  v_count int;
begin
  if auth.uid() is null then
    raise exception 'Se requiere sesión';
  end if;
  select * into v_room from rooms where code = upper(p_code);
  if not found then
    raise exception 'Sala no encontrada';
  end if;
  if exists (select 1 from players where room_id = v_room.id and auth_uid = auth.uid()) then
    return v_room;
  end if;
  select count(*) into v_count from players where room_id = v_room.id;
  if v_count >= 2 then
    raise exception 'La sala ya está completa';
  end if;
  insert into players (room_id, device_id, role, nickname, auth_uid)
    values (v_room.id, auth.uid()::text, 'guest', p_nickname, auth.uid());
  return v_room;
end;
$$;

-- Only sessions (including anonymous ones) may call the functions
revoke execute on function create_room(text, int, text) from anon, public;
revoke execute on function join_room(text, text) from anon, public;
grant execute on function create_room(text, int, text) to authenticated;
grant execute on function join_room(text, text) to authenticated;
