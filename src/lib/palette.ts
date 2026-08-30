/**
 * Color palette used by color-based games.
 *
 * Values are CSS custom properties so that the colorblind-safe palette
 * (`html[data-colorblind='on']`) swaps the rendered hues without touching
 * any game logic. See index.css for the base + colorblind definitions.
 */
export const ARENA_COLORS = [
  { name: 'Red', css: 'var(--c-red)' },
  { name: 'Blue', css: 'var(--c-blue)' },
  { name: 'Green', css: 'var(--c-green)' },
  { name: 'Yellow', css: 'var(--c-yellow)' },
  { name: 'Purple', css: 'var(--c-purple)' },
  { name: 'Orange', css: 'var(--c-orange)' },
  { name: 'Pink', css: 'var(--c-pink)' },
  { name: 'Cyan', css: 'var(--c-cyan)' },
] as const;

export type ArenaColor = (typeof ARENA_COLORS)[number];
