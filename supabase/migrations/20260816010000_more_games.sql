-- Add 8 new game modes and raise the arena game-count cap from 27 to 35.

alter table public.rooms drop constraint if exists rooms_game_count_check;
alter table public.rooms add constraint rooms_game_count_check check (game_count between 3 and 35);

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
  if p_game_count is null or p_game_count < 3 or p_game_count > 35 then
    raise exception 'Game count must be between 3 and 35' using errcode = 'A0003';
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
    ('whack'), ('treasure'), ('duel'),
    ('series'), ('vowels'), ('alpha'), ('colormix'), ('clock'), ('roman'), ('palindrome'), ('spelling')
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

revoke execute on function public.create_room(text, integer) from public;
grant execute on function public.create_room(text, integer) to anon, authenticated;
