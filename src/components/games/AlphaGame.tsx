import { useState, useEffect } from 'react';
import { GameContext } from '@/components/GameShell';
import { generateAlphaQuestion, type AlphaQuestion } from '@/lib/gameQuestions';

export default function AlphaGame({ round, addScore, reportWrong, nextRound }: GameContext) {
  const [q, setQ] = useState<AlphaQuestion>(() => generateAlphaQuestion());
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setQ(generateAlphaQuestion());
    setFeedback(null);
  }, [round]);

  const handleAnswer = (w: string) => {
    if (feedback) return;
    const correct = w === q.answer;
    if (correct) addScore(100);
    else reportWrong();
    setFeedback(correct ? '✓ Correct!' : `✗ Answer: ${q.answer}`);
    setTimeout(nextRound, 800);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      <p className="text-sm text-muted-foreground">Which word comes first in the dictionary?</p>
      <div className="grid grid-cols-2 gap-3 w-full">
        {q.words.map(w => (
          <button
            key={w}
            onClick={() => handleAnswer(w)}
            className="p-4 rounded-xl border bg-card font-bold text-lg hover:border-primary transition-all capitalize"
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
