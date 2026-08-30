// Pure question generators for the game modes. Keeping these free of React
// makes every mode unit-testable and guarantees rounds are always solvable
// (valid options, finite generation loops, bounded values).

export type SeriesKind = 'arith' | 'geo' | 'squares' | 'fib';

export interface SeriesQuestion {
  terms: number[];
  answer: number;
  options: number[];
  hint: string;
}

export function generateSeriesQuestion(): SeriesQuestion {
  const kinds: SeriesKind[] = ['arith', 'geo', 'squares', 'fib'];
  const kind = kinds[Math.floor(Math.random() * kinds.length)];
  let terms: number[] = [];
  let answer = 0;
  let hint = '';

  if (kind === 'arith') {
    const start = Math.floor(Math.random() * 9) + 1;
    const step = Math.floor(Math.random() * 7) + 2;
    terms = Array.from({ length: 5 }, (_, i) => start + step * i);
    answer = terms[4] + step;
    hint = `+${step}`;
  } else if (kind === 'geo') {
    const start = Math.floor(Math.random() * 3) + 2;
    const mul = Math.floor(Math.random() * 2) + 2;
    terms = Array.from({ length: 5 }, (_, i) => start * Math.pow(mul, i));
    answer = terms[4] * mul;
    hint = `×${mul}`;
  } else if (kind === 'squares') {
    const base = Math.floor(Math.random() * 3) + 1;
    terms = Array.from({ length: 5 }, (_, i) => Math.pow(base + i, 2));
    answer = Math.pow(base + 5, 2);
    hint = 'squares';
  } else {
    terms = Math.random() < 0.5 ? [2, 3, 5, 8, 13] : [3, 5, 8, 13, 21];
    answer = terms[4] + terms[3];
    hint = 'fibonacci';
  }

  const options = new Set<number>([answer]);
  let guard = 0;
  while (options.size < 4 && guard++ < 100) {
    const delta = Math.floor(Math.random() * 10) - 4;
    const cand = answer + delta;
    if (cand > 0 && cand !== answer) options.add(cand);
  }
  return { terms, answer, options: [...options].sort(() => Math.random() - 0.5), hint };
}

export interface VowelQuestion {
  word: string;
  answer: number;
  options: number[];
}

const VOWEL_WORDS: Array<[string, number]> = [
  ['beautiful', 5],
  ['education', 5],
  ['outrageous', 6],
  ['queue', 4],
  ['eunoia', 5],
  ['kangaroo', 4],
  ['airplane', 4],
  ['iguana', 4],
  ['elephant', 3],
  ['banana', 3],
  ['unicorn', 3],
  ['tomorrow', 3],
  ['spaghetti', 3],
  ['computer', 3],
  ['apple', 2],
  ['bottle', 2],
  ['zebra', 2],
  ['cactus', 2],
  ['school', 2],
  ['otter', 2],
  ['strength', 1],
  ['python', 1],
  ['mystery', 1],
  ['rhythm', 0],
  ['gym', 0],
];

export function countVowels(word: string): number {
  return (word.match(/[aeiou]/g) || []).length;
}

export function generateVowelQuestion(): VowelQuestion {
  const [word] = VOWEL_WORDS[Math.floor(Math.random() * VOWEL_WORDS.length)];
  const answer = countVowels(word);
  const options = new Set<number>([answer]);
  let guard = 0;
  while (options.size < 4 && guard++ < 100) {
    const delta = Math.floor(Math.random() * 5) - 1;
    const cand = answer + delta;
    if (cand >= 0 && cand !== answer) options.add(cand);
  }
  return { word, answer, options: [...options].sort(() => Math.random() - 0.5) };
}

export interface AlphaQuestion {
  words: string[];
  answer: string;
}

const ALPHA_POOL = [
  'apple',
  'banana',
  'cherry',
  'dragon',
  'ember',
  'falcon',
  'grape',
  'harbor',
  'island',
  'jungle',
  'kitten',
  'lantern',
  'meadow',
  'nectar',
  'orbit',
  'planet',
  'quartz',
  'river',
  'saddle',
  'tiger',
  'umbrella',
  'violet',
  'walnut',
  'yonder',
  'zephyr',
  'breeze',
  'candle',
  'dolphin',
  'forest',
  'garden',
];

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateAlphaQuestion(): AlphaQuestion {
  const words = shuffle(ALPHA_POOL).slice(0, 4);
  const answer = [...words].sort()[0];
  return { words: shuffle(words), answer };
}

export interface ColorMixQuestion {
  a: string;
  b: string;
  answer: string;
  options: string[];
}

export const MIX_COLORS: Record<string, string> = {
  red: 'var(--c-red)',
  blue: 'var(--c-blue)',
  yellow: 'var(--c-yellow)',
  green: 'var(--c-green)',
  purple: 'var(--c-purple)',
  orange: 'var(--c-orange)',
  pink: 'var(--c-pink)',
  gray: 'var(--c-gray)',
  'light blue': 'var(--c-light-blue)',
  white: 'var(--c-white)',
};

