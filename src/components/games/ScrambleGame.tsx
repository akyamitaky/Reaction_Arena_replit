import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GameContext } from '@/components/GameShell';

const WORDS = ['planet', 'rocket', 'garden', 'silver', 'monkey', 'castle', 'dragon', 'sunset', 'forest', 'bridge', 'puzzle', 'bottle', 'candle', 'dinner', 'engine', 'flower', 'guitar', 'hammer', 'island', 'jungle', 'kitten', 'laptop', 'mirror', 'needle', 'orange'];

function scramble(word: string): string {
  const arr = word.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('') === word ? scramble(word) : arr.join('');
}

export default function ScrambleGame({ round, addScore, nextRound }: GameContext) {
  const [word, setWord] = useState('');
  const [scrambled, setScrambled] = useState('');
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const w = WORDS[Math.floor(Math.random() * WORDS.length)];
    setWord(w);
    setScrambled(scramble(w));
    setInput('');
    setFeedback(null);
  }, [round]);

  const handleSubmit = () => {
    if (feedback) return;
    const correct = input.toLowerCase().trim() === word;
    if (correct) addScore(150);
    setFeedback(correct ? '✓ Correct!' : `✗ Answer: ${word}`);
    setTimeout(nextRound, 1000);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      <p className="text-sm text-muted-foreground">Unscramble this word:</p>
      <div className="flex gap-2">
        {scrambled.split('').map((ch, i) => (
          <span key={i} className="w-10 h-12 flex items-center justify-center rounded-lg bg-secondary font-black text-xl uppercase">{ch}</span>
        ))}
      </div>
      <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} placeholder="Your answer..." className="text-center text-xl" autoFocus />
      <Button onClick={handleSubmit} disabled={!input.trim()} className="w-full">Submit</Button>
      {feedback && <p className={`font-bold ${feedback.startsWith('✓') ? 'text-green-600' : 'text-destructive'}`}>{feedback}</p>}
    </div>
  );
}
