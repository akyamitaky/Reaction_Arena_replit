import { useState, useEffect } from 'react';
import { GameContext } from '@/components/GameShell';

const SETS = [
  { normal: '😀', odd: '😃' },
  { normal: '🍎', odd: '🍏' },
  { normal: '🐶', odd: '🐕' },
  { normal: '❤️', odd: '💗' },
  { normal: '⭐', odd: '🌟' },
  { normal: '🔵', odd: '🔷' },
  { normal: '🌸', odd: '🌺' },
  { normal: '🐱', odd: '😺' },
  { normal: '🎵', odd: '🎶' },
  { normal: '👋', odd: '🤚' },
  { normal: '🏀', odd: '🟠' },
  { normal: '🍕', odd: '🍖' },
];

function generate() {
  const set = SETS[Math.floor(Math.random() * SETS.length)];
  const size = 9;
  const oddIdx = Math.floor(Math.random() * size);
  const items = Array.from({ length: size }, (_, i) => (i === oddIdx ? set.odd : set.normal));
  return { items, oddIdx };
}

export default function EmojiGame({ round, addScore, reportWrong, nextRound }: GameContext) {
  const [q, setQ] = useState(() => generate());
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setQ(generate());
    setFeedback(null);
  }, [round]);

  const handleTap = (idx: number) => {
    if (feedback) return;
    const correct = idx === q.oddIdx;
    if (correct) addScore(100);
    else reportWrong();
    setFeedback(correct ? '✓ Found it!' : '✗ Wrong one!');
    setTimeout(nextRound, 800);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm text-muted-foreground">Tap the odd emoji out!</p>
      <div className="grid grid-cols-3 gap-3">
        {q.items.map((emoji, i) => (
          <button
            key={i}
            onClick={() => handleTap(i)}
            className="w-20 h-20 rounded-xl border bg-card flex items-center justify-center text-4xl hover:scale-110 transition-transform"
          >
            {emoji}
          </button>
        ))}
      </div>
      {feedback && (
        <p className={`font-bold ${feedback.startsWith('✓') ? 'text-green-600' : 'text-destructive'}`}>{feedback}</p>
      )}
    </div>
  );
}
