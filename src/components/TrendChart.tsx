import { useId } from 'react';

interface Point {
  label: string;
  value: number;
}

interface TrendChartProps {
  data: Point[];
  /** Tailwind text color class (e.g. "text-primary"); used as the stroke/area tint. */
  color?: string;
  unit?: string;
}

/**
 * Lightweight dependency-free SVG line/area chart. Renders the series plus a
 * dashed baseline at the average so players can see improvement at a glance.
 */
export default function TrendChart({ data, color = 'text-primary', unit = '' }: TrendChartProps) {
  const id = useId();
  const W = 320;
  const H = 110;
  const PAD = 6;

  if (data.length === 0) {
    return null;
  }

  const values = data.map(d => d.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const span = max - min || 1;
  const avg = values.reduce((s, v) => s + v, 0) / values.length;

  const x = (i: number) => PAD + (i / (data.length - 1 || 1)) * (W - PAD * 2);
  const y = (v: number) => H - PAD - ((v - min) / span) * (H - PAD * 2);

  const points = data.map((d, i) => `${x(i).toFixed(1)},${y(d.value).toFixed(1)}`);
  const last = data[data.length - 1];
  const lastX = x(data.length - 1).toFixed(1);
  const areaPath = `M ${points[0]} L ${points.slice(1).join(' L ')} L ${lastX},${(H - PAD).toFixed(1)} L ${x(0).toFixed(1)},${(H - PAD).toFixed(1)} Z`;
  const avgY = y(avg);

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={`h-28 w-full ${color}`}
        role="img"
        aria-label={`Trend chart${unit ? ` in ${unit}` : ''}. Latest value ${last.value}${unit}, average ${Math.round(avg)}${unit}.`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.28" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${id})`} />
        <line
          x1={PAD}
          x2={W - PAD}
          y1={avgY}
          y2={avgY}
          stroke="hsl(var(--border))"
          strokeWidth="1"
          strokeDasharray="4 3"
        />
        <polyline
          points={points.join(' ')}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p, i) => {
          const [px, py] = p.split(',').map(Number);
          return <circle key={i} cx={px} cy={py} r={i === data.length - 1 ? 3 : 1.5} fill="currentColor" />;
        })}
      </svg>
      <div className="mt-1 flex items-center justify-between text-[11px] tabular-nums text-muted-foreground">
        <span>{data[0].label}</span>
        <span>
          avg{' '}
          <span className="font-semibold text-foreground">
            {Math.round(avg)}
            {unit}
          </span>{' '}
          · latest{' '}
          <span className="font-semibold text-primary">
            {last.value}
            {unit}
          </span>
        </span>
        <span>{last.label}</span>
      </div>
    </div>
  );
}
