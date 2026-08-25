-- Arena housekeeping + multiplayer Scribble.
--
-- 1. Stale-room cleanup: abandoned "Waiting" rooms accumulate forever. A
--    maintenance RPC prunes them and the migration also removes any that are
--    already stuck. The client calls the RPC when opening the arena setup so
--    the table stays tidy going forward.
--
-- 2. A shared finalize_arena_game() helper centralizes per-game ranking so
--    submit_score and the scribble flow cannot diverge.
--
-- 3. Multiplayer Scribble: one player draws a secret word while everyone else
--    guesses in realtime. The first correct guesser scores. The drawer
--    changes each round until every player has drawn once; the whole thing
--    counts as a single arena game.

-- ---------------------------------------------------------------------------
-- 1. Stale room cleanup
-- ---------------------------------------------------------------------------

create or replace function public.cleanup_stale_rooms(p_older_than_hours integer default 6)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  delete from rooms
  where status = 'Waiting'
    and created_at < now() - make_interval(hours => greatest(1, p_older_than_hours));
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Remove rooms already stuck in Waiting (a waiting room older than 1 hour is
-- abandoned; e.g. rooms left over from yesterday).
select public.cleanup_stale_rooms(1);

-- ---------------------------------------------------------------------------
-- 2. Shared finalize helper
-- ---------------------------------------------------------------------------

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
  set status = case when v_is_last then 'Finished' else 'Between Games' end
  where id = p_room_id;

  return v_is_last;
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
  v_scores jsonb;
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
    v_is_last := public.finalize_arena_game(p_room_id);
  end if;

  return jsonb_build_object('allDone', v_all_done, 'isLastGame', v_is_last);
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Multiplayer Scribble
-- ---------------------------------------------------------------------------

alter table public.rooms
  add column if not exists scribble_draw_idx integer not null default 0,
  add column if not exists scribble_word text,
  add column if not exists scribble_round_active boolean not null default false,
  add column if not exists scribble_round_winner_id uuid,
  add column if not exists scribble_round_started_at timestamptz;

alter table public.players
  add column if not exists scribble_points integer not null default 0;

