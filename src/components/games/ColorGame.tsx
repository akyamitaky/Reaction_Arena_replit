import { useState, useEffect } from 'react';
import { GameContext } from '@/components/GameShell';
import { ARENA_COLORS, type ArenaColor } from '@/lib/palette';

function pick(arr: readonly ArenaColor[], exclude?: string) {
  const filtered = exclude ? arr.filter(c => c.name !== exclude) : arr;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export default function ColorGame({ round, addScore, reportWrong, nextRound }: GameContext) {
  const [target, setTarget] = useState<ArenaColor>(() => pick(ARENA_COLORS));
  const [options, setOptions] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const t = pick(ARENA_COLORS);
    setTarget(t);
    const others = new Set([t.name]);
    while (others.size < 4) others.add(pick(ARENA_COLORS, t.name).name);
    setOptions([...others].sort(() => Math.random() - 0.5));
    setFeedback(null);
  }, [round]);

  const handleAnswer = (name: string) => {
    if (feedback) return;
    const correct = name === target.name;
    if (correct) addScore(100);
    else reportWrong();
    setFeedback(correct ? '✓ Correct!' : `✗ It was ${target.name}`);
    setTimeout(nextRound, 800);
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-sm">
      <div className="w-32 h-32 rounded-3xl shadow-lg" style={{ backgroundColor: target.css }} />
      <p className="font-semibold text-lg">What color is this?</p>
      <div className="grid grid-cols-2 gap-3 w-full">
        {options.map(o => (
          <button
            key={o}
            onClick={() => handleAnswer(o)}
            className="p-4 rounded-xl border bg-card font-bold hover:border-primary transition-all text-sm"
          >
            {o}
          </button>
        ))}
      </div>
      {feedback && (
        <p className={`font-bold ${feedback.startsWith('✓') ? 'text-green-600' : 'text-destructive'}`}>{feedback}</p>
      )}
    </div>
  );
}
