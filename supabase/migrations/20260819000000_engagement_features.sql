-- Engagement features:
-- 1. Profiles gain achievements, a rolling weekly XP bucket, and an avatar
--    color so leaderboards and profile cards can show unlocks.
-- 2. Async "Beat my score" challenges: a player posts a score and shares a
--    code; friends play the same mode and their results are recorded back.

alter table public.profiles
  add column if not exists achievements text[] not null default '{}',
  add column if not exists weekly_xp integer not null default 0,
  add column if not exists weekly_xp_week text,
  add column if not exists avatar_color text;

-- Rolling weekly XP: when a new ISO week starts, the bucket resets.
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
  v_week text;
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

  v_week := to_char(now(), 'IYYY-IW');

  update profiles
  set xp = xp + coalesce(p_xp, 0),
      weekly_xp = case when weekly_xp_week is distinct from v_week then coalesce(p_xp, 0) else weekly_xp + coalesce(p_xp, 0) end,
      weekly_xp_week = v_week,
      games_played = games_played + coalesce(p_games_played, 0),
      arenas_played = arenas_played + coalesce(p_arenas_played, 0),
      arena_wins = arena_wins + coalesce(p_arena_wins, 0),
      best_scores = v_best,
      updated_at = now()
  where id = p_profile_id;

  return jsonb_build_object('success', true);
end;
$$;

create or replace function public.grant_achievements(
  p_profile_id uuid,
  p_profile_token text,
  p_achievements text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing text[];
begin
  select achievements into v_existing
  from profiles
  where id = p_profile_id
    and profile_token_hash = encode(extensions.digest(p_profile_token, 'sha256'), 'hex');

  if not found then
    raise exception 'Profile authorization failed.' using errcode = 'A0210';
  end if;

  if p_achievements is not null and cardinality(p_achievements) > 0 then
    update profiles
    set achievements = (
      select array_agg(distinct a order by a)
      from unnest(v_existing || p_achievements) a
    ),
        updated_at = now()
    where id = p_profile_id;
  end if;

  return jsonb_build_object('success', true);
end;
$$;

-- ---------------------------------------------------------------------------
-- Weekly leaderboard
-- ---------------------------------------------------------------------------

create or replace function public.get_weekly_leaderboard(p_limit integer)
returns table (
  id uuid,
  name text,
  weekly_xp integer,
  games_played integer,
  arenas_played integer,
  arena_wins integer,
  best_scores jsonb,
  achievements text[]
)
language sql
security definer
set search_path = public
as $$
  select id, name, weekly_xp, games_played, arenas_played, arena_wins, best_scores, achievements
  from profiles
  where weekly_xp_week = to_char(now(), 'IYYY-IW')
  order by weekly_xp desc, id
  limit p_limit;
$$;

-- ---------------------------------------------------------------------------
-- Async "Beat my score" challenges
-- ---------------------------------------------------------------------------

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  game_id text not null,
  target_score integer not null,
  challenger_name text not null,
  target_name text,
  results jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.challenges enable row level security;

create or replace function public.create_challenge(
  p_game_id text,
  p_target_score integer,
  p_challenger_name text,
  p_target_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_challenge_id uuid;
  v_clean_name text;
begin
  if p_game_id is null or char_length(p_game_id) = 0 then
    raise exception 'A game is required.' using errcode = 'A0300';
  end if;
  if p_target_score is null or p_target_score < 0 then
    raise exception 'A valid target score is required.' using errcode = 'A0301';
  end if;
  v_clean_name := nullif(btrim(p_challenger_name), '');
  if v_clean_name is null then
    raise exception 'Your name is required.' using errcode = 'A0302';
  end if;
  if char_length(v_clean_name) > 40 then
    raise exception 'Name must be 40 characters or fewer.' using errcode = 'A0303';
  end if;

  loop
    select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::int, 1), '')
    into v_code
    from generate_series(1, 5);
    exit when not exists (select 1 from challenges where code = v_code);
  end loop;

  insert into challenges (code, game_id, target_score, challenger_name, target_name)
  values (v_code, p_game_id, p_target_score, v_clean_name, nullif(btrim(p_target_name), ''))
  returning id into v_challenge_id;

  return jsonb_build_object('challengeId', v_challenge_id, 'code', v_code);
