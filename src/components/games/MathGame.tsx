import { useState, useEffect } from 'react';
import { GameContext } from '@/components/GameShell';

function generate() {
  const ops = ['+', '-', '×'] as const;
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a: number, b: number, answer: number;
  if (op === '+') { a = Math.floor(Math.random() * 50) + 5; b = Math.floor(Math.random() * 50) + 5; answer = a + b; }
  else if (op === '-') { a = Math.floor(Math.random() * 50) + 25; b = Math.floor(Math.random() * 25) + 1; answer = a - b; }
  else { a = Math.floor(Math.random() * 12) + 2; b = Math.floor(Math.random() * 12) + 2; answer = a * b; }
  const wrong = new Set([answer]);
  while (wrong.size < 4) wrong.add(answer + Math.floor(Math.random() * 20) - 10 || answer + 1);
  return { question: `${a} ${op} ${b}`, answer, options: [...wrong].sort(() => Math.random() - 0.5) };
}

export default function MathGame({ round, addScore, nextRound }: GameContext) {
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
    <div className="flex flex-col items-center gap-8 w-full max-w-sm">
      <p className="text-5xl font-black tabular-nums">{q.question}</p>
      <div className="grid grid-cols-2 gap-3 w-full">
        {q.options.map(o => (
          <button key={o} onClick={() => handleAnswer(o)} className="p-4 rounded-xl border bg-card font-bold text-xl hover:border-primary transition-all tabular-nums">
            {o}
          </button>
        ))}
      </div>
      {feedback && <p className={`font-bold ${feedback.startsWith('✓') ? 'text-green-600' : 'text-destructive'}`}>{feedback}</p>}
    </div>
  );
}
