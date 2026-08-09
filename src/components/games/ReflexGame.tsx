import { useState, useEffect, useRef } from 'react';
import { GameContext } from '@/components/GameShell';

type Phase = 'waiting' | 'ready' | 'go' | 'result' | 'early';

export default function ReflexGame({ addScore, nextRound }: GameContext) {
  const [phase, setPhase] = useState<Phase>('waiting');
  const [reactionTime, setReactionTime] = useState(0);
  const goTime = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setPhase('ready');
    const delay = 1500 + Math.random() * 3000;
    timerRef.current = setTimeout(() => {
      goTime.current = Date.now();
      setPhase('go');
    }, delay);
    return () => clearTimeout(timerRef.current);
  }, []);

  const handleTap = () => {
    if (phase === 'ready') {
      clearTimeout(timerRef.current);
      setPhase('early');
      setTimeout(nextRound, 1200);
    } else if (phase === 'go') {
      const ms = Date.now() - goTime.current;
      setReactionTime(ms);
      const pts = Math.max(0, Math.round(300 - ms));
      addScore(pts);
      setPhase('result');
      setTimeout(nextRound, 1200);
    }
  };

  return (
    <button
      onClick={handleTap}
      className={`w-full max-w-md h-64 rounded-3xl flex flex-col items-center justify-center gap-3 text-2xl font-black transition-all ${
        phase === 'ready' ? 'bg-destructive/20 text-destructive' :
        phase === 'go' ? 'bg-green-500/20 text-green-600' :
        phase === 'early' ? 'bg-destructive/10 text-destructive' :
        phase === 'result' ? 'bg-primary/10 text-primary' :
        'bg-muted'
      }`}
    >
      {phase === 'waiting' && 'Get ready...'}
      {phase === 'ready' && <><span className="text-4xl">🔴</span><span>Wait for green...</span></>}
      {phase === 'go' && <><span className="text-4xl">🟢</span><span>TAP NOW!</span></>}
      {phase === 'early' && <><span>Too early! 😅</span><span className="text-lg font-normal">Wait for the green circle</span></>}
      {phase === 'result' && <><span>{reactionTime}ms</span><span className="text-lg font-normal">{reactionTime < 200 ? 'Lightning fast! ⚡' : reactionTime < 350 ? 'Great reflexes! 🔥' : 'Keep practicing! 💪'}</span></>}
    </button>
  );
}
