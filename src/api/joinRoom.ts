import { z } from 'zod';
import { createEndpoint, Rooms, Players, ZiteError } from 'zite-integrations-backend-sdk';

export default createEndpoint({
  description: 'Join an existing room by code',
  inputSchema: z.object({
    code: z.string(),
    playerName: z.string(),
  }),
  outputSchema: z.object({
    roomId: z.string(),
    playerId: z.string(),
    gameCount: z.number(),
  }),
  execute: async ({ input }) => {
    const room = await Rooms.findOne({ filters: { code: input.code.toUpperCase() } });
    if (!room) throw new ZiteError({ code: 'NOT_FOUND', message: 'Room not found. Check the code and try again.' });
    if (room.status !== 'Waiting') throw new ZiteError({ code: 'BAD_REQUEST', message: 'This arena has already started.' });

    const { records: existing } = await Players.findAll({ filters: { room: room.id } });
    if (existing.length >= 8) throw new ZiteError({ code: 'BAD_REQUEST', message: 'Room is full (max 8 players).' });
    if (existing.some(p => p.name?.toLowerCase() === input.playerName.toLowerCase())) {
      throw new ZiteError({ code: 'CONFLICT', message: 'Someone with that name is already in the room.' });
    }

    const player = await Players.create({
      record: {
        name: input.playerName,
        room: room.id,
        totalScore: 0,
        gameScores: JSON.stringify([]),
        currentGameScore: 0,
        isHost: false,
        gameDone: false,
      },
    });

    return { roomId: room.id, playerId: player.id, gameCount: room.gameCount || 0 };
  },
});
