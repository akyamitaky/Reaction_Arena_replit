-- Phase 2: persistent player profiles (XP, stats, leaderboards) and arena
-- auto-advance between games.
--
-- Profiles are created anonymously through a capability token: the server
-- returns a profileId/profileToken pair and only stores the token hash, mirroring
-- the players table pattern. Mutating progress happens through record_profile_activity
-- which applies deltas so concurrent devices cannot clobber each other.

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  xp integer not null default 0,
  games_played integer not null default 0,
  arenas_played integer not null default 0,
  arena_wins integer not null default 0,
  best_scores jsonb not null default '{}'::jsonb,
  profile_token_hash text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Leaderboards and profile cards read everyone's public stats.
create policy "profiles are publicly readable"
  on public.profiles
  for select
  using (true);

create or replace function public.create_profile(p_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clean text;
  v_profile_id uuid := gen_random_uuid();
  v_token text;
begin
  v_clean := nullif(btrim(p_name), '');
  if v_clean is null then
    raise exception 'Name is required.' using errcode = 'A0200';
  end if;
  if char_length(v_clean) > 24 then
    raise exception 'Name must be 24 characters or fewer.' using errcode = 'A0201';
  end if;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into profiles (id, name, profile_token_hash)
  values (v_profile_id, v_clean, encode(extensions.digest(v_token, 'sha256'), 'hex'));

  return jsonb_build_object('profileId', v_profile_id, 'profileToken', v_token);
end;
$$;

create or replace function public.record_profile_activity(
  p_profile_id uuid,
  p_profile_token text,
  p_xp integer,
  p_games_played integer,
  p_arenas_played integer,
  p_arena_wins integer,
  p_best_scores jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_best jsonb;
  v_key text;
  v_new integer;
  v_old integer;
begin
  select best_scores into v_best
  from profiles
  where id = p_profile_id
    and profile_token_hash = encode(extensions.digest(p_profile_token, 'sha256'), 'hex')
  for update;

  if not found then
    raise exception 'Profile authorization failed.' using errcode = 'A0210';
  end if;

  -- Merge per-game best scores, keeping the higher of the two.
  if p_best_scores is not null then
    for v_key, v_new in
      select key, value::integer from jsonb_each_text(p_best_scores)
    loop
      v_old := coalesce((v_best -> v_key)::integer, 0);
      if v_new > v_old then
        v_best := jsonb_set(v_best, array[v_key], to_jsonb(v_new), true);
      end if;
    end loop;
  end if;

  update profiles
  set xp = xp + coalesce(p_xp, 0),
      games_played = games_played + coalesce(p_games_played, 0),
      arenas_played = arenas_played + coalesce(p_arenas_played, 0),
      arena_wins = arena_wins + coalesce(p_arena_wins, 0),
      best_scores = v_best,
      updated_at = now()
  where id = p_profile_id;

  return jsonb_build_object('success', true);
end;
$$;

-- ---------------------------------------------------------------------------
-- Arena auto-advance
-- ---------------------------------------------------------------------------

alter table public.rooms
  add column if not exists between_started_at timestamptz;

-- Stamp when each "Between Games" window begins so any player can auto-advance
-- after a grace period once everyone has finished their current game.
create or replace function public.finalize_arena_game(p_room_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room rooms;
  v_is_last boolean;
  v_total integer;
  v_rank integer;
  v_ranked integer;
  v_scores jsonb;
  v_player players;
begin
  select * into v_room from rooms where id = p_room_id for update;
  if not found then
    raise exception 'Room not found.' using errcode = 'A0050';
  end if;

  v_is_last := v_room.current_game_index >= jsonb_array_length(v_room.game_ids) - 1;

  select count(*) into v_total from players where room_id = p_room_id;
  v_rank := 1;

  for v_player in
    select * from players
    where room_id = p_room_id
    order by
      case when coalesce((game_scores -> -1 ->> 'rawScore')::integer, 0) > 0 then 0 else 1 end,
      coalesce((game_scores -> -1 ->> 'rawScore')::integer, 0) desc,
      coalesce((game_scores -> -1 ->> 'timeTakenMs')::integer, 99999),
      id
  loop
    if coalesce((v_player.game_scores -> -1 ->> 'rawScore')::integer, 0) > 0 then
      v_ranked := v_total - v_rank + 1;
    else
      v_ranked := 0;
    end if;
    v_scores := jsonb_set(
      v_player.game_scores,
      '{-1,rankedPoints}',
      to_jsonb(v_ranked),
      true
    );
    update players
    set game_scores = v_scores,
        total_score = total_score + v_ranked,
        current_game_score = v_ranked
    where id = v_player.id;
    if v_ranked > 0 then
      v_rank := v_rank + 1;
    end if;
  end loop;

  update rooms
  set status = case when v_is_last then 'Finished' else 'Between Games' end,
      between_started_at = case when v_is_last then null else now() end
  where id = p_room_id;

  return v_is_last;
end;
$$;

create or replace function public.auto_advance_room(
  p_room_id uuid,
  p_player_id uuid,
  p_player_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room rooms;
begin
  select * into v_room from rooms where id = p_room_id for update;
  if not found then
    raise exception 'Room not found.' using errcode = 'A0220';
  end if;

  if not exists (
    select 1 from players
    where id = p_player_id
      and room_id = p_room_id
      and player_token_hash = encode(extensions.digest(p_player_token, 'sha256'), 'hex')
  ) then
    raise exception 'Player authorization failed.' using errcode = 'A0221';
  end if;

  if v_room.status <> 'Between Games' then
    return jsonb_build_object('advanced', false, 'reason', 'not between games');
  end if;
  if v_room.current_game_index >= jsonb_array_length(v_room.game_ids) - 1 then
    return jsonb_build_object('advanced', false, 'reason', 'no more games');
  end if;
  if exists (
    select 1 from players
    where room_id = p_room_id and not game_done
  ) then
    return jsonb_build_object('advanced', false, 'reason', 'players still playing');
  end if;
  if v_room.between_started_at is null or now() < v_room.between_started_at + interval '10 seconds' then
    return jsonb_build_object('advanced', false, 'reason', 'too soon');
  end if;

  update rooms
  set current_game_index = current_game_index + 1, status = 'Playing'
  where id = p_room_id;
  update players
  set game_done = false, current_game_score = 0
  where room_id = p_room_id;

  return jsonb_build_object('advanced', true);
end;
$$;

revoke execute on function public.create_profile(text),
  public.record_profile_activity(uuid, text, integer, integer, integer, integer, jsonb),
  public.finalize_arena_game(uuid),
  public.auto_advance_room(uuid, uuid, text)
from public;

grant execute on function public.create_profile(text),
  public.record_profile_activity(uuid, text, integer, integer, integer, integer, jsonb),
  public.finalize_arena_game(uuid),
  public.auto_advance_room(uuid, uuid, text)
to anon, authenticated;
