import './HomePage.css';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ChevronRight,
  Crosshair,
  Flame,
  Gamepad2,
  Medal,
  Radio,
  Sparkles,
  Swords,
  Target,
  Trophy,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { gameModes, getGameMode, type GameMode } from '@/lib/gameConfig';
import { storage, type RunRecord } from '@/lib/storage';
import { dailyGameId, getDailyStreak } from '@/lib/dailyChallenge';
import { ACHIEVEMENTS, getUnlockedAchievements, type AchievementDef } from '@/lib/achievements';
import { useClaimAchievements } from '@/hooks/useClaimAchievements';
import SoundToggle from '@/components/SoundToggle';
import ThemeToggle from '@/components/ThemeToggle';

type Flow = 'practice' | 'arena' | 'join' | 'challenge';

function Logo({ onClick }: { onClick: () => void }) {
  return (
    <button className="ra-logo" onClick={onClick} aria-label="Return to top">
      <span className="ra-logo-mark">
        <Zap size={19} fill="currentColor" />
      </span>
      <span className="ra-logo-type">
        <strong>
          Reaction<span>Arena</span>
        </strong>
        <span>Short games. Sharp minds.</span>
      </span>
    </button>
  );
}

function ModeCard({
  mode,
  index,
  compact = false,
  onSelect,
}: {
  mode: GameMode;
  index: number;
  compact?: boolean;
  onSelect: (mode: GameMode) => void;
}) {
  const Icon = mode.icon;
  return (
    <button className="ra-mode-card" onClick={() => onSelect(mode)} aria-label={`Play ${mode.label}`}>
      <span className="ra-mode-number ra-mono">
        {String(index + 1).padStart(2, '0')} / {gameModes.length}
      </span>
      <span className="ra-mode-icon">
        <Icon size={compact ? 14 : 16} />
      </span>
      <strong>{mode.label}</strong>
      {!compact && <small>{mode.description}</small>}
    </button>
  );
}

