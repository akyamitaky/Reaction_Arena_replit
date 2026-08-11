import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Zap, Swords, Gamepad2, LogIn, ArrowUpRight, Users, Sparkles } from 'lucide-react';
import GameModeGrid from '@/components/GameModeGrid';
import ThemeToggle from '@/components/ThemeToggle';

type FlowTarget = 'arena' | 'single' | 'join';

export default function HomePage() {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [flowTarget, setFlowTarget] = useState<FlowTarget>('arena');
  const [joinCode, setJoinCode] = useState('');

  const handleOpen = (target: FlowTarget) => {
    setFlowTarget(target);
    setNameDialogOpen(true);
    setJoinCode('');
  };

  const handleGo = () => {
    if (!playerName.trim()) return;
    localStorage.setItem('playerName', playerName.trim());
    if (flowTarget === 'arena') {
      navigate('/arena-setup');
    } else if (flowTarget === 'single') {
      navigate('/select');
    } else if (flowTarget === 'join') {
      if (!joinCode.trim()) return;
      navigate('/lobby', { state: { joinCode: joinCode.trim().toUpperCase(), playerName: playerName.trim() } });
    }
  };

  return (
    <div className="min-h-[100dvh] px-4 py-5 sm:px-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-[16%] w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-[16%] w-48 h-48 bg-destructive/5 rounded-full blur-3xl" />
      </div>

      <header className="max-w-6xl mx-auto flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20"><Zap className="w-5 h-5 text-primary-foreground" /></div>
          <div><p className="font-display font-bold tracking-tight">Reaction<span className="text-primary">Arena</span></p><p className="text-[10px] uppercase tracking-[.22em] text-muted-foreground">Fast mind / sharp edge</p></div>
        </div>
        <ThemeToggle />
      </header>

      <main className="max-w-6xl mx-auto grid lg:grid-cols-[1.05fr_.95fr] gap-10 lg:gap-20 items-center pt-14 sm:pt-20 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary mb-6"><Sparkles className="w-3.5 h-3.5" /> Your daily competitive ritual</div>
          <h1 className="text-5xl sm:text-7xl font-bold tracking-[-.06em] leading-[.96] max-w-xl">Train fast.<br /><span className="text-primary">Think sharper.</span></h1>
          <p className="text-muted-foreground text-lg mt-6 max-w-lg leading-relaxed">A focused arena for quick minds. Pick a mode, challenge your friends, and make every reaction count.</p>
          <div className="flex flex-wrap gap-3 mt-8 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-primary" />26 precision modes</span>
            <span className="flex items-center gap-2"><Users className="w-4 h-4 text-accent" />Up to 8 players</span>
          </div>
        </motion.div>
        <motion.div className="space-y-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .15 }}>
        <Card className="border-primary/30 hover:border-primary/70 cursor-pointer group" onClick={() => handleOpen('arena')}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-all group-hover:scale-110">
              <Swords className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">Host Arena</h3>
              <p className="text-muted-foreground text-sm">Create a room &amp; invite friends to compete</p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-primary group-hover:translate-x-1 group-hover:-translate-y-1" />
          </CardContent>
        </Card>

        <Card className="border-accent/30 hover:border-accent/70 cursor-pointer group" onClick={() => handleOpen('join')}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-all group-hover:scale-110">
              <LogIn className="w-7 h-7 text-accent-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">Join Arena</h3>
              <p className="text-muted-foreground text-sm">Enter a room code to battle friends</p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-accent group-hover:translate-x-1 group-hover:-translate-y-1" />
          </CardContent>
        </Card>

        <Card className="border-border hover:border-primary/40 cursor-pointer group" onClick={() => handleOpen('single')}>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0 group-hover:scale-110 transition-all">
              <Gamepad2 className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Solo Practice</h3>
              <p className="text-muted-foreground text-xs">Pick a single game mode to play alone</p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 group-hover:-translate-y-1" />
          </CardContent>
        </Card>

        <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-secondary/30 px-5 py-4 mt-5"><div><p className="text-xs uppercase tracking-widest text-muted-foreground">Momentum</p><p className="font-display font-bold mt-1">Build your streak</p></div><div className="text-right"><p className="text-2xl font-display font-bold text-primary">26</p><p className="text-[11px] text-muted-foreground">ways to play</p></div></div>
        <GameModeGrid />
        </motion.div>
      </main>

      <Dialog open={nameDialogOpen} onOpenChange={setNameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{flowTarget === 'join' ? 'Join an Arena' : flowTarget === 'arena' ? 'Host an Arena' : 'Solo Practice'}</DialogTitle>
            <DialogDescription>
              {flowTarget === 'join' ? 'Enter your name and the room code' : 'Enter your player name to get started'}
            </DialogDescription>
          </DialogHeader>
          <Input placeholder="Your name" value={playerName} onChange={e => setPlayerName(e.target.value)} autoFocus />
          {flowTarget === 'join' && (
            <Input
              placeholder="Room code (e.g. AB3XY)"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              maxLength={5}
              className="text-center text-2xl font-mono tracking-[0.3em] uppercase"
              onKeyDown={e => e.key === 'Enter' && handleGo()}
            />
          )}
          <Button
            onClick={handleGo}
            disabled={!playerName.trim() || (flowTarget === 'join' && !joinCode.trim())}
            className="w-full"
          >
            {flowTarget === 'join' ? 'Join Room' : flowTarget === 'arena' ? "Let's Go!" : 'Start Playing'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
