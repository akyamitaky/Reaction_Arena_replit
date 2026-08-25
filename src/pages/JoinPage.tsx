import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogIn, Loader2, ArrowLeft } from 'lucide-react';
import { storage } from '@/lib/storage';

export default function JoinPage() {
  const { code = '' } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [name, setName] = useState(state?.playerName || storage.getPlayerName() || '');
  const [joining, setJoining] = useState(false);

  const join = () => {
    if (!name.trim() || joining) return;
    storage.setPlayerName(name.trim());
    setJoining(true);
    navigate('/lobby', { state: { joinCode: code, playerName: name.trim() } });
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-brand-a/[0.12] via-transparent to-brand-c/[0.12] blur-3xl" />
      <motion.div
        className="relative w-full max-w-sm space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <div className="space-y-3 rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.1] to-transparent p-6 text-center backdrop-blur-md">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
            <LogIn className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Join an arena</h1>
          <p className="text-sm text-muted-foreground">
            You've been invited with code{' '}
            <span className="font-mono font-bold tracking-widest text-primary">{code}</span>
          </p>
        </div>

        <div className="space-y-3">
          <Input
            placeholder="Your name"
            aria-label="Your name"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && join()}
            autoFocus
          />
          <Button size="lg" className="w-full gap-2" onClick={join} disabled={!name.trim() || joining}>
            {joining ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
            {joining ? 'Joining...' : 'Join Room'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
