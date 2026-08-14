create extension if not exists pgcrypto;

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z2-9]{5}$'),
  host_name text not null check (char_length(host_name) between 1 and 40),
  game_count integer not null check (game_count between 3 and 24),
  game_ids jsonb not null default '[]'::jsonb,
  current_game_index integer not null default 0,
  status text not null default 'Waiting' check (status in ('Waiting', 'Playing', 'Between Games', 'Finished')),
  created_at timestamptz not null default now()
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  room_id uuid not null references public.rooms(id) on delete cascade,
  total_score integer not null default 0,
  game_scores jsonb not null default '[]'::jsonb,
  current_game_score integer not null default 0,
  is_host boolean not null default false,
  game_done boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists players_room_id_idx on public.players(room_id);
create unique index if not exists players_room_name_ci_idx on public.players(room_id, lower(name));

alter table public.rooms enable row level security;
alter table public.players enable row level security;

drop policy if exists "rooms are readable for arenas" on public.rooms;
create policy "rooms are readable for arenas" on public.rooms for select to anon, authenticated using (true);
drop policy if exists "players are readable for arenas" on public.players;
create policy "players are readable for arenas" on public.players for select to anon, authenticated using (true);

grant usage on schema public to anon, authenticated;
grant select on public.rooms, public.players to anon, authenticated;

create or replace function public.arena_error(message text, error_code text default 'BAD_REQUEST')
returns jsonb language plpgsql as $$
begin
  raise exception using message = message, errcode = error_code;
end;
$$;

create or replace function public.create_room(p_host_name text, p_game_count integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_room rooms;
  v_player players;
  v_code text;
  v_games jsonb;
begin
  if p_host_name is null or char_length(trim(p_host_name)) = 0 then
    raise exception 'Player name is required';
  end if;
  if p_game_count < 3 or p_game_count > 24 then
    raise exception 'Game count must be between 3 and 24';
  end if;
  v_code := '';
  for i in 1..5 loop
    v_code := v_code || substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::int, 1);
  end loop;
  while exists (select 1 from rooms where code = v_code) loop
    v_code := substr(md5(random()::text), 1, 5);
  end loop;
  select jsonb_agg(game.id order by random()) into v_games
  from (values
    ('color'), ('memory'), ('math'), ('reflex'), ('catch'), ('reverse'), ('count'), ('sequence'), ('emoji'), ('stroop'), ('oddone'),
    ('scramble'), ('impostor'), ('chain'), ('riddles'),
    ('missingnum'), ('emojitalk'), ('truefalse'), ('colormem'), ('speedtype'), ('tilematch'), ('scribble'), ('shapes'), ('wordhunt')
  ) as game(id);
  v_games := (select jsonb_agg(value) from jsonb_array_elements(v_games) with ordinality as x(value, n) where n <= p_game_count);
  insert into rooms(code, host_name, game_count, game_ids) values (v_code, trim(p_host_name), p_game_count, v_games) returning * into v_room;
  insert into players(name, room_id, is_host) values (trim(p_host_name), v_room.id, true) returning * into v_player;
  return jsonb_build_object('roomId', v_room.id, 'roomCode', v_room.code, 'playerId', v_player.id);
end;
$$;

