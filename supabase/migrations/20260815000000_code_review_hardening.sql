-- Code review hardening.
--
-- Adds stable, machine-readable SQLSTATE error codes to every user-facing
-- validation failure so the client can stop depending on exact message
-- strings, and makes room-code generation resilient to the (rare) collision
-- window between uniqueness check and insert by retrying on unique_violation.
--
-- This migration intentionally does NOT change row-level security: the
-- anonymous join-by-code flow requires rooms/players to stay readable, so the
-- previous public SELECT policies are preserved. If you later add accounts,
-- scope the SELECT policies to room membership instead.
--
-- NOTE: RLS SELECT policies still allow listing rooms via the REST API. If you
-- want to harden that, review https://supabase.com/docs/guides/database/row-level-security

alter table public.rooms drop constraint if exists rooms_game_count_check;
alter table public.rooms add constraint rooms_game_count_check check (game_count between 3 and 27);

create or replace function public.create_room(p_host_name text, p_game_count integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room rooms;
  v_player players;
  v_code text;
  v_games jsonb;
  v_player_token text;
begin
  if p_host_name is null or char_length(trim(p_host_name)) = 0 then
    raise exception 'Player name is required' using errcode = 'A0001';
  end if;
  if char_length(trim(p_host_name)) > 40 then
    raise exception 'Player name must be 40 characters or fewer' using errcode = 'A0002';
  end if;
  if p_game_count is null or p_game_count < 3 or p_game_count > 27 then
    raise exception 'Game count must be between 3 and 27' using errcode = 'A0003';
  end if;

  -- Generate a unique code; retry on the rare insert-time collision instead
  -- of exposing a constraint error to the user.
  loop
    select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::int, 1), '')
    into v_code
    from generate_series(1, 5);
    begin
      insert into rooms(code, host_name, game_count, game_ids)
      values (v_code, trim(p_host_name), p_game_count, '[]'::jsonb)
      returning * into v_room;
      exit;
    exception when unique_violation then
      null;
    end;
  end loop;

  select jsonb_agg(game.id order by random())
  into v_games
  from (values
    ('color'), ('memory'), ('math'), ('reflex'), ('catch'), ('reverse'), ('count'), ('sequence'), ('emoji'), ('stroop'), ('oddone'),
    ('scramble'), ('impostor'), ('chain'), ('riddles'),
    ('missingnum'), ('emojitalk'), ('truefalse'), ('colormem'), ('speedtype'), ('tilematch'), ('scribble'), ('shapes'), ('wordhunt'),
    ('whack'), ('treasure'), ('duel')
  ) as game(id);
  v_games := (
    select jsonb_agg(value)
    from jsonb_array_elements(v_games) with ordinality as x(value, n)
    where n <= p_game_count
  );

  update rooms
  set game_ids = v_games
  where id = v_room.id;

  v_player_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into players(name, room_id, is_host, player_token_hash)
  values (trim(p_host_name), v_room.id, true, encode(extensions.digest(v_player_token, 'sha256'), 'hex'))
  returning * into v_player;

  return jsonb_build_object(
    'roomId', v_room.id,
    'roomCode', v_room.code,
    'playerId', v_player.id,
    'playerToken', v_player_token
  );
end;
$$;

