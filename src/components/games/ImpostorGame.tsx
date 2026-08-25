import { useState, useEffect } from 'react';
import { GameContext } from '@/components/GameShell';

const CHAR_SETS: [string, string][] = [
  ['O', 'Q'],
  ['l', 'I'],
  ['d', 'b'],
  ['p', 'q'],
  ['m', 'n'],
  ['C', 'G'],
  ['V', 'W'],
  ['E', 'F'],
  ['S', '5'],
  ['Z', '2'],
];

function generate() {
  const [normal, odd] = CHAR_SETS[Math.floor(Math.random() * CHAR_SETS.length)];
  const size = 16;
  const oddIdx = Math.floor(Math.random() * size);
  const items = Array.from({ length: size }, (_, i) => (i === oddIdx ? odd : normal));
  return { items, oddIdx };
}

export default function ImpostorGame({ round, addScore, reportWrong, nextRound }: GameContext) {
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
    setFeedback(correct ? '✓ Sharp eye!' : '✗ Wrong one!');
    setTimeout(nextRound, 800);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm text-muted-foreground">Find the different character!</p>
      <div className="grid grid-cols-4 gap-2">
        {q.items.map((ch, i) => (
          <button
            key={i}
            onClick={() => handleTap(i)}
            className="w-16 h-16 rounded-xl border bg-card flex items-center justify-center text-3xl font-mono hover:scale-110 transition-transform"
          >
            {ch}
          </button>
        ))}
      </div>
      {feedback && (
        <p className={`font-bold ${feedback.startsWith('✓') ? 'text-green-600' : 'text-destructive'}`}>{feedback}</p>
      )}
    </div>
  );
}
