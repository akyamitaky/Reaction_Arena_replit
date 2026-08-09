import { useState, useEffect } from 'react';
import { GameContext } from '@/components/GameShell';

const GROUPS: { category: string; normal: string[]; odd: string }[] = [
  { category: 'Fruits', normal: ['Apple', 'Banana', 'Grape', 'Mango'], odd: 'Carrot' },
  { category: 'Animals', normal: ['Dog', 'Cat', 'Lion', 'Tiger'], odd: 'Eagle' },
  { category: 'Colors', normal: ['Red', 'Blue', 'Green', 'Yellow'], odd: 'Square' },
  { category: 'Planets', normal: ['Mars', 'Venus', 'Saturn', 'Jupiter'], odd: 'Moon' },
  { category: 'Numbers', normal: ['2', '4', '6', '8'], odd: '7' },
  { category: 'Days', normal: ['Monday', 'Tuesday', 'Friday', 'Sunday'], odd: 'March' },
  { category: 'Instruments', normal: ['Guitar', 'Piano', 'Violin', 'Drums'], odd: 'Painting' },
  { category: 'Sports', normal: ['Soccer', 'Tennis', 'Cricket', 'Hockey'], odd: 'Chess' },
  { category: 'Ocean', normal: ['Shark', 'Whale', 'Dolphin', 'Octopus'], odd: 'Penguin' },
  { category: 'Shapes', normal: ['Circle', 'Square', 'Triangle', 'Pentagon'], odd: 'Purple' },
];

function generate() {
  const g = GROUPS[Math.floor(Math.random() * GROUPS.length)];
  const normals = g.normal.sort(() => Math.random() - 0.5).slice(0, 3);
  const options = [...normals, g.odd].sort(() => Math.random() - 0.5);
  return { options, answer: g.odd, hint: g.category };
}

export default function OddOneGame({ round, addScore, nextRound }: GameContext) {
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
    <div className="flex flex-col items-center gap-8 w-full max-w-sm">
      <p className="text-sm text-muted-foreground">Which one doesn't belong?</p>
      <div className="grid grid-cols-2 gap-3 w-full">
        {q.options.map(o => (
          <button key={o} onClick={() => handleAnswer(o)} className="p-5 rounded-xl border bg-card font-bold hover:border-primary transition-all">{o}</button>
        ))}
      </div>
      {feedback && <p className={`font-bold ${feedback.startsWith('✓') ? 'text-green-600' : 'text-destructive'}`}>{feedback}</p>}
    </div>
  );
}
