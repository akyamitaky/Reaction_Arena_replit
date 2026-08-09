import { z } from 'zod';
import { createEndpoint, Rooms, Players, ZiteError } from 'zite-integrations-backend-sdk';

export default createEndpoint({
  description: 'Advance to the next game in the arena (host only)',
  inputSchema: z.object({
    roomId: z.string(),
    playerId: z.string(),
  }),
  outputSchema: z.object({ success: z.boolean() }),
  execute: async ({ input }) => {
    const player = await Players.findOne({ id: input.playerId });
    if (!player || !player.isHost) throw new ZiteError({ code: 'FORBIDDEN', message: 'Only the host can advance.' });

    const room = await Rooms.findOne({ id: input.roomId });
    if (!room) throw new ZiteError({ code: 'NOT_FOUND', message: 'Room not found.' });

    const newIdx = (room.currentGameIndex || 0) + 1;
    await Rooms.update({ id: input.roomId, record: { currentGameIndex: newIdx, status: 'Playing' } });

    // Reset all players' gameDone flag
    const { records: allPlayers } = await Players.findAll({ filters: { room: input.roomId } });
    for (const p of allPlayers) {
      await Players.update({ id: p.id, record: { gameDone: false, currentGameScore: 0 } });
    }

    return { success: true };
  },
});
