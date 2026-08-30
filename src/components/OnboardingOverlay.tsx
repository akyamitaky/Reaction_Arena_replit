import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Swords, CalendarDays, Medal, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { storage } from '@/lib/storage';
import { useNavigate } from 'react-router-dom';

const STEPS = [
  {
    icon: Gamepad2,
    title: 'Train solo',
    text: 'Pick from 35 brain games — reflexes, memory, focus, math and more.',
    accent: 'text-primary',
    to: '/select',
  },
  {
    icon: Swords,
    title: 'Battle in arenas',
    text: 'Host a room, invite up to 8 friends, and race through random games.',
    accent: 'text-accent',
    to: '/arena-setup',
  },
  {
    icon: CalendarDays,
    title: 'Play the daily',
    text: 'One game, same for everyone. Come back each day to build your streak.',
    accent: 'text-chart-4',
    to: '/daily',
  },
  {
    icon: Medal,
    title: 'Challenge friends',
    text: 'Send a challenge code with a target score and see if they can beat it.',
    accent: 'text-chart-2',
    to: '/select',
  },
];

export default function OnboardingOverlay() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(!storage.getSeenOnboarding());

  const close = (to?: string) => {
    storage.setSeenOnboarding();
    setOpen(false);
    if (to) navigate(to);
  };

  return (
    <Dialog open={open} onOpenChange={o => (o ? undefined : close())}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" /> Welcome to ReactionArena
          </DialogTitle>
          <DialogDescription>Train fast, think sharper. Here's how to get the most out of it.</DialogDescription>
        </DialogHeader>

        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.button
                key={step.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + i * 0.06 }}
                onClick={() => close(step.to)}
                className="flex flex-col items-start gap-2 rounded-2xl border border-border/60 bg-card/60 p-4 text-left transition-colors hover:border-primary/40"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-secondary/60 ${step.accent}`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="font-display text-sm font-bold">{step.title}</span>
                <span className="text-xs leading-relaxed text-muted-foreground">{step.text}</span>
              </motion.button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" size="lg" onClick={() => close('/select')}>
            <Gamepad2 className="h-4 w-4" /> Start playing
          </Button>
          <Button variant="outline" size="lg" onClick={() => close()}>
            Skip for now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
