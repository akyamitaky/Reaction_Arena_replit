import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Swords,
  LogIn,
  Gamepad2,
  ArrowUpRight,
  Users,
  Sparkles,
  Trophy,
  Flame,
  Target,
  Zap,
  TrendingUp,
  Medal,
} from 'lucide-react';
import { gameModes, getGameMode } from '@/lib/gameConfig';
import { storage } from '@/lib/storage';
import { dailyGameId, getDailyStreak } from '@/lib/dailyChallenge';
import { ACHIEVEMENTS, getUnlockedAchievements, type AchievementDef } from '@/lib/achievements';
import { useClaimAchievements } from '@/hooks/useClaimAchievements';
import GameCard from '@/components/GameCard';
import StatCard from '@/components/StatCard';
import CountUp from '@/components/CountUp';
import ProfileCard from '@/components/ProfileCard';
import WeeklyRecap from '@/components/WeeklyRecap';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

const ACHIEVEMENT_TILE_ICONS: Record<string, string> = {
  zap: '⚡',
  gamepad: '🎮',
  flame: '🔥',
  trophy: '🏆',
  star: '⭐',
  target: '🎯',
  swords: '⚔️',
  crown: '👑',
  calendar: '📅',
  link: '🔗',
};

type FlowTarget = 'arena' | 'single' | 'join' | 'challenge';