create or replace function public.join_room(p_code text, p_player_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_room rooms; v_player players;
begin
  select * into v_room from rooms where code = upper(trim(p_code)) for update;
  if not found then raise exception 'Room not found. Check the code and try again.'; end if;
  if v_room.status <> 'Waiting' then raise exception 'This arena has already started.'; end if;
  if (select count(*) from players where room_id = v_room.id) >= 8 then raise exception 'Room is full (max 8 players).'; end if;
  if exists (select 1 from players where room_id = v_room.id and lower(name) = lower(trim(p_player_name))) then
    raise exception 'Someone with that name is already in the room.';
  end if;
  insert into players(name, room_id) values (trim(p_player_name), v_room.id) returning * into v_player;
  return jsonb_build_object('roomId', v_room.id, 'playerId', v_player.id, 'gameCount', v_room.game_count);
end;
$$;

create or replace function public.start_arena(p_room_id uuid, p_player_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from players where id = p_player_id and room_id = p_room_id and is_host) then
    raise exception 'Only the host can start.';
  end if;
  if (select count(*) from players where room_id = p_room_id) < 2 then
    raise exception 'Need at least 2 players to start.';
  end if;
  update rooms set status = 'Playing', current_game_index = 0 where id = p_room_id;
  return jsonb_build_object('success', true);
end;
$$;

create or replace function public.advance_game(p_room_id uuid, p_player_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from players where id = p_player_id and room_id = p_room_id and is_host) then
    raise exception 'Only the host can advance.';
  end if;
  update rooms set current_game_index = current_game_index + 1, status = 'Playing' where id = p_room_id;
  update players set game_done = false, current_game_score = 0 where room_id = p_room_id;
  return jsonb_build_object('success', true);
end;
$$;

create or replace function public.submit_score(p_room_id uuid, p_player_id uuid, p_game_id text, p_score integer, p_time_taken_ms integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_room rooms; v_player players; v_all_done boolean; v_is_last boolean; v_total integer;
  v_item jsonb; v_scores jsonb; v_ranked integer; v_rank integer;
begin
  select * into v_room from rooms where id = p_room_id for update;
  if not found then raise exception 'Room not found.'; end if;
  select * into v_player from players where id = p_player_id and room_id = p_room_id for update;
  if not found then raise exception 'Player not found.'; end if;
  v_is_last := v_room.current_game_index >= jsonb_array_length(v_room.game_ids) - 1;
  if not v_player.game_done then
    v_scores := v_player.game_scores || jsonb_build_array(jsonb_build_object('gameId', p_game_id, 'rawScore', p_score, 'timeTakenMs', p_time_taken_ms, 'rankedPoints', 0));
    update players set game_scores = v_scores, current_game_score = p_score, game_done = true where id = p_player_id;
  end if;
  select count(*) = count(*) filter (where game_done) into v_all_done from players where room_id = p_room_id;
  if v_all_done then
    select count(*) into v_total from players where room_id = p_room_id;
    v_rank := 1;
    for v_player in select * from players where room_id = p_room_id order by
      case when ((game_scores -> -1 ->> 'rawScore')::integer) > 0 then 0 else 1 end,
      coalesce((game_scores -> -1 ->> 'timeTakenMs')::integer, 99999)
    loop
      if ((v_player.game_scores -> -1 ->> 'rawScore')::integer) > 0 then
        v_ranked := v_total - v_rank + 1;
      else
        v_ranked := 0;
      end if;
      v_scores := jsonb_set(v_player.game_scores, '{-1,rankedPoints}', to_jsonb(v_ranked), true);
      update players set game_scores = v_scores, total_score = total_score + v_ranked, current_game_score = v_ranked where id = v_player.id;
      if v_ranked > 0 then
        v_rank := v_rank + 1;
      end if;
    end loop;
    update rooms set status = case when v_is_last then 'Finished' else 'Between Games' end where id = p_room_id;
  end if;
  return jsonb_build_object('allDone', v_all_done, 'isLastGame', v_is_last);
end;
$$;

grant execute on function public.create_room(text, integer), public.join_room(text, text), public.start_arena(uuid, uuid), public.advance_game(uuid, uuid), public.submit_score(uuid, uuid, text, integer, integer) to anon, authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_publication p on p.oid = pr.prpubid
    where p.pubname = 'supabase_realtime'
      and n.nspname = 'public'
      and c.relname = 'rooms'
  ) then
    alter publication supabase_realtime add table public.rooms;
  end if;

  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_publication p on p.oid = pr.prpubid
    where p.pubname = 'supabase_realtime'
      and n.nspname = 'public'
      and c.relname = 'players'
  ) then
    alter publication supabase_realtime add table public.players;
  end if;
end;
$$;