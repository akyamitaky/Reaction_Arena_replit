import { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value?: number[];
  onValueChange?: (value: number[]) => void;
}

export function Slider({ className, value = [0], onValueChange, ...props }: SliderProps) {
  return (
    <input
      type="range"
      value={value[0]}
      onChange={(event) => onValueChange?.([Number(event.target.value)])}
      className={cn('h-2 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-primary', className)}
      {...props}
    />
  );
}