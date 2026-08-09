import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Zap, Swords, Gamepad2, LogIn } from 'lucide-react';
import GameModeGrid from '@/components/GameModeGrid';

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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-[16%] w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-[16%] w-48 h-48 bg-destructive/5 rounded-full blur-3xl" />
      </div>

      <motion.div className="text-center mb-10 relative z-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <motion.div className="inline-block mb-3" animate={{ rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}>
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto">
            <Zap className="w-10 h-10 text-primary-foreground" />
          </div>
        </motion.div>
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight">Reaction<span className="text-primary">Arena</span></h1>
        <p className="text-muted-foreground text-lg mt-2 max-w-md mx-auto">26 game modes. Draw, type, memorize &amp; battle. Fastest brain wins.</p>
      </motion.div>

      <motion.div className="w-full max-w-md relative z-10 space-y-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border-primary/20 hover:border-primary/50 transition-all cursor-pointer group hover:shadow-lg" onClick={() => handleOpen('arena')}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-all group-hover:scale-110">
              <Swords className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Host Arena</h3>
              <p className="text-muted-foreground text-sm">Create a room &amp; invite friends to compete</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-accent/20 hover:border-accent/50 transition-all cursor-pointer group hover:shadow-lg" onClick={() => handleOpen('join')}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-all group-hover:scale-110">
              <LogIn className="w-7 h-7 text-accent-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Join Arena</h3>
              <p className="text-muted-foreground text-sm">Enter a room code to battle friends</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border hover:border-muted-foreground/30 transition-all cursor-pointer group hover:shadow-lg" onClick={() => handleOpen('single')}>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0 group-hover:scale-110 transition-all">
              <Gamepad2 className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">Solo Practice</h3>
              <p className="text-muted-foreground text-xs">Pick a single game mode to play alone</p>
            </div>
          </CardContent>
        </Card>

        <GameModeGrid />
        <p className="text-center text-xs text-muted-foreground">26 game modes · Up to 8 players</p>
      </motion.div>

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
