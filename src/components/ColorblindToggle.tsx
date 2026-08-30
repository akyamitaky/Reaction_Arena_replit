import { useState } from 'react';
import { Contrast } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/storage';
import { applyColorblindMode } from '@/lib/colorblind';

export default function ColorblindToggle() {
  const [on, setOn] = useState(storage.getColorblind());

  const toggle = () => {
    const next = !on;
    setOn(next);
    storage.setColorblind(next);
    applyColorblindMode(next);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={on ? 'Disable colorblind-safe palette' : 'Enable colorblind-safe palette'}
      aria-pressed={on}
      title={on ? 'Colorblind-safe palette on' : 'Colorblind-safe palette off'}
      className={on ? 'text-primary' : undefined}
      onClick={toggle}
    >
      <Contrast className="h-5 w-5" />
    </Button>
  );
}
