import { useState, useEffect } from 'react';
import { GameContext } from '@/components/GameShell';
import { generateSpellingQuestion, type SpellingQuestion } from '@/lib/gameQuestions';

export default function SpellingGame({ round, addScore, reportWrong, nextRound }: GameContext) {
  const [q, setQ] = useState<SpellingQuestion>(() => generateSpellingQuestion());
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setQ(generateSpellingQuestion());
    setFeedback(null);
  }, [round]);

  const handleAnswer = (w: string) => {
    if (feedback) return;
    const correct = w === q.word;
    if (correct) addScore(100);
    else reportWrong();
    setFeedback(correct ? '✓ Correct!' : `✗ Correct: ${q.word}`);
    setTimeout(nextRound, 800);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      <p className="text-sm text-muted-foreground">Pick the correctly spelled word:</p>
      <div className="grid grid-cols-1 gap-3 w-full">
        {q.options.map(w => (
          <button
            key={w}
            onClick={() => handleAnswer(w)}
            className="p-4 rounded-xl border bg-card font-bold text-lg hover:border-primary transition-all"
          >
            {w}
          </button>
        ))}
      </div>
      {feedback && (
        <p className={`font-bold ${feedback.startsWith('✓') ? 'text-green-600' : 'text-destructive'}`}>{feedback}</p>
      )}
    </div>
  );
}
