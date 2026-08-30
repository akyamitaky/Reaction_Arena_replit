import { useId } from 'react';
import { cn } from '@/lib/utils';

const MEDALLION = '#0B1220';

export default function ArenaIcon({ className }: { className?: string }) {
  const id = useId();
  const gradientId = `arena-icon-bg-${id}`;
  return (
    <svg viewBox="0 0 48 48" className={cn('shrink-0', className)} aria-hidden="true">
      <defs>
        <linearGradient
          id={gradientId}
          x1="0"
          y1="0"
          x2="48"
          y2="48"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="hsl(var(--brand-a))" />
          <stop offset="0.55" stopColor="hsl(var(--brand-b))" />
          <stop offset="1" stopColor="hsl(var(--brand-c))" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="13" fill={`url(#${gradientId})`} />
      <circle
        cx="24"
        cy="24"
        r="19.5"
        stroke="rgba(255,255,255,0.9)"
        strokeWidth="2.25"
        fill="none"
      />
      <circle cx="24" cy="24" r="14.5" fill={MEDALLION} />
      <g
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M13 12 H24 A11.5 11.5 0 0 1 24 25 H13 Z" />
        <path d="M13 25 V35" />
        <path d="M15 26 L28 33 L23 33 L29 36" />
      </g>
    </svg>
  );
}
