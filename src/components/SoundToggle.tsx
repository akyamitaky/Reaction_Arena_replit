import { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isSoundEnabled, setSoundEnabled, play } from '@/lib/sound';

export default function SoundToggle() {
  const [enabled, setEnabled] = useState(isSoundEnabled());

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    setSoundEnabled(next);
    if (next) play('click');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={enabled ? 'Mute sounds' : 'Unmute sounds'}
      title={enabled ? 'Mute sounds' : 'Unmute sounds'}
      onClick={toggle}
    >
      {enabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
    </Button>
  );
}
