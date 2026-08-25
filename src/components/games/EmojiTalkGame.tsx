import { useState, useEffect } from 'react';
import { GameContext } from '@/components/GameShell';

const PUZZLES = [
  { emojis: '🌍🔥', answer: 'Global Warming', options: ['Global Warming', 'Ice Age', 'Volcano', 'Sunset'] },
  { emojis: '🍕🇮🇹', answer: 'Italian Food', options: ['Italian Food', 'Pizza Party', 'French Cuisine', 'Fast Food'] },
  { emojis: '🎬⭐', answer: 'Movie Star', options: ['Rock Band', 'Movie Star', 'TV Show', 'Concert'] },
  { emojis: '📱💀', answer: 'Dead Phone', options: ['Dead Phone', 'New Phone', 'Phone Call', 'Selfie'] },
  { emojis: '🧠💡', answer: 'Bright Idea', options: ['Bright Idea', 'Headache', 'Study Hard', 'Science'] },
  { emojis: '🏃💨', answer: 'Running Fast', options: ['Walking Slow', 'Running Fast', 'Windy Day', 'Exercise'] },
  { emojis: '❄️🍦', answer: 'Ice Cream', options: ['Snow Day', 'Ice Cream', 'Cold Weather', 'Frozen Food'] },
  { emojis: '🎵👂', answer: 'Earworm', options: ['Earworm', 'Deaf', 'Loud Music', 'Headphones'] },
  { emojis: '🌙😴', answer: 'Sleepy Night', options: ['Morning', 'Sleepy Night', 'Eclipse', 'Bedtime Story'] },
  { emojis: '💪🦁', answer: 'Strong Lion', options: ['Weak Cat', 'Strong Lion', 'Brave Heart', 'Zoo Trip'] },
  { emojis: '📚🤓', answer: 'Bookworm', options: ['Bookworm', 'Teacher', 'Library', 'School'] },
  { emojis: '🌊🏄', answer: 'Surfing', options: ['Swimming', 'Surfing', 'Fishing', 'Boat Trip'] },
];

export default function EmojiTalkGame({ round, addScore, reportWrong, nextRound }: GameContext) {
  const [q, setQ] = useState(() => PUZZLES[0]);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setQ(PUZZLES[Math.floor(Math.random() * PUZZLES.length)]);
    setFeedback(null);
  }, [round]);

  const handleAnswer = (ans: string) => {
    if (feedback) return;
    const correct = ans === q.answer;
    if (correct) addScore(100);
    else reportWrong();
    setFeedback(correct ? '✓ Correct!' : `✗ It was "${q.answer}"`);
    setTimeout(nextRound, 1000);
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-sm">
      <p className="text-sm text-muted-foreground">What do these emojis mean?</p>
      <p className="text-7xl">{q.emojis}</p>
      <div className="grid grid-cols-2 gap-3 w-full">
        {q.options.map(o => (
          <button
            key={o}
            onClick={() => handleAnswer(o)}
            className="p-4 rounded-xl border bg-card font-semibold text-sm hover:border-primary transition-all"
          >
            {o}
          </button>
        ))}
      </div>
      {feedback && (
        <p className={`font-bold ${feedback.startsWith('✓') ? 'text-green-600' : 'text-destructive'}`}>{feedback}</p>
      )}
    </div>
  );
}
