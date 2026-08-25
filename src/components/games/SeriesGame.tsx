import { useState, useEffect } from 'react';
import { GameContext } from '@/components/GameShell';
import { generateSeriesQuestion, type SeriesQuestion } from '@/lib/gameQuestions';

export default function SeriesGame({ round, addScore, reportWrong, nextRound }: GameContext) {
  const [q, setQ] = useState<SeriesQuestion>(() => generateSeriesQuestion());
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setQ(generateSeriesQuestion());
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
      <p className="text-sm text-muted-foreground">
        What number comes next?{' '}
        <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{q.hint}</span>
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {q.terms.map((n, i) => (
          <span
            key={i}
            className="flex h-12 min-w-12 items-center justify-center rounded-xl bg-secondary px-2 font-black text-lg tabular-nums"
          >
            {n}
          </span>
        ))}
        <span className="flex h-12 min-w-12 items-center justify-center rounded-xl border-2 border-dashed border-primary px-2 font-black text-lg text-primary tabular-nums">
          ?
        </span>
      </div>
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
