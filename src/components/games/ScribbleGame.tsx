import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { GameContext } from '@/components/GameShell';

const PROMPTS = [
  'sun',
  'tree',
  'house',
  'cat',
  'star',
  'heart',
  'flower',
  'fish',
  'cloud',
  'mountain',
  'car',
  'boat',
  'bird',
  'moon',
  'apple',
];
const STEP = 6;

type Cursor = { x: number; y: number };

export default function ScribbleGame({ round, addScore, nextRound }: GameContext) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keyPosRef = useRef<Cursor>({ x: 150, y: 150 });
  const kbDrawingRef = useRef(false);
  const [drawing, setDrawing] = useState(false);
  const [kbActive, setKbActive] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const resetCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f8f8f8';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    keyPosRef.current = { x: 150, y: 150 };
    kbDrawingRef.current = false;
    setKbActive(false);
  }, []);

  useEffect(() => {
    setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
    setSubmitted(false);
    resetCanvas();
  }, [round, resetCanvas]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    setDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      const { x, y } = getPos(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      const { x, y } = getPos(e);
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#111';
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDraw = () => setDrawing(false);

  const drawSegment = (from: Cursor, to: Cursor) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = canvas.width;
    const pos = keyPosRef.current;
    const dirs: Record<string, Cursor> = {
      ArrowUp: { x: 0, y: -STEP },
      ArrowDown: { x: 0, y: STEP },
      ArrowLeft: { x: -STEP, y: 0 },
      ArrowRight: { x: STEP, y: 0 },
    };
    const dir = dirs[e.key];
    if (dir) {
      e.preventDefault();
      const next = {
        x: Math.min(size, Math.max(0, pos.x + dir.x)),
        y: Math.min(size, Math.max(0, pos.y + dir.y)),
      };
      if (kbDrawingRef.current) drawSegment(pos, next);
      keyPosRef.current = next;
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      kbDrawingRef.current = !kbDrawingRef.current;
      setKbActive(kbDrawingRef.current);
      if (kbDrawingRef.current) drawSegment(keyPosRef.current, keyPosRef.current);
    }
  };

  const handleSubmit = () => {
    if (submitted) return;
    setSubmitted(true);
    addScore(100);
    setTimeout(nextRound, 1200);
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm">
      <p className="text-sm text-muted-foreground">
        Draw: <span className="font-black text-foreground text-lg">{prompt.toUpperCase()}</span>
      </p>
      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        tabIndex={0}
        aria-label="Drawing canvas. Use arrow keys to move the pen and Space or Enter to toggle drawing."
        className="rounded-2xl border bg-card touch-none cursor-crosshair focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
        onKeyDown={handleKeyDown}
      />
      <p aria-live="polite" className="min-h-4 text-xs text-muted-foreground">
        {kbActive ? 'Drawing on. Press Space or Enter to lift the pen.' : 'Pen lifted. Press Space or Enter to draw.'}
      </p>
      <Button onClick={handleSubmit} disabled={submitted} className="w-full">
        {submitted ? 'Nice drawing!' : 'Done!'}
      </Button>
    </div>
  );
}
