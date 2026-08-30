import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import AchievementUnlockOverlay from '@/components/AchievementUnlockOverlay';
import OnboardingOverlay from '@/components/OnboardingOverlay';
import AppShell from '@/components/AppShell';
import { track } from '@/lib/analytics';

const HomePage = lazy(() => import('./pages/HomePage'));
const GameSelectPage = lazy(() => import('./pages/GameSelectPage'));
const GamePage = lazy(() => import('./pages/GamePage'));
const ResultsPage = lazy(() => import('./pages/ResultsPage'));
const ArenaSetupPage = lazy(() => import('./pages/ArenaSetupPage'));
const LobbyPage = lazy(() => import('./pages/LobbyPage'));
const MultiplayerArenaPage = lazy(() => import('./pages/MultiplayerArenaPage'));
const ArenaResultsPage = lazy(() => import('./pages/ArenaResultsPage'));
const DailyChallengePage = lazy(() => import('./pages/DailyChallengePage'));
const DailyResultsPage = lazy(() => import('./pages/DailyResultsPage'));
const JoinPage = lazy(() => import('./pages/JoinPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const ChallengePage = lazy(() => import('./pages/ChallengePage'));
const StatsPage = lazy(() => import('./pages/StatsPage'));

function PageFallback() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  useEffect(() => {
    track('page_view', { path: location.pathname });
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      >
        <Suspense fallback={<PageFallback />}>
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route path="/select" element={<GameSelectPage />} />
            <Route path="/play/:gameId" element={<GamePage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/daily" element={<DailyChallengePage />} />
            <Route path="/daily-results" element={<DailyResultsPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/challenge/:code" element={<ChallengePage />} />
            <Route path="/join/:code" element={<JoinPage />} />
            <Route path="/arena-setup" element={<ArenaSetupPage />} />
            <Route path="/lobby" element={<LobbyPage />} />
            <Route path="/arena" element={<MultiplayerArenaPage />} />
            <Route path="/arena-results" element={<ArenaResultsPage />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <AppShell>
          <AnimatedRoutes />
        </AppShell>
        <AchievementUnlockOverlay />
        <OnboardingOverlay />
        <Toaster />
      </BrowserRouter>
    </MotionConfig>
  );
}
