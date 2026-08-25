import { Suspense } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import GameShell from '@/components/GameShell';
import { getGameMode } from '@/lib/gameConfig';
import { getGameComponent } from '@/lib/gameRegistry';
import { recordDaily } from '@/lib/dailyChallenge';
import { storage } from '@/lib/storage';
import { syncDailyProgress } from '@/lib/profileApi';
import { Loader2 } from 'lucide-react';

export default function GamePage() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const mode = getGameMode(gameId || '');

  if (!mode) {
    navigate('/select');
    return null;
  }

  const GameComponent = getGameComponent(mode.id);
  if (!GameComponent) {
    navigate('/select');
    return null;
  }

  const isDaily = new URLSearchParams(location.search).get('daily') === '1';

  const handleDailyComplete = (score: number) => {
    recordDaily(score);
    const pct = mode.rounds > 0 ? Math.round((score / (mode.rounds * 150)) * 100) : 0;
    storage.recordSoloGame(score, mode.id, pct);
    syncDailyProgress({ name: storage.getPlayerName() || 'Player', score, gameId: mode.id, pct });
    navigate('/daily-results', { state: { score, rounds: mode.rounds, gameId: mode.id, gameName: mode.label } });
  };

  return (
    <GameShell key={mode.id} mode={mode} arena={false} onComplete={isDaily ? handleDailyComplete : undefined}>
      {ctx => (
        <Suspense
          fallback={
            <div className="flex flex-col items-center gap-3 py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading game...</p>
            </div>
          }
        >
          <GameComponent {...ctx} />
        </Suspense>
      )}
    </GameShell>
  );
}
