import { useState, useEffect } from 'react';
import { GameContext } from '@/components/GameShell';

const EMOJIS = ['🍎', '🍊', '🍋', '🍇', '🍓', '🫐', '🥝', '🍑'];

function generate() {
  const target = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
  const total = 12 + Math.floor(Math.random() * 8);
  const count = 2 + Math.floor(Math.random() * 5);
  const items: string[] = [];
  for (let i = 0; i < count; i++) items.push(target);
  while (items.length < total) {
    let e = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    while (e === target) e = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    items.push(e);
  }
  items.sort(() => Math.random() - 0.5);
  const options = new Set([count]);
  while (options.size < 4) options.add(Math.max(1, count + Math.floor(Math.random() * 5) - 2));
  return { target, items, count, options: [...options].sort(() => Math.random() - 0.5) };
}

export default function CountGame({ round, addScore, nextRound }: GameContext) {
  const [q, setQ] = useState(() => generate());
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => { setQ(generate()); setFeedback(null); }, [round]);

  const handleAnswer = (n: number) => {
    if (feedback) return;
    const correct = n === q.count;
    if (correct) addScore(100);
    setFeedback(correct ? '✓ Correct!' : `✗ There were ${q.count}`);
    setTimeout(nextRound, 800);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      <p className="text-sm text-muted-foreground">How many <span className="text-xl">{q.target}</span> do you see?</p>
      <div className="flex flex-wrap gap-2 justify-center p-4 rounded-2xl bg-secondary/30">
        {q.items.map((e, i) => <span key={i} className="text-2xl">{e}</span>)}
      </div>
      <div className="grid grid-cols-4 gap-2 w-full">
        {q.options.map(o => (
          <button key={o} onClick={() => handleAnswer(o)} className="p-3 rounded-xl border bg-card font-bold text-lg hover:border-primary transition-all">
            {o}
          </button>
        ))}
      </div>
      {feedback && <p className={`font-bold ${feedback.startsWith('✓') ? 'text-green-600' : 'text-destructive'}`}>{feedback}</p>}
    </div>
  );
}
