import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'outline' | 'ghost' | 'secondary';
type Size = 'default' | 'sm' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
        variant === 'default' && 'btn-primary-gradient text-primary-foreground shadow-lg shadow-[hsl(var(--brand-a)/0.3)] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[hsl(var(--brand-a)/0.4)] hover:brightness-110',
        variant === 'secondary' && 'bg-secondary text-secondary-foreground hover:-translate-y-0.5 hover:bg-secondary/80 border border-border/60',
        variant === 'outline' && 'border border-border/80 bg-card/50 backdrop-blur-sm hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/[0.08] hover:text-foreground',
        variant === 'ghost' && 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
        size === 'default' && 'h-10 px-4 py-2',
        size === 'sm' && 'h-9 rounded-lg px-3',
        size === 'lg' && 'h-12 rounded-xl px-8',
        size === 'icon' && 'h-10 w-10',
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';

export { Button };
