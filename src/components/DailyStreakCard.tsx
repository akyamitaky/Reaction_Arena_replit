import { motion } from 'framer-motion';
import { Flame, Gift, CalendarDays, Check, Sparkles } from 'lucide-react';
import { getDailyStreak, STREAK_MILESTONES, utcDateKey } from '@/lib/dailyChallenge';
import { cn } from '@/lib/utils';
import CountUp from '@/components/CountUp';

const WEEKDAY_LABEL = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function lastSevenDays(): { key: string; day: number; weekday: string }[] {
  const days: { key: string; day: number; weekday: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      key: d.toISOString().slice(0, 10),
      day: d.getDate(),
      weekday: WEEKDAY_LABEL[d.getUTCDay()],
    });
  }
  return days;
}

export default function DailyStreakCard() {
  const streak = getDailyStreak();
  const played = new Set(streak.history);
  const today = utcDateKey();
  const days = lastSevenDays();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur-md"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-chart-4/30 bg-chart-4/10">
          <CalendarDays className="h-5 w-5 text-chart-4" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-base font-bold tracking-tight">Streak calendar</h3>
          <p className="text-xs text-muted-foreground">
            Last 7 days · best streak <span className="font-semibold text-chart-4">{streak.bestStreak}</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-chart-4/30 bg-chart-4/10 px-3 py-1.5">
          <Flame className="h-4 w-4 text-chart-4" />
          <CountUp value={streak.current} />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">today</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {days.map(d => {
          const isPlayed = played.has(d.key);
          const isToday = d.key === today;
          return (
            <div
              key={d.key}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl border py-2 transition-colors',
                isPlayed
                  ? 'border-chart-4/40 bg-chart-4/10'
                  : isToday
                    ? 'border-primary/40 bg-primary/[0.06]'
                    : 'border-border/40 bg-card/40',
              )}
            >
              <span className="text-[10px] font-bold uppercase text-muted-foreground">{d.weekday}</span>
              {isPlayed ? (
                <Flame className="h-4 w-4 text-chart-4" />
              ) : (
                <span
                  className={cn('h-4 w-4 rounded-full border', isToday ? 'border-primary/50' : 'border-border/50')}
                />
              )}
              <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">{d.day}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <Gift className="h-3.5 w-3.5 text-chart-3" /> Streak rewards
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {STREAK_MILESTONES.map(m => {
            const awarded = streak.awardedMilestones.includes(m.days);
            const reached = streak.bestStreak >= m.days;
            return (
              <div
                key={m.days}
                className={cn(
                  'rounded-xl border px-2 py-2 text-center',
                  awarded
                    ? 'border-chart-1/40 bg-chart-1/[0.08]'
                    : reached
                      ? 'border-chart-3/40 bg-chart-3/[0.08]'
                      : 'border-border/40 bg-card/40 opacity-70',
                )}
              >
                <p
                  className={cn(
                    'flex items-center justify-center gap-1 text-xs font-bold',
                    awarded ? 'text-chart-1' : 'text-foreground',
                  )}
                >
                  {awarded ? <Check className="h-3 w-3" /> : <Sparkles className="h-3 w-3 text-chart-3" />}
                  {m.days}d
                </p>
                <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">
                  {awarded ? 'claimed' : `+${m.xp} XP`}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