const MIXES: Array<[string, string, string]> = [
  ['red', 'blue', 'purple'],
  ['red', 'yellow', 'orange'],
  ['blue', 'yellow', 'green'],
  ['white', 'red', 'pink'],
  ['black', 'white', 'gray'],
  ['white', 'blue', 'light blue'],
];

export function generateColorMixQuestion(): ColorMixQuestion {
  const [a, b, answer] = MIXES[Math.floor(Math.random() * MIXES.length)];
  const pool = Object.keys(MIX_COLORS).filter(c => c !== answer);
  const options = new Set([answer]);
  while (options.size < 4) {
    options.add(pool[Math.floor(Math.random() * pool.length)]);
  }
  return { a, b, answer, options: [...options].sort(() => Math.random() - 0.5) };
}

export interface ClockQuestion {
  hours: number;
  minutes: number;
  answer: string;
  options: string[];
}

export function formatClockTime(totalMin: number): string {
  const t = ((totalMin % 720) + 720) % 720;
  const h = Math.floor(t / 60);
  const m = t % 60;
  const hour = h === 0 ? 12 : h;
  return `${hour}:${String(m).padStart(2, '0')}`;
}

export function generateClockQuestion(): ClockQuestion {
  const hours = Math.floor(Math.random() * 12) + 1;
  const minutes = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
  const total = ((hours % 12) * 60 + minutes) % 720;
  const options = new Set<string>([formatClockTime(total)]);
  let guard = 0;
  while (options.size < 4 && guard++ < 100) {
    const delta = [15, -15, 60, -60, 30, -30][Math.floor(Math.random() * 6)];
    options.add(formatClockTime(total + delta));
  }
  return { hours, minutes, answer: formatClockTime(total), options: [...options].sort(() => Math.random() - 0.5) };
}

export interface RomanQuestion {
  prompt: string;
  answer: string;
  options: string[];
}

const ROMAN: Array<[number, string]> = [
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

export function toRoman(n: number): string {
  let out = '';
  let v = n;
  for (const [value, glyph] of ROMAN) {
    while (v >= value) {
      out += glyph;
      v -= value;
    }
  }
  return out;
}

export function generateRomanQuestion(): RomanQuestion {
  const n = Math.floor(Math.random() * 45) + 4;
  const roman = toRoman(n);
  const askNumber = Math.random() < 0.5;
  const answer = askNumber ? roman : String(n);
  const options = new Set<string>([answer]);
  let guard = 0;
  while (options.size < 4 && guard++ < 100) {
    const delta = (Math.floor(Math.random() * 5) + 1) * (Math.random() < 0.5 ? -1 : 1);
    const cand = n + delta;
    if (cand > 0 && cand <= 50) options.add(askNumber ? toRoman(cand) : String(cand));
  }
  return {
    prompt: askNumber ? `What is ${n} in Roman numerals?` : `What does ${roman} mean as a number?`,
    answer,
    options: [...options].sort(() => Math.random() - 0.5),
  };
}

export interface PalindromeQuestion {
  word: string;
  answer: 'Yes' | 'No';
}

const PALINDROMES = [
  'racecar',
  'level',
  'kayak',
  'civic',
  'radar',
  'madam',
  'refer',
  'rotor',
  'reviver',
  'deified',
  'noon',
];
const NON_PALINDROMES = [
  'apple',
  'banana',
  'computer',
  'guitar',
  'pencil',
  'window',
  'bridge',
  'shadow',
  'castle',
  'dragon',
  'forest',
  'garden',
];

export function isPalindrome(word: string): boolean {
  return word === word.split('').reverse().join('');
}

export function generatePalindromeQuestion(): PalindromeQuestion {
  const isPal = Math.random() < 0.5;
  const pool = isPal ? PALINDROMES : NON_PALINDROMES;
  const word = pool[Math.floor(Math.random() * pool.length)];
  return { word, answer: isPalindrome(word) ? 'Yes' : 'No' };
}

export interface SpellingQuestion {
  word: string;
  options: string[];
}

const SPELLING_PAIRS: Array<[string, string]> = [
  ['necessary', 'neccessary'],
  ['accommodate', 'accomodate'],
  ['definitely', 'definately'],
  ['separate', 'seperate'],
  ['occasion', 'occassion'],
  ['embarrass', 'embarass'],
  ['maintenance', 'maintainance'],
  ['occurrence', 'occurrance'],
  ['privilege', 'priviledge'],
  ['conscience', 'concience'],
  ['rhythm', 'rythm'],
  ['receive', 'recieve'],
  ['believe', 'beleive'],
  ['calendar', 'calender'],
  ['business', 'buisness'],
];

export function generateSpellingQuestion(): SpellingQuestion {
  const idx = Math.floor(Math.random() * SPELLING_PAIRS.length);
  const [correct, wrong] = SPELLING_PAIRS[idx];
  const options = new Set<string>([correct, wrong]);
  let guard = 0;
  while (options.size < 4 && guard++ < 100) {
    const other = SPELLING_PAIRS[Math.floor(Math.random() * SPELLING_PAIRS.length)];
    const pick = Math.random() < 0.5 ? other[0] : other[1];
    if (pick !== correct) options.add(pick);
  }
  return { word: correct, options: shuffle([...options]) };
}
