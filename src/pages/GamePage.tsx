import { useParams, useNavigate } from 'react-router-dom';
import GameShell from '@/components/GameShell';
import { getGameMode } from '@/lib/gameConfig';
import ColorGame from '@/components/games/ColorGame';
import MathGame from '@/components/games/MathGame';
import ReflexGame from '@/components/games/ReflexGame';
import StroopGame from '@/components/games/StroopGame';
import ReverseGame from '@/components/games/ReverseGame';
import ScrambleGame from '@/components/games/ScrambleGame';
import SpeedTypeGame from '@/components/games/SpeedTypeGame';
import TrueFalseGame from '@/components/games/TrueFalseGame';
import EmojiGame from '@/components/games/EmojiGame';
import CountGame from '@/components/games/CountGame';
import SequenceGame from '@/components/games/SequenceGame';
import MemoryGame from '@/components/games/MemoryGame';
import ImpostorGame from '@/components/games/ImpostorGame';
import ChainGame from '@/components/games/ChainGame';
import MissingNumGame from '@/components/games/MissingNumGame';
import EmojiTalkGame from '@/components/games/EmojiTalkGame';
import ColorMemGame from '@/components/games/ColorMemGame';
import TileMatchGame from '@/components/games/TileMatchGame';
import OddOneGame from '@/components/games/OddOneGame';
import ScribbleGame from '@/components/games/ScribbleGame';
import RiddleGame from '@/components/games/RiddleGame';
import CatchGame from '@/components/games/CatchGame';
import ShapeMatchGame from '@/components/games/ShapeMatchGame';
import WordHuntGame from '@/components/games/WordHuntGame';
import WhackGame from '@/components/games/WhackGame';
import TreasureGame from '@/components/games/TreasureGame';
import DuelGame from '@/components/games/DuelGame';

const GAME_COMPONENTS: Record<string, React.ComponentType<any>> = {
  color: ColorGame, math: MathGame, reflex: ReflexGame, stroop: StroopGame,
  reverse: ReverseGame, scramble: ScrambleGame, speedtype: SpeedTypeGame,
  truefalse: TrueFalseGame, emoji: EmojiGame, count: CountGame,
  sequence: SequenceGame, memory: MemoryGame, impostor: ImpostorGame,
  chain: ChainGame, missingnum: MissingNumGame, emojitalk: EmojiTalkGame,
  colormem: ColorMemGame, tilematch: TileMatchGame, oddone: OddOneGame,
  scribble: ScribbleGame, riddles: RiddleGame, catch: CatchGame,
  shapes: ShapeMatchGame, wordhunt: WordHuntGame,
  whack: WhackGame, treasure: TreasureGame, duel: DuelGame,
};

export default function GamePage() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const mode = getGameMode(gameId || '');

  if (!mode) {
    navigate('/select');
    return null;
  }

  const GameComponent = GAME_COMPONENTS[mode.id];
  if (!GameComponent) {
    navigate('/select');
    return null;
  }

  return (
    <GameShell key={mode.id} mode={mode}>
      {(ctx) => <GameComponent {...ctx} />}
    </GameShell>
  );
}
