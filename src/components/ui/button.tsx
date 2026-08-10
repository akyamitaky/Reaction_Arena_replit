import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'outline' | 'ghost';
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
        'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
        variant === 'default' && 'bg-primary text-primary-foreground shadow-lg shadow-primary/15 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-primary/25',
        variant === 'outline' && 'border border-border/80 bg-card/60 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/10',
        variant === 'ghost' && 'hover:bg-secondary hover:text-foreground',
        size === 'default' && 'h-10 px-4 py-2',
        size === 'sm' && 'h-9 rounded-md px-3',
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