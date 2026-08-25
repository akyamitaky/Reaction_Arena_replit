import { useEffect, useState } from 'react';
import { GameContext } from '@/components/GameShell';

const WORDS = ['CAT', 'SUN', 'FISH', 'STAR', 'MOON', 'TREE', 'CAKE', 'FROG'];
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function generate() {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)];
  const row = Math.floor(Math.random() * 4);
  const start = Math.floor(Math.random() * (5 - word.length));
  const targetIndices = word.split('').map((_, i) => row * 5 + start + i);
  const letters = Array.from({ length: 20 }, (_, i) =>
    targetIndices.includes(i) ? word[targetIndices.indexOf(i)] : LETTERS[Math.floor(Math.random() * LETTERS.length)],
  );
  return { word, letters, targetIndices };
}

export default function WordHuntGame({ round, addScore, nextRound }: GameContext) {
  const [question, setQuestion] = useState(generate);
  const [selected, setSelected] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setQuestion(generate());
    setSelected([]);
    setFeedback(null);
  }, [round]);

  const handlePick = (index: number) => {
    if (feedback || selected.includes(index)) return;
    const expected = question.targetIndices[selected.length];
    if (index !== expected) {
      setFeedback('✗ Start again next round!');
      setTimeout(nextRound, 800);
      return;
    }

    const next = [...selected, index];
    setSelected(next);
    if (next.length === question.targetIndices.length) {
      addScore(180);
      setFeedback('✓ Word found!');
      setTimeout(nextRound, 800);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-sm">
      <p className="text-sm text-muted-foreground">
        Find the word: <span className="font-black tracking-widest text-foreground">{question.word}</span>
      </p>
      <div className="grid grid-cols-5 gap-2">
        {question.letters.map((letter, index) => (
          <button
            key={`${round}-${index}`}
            onClick={() => handlePick(index)}
            className={`w-14 h-14 rounded-xl border font-black text-lg transition-all ${selected.includes(index) ? 'bg-primary text-primary-foreground border-primary scale-105' : 'bg-card hover:border-primary hover:-translate-y-0.5'}`}
          >
            {letter}
          </button>
        ))}
      </div>
      {feedback && (
        <p className={`font-bold ${feedback.startsWith('✓') ? 'text-green-600' : 'text-destructive'}`}>{feedback}</p>
      )}
    </div>
  );
}
