import { useState, useEffect } from 'react';
import { GameContext } from '@/components/GameShell';

function generate() {
  const num = Math.floor(Math.random() * 60) + 2;
  const binary = num.toString(2);
  const options = new Set([num]);
  while (options.size < 4) options.add(Math.max(1, num + Math.floor(Math.random() * 20) - 10));
  return { binary, answer: num, options: [...options].sort(() => Math.random() - 0.5) };
}

export default function BinaryGame({ round, addScore, nextRound }: GameContext) {
  const [q, setQ] = useState(() => generate());
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => { setQ(generate()); setFeedback(null); }, [round]);

  const handleAnswer = (n: number) => {
    if (feedback) return;
    const correct = n === q.answer;
    if (correct) addScore(150);
    setFeedback(correct ? '✓ Correct!' : `✗ Answer: ${q.answer}`);
    setTimeout(nextRound, 800);
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-sm">
      <p className="text-sm text-muted-foreground">Convert binary to decimal</p>
      <div className="flex gap-1.5">
        {q.binary.split('').map((bit, i) => (
          <span key={i} className={`w-11 h-14 flex items-center justify-center rounded-lg font-mono text-2xl font-black ${bit === '1' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
            {bit}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 w-full">
        {q.options.map(o => (
          <button key={o} onClick={() => handleAnswer(o)} className="p-4 rounded-xl border bg-card font-bold text-xl hover:border-primary transition-all tabular-nums">{o}</button>
        ))}
      </div>
      {feedback && <p className={`font-bold ${feedback.startsWith('✓') ? 'text-green-600' : 'text-destructive'}`}>{feedback}</p>}
    </div>
  );
}
