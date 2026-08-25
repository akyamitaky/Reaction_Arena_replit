import { createContext, HTMLAttributes, ReactNode, useCallback, useContext, useEffect, useId, useRef } from 'react';
import { cn } from '@/lib/utils';

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

interface DialogContextValue {
  titleId: string;
  descriptionId: string;
}

const DialogContext = createContext<DialogContextValue | null>(null);

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => onOpenChange?.(false), [onOpenChange]);

  // Capture focus, lock scroll, and restore focus when the dialog closes.
  useEffect(() => {
    if (!open) return;
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    if (panel) {
      const initialFocus = panel.querySelector<HTMLElement>('input, textarea, [autofocus], button');
      (initialFocus || panel).focus();
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      lastFocusedRef.current?.focus?.();
    };
  }, [open]);

  // Keyboard handling: Escape to close, Tab to trap focus inside the panel.
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        close();
        return;
      }
      if (event.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(el => el.offsetParent !== null);
      if (focusables.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === panel || !panel.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !panel.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    },
    [close],
  );

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={close}
      role="presentation"
    >
      <div role="presentation" onMouseDown={(event) => event.stopPropagation()}>
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          className="outline-none"
        >
          <DialogContext.Provider value={{ titleId, descriptionId }}>{children}</DialogContext.Provider>
        </div>
      </div>
    </div>
  );
}

function useDialogContext() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('Dialog components must be used within <Dialog>.');
  return ctx;
}

export function DialogContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('w-full max-w-lg rounded-2xl border border-border/70 bg-card/95 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-200', className)} {...props}>
      {children}
    </div>
  );
}

export function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-2 text-center sm:text-left', className)} {...props} />;
}

export function DialogTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  const { titleId } = useDialogContext();
  return <h2 id={titleId} className={cn('font-display text-xl font-bold tracking-tight', className)} {...props} />;
}

export function DialogDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  const { descriptionId } = useDialogContext();
  return <p id={descriptionId} className={cn('text-sm text-muted-foreground', className)} {...props} />;
}
