import { useState, useEffect } from 'react';
import { GameContext } from '@/components/GameShell';
import { ARENA_COLORS } from '@/lib/palette';

const COLORS = ARENA_COLORS.slice(0, 6);

function generate() {
  const word = COLORS[Math.floor(Math.random() * COLORS.length)];
  let ink = COLORS[Math.floor(Math.random() * COLORS.length)];
  while (ink.name === word.name) ink = COLORS[Math.floor(Math.random() * COLORS.length)];
  const options = new Set([ink.name]);
  while (options.size < 4) options.add(COLORS[Math.floor(Math.random() * COLORS.length)].name);
  return { wordText: word.name, inkColor: ink, options: [...options].sort(() => Math.random() - 0.5) };
}

type Generated = ReturnType<typeof generate>;

export default function StroopGame({ round, addScore, reportWrong, nextRound }: GameContext) {
  const [q, setQ] = useState<Generated>(() => generate());
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setQ(generate());
    setFeedback(null);
  }, [round]);

  const handleAnswer = (name: string) => {
    if (feedback) return;
    const correct = name === q.inkColor.name;
    if (correct) addScore(100);
    else reportWrong();
    setFeedback(correct ? '✓ Correct!' : `✗ Ink was ${q.inkColor.name}`);
    setTimeout(nextRound, 800);
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-sm">
      <p className="text-xs text-muted-foreground">What COLOR is the text printed in?</p>
      <p className="text-6xl font-black" style={{ color: q.inkColor.css }}>
        {q.wordText}
      </p>
      <div className="grid grid-cols-2 gap-3 w-full">
        {q.options.map(o => (
          <button
            key={o}
            onClick={() => handleAnswer(o)}
            className="p-4 rounded-xl border bg-card font-bold hover:border-primary transition-all"
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
