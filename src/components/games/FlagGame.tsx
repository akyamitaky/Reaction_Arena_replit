import { useState, useEffect } from 'react';
import { GameContext } from '@/components/GameShell';

const FLAGS = [
  { flag: '🇺🇸', name: 'United States' }, { flag: '🇬🇧', name: 'United Kingdom' },
  { flag: '🇫🇷', name: 'France' }, { flag: '🇩🇪', name: 'Germany' },
  { flag: '🇯🇵', name: 'Japan' }, { flag: '🇮🇳', name: 'India' },
  { flag: '🇧🇷', name: 'Brazil' }, { flag: '🇨🇦', name: 'Canada' },
  { flag: '🇦🇺', name: 'Australia' }, { flag: '🇮🇹', name: 'Italy' },
  { flag: '🇪🇸', name: 'Spain' }, { flag: '🇲🇽', name: 'Mexico' },
  { flag: '🇰🇷', name: 'South Korea' }, { flag: '🇷🇺', name: 'Russia' },
  { flag: '🇨🇳', name: 'China' }, { flag: '🇳🇬', name: 'Nigeria' },
  { flag: '🇿🇦', name: 'South Africa' }, { flag: '🇸🇪', name: 'Sweden' },
  { flag: '🇳🇴', name: 'Norway' }, { flag: '🇦🇷', name: 'Argentina' },
  { flag: '🇪🇬', name: 'Egypt' }, { flag: '🇹🇷', name: 'Turkey' },
  { flag: '🇵🇱', name: 'Poland' }, { flag: '🇳🇱', name: 'Netherlands' },
  { flag: '🇸🇦', name: 'Saudi Arabia' }, { flag: '🇹🇭', name: 'Thailand' },
  { flag: '🇵🇹', name: 'Portugal' }, { flag: '🇬🇷', name: 'Greece' },
  { flag: '🇨🇭', name: 'Switzerland' }, { flag: '🇵🇭', name: 'Philippines' },
];

function generate() {
  const pool = [...FLAGS].sort(() => Math.random() - 0.5);
  const target = pool[0];
  const options = [target.name, pool[1].name, pool[2].name, pool[3].name].sort(() => Math.random() - 0.5);
  return { flag: target.flag, answer: target.name, options };
}

export default function FlagGame({ round, addScore, nextRound }: GameContext) {
  const [q, setQ] = useState(() => generate());
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => { setQ(generate()); setFeedback(null); }, [round]);

  const handleAnswer = (name: string) => {
    if (feedback) return;
    const correct = name === q.answer;
    if (correct) addScore(100);
    setFeedback(correct ? '✓ Correct!' : `✗ It was ${q.answer}`);
    setTimeout(nextRound, 800);
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-sm">
      <p className="text-sm text-muted-foreground">Which country does this flag belong to?</p>
      <span className="text-8xl">{q.flag}</span>
      <div className="grid grid-cols-2 gap-3 w-full">
        {q.options.map(o => (
          <button key={o} onClick={() => handleAnswer(o)} className="p-4 rounded-xl border bg-card font-bold hover:border-primary transition-all text-sm">{o}</button>
        ))}
      </div>
      {feedback && <p className={`font-bold ${feedback.startsWith('✓') ? 'text-green-600' : 'text-destructive'}`}>{feedback}</p>}
    </div>
  );
}
