import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GameContext } from '@/components/GameShell';

const WORDS = ['apple', 'brain', 'cloud', 'dance', 'eagle', 'flame', 'grape', 'heart', 'ivory', 'jewel', 'knife', 'lemon', 'magic', 'noble', 'ocean', 'piano', 'queen', 'river', 'storm', 'tiger', 'ultra', 'vivid', 'whale', 'xenon', 'zebra', 'blaze', 'charm', 'dream', 'frost', 'ghost'];

export default function ReverseGame({ round, addScore, nextRound }: GameContext) {
  const [word, setWord] = useState('');
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setWord(WORDS[Math.floor(Math.random() * WORDS.length)]);
    setInput('');
    setFeedback(null);
  }, [round]);

  const handleSubmit = () => {
    if (feedback) return;
    const reversed = word.split('').reverse().join('');
    const correct = input.toLowerCase().trim() === reversed;
    if (correct) addScore(150);
    setFeedback(correct ? '✓ Correct!' : `✗ Answer: ${reversed}`);
    setTimeout(nextRound, 1000);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      <p className="text-sm text-muted-foreground">Type this word <strong>backwards</strong>:</p>
      <p className="text-5xl font-black tracking-widest">{word.toUpperCase()}</p>
      <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} placeholder="Type backwards..." className="text-center text-xl font-mono" autoFocus />
      <Button onClick={handleSubmit} disabled={!input.trim()} className="w-full">Submit</Button>
      {feedback && <p className={`font-bold ${feedback.startsWith('✓') ? 'text-green-600' : 'text-destructive'}`}>{feedback}</p>}
    </div>
  );
}
