import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { GameContext } from '@/components/GameShell';

const PROMPTS = ['sun', 'tree', 'house', 'cat', 'star', 'heart', 'flower', 'fish', 'cloud', 'mountain', 'car', 'boat', 'bird', 'moon', 'apple'];

export default function ScribbleGame({ round, addScore, nextRound }: GameContext) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
    setSubmitted(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#f8f8f8'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    }
  }, [round]);

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
    if (ctx) { const { x, y } = getPos(e); ctx.beginPath(); ctx.moveTo(x, y); }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) { const { x, y } = getPos(e); ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = '#111'; ctx.lineTo(x, y); ctx.stroke(); }
  };

  const stopDraw = () => setDrawing(false);

  const handleSubmit = () => {
    if (submitted) return;
    setSubmitted(true);
    addScore(100); // Self-scored for fun
    setTimeout(nextRound, 1200);
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm">
      <p className="text-sm text-muted-foreground">Draw: <span className="font-black text-foreground text-lg">{prompt.toUpperCase()}</span></p>
      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        className="rounded-2xl border bg-card touch-none cursor-crosshair"
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
      />
      <Button onClick={handleSubmit} disabled={submitted} className="w-full">{submitted ? 'Nice drawing! 🎨' : 'Done!'}</Button>
    </div>
  );
}
