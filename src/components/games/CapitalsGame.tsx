import { useState, useEffect } from 'react';
import { GameContext } from '@/components/GameShell';

const COUNTRIES = [
  { country: 'France', capital: 'Paris' }, { country: 'Japan', capital: 'Tokyo' },
  { country: 'Australia', capital: 'Canberra' }, { country: 'Brazil', capital: 'Brasília' },
  { country: 'Canada', capital: 'Ottawa' }, { country: 'Egypt', capital: 'Cairo' },
  { country: 'Germany', capital: 'Berlin' }, { country: 'India', capital: 'New Delhi' },
  { country: 'Italy', capital: 'Rome' }, { country: 'Mexico', capital: 'Mexico City' },
  { country: 'Nigeria', capital: 'Abuja' }, { country: 'Russia', capital: 'Moscow' },
  { country: 'South Korea', capital: 'Seoul' }, { country: 'Spain', capital: 'Madrid' },
  { country: 'Thailand', capital: 'Bangkok' }, { country: 'Turkey', capital: 'Ankara' },
  { country: 'Argentina', capital: 'Buenos Aires' }, { country: 'China', capital: 'Beijing' },
  { country: 'South Africa', capital: 'Pretoria' }, { country: 'Sweden', capital: 'Stockholm' },
  { country: 'Poland', capital: 'Warsaw' }, { country: 'Kenya', capital: 'Nairobi' },
  { country: 'Norway', capital: 'Oslo' }, { country: 'Switzerland', capital: 'Bern' },
  { country: 'New Zealand', capital: 'Wellington' }, { country: 'Peru', capital: 'Lima' },
];

function generate() {
  const pool = [...COUNTRIES].sort(() => Math.random() - 0.5);
  const target = pool[0];
  const options = [target.capital, pool[1].capital, pool[2].capital, pool[3].capital].sort(() => Math.random() - 0.5);
  return { country: target.country, answer: target.capital, options };
}

export default function CapitalsGame({ round, addScore, nextRound }: GameContext) {
  const [q, setQ] = useState(() => generate());
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => { setQ(generate()); setFeedback(null); }, [round]);

  const handleAnswer = (ans: string) => {
    if (feedback) return;
    const correct = ans === q.answer;
    if (correct) addScore(100);
    setFeedback(correct ? '✓ Correct!' : `✗ It was ${q.answer}`);
    setTimeout(nextRound, 800);
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-sm">
      <p className="text-sm text-muted-foreground">What is the capital of…</p>
      <p className="text-3xl font-black">{q.country}</p>
      <div className="grid grid-cols-2 gap-3 w-full">
        {q.options.map(o => (
          <button key={o} onClick={() => handleAnswer(o)} className="p-4 rounded-xl border bg-card font-bold hover:border-primary transition-all text-sm">{o}</button>
        ))}
      </div>
      {feedback && <p className={`font-bold ${feedback.startsWith('✓') ? 'text-green-600' : 'text-destructive'}`}>{feedback}</p>}
    </div>
  );
}
