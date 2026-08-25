import { useState, useEffect } from 'react';
import { GameContext } from '@/components/GameShell';
import { generateVowelQuestion, type VowelQuestion } from '@/lib/gameQuestions';

export default function VowelGame({ round, addScore, reportWrong, nextRound }: GameContext) {
  const [q, setQ] = useState<VowelQuestion>(() => generateVowelQuestion());
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setQ(generateVowelQuestion());
    setFeedback(null);
  }, [round]);

  const handleAnswer = (n: number) => {
    if (feedback) return;
    const correct = n === q.answer;
    if (correct) addScore(100);
    else reportWrong();
    setFeedback(correct ? '✓ Correct!' : `✗ Answer: ${q.answer}`);
    setTimeout(nextRound, 800);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      <p className="text-sm text-muted-foreground">Count the vowels (a, e, i, o, u) in:</p>
      <p className="text-4xl font-black tracking-wide">{q.word.toUpperCase()}</p>
      <div className="grid grid-cols-4 gap-2 w-full">
        {q.options.map(o => (
          <button
            key={o}
            onClick={() => handleAnswer(o)}
            className="p-3 rounded-xl border bg-card font-bold text-lg hover:border-primary transition-all tabular-nums"
          >
            {o}
          </button>
        ))}
      </div>
      {feedback && (
        <p className={`font-bold ${feedback.startsWith('✓') ? 'text-green-600' : 'text-destructive'}`}>{feedback}</p>
      )}
    </div>
  );
}
