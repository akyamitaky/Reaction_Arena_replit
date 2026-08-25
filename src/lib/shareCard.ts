/**
 * Wordle-style shareable result cards.
 *
 * Both solo and arena results collapse into a short, copy-paste friendly text
 * block players can post to any chat or social feed. This is the primary
 * viral loop: every finished game can turn the player into a promoter.
 */

export interface SoloShare {
  gameName: string;
  score: number;
  maxScore: number;
  grade: string;
}

export interface ArenaShare {
  playerName: string;
  rank: number;
  totalPlayers: number;
  score: number;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export function appUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'https://reactionarena.app';
}

export function buildJoinLink(code: string): string {
  return `${appUrl()}/join/${code}`;
}

export function gradeEmoji(grade: string): string {
  switch (grade) {
    case 'Legendary':
      return '👑';
    case 'Amazing':
      return '🚀';
    case 'Sharp':
      return '⚡';
    case 'Warming Up':
      return '🔥';
    default:
      return '🧠';
  }
}

export function buildSoloShareCard({ gameName, score, maxScore, grade }: SoloShare): string {
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  return [
    `🧠 ReactionArena — ${grade} ${gradeEmoji(grade)}`,
    `I scored ${score} pts (${pct}%) in ${gameName}.`,
    `Think you're faster? ${appUrl()}`,
  ].join('\n');
}

export function buildArenaShareCard({ playerName, rank, totalPlayers, score }: ArenaShare): string {
  const medal = rank >= 1 && rank <= 3 ? MEDALS[rank - 1] : `${rank}.`;
  return [
    `🏆 ReactionArena — ${medal} ${playerName}`,
    `I placed #${rank} of ${totalPlayers} with ${score} pts.`,
    `Think you're faster? ${appUrl()}`,
  ].join('\n');
}

export async function shareResult(text: string, title = 'ReactionArena'): Promise<'shared' | 'copied'> {
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  if (nav?.share) {
    try {
      await nav.share({ title, text });
      return 'shared';
    } catch {
      // dismissed or unsupported on desktop — fall through to clipboard
    }
  }
  if (nav?.clipboard?.writeText) {
    await nav.clipboard.writeText(text);
    return 'copied';
  }
  legacyCopy(text);
  return 'copied';
}

function legacyCopy(text: string) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
  } finally {
    document.body.removeChild(ta);
  }
}
