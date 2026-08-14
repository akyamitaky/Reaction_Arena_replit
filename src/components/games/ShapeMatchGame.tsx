import { useEffect, useState } from 'react';
import { GameContext } from '@/components/GameShell';

type Shape = { id: string; color: string; kind: 'circle' | 'square' | 'triangle' | 'diamond' };

const SHAPES: Shape[] = [
  { id: 'circle', color: '#f97316', kind: 'circle' },
  { id: 'square', color: '#14b8a6', kind: 'square' },
  { id: 'triangle', color: '#8b5cf6', kind: 'triangle' },
  { id: 'diamond', color: '#ec4899', kind: 'diamond' },
];

function generate() {
  const target = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  return { target, options: [...SHAPES].sort(() => Math.random() - 0.5) };
}

function ShapeIcon({ shape, size = 'large' }: { shape: Shape; size?: 'small' | 'large' }) {
  const isSmall = size === 'small';
  return (
    <span
      aria-hidden="true"
      className={`${isSmall ? 'w-10 h-10' : 'w-16 h-16'} block ${shape.kind === 'circle' ? 'rounded-full' : shape.kind === 'square' ? 'rounded-lg' : ''} ${shape.kind === 'diamond' ? 'rotate-45 rounded-lg' : ''}`}
      style={{
        backgroundColor: shape.color,
        clipPath: shape.kind === 'triangle' ? 'polygon(50% 0%, 100% 100%, 0% 100%)' : undefined,
      }}
    />
  );
}

export default function ShapeMatchGame({ round, addScore, nextRound }: GameContext) {
  const [question, setQuestion] = useState(generate);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setQuestion(generate());
    setFeedback(null);
  }, [round]);

  const handleChoice = (id: string) => {
    if (feedback) return;
    const correct = id === question.target.id;
    if (correct) addScore(100);
    setFeedback(correct ? '✓ Perfect match!' : '✗ Try the next one!');
    setTimeout(nextRound, 750);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm text-muted-foreground">Find the shape that matches</p>
      <div className="w-28 h-28 rounded-2xl bg-secondary/60 flex items-center justify-center">
        <ShapeIcon shape={question.target} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {question.options.map(shape => (
          <button
            key={shape.id}
            aria-label={`Choose ${shape.id}`}
            onClick={() => handleChoice(shape.id)}
            className="w-28 h-24 rounded-2xl border bg-card flex items-center justify-center hover:border-primary hover:scale-105 transition-all"
          >
            <ShapeIcon shape={shape} size="small" />
          </button>
        ))}
      </div>
      {feedback && <p className={`font-bold ${feedback.startsWith('✓') ? 'text-green-600' : 'text-destructive'}`}>{feedback}</p>}
    </div>
  );
}