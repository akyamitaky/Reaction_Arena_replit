import { z } from 'zod';
import { createEndpoint, Rooms, Players, ZiteError } from 'zite-integrations-backend-sdk';

export default createEndpoint({
  description: 'Get the current state of a room and its players',
  inputSchema: z.object({
    roomId: z.string(),
  }),
  outputSchema: z.object({
    room: z.object({
      id: z.string(),
      code: z.string(),
      hostName: z.string(),
      gameCount: z.number(),
      gameIDs: z.array(z.string()),
      currentGameIndex: z.number(),
      status: z.string(),
    }),
    players: z.array(z.object({
      id: z.string(),
      name: z.string(),
      totalScore: z.number(),
      gameScores: z.array(z.object({ gameId: z.string(), rawScore: z.number().optional(), score: z.number().optional(), rankedPoints: z.number().optional(), timeTakenMs: z.number().optional() })),
      currentGameScore: z.number(),
      isHost: z.boolean(),
      gameDone: z.boolean(),
    })),
  }),
  execute: async ({ input }) => {
    const room = await Rooms.findOne({ id: input.roomId });
    if (!room) throw new ZiteError({ code: 'NOT_FOUND', message: 'Room not found.' });

    const { records: players } = await Players.findAll({ filters: { room: room.id }, limit: 10 });

    return {
      room: {
        id: room.id,
        code: room.code || '',
        hostName: room.hostName || '',
        gameCount: room.gameCount || 0,
        gameIDs: JSON.parse(room.gameIDs || '[]'),
        currentGameIndex: room.currentGameIndex || 0,
        status: room.status || 'Waiting',
      },
      players: players.map(p => ({
        id: p.id,
        name: p.name || '',
        totalScore: p.totalScore || 0,
        gameScores: JSON.parse(p.gameScores || '[]'),
        currentGameScore: p.currentGameScore || 0,
        isHost: p.isHost || false,
        gameDone: p.gameDone || false,
      })).sort((a, b) => b.totalScore - a.totalScore),
    };
  },
});
