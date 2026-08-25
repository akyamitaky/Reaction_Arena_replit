import { requireSupabase } from './supabase';
import { asError } from './arenaApi';
import { DAILY_XP, xpForArenaRank, xpForGradePct } from './progress';

export interface Profile {
  id: string;
  name: string;
  xp: number;
  gamesPlayed: number;
  arenasPlayed: number;
  arenaWins: number;
  bestScores: Record<string, number>;
}

type ProfileRow = {
  id: string;
  name: string;
  xp: number;
  games_played: number;
  arenas_played: number;
  arena_wins: number;
  best_scores: Record<string, number> | null;
};

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: row.name,
    xp: row.xp || 0,
    gamesPlayed: row.games_played || 0,
    arenasPlayed: row.arenas_played || 0,
    arenaWins: row.arena_wins || 0,
    bestScores: row.best_scores || {},
  };
}

const PROFILE_KEYS = {
  id: 'ra-profile-id',
  token: 'ra-profile-token',
} as const;

export function getLocalProfileId() {
  return localStorage.getItem(PROFILE_KEYS.id) || '';
}

export function getLocalProfileToken() {
  return localStorage.getItem(PROFILE_KEYS.token) || '';
}

export function hasLocalProfile() {
  return Boolean(getLocalProfileId() && getLocalProfileToken());
}

/** Create a profile on first use; subsequent calls reuse the stored identity. */
export async function ensureProfile(name: string): Promise<{ profileId: string; profileToken: string } | null> {
  const existingId = getLocalProfileId();
  const existingToken = getLocalProfileToken();
  if (existingId && existingToken) {
    return { profileId: existingId, profileToken: existingToken };
  }
  const { data, error } = await requireSupabase().rpc('create_profile', { p_name: name });
  if (error) throw asError(error);
  const result = data as { profileId: string; profileToken?: string };
  if (!result?.profileId || typeof result.profileToken !== 'string') {
    throw new Error('Could not create your profile. Refresh and try again.');
  }
  localStorage.setItem(PROFILE_KEYS.id, result.profileId);
  localStorage.setItem(PROFILE_KEYS.token, result.profileToken);
  return { profileId: result.profileId, profileToken: result.profileToken };
}

export async function recordProfileActivity(input: {
  xp?: number;
  gamesPlayed?: number;
  arenasPlayed?: number;
  arenaWins?: number;
  bestScores?: Record<string, number>;
}): Promise<void> {
  const profileId = getLocalProfileId();
  const profileToken = getLocalProfileToken();
  if (!profileId || !profileToken) return;
  const { error } = await requireSupabase().rpc('record_profile_activity', {
    p_profile_id: profileId,
    p_profile_token: profileToken,
    p_xp: input.xp ?? 0,
    p_games_played: input.gamesPlayed ?? 0,
    p_arenas_played: input.arenasPlayed ?? 0,
    p_arena_wins: input.arenaWins ?? 0,
    p_best_scores: input.bestScores ?? {},
  });
  if (error) throw asError(error);
}

/** Best-effort sync that never blocks or throws for the user. */
export function syncProfile(input: {
  xp?: number;
  gamesPlayed?: number;
  arenasPlayed?: number;
  arenaWins?: number;
  bestScores?: Record<string, number>;
}) {
  recordProfileActivity(input).catch(() => {
    // Offline or not configured: local progress is the source of truth.
  });
}

export async function getLeaderboard(limit = 10): Promise<Profile[]> {
  const { data, error } = await requireSupabase()
    .from('profiles')
    .select('id, name, xp, games_played, arenas_played, arena_wins, best_scores')
    .order('xp', { ascending: false })
    .limit(limit);
  if (error) throw asError(error);
  return (data as ProfileRow[]).map(mapProfile);
}

export async function getProfile(profileId: string): Promise<Profile | null> {
  const { data, error } = await requireSupabase()
    .from('profiles')
    .select('id, name, xp, games_played, arenas_played, arena_wins, best_scores')
    .eq('id', profileId)
    .maybeSingle();
  if (error) throw asError(error);
  return data ? mapProfile(data as ProfileRow) : null;
}

// ---------------------------------------------------------------------------
// Engagement: achievements, weekly leaderboard, async challenges
// ---------------------------------------------------------------------------

/** Best-effort push of newly earned achievement ids. Never blocks the UI. */
export function syncAchievements(achievementIds: string[]) {
  const profileId = getLocalProfileId();
  const profileToken = getLocalProfileToken();
  if (!profileId || !profileToken || achievementIds.length === 0) return;
  Promise.resolve(
    requireSupabase().rpc('grant_achievements', {
      p_profile_id: profileId,
      p_profile_token: profileToken,
      p_achievements: achievementIds,
    }),
  )
    .then(() => {
      // Best-effort push; nothing to do on success.
    })
    .catch(() => {
      // Offline or not configured: local storage keeps the unlocked set.
    });
}

export interface WeeklyEntry {
  id: string;
  name: string;
  weeklyXp: number;
  gamesPlayed: number;
  arenasPlayed: number;
  arenaWins: number;
  bestScores: Record<string, number>;
  achievements: string[];
}

