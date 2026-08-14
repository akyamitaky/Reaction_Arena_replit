import { useEffect, useState } from 'react';
import { GameContext } from '@/components/GameShell';

type Chest = { emoji: string; points: number };

function generate() {
  const rewards: Chest[] = [
    { emoji: '💎', points: 200 },
    { emoji: '🪙', points: 100 },
    { emoji: '🕳️', points: 0 },
  ];
  return rewards.sort(() => Math.random() - 0.5);
}

export default function TreasureGame({ round, addScore, nextRound }: GameContext) {
  const [chests, setChests] = useState(generate);
  const [chosen, setChosen] = useState<number | null>(null);

  useEffect(() => {
    setChests(generate());
    setChosen(null);
  }, [round]);

  const pickChest = (index: number) => {
    if (chosen !== null) return;
    const chest = chests[index];
    setChosen(index);
    addScore(chest.points);
    setTimeout(nextRound, 900);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Pick one treasure chest!</p>
        <p className="text-xs text-muted-foreground mt-1">Will you find the jackpot?</p>
      </div>
      <div className="flex gap-3">
        {chests.map((chest, index) => (
          <button
            key={index}
            onClick={() => pickChest(index)}
            className={`w-24 h-28 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${chosen === index ? 'bg-primary/15 border-primary scale-105' : 'bg-card border-border hover:-translate-y-2 hover:border-primary'}`}
          >
            <span className="text-4xl">{chosen === index ? chest.emoji : '🎁'}</span>
            {chosen === index && <span className="text-xs font-black">{chest.points ? `+${chest.points}` : 'Empty!'}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}