function FlowModal({
  flow,
  name,
  code,
  setName,
  setCode,
  close,
  submit,
}: {
  flow: Flow;
  name: string;
  code: string;
  setName: (value: string) => void;
  setCode: (value: string) => void;
  close: () => void;
  submit: () => void;
}) {
  const needsCode = flow === 'join' || flow === 'challenge';
  const title =
    flow === 'practice'
      ? 'Solo practice'
      : flow === 'arena'
        ? 'Host an arena'
        : flow === 'join'
          ? 'Join an arena'
          : 'Enter a challenge';
  const copy =
    flow === 'practice'
      ? 'Choose a name, then your first reaction test is ready.'
      : flow === 'arena'
        ? 'Open a room for up to 8 players and set the pace.'
        : "Enter your name and the five-character access code.";

  return (
    <div className="ra-modal-backdrop" onClick={close}>
      <div
        className="ra-modal"
        onClick={event => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="flow-title"
      >
        <div className="ra-modal-head">
          <div>
            <div className="ra-eyebrow">
              <span className="ra-pulse" /> Connect console
            </div>
            <h2 id="flow-title">{title}</h2>
          </div>
          <button className="ra-modal-close" onClick={close} aria-label="Close dialog">
            ×
          </button>
        </div>
        <p>{copy}</p>
        <input
          className="ra-field"
          autoFocus
          value={name}
          onChange={event => setName(event.target.value)}
          placeholder="Your player name"
          aria-label="Your player name"
          onKeyDown={event => event.key === 'Enter' && submit()}
        />
        {needsCode && (
          <input
            className="ra-field code"
            maxLength={5}
            value={code}
            onChange={event => setCode(event.target.value.toUpperCase())}
            placeholder={flow === 'join' ? 'ROOM CODE' : 'CHALLENGE CODE'}
            aria-label={flow === 'join' ? 'Room code' : 'Challenge code'}
            onKeyDown={event => event.key === 'Enter' && submit()}
          />
        )}
        <button
          className="ra-btn ra-btn-primary"
          disabled={!name.trim() || (needsCode && code.trim().length < 5)}
          onClick={submit}
        >
          {flow === 'practice'
            ? 'Start a practice run'
            : flow === 'arena'
              ? 'Create room'
              : flow === 'join'
                ? 'Enter arena'
                : 'Accept challenge'}{' '}
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [flow, setFlow] = useState<Flow | null>(null);
  const [name, setName] = useState(() => storage.getPlayerName());
  const [code, setCode] = useState('');
  const [notice, setNotice] = useState('');
  const stats = storage.getStats();
  const dailyMode = getGameMode(dailyGameId());
  const dailyStreak = getDailyStreak();
  const recentRuns = useMemo(() => storage.getRunHistory().slice(-4).reverse(), [stats.gamesPlayed]);
  const justUnlocked = useClaimAchievements([stats.gamesPlayed, stats.arenasPlayed, stats.xp, stats.bestScore]);
  const unlockedAchievements = useMemo(() => getUnlockedAchievements(), [justUnlocked]);

  useEffect(() => {
    if (!flow) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && setFlow(null);
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [flow]);

  const openFlow = (next: Flow) => {
    setFlow(next);
    setNotice('');
    setCode('');
  };

  const closeFlow = () => setFlow(null);

  const submitFlow = () => {
    const trimmedName = name.trim();
    const normalizedCode = code.trim().toUpperCase();
    if (!trimmedName || ((flow === 'join' || flow === 'challenge') && normalizedCode.length < 5)) return;

    storage.setPlayerName(trimmedName);
    if (flow === 'arena') {
      navigate('/arena-setup');
    } else if (flow === 'practice') {
      navigate('/select');
    } else if (flow === 'join') {
      navigate('/lobby', { state: { joinCode: normalizedCode, playerName: trimmedName } });
    } else if (flow === 'challenge') {
      navigate(`/challenge/${normalizedCode}`);
    }
    closeFlow();
  };

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const selectMode = (mode: GameMode) => {
    navigate(`/play/${mode.id}`);
  };

  const formatRun = (run: RunRecord) => {
    const mode = getGameMode(run.gameId);
    return `${mode?.label || run.gameId} · ${run.score.toLocaleString()} pts`;
  };

  const dailyTitle = dailyStreak.playedToday ? 'Today complete — run it again?' : `Today: ${dailyMode?.label || 'Daily challenge'}`;
  const dailyCopy = dailyStreak.playedToday
    ? `${dailyStreak.lastScore.toLocaleString()} pts today · best ${dailyStreak.bestScore.toLocaleString()}`
    : 'One game, one shared score. Keep your streak alive.';

  return (
    <div className="ra-hightech">
      <div className="ra-noise" />
      <div className="ra-scanlines" />

      <header className="ra-topbar">
        <div className="ra-shell ra-topbar-inner">
          <Logo onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
          <nav className="ra-nav" aria-label="Homepage sections">
            <button data-active="true" onClick={() => scrollTo('launch')}>Launch</button>
            <button onClick={() => scrollTo('library')}>Game library</button>
            <button onClick={() => navigate('/leaderboard')}>Leaderboard</button>
          </nav>
          <div className="ra-topbar-tools">
            <SoundToggle />
            <ThemeToggle />
            <button className="ra-utility" onClick={() => openFlow('join')} aria-label="Join with a room code" title="Join an arena">
              <Radio size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="ra-shell">
        <section className="ra-hero" id="launch">
          <div>
            <div className="ra-eyebrow">
              <span className="ra-pulse" /> Arena network online · ready for your next run
            </div>
            <h1>
              Make your next
              <br />
              <em>move</em> count<span>.</span>
            </h1>
            <p className="ra-hero-copy">
              Fast brain games for the moment between “I have five minutes” and “one more round.” Train solo, chase
              today’s score, or put your reflexes on the line.
            </p>
            <div className="ra-hero-actions">
              <button className="ra-btn ra-btn-primary" onClick={() => openFlow('practice')}>
                <Gamepad2 size={17} /> Start a quick game <ArrowRight size={16} />
              </button>
              <button className="ra-btn ra-btn-ghost" onClick={() => openFlow('arena')}>
                <Swords size={16} /> Host an arena
              </button>
            </div>
            <div className="ra-hero-secondary">
              <button onClick={() => openFlow('challenge')}>
                <Medal size={14} /> Have a challenge code? Enter it
              </button>
            </div>
            {notice && (
              <div className="ra-hero-meta" role="status">
                <div><strong>READY</strong><span>{notice}</span></div>
              </div>
            )}
            {!notice && (
              <div className="ra-hero-meta">
                <div><strong>{gameModes.length}</strong><span>game modes</span></div>
                <div><strong>08</strong><span>players / arena</span></div>
                <div><strong>15s</strong><span>average round</span></div>
              </div>
            )}
          </div>

          <div className="ra-console" aria-label="Live reaction console preview">
            <div className="ra-console-head">
              <span className="ra-mono">RA / {dailyMode?.id?.toUpperCase() || 'REFLEX_CORE'}</span>
              <span className="ra-live"><i /> live signal</span>
            </div>
            <div className="ra-target-wrap">
              <div className="ra-target"><Crosshair size={28} strokeWidth={1.5} /></div>
              <div className="ra-crosshair" />
            </div>
            <div className="ra-console-foot">
              <div><span>best score</span><strong>{stats.bestScore.toLocaleString()}</strong></div>
              <div><span>daily streak</span><strong className="ra-timer ra-mono">{String(dailyStreak.current).padStart(2, '0')} days</strong></div>
              <div><span>modes</span><strong className="ra-mono">{gameModes.length}</strong></div>
            </div>
          </div>
        </section>

        <div className="ra-ticker ra-mono" aria-label="Activity summary">
          <span><b>STATUS</b> &nbsp; Local progress synced</span>
          <span><b>DAILY</b> &nbsp; {dailyStreak.current}-day streak</span>
          <span><b>MODES</b> &nbsp; {gameModes.length} reaction tests ready</span>
          <span><b>XP</b> &nbsp; {stats.xp.toLocaleString()} earned</span>
        </div>

        <section className="ra-section" id="modes">
          <div className="ra-section-head">
            <div><p className="ra-section-kicker">Choose your edge</p><h2>Popular on the grid</h2></div>
            <p className="ra-section-sub">Every mode is built for one clean idea, one clear score, and a satisfying rematch.</p>
          </div>
          <div className="ra-mode-grid">
            {gameModes.slice(0, 8).map((mode, index) => (
              <ModeCard key={mode.id} mode={mode} index={index} onSelect={selectMode} />
            ))}
          </div>
        </section>

        <section className="ra-section" id="play">
          <div className="ra-action-grid">
            <article className="ra-action-card primary">
              <div>
                <div className="ra-action-top"><div className="ra-action-icon"><Gamepad2 size={21} /></div><span className="ra-mono">01 / SOLO</span></div>
                <h3>Build your baseline.</h3>
                <p>Run a focused set of games, learn where your milliseconds go, and come back with a sharper hand.</p>
              </div>
              <button className="ra-action-link" onClick={() => openFlow('practice')}>Enter practice <ChevronRight size={15} /></button>
            </article>
            <article className="ra-action-card coral">
              <div>
                <div className="ra-action-top"><div className="ra-action-icon"><Swords size={21} /></div><span className="ra-mono">02 / LIVE</span></div>
                <h3>Put it on the line.</h3>
                <p>Invite the room. Eight players. A rotating gauntlet. One name at the top.</p>
              </div>
              <button className="ra-action-link" onClick={() => openFlow('arena')}>Create an arena <ChevronRight size={15} /></button>
            </article>
          </div>
        </section>

        <section className="ra-section" id="scores">
          <div className="ra-data-grid">
            <div className="ra-panel">
              <div className="ra-panel-title"><h3>Recent runs</h3><span className="ra-mono">this device</span></div>
              {recentRuns.length > 0 ? recentRuns.map((run, index) => (
                <div className="ra-score-row" key={`${run.at}-${run.gameId}`}>
                  <span className="ra-rank ra-mono">{String(index + 1).padStart(2, '0')}</span>
                  <div className="ra-player">
                    <span className="ra-avatar">{(getGameMode(run.gameId)?.label || '?').slice(0, 2).toUpperCase()}</span>
                    <div><strong>{formatRun(run)}</strong><small>{new Date(run.at).toLocaleDateString()}</small></div>
                  </div>
                  <span className="ra-score ra-mono">{Math.round(run.pct)}%</span>
                </div>
              )) : (
                <div className="ra-empty-state"><Target size={18} /><p>No runs yet. Start a quick game to populate your signal.</p></div>
              )}
              <Link className="ra-view-all" to="/select">Browse every mode <ArrowRight size={13} /></Link>
            </div>

            <div className="ra-panel">
              <div className="ra-panel-title"><h3>Your telemetry</h3><span>local progress</span></div>
              <div className="ra-stat-stack">
                <div className="ra-stat"><p>Games played</p><strong>{stats.gamesPlayed.toLocaleString()}</strong><em>{stats.xp.toLocaleString()} XP earned</em></div>
                <div className="ra-stat"><p>Best score</p><strong>{stats.bestScore.toLocaleString()}</strong><em>personal best</em></div>
                <div className="ra-stat"><p>Arena wins</p><strong>{String(stats.arenaWins).padStart(2, '0')}</strong><em>{stats.arenasPlayed} arenas played</em></div>
                <div className="ra-stat"><p>Achievements</p><strong>{unlockedAchievements.length}/{ACHIEVEMENTS.length}</strong><em>{justUnlocked.length > 0 ? 'new unlock available' : 'keep exploring'}</em></div>
              </div>
              <div className="ra-bars" aria-label="Recent run accuracy chart">
                {(recentRuns.length > 0 ? [...recentRuns].reverse().map(run => Math.max(12, Math.min(100, run.pct))) : [18, 26, 19, 34]).map((height, index) => (
                  <span className="ra-bar" style={{ height: `${height}%` }} key={index} title={`Run ${index + 1}`} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="ra-section">
          <div className="ra-daily">
            <div>
              <div className="ra-streak"><Flame size={14} /> Daily challenge · day {String(dailyStreak.current).padStart(2, '0')}</div>
              <h2>{dailyTitle}</h2>
              <p>{dailyCopy} {dailyMode ? `Today’s mode is ${dailyMode.label}.` : ''}</p>
            </div>
            <div className="ra-daily-score">
              <strong>{dailyStreak.bestScore.toLocaleString()}</strong>
              <small>your best</small>
              <button className="ra-btn ra-btn-coral" onClick={() => navigate('/daily')} style={{ marginTop: 15 }}>
                {dailyStreak.playedToday ? 'Play again' : 'Play today'} <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </section>

        <section className="ra-section ra-library" id="library">
          <div className="ra-section-head">
            <div><p className="ra-section-kicker">The full arsenal</p><h2>{gameModes.length} ways to get better.</h2></div>
            <Link className="ra-view-all" to="/select">Open game library <ArrowRight size={13} /></Link>
          </div>
          <div className="ra-library-grid">
            {gameModes.map((mode, index) => (
              <ModeCard key={mode.id} mode={mode} index={index} compact onSelect={selectMode} />
            ))}
          </div>
        </section>
      </main>

      <footer className="ra-footer">
        <div className="ra-shell ra-footer-inner">
          <p>ReactionArena / Fast mind · sharp edge</p>
          <p className="ra-mono">{gameModes.length} modes · 8 players · 15 sec rounds</p>
        </div>
      </footer>

      {flow && (
        <FlowModal flow={flow} name={name} code={code} setName={setName} setCode={setCode} close={closeFlow} submit={submitFlow} />
      )}
    </div>
  );
}

function AchievementTile({ def, unlocked }: { def: AchievementDef; unlocked: boolean }) {
  return (
    <div className={`ra-achievement ${unlocked ? 'is-unlocked' : ''}`} title={unlocked ? def.title : `${def.title} — ${def.description}`}>
      <span>{unlocked ? '●' : '○'}</span>
      <small>{def.title}</small>
    </div>
  );
}