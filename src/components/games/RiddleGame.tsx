import { useState, useEffect } from 'react';
import { GameContext } from '@/components/GameShell';

const RIDDLES = [
  { q: 'I have keys but no locks. I have space but no room. You can enter but can\'t go inside. What am I?', a: 'Keyboard', options: ['Keyboard', 'House', 'Car', 'Piano'] },
  { q: 'What has hands but can\'t clap?', a: 'Clock', options: ['Clock', 'Doll', 'Gloves', 'Robot'] },
  { q: 'I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?', a: 'Echo', options: ['Ghost', 'Echo', 'Shadow', 'Wind'] },
  { q: 'The more you take, the more you leave behind. What am I?', a: 'Footsteps', options: ['Breath', 'Money', 'Footsteps', 'Time'] },
  { q: 'What can you break without touching it?', a: 'Promise', options: ['Glass', 'Promise', 'Silence', 'Record'] },
  { q: 'What gets wetter the more it dries?', a: 'Towel', options: ['Sponge', 'Paper', 'Towel', 'Soap'] },
  { q: 'I have cities but no houses, forests but no trees, water but no fish. What am I?', a: 'Map', options: ['Globe', 'Map', 'Painting', 'Dream'] },
  { q: 'What has a head and a tail but no body?', a: 'Coin', options: ['Snake', 'Coin', 'Arrow', 'Nail'] },
  { q: 'What can travel around the world while staying in a corner?', a: 'Stamp', options: ['Stamp', 'Spider', 'Shadow', 'Wi-Fi'] },
  { q: 'I\'m tall when I\'m young and short when I\'m old. What am I?', a: 'Candle', options: ['Tree', 'Person', 'Candle', 'Pencil'] },
  { q: 'What has many teeth but cannot bite?', a: 'Comb', options: ['Saw', 'Comb', 'Zipper', 'Gear'] },
  { q: 'What can fill a room but takes up no space?', a: 'Light', options: ['Air', 'Light', 'Sound', 'Smell'] },
  { q: 'What goes up but never comes down?', a: 'Age', options: ['Balloon', 'Age', 'Smoke', 'Temperature'] },
  { q: 'What has one eye but cannot see?', a: 'Needle', options: ['Cyclops', 'Needle', 'Storm', 'Potato'] },
  { q: 'What invention lets you look right through a wall?', a: 'Window', options: ['X-Ray', 'Window', 'Camera', 'Mirror'] },
];

export default function RiddleGame({ round, addScore, nextRound }: GameContext) {
  const [q, setQ] = useState(() => RIDDLES[0]);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setQ(RIDDLES[Math.floor(Math.random() * RIDDLES.length)]);
    setFeedback(null);
  }, [round]);

  const handleAnswer = (ans: string) => {
    if (feedback) return;
    const correct = ans === q.a;
    if (correct) addScore(150);
    setFeedback(correct ? '✓ Correct!' : `✗ It was "${q.a}"`);
    setTimeout(nextRound, 1000);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      <p className="text-sm text-muted-foreground">Solve the riddle!</p>
      <p className="text-lg font-semibold text-center leading-relaxed">{q.q}</p>
      <div className="grid grid-cols-2 gap-3 w-full">
        {q.options.map(o => (
          <button key={o} onClick={() => handleAnswer(o)} className="p-4 rounded-xl border bg-card font-bold hover:border-primary transition-all text-sm">{o}</button>
        ))}
      </div>
      {feedback && <p className={`font-bold ${feedback.startsWith('✓') ? 'text-green-600' : 'text-destructive'}`}>{feedback}</p>}
    </div>
  );
}
