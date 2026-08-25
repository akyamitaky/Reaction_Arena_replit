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
      className={cn(
        'h-1.5 w-full cursor-pointer appearance-none rounded-full bg-secondary',
        'accent-primary',
        '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_hsl(var(--primary)/0.2)] [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110',
        '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0',
        className,
      )}
      {...props}
    />
  );
}
