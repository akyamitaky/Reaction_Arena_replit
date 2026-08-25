import { useState, useEffect, useRef } from 'react';
import { GameContext } from '@/components/GameShell';
import { MAX_ARENA_SCORE } from '@/lib/gameConstants';

const PHRASES = [
  'the quick brown fox',
  'pack my box with five',
  'how vexingly quick',
  'the five boxing wizards',
  'bright vixens jump',
  'crazy Frederick bought',
  'jived fox nymph grabs',
  'quick wafting zephyrs',
  'sphinx of black quartz',
  'two driven jocks help',
  'five quacking zephyrs',
  'the jay pig fox zebra',
  'jump by vow of quick',
  'few quips jolt my wax',
  'brick quiz whangs jumpy',
];

export default function SpeedTypeGame({ round, addScore, nextRound }: GameContext) {
  const [phrase, setPhrase] = useState('');
  const [input, setInput] = useState('');
  const [done, setDone] = useState(false);
  const startTime = useRef(0);

  useEffect(() => {
    setPhrase(PHRASES[Math.floor(Math.random() * PHRASES.length)]);
    setInput('');
    setDone(false);
    startTime.current = 0;
  }, [round]);

  const handleChange = (val: string) => {
    if (done) return;
    if (!startTime.current) startTime.current = Date.now();
    setInput(val);
    if (val.toLowerCase() === phrase.toLowerCase()) {
      const ms = Date.now() - startTime.current;
      const wpm = Math.round((phrase.split(' ').length / (ms / 1000)) * 60);
      addScore(Math.min(MAX_ARENA_SCORE, wpm * 3));
      setDone(true);
      setTimeout(nextRound, 1200);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      <p className="text-sm text-muted-foreground">Type the phrase below as fast as you can:</p>
      <div className="text-2xl font-mono tracking-wide text-center">
        {phrase.split('').map((ch, i) => (
          <span
            key={i}
            className={
              i < input.length
                ? input[i]?.toLowerCase() === ch.toLowerCase()
                  ? 'text-green-600'
                  : 'text-destructive'
                : 'text-muted-foreground/40'
            }
          >
            {ch}
          </span>
        ))}
      </div>
      <input
        value={input}
        onChange={e => handleChange(e.target.value)}
        aria-label="Type the phrase shown above"
        className="w-full text-center text-xl font-mono p-3 rounded-xl border bg-card outline-none focus:border-primary transition-colors"
        placeholder="Start typing..."
        autoFocus
      />
      {done && (
        <p aria-live="polite" className="font-bold text-green-600">
          Done!
        </p>
      )}
    </div>
  );
}
