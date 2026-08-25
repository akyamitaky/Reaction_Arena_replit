import { describe, it, expect } from 'vitest';
import {
  generateSeriesQuestion,
  generateVowelQuestion,
  generateAlphaQuestion,
  generateColorMixQuestion,
  generateClockQuestion,
  generateRomanQuestion,
  generatePalindromeQuestion,
  generateSpellingQuestion,
  countVowels,
  toRoman,
  formatClockTime,
  isPalindrome,
  shuffle,
} from '@/lib/gameQuestions';

/** Run a generator many times to smoke out infinite loops / invalid rounds. */
function stress(generator: () => void, times = 500) {
  for (let i = 0; i < times; i++) generator();
}

describe('generateSeriesQuestion', () => {
  it('always yields 4 unique positive options containing the answer', () => {
    stress(() => {
      const q = generateSeriesQuestion();
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.options).toContain(q.answer);
      for (const o of q.options) expect(o).toBeGreaterThan(0);
    });
  });

  it('keeps the sequence strictly increasing so "next" is well-defined', () => {
    stress(() => {
      const q = generateSeriesQuestion();
      for (let i = 1; i < q.terms.length; i++) {
        expect(q.terms[i]).toBeGreaterThan(q.terms[i - 1]);
      }
    });
  });
});

describe('generateVowelQuestion', () => {
  it('matches the vowel count of the shown word', () => {
    stress(() => {
      const q = generateVowelQuestion();
      expect(q.answer).toBe(countVowels(q.word));
      expect(q.answer).toBeGreaterThanOrEqual(0);
    });
  });

  it('always yields 4 unique non-negative options containing the answer', () => {
    stress(() => {
      const q = generateVowelQuestion();
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.options).toContain(q.answer);
      for (const o of q.options) expect(o).toBeGreaterThanOrEqual(0);
    });
  });

  it('counts only a, e, i, o, u (not y)', () => {
    expect(countVowels('rhythm')).toBe(0);
    expect(countVowels('beautiful')).toBe(5);
    expect(countVowels('queue')).toBe(4);
  });
});

describe('generateAlphaQuestion', () => {
  it('returns the alphabetically-first word as the answer', () => {
    stress(() => {
      const q = generateAlphaQuestion();
      expect(q.words).toHaveLength(4);
      expect(new Set(q.words).size).toBe(4);
      expect(q.answer).toBe([...q.words].sort()[0]);
      expect(q.words).toContain(q.answer);
    });
  });
});

describe('generateColorMixQuestion', () => {
  it('returns a known mix with 4 unique real-color options containing the answer', () => {
    stress(() => {
      const q = generateColorMixQuestion();
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.options).toContain(q.answer);
    });
  });
});

describe('generateClockQuestion', () => {
  it('formats times with a 12-hour clock', () => {
    expect(formatClockTime(0)).toBe('12:00');
    expect(formatClockTime(60)).toBe('1:00');
    expect(formatClockTime(755)).toBe('12:35');
    expect(formatClockTime(3 * 60 + 15)).toBe('3:15');
    expect(formatClockTime(12 * 60 + 45)).toBe('12:45');
  });

  it('always yields 4 unique times containing the answer', () => {
    stress(() => {
      const q = generateClockQuestion();
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.options).toContain(q.answer);
      expect(q.answer).toBe(formatClockTime((q.hours % 12) * 60 + q.minutes));
    });
  });
});

describe('generateRomanQuestion', () => {
  it('converts numbers to Roman numerals', () => {
    expect(toRoman(4)).toBe('IV');
    expect(toRoman(9)).toBe('IX');
    expect(toRoman(14)).toBe('XIV');
    expect(toRoman(40)).toBe('XL');
    expect(toRoman(45)).toBe('XLV');
    expect(toRoman(50)).toBe('L');
  });

  it('always yields 4 unique options containing the answer', () => {
    stress(() => {
      const q = generateRomanQuestion();
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.options).toContain(q.answer);
    });
  });
});

describe('generatePalindromeQuestion', () => {
  it('answers correctly for known palindromes and non-palindromes', () => {
    expect(isPalindrome('racecar')).toBe(true);
    expect(isPalindrome('level')).toBe(true);
    expect(isPalindrome('apple')).toBe(false);
    expect(isPalindrome('guitar')).toBe(false);
  });

  it('labels every word consistently', () => {
    stress(() => {
      const q = generatePalindromeQuestion();
      expect(q.answer).toBe(isPalindrome(q.word) ? 'Yes' : 'No');
    });
  });
});

describe('generateSpellingQuestion', () => {
  it('always yields 4 unique options including the correct spelling', () => {
    stress(() => {
      const q = generateSpellingQuestion();
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.options).toContain(q.word);
    });
  });
});

describe('shuffle', () => {
  it('returns a permutation without mutating the input', () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input);
    expect(out).toHaveLength(input.length);
    expect([...out].sort()).toEqual([...input].sort());
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });
});
