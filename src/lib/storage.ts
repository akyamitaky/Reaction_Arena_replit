import { xpForArenaRank, xpForGradePct } from './progress';

const KEYS = {
  playerName: 'playerName',
  playerId: 'playerId',
  playerToken: 'playerToken',
  roomId: 'roomId',
  theme: 'reaction-theme',
  gamesPlayed: 'ra-games-played',
  bestScore: 'ra-best-score',
  arenasPlayed: 'ra-arenas-played',
  arenaWins: 'ra-arena-wins',
  bestScores: 'ra-best-scores',
  xp: 'ra-xp',
  weeklyXp: 'ra-weekly-xp',
  weeklyXpWeek: 'ra-weekly-xp-week',
  runHistory: 'ra-run-history',
  maxCombo: 'ra-max-combo',
} as const;

const MAX_RUN_HISTORY = 100;

/** ISO week key matching PostgreSQL's to_char(now(), 'IYYY-IW'). */
function currentWeekKey(): string {
  const d = new Date();
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7;
  return `${date.getUTCFullYear()}-${String(Math.ceil(week)).padStart(2, '0')}`;
}

function readNumber(key: string) {
  const value = Number(localStorage.getItem(key) || 0);
  return Number.isFinite(value) ? value : 0;
}

function writeNumber(key: string, value: number) {
  localStorage.setItem(key, String(value));
}

function readBestScores(): Record<string, number> {
  try {
    const value = JSON.parse(localStorage.getItem(KEYS.bestScores) || '{}');
    return value && typeof value === 'object' ? value : {};
  } catch {
    return {};
  }
}

function writeBestScores(scores: Record<string, number>) {
  localStorage.setItem(KEYS.bestScores, JSON.stringify(scores));
}

export interface RunRecord {
  gameId: string;
  score: number;
  pct: number;
  at: string;
}

function readRunHistory(): RunRecord[] {
  try {
    const value = JSON.parse(localStorage.getItem(KEYS.runHistory) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export const storage = {
  getPlayerName: () => localStorage.getItem(KEYS.playerName) || '',
  setPlayerName: (name: string) => localStorage.setItem(KEYS.playerName, name),
  getPlayerId: () => localStorage.getItem(KEYS.playerId) || '',
  setPlayerId: (id: string) => localStorage.setItem(KEYS.playerId, id),
  getPlayerToken: () => localStorage.getItem(KEYS.playerToken) || '',
  setPlayerToken: (token: string) => localStorage.setItem(KEYS.playerToken, token),
  getRoomId: () => localStorage.getItem(KEYS.roomId) || '',
  setRoomId: (id: string) => localStorage.setItem(KEYS.roomId, id),
  getTheme: (): 'dark' | 'light' | null => {
    const stored = localStorage.getItem(KEYS.theme);
    return stored === 'light' || stored === 'dark' ? stored : null;
  },
  setTheme: (theme: 'dark' | 'light') => localStorage.setItem(KEYS.theme, theme),
  getXp: () => readNumber(KEYS.xp),
  getWeeklyXp: () => readNumber(KEYS.weeklyXp),
  getMaxCombo: () => readNumber(KEYS.maxCombo),
  recordMaxCombo: (combo: number) => {
    if (combo > readNumber(KEYS.maxCombo)) writeNumber(KEYS.maxCombo, combo);
  },
  getBestScores: () => readBestScores(),
  getRunHistory: () => readRunHistory(),
  getStats: () => ({
    gamesPlayed: readNumber(KEYS.gamesPlayed),
    bestScore: readNumber(KEYS.bestScore),
    arenasPlayed: readNumber(KEYS.arenasPlayed),
    arenaWins: readNumber(KEYS.arenaWins),
    xp: readNumber(KEYS.xp),
  }),
  addXp: (delta: number) => {
    if (delta <= 0) return;
    writeNumber(KEYS.xp, readNumber(KEYS.xp) + delta);
    const week = currentWeekKey();
    if (localStorage.getItem(KEYS.weeklyXpWeek) !== week) {
      localStorage.setItem(KEYS.weeklyXpWeek, week);
      writeNumber(KEYS.weeklyXp, delta);
    } else {
      writeNumber(KEYS.weeklyXp, readNumber(KEYS.weeklyXp) + delta);
    }
  },
  recordSoloGame: (score: number, gameId?: string, pct?: number) => {
    writeNumber(KEYS.gamesPlayed, readNumber(KEYS.gamesPlayed) + 1);
    const best = readNumber(KEYS.bestScore);
    if (score > best) writeNumber(KEYS.bestScore, score);
    if (gameId) {
      const scores = readBestScores();
      if (score > (scores[gameId] || 0)) {
        scores[gameId] = score;
        writeBestScores(scores);
      }
      const history = readRunHistory();
      history.push({ gameId, score, pct: pct ?? 0, at: new Date().toISOString() });
      if (history.length > MAX_RUN_HISTORY) history.splice(0, history.length - MAX_RUN_HISTORY);
      localStorage.setItem(KEYS.runHistory, JSON.stringify(history));
    }
    storage.addXp(xpForGradePct(pct ?? 0));
  },
  recordArena: (won: boolean, rank = 0, totalPlayers = 0) => {
    writeNumber(KEYS.arenasPlayed, readNumber(KEYS.arenasPlayed) + 1);
    if (won) writeNumber(KEYS.arenaWins, readNumber(KEYS.arenaWins) + 1);
    storage.addXp(xpForArenaRank(rank, totalPlayers));
  },
};
