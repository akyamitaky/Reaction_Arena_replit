import { useEffect, useState } from 'react';
import { GameContext } from '@/components/GameShell';

const SPOTS = 9;

export default function WhackGame({ round, addScore }: GameContext) {
  const [activeSpot, setActiveSpot] = useState(() => Math.floor(Math.random() * SPOTS));
  const [hits, setHits] = useState(0);

  useEffect(() => {
    setActiveSpot(Math.floor(Math.random() * SPOTS));
    setHits(0);
    const moveTimer = setInterval(() => {
      setActiveSpot(Math.floor(Math.random() * SPOTS));
    }, 700);
    return () => clearInterval(moveTimer);
  }, [round]);

  const whack = (index: number) => {
    if (index !== activeSpot) return;
    setHits(value => value + 1);
    addScore(25);
    setActiveSpot(Math.floor(Math.random() * SPOTS));
  };

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-sm">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Whack as many as you can!</p>
        <p className="font-black text-primary text-lg">{hits} hits</p>
      </div>
      <div className="grid grid-cols-3 gap-3 p-4 rounded-3xl bg-primary/5 border border-primary/20">
        {Array.from({ length: SPOTS }, (_, index) => (
          <button
            key={index}
            aria-label={index === activeSpot ? 'Whack the mole' : 'Empty spot'}
            onClick={() => whack(index)}
            className={`w-20 h-20 rounded-2xl border-2 transition-all ${index === activeSpot ? 'bg-amber-400/20 border-amber-400 scale-110 shadow-lg' : 'bg-card border-border/60 hover:border-primary/40'}`}
          >
            {index === activeSpot ? <span className="text-4xl">🐹</span> : <span className="text-2xl opacity-20">•</span>}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Every hit adds points to your room score</p>
    </div>
  );
}