import { z } from 'zod';
import { createEndpoint, Rooms, Players, ZiteError } from 'zite-integrations-backend-sdk';

export default createEndpoint({
  description: 'Host starts the arena',
  inputSchema: z.object({
    roomId: z.string(),
    playerId: z.string(),
  }),
  outputSchema: z.object({ success: z.boolean() }),
  execute: async ({ input }) => {
    const player = await Players.findOne({ id: input.playerId });
    if (!player || !player.isHost) throw new ZiteError({ code: 'FORBIDDEN', message: 'Only the host can start.' });

    const { records: allPlayers } = await Players.findAll({ filters: { room: input.roomId } });
    if (allPlayers.length < 2) throw new ZiteError({ code: 'BAD_REQUEST', message: 'Need at least 2 players to start.' });

    await Rooms.update({ id: input.roomId, record: { status: 'Playing', currentGameIndex: 0 } });

    return { success: true };
  },
});
