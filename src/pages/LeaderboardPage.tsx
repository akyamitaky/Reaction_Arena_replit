import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Crown, ArrowLeft, User, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getLeaderboard,
  getLocalProfileId,
  getWeeklyLeaderboard,
  type Profile,
  type WeeklyEntry,
} from '@/lib/profileApi';
import { levelProgress } from '@/lib/progress';
import { storage } from '@/lib/storage';
import { cn } from '@/lib/utils';

const RANK_META = [
  { medal: '🥇', accent: 'text-chart-1' },
  { medal: '🥈', accent: 'text-chart-2' },
  { medal: '🥉', accent: 'text-chart-3' },
];

type Tab = 'weekly' | 'allTime';

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('weekly');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [weekly, setWeekly] = useState<WeeklyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const myId = getLocalProfileId();

  useEffect(() => {
    let active = true;
    Promise.all([getLeaderboard(20), getWeeklyLeaderboard(20)])
      .then(([all, week]) => {
        if (!active) return;
        setProfiles(all);
        setWeekly(week);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const rows = tab === 'weekly' ? weekly : profiles;
  const myRank = rows.findIndex(p => p.id === myId) + 1;
  const hasData = rows.length > 0;

  return (
    <div className="relative mx-auto w-full max-w-3xl px-4 pb-16 pt-10 sm:px-6">
      <Button variant="ghost" size="sm" className="mb-6 gap-1 text-muted-foreground" onClick={() => navigate('/')}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 flex items-center gap-4"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10">
          <Trophy className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Leaderboard</h1>
          <p className="text-sm text-muted-foreground">Weekly momentum or lifetime XP — take your pick</p>
        </div>
      </motion.div>

      <div className="mb-6 inline-flex rounded-full border border-border/60 bg-card/60 p-1">
        {(
          [
            { key: 'weekly', label: 'This Week', icon: CalendarDays },
            { key: 'allTime', label: 'All Time', icon: Trophy },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
              tab === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-border/60 bg-card/70 p-8 text-center">
          <Trophy className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Leaderboards need Supabase migrations. Run supabase/migrations/ and try again.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md">
          <div className="divide-y divide-border/50">
            {rows.map((p, i) => {
              const isMe = p.id === myId;
              const rank = i + 1;
              const meta = RANK_META[i];
              const isWeekly = 'weeklyXp' in p;
              const level = levelProgress(isWeekly ? p.weeklyXp : p.xp);
              const xp = isWeekly ? p.weeklyXp : p.xp;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.04 }}
                  className={cn(
                    'flex items-center gap-3 px-4 py-4',
                    rank === 1 && 'bg-gradient-to-r from-chart-1/[0.08] to-transparent',
                    isMe && 'ring-1 ring-inset ring-primary/25',
                  )}
                >
                  <span className="w-10 text-center text-2xl">
                    {meta ? (
                      meta.medal
                    ) : (
                      <span className="text-sm font-bold tabular-nums text-muted-foreground">{rank}</span>
                    )}
                  </span>
                  <div className="flex-1 text-left">
                    <p className={cn('flex items-center gap-1.5 font-display font-bold', isMe && 'text-primary')}>
                      {p.name}
                      {rank === 1 && <Crown className="h-3.5 w-3.5 text-chart-1" />}
                      {isMe && <span className="text-xs font-normal text-muted-foreground">(You)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Lv {level.level} {level.title} · {p.gamesPlayed} games · {p.arenasPlayed} arenas
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg font-bold tabular-nums text-primary">{xp.toLocaleString()}</p>
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                      {isWeekly ? 'XP this week' : 'XP'}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {myRank > 0 && (
        <p className="mt-6 flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
          <User className="h-4 w-4 text-primary" /> You're ranked{' '}
          <span className="font-bold text-foreground">#{myRank}</span>
          {tab === 'weekly' ? ' this week' : ' all-time'}
          {myRank > 1 && ' — climb the board with more arena wins!'}
        </p>
      )}

      {!loading && !error && !hasData && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {tab === 'weekly'
            ? 'No weekly activity yet. Play a game to start climbing the weekly board.'
            : `No profiles yet. Play a game to claim your spot (XP ${storage.getXp()} earned so far).`}
        </p>
      )}
    </div>
  );
}
