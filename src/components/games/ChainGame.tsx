import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GameContext } from '@/components/GameShell';

function generate() {
  const start = Math.floor(Math.random() * 10) + 1;
  const step = [2, 3, 4, 5, -2, -3][Math.floor(Math.random() * 6)];
  const seq = Array.from({ length: 4 }, (_, i) => start + step * i);
  const answer = start + step * 4;
  return { seq, answer, step };
}

export default function ChainGame({ round, addScore, reportWrong, nextRound }: GameContext) {
  const [q, setQ] = useState(() => generate());
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setQ(generate());
    setInput('');
    setFeedback(null);
  }, [round]);

  const handleSubmit = () => {
    if (feedback) return;
    const correct = parseInt(input) === q.answer;
    if (correct) addScore(100);
    else reportWrong();
    setFeedback(correct ? '✓ Correct!' : `✗ Answer: ${q.answer} (${q.step > 0 ? '+' : ''}${q.step})`);
    setTimeout(nextRound, 1000);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      <p className="text-sm text-muted-foreground">What comes next?</p>
      <div className="flex items-center gap-3">
        {q.seq.map((n, i) => (
          <span
            key={i}
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-secondary font-black text-xl"
          >
            {n}
          </span>
        ))}
        <span className="w-12 h-12 flex items-center justify-center rounded-xl border-2 border-dashed border-primary font-black text-xl text-primary">
          ?
        </span>
      </div>
      <Input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        placeholder="Your answer"
        className="text-center text-xl"
        type="number"
        autoFocus
      />
      <Button onClick={handleSubmit} disabled={!input.trim()} className="w-full">
        Submit
      </Button>
      {feedback && (
        <p className={`font-bold ${feedback.startsWith('✓') ? 'text-green-600' : 'text-destructive'}`}>{feedback}</p>
      )}
    </div>
  );
}
