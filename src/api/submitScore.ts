import { z } from 'zod';
import { createEndpoint, Rooms, Players, ZiteError } from 'zite-integrations-backend-sdk';

export default createEndpoint({
  description: 'Submit score for the current game in an arena',
  inputSchema: z.object({
    roomId: z.string(),
    playerId: z.string(),
    gameId: z.string(),
    score: z.number(),
    timeTakenMs: z.number(),
  }),
  outputSchema: z.object({
    allDone: z.boolean(),
    isLastGame: z.boolean(),
  }),
  execute: async ({ input }) => {
    const room = await Rooms.findOne({ id: input.roomId });
    if (!room) throw new ZiteError({ code: 'NOT_FOUND', message: 'Room not found.' });

    const player = await Players.findOne({ id: input.playerId });
    if (!player) throw new ZiteError({ code: 'NOT_FOUND', message: 'Player not found.' });

    // If player already submitted for this game, return current state
    if (player.gameDone) {
      const gameIDs = JSON.parse(room.gameIDs || '[]');
      const isLastGame = (room.currentGameIndex || 0) >= gameIDs.length - 1;
      const { records: allP } = await Players.findAll({ filters: { room: input.roomId } });
      const allDone = allP.every(p => p.gameDone === true);
      return { allDone, isLastGame };
    }

    // Store raw score and time for now; ranked points calculated when all done
    const gameScores = JSON.parse(player.gameScores || '[]');
    gameScores.push({ gameId: input.gameId, rawScore: input.score, timeTakenMs: input.timeTakenMs, rankedPoints: 0 });

    await Players.update({
      id: input.playerId,
      record: {
        gameScores: JSON.stringify(gameScores),
        currentGameScore: input.score,
        gameDone: true,
      },
    });

    // Check if all players are done — re-read fresh to avoid race conditions
    const { records: allPlayers } = await Players.findAll({ filters: { room: input.roomId } });
    // Use the DB state directly (our update above already persisted gameDone: true)
    const allDone = allPlayers.every(p => p.gameDone === true);
    const gameIDs = JSON.parse(room.gameIDs || '[]');
    const isLastGame = (room.currentGameIndex || 0) >= gameIDs.length - 1;

    if (allDone) {
      // Calculate speed-ranked points for this game
      const playerResults = allPlayers.map(p => {
        const scores = JSON.parse(p.gameScores || '[]');
        // Get the latest entry (current game)
        const latest = scores[scores.length - 1];
        return {
          id: p.id,
          rawScore: p.id === input.playerId ? input.score : (latest?.rawScore ?? 0),
          timeTakenMs: p.id === input.playerId ? input.timeTakenMs : (latest?.timeTakenMs ?? 99999),
          scores,
        };
      });

      // Only correct answers (rawScore > 0) get ranked points
      const correctPlayers = playerResults
        .filter(p => p.rawScore > 0)
        .sort((a, b) => a.timeTakenMs - b.timeTakenMs); // fastest first

      const totalPlayers = allPlayers.length;

      // Award points: fastest gets totalPlayers pts, next totalPlayers-1, etc.
      const pointsMap: Record<string, number> = {};
      correctPlayers.forEach((p, idx) => {
        pointsMap[p.id] = totalPlayers - idx;
      });

      // Update all players with ranked points
      for (const pr of playerResults) {
        const rankedPts = pointsMap[pr.id] || 0;
        // Update the last entry in gameScores with rankedPoints
        const scores = pr.scores;
        if (scores.length > 0) {
          scores[scores.length - 1].rankedPoints = rankedPts;
        }
        const oldTotal = allPlayers.find(p => p.id === pr.id)?.totalScore || 0;
        await Players.update({
          id: pr.id,
          record: {
            gameScores: JSON.stringify(scores),
            totalScore: oldTotal + rankedPts,
            currentGameScore: rankedPts,
          },
        });
      }

      if (isLastGame) {
        await Rooms.update({ id: input.roomId, record: { status: 'Finished' } });
      } else {
        await Rooms.update({ id: input.roomId, record: { status: 'Between Games' } });
      }
    }

    return { allDone, isLastGame };
  },
});