create or replace function public.begin_scribble_round(
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
  v_drawer players;
  v_total integer;
  v_word text;
  v_is_drawer boolean;
  v_winner_name text;
  v_words text[] := array[
    'sun','tree','house','cat','star','heart','flower','fish','cloud','mountain',
    'car','boat','bird','moon','apple','book','chair','clock','dog','duck',
    'egg','fire','gift','hat','ice','key','lamp','lion','mouse','nose',
    'owl','pizza','queen','rainbow','snow','turtle','umbrella','violin','water','watch',
    'anchor','balloon','banana','bicycle','castle','dragon','elephant','grapes','hammer','island',
    'jacket','kite','ladder','monkey','nest','orange','penguin','rabbit','rocket','ship'
  ];
begin
  select * into v_room from rooms where id = p_room_id for update;
  if not found then
    raise exception 'Room not found.' using errcode = 'A0100';
  end if;
  if not exists (
    select 1 from players
    where id = p_player_id
      and room_id = p_room_id
      and player_token_hash = encode(extensions.digest(p_player_token, 'sha256'), 'hex')
  ) then
    raise exception 'Player authorization failed.' using errcode = 'A0101';
  end if;
  if (v_room.game_ids ->> v_room.current_game_index) <> 'scribble' then
    raise exception 'This is not the scribble game.' using errcode = 'A0102';
  end if;
  if v_room.status <> 'Playing' then
    raise exception 'The arena is not in progress.' using errcode = 'A0104';
  end if;

  select count(*) into v_total from players where room_id = p_room_id;
  if v_total = 0 then
    raise exception 'No players in this room.' using errcode = 'A0103';
  end if;

  -- Start the round if one is not already active (the current draw index is
  -- kept across rounds and starts at 0 when the scribble game begins).
  if not v_room.scribble_round_active then
    v_word := v_words[1 + floor(random() * array_length(v_words, 1))::int];
    update rooms
    set scribble_round_active = true,
        scribble_word = v_word,
        scribble_round_winner_id = null,
        scribble_round_started_at = now()
    where id = p_room_id;
    select * into v_room from rooms where id = p_room_id;
  end if;

  select * into v_drawer
  from players
  where room_id = p_room_id
  order by created_at asc
  offset (v_room.scribble_draw_idx % v_total)
  limit 1;

  v_is_drawer := v_drawer.id = p_player_id;

  select name into v_winner_name
  from players where id = v_room.scribble_round_winner_id;

  return jsonb_build_object(
    'drawIdx', v_room.scribble_draw_idx,
    'totalPlayers', v_total,
    'drawerId', v_drawer.id,
    'drawerName', v_drawer.name,
    'youAreDrawer', v_is_drawer,
    'word', case when v_is_drawer then v_room.scribble_word else null end,
    'roundWinnerName', v_winner_name,
    'roundResolved', v_room.scribble_round_winner_id is not null
  );
end;
$$;

create or replace function public.submit_scribble_guess(
  p_room_id uuid,
  p_player_id uuid,
  p_player_token text,
  p_guess text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room rooms;
  v_drawer players;
  v_total integer;
  v_lower text;
  v_correct boolean;
begin
  select * into v_room from rooms where id = p_room_id for update;
  if not found then
    raise exception 'Room not found.' using errcode = 'A0110';
  end if;
  if not exists (
    select 1 from players
    where id = p_player_id
      and room_id = p_room_id
      and player_token_hash = encode(extensions.digest(p_player_token, 'sha256'), 'hex')
  ) then
    raise exception 'Player authorization failed.' using errcode = 'A0111';
  end if;
  if v_room.status <> 'Playing' or not v_room.scribble_round_active or v_room.scribble_word is null then
    raise exception 'This round is not accepting guesses.' using errcode = 'A0112';
  end if;

  select count(*) into v_total from players where room_id = p_room_id;
  select * into v_drawer
  from players
  where room_id = p_room_id
  order by created_at asc
  offset (v_room.scribble_draw_idx % v_total)
  limit 1;
  if v_drawer.id = p_player_id then
    raise exception 'The drawer cannot guess their own word.' using errcode = 'A0113';
  end if;

  v_lower := lower(btrim(p_guess));
  v_correct := v_lower <> '' and v_lower = lower(v_room.scribble_word);

  if v_correct and v_room.scribble_round_winner_id is null then
    update rooms set scribble_round_winner_id = p_player_id where id = p_room_id;
  end if;

  return jsonb_build_object(
    'correct', v_correct,
    'alreadyResolved', v_room.scribble_round_winner_id is not null,
    'word', case when v_correct then v_room.scribble_word else null end
  );
end;
$$;

create or replace function public.end_scribble_round(
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
  v_drawer players;
  v_player players;
  v_next_drawer players;
  v_total integer;
  v_all_done boolean := false;
  v_is_last boolean := false;
  v_winner_name text;
  v_reveal_word text;
  v_scores jsonb;
begin
  select * into v_room from rooms where id = p_room_id for update;
  if not found then
    raise exception 'Room not found.' using errcode = 'A0120';
  end if;
  if not exists (
    select 1 from players
    where id = p_player_id
      and room_id = p_room_id
      and player_token_hash = encode(extensions.digest(p_player_token, 'sha256'), 'hex')
  ) then
    raise exception 'Player authorization failed.' using errcode = 'A0121';
  end if;
  if not v_room.scribble_round_active then
    raise exception 'There is no active round to end.' using errcode = 'A0124';
  end if;

  select count(*) into v_total from players where room_id = p_room_id;
  select * into v_drawer
  from players
  where room_id = p_room_id
  order by created_at asc
  offset (v_room.scribble_draw_idx % v_total)
  limit 1;

  -- Only the drawer may end a live round; anyone may end a stalled one.
  if v_drawer.id <> p_player_id
     and v_room.scribble_round_started_at > now() - interval '90 seconds' then
    raise exception 'Only the drawer can end this round yet.' using errcode = 'A0122';
  end if;

  if v_room.scribble_round_winner_id is not null then
    select name into v_winner_name from players where id = v_room.scribble_round_winner_id;
    update players
    set scribble_points = scribble_points + 100
    where id = v_room.scribble_round_winner_id;
  end if;

  v_reveal_word := v_room.scribble_word;

  update rooms
  set scribble_draw_idx = scribble_draw_idx + 1,
      scribble_round_active = false,
      scribble_word = null,
      scribble_round_winner_id = null
  where id = p_room_id;
  select * into v_room from rooms where id = p_room_id;

  v_all_done := v_room.scribble_draw_idx >= v_total;

  if v_all_done then
    -- Everyone has drawn once: this game is over. Record each player's total
    -- scribble points as this game's raw score, mark everyone done, then run
    -- the shared finalize/ranking so the arena moves on like any other game.
    for v_player in
      select * from players where room_id = p_room_id
    loop
      v_scores := v_player.game_scores || jsonb_build_array(
        jsonb_build_object(
          'gameId', 'scribble',
          'rawScore', v_player.scribble_points,
          'timeTakenMs', 0,
          'rankedPoints', 0
        )
      );
      update players
      set game_scores = v_scores,
          current_game_score = v_player.scribble_points,
          game_done = true
      where id = v_player.id;
    end loop;

    v_is_last := public.finalize_arena_game(p_room_id);

    update players set scribble_points = 0 where room_id = p_room_id;
  end if;

  select * into v_next_drawer
  from players
  where room_id = p_room_id
  order by created_at asc
  offset (v_room.scribble_draw_idx % v_total)
  limit 1;

  return jsonb_build_object(
    'allDone', v_all_done,
    'isLastGame', v_is_last,
    'word', v_reveal_word,
    'winnerName', v_winner_name,
    'nextDrawerId', case when not v_all_done then v_next_drawer.id else null end,
    'nextDrawerName', case when not v_all_done then v_next_drawer.name else null end
  );
end;
$$;

revoke execute on function public.cleanup_stale_rooms(integer),
  public.finalize_arena_game(uuid),
  public.begin_scribble_round(uuid, uuid, text),
  public.submit_scribble_guess(uuid, uuid, text, text),
  public.end_scribble_round(uuid, uuid, text)
from public;

grant execute on function public.cleanup_stale_rooms(integer),
  public.finalize_arena_game(uuid),
  public.begin_scribble_round(uuid, uuid, text),
  public.submit_scribble_guess(uuid, uuid, text, text),
  public.end_scribble_round(uuid, uuid, text)
to anon, authenticated;
