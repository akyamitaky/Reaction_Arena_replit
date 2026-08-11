-- Multiplayer sync hardening.
--
-- This migration keeps the existing anonymous-player model, but makes the
-- room state machine authoritative and makes score submission idempotent.

create or replace function public.start_arena(p_room_id uuid, p_player_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_room rooms;
begin
  select * into v_room from rooms where id = p_room_id for update;
  if not found then
    raise exception 'Room not found.';
  end if;
  if v_room.status <> 'Waiting' then
    raise exception 'This arena has already started.';
  end if;
  if not exists (
    select 1 from players
    where id = p_player_id and room_id = p_room_id and is_host
  ) then
    raise exception 'Only the host can start.';
  end if;
  if (select count(*) from players where room_id = p_room_id) < 2 then
    raise exception 'Need at least 2 players to start.';
  end if;

  update rooms
  set status = 'Playing', current_game_index = 0
  where id = p_room_id;

  return jsonb_build_object('success', true);
end;
$$;

create or replace function public.advance_game(p_room_id uuid, p_player_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_room rooms;
begin
  select * into v_room from rooms where id = p_room_id for update;
  if not found then
    raise exception 'Room not found.';
  end if;
  if not exists (
    select 1 from players
    where id = p_player_id and room_id = p_room_id and is_host
  ) then
    raise exception 'Only the host can advance.';
  end if;
  if v_room.status <> 'Between Games' then
    raise exception 'The next game is not ready yet.';
  end if;
  if v_room.current_game_index >= jsonb_array_length(v_room.game_ids) - 1 then
    raise exception 'There are no more games.';
  end if;
  if exists (
    select 1 from players
    where room_id = p_room_id and not game_done
  ) then
    raise exception 'Waiting for all players to finish.';
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
  p_game_id text,
  p_score integer,
  p_time_taken_ms integer
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_room rooms;
  v_player players;
  v_all_done boolean;
  v_is_last boolean;
  v_total integer;
  v_item jsonb;
  v_scores jsonb;
  v_ranked integer;
  v_rank integer;
begin
  select * into v_room from rooms where id = p_room_id for update;
  if not found then
    raise exception 'Room not found.';
  end if;

  select * into v_player
  from players
  where id = p_player_id and room_id = p_room_id
  for update;
  if not found then
    raise exception 'Player not found.';
  end if;

  v_is_last := v_room.current_game_index >= jsonb_array_length(v_room.game_ids) - 1;

  -- A retried request after a lost network response is safe. Return the
  -- authoritative state instead of rejecting an already-committed score.
  if v_player.game_done then
    select count(*) = count(*) filter (where game_done)
    into v_all_done
    from players where room_id = p_room_id;
    return jsonb_build_object('allDone', v_all_done, 'isLastGame', v_is_last);
  end if;

  if v_room.status <> 'Playing' then
    raise exception 'This game is not accepting scores.';
  end if;
  if p_game_id is null or p_game_id <> (v_room.game_ids ->> v_room.current_game_index) then
    raise exception 'This score belongs to a different game.';
  end if;
  if p_score is null or p_score < 0 then
    raise exception 'Score must be a non-negative integer.';
  end if;
  if p_time_taken_ms is null or p_time_taken_ms < 0 or p_time_taken_ms > 120000 then
    raise exception 'Invalid game duration.';
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

grant execute on function public.start_arena(uuid, uuid),
  public.advance_game(uuid, uuid),
  public.submit_score(uuid, uuid, text, integer, integer)
to anon, authenticated;