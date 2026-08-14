import {
  Eye, Brain, Calculator, Zap, Shuffle, Hash,
  Target, Puzzle, Timer, Users, Type, Search, Link2, CircleHelp,
  MessageCircle, CircleCheckBig, Palette, Keyboard, Grid3x3, Pencil,
  Lightbulb,
} from 'lucide-react';

export interface GameMode {
  id: string;
  label: string;
  icon: typeof Eye;
  color: string;
  description: string;
  rounds: number;
  timePerRound: number; // seconds, 0 = no timer (reaction-based)
}

export const gameModes: GameMode[] = [
  { id: 'color', label: 'Color', icon: Eye, color: 'text-chart-4', description: 'Name the color you see', rounds: 10, timePerRound: 5 },
  { id: 'memory', label: 'Memory', icon: Brain, color: 'text-primary', description: 'Remember the sequence', rounds: 8, timePerRound: 0 },
  { id: 'math', label: 'Math', icon: Calculator, color: 'text-chart-3', description: 'Solve quick arithmetic', rounds: 10, timePerRound: 8 },
  { id: 'reflex', label: 'Reflex', icon: Zap, color: 'text-accent-foreground', description: 'Tap when the screen turns green', rounds: 5, timePerRound: 0 },
  { id: 'catch', label: 'Catch It', icon: Zap, color: 'text-chart-1', description: 'Catch the moving friend', rounds: 8, timePerRound: 6 },
  { id: 'reverse', label: 'Reverse', icon: Shuffle, color: 'text-chart-5', description: 'Type the word backwards', rounds: 8, timePerRound: 10 },
  { id: 'count', label: 'Count', icon: Hash, color: 'text-chart-1', description: 'Count the items quickly', rounds: 8, timePerRound: 8 },
  { id: 'sequence', label: 'Sequence', icon: Target, color: 'text-chart-2', description: 'Repeat the pattern', rounds: 8, timePerRound: 0 },
  { id: 'emoji', label: 'Emoji', icon: Puzzle, color: 'text-chart-4', description: 'Find the odd emoji', rounds: 10, timePerRound: 5 },
  { id: 'stroop', label: 'Stroop', icon: Timer, color: 'text-chart-3', description: 'Pick the ink color, not the word', rounds: 10, timePerRound: 5 },
  { id: 'oddone', label: 'Odd One', icon: Users, color: 'text-accent-foreground', description: 'Spot the odd one out', rounds: 10, timePerRound: 6 },
  { id: 'scramble', label: 'Scramble', icon: Type, color: 'text-chart-1', description: 'Unscramble the word', rounds: 8, timePerRound: 12 },
  { id: 'impostor', label: 'Impostor', icon: Search, color: 'text-chart-2', description: 'Find the different item', rounds: 10, timePerRound: 5 },
  { id: 'chain', label: 'Chain', icon: Link2, color: 'text-primary', description: 'Continue the number chain', rounds: 8, timePerRound: 8 },
  { id: 'riddles', label: 'Riddles', icon: Lightbulb, color: 'text-chart-5', description: 'Solve clever riddles', rounds: 10, timePerRound: 15 },
  { id: 'missingnum', label: 'Missing #', icon: CircleHelp, color: 'text-chart-4', description: 'Find the missing number', rounds: 8, timePerRound: 10 },
  { id: 'emojitalk', label: 'Emoji Talk', icon: MessageCircle, color: 'text-chart-5', description: 'Guess the phrase from emojis', rounds: 8, timePerRound: 10 },
  { id: 'truefalse', label: 'True/False', icon: CircleCheckBig, color: 'text-accent-foreground', description: 'Is the statement true?', rounds: 12, timePerRound: 5 },
  { id: 'colormem', label: 'Color Mem', icon: Palette, color: 'text-chart-1', description: 'Remember the color sequence', rounds: 8, timePerRound: 0 },
  { id: 'speedtype', label: 'Speed Type', icon: Keyboard, color: 'text-chart-2', description: 'Type the text as fast as you can', rounds: 6, timePerRound: 15 },
  { id: 'tilematch', label: 'Tile Match', icon: Grid3x3, color: 'text-chart-3', description: 'Match the pairs', rounds: 5, timePerRound: 30 },
  { id: 'scribble', label: 'Scribble', icon: Pencil, color: 'text-chart-5', description: 'Draw what you see described', rounds: 5, timePerRound: 15 },
  { id: 'shapes', label: 'Shape Match', icon: Puzzle, color: 'text-chart-3', description: 'Find the matching shape', rounds: 10, timePerRound: 8 },
  { id: 'wordhunt', label: 'Word Hunt', icon: Type, color: 'text-primary', description: 'Find the hidden word', rounds: 8, timePerRound: 12 },
  { id: 'whack', label: 'Whack Attack', icon: Zap, color: 'text-chart-1', description: 'Whack fast for room points', rounds: 5, timePerRound: 10 },
  { id: 'treasure', label: 'Treasure Pick', icon: Target, color: 'text-chart-3', description: 'Risk it for the jackpot', rounds: 8, timePerRound: 8 },
  { id: 'duel', label: 'Emoji Duel', icon: Users, color: 'text-chart-5', description: 'Beat the room with rock, paper, scissors', rounds: 8, timePerRound: 8 },
];

export function getGameMode(id: string) {
  return gameModes.find(g => g.id === id);
}
