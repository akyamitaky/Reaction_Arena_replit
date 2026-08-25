import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  private reset = () => {
    this.setState({ error: null });
    window.location.href = '/';
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-brand-a/[0.12] via-transparent to-brand-c/[0.12] blur-3xl" />
        <div className="relative w-full max-w-md space-y-5 text-center">
          <div className="relative mx-auto h-16 w-16">
            <div className="absolute inset-0 rounded-full bg-destructive/20 blur-xl" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-destructive/30 bg-card/80 text-2xl font-bold text-destructive">
              !
            </div>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Something went wrong</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              An unexpected error occurred. Your progress is saved — reload to continue.
            </p>
          </div>
          <div className="space-y-2">
            <Button className="w-full" size="lg" onClick={this.reset}>
              Reload the app
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
