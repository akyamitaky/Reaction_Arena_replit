import { useState, useEffect, useRef } from 'react';
import { GameContext } from '@/components/GameShell';
import { MAX_ARENA_SCORE } from '@/lib/gameConstants';

const EMOJIS = ['🍎', '🍌', '🍇', '🌟', '🔥', '💎', '🌈', '🎯'];

function generatePairs() {
  const count = 6;
  const selected = EMOJIS.slice(0, count);
  const cards = [...selected, ...selected].map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
  return cards.sort(() => Math.random() - 0.5);
}

export default function TileMatchGame({ addScore, nextRound }: GameContext) {
  const [cards, setCards] = useState(() => generatePairs());
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matches, setMatches] = useState(0);
  const [locked, setLocked] = useState(false);

  const doneRef = useRef(false);

  useEffect(() => {
    if (matches === 6 && !doneRef.current) {
      doneRef.current = true;
      addScore(MAX_ARENA_SCORE);
      setTimeout(nextRound, 1000);
    }
  }, [matches]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFlip = (idx: number) => {
    if (locked || cards[idx].matched || flipped.includes(idx)) return;
    const next = [...flipped, idx];
    setFlipped(next);

    if (next.length === 2) {
      setLocked(true);
      if (cards[next[0]].emoji === cards[next[1]].emoji) {
        setCards(prev => prev.map((c, i) => (next.includes(i) ? { ...c, matched: true } : c)));
        setMatches(m => m + 1);
        setFlipped([]);
        setLocked(false);
      } else {
        setTimeout(() => {
          setFlipped([]);
          setLocked(false);
        }, 600);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm text-muted-foreground">Match the pairs! ({matches}/6)</p>
      <div className="grid grid-cols-4 gap-2">
        {cards.map((card, i) => {
          const show = flipped.includes(i) || card.matched;
          return (
            <button
              key={card.id}
              onClick={() => handleFlip(i)}
              className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl transition-all ${show ? (card.matched ? 'bg-green-500/20 border-green-500 border' : 'bg-card border') : 'bg-secondary hover:bg-secondary/80 cursor-pointer'}`}
            >
              {show ? card.emoji : '?'}
            </button>
          );
        })}
      </div>
    </div>
  );
}