export default function HomePage() {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [flowTarget, setFlowTarget] = useState<FlowTarget>('arena');
  const [joinCode, setJoinCode] = useState('');
  const stats = storage.getStats();

  const handleOpen = (target: FlowTarget) => {
    setFlowTarget(target);
    setNameDialogOpen(true);
    setJoinCode('');
  };

  const handleGo = () => {
    if (!playerName.trim()) return;
    storage.setPlayerName(playerName.trim());
    if (flowTarget === 'arena') {
      navigate('/arena-setup');
    } else if (flowTarget === 'single') {
      navigate('/select');
    } else if (flowTarget === 'join') {
      if (!joinCode.trim()) return;
      navigate('/lobby', { state: { joinCode: joinCode.trim().toUpperCase(), playerName: playerName.trim() } });
    } else if (flowTarget === 'challenge') {
      if (!joinCode.trim()) return;
      navigate(`/challenge/${joinCode.trim().toUpperCase()}`);
    }
  };

  const featured = [gameModes[0], gameModes[1], gameModes[3], gameModes[9]];
  const dailyMode = getGameMode(dailyGameId());
  const dailyStreak = getDailyStreak();

  const justUnlocked = useClaimAchievements([stats.gamesPlayed, stats.arenasPlayed, stats.xp, stats.bestScore]);
  const unlockedAchievements = useMemo(() => getUnlockedAchievements(), [justUnlocked]);

  return (
    <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
      {/* Hero */}
      <section className="relative pt-14 pb-10 sm:pt-20 sm:pb-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto max-w-3xl text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.08] px-4 py-1.5 text-xs font-semibold text-primary backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Your daily competitive ritual
          </div>
          <h1 className="text-5xl font-bold leading-[0.98] tracking-[-0.06em] sm:text-7xl">
            Train fast.
            <br />
            <span className="text-gradient">Think sharper.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            A focused arena for quick minds. Pick a mode, challenge your friends, and make every reaction count.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" className="gap-2 px-8 text-base" onClick={() => handleOpen('single')}>
              <Gamepad2 className="h-5 w-5" /> Start practicing
            </Button>
            <Button size="lg" variant="outline" className="gap-2 px-8 text-base" onClick={() => handleOpen('arena')}>
              <Swords className="h-5 w-5" /> Host an arena
            </Button>
          </div>

          <button
            onClick={() => handleOpen('challenge')}
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            <Medal className="h-4 w-4" /> Have a challenge code? Enter it
          </button>

          <div className="mt-12 grid grid-cols-3 divide-x divide-border/60 rounded-2xl border border-border/60 bg-card/50 py-5 backdrop-blur-md">
            {[
              { value: 35, label: 'Game modes' },
              { value: 8, label: 'Players / arena' },
              { value: 15, label: 'Sec / round' },
            ].map(s => (
              <div key={s.label} className="px-4 text-center">
                <p className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  <CountUp value={s.value} />
                </p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Profile */}
      <section className="pb-6">
        <ProfileCard />
      </section>

      {/* Achievements */}
      <section className="pb-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.02, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-chart-1/30 bg-chart-1/10">
              <Medal className="h-5 w-5 text-chart-1" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight">Achievements</h2>
              <p className="text-xs text-muted-foreground">
                {unlockedAchievements.length}/{ACHIEVEMENTS.length} collected
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur-md">
            <div className="mb-2 h-2 overflow-hidden rounded-full bg-secondary">
              <motion.div
                className="h-full rounded-full btn-primary-gradient"
                initial={{ width: 0 }}
                animate={{ width: `${(unlockedAchievements.length / ACHIEVEMENTS.length) * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
              {ACHIEVEMENTS.map(a => (
                <AchievementTile key={a.id} def={a} unlocked={unlockedAchievements.some(u => u.id === a.id)} />
              ))}
            </div>
            {justUnlocked.length > 0 && (
              <p className="mt-4 text-center text-xs font-semibold text-primary">
                Just unlocked: {justUnlocked.map(a => a.title).join(', ')}
              </p>
            )}
          </div>
        </motion.div>
      </section>

      {/* Daily challenge */}
      <section className="pb-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.02, ease: [0.16, 1, 0.3, 1] }}
          onClick={() => navigate('/daily')}
          className="relative cursor-pointer overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/[0.12] via-card to-brand-c/[0.12] p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-c/15 blur-3xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/25 bg-card/80">
              {dailyMode ? (
                <dailyMode.icon className={`h-7 w-7 ${dailyMode.color}`} />
              ) : (
                <Flame className="h-7 w-7 text-chart-4" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Daily Challenge</p>
                <span className="inline-flex items-center gap-1 rounded-full border border-chart-4/30 bg-chart-4/10 px-2 py-0.5 text-xs font-bold text-chart-4">
                  <Flame className="h-3 w-3" /> {dailyStreak.current}-day streak
                </span>
              </div>
              <h2 className="mt-1 font-display text-xl font-bold tracking-tight">
                {dailyStreak.playedToday ? 'Today done — play again?' : `Today: ${dailyMode?.label || ''}`}
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {dailyStreak.playedToday
                  ? `${dailyStreak.lastScore} pts today · best ${dailyStreak.bestScore}`
                  : `One game, same for everyone. Keep the streak alive →`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="font-display text-2xl font-bold tabular-nums text-primary">
                  <CountUp value={dailyStreak.bestScore} />
                </p>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">best score</p>
              </div>
              <Button size="lg" className="gap-2">
                {dailyStreak.playedToday ? <Flame className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                {dailyStreak.playedToday ? 'Play again' : 'Play now'}
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Weekly recap */}
      <WeeklyRecap />

      {/* Quick actions */}
      <section className="pb-10">
        <div className="grid gap-4 md:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card
              className="h-full cursor-pointer border-primary/20 hover:border-primary/50"
              onClick={() => handleOpen('arena')}
            >
              <CardContent className="flex h-full flex-col items-start gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl btn-primary-gradient shadow-lg shadow-[hsl(var(--brand-a)/0.3)]">
                  <Swords className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-bold">Host Arena</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Create a room &amp; invite friends to compete</p>
                </div>
                <div className="flex w-full items-center justify-between text-sm font-semibold text-primary">
                  Create room{' '}
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card
              className="h-full cursor-pointer border-accent/20 hover:border-accent/50"
              onClick={() => handleOpen('join')}
            >
              <CardContent className="flex h-full flex-col items-start gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
                  <LogIn className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-bold">Join Arena</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Enter a room code to battle friends</p>
                </div>
                <div className="flex w-full items-center justify-between text-sm font-semibold text-accent">
                  Enter code <ArrowUpRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.19, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card className="h-full cursor-pointer hover:border-primary/40" onClick={() => handleOpen('single')}>
              <CardContent className="flex h-full flex-col items-start gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/60 bg-secondary/60 text-muted-foreground">
                  <Gamepad2 className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-bold">Solo Practice</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Pick a single game mode to play alone</p>
                </div>
                <div className="flex w-full items-center justify-between text-sm font-semibold text-muted-foreground">
                  Browse games <ArrowUpRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Dashboard stats */}
      <section className="pb-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-5 flex items-center gap-3"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-secondary/60">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight">Your progress</h2>
            <p className="text-xs text-muted-foreground">Activity stored locally on this device</p>
          </div>
        </motion.div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Games played" value={stats.gamesPlayed} icon={Zap} accent="text-primary" delay={0.1} />
          <StatCard label="Best score" value={stats.bestScore} icon={Trophy} accent="text-chart-2" delay={0.16} />
          <StatCard label="Arenas played" value={stats.arenasPlayed} icon={Swords} accent="text-chart-3" delay={0.22} />
          <StatCard
            label="Arena wins"
            value={stats.arenaWins}
            icon={Flame}
            accent="text-chart-4"
            delay={0.28}
            hint="personal"
          />
        </div>
      </section>

      {/* Featured */}
      <section className="pb-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-5 flex items-end justify-between"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Featured</p>
            <h2 className="mt-1 font-display text-xl font-bold tracking-tight">Trending right now</h2>
          </div>
          <Button variant="ghost" size="sm" className="gap-1 text-primary" onClick={() => navigate('/select')}>
            View all <ArrowUpRight className="h-4 w-4" />
          </Button>
        </motion.div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {featured.map((mode, i) => (
            <GameCard key={mode.id} mode={mode} index={i} />
          ))}
        </div>
      </section>

      {/* Full library */}
      <section className="pb-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-5 flex items-center gap-3"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-secondary/60">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight">The full library</h2>
            <p className="text-xs text-muted-foreground">{gameModes.length} modes to sharpen every edge</p>
          </div>
        </motion.div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {gameModes.map((mode, i) => (
            <GameCard key={mode.id} mode={mode} index={i} />
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="relative pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-brand-a/[0.12] via-card to-brand-c/[0.12] p-8 sm:p-12"
        >
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-brand-a/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-brand-c/15 blur-3xl" />
          <div className="relative text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl btn-primary-gradient shadow-xl shadow-[hsl(var(--brand-a)/0.35)]">
              <Users className="h-7 w-7 text-primary-foreground" />
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to raise the <span className="text-gradient">stakes?</span>
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
              Invite up to 8 friends, race across randomly selected games, and crown the fastest mind in the room.
            </p>
            <Button size="lg" className="mt-7 gap-2 px-8 text-base" onClick={() => handleOpen('arena')}>
              <Zap className="h-5 w-5" /> Host your arena
            </Button>
          </div>
        </motion.div>
      </section>

      <Dialog open={nameDialogOpen} onOpenChange={setNameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {flowTarget === 'join'
                ? 'Join an Arena'
                : flowTarget === 'challenge'
                  ? 'Enter a Challenge Code'
                  : flowTarget === 'arena'
                    ? 'Host an Arena'
                    : 'Solo Practice'}
            </DialogTitle>
            <DialogDescription>
              {flowTarget === 'join'
                ? 'Enter your name and the room code'
                : flowTarget === 'challenge'
                  ? "Enter your name and a friend's challenge code"
                  : 'Enter your player name to get started'}
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Your name"
            aria-label="Your name"
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            autoFocus
          />
          {(flowTarget === 'join' || flowTarget === 'challenge') && (
            <Input
              placeholder={flowTarget === 'join' ? 'Room code (e.g. AB3XY)' : 'Challenge code (e.g. 5K3PQ)'}
              aria-label={flowTarget === 'join' ? 'Room code' : 'Challenge code'}
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              maxLength={5}
              className="text-center font-mono text-2xl tracking-[0.3em] uppercase"
              onKeyDown={e => e.key === 'Enter' && handleGo()}
            />
          )}
          <Button
            onClick={handleGo}
            disabled={!playerName.trim() || ((flowTarget === 'join' || flowTarget === 'challenge') && !joinCode.trim())}
            className="w-full"
          >
            {flowTarget === 'join'
              ? 'Join Room'
              : flowTarget === 'challenge'
                ? 'Accept Challenge'
                : flowTarget === 'arena'
                  ? "Let's Go!"
                  : 'Start Playing'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AchievementTile({ def, unlocked }: { def: AchievementDef; unlocked: boolean }) {
  return (
    <div
      title={unlocked ? def.title : `${def.title} — ${def.description}`}
      className={cn(
        'flex flex-col items-center gap-1 rounded-xl border p-2 text-center',
        unlocked ? 'border-chart-1/30 bg-chart-1/[0.08]' : 'border-border/40 bg-card/40 opacity-60',
      )}
    >
      <span className="text-lg">{unlocked ? (ACHIEVEMENT_TILE_ICONS[def.icon] ?? '🏆') : '🔒'}</span>
      <span className="text-[10px] font-semibold leading-tight text-muted-foreground">{def.title}</span>
    </div>
  );
}
