import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { shareResult } from '@/lib/shareCard';
import { play } from '@/lib/sound';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ShareResultButtonProps {
  text: string;
  title?: string;
  label?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
}

export default function ShareResultButton({
  text,
  title,
  label = 'Share result',
  className,
  variant = 'outline',
}: ShareResultButtonProps) {
  const [shared, setShared] = useState(false);

  const handleShare = async () => {
    const mode = await shareResult(text, title);
    setShared(true);
    play('levelup');
    toast.success(mode === 'shared' ? 'Shared!' : 'Result copied to clipboard!');
    setTimeout(() => setShared(false), 2000);
  };

  return (
    <Button variant={variant} className={cn('w-full gap-2', className)} size="lg" onClick={handleShare}>
      {shared ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
      {shared ? 'Copied!' : label}
    </Button>
  );
}
