import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trophy,
  Zap,
  Gamepad2,
  Swords,
  Crown,
  ArrowUpRight,
  Medal,
  Flame,
  Target,
  CalendarDays,
  Star,
  Link as LinkIcon,
  Gift,
  Lock,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { storage } from '@/lib/storage';
import { levelProgress } from '@/lib/progress';
import { cn } from '@/lib/utils';
import { ACHIEVEMENTS, getUnlockedAchievementIds, type AchievementDef } from '@/lib/achievements';
import {
  avatarForLevel,
  frameForLevel,
  titleForLevel,
  allUnlocksForLevel,
  COSMETIC_UNLOCKS,
  type CosmeticUnlock,
} from '@/lib/cosmetics';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const ACHIEVEMENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  zap: Zap,
  gamepad: Gamepad2,
  flame: Flame,
  trophy: Trophy,
  star: Star,
  target: Target,
  swords: Swords,
  crown: Crown,
  calendar: CalendarDays,
  link: LinkIcon,
};

export default function ProfileCard() {
  const name = storage.getPlayerName() || 'Player';
  const stats = storage.getStats();
  const level = levelProgress(stats.xp);
  const [open, setOpen] = useState(false);

  const unlocked = useMemo(() => new Set(getUnlockedAchievementIds()), [open]);
  const avatar = avatarForLevel(level.level);
  const frame = frameForLevel(level.level);
  const title = titleForLevel(level.level);
  const nextLock = COSMETIC_UNLOCKS.find(u => u.level > level.level);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05 }}
      className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/70 backdrop-blur-md"
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-brand-a/15 blur-3xl" />
      <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open your profile"
          className={cn(
            'flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 bg-gradient-to-br from-brand-a/[0.15] to-brand-c/[0.15] text-3xl transition-transform duration-200 hover:scale-105',
            frame?.frameClass ?? 'border-primary/25',
          )}
        >
          <span>{avatar.emoji}</span>
        </button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-lg font-bold">{name}</p>
            {title?.titleSuffix && <span className="text-sm text-muted-foreground">{title.titleSuffix}</span>}
            <span className="inline-flex items-center gap-1 rounded-full border border-chart-1/30 bg-chart-1/10 px-2 py-0.5 text-xs font-bold text-chart-1">
              <Crown className="h-3 w-3" /> Level {level.level} · {level.title}
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <motion.div
              className="h-full rounded-full btn-primary-gradient"
              initial={{ width: 0 }}
              animate={{ width: `${level.pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 font-semibold text-primary">
              <Zap className="h-3 w-3 text-chart-4" /> {stats.xp.toLocaleString()} XP
            </span>{' '}
            · {level.into}/{level.needed} to Level {level.level + 1}
          </p>
        </div>
        <div className="flex items-center gap-5 sm:gap-6">
          <div className="text-center">
            <p className="flex items-center justify-center gap-1 font-display text-xl font-bold tabular-nums text-primary">
              <Gamepad2 className="h-4 w-4 text-muted-foreground" /> {stats.gamesPlayed}
            </p>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">games</p>
          </div>
          <div className="text-center">
            <p className="flex items-center justify-center gap-1 font-display text-xl font-bold tabular-nums text-primary">
              <Swords className="h-4 w-4 text-muted-foreground" /> {stats.arenasPlayed}
            </p>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">arenas</p>
          </div>
          <div className="text-center">
            <p className="flex items-center justify-center gap-1 font-display text-xl font-bold tabular-nums text-primary">
              <Trophy className="h-4 w-4 text-chart-2" /> {stats.arenaWins}
            </p>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">wins</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/leaderboard"
            className={cn(
              'flex items-center gap-1 rounded-xl border border-primary/20 bg-primary/[0.08] px-4 py-2.5',
              'text-sm font-semibold text-primary transition-all duration-300 hover:border-primary/50 hover:bg-primary/[0.14]',
            )}
          >
            Leaderboard <ArrowUpRight className="h-4 w-4" />
          </Link>
          <button
            onClick={() => setOpen(true)}
            className={cn(
              'flex items-center gap-1 rounded-xl border border-border/40 bg-card px-3 py-2.5',
              'text-sm font-semibold text-muted-foreground transition-all duration-300 hover:border-primary/40 hover:text-foreground',
            )}
          >
            <Medal className="h-4 w-4" /> {unlocked.size}/{ACHIEVEMENTS.length} <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <ProfileDialog
        open={open}
        onOpenChange={setOpen}
        name={name}
        level={level.level}
        avatarEmoji={avatar.emoji ?? '🏆'}
        frameClass={frame?.frameClass}
        unlocked={unlocked}
        nextUnlock={nextLock}
      />
    </motion.div>
  );
}

function AchievementTile({ def, unlocked: isUnlocked }: { def: AchievementDef; unlocked: boolean }) {
  const Icon = ACHIEVEMENT_ICONS[def.icon] ?? Trophy;
  return (
    <div
      title={isUnlocked ? def.title : `${def.title} — ${def.description}`}
      className={cn(
        'flex flex-col items-center gap-1 rounded-xl border p-2 text-center',
        isUnlocked ? 'border-chart-1/30 bg-chart-1/[0.08]' : 'border-border/40 bg-card/40 opacity-60',
      )}
    >
      <Icon className={cn('h-4 w-4', isUnlocked ? 'text-chart-1' : 'text-muted-foreground')} />
      <span
        className={cn(
          'text-[10px] font-semibold leading-tight',
          isUnlocked ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {def.title}
      </span>
    </div>
  );
}

function ProfileDialog({
  open,
  onOpenChange,
  name,
  level,
  avatarEmoji,
  frameClass,
  unlocked,
  nextUnlock,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  level: number;
  avatarEmoji: string;
  frameClass?: string;
  unlocked: Set<string>;
  nextUnlock?: { level: number; label: string };
}) {
  const unlockedCount = [...unlocked].filter(id => ACHIEVEMENTS.some(a => a.id === id)).length;
  const stats = storage.getStats();
  const statsWeeklyXp = storage.getWeeklyXp();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader className="flex-row items-center gap-4 text-left">
          <div
            className={cn(
              'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 bg-gradient-to-br from-brand-a/[0.15] to-brand-c/[0.15] text-2xl',
              frameClass ?? 'border-primary/25',
            )}
          >
            <span>{avatarEmoji}</span>
          </div>
          <div>
            <DialogTitle>{name}</DialogTitle>
            <DialogDescription>
              {unlockedCount} of {ACHIEVEMENTS.length} achievements · {allUnlocksForLevel(level).length} cosmetics
              unlocked
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <MiniStat label="Games" value={stats.gamesPlayed} icon={Gamepad2} />
          <MiniStat label="Arena wins" value={stats.arenaWins} icon={Swords} />
          <MiniStat label="This week XP" value={statsWeeklyXp} icon={TrendingUp} accent="text-chart-1" />
        </div>

        <div className="mt-2">
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Medal className="h-3.5 w-3.5 text-chart-1" /> Achievements
          </p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {ACHIEVEMENTS.map(a => (
              <AchievementTile key={a.id} def={a} unlocked={unlocked.has(a.id)} />
            ))}
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Gift className="h-3.5 w-3.5 text-chart-3" /> Level Cosmetics
          </p>
          <div className="divide-y divide-border/50 rounded-xl border border-border/40">
            {COSMETIC_UNLOCKS.map(u => {
              const has = u.level <= level;
              return (
                <div key={u.id} className="flex items-center gap-3 px-3 py-2.5">
                  <CosmeticPreview unlock={u} has={has} />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold">{u.label}</p>
                    <p className="text-[11px] text-muted-foreground">Unlocks at Level {u.level}</p>
                  </div>
                  {has ? (
                    <span className="text-xs font-bold text-chart-1">Unlocked</span>
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              );
            })}
          </div>
          {nextUnlock && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Next unlock at <span className="font-bold text-foreground">Level {nextUnlock.level}</span>:{' '}
              {nextUnlock.label}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MiniStat({
  label,
  value,
  icon: Icon,
  accent = 'text-primary',
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 px-3 py-2 text-center">
      <p className={cn('flex items-center justify-center gap-1 font-display text-lg font-bold tabular-nums', accent)}>
        <Icon className="h-3.5 w-3.5 text-muted-foreground" /> {value.toLocaleString()}
      </p>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}

function CosmeticPreview({ unlock, has }: { unlock: CosmeticUnlock; has: boolean }) {
  if (unlock.type === 'avatar') {
    const frame = frameForLevel(unlock.level);
    return (
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 bg-card text-lg',
          has ? (frame?.frameClass ?? 'border-primary/40') : 'border-border/50 opacity-70',
        )}
      >
        {unlock.emoji}
      </span>
    );
  }
  if (unlock.type === 'frame') {
    return (
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-4 bg-card',
          has ? (unlock.frameClass ?? 'border-primary/40') : 'border-border/50 opacity-70',
        )}
      >
        <span className="h-2 w-2 rounded-full bg-current opacity-40" />
      </span>
    );
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-card text-xs font-bold text-muted-foreground">
      Aa
    </span>
  );
}
