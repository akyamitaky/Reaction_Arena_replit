import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, PenLine, Eye, CheckCircle2, XCircle, Trophy } from 'lucide-react';
import {
  beginScribbleRound,
  endScribbleRound,
  submitScribbleGuess,
  subscribeToScribbleStrokes,
  sendScribbleStroke,
  type ScribbleRoundState,
  type ScribbleStroke,
} from '@/lib/arenaApi';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  roomId: string;
  playerId: string;
  playerToken: string;
}

const ROUND_SECONDS = 90;
const CANVAS_W = 460;
const CANVAS_H = 300;

type GuessStatus = 'idle' | 'correct' | 'wrong' | 'resolved';

function drawStroke(ctx: CanvasRenderingContext2D, stroke: ScribbleStroke) {
  if (stroke.type === 'clear') {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#f8f8f8';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    return;
  }
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = stroke.color || '#111';
  if (stroke.type === 'down') {
    ctx.beginPath();
    ctx.moveTo(stroke.x, stroke.y);
  } else {
    ctx.lineTo(stroke.x, stroke.y);
    ctx.stroke();
  }
}

export default function ScribbleArenaGame({ roomId, playerId, playerToken }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [round, setRound] = useState<ScribbleRoundState | null>(null);
  const [loading, setLoading] = useState(true);
  const [guess, setGuess] = useState('');
  const [guessStatus, setGuessStatus] = useState<GuessStatus>('idle');
  const [guessWord, setGuessWord] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const drawingRef = useRef(false);
  const roundRef = useRef<ScribbleRoundState | null>(null);
  roundRef.current = round;

  const isDrawer = round?.youAreDrawer === true;

  // Paint a board. Used for both the local drawer canvas and guesser replay.
  const ensureCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  }, []);

  const resetBoard = useCallback(() => {
    const ctx = ensureCtx();
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#f8f8f8';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }, [ensureCtx]);

  // Fetch the current round state. If the draw index changed, reset the board
  // for the new round.
  const refreshRound = useCallback(async () => {
    try {
      const next = await beginScribbleRound({ roomId, playerId, playerToken });
      setRound(prev => {
        if (prev && prev.drawIdx === next.drawIdx) return prev;
        return next;
      });
      setLoading(false);
      const prev = roundRef.current;
      if (!prev || prev.drawIdx !== next.drawIdx) {
        resetBoard();
        setGuess('');
        setGuessStatus('idle');
        setGuessWord(null);
        setSecondsLeft(ROUND_SECONDS);
        // The drawer clears the shared board so every client wipes instantly.
        if (next.youAreDrawer) {
          sendScribbleStroke(roomId, { x: 0, y: 0, type: 'clear', drawIdx: next.drawIdx });
        }
      }
    } catch (error) {
      console.warn('[scribble] failed to fetch round', error);
    }
  }, [roomId, playerId, playerToken, ensureCtx, resetBoard]);

  // One persistent channel per room; strokes are filtered by round drawIdx so
  // none are lost across round switches.
  const onStroke = useCallback(
    (stroke: ScribbleStroke) => {
      const current = roundRef.current;
      if (!current || stroke.drawIdx !== current.drawIdx) return;
      const ctx = ensureCtx();
      if (ctx) drawStroke(ctx, stroke);
    },
    [ensureCtx],
  );

  useEffect(() => {
    const unsub = subscribeToScribbleStrokes(roomId, onStroke);
    return () => unsub();
  }, [roomId, onStroke]);

  useEffect(() => {
    void refreshRound();
  }, [refreshRound]);

  // Poll for round changes (new drawer, someone guessed, round advanced).
  useEffect(() => {
    const t = window.setInterval(() => void refreshRound(), 2000);
    return () => window.clearInterval(t);
  }, [refreshRound]);

  // Drawer countdown; auto-end when time runs out.
  useEffect(() => {
    if (!round || !isDrawer || round.roundResolved) return;
    if (secondsLeft <= 0) {
      void handleEndRound();
      return;
    }
    const t = window.setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [round, isDrawer, secondsLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Drawing (drawer only) ----
  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_W;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_H;
    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const { x, y } = getPos(e);
    const stroke: ScribbleStroke = { x, y, type: 'down', drawIdx: round?.drawIdx ?? 0 };
    const ctx = ensureCtx();
    if (ctx) drawStroke(ctx, stroke);
    sendScribbleStroke(roomId, stroke);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer || !drawingRef.current) return;
    const { x, y } = getPos(e);
    const stroke: ScribbleStroke = { x, y, type: 'move', drawIdx: round?.drawIdx ?? 0 };
    const ctx = ensureCtx();
    if (ctx) drawStroke(ctx, stroke);
    sendScribbleStroke(roomId, stroke);
  };

  const handlePointerUp = () => {
    drawingRef.current = false;
  };

  const handleClear = () => {
    resetBoard();
    sendScribbleStroke(roomId, { x: 0, y: 0, type: 'clear', drawIdx: round?.drawIdx ?? 0 });
  };

  const handleEndRound = useCallback(async () => {
    try {
      await endScribbleRound({ roomId, playerId, playerToken });
      await refreshRound();
    } catch (error) {
      console.warn('[scribble] failed to end round', error);
      toast.error(error instanceof Error ? error.message : 'Failed to end round');
    }
  }, [roomId, playerId, playerToken, refreshRound]);

  const handleGuess = async () => {
    const text = guess.trim().toLowerCase();
    if (!text || !round) return;
    try {
      const result = await submitScribbleGuess({ roomId, playerId, playerToken, guess: text });
      if (result.correct) {
        setGuessStatus('correct');
        setGuessWord(result.word);
      } else if (result.alreadyResolved) {
        setGuessStatus('resolved');
        setGuessWord(result.word);
      } else {
        setGuessStatus('wrong');
        setGuess('');
        window.setTimeout(() => setGuessStatus('idle'), 600);
      }
    } catch (error) {
      console.warn('[scribble] guess failed', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit guess');
    }
  };

  if (loading || !round) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Starting scribble round...</p>
      </div>
    );
  }

  const drawerBanner = isDrawer ? (
    <div className="rounded-xl border border-primary/30 bg-primary/[0.08] px-4 py-2 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Your word to draw</p>
      <p className="font-display text-2xl font-bold tracking-tight text-primary">{round.word?.toUpperCase()}</p>
    </div>
  ) : (
    <div className="flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-card/70 px-4 py-2 text-sm text-muted-foreground">
      <PenLine className="h-4 w-4 text-primary" />
      <span>
        <span className="font-bold text-foreground">{round.drawerName}</span> is drawing
      </span>
    </div>
  );

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-5 px-4 py-8">
      <div className="w-full max-w-xl space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-muted-foreground">
            Draw round <span className="text-primary">{Math.min(round.drawIdx + 1, round.totalPlayers)}</span>
            <span className="text-muted-foreground/50"> / {round.totalPlayers}</span>
          </p>
          {isDrawer && (
            <span className={cn('rounded-full border px-3 py-1 text-xs font-bold tabular-nums', secondsLeft <= 10 ? 'border-destructive/40 text-destructive' : 'border-border/60 text-muted-foreground')}>
              {secondsLeft}s left
            </span>
          )}
        </div>

        {drawerBanner}

        <div className="relative">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            tabIndex={0}
            aria-label="Shared drawing board"
            className={cn(
              'w-full touch-none rounded-2xl border border-border/60 bg-[#f8f8f8] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              isDrawer ? 'cursor-crosshair' : 'cursor-default',
            )}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />
          {!isDrawer && (
            <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground backdrop-blur">
              <Eye className="h-3 w-3" /> Live
            </div>
          )}
        </div>

        {isDrawer ? (
          <div className="space-y-3">
            {round.roundResolved && (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-chart-2/30 bg-chart-2/10 px-4 py-2.5 text-sm font-semibold text-chart-2">
                <Trophy className="h-4 w-4" /> {round.roundWinnerName} guessed it!
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleClear}>Clear board</Button>
              <Button className="flex-1" onClick={() => void handleEndRound()}>
                {round.roundResolved ? 'Reveal & Next' : 'End Round'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {guessStatus === 'correct' && (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-chart-1/30 bg-chart-1/10 px-4 py-2.5 text-sm font-semibold text-chart-1">
                <CheckCircle2 className="h-4 w-4" /> Correct! The word was {guessWord?.toUpperCase()}
              </div>
            )}
            {guessStatus === 'resolved' && (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-chart-2/30 bg-chart-2/10 px-4 py-2.5 text-sm font-semibold text-chart-2">
                <Trophy className="h-4 w-4" /> Already guessed — the word was {guessWord?.toUpperCase()}
              </div>
            )}
            {guessStatus === 'wrong' && (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive">
                <XCircle className="h-4 w-4" /> Nope, try again
              </div>
            )}
            {round.roundResolved ? (
              <div className="rounded-xl border border-border/60 bg-secondary/40 px-4 py-3 text-center text-sm text-muted-foreground">
                Waiting for <span className="font-semibold text-foreground">{round.drawerName}</span> to end the round...
              </div>
            ) : (
              <form
                className="flex gap-2"
                onSubmit={e => {
                  e.preventDefault();
                  void handleGuess();
                }}
              >
                <Input
                  value={guess}
                  onChange={e => setGuess(e.target.value)}
                  aria-label="Your guess"
                  placeholder="Type your guess..."
                  autoFocus
                  maxLength={40}
                />
                <Button type="submit" className="gap-1.5">Guess</Button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
