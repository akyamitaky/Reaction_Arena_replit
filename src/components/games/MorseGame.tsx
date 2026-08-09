import { useState, useEffect } from 'react';
import { GameContext } from '@/components/GameShell';

const MORSE: Record<string, string> = {
  A: '·−', B: '−···', C: '−·−·', D: '−··', E: '·', F: '··−·',
  G: '−−·', H: '····', I: '··', J: '·−−−', K: '−·−', L: '·−··',
  M: '−−', N: '−·', O: '−−−', P: '·−−·', Q: '−−·−', R: '·−·',
  S: '···', T: '−', U: '··−', V: '···−', W: '·−−', X: '−··−',
  Y: '−·−−', Z: '−−··',
};

const WORDS = ['SOS', 'HI', 'GO', 'OK', 'CAT', 'DOG', 'RUN', 'FUN', 'WIN', 'ACE', 'JAM', 'ZAP', 'KEY', 'MAP', 'NET'];

function generate() {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)];
  const morse = word.split('').map(c => MORSE[c]).join('  ');
  const pool = [...WORDS].filter(w => w !== word).sort(() => Math.random() - 0.5).slice(0, 3);
  const options = [word, ...pool].sort(() => Math.random() - 0.5);
  return { morse, answer: word, options };
}

export default function MorseGame({ round, addScore, nextRound }: GameContext) {
  const [q, setQ] = useState(() => generate());
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => { setQ(generate()); setFeedback(null); }, [round]);

  const handleAnswer = (word: string) => {
    if (feedback) return;
    const correct = word === q.answer;
    if (correct) addScore(150);
    setFeedback(correct ? '✓ Correct!' : `✗ It was "${q.answer}"`);
    setTimeout(nextRound, 1000);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      <p className="text-sm text-muted-foreground">Decode the Morse code!</p>
      <div className="px-4 py-3 rounded-xl bg-secondary/50 text-center">
        <p className="text-3xl font-mono tracking-[0.3em] text-primary">{q.morse}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 w-full text-xs text-muted-foreground">
        <p>· = dot (short)</p>
        <p>− = dash (long)</p>
      </div>
      <div className="grid grid-cols-2 gap-3 w-full">
        {q.options.map(o => (
          <button key={o} onClick={() => handleAnswer(o)} className="p-4 rounded-xl border bg-card font-black text-lg tracking-widest hover:border-primary transition-all">{o}</button>
        ))}
      </div>
      {feedback && <p className={`font-bold ${feedback.startsWith('✓') ? 'text-green-600' : 'text-destructive'}`}>{feedback}</p>}
    </div>
  );
}
