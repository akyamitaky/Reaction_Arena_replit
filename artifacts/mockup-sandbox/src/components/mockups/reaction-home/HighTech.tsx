import './HighTech.css';
import { useState } from 'react';
import {
  ArrowRight, Award, Binary, Brain, Calculator, Check, ChevronRight, CircleDot, Clock3,
  Crosshair, Eye, Flame, Gamepad2, Hash, Lightbulb, Medal, MousePointer2, Puzzle, Radio,
  Search, Shield, Sparkles, Swords, Target, Trophy, Type, Users, Zap,
} from 'lucide-react';

type Icon = typeof Zap;
type Flow = 'practice' | 'arena' | 'join' | 'challenge';
type Mode = [string, string, Icon];

const modes: Mode[] = [
  ['Color Signal', 'Name the color you see', Eye], ['Memory Stack', 'Remember the sequence', Brain],
  ['Rapid Math', 'Solve quick arithmetic', Calculator], ['Reflex Core', 'Tap on the green pulse', Zap],
  ['Catch It', 'Catch the moving target', Target], ['Reverse Code', 'Type the word backwards', Binary],
  ['Count Field', 'Count the items quickly', Hash], ['Sequence Lock', 'Repeat the pattern', CircleDot],
  ['Stroop Test', 'Pick the ink, not the word', Clock3], ['Odd One', 'Spot the odd item', Search],
  ['Scramble', 'Unscramble the word', Type], ['Impostor', 'Find the different item', Shield],
  ['Chain Logic', 'Continue the number chain', Radio], ['Riddle Run', 'Solve clever riddles', Lightbulb],
  ['Missing Number', 'Find what is missing', Hash], ['Color Memory', 'Remember color sequence', Eye],
  ['Tile Match', 'Match the pairs', Puzzle], ['Speed Type', 'Type as fast as you can', Type],
  ['Scribble', 'Draw what you see described', PencilIcon], ['Shape Match', 'Find the matching shape', Puzzle],
  ['Word Hunt', 'Find words in the grid', Search], ['Whack', 'Test your timing', MousePointer2],
  ['Treasure Path', 'Choose the right path', Target], ['Duel', 'Outscore your rival', Swords],
  ['Series', 'Complete the number series', Binary], ['Vowels', 'Spot the missing vowel', Type],
  ['Alphabet', 'Race through the alphabet', Type], ['Color Mix', 'Mix the right colors', Eye],
  ['Clock Read', 'Read the clock quickly', Clock3], ['Roman Code', 'Decode Roman numerals', Hash],
  ['Palindrome', 'Find the mirrored word', Binary], ['Spelling', 'Spell it correctly', Check],
  ['True / False', 'Make the call quickly', Check], ['Phrase Decode', 'Guess the phrase', Puzzle],
  ['Number Link', 'Connect the chain', Radio],
];

function PencilIcon(props: { className?: string }) {
  return <Type {...props} />;
}

const leaderboard = [
  ['01', 'Mara Chen', 'mchen', '1,842', 'MC'],
  ['02', 'Theo Alvarez', 'theo.a', '1,796', 'TA'],
  ['03', 'Alex Morgan', 'you', '1,284', 'AM'],
  ['04', 'Nia Okafor', 'nia.o', '1,231', 'NO'],
];

function Logo({ onClick }: { onClick: () => void }) {
  return <button className="ra-logo" onClick={onClick} aria-label="Return to top">
    <span className="ra-logo-mark"><Zap size={19} fill="currentColor" /></span>
    <span className="ra-logo-type"><strong>Reaction<span style={{ color: 'var(--ra-cyan)' }}>Arena</span></strong><span>Short games. Sharp minds.</span></span>
  </button>;
}

function ModeCard({ mode, index, compact = false, onSelect }: { mode: Mode; index: number; compact?: boolean; onSelect: (mode: string) => void }) {
  const [label, description, Icon] = mode;
  return <button className="ra-mode-card" onClick={() => onSelect(label)} aria-label={`Play ${label}`}>
    <span className="ra-mode-number ra-mono">{String(index + 1).padStart(2, '0')} / 35</span>
    <span className="ra-mode-icon"><Icon size={compact ? 14 : 16} /></span>
    <strong>{label}</strong>
    {!compact && <small>{description}</small>}
  </button>;
}

