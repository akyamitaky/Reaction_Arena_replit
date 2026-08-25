import { useState, useEffect } from 'react';
import { GameContext } from '@/components/GameShell';
import { generatePalindromeQuestion, type PalindromeQuestion } from '@/lib/gameQuestions';

export default function PalindromeGame({ round, addScore, reportWrong, nextRound }: GameContext) {
  const [q, setQ] = useState<PalindromeQuestion>(() => generatePalindromeQuestion());
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setQ(generatePalindromeQuestion());
    setFeedback(null);
  }, [round]);

  const handleAnswer = (a: string) => {
    if (feedback) return;
    const correct = a === q.answer;
    if (correct) addScore(100);
    else reportWrong();
    setFeedback(correct ? '✓ Correct!' : `✗ It's "${q.answer}"`);
    setTimeout(nextRound, 800);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      <p className="text-sm text-muted-foreground">Is this word a palindrome (reads the same backwards)?</p>
      <p className="text-4xl font-black tracking-widest">{q.word.toUpperCase()}</p>
      <div className="grid grid-cols-2 gap-3 w-full">
        {['Yes', 'No'].map(a => (
          <button
            key={a}
            onClick={() => handleAnswer(a)}
            className="p-4 rounded-xl border bg-card font-bold text-xl hover:border-primary transition-all"
          >
            {a}
          </button>
        ))}
      </div>
      {feedback && (
        <p className={`font-bold ${feedback.startsWith('✓') ? 'text-green-600' : 'text-destructive'}`}>{feedback}</p>
      )}
    </div>
  );
}
