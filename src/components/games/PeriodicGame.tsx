import { useState, useEffect } from 'react';
import { GameContext } from '@/components/GameShell';

const ELEMENTS = [
  { symbol: 'H', name: 'Hydrogen', number: 1 }, { symbol: 'He', name: 'Helium', number: 2 },
  { symbol: 'Li', name: 'Lithium', number: 3 }, { symbol: 'C', name: 'Carbon', number: 6 },
  { symbol: 'N', name: 'Nitrogen', number: 7 }, { symbol: 'O', name: 'Oxygen', number: 8 },
  { symbol: 'F', name: 'Fluorine', number: 9 }, { symbol: 'Ne', name: 'Neon', number: 10 },
  { symbol: 'Na', name: 'Sodium', number: 11 }, { symbol: 'Mg', name: 'Magnesium', number: 12 },
  { symbol: 'Al', name: 'Aluminium', number: 13 }, { symbol: 'Si', name: 'Silicon', number: 14 },
  { symbol: 'P', name: 'Phosphorus', number: 15 }, { symbol: 'S', name: 'Sulfur', number: 16 },
  { symbol: 'Cl', name: 'Chlorine', number: 17 }, { symbol: 'Ar', name: 'Argon', number: 18 },
  { symbol: 'K', name: 'Potassium', number: 19 }, { symbol: 'Ca', name: 'Calcium', number: 20 },
  { symbol: 'Fe', name: 'Iron', number: 26 }, { symbol: 'Cu', name: 'Copper', number: 29 },
  { symbol: 'Zn', name: 'Zinc', number: 30 }, { symbol: 'Ag', name: 'Silver', number: 47 },
  { symbol: 'Au', name: 'Gold', number: 79 }, { symbol: 'Pt', name: 'Platinum', number: 78 },
  { symbol: 'Pb', name: 'Lead', number: 82 }, { symbol: 'Hg', name: 'Mercury', number: 80 },
  { symbol: 'Sn', name: 'Tin', number: 50 }, { symbol: 'Ti', name: 'Titanium', number: 22 },
  { symbol: 'Ni', name: 'Nickel', number: 28 }, { symbol: 'Kr', name: 'Krypton', number: 36 },
];

function generate() {
  const pool = [...ELEMENTS].sort(() => Math.random() - 0.5);
  const target = pool[0];
  // Alternate between symbol→name and name→symbol
  const mode = Math.random() > 0.5 ? 'symbol' : 'name';
  if (mode === 'symbol') {
    const options = [target.name, pool[1].name, pool[2].name, pool[3].name].sort(() => Math.random() - 0.5);
    return { prompt: target.symbol, promptLabel: `Element #${target.number}`, answer: target.name, options };
  } else {
    const options = [target.symbol, pool[1].symbol, pool[2].symbol, pool[3].symbol].sort(() => Math.random() - 0.5);
    return { prompt: target.name, promptLabel: `#${target.number}`, answer: target.symbol, options };
  }
}

export default function PeriodicGame({ round, addScore, nextRound }: GameContext) {
  const [q, setQ] = useState(() => generate());
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => { setQ(generate()); setFeedback(null); }, [round]);

  const handleAnswer = (ans: string) => {
    if (feedback) return;
    const correct = ans === q.answer;
    if (correct) addScore(100);
    setFeedback(correct ? '✓ Correct!' : `✗ It was "${q.answer}"`);
    setTimeout(nextRound, 800);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      <p className="text-sm text-muted-foreground">Identify the element!</p>
      <div className="w-28 h-28 rounded-2xl border-2 border-primary/30 bg-card flex flex-col items-center justify-center gap-1">
        <span className="text-xs text-muted-foreground">{q.promptLabel}</span>
        <span className="text-4xl font-black text-primary">{q.prompt}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 w-full">
        {q.options.map(o => (
          <button key={o} onClick={() => handleAnswer(o)} className="p-4 rounded-xl border bg-card font-bold hover:border-primary transition-all">{o}</button>
        ))}
      </div>
      {feedback && <p className={`font-bold ${feedback.startsWith('✓') ? 'text-green-600' : 'text-destructive'}`}>{feedback}</p>}
    </div>
  );
}
