import { useState, useEffect } from 'react';
import { GameContext } from '@/components/GameShell';
import { generateColorMixQuestion, MIX_COLORS, type ColorMixQuestion } from '@/lib/gameQuestions';

function swatch(c: string, className: string) {
  return (
    <span className={className} style={{ backgroundColor: c === 'white' ? '#f8fafc' : MIX_COLORS[c] }} aria-label={c} />
  );
}

export default function ColorMixGame({ round, addScore, reportWrong, nextRound }: GameContext) {
  const [q, setQ] = useState<ColorMixQuestion>(() => generateColorMixQuestion());
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setQ(generateColorMixQuestion());
    setFeedback(null);
  }, [round]);

  const handleAnswer = (c: string) => {
    if (feedback) return;
    const correct = c === q.answer;
    if (correct) addScore(100);
    else reportWrong();
    setFeedback(correct ? '✓ Correct!' : `✗ Answer: ${q.answer}`);
    setTimeout(nextRound, 800);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      <p className="text-sm text-muted-foreground">What color do you get?</p>
      <div className="flex items-center gap-3">
        {swatch(q.a, 'h-14 w-14 rounded-full border border-border shadow-lg')}
        <span className="text-2xl font-black">+</span>
        {swatch(q.b, 'h-14 w-14 rounded-full border border-border shadow-lg')}
        <span className="text-2xl font-black">=</span>
        <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-primary text-xl font-black text-primary">
          ?
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 w-full">
        {q.options.map(c => (
          <button
            key={c}
            onClick={() => handleAnswer(c)}
            className="flex items-center justify-center gap-2 p-3 rounded-xl border bg-card font-bold capitalize hover:border-primary transition-all"
          >
            {swatch(c, 'h-5 w-5 rounded-full border border-border')}
            {c}
          </button>
        ))}
      </div>
      {feedback && (
        <p className={`font-bold ${feedback.startsWith('✓') ? 'text-green-600' : 'text-destructive'}`}>{feedback}</p>
      )}
    </div>
  );
}
