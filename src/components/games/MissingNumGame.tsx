import { useState, useEffect } from 'react';
import { GameContext } from '@/components/GameShell';

function generate() {
  const start = Math.floor(Math.random() * 10) + 1;
  const step = [1, 2, 3, 5][Math.floor(Math.random() * 4)];
  const seq = Array.from({ length: 6 }, (_, i) => start + step * i);
  const hideIdx = 1 + Math.floor(Math.random() * 4);
  const answer = seq[hideIdx];
  const display = seq.map((n, i) => i === hideIdx ? null : n);
  const options = new Set([answer]);
  while (options.size < 4) options.add(answer + Math.floor(Math.random() * 10) - 5 || answer + 1);
  return { display, answer, options: [...options].sort(() => Math.random() - 0.5) };
}

export default function MissingNumGame({ round, addScore, nextRound }: GameContext) {
  const [q, setQ] = useState(() => generate());
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => { setQ(generate()); setFeedback(null); }, [round]);

  const handleAnswer = (n: number) => {
    if (feedback) return;
    const correct = n === q.answer;
    if (correct) addScore(100);
    setFeedback(correct ? '✓ Correct!' : `✗ Answer: ${q.answer}`);
    setTimeout(nextRound, 800);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      <p className="text-sm text-muted-foreground">Find the missing number:</p>
      <div className="flex gap-2">
        {q.display.map((n, i) => (
          <span key={i} className={`w-12 h-12 flex items-center justify-center rounded-xl font-black text-lg ${n === null ? 'border-2 border-dashed border-primary text-primary' : 'bg-secondary'}`}>
            {n ?? '?'}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2 w-full">
        {q.options.map(o => (
          <button key={o} onClick={() => handleAnswer(o)} className="p-3 rounded-xl border bg-card font-bold text-lg hover:border-primary transition-all">{o}</button>
        ))}
      </div>
      {feedback && <p className={`font-bold ${feedback.startsWith('✓') ? 'text-green-600' : 'text-destructive'}`}>{feedback}</p>}
    </div>
  );
}
