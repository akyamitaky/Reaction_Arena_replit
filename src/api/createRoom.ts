import { z } from 'zod';
import { createEndpoint, Rooms, Players } from 'zite-integrations-backend-sdk';
import { gameModes } from '../lib/gameConfig';

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default createEndpoint({
  description: 'Create a new multiplayer arena room',
  inputSchema: z.object({
    hostName: z.string(),
    gameCount: z.number().min(3).max(26),
  }),
  outputSchema: z.object({
    roomId: z.string(),
    roomCode: z.string(),
    playerId: z.string(),
  }),
  execute: async ({ input }) => {
    const shuffled = [...gameModes].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, input.gameCount).map(g => g.id);
    const code = generateCode();

    const room = await Rooms.create({
      record: {
        code,
        hostName: input.hostName,
        gameCount: input.gameCount,
        gameIDs: JSON.stringify(selected),
        currentGameIndex: 0,
        status: 'Waiting',
      },
    });

    const player = await Players.create({
      record: {
        name: input.hostName,
        room: room.id,
        totalScore: 0,
        gameScores: JSON.stringify([]),
        currentGameScore: 0,
        isHost: true,
        gameDone: false,
      },
    });

    return { roomId: room.id, roomCode: code, playerId: player.id };
  },
});