function FlowModal({ flow, name, code, setName, setCode, close, submit }: {
  flow: Flow; name: string; code: string; setName: (value: string) => void; setCode: (value: string) => void;
  close: () => void; submit: () => void;
}) {
  const needsCode = flow === 'join' || flow === 'challenge';
  const title = flow === 'practice' ? 'Solo practice' : flow === 'arena' ? 'Host an arena' : flow === 'join' ? 'Join an arena' : 'Daily challenge';
  const copy = flow === 'practice' ? 'Choose a name, then your first reaction test is ready.' : flow === 'arena' ? 'Open a room for up to 8 players and set the pace.' : 'Enter your name and the five-character access code.';
  return <div className="ra-modal-backdrop" onClick={close}>
    <div className="ra-modal" onClick={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="flow-title">
      <div className="ra-modal-head"><div><div className="ra-eyebrow"><span className="ra-pulse" /> Connect console</div><h2 id="flow-title">{title}</h2></div><button className="ra-modal-close" onClick={close} aria-label="Close dialog">×</button></div>
      <p>{copy}</p>
      <input className="ra-field" autoFocus value={name} onChange={event => setName(event.target.value)} placeholder="Your player name" />
      {needsCode && <input className="ra-field code" maxLength={5} value={code} onChange={event => setCode(event.target.value.toUpperCase())} placeholder={flow === 'join' ? 'ROOM CODE' : 'CODE'} />}
      <button className="ra-btn ra-btn-primary" disabled={!name.trim() || (needsCode && code.length < 5)} onClick={submit}>{flow === 'practice' ? 'Start a practice run' : flow === 'arena' ? 'Create room' : flow === 'join' ? 'Enter arena' : 'Accept challenge'} <ArrowRight size={16} /></button>
    </div>
  </div>;
}

export function HighTech() {
  const [flow, setFlow] = useState<Flow | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [notice, setNotice] = useState('');
  const openFlow = (next: Flow) => { setFlow(next); setNotice(''); setCode(''); };
  const closeFlow = () => setFlow(null);
  const submitFlow = () => { if (!name.trim() || ((flow === 'join' || flow === 'challenge') && code.length < 5)) return; setNotice(flow === 'arena' ? 'Arena room AR-482 is ready to share.' : flow === 'join' ? `Connected to ${code}. Loading the arena.` : flow === 'challenge' ? 'Challenge accepted. Your run is queued.' : 'Practice console armed. Pick a mode below.'); closeFlow(); };
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const selectMode = (mode: string) => { setNotice(`${mode} selected. Your reaction window is standing by.`); scrollTo('launch'); };
  return <div className="ra-hightech">
    <div className="ra-noise" /><div className="ra-scanlines" />
    <header className="ra-topbar">
      <div className="ra-shell ra-topbar-inner">
        <Logo onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
        <nav className="ra-nav" aria-label="Main navigation">
          <button data-active="true" onClick={() => scrollTo('launch')}>Launch</button>
          <button onClick={() => scrollTo('library')}>Game library</button>
          <button onClick={() => scrollTo('scores')}>Leaderboard</button>
        </nav>
        <button className="ra-utility" onClick={() => openFlow('join')} aria-label="Join with a room code"><Radio size={16} /></button>
      </div>
    </header>

    <main className="ra-shell">
      <section className="ra-hero" id="launch">
        <div>
          <div className="ra-eyebrow"><span className="ra-pulse" /> Arena network online · 2,481 players active</div>
          <h1>Make your next<br /><em>move</em> count<span>.</span></h1>
          <p className="ra-hero-copy">Fast brain games for the moment between “I have five minutes” and “one more round.” Train solo, chase today’s score, or put your reflexes on the line.</p>
          <div className="ra-hero-actions">
            <button className="ra-btn ra-btn-primary" onClick={() => openFlow('practice')}><Gamepad2 size={17} /> Start a quick game <ArrowRight size={16} /></button>
            <button className="ra-btn ra-btn-ghost" onClick={() => openFlow('arena')}><Swords size={16} /> Host an arena</button>
          </div>
          {notice && <div className="ra-hero-meta" role="status"><div><strong>READY</strong><span>{notice}</span></div></div>}
          {!notice && <div className="ra-hero-meta"><div><strong>35</strong><span>game modes</span></div><div><strong>08</strong><span>players / arena</span></div><div><strong>15s</strong><span>average round</span></div></div>}
        </div>
        <div className="ra-console" aria-label="Live reaction console preview">
          <div className="ra-console-head"><span className="ra-mono">RA / REFLEX_CORE_04</span><span className="ra-live"><i /> live signal</span></div>
          <div className="ra-target-wrap"><div className="ra-target"><Crosshair size={28} strokeWidth={1.5} /></div><div className="ra-crosshair" /></div>
          <div className="ra-console-foot"><div><span>current score</span><strong>842</strong></div><div><span>best time</span><strong className="ra-timer ra-mono">0.184s</strong></div><div><span>round</span><strong className="ra-mono">04<span style={{ color: 'var(--ra-dim)' }}>/10</span></strong></div></div>
        </div>
      </section>

      <div className="ra-ticker ra-mono"><span><b>LIVE</b> &nbsp; Mara Chen topped Reflex Core +128</span><span><b>ARENA 482</b> &nbsp; 6 players ready</span><span><b>DAILY</b> &nbsp; 4-day streak at risk</span><span><b>LATENCY</b> &nbsp; 18ms</span></div>

      <section className="ra-section" id="modes">
        <div className="ra-section-head"><div><p className="ra-section-kicker">Choose your edge</p><h2>Popular on the grid</h2></div><p className="ra-section-sub">Every mode is built for one clean idea, one clear score, and a satisfying rematch.</p></div>
        <div className="ra-mode-grid">{modes.slice(0, 8).map((mode, index) => <ModeCard key={mode[0]} mode={mode} index={index} onSelect={selectMode} />)}</div>
      </section>

      <section className="ra-section" id="play">
        <div className="ra-action-grid">
          <article className="ra-action-card primary"><div><div className="ra-action-top"><div className="ra-action-icon"><Gamepad2 size={21} /></div><span className="ra-mono" style={{ color: 'var(--ra-cyan)', fontSize: 10 }}>01 / SOLO</span></div><h3>Build your baseline.</h3><p>Run a focused set of games, learn where your milliseconds go, and come back with a sharper hand.</p></div><button className="ra-action-link" onClick={() => openFlow('practice')}>Enter practice <ChevronRight size={15} /></button></article>
          <article className="ra-action-card coral"><div><div className="ra-action-top"><div className="ra-action-icon"><Swords size={21} /></div><span className="ra-mono" style={{ color: 'var(--ra-coral)', fontSize: 10 }}>02 / LIVE</span></div><h3>Put it on the line.</h3><p>Invite the room. Eight players. A rotating gauntlet. One name at the top.</p></div><button className="ra-action-link" onClick={() => openFlow('arena')}>Create an arena <ChevronRight size={15} /></button></article>
        </div>
      </section>

      <section className="ra-section" id="scores">
        <div className="ra-data-grid">
          <div className="ra-panel"><div className="ra-panel-title"><h3>Leaderboard / weekly</h3><span className="ra-mono">07:42 left</span></div>{leaderboard.map(([rank, player, handle, score, initials]) => <div className="ra-score-row" key={rank}><span className="ra-rank ra-mono">{rank}</span><div className="ra-player"><span className="ra-avatar">{initials}</span><div><strong>{player}</strong><small>@{handle}</small></div></div><span className="ra-score ra-mono">{score}</span></div>)}<button className="ra-view-all" onClick={() => setNotice('Leaderboard expanded — the top 100 are updating live.')}>View top 100 <ArrowRight size={13} /></button></div>
          <div className="ra-panel"><div className="ra-panel-title"><h3>Your telemetry</h3><span>this week</span></div><div className="ra-stat-stack"><div className="ra-stat"><p>Games played</p><strong>24</strong><em>+6 this week</em></div><div className="ra-stat"><p>Best score</p><strong>1,284</strong><em>personal best</em></div><div className="ra-stat"><p>Arena wins</p><strong>05</strong><em>rank #18</em></div><div className="ra-stat"><p>Fastest hit</p><strong>184ms</strong><em>reflex core</em></div></div><div className="ra-bars" aria-label="Seven day activity chart">{[36, 55, 44, 78, 61, 91, 73].map((height, index) => <span className="ra-bar" style={{ height: `${height}%` }} key={index} title={`Day ${index + 1}`} />)}</div></div>
        </div>
      </section>

      <section className="ra-section">
        <div className="ra-daily"><div><div className="ra-streak"><Flame size={14} /> Daily challenge · day 04</div><h2>Reflex Core / No warm-up.</h2><p>One game. One score for everyone. Your best run is 842 — the global mark is 1,106. The streak is yours to keep.</p></div><div className="ra-daily-score"><strong>842</strong><small>your best</small><button className="ra-btn ra-btn-coral" onClick={() => openFlow('challenge')} style={{ marginTop: 15 }}>Play today <ArrowRight size={15} /></button></div></div>
      </section>

      <section className="ra-section ra-library" id="library">
        <div className="ra-section-head"><div><p className="ra-section-kicker">The full arsenal</p><h2>35 ways to get better.</h2></div><button className="ra-view-all" onClick={() => setNotice('All 35 modes are unlocked for this prototype. Pick your next test.')}>35 modes unlocked <ArrowRight size={13} /></button></div>
        <div className="ra-library-grid">{modes.map((mode, index) => <ModeCard key={mode[0]} mode={mode} index={index} compact onSelect={selectMode} />)}</div>
      </section>
    </main>
    <footer className="ra-footer"><div className="ra-shell ra-footer-inner"><p>ReactionArena / Fast mind · sharp edge</p><p className="ra-mono">35 modes · 8 players · 15 sec rounds</p></div></footer>
    {flow && <FlowModal flow={flow} name={name} code={code} setName={setName} setCode={setCode} close={closeFlow} submit={submitFlow} />}
  </div>;
}