import { useState, useEffect, useCallback } from 'react';
import { GameContext } from '@/components/GameShell';

const TILE_COLORS = ['bg-destructive', 'bg-primary', 'bg-chart-3', 'bg-chart-1'];

export default function SequenceGame({ round, addScore, reportWrong, nextRound }: GameContext) {
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [phase, setPhase] = useState<'showing' | 'input' | 'feedback'>('showing');
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const seqLength = Math.min(3 + Math.floor((round - 1) / 2), 7);

  const showSequence = useCallback((seq: number[]) => {
    setPhase('showing');
    seq.forEach((tile, i) => {
      setTimeout(() => setActiveIdx(tile), i * 600);
      setTimeout(() => setActiveIdx(null), i * 600 + 400);
    });
    setTimeout(
      () => {
        setPhase('input');
        setActiveIdx(null);
      },
      seq.length * 600 + 200,
    );
  }, []);

  useEffect(() => {
    const seq = Array.from({ length: seqLength }, () => Math.floor(Math.random() * 4));
    setSequence(seq);
    setPlayerInput([]);
    setFeedback('');
    showSequence(seq);
  }, [round, seqLength, showSequence]);

  const handleTap = (idx: number) => {
    if (phase !== 'input') return;
    const next = [...playerInput, idx];
    setPlayerInput(next);
    setActiveIdx(idx);
    setTimeout(() => setActiveIdx(null), 200);

    if (next[next.length - 1] !== sequence[next.length - 1]) {
      reportWrong();
      setPhase('feedback');
      setFeedback('✗ Wrong sequence!');
      setTimeout(nextRound, 1000);
      return;
    }
    if (next.length === sequence.length) {
      addScore(seqLength * 50);
      setPhase('feedback');
      setFeedback('✓ Perfect!');
      setTimeout(nextRound, 1000);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm text-muted-foreground">
        {phase === 'showing' ? 'Watch the sequence...' : phase === 'input' ? 'Repeat it!' : feedback}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map(i => (
          <button
            key={i}
            onClick={() => handleTap(i)}
            className={`w-24 h-24 rounded-2xl transition-all ${TILE_COLORS[i]} ${activeIdx === i ? 'opacity-100 scale-110' : 'opacity-40'} ${phase === 'input' ? 'cursor-pointer' : 'cursor-default'}`}
          />
        ))}
      </div>
      {phase === 'input' && (
        <div className="flex gap-1">
          {sequence.map((_, i) => (
            <div key={i} className={`w-3 h-3 rounded-full ${i < playerInput.length ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>
      )}
    </div>
  );
}
