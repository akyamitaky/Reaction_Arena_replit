import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={() => onOpenChange?.(false)}>
      <div onMouseDown={(event) => event.stopPropagation()}>{children}</div>
    </div>
  );
}

export function DialogContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg', className)} {...props}>{children}</div>;
}

export function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-2 text-center sm:text-left', className)} {...props} />;
}

export function DialogTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-lg font-semibold', className)} {...props} />;
}

export function DialogDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />;
}