end;
$$;

create or replace function public.get_challenge(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_challenge challenges;
begin
  select * into v_challenge from challenges where code = upper(trim(p_code));
  if not found then
    raise exception 'Challenge not found. Check the code and try again.' using errcode = 'A0310';
  end if;
  return jsonb_build_object(
    'challengeId', v_challenge.id,
    'code', v_challenge.code,
    'gameId', v_challenge.game_id,
    'targetScore', v_challenge.target_score,
    'challengerName', v_challenge.challenger_name,
    'targetName', v_challenge.target_name
  );
end;
$$;

create or replace function public.submit_challenge_result(
  p_code text,
  p_player_name text,
  p_score integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_challenge challenges;
  v_results jsonb;
  v_clean_name text;
  v_beat boolean;
  v_found boolean := false;
  v_row jsonb;
  v_replaced jsonb;
begin
  v_clean_name := nullif(btrim(p_player_name), '');
  if v_clean_name is null then
    raise exception 'Your name is required.' using errcode = 'A0320';
  end if;
  if char_length(v_clean_name) > 40 then
    raise exception 'Name must be 40 characters or fewer.' using errcode = 'A0321';
  end if;
  if p_score is null or p_score < 0 then
    raise exception 'A valid score is required.' using errcode = 'A0322';
  end if;

  select * into v_challenge
  from challenges
  where code = upper(trim(p_code))
  for update;
  if not found then
    raise exception 'Challenge not found. Check the code and try again.' using errcode = 'A0310';
  end if;

  v_results := v_challenge.results;

  -- Keep at most one result per player name (re-run overwrites).
  v_replaced := '[]'::jsonb;
  for v_row in select * from jsonb_array_elements(v_results)
  loop
    if v_row ->> 'playerName' = v_clean_name then
      v_found := true;
      v_replaced := v_replaced || jsonb_build_object('playerName', v_clean_name, 'score', p_score, 'at', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS'));
    else
      v_replaced := v_replaced || v_row;
    end if;
  end loop;
  if not v_found then
    v_replaced := v_replaced || jsonb_build_object('playerName', v_clean_name, 'score', p_score, 'at', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS'));
  end if;

  update challenges
  set results = v_replaced
  where id = v_challenge.id;

  v_beat := p_score > v_challenge.target_score;

  return jsonb_build_object(
    'beat', v_beat,
    'targetScore', v_challenge.target_score,
    'score', p_score,
    'results', v_replaced
  );
end;
$$;

create or replace function public.get_challenge_results(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_challenge challenges;
begin
  select * into v_challenge from challenges where code = upper(trim(p_code));
  if not found then
    raise exception 'Challenge not found. Check the code and try again.' using errcode = 'A0310';
  end if;
  return jsonb_build_object(
    'targetScore', v_challenge.target_score,
    'challengerName', v_challenge.challenger_name,
    'results', v_challenge.results
  );
end;
$$;

revoke execute on function public.record_profile_activity(uuid, text, integer, integer, integer, integer, jsonb),
  public.grant_achievements(uuid, text, text[]),
  public.get_weekly_leaderboard(integer),
  public.create_challenge(text, integer, text, text),
  public.get_challenge(text),
  public.submit_challenge_result(text, text, integer),
  public.get_challenge_results(text)
from public;

grant execute on function public.record_profile_activity(uuid, text, integer, integer, integer, integer, jsonb),
  public.grant_achievements(uuid, text, text[]),
  public.get_weekly_leaderboard(integer),
  public.create_challenge(text, integer, text, text),
  public.get_challenge(text),
  public.submit_challenge_result(text, text, integer),
  public.get_challenge_results(text)
to anon, authenticated;
