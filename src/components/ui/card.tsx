import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'group relative rounded-2xl border border-border/70 bg-card/80 text-card-foreground shadow-xl shadow-black/20 backdrop-blur-md transition-all duration-300 ease-out',
        'hover:border-primary/30 hover:shadow-2xl hover:shadow-black/30 hover:-translate-y-0.5',
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />,
);
CardContent.displayName = 'CardContent';

export { Card, CardContent };
