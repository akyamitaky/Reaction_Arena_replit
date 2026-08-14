-- Keep new multiplayer rooms limited to reaction, puzzle, and creative games.
-- This replaces the already-deployed room creator for existing Supabase projects.
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
    raise exception 'Player name is required';
  end if;
  if char_length(trim(p_host_name)) > 40 then
    raise exception 'Player name must be 40 characters or fewer';
  end if;
  if p_game_count is null or p_game_count < 3 or p_game_count > 27 then
    raise exception 'Game count must be between 3 and 27';
  end if;

  loop
    select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::int, 1), '')
    into v_code
    from generate_series(1, 5);
    exit when not exists (select 1 from rooms where code = v_code);
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

  insert into rooms(code, host_name, game_count, game_ids)
  values (v_code, trim(p_host_name), p_game_count, v_games)
  returning * into v_room;

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