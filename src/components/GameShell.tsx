import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Clock } from 'lucide-react';
import { GameMode } from '@/lib/gameConfig';

interface Props {
  mode: GameMode;
  onComplete?: (score: number, timeTakenMs: number) => void;
  arenaProgress?: { current: number; total: number; totalScore: number };
  children: (ctx: GameContext) => React.ReactNode;
}

export interface GameContext {
  round: number;
  score: number;
  timeLeft: number;
  addScore: (points: number) => void;
  nextRound: () => void;
  endGame: () => void;
}

const ARENA_TIME = 15; // 15 seconds per game in arena

export default function GameShell({ mode, onComplete, arenaProgress, children }: Props) {
  const navigate = useNavigate();
  const isArena = !!onComplete;

  // In arena mode: 1 round, 15s timer
  const effectiveRounds = isArena ? 1 : mode.rounds;
  const effectiveTime = isArena ? ARENA_TIME : mode.timePerRound;

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(effectiveTime);
  const [started, setStarted] = useState(false);

  const scoreRef = useRef(score);
  scoreRef.current = score;
  const roundRef = useRef(round);
  roundRef.current = round;
  const startTimeRef = useRef<number>(0);
  const doneRef = useRef(false);

  const endGame = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    const timeTakenMs = Date.now() - startTimeRef.current;
    if (onComplete) {
      onComplete(scoreRef.current, timeTakenMs);
    } else {
      navigate('/results', { state: { score: scoreRef.current, rounds: mode.rounds, gameId: mode.id, gameName: mode.label } });
    }
  }, [mode, navigate, onComplete]);

  const nextRound = useCallback(() => {
    if (roundRef.current >= effectiveRounds) {
      endGame();
    } else {
      setRound(r => r + 1);
      setTimeLeft(effectiveTime);
    }
  }, [effectiveRounds, effectiveTime, endGame]);

  const addScore = useCallback((pts: number) => setScore(s => s + pts), []);

  // Timer
  useEffect(() => {
    if (!started || effectiveTime === 0 || timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { nextRound(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [started, timeLeft, effectiveTime, nextRound]);

  const handleStart = () => {
    startTimeRef.current = Date.now();
    setStarted(true);
  };

  if (!started) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-6">
        {arenaProgress && (
          <div className="text-center mb-2">
            <p className="text-xs font-semibold text-primary tracking-widest uppercase">Arena Challenge</p>
            <p className="text-sm text-muted-foreground">Game {arenaProgress.current} of {arenaProgress.total} · {arenaProgress.totalScore} pts so far</p>
          </div>
        )}
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
          <mode.icon className={`w-8 h-8 ${mode.color}`} />
        </div>
        <h1 className="text-3xl font-black">{mode.label}</h1>
        <p className="text-muted-foreground text-center max-w-sm">{mode.description}</p>
        {isArena ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{ARENA_TIME}s · Answer fast for more points!</span>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">{mode.rounds} rounds{mode.timePerRound > 0 ? ` · ${mode.timePerRound}s per round` : ''}</div>
        )}
        <Button size="lg" className="text-lg px-10" onClick={handleStart}>Start!</Button>
        {!arenaProgress && <Button variant="ghost" onClick={() => navigate('/select')}>← Back to modes</Button>}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b bg-card">
        <div className="flex items-center gap-2">
          {!arenaProgress && <Button variant="ghost" size="icon" onClick={() => navigate('/select')}><ArrowLeft className="w-5 h-5" /></Button>}
          {arenaProgress && <span className="text-xs font-semibold text-muted-foreground px-2">Game {arenaProgress.current}/{arenaProgress.total}</span>}
        </div>
        <div className="flex items-center gap-4 text-sm font-semibold">
          {!isArena && <span>Round {round}/{effectiveRounds}</span>}
          <span className="flex items-center gap-1"><Trophy className="w-4 h-4 text-primary" />{score}</span>
          {effectiveTime > 0 && <span className={`tabular-nums ${timeLeft <= 3 ? 'text-destructive animate-pulse' : ''}`}>{timeLeft}s</span>}
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        {children({ round, score, timeLeft, addScore, nextRound, endGame })}
      </main>
    </div>
  );
}
