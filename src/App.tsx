import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import HomePage from './pages/HomePage';
import GameSelectPage from './pages/GameSelectPage';
import GamePage from './pages/GamePage';
import ResultsPage from './pages/ResultsPage';
import ArenaSetupPage from './pages/ArenaSetupPage';
import LobbyPage from './pages/LobbyPage';
import MultiplayerArenaPage from './pages/MultiplayerArenaPage';
import ArenaResultsPage from './pages/ArenaResultsPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/select" element={<GameSelectPage />} />
          <Route path="/play/:gameId" element={<GamePage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/arena-setup" element={<ArenaSetupPage />} />
          <Route path="/lobby" element={<LobbyPage />} />
          <Route path="/arena" element={<MultiplayerArenaPage />} />
          <Route path="/arena-results" element={<ArenaResultsPage />} />
        </Routes>
        <Toaster />
      </div>
    </BrowserRouter>
  );
}
