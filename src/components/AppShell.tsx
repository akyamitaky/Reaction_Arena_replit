import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Swords, Gamepad2, LayoutDashboard, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import SoundToggle from '@/components/SoundToggle';

const NAV_LINKS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/select', label: 'Games', icon: Gamepad2, end: false },
  { to: '/arena-setup', label: 'Arena', icon: Swords, end: false },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy, end: false },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const hideNav =
    pathname === '/play' ||
    pathname.startsWith('/play/') ||
    pathname === '/arena' ||
    pathname === '/lobby' ||
    pathname === '/arena-results' ||
    pathname === '/results' ||
    pathname === '/daily-results';

  return (
    <div className="relative flex min-h-[100dvh] flex-col">
      <div className="pointer-events-none fixed inset-0 z-0 bg-grid opacity-70" />
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-80 bg-gradient-to-b from-brand-a/[0.07] to-transparent" />

      {!hideNav && (
        <header className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link to="/" className="transition-opacity hover:opacity-80">
              <Logo />
            </Link>

            <nav className="hidden items-center gap-1 rounded-full border border-border/60 bg-card/50 p-1 backdrop-blur-md md:flex">
              {NAV_LINKS.map(link => {
                const active = link.end ? pathname === link.to : pathname.startsWith(link.to);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={cn(
                      'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300',
                      active
                        ? 'bg-primary/10 text-primary shadow-sm'
                        : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <SoundToggle />
              <ThemeToggle />
            </div>
          </div>
        </header>
      )}

      <main className="relative z-10 flex-1">{children}</main>

      {!hideNav && (
        <footer className="relative z-10 border-t border-border/50 py-6">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
            <p>ReactionArena — train fast, think sharper.</p>
            <p>35 modes · Up to 8 players per arena</p>
          </div>
        </footer>
      )}
    </div>
  );
}