type WeeklyRow = {
  id: string;
  name: string;
  weekly_xp: number;
  games_played: number;
  arenas_played: number;
  arena_wins: number;
  best_scores: Record<string, number> | null;
  achievements: string[] | null;
};

function mapWeeklyEntry(row: WeeklyRow): WeeklyEntry {
  return {
    id: row.id,
    name: row.name,
    weeklyXp: row.weekly_xp || 0,
    gamesPlayed: row.games_played || 0,
    arenasPlayed: row.arenas_played || 0,
    arenaWins: row.arena_wins || 0,
    bestScores: row.best_scores || {},
    achievements: row.achievements || [],
  };
}

export async function getWeeklyLeaderboard(limit = 10): Promise<WeeklyEntry[]> {
  const { data, error } = await requireSupabase().rpc('get_weekly_leaderboard', { p_limit: limit });
  if (error) throw asError(error);
  return (data as WeeklyRow[]).map(mapWeeklyEntry);
}

export interface ChallengeInfo {
  challengeId: string;
  code: string;
  gameId: string;
  targetScore: number;
  challengerName: string;
  targetName: string | null;
}

export async function createChallenge(input: {
  gameId: string;
  targetScore: number;
  challengerName: string;
  targetName?: string;
}): Promise<{ challengeId: string; code: string }> {
  const { data, error } = await requireSupabase().rpc('create_challenge', {
    p_game_id: input.gameId,
    p_target_score: input.targetScore,
    p_challenger_name: input.challengerName,
    p_target_name: input.targetName ?? null,
  });
  if (error) throw asError(error);
  const result = data as { challengeId: string; code: string } | null;
  if (!result?.challengeId || !result.code) {
    throw new Error('Could not create the challenge. Try again.');
  }
  return result;
}

export async function getChallenge(code: string): Promise<ChallengeInfo> {
  const { data, error } = await requireSupabase().rpc('get_challenge', { p_code: code });
  if (error) throw asError(error);
  const result = data as ChallengeInfo;
  if (!result?.challengeId) throw new Error('Could not load that challenge.');
  return result;
}

export interface ChallengeResult {
  playerName: string;
  score: number;
  at: string;
}

export interface SubmitChallengeResult {
  beat: boolean;
  targetScore: number;
  score: number;
  results: ChallengeResult[];
}

export async function submitChallengeResult(input: {
  code: string;
  playerName: string;
  score: number;
}): Promise<SubmitChallengeResult> {
  const { data, error } = await requireSupabase().rpc('submit_challenge_result', {
    p_code: input.code,
    p_player_name: input.playerName,
    p_score: input.score,
  });
  if (error) throw asError(error);
  const result = data as SubmitChallengeResult;
  if (!result) throw new Error('Could not submit your result. Try again.');
  return result;
}

export async function getChallengeResults(code: string): Promise<{
  targetScore: number;
  challengerName: string;
  results: ChallengeResult[];
}> {
  const { data, error } = await requireSupabase().rpc('get_challenge_results', { p_code: code });
  if (error) throw asError(error);
  const result = data as { targetScore: number; challengerName: string; results: ChallengeResult[] } | null;
  if (!result) throw new Error('Could not load the challenge results.');
  return result;
}

// ---------------------------------------------------------------------------
// Convenience sync helpers used by the results pages
// ---------------------------------------------------------------------------

async function ensureAndRecord(input: {
  name: string;
  xp: number;
  gamesPlayed?: number;
  arenasPlayed?: number;
  arenaWins?: number;
  bestScores?: Record<string, number>;
}) {
  if (!hasLocalProfile()) {
    const identity = await ensureProfile(input.name);
    if (!identity) return;
  }
  await recordProfileActivity({
    xp: input.xp,
    gamesPlayed: input.gamesPlayed,
    arenasPlayed: input.arenasPlayed,
    arenaWins: input.arenaWins,
    bestScores: input.bestScores,
  });
}

export function syncSoloProgress(input: { name: string; score: number; gameId: string; pct: number }) {
  ensureAndRecord({
    name: input.name,
    xp: xpForGradePct(input.pct),
    gamesPlayed: 1,
    bestScores: { [input.gameId]: input.score },
  }).catch(() => {
    // Offline or not configured: local progress is the source of truth.
  });
}

export function syncDailyProgress(input: { name: string; score: number; gameId: string; pct: number }) {
  ensureAndRecord({
    name: input.name,
    xp: DAILY_XP,
    gamesPlayed: 1,
    bestScores: { [input.gameId]: input.score },
  }).catch(() => {
    // Offline or not configured: local progress is the source of truth.
  });
}

export function syncArenaProgress(input: {
  name: string;
  won: boolean;
  rank: number;
  totalPlayers: number;
  gameScores: { gameId: string; score: number }[];
}) {
  if (input.totalPlayers < 2) return;
  const bestScores: Record<string, number> = {};
  for (const g of input.gameScores) {
    bestScores[g.gameId] = Math.max(bestScores[g.gameId] || 0, g.score);
  }
  ensureAndRecord({
    name: input.name,
    xp: xpForArenaRank(input.rank, input.totalPlayers),
    arenasPlayed: 1,
    arenaWins: input.won ? 1 : 0,
    bestScores,
  }).catch(() => {
    // Offline or not configured: local progress is the source of truth.
  });
}
