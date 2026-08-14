import { useEffect, useState } from 'react';
import { GameContext } from '@/components/GameShell';

const MOVES = [
  { id: 'rock', emoji: '🪨', label: 'Rock' },
  { id: 'paper', emoji: '📄', label: 'Paper' },
  { id: 'scissors', emoji: '✂️', label: 'Scissors' },
] as const;

function outcome(player: string, bot: string) {
  if (player === bot) return 'tie';
  if (
    (player === 'rock' && bot === 'scissors') ||
    (player === 'paper' && bot === 'rock') ||
    (player === 'scissors' && bot === 'paper')
  ) return 'win';
  return 'lose';
}

export default function DuelGame({ round, addScore, nextRound }: GameContext) {
  const [botMove, setBotMove] = useState<typeof MOVES[number] | null>(null);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    setBotMove(null);
    setResult(null);
  }, [round]);

  const chooseMove = (move: typeof MOVES[number]) => {
    if (botMove) return;
    const opponent = MOVES[Math.floor(Math.random() * MOVES.length)];
    const gameResult = outcome(move.id, opponent.id);
    setBotMove(opponent);
    if (gameResult === 'win') addScore(150);
    if (gameResult === 'tie') addScore(50);
    setResult(gameResult === 'win' ? '🏆 You win!' : gameResult === 'tie' ? '🤝 Tie!' : '💪 Next round!');
    setTimeout(nextRound, 1000);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Emoji Duel</p>
        <p className="font-bold mt-1">{botMove ? `Opponent played ${botMove.label}` : 'Choose your move!'}</p>
      </div>
      <div className="flex gap-3">
        {MOVES.map(move => (
          <button
            key={move.id}
            onClick={() => chooseMove(move)}
            className="w-24 h-24 rounded-2xl border bg-card flex flex-col items-center justify-center gap-1 hover:-translate-y-1 hover:border-primary transition-all disabled:opacity-60"
            disabled={!!botMove}
          >
            <span className="text-4xl">{move.emoji}</span>
            <span className="text-xs font-bold">{move.label}</span>
          </button>
        ))}
      </div>
      {result && <p className="font-black text-primary text-lg">{result}</p>}
    </div>
  );
}