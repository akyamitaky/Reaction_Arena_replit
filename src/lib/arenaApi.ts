import { supabase, requireSupabase } from './supabase';

export interface GameScore {
  gameId: string;
  rawScore?: number;
  score?: number;
  rankedPoints?: number;
  timeTakenMs?: number;
}

export interface Room {
  id: string;
  code: string;
  hostName: string;
  gameCount: number;
  gameIDs: string[];
  currentGameIndex: number;
  status: string;
}

export interface Player {
  id: string;
  name: string;
  totalScore: number;
  gameScores: GameScore[];
  currentGameScore: number;
  isHost: boolean;
  gameDone: boolean;
}

export interface RoomState {
  room: Room;
  players: Player[];
}

type RoomRow = {
  id: string;
  code: string;
  host_name: string;
  game_count: number;
  game_ids: string[] | null;
  current_game_index: number;
  status: string;
};

type PlayerRow = {
  id: string;
  name: string;
  total_score: number;
  game_scores: GameScore[] | null;
  current_game_score: number;
  is_host: boolean;
  game_done: boolean;
};

interface PostgrestErrorLike {
  code?: string;
  message?: string;
}

/** SQLSTATE codes that indicate the security migration is not deployed. */
const MIGRATION_MISSING_CODES = new Set(['P0001', 'P0002', '42883', '42704']);

/** SQLSTATE prefixes for authorization failures on mutating RPCs. */
const AUTH_ERROR_CODES = new Set(['A0022', 'A0031', 'A0041']);

export function asError(error: PostgrestErrorLike | null) {
  const message = error?.message || '';
  const code = error?.code || '';

  const isMigrationMissing =
    MIGRATION_MISSING_CODES.has(code) ||
    message.includes('Could not find the function public.create_room') ||
    message.includes('schema cache');
  if (isMigrationMissing) {
    return new Error(
      'Multiplayer is almost configured. Run all SQL files in supabase/migrations/ in your Supabase SQL Editor, then try again.',
    );
  }

  const isAuthFailure =
    AUTH_ERROR_CODES.has(code) ||
    message.includes('Only the host can start.') ||
    message.includes('Only the host can advance.') ||
    message.includes('Player authorization failed.');
  if (isAuthFailure) {
    return new Error(
      'This lobby session is missing a valid player token. Refresh the app and create or join a new room after applying the latest migration.',
    );
  }

  // Remaining server messages are authored to be user-friendly.
  return new Error(message || 'Something went wrong. Please try again.');
}

function readPlayerToken(value: unknown) {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/i.test(value)) {
    throw new Error('Multiplayer needs the latest security migration. Refresh the app and create or join a new room.');
  }
  return value;
}

function mapRoom(row: RoomRow): Room {
  return {
    id: row.id,
    code: row.code || '',
    hostName: row.host_name || '',
    gameCount: row.game_count || 0,
    gameIDs: row.game_ids || [],
    currentGameIndex: row.current_game_index || 0,
    status: row.status || 'Waiting',
  };
}

function mapPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    name: row.name || '',
    totalScore: row.total_score || 0,
    gameScores: row.game_scores || [],
    currentGameScore: row.current_game_score || 0,
    isHost: row.is_host || false,
    gameDone: row.game_done || false,
  };
}

export async function getRoomState({ roomId }: { roomId: string }): Promise<RoomState> {
  const client = requireSupabase();
  const [{ data: room, error: roomError }, { data: players, error: playersError }] = await Promise.all([
    client
      .from('rooms')
      .select('id, code, host_name, game_count, game_ids, current_game_index, status')
      .eq('id', roomId)
      .single(),
    client
      .from('players')
      .select('id, name, total_score, game_scores, current_game_score, is_host, game_done')
      .eq('room_id', roomId)
      .order('total_score', { ascending: false }),
  ]);
  if (roomError) throw asError(roomError);
  if (playersError) throw asError(playersError);
  return { room: mapRoom(room as RoomRow), players: (players as PlayerRow[]).map(mapPlayer) };
}

export async function createRoom(input: { hostName: string; gameCount: number }) {
  const { data, error } = await requireSupabase().rpc('create_room', {
    p_host_name: input.hostName,
    p_game_count: input.gameCount,
  });
  if (error) throw asError(error);
  const result = data as { roomId: string; roomCode: string; playerId: string; playerToken?: unknown };
  return { ...result, playerToken: readPlayerToken(result.playerToken) };
}

export async function joinRoom(input: { code: string; playerName: string }) {
  const { data, error } = await requireSupabase().rpc('join_room', {
    p_code: input.code.toUpperCase(),
    p_player_name: input.playerName,
  });
  if (error) throw asError(error);
  const result = data as { roomId: string; playerId: string; playerToken?: unknown; gameCount: number };
  return { ...result, playerToken: readPlayerToken(result.playerToken) };
}

export async function startArena(input: { roomId: string; playerId: string; playerToken: string }) {
  const { data, error } = await requireSupabase().rpc('start_arena', {
    p_room_id: input.roomId,
    p_player_id: input.playerId,
    p_player_token: input.playerToken,
  });
  if (error) throw asError(error);
  return data as { success: boolean };
}

export async function advanceGame(input: { roomId: string; playerId: string; playerToken: string }) {
  const { data, error } = await requireSupabase().rpc('advance_game', {
    p_room_id: input.roomId,
    p_player_id: input.playerId,
    p_player_token: input.playerToken,
  });
  if (error) throw asError(error);
  return data as { success: boolean };
}

