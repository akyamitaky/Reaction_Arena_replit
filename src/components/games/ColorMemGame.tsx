import { useState, useEffect, useCallback } from 'react';
import { GameContext } from '@/components/GameShell';
import { ARENA_COLORS, type ArenaColor } from '@/lib/palette';

const COLORS = ARENA_COLORS.slice(0, 6);

export default function ColorMemGame({ round, addScore, reportWrong, nextRound }: GameContext) {
  const len = Math.min(3 + Math.floor((round - 1) / 2), 6);
  const [sequence, setSequence] = useState<ArenaColor[]>([]);
  const [phase, setPhase] = useState<'show' | 'pick' | 'done'>('show');
  const [activeIdx, setActiveIdx] = useState(-1);
  const [playerInput, setPlayerInput] = useState<string[]>([]);
  const [feedback, setFeedback] = useState('');

  const showSequence = useCallback((seq: ArenaColor[]) => {
    setPhase('show');
    seq.forEach((_, i) => {
      setTimeout(() => setActiveIdx(i), i * 700);
      setTimeout(() => setActiveIdx(-1), i * 700 + 500);
    });
    setTimeout(
      () => {
        setPhase('pick');
        setActiveIdx(-1);
      },
      seq.length * 700 + 200,
    );
  }, []);

  useEffect(() => {
    const seq = Array.from({ length: len }, () => COLORS[Math.floor(Math.random() * COLORS.length)]);
    setSequence(seq);
    setPlayerInput([]);
    setFeedback('');
    showSequence(seq);
  }, [round, len, showSequence]);

  const handlePick = (name: string) => {
    if (phase !== 'pick') return;
    const next = [...playerInput, name];
    setPlayerInput(next);
    const idx = next.length - 1;
    if (next[idx] !== sequence[idx].name) {
      reportWrong();
      setPhase('done');
      setFeedback('✗ Wrong color!');
      setTimeout(nextRound, 1000);
      return;
    }
    if (next.length === sequence.length) {
      addScore(len * 50);
      setPhase('done');
      setFeedback('✓ Perfect!');
      setTimeout(nextRound, 1000);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {phase === 'show' && (
        <>
          <p className="text-sm text-muted-foreground">Remember the color sequence!</p>
          <div className="flex gap-3">
            {sequence.map((c, i) => (
              <div
                key={i}
                className={`w-14 h-14 rounded-xl transition-all ${activeIdx === i ? 'scale-110' : 'scale-75 opacity-30'}`}
                style={{ backgroundColor: c.css }}
              />
            ))}
          </div>
        </>
      )}
      {(phase === 'pick' || phase === 'done') && (
        <>
          <p className="text-sm text-muted-foreground">
            {phase === 'pick' ? `Pick color ${playerInput.length + 1} of ${sequence.length}` : feedback}
          </p>
          <div className="grid grid-cols-3 gap-3">
            {COLORS.map(c => (
              <button
                key={c.name}
                onClick={() => handlePick(c.name)}
                className="w-16 h-16 rounded-xl hover:scale-110 transition-transform"
                style={{ backgroundColor: c.css }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
