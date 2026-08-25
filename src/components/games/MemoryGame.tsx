import { useState, useEffect } from 'react';
import { GameContext } from '@/components/GameShell';

const ITEMS = ['🍎', '🍌', '🍇', '🍓', '🌟', '🎵', '🔥', '💎', '🌈', '🎯', '🦋', '🌺'];

function generate(round: number) {
  const len = Math.min(3 + Math.floor((round - 1) / 2), 7);
  const items: string[] = [];
  const pool = [...ITEMS];
  for (let i = 0; i < len; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    items.push(pool.splice(idx, 1)[0]);
  }
  return items;
}

export default function MemoryGame({ round, addScore, reportWrong, nextRound }: GameContext) {
  const [items, setItems] = useState<string[]>([]);
  const [phase, setPhase] = useState<'show' | 'pick' | 'done'>('show');
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const seq = generate(round);
    setItems(seq);
    setPhase('show');
    setSelected([]);
    setFeedback('');

    const timer = setTimeout(
      () => {
        const pool = new Set(seq);
        while (pool.size < Math.min(seq.length + 4, 10)) pool.add(ITEMS[Math.floor(Math.random() * ITEMS.length)]);
        setOptions([...pool].sort(() => Math.random() - 0.5));
        setPhase('pick');
      },
      seq.length * 800 + 500,
    );

    return () => clearTimeout(timer);
  }, [round]);

  const handlePick = (emoji: string) => {
    if (phase !== 'pick' || selected.includes(emoji)) return;
    const next = [...selected, emoji];
    setSelected(next);

    if (!items.includes(emoji)) {
      reportWrong();
      setFeedback('✗ Wrong pick!');
      setPhase('done');
      setTimeout(nextRound, 1000);
      return;
    }
    if (next.filter(e => items.includes(e)).length === items.length) {
      addScore(items.length * 50);
      setFeedback('✓ Perfect memory!');
      setPhase('done');
      setTimeout(nextRound, 1000);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {phase === 'show' && (
        <>
          <p className="text-sm text-muted-foreground">Remember these!</p>
          <div className="flex gap-3">
            {items.map((e, i) => (
              <span key={i} className="text-4xl animate-pulse">
                {e}
              </span>
            ))}
          </div>
        </>
      )}
      {(phase === 'pick' || phase === 'done') && (
        <>
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {phase === 'pick' ? `Pick the ${items.length} you saw:` : feedback}
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {options.map(e => (
              <button
                key={e}
                onClick={() => handlePick(e)}
                disabled={selected.includes(e)}
                className={`w-14 h-14 rounded-xl border flex items-center justify-center text-2xl transition-all ${selected.includes(e) ? (items.includes(e) ? 'bg-green-500/20 border-green-500' : 'bg-destructive/20 border-destructive') : 'bg-card hover:scale-110'}`}
              >
                {e}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
