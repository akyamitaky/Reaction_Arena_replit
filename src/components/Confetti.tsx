import { useEffect, useRef } from 'react';

interface ConfettiProps {
  count?: number;
  duration?: number;
  className?: string;
}

/**
 * Dependency-free canvas confetti. Fires on mount and cleans up after itself.
 * Respects the user's reduced-motion preference.
 */
export default function Confetti({
  count = 120,
  duration = 2600,
  className = 'pointer-events-none fixed inset-0 z-50 h-full w-full',
}: ConfettiProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    const resize = () => {
      width = canvas.width = canvas.offsetWidth || window.innerWidth;
      height = canvas.height = canvas.offsetHeight || window.innerHeight;
    };
    resize();

    const colors = ['#FFD166', '#06D6A0', '#118AB2', '#EF476F', '#8338EC', '#FF9F1C', '#3A86FF'];
    const pieces = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: -20 - Math.random() * height * 0.5,
      vx: (Math.random() - 0.5) * 2,
      vy: 2 + Math.random() * 3,
      size: 6 + Math.random() * 8,
      rotation: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
      circle: Math.random() > 0.5,
    }));

    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      ctx.clearRect(0, 0, width, height);
      const alpha = Math.max(0, 1 - elapsed / duration);
      for (const p of pieces) {
        p.x += p.vx + Math.sin(now / 800 + p.rotation) * 0.5;
        p.y += p.vy;
        p.vy += 0.04;
        p.rotation += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        if (p.circle) {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        }
        ctx.restore();
      }
      if (elapsed < duration) {
        raf = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [count, duration]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
