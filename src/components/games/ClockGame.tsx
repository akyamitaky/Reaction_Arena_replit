import { useState, useEffect } from 'react';
import { GameContext } from '@/components/GameShell';
import { generateClockQuestion, formatClockTime, type ClockQuestion } from '@/lib/gameQuestions';

const C = 80;
const R = 66;

function ClockFace({ hours, minutes }: { hours: number; minutes: number }) {
  const hourRad = (((hours % 12) + minutes / 60) * 30 * Math.PI) / 180;
  const minRad = (minutes * 6 * Math.PI) / 180;
  const hand = (len: number, rad: number) => ({
    x2: C + len * Math.sin(rad),
    y2: C - len * Math.cos(rad),
  });
  const hourHand = hand(34, hourRad);
  const minHand = hand(50, minRad);

  return (
    <svg
      width="160"
      height="160"
      viewBox="0 0 160 160"
      role="img"
      aria-label={`Analog clock showing ${formatClockTime((hours % 12) * 60 + minutes)}`}
      className="mx-auto"
    >
      <circle cx={C} cy={C} r={R} fill="#f8fafc" stroke="#94a3b8" strokeWidth="4" />
      {Array.from({ length: 12 }, (_, i) => {
        const rad = (i * 30 * Math.PI) / 180;
        const big = i % 3 === 0;
        const r1 = R - (big ? 14 : 9);
        const r2 = R - 3;
        return (
          <line
            key={i}
            x1={C + r1 * Math.sin(rad)}
            y1={C - r1 * Math.cos(rad)}
            x2={C + r2 * Math.sin(rad)}
            y2={C - r2 * Math.cos(rad)}
            stroke={big ? '#334155' : '#94a3b8'}
            strokeWidth={big ? 3 : 1.5}
          />
        );
      })}
      <line x1={C} y1={C} x2={hourHand.x2} y2={hourHand.y2} stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
      <line x1={C} y1={C} x2={minHand.x2} y2={minHand.y2} stroke="#2563eb" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx={C} cy={C} r="4" fill="#1e293b" />
    </svg>
  );
}

export default function ClockGame({ round, addScore, reportWrong, nextRound }: GameContext) {
  const [q, setQ] = useState<ClockQuestion>(() => generateClockQuestion());
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setQ(generateClockQuestion());
    setFeedback(null);
  }, [round]);

  const handleAnswer = (t: string) => {
    if (feedback) return;
    const correct = t === q.answer;
    if (correct) addScore(100);
    else reportWrong();
    setFeedback(correct ? '✓ Correct!' : `✗ Answer: ${q.answer}`);
    setTimeout(nextRound, 800);
  };

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-sm">
      <p className="text-sm text-muted-foreground">What time is it?</p>
      <ClockFace hours={q.hours} minutes={q.minutes} />
      <div className="grid grid-cols-2 gap-3 w-full">
        {q.options.map(t => (
          <button
            key={t}
            onClick={() => handleAnswer(t)}
            className="p-4 rounded-xl border bg-card font-bold text-xl tabular-nums hover:border-primary transition-all"
          >
            {t}
          </button>
        ))}
      </div>
      {feedback && (
        <p className={`font-bold ${feedback.startsWith('✓') ? 'text-green-600' : 'text-destructive'}`}>{feedback}</p>
      )}
    </div>
  );
}