create or replace function public.join_room(p_code text, p_player_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room rooms;
  v_player players;
  v_player_token text;
begin
  if p_player_name is null or char_length(trim(p_player_name)) = 0 then
    raise exception 'Player name is required' using errcode = 'A0010';
  end if;
  if char_length(trim(p_player_name)) > 40 then
    raise exception 'Player name must be 40 characters or fewer' using errcode = 'A0011';
  end if;

  select * into v_room
  from rooms
  where code = upper(trim(p_code))
  for update;

  if not found then
    raise exception 'Room not found. Check the code and try again.' using errcode = 'A0012';
  end if;
  if v_room.status <> 'Waiting' then
    raise exception 'This arena has already started.' using errcode = 'A0013';
  end if;
  if (select count(*) from players where room_id = v_room.id) >= 8 then
    raise exception 'Room is full (max 8 players).' using errcode = 'A0014';
  end if;
  if exists (
    select 1 from players
    where room_id = v_room.id and lower(name) = lower(trim(p_player_name))
  ) then
    raise exception 'Someone with that name is already in the room.' using errcode = 'A0015';
  end if;

  v_player_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into players(name, room_id, player_token_hash)
  values (trim(p_player_name), v_room.id, encode(extensions.digest(v_player_token, 'sha256'), 'hex'))
  returning * into v_player;

  return jsonb_build_object(
    'roomId', v_room.id,
    'playerId', v_player.id,
    'playerToken', v_player_token,
    'gameCount', v_room.game_count
  );
end;
$$;

create or replace function public.start_arena(
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
    raise exception 'Room not found.' using errcode = 'A0020';
  end if;
  if v_room.status <> 'Waiting' then
    raise exception 'This arena has already started.' using errcode = 'A0021';
  end if;
  if not exists (
    select 1 from players
    where id = p_player_id
      and room_id = p_room_id
      and is_host
      and player_token_hash = encode(extensions.digest(p_player_token, 'sha256'), 'hex')
  ) then
    raise exception 'Only the host can start.' using errcode = 'A0022';
  end if;
  if (select count(*) from players where room_id = p_room_id) < 2 then
    raise exception 'Need at least 2 players to start.' using errcode = 'A0023';
  end if;

  update rooms
  set status = 'Playing', current_game_index = 0
  where id = p_room_id;

  return jsonb_build_object('success', true);
end;
$$;

create or replace function public.advance_game(
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
    raise exception 'Room not found.' using errcode = 'A0030';
  end if;
  if not exists (
    select 1 from players
    where id = p_player_id
      and room_id = p_room_id
      and is_host
      and player_token_hash = encode(extensions.digest(p_player_token, 'sha256'), 'hex')
  ) then
    raise exception 'Only the host can advance.' using errcode = 'A0031';
  end if;
  if v_room.status <> 'Between Games' then
    raise exception 'The next game is not ready yet.' using errcode = 'A0032';
  end if;
  if v_room.current_game_index >= jsonb_array_length(v_room.game_ids) - 1 then
    raise exception 'There are no more games.' using errcode = 'A0033';
  end if;
  if exists (
    select 1 from players
    where room_id = p_room_id and not game_done
  ) then
    raise exception 'Waiting for all players to finish.' using errcode = 'A0034';
  end if;

  update rooms
  set current_game_index = current_game_index + 1, status = 'Playing'
  where id = p_room_id;
  update players
  set game_done = false, current_game_score = 0
  where room_id = p_room_id;

  return jsonb_build_object('success', true);
end;
$$;

create or replace function public.submit_score(
  p_room_id uuid,
  p_player_id uuid,
  p_player_token text,
  p_game_id text,
  p_score integer,
  p_time_taken_ms integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room rooms;
  v_player players;
  v_all_done boolean;
  v_is_last boolean;
  v_total integer;
  v_scores jsonb;
  v_ranked integer;
  v_rank integer;
begin
  select * into v_room from rooms where id = p_room_id for update;
  if not found then
    raise exception 'Room not found.' using errcode = 'A0040';
  end if;

  select * into v_player
  from players
  where id = p_player_id
    and room_id = p_room_id
    and player_token_hash = encode(extensions.digest(p_player_token, 'sha256'), 'hex')
  for update;
  if not found then
    raise exception 'Player authorization failed.' using errcode = 'A0041';
  end if;

  v_is_last := v_room.current_game_index >= jsonb_array_length(v_room.game_ids) - 1;

  -- Retries after a lost response are safe and return authoritative state.
  if v_player.game_done then
    select count(*) = count(*) filter (where game_done)
    into v_all_done
    from players where room_id = p_room_id;
    return jsonb_build_object('allDone', v_all_done, 'isLastGame', v_is_last);
  end if;

  if v_room.status <> 'Playing' then
    raise exception 'This game is not accepting scores.' using errcode = 'A0042';
  end if;
  if p_game_id is null or p_game_id <> (v_room.game_ids ->> v_room.current_game_index) then
    raise exception 'This score belongs to a different game.' using errcode = 'A0043';
  end if;
  if p_score is null or p_score < 0 then
    raise exception 'Score must be a non-negative integer.' using errcode = 'A0044';
  end if;
  if p_score > 300 then
    raise exception 'Score is above the maximum allowed for an arena game.' using errcode = 'A0045';
  end if;
  if p_time_taken_ms is null or p_time_taken_ms < 0 or p_time_taken_ms > 120000 then
    raise exception 'Invalid game duration.' using errcode = 'A0046';
  end if;

  v_scores := v_player.game_scores || jsonb_build_array(
    jsonb_build_object(
      'gameId', p_game_id,
      'rawScore', p_score,
      'timeTakenMs', p_time_taken_ms,
      'rankedPoints', 0
    )
  );
  update players
  set game_scores = v_scores,
      current_game_score = p_score,
      game_done = true
  where id = p_player_id;

  select count(*) = count(*) filter (where game_done)
  into v_all_done
  from players where room_id = p_room_id;

  if v_all_done then
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
    set status = case when v_is_last then 'Finished' else 'Between Games' end
    where id = p_room_id;
  end if;

  return jsonb_build_object('allDone', v_all_done, 'isLastGame', v_is_last);
end;
$$;

revoke execute on function public.create_room(text, integer),
  public.join_room(text, text),
  public.start_arena(uuid, uuid, text),
  public.advance_game(uuid, uuid, text),
  public.submit_score(uuid, uuid, text, text, integer, integer)
from public;

grant execute on function public.create_room(text, integer),
  public.join_room(text, text),
  public.start_arena(uuid, uuid, text),
  public.advance_game(uuid, uuid, text),
  public.submit_score(uuid, uuid, text, text, integer, integer)
to anon, authenticated;
