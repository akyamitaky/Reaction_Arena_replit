import { useEffect, useState } from 'react';
import { GameContext } from '@/components/GameShell';

const TARGETS = ['⭐', '🌈', '🍎', '🚀', '🐸', '🎈'];

function makeTarget() {
  return {
    emoji: TARGETS[Math.floor(Math.random() * TARGETS.length)],
    left: 12 + Math.random() * 70,
    top: 12 + Math.random() * 62,
  };
}

export default function CatchGame({ round, addScore, nextRound }: GameContext) {
  const [target, setTarget] = useState(makeTarget);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setTarget(makeTarget());
    setFeedback(null);
  }, [round]);

  const handleCatch = () => {
    if (feedback) return;
    addScore(150);
    setFeedback('✓ Great catch!');
    setTimeout(nextRound, 700);
  };

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-md">
      <p className="text-sm text-muted-foreground">Catch the moving friend!</p>
      <div className="relative w-full h-64 rounded-3xl border-2 border-dashed border-primary/30 bg-primary/5 overflow-hidden">
        <button
          aria-label="Catch the target"
          onClick={handleCatch}
          className="absolute -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-card border-2 border-primary shadow-lg shadow-primary/20 text-4xl hover:scale-125 active:scale-95 transition-transform"
          style={{ left: `${target.left}%`, top: `${target.top}%` }}
        >
          {target.emoji}
        </button>
      </div>
      {feedback && <p className="font-bold text-green-600">{feedback}</p>}
    </div>
  );
}
