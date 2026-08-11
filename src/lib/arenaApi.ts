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

function asError(error: { message?: string } | null) {
  const message = error?.message || '';
  if (message.includes('Could not find the function public.create_room') || message.includes('schema cache')) {
    return new Error(
      'Multiplayer is almost configured. Run supabase/migrations/20260809000000_reaction_arena.sql in your Supabase SQL Editor, then try creating the room again.',
    );
  }
  return new Error(message || 'Something went wrong. Please try again.');
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
    client.from('rooms').select('id, code, host_name, game_count, game_ids, current_game_index, status').eq('id', roomId).single(),
    client.from('players').select('id, name, total_score, game_scores, current_game_score, is_host, game_done').eq('room_id', roomId).order('total_score', { ascending: false }),
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
  return data as { roomId: string; roomCode: string; playerId: string };
}

export async function joinRoom(input: { code: string; playerName: string }) {
  const { data, error } = await requireSupabase().rpc('join_room', {
    p_code: input.code.toUpperCase(),
    p_player_name: input.playerName,
  });
  if (error) throw asError(error);
  return data as { roomId: string; playerId: string; gameCount: number };
}

export async function startArena(input: { roomId: string; playerId: string }) {
  const { data, error } = await requireSupabase().rpc('start_arena', {
    p_room_id: input.roomId,
    p_player_id: input.playerId,
  });
  if (error) throw asError(error);
  return data as { success: boolean };
}

export async function advanceGame(input: { roomId: string; playerId: string }) {
  const { data, error } = await requireSupabase().rpc('advance_game', {
    p_room_id: input.roomId,
    p_player_id: input.playerId,
  });
  if (error) throw asError(error);
  return data as { success: boolean };
}

export async function submitScore(input: {
  roomId: string;
  playerId: string;
  gameId: string;
  score: number;
  timeTakenMs: number;
}) {
  const { data, error } = await requireSupabase().rpc('submit_score', {
    p_room_id: input.roomId,
    p_player_id: input.playerId,
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
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, scheduleRefresh)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` }, scheduleRefresh)
    .subscribe();
  return () => {
    disposed = true;
    if (refreshTimer) clearTimeout(refreshTimer);
    void client.removeChannel(channel);
  };
}