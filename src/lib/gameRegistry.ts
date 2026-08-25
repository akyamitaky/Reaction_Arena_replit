import { lazy } from 'react';
import type { ComponentType } from 'react';
import type { GameContext } from '@/components/GameShell';

type GameComponent = ComponentType<GameContext>;

const load = (importer: () => Promise<{ default: GameComponent }>) =>
  lazy(() => importer().then((m) => ({ default: m.default })));

export const GAME_COMPONENTS: Record<string, ReturnType<typeof load>> = {
  color: load(() => import('@/components/games/ColorGame')),
  math: load(() => import('@/components/games/MathGame')),
  reflex: load(() => import('@/components/games/ReflexGame')),
  stroop: load(() => import('@/components/games/StroopGame')),
  reverse: load(() => import('@/components/games/ReverseGame')),
  scramble: load(() => import('@/components/games/ScrambleGame')),
  speedtype: load(() => import('@/components/games/SpeedTypeGame')),
  truefalse: load(() => import('@/components/games/TrueFalseGame')),
  emoji: load(() => import('@/components/games/EmojiGame')),
  count: load(() => import('@/components/games/CountGame')),
  sequence: load(() => import('@/components/games/SequenceGame')),
  memory: load(() => import('@/components/games/MemoryGame')),
  impostor: load(() => import('@/components/games/ImpostorGame')),
  chain: load(() => import('@/components/games/ChainGame')),
  missingnum: load(() => import('@/components/games/MissingNumGame')),
  emojitalk: load(() => import('@/components/games/EmojiTalkGame')),
  colormem: load(() => import('@/components/games/ColorMemGame')),
  tilematch: load(() => import('@/components/games/TileMatchGame')),
  oddone: load(() => import('@/components/games/OddOneGame')),
  scribble: load(() => import('@/components/games/ScribbleGame')),
  riddles: load(() => import('@/components/games/RiddleGame')),
  catch: load(() => import('@/components/games/CatchGame')),
  shapes: load(() => import('@/components/games/ShapeMatchGame')),
  wordhunt: load(() => import('@/components/games/WordHuntGame')),
  whack: load(() => import('@/components/games/WhackGame')),
  treasure: load(() => import('@/components/games/TreasureGame')),
  duel: load(() => import('@/components/games/DuelGame')),
  series: load(() => import('@/components/games/SeriesGame')),
  vowels: load(() => import('@/components/games/VowelGame')),
  alpha: load(() => import('@/components/games/AlphaGame')),
  colormix: load(() => import('@/components/games/ColorMixGame')),
  clock: load(() => import('@/components/games/ClockGame')),
  roman: load(() => import('@/components/games/RomanGame')),
  palindrome: load(() => import('@/components/games/PalindromeGame')),
  spelling: load(() => import('@/components/games/SpellingGame')),
};

export function getGameComponent(id: string) {
  return GAME_COMPONENTS[id];
}
