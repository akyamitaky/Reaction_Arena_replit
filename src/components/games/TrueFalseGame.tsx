import { useState, useEffect } from 'react';
import { GameContext } from '@/components/GameShell';

function generate() {
  const type = Math.floor(Math.random() * 2);
  if (type === 0) {
    const a = Math.floor(Math.random() * 20) + 2;
    const b = Math.floor(Math.random() * 20) + 2;
    const correct = a * b;
    const isTrue = Math.random() > 0.5;
    const shown = isTrue ? correct : correct + Math.floor(Math.random() * 10) + 1;
    return { statement: `${a} × ${b} = ${shown}`, answer: isTrue };
  } else {
    const a = Math.floor(Math.random() * 50) + 10;
    const b = Math.floor(Math.random() * 50) + 10;
    const isTrue = Math.random() > 0.5;
    const sign = isTrue ? (a + b > 50 ? '>' : '<') : a + b > 50 ? '<' : '>';
    return { statement: `${a} + ${b} ${sign} 50`, answer: isTrue };
  }
}

export default function TrueFalseGame({ round, addScore, reportWrong, nextRound }: GameContext) {
  const [q, setQ] = useState(() => generate());
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setQ(generate());
    setFeedback(null);
  }, [round]);

  const handleAnswer = (ans: boolean) => {
    if (feedback) return;
    const correct = ans === q.answer;
    if (correct) addScore(100);
    else reportWrong();
    setFeedback(correct ? '✓ Correct!' : `✗ It was ${q.answer ? 'True' : 'False'}`);
    setTimeout(nextRound, 800);
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-sm">
      <p className="text-sm text-muted-foreground">True or False?</p>
      <p className="text-2xl font-black text-center">{q.statement}</p>
      <div className="grid grid-cols-2 gap-4 w-full">
        <button
          onClick={() => handleAnswer(true)}
          className="p-5 rounded-xl border bg-card font-bold text-lg hover:border-green-500 hover:bg-green-500/5 transition-all"
        >
          ✓ True
        </button>
        <button
          onClick={() => handleAnswer(false)}
          className="p-5 rounded-xl border bg-card font-bold text-lg hover:border-destructive hover:bg-destructive/5 transition-all"
        >
          ✗ False
        </button>
      </div>
      {feedback && (
        <p className={`font-bold ${feedback.startsWith('✓') ? 'text-green-600' : 'text-destructive'}`}>{feedback}</p>
      )}
    </div>
  );
}
