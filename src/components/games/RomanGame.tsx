import { useState, useEffect } from 'react';
import { GameContext } from '@/components/GameShell';
import { generateRomanQuestion, type RomanQuestion } from '@/lib/gameQuestions';

export default function RomanGame({ round, addScore, reportWrong, nextRound }: GameContext) {
  const [q, setQ] = useState<RomanQuestion>(() => generateRomanQuestion());
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setQ(generateRomanQuestion());
    setFeedback(null);
  }, [round]);

  const handleAnswer = (a: string) => {
    if (feedback) return;
    const correct = a === q.answer;
    if (correct) addScore(100);
    else reportWrong();
    setFeedback(correct ? '✓ Correct!' : `✗ Answer: ${q.answer}`);
    setTimeout(nextRound, 800);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      <p className="text-sm text-muted-foreground">{q.prompt}</p>
      <div className="grid grid-cols-2 gap-3 w-full">
        {q.options.map(o => (
          <button
            key={o}
            onClick={() => handleAnswer(o)}
            className="p-4 rounded-xl border bg-card font-bold text-xl tabular-nums hover:border-primary transition-all"
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