/**
 * Advances the room automatically once every player has finished and a grace
 * period has elapsed. Any player in the room may trigger it, so a host that
 * leaves mid-arena no longer stalls the game.
 */
export async function autoAdvanceRoom(input: { roomId: string; playerId: string; playerToken: string }) {
  const { data, error } = await requireSupabase().rpc('auto_advance_room', {
    p_room_id: input.roomId,
    p_player_id: input.playerId,
    p_player_token: input.playerToken,
  });
  if (error) throw asError(error);
  return data as { advanced: boolean; reason?: string };
}

export async function submitScore(input: {
  roomId: string;
  playerId: string;
  playerToken: string;
  gameId: string;
  score: number;
  timeTakenMs: number;
}) {
  const { data, error } = await requireSupabase().rpc('submit_score', {
    p_room_id: input.roomId,
    p_player_id: input.playerId,
    p_player_token: input.playerToken,
    p_game_id: input.gameId,
    p_score: input.score,
    p_time_taken_ms: input.timeTakenMs,
  });
  if (error) throw asError(error);
  return data as { allDone: boolean; isLastGame: boolean };
}

export function subscribeToRoom(roomId: string, onChange: () => void) {
  const client = supabase;
  if (!client) return () => undefined;
  let refreshTimer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;
  const scheduleRefresh = () => {
    if (disposed || refreshTimer) return;
    refreshTimer = setTimeout(() => {
      refreshTimer = undefined;
      if (!disposed) onChange();
    }, 100);
  };
  const channel = client
    .channel(`reaction-arena:${roomId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
      scheduleRefresh,
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` },
      scheduleRefresh,
    )
    .subscribe();
  return () => {
    disposed = true;
    if (refreshTimer) clearTimeout(refreshTimer);
    void client.removeChannel(channel);
  };
}

// ---------------------------------------------------------------------------
// Multiplayer Scribble
// ---------------------------------------------------------------------------

export interface ScribbleRoundState {
  drawIdx: number;
  totalPlayers: number;
  drawerId: string;
  drawerName: string;
  youAreDrawer: boolean;
  word: string | null;
  roundWinnerName: string | null;
  roundResolved: boolean;
}

export type ScribbleStroke = {
  x: number;
  y: number;
  /** 'down' starts a new path, 'move' extends it, 'clear' wipes the board. */
  type: 'down' | 'move' | 'clear';
  color?: string;
  /** Round the stroke belongs to, so late joiners skip stale strokes. */
  drawIdx: number;
};

export async function cleanupStaleRooms(olderThanHours = 6) {
  const { error } = await requireSupabase().rpc('cleanup_stale_rooms', {
    p_older_than_hours: olderThanHours,
  });
  if (error) throw asError(error);
}

export async function beginScribbleRound(input: {
  roomId: string;
  playerId: string;
  playerToken: string;
}): Promise<ScribbleRoundState> {
  const { data, error } = await requireSupabase().rpc('begin_scribble_round', {
    p_room_id: input.roomId,
    p_player_id: input.playerId,
    p_player_token: input.playerToken,
  });
  if (error) throw asError(error);
  return data as ScribbleRoundState;
}

export async function submitScribbleGuess(input: {
  roomId: string;
  playerId: string;
  playerToken: string;
  guess: string;
}): Promise<{ correct: boolean; alreadyResolved: boolean; word: string | null }> {
  const { data, error } = await requireSupabase().rpc('submit_scribble_guess', {
    p_room_id: input.roomId,
    p_player_id: input.playerId,
    p_player_token: input.playerToken,
    p_guess: input.guess,
  });
  if (error) throw asError(error);
  return data as { correct: boolean; alreadyResolved: boolean; word: string | null };
}

export async function endScribbleRound(input: { roomId: string; playerId: string; playerToken: string }): Promise<{
  allDone: boolean;
  isLastGame: boolean;
  word: string | null;
  winnerName: string | null;
  nextDrawerId: string | null;
  nextDrawerName: string | null;
}> {
  const { data, error } = await requireSupabase().rpc('end_scribble_round', {
    p_room_id: input.roomId,
    p_player_id: input.playerId,
    p_player_token: input.playerToken,
  });
  if (error) throw asError(error);
  return data as {
    allDone: boolean;
    isLastGame: boolean;
    word: string | null;
    winnerName: string | null;
    nextDrawerId: string | null;
    nextDrawerName: string | null;
  };
}

/** Real-time stroke relay for the shared scribble board. */
export function subscribeToScribbleStrokes(roomId: string, onStroke: (stroke: ScribbleStroke) => void) {
  const client = supabase;
  if (!client) return () => undefined;
  const channel = client
    .channel(`scribble:${roomId}`)
    .on('broadcast', { event: 'stroke' }, ({ payload }) => {
      onStroke(payload as ScribbleStroke);
    })
    .subscribe();
  return () => {
    void client.removeChannel(channel);
  };
}

export async function sendScribbleStroke(roomId: string, stroke: ScribbleStroke) {
  const client = supabase;
  if (!client) return;
  try {
    await client.channel(`scribble:${roomId}`).send({
      type: 'broadcast',
      event: 'stroke',
      payload: stroke,
    });
  } catch {
    // Strokes are best-effort; the drawer can still finish their turn.
  }
